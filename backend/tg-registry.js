/**
 * tg-registry.js — Per-user Telegram bot registry with Firestore persistence
 *
 * Each user provides their OWN bot token.
 * Tokens and lastUpdateId are persisted in Firestore so bots auto-restore on restart.
 * Incoming messages → saved to Firestore, then emitted via io.to(userId).emit()
 *
 * State per user:  idle → connecting → ready | error
 */

const axios = require('axios');
const store = require('./firestore');

class UserTGManager {
    constructor(userId, io) {
        this.userId = userId;
        this.io = io;
        this.token = null;
        this.state = 'idle';
        this.pollingInterval = null;
        this.lastUpdateId = 0;
        this.botInfo = null;
    }

    _emit(event, data) {
        this.io.to(this.userId).emit(event, data);
    }

    _setState(state) {
        this.state = state;
        this._emit('tg_state', { state });
        console.log(`[TG:${this.userId.substring(0, 8)}] → ${state}`);
    }

    isReady() { return this.state === 'ready'; }

    /**
     * Restore from Firestore — called on server start or socket reconnect
     * Returns true if successfully restored and polling started
     */
    async restoreFromFirestore() {
        const conn = await store.getConnection(this.userId, 'telegram');
        if (!conn?.botToken) return false;

        console.log(`[TG:${this.userId.substring(0, 8)}] Restoring from Firestore...`);
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

        // If already ready with same token, just re-emit state
        if (this.state === 'ready' && this.pollingInterval) {
            this._emit('tg_connected', {
                username: this.botInfo?.username,
                firstName: this.botInfo?.first_name,
            });
            return true;
        }

        // Validate token by calling getMe
        try {
            this._setState('connecting');
            const res = await axios.get(
                `https://api.telegram.org/bot${this.token}/getMe`,
                { timeout: 10000 }
            );
            if (!res.data?.ok) throw new Error('Invalid bot token');
            this.botInfo = res.data.result;
            console.log(`[TG:${this.userId.substring(0, 8)}] Bot: @${this.botInfo.username}`);
        } catch (err) {
            console.error(`[TG:${this.userId.substring(0, 8)}] Failed:`, err.message);
            this._setState('error');
            this._emit('tg_error', { error: err.message });
            return false;
        }

        // Persist connection to Firestore
        await store.setConnection(this.userId, 'telegram', {
            botToken: this.token,
            botUsername: this.botInfo.username,
            botFirstName: this.botInfo.first_name,
            lastUpdateId: this.lastUpdateId,
            state: 'ready',
            connectedAt: new Date().toISOString(),
        });

        // Start long-polling
        this._startPolling();
        this._setState('ready');
        this._emit('tg_connected', {
            username: this.botInfo.username,
            firstName: this.botInfo.first_name,
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
                const threadId = `tg_${chatId}`;
                const name = msg.from?.first_name
                    ? `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`
                    : msg.chat.title || chatId;
                const avatar = (msg.from?.first_name || msg.chat.title || '?').substring(0, 2).toUpperCase();
                const time = new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Save to Firestore FIRST
                await store.saveThread(this.userId, threadId, {
                    platform: 'telegram',
                    telegramChatId: chatId,
                    name,
                    avatar,
                    intent: 'general',
                    vip: false,
                    tags: [],
                    flagged: false,
                });
                await store.saveMessage(this.userId, threadId, {
                    id: `tg_msg_${upd.update_id}`,
                    text: msg.text,
                    time,
                    incoming: true,
                });

                // THEN emit to socket
                this._emit('telegram_incoming_message', {
                    chatId: threadId,
                    telegramChatId: chatId,
                    platform: 'telegram',
                    name,
                    avatar,
                    text: msg.text,
                    time,
                    incoming: true,
                });
            }

            // Persist lastUpdateId so we don't re-fetch on restart
            if (updatedOffset) {
                await store.setConnection(this.userId, 'telegram', {
                    lastUpdateId: this.lastUpdateId,
                });
            }
        } catch (_) {
            // Silent — polling errors are transient
        }
    }

    /** Fetch threads from Firestore (fast, cached) */
    async fetchHistory() {
        const threads = await store.getInbox(this.userId, 'telegram');
        return threads;
    }

    /** Send a message */
    async sendMessage(telegramChatId, text) {
        if (!this.token) throw new Error('Telegram bot not connected');
        await axios.post(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            { chat_id: telegramChatId, text },
            { timeout: 10000 }
        );

        // Save outgoing message to Firestore
        const threadId = `tg_${telegramChatId}`;
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
        this._setState('idle');

        // Update Firestore
        await store.deleteConnection(this.userId, 'telegram');
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
