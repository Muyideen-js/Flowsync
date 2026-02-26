/**
 * tg-registry.js — Per-user PERSONAL Telegram bot registry
 *
 * Each user provides their OWN bot token (BYOB).
 * Thread IDs: telegram:personal_{botUsername}:{chatId}
 * Connection key: telegram_personal
 *
 * State per user:  idle → connecting → ready | error
 */

const axios = require('axios');
const store = require('./firestore');
const autoReply = require('./tg-auto-reply');

class UserTGManager {
    constructor(userId, io) {
        this.userId = userId;
        this.io = io;
        this.token = null;
        this.state = 'idle';
        this.pollingInterval = null;
        this.lastUpdateId = 0;
        this.botInfo = null;
        this.botId = null; // personal_{username}
    }

    _emit(event, data) {
        this.io.to(this.userId).emit(event, data);
    }

    _setState(state) {
        this.state = state;
        this._emit('tg_state', { state, botId: this.botId });
        console.log(`[TG:${this.userId.substring(0, 8)}:${this.botId || '?'}] → ${state}`);
    }

    isReady() { return this.state === 'ready'; }

    /**
     * Restore from Firestore — called on server start or socket reconnect
     */
    async restoreFromFirestore() {
        const conn = await store.getConnection(this.userId, 'telegram_personal');
        if (!conn?.botToken) return false;

        console.log(`[TG:${this.userId.substring(0, 8)}] Restoring personal bot...`);
        this.token = conn.botToken;
        this.lastUpdateId = conn.lastUpdateId || 0;

        return this.start();
    }

    /** Start a bot with the given token */
    async start(token) {
        if (token) this.token = token;

        if (!this.token) {
            this._setState('error');
            this._emit('tg_error', { error: 'No bot token provided' });
            return false;
        }

        // If already ready with same token, re-emit state
        if (this.state === 'ready' && this.pollingInterval) {
            this._emit('tg_connected', {
                username: this.botInfo?.username,
                firstName: this.botInfo?.first_name,
                botId: this.botId,
                type: 'personal',
            });
            return true;
        }

        // Validate token
        try {
            this._setState('connecting');
            const res = await axios.get(
                `https://api.telegram.org/bot${this.token}/getMe`,
                { timeout: 10000 }
            );
            if (!res.data?.ok) throw new Error('Invalid bot token');
            this.botInfo = res.data.result;
            this.botId = `personal_${this.botInfo.username}`;
            console.log(`[TG:${this.userId.substring(0, 8)}] Personal bot: @${this.botInfo.username}`);
        } catch (err) {
            console.error(`[TG:${this.userId.substring(0, 8)}] Failed:`, err.message);
            this._setState('error');
            this._emit('tg_error', { error: err.message });
            return false;
        }

        // Persist connection
        await store.setConnection(this.userId, 'telegram_personal', {
            botToken: this.token,
            botId: this.botId,
            botUsername: this.botInfo.username,
            botFirstName: this.botInfo.first_name,
            lastUpdateId: this.lastUpdateId,
            state: 'ready',
            autoReply: false,
            connectedAt: new Date().toISOString(),
        });

        this._startPolling();
        this._setState('ready');
        this._emit('tg_connected', {
            username: this.botInfo.username,
            firstName: this.botInfo.first_name,
            botId: this.botId,
            type: 'personal',
        });
        return true;
    }

    _startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => this._poll(), 2000);
    }

    async _poll() {
        if (!this.token) return;
        try {
            const res = await axios.get(
                `https://api.telegram.org/bot${this.token}/getUpdates`,
                {
                    params: { offset: this.lastUpdateId + 1, limit: 20, timeout: 1 },
                    timeout: 8000,
                }
            );
            const updates = res.data?.result || [];
            let updatedOffset = false;

            for (const upd of updates) {
                if (upd.update_id > this.lastUpdateId) {
                    this.lastUpdateId = upd.update_id;
                    updatedOffset = true;
                }
                const msg = upd.message || upd.channel_post;
                if (!msg?.text) continue;

                const chatId = String(msg.chat.id);
                const threadId = `telegram:${this.botId}:${chatId}`;
                const name = msg.from?.first_name
                    ? `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`
                    : msg.chat.title || chatId;
                const avatar = (msg.from?.first_name || msg.chat.title || '?').substring(0, 2).toUpperCase();
                const time = new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Save to Firestore
                await store.saveThread(this.userId, threadId, {
                    platform: 'telegram',
                    botId: this.botId,
                    telegramChatId: chatId,
                    name,
                    avatar,
                });
                await store.saveMessage(this.userId, threadId, {
                    id: `tg_msg_${upd.update_id}`,
                    text: msg.text,
                    time,
                    incoming: true,
                });

                // Emit to socket
                this._emit('telegram_incoming_message', {
                    chatId: threadId,
                    telegramChatId: chatId,
                    platform: 'telegram',
                    botId: this.botId,
                    name,
                    avatar,
                    text: msg.text,
                    time,
                    incoming: true,
                });

                // Auto-reply
                try {
                    const conn = await store.getConnection(this.userId, 'telegram_personal');
                    if (conn?.autoReply && msg.text) {
                        const reply = await autoReply.generateReply(this.userId, threadId, msg.text, name);
                        if (reply) {
                            await this.sendMessage(chatId, reply);
                            this._emit('telegram_incoming_message', {
                                chatId: threadId,
                                telegramChatId: chatId,
                                platform: 'telegram',
                                botId: this.botId,
                                name: `@${this.botInfo.username}`,
                                text: reply,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                incoming: false,
                            });
                        }
                    }
                } catch (e) {
                    console.warn(`[TG:${this.userId.substring(0, 8)}] Auto-reply error:`, e.message);
                }
            }

            if (updatedOffset) {
                await store.setConnection(this.userId, 'telegram_personal', {
                    lastUpdateId: this.lastUpdateId,
                });
            }
        } catch (_) { }
    }

    /** Fetch threads from Firestore */
    async fetchHistory(botId) {
        const threads = await store.getInbox(this.userId, 'telegram');
        return threads.filter(t => t.botId === (botId || this.botId));
    }

    /** Send a message */
    async sendMessage(telegramChatId, text) {
        if (!this.token) throw new Error('Telegram bot not connected');
        await axios.post(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            { chat_id: telegramChatId, text },
            { timeout: 10000 }
        );

        const threadId = `telegram:${this.botId}:${telegramChatId}`;
        await store.saveMessage(this.userId, threadId, {
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            incoming: false,
        });
    }

    /** Stop the bot */
    async stop() {
        if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
        this.token = null;
        this.botInfo = null;
        this.botId = null;
        this._setState('idle');
        await store.deleteConnection(this.userId, 'telegram_personal');
    }
}

/* ── Registry ─────────────────────────────────────────────── */
class TGRegistry {
    constructor() {
        this._managers = new Map();
        this.io = null;
    }

    setIO(io) { this.io = io; }

    get(userId) {
        if (!this._managers.has(userId)) {
            this._managers.set(userId, new UserTGManager(userId, this.io));
        }
        return this._managers.get(userId);
    }

    async reset(userId) {
        const mgr = this._managers.get(userId);
        if (mgr) { await mgr.stop(); this._managers.delete(userId); }
    }
}

const tgRegistry = new TGRegistry();
module.exports = tgRegistry;
