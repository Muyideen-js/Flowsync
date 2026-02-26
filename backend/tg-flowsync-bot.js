/**
 * tg-flowsync-bot.js — Singleton FlowSync Telegram bot
 *
 * Uses TELEGRAM_BOT_TOKEN from .env. One instance shared across ALL users.
 * Routes incoming messages to the correct user via Firestore mapping:
 *   flowsync_bot_users/{chatId} → { uid, linkedAt }
 *
 * States: idle → connecting → ready | error
 */

const axios = require('axios');
const store = require('./firestore');
const autoReply = require('./tg-auto-reply');

const BOT_ID = 'flowsync';

class FlowSyncBot {
    constructor() {
        this.token = null;
        this.io = null;
        this.state = 'idle';
        this.botInfo = null;
        this.pollingInterval = null;
        this.lastUpdateId = 0;
        this._userCache = new Map(); // chatId → uid (in-memory cache)
    }

    /** Initialize and start polling */
    async start(io) {
        this.io = io;
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        if (!this.token) {
            console.warn('[FlowSync Bot] No TELEGRAM_BOT_TOKEN in env — skipping');
            return false;
        }

        try {
            this.state = 'connecting';
            const res = await axios.get(
                `https://api.telegram.org/bot${this.token}/getMe`,
                { timeout: 10000 }
            );
            if (!res.data?.ok) throw new Error('Invalid FlowSync bot token');
            this.botInfo = res.data.result;
            console.log(`[FlowSync Bot] ✅ @${this.botInfo.username} ready`);
        } catch (err) {
            console.error('[FlowSync Bot] ❌ Failed to start:', err.message);
            this.state = 'error';
            return false;
        }

        // Restore lastUpdateId from a global config doc
        try {
            const cfg = await store.getConnection('__global__', 'flowsync_bot');
            if (cfg?.lastUpdateId) this.lastUpdateId = cfg.lastUpdateId;
        } catch (_) { }

        this._startPolling();
        this.state = 'ready';
        return true;
    }

    get username() { return this.botInfo?.username || ''; }
    isReady() { return this.state === 'ready'; }

    /** Link a user to this bot (called when user emits connect_flowsync_bot) */
    async linkUser(uid, tgChatId) {
        if (!tgChatId) return;
        const chatIdStr = String(tgChatId);
        this._userCache.set(chatIdStr, uid);

        // Store in Firestore global mapping
        if (store.db) {
            await store.db.collection('flowsync_bot_users').doc(chatIdStr).set({
                uid,
                linkedAt: new Date().toISOString(),
            }, { merge: true });
        }

        // Store per-user connection
        await store.setConnection(uid, 'telegram_flowsync', {
            botId: BOT_ID,
            botUsername: this.botInfo?.username,
            state: 'ready',
            autoReply: false,
            linkedAt: new Date().toISOString(),
        });
    }

    /** Unlink a user */
    async unlinkUser(uid) {
        // Find the chatId for this uid
        for (const [chatId, storedUid] of this._userCache.entries()) {
            if (storedUid === uid) {
                this._userCache.delete(chatId);
                if (store.db) {
                    await store.db.collection('flowsync_bot_users').doc(chatId).delete();
                }
                break;
            }
        }
        await store.deleteConnection(uid, 'telegram_flowsync');
    }

    /** Get the UID that owns a chat */
    async _getOwner(chatId) {
        const chatIdStr = String(chatId);
        if (this._userCache.has(chatIdStr)) return this._userCache.get(chatIdStr);

        // Lookup in Firestore
        if (!store.db) return null;
        try {
            const doc = await store.db.collection('flowsync_bot_users').doc(chatIdStr).get();
            if (doc.exists) {
                const uid = doc.data().uid;
                this._userCache.set(chatIdStr, uid);
                return uid;
            }
        } catch (_) { }
        return null;
    }

    /** Send a message via the FlowSync bot */
    async sendMessage(chatId, text) {
        if (!this.token) throw new Error('FlowSync bot not started');
        await axios.post(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            { chat_id: chatId, text },
            { timeout: 10000 }
        );
    }

    // ── Polling ──────────────────────────────────────────────

    _startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => this._poll(), 2500);
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
                await this._handleUpdate(upd);
            }

            if (updatedOffset) {
                await store.setConnection('__global__', 'flowsync_bot', {
                    lastUpdateId: this.lastUpdateId,
                });
            }
        } catch (_) { }
    }

    async _handleUpdate(upd) {
        const msg = upd.message || upd.channel_post;
        if (!msg) return;

        const chatId = String(msg.chat.id);
        const uid = await this._getOwner(chatId);

        // Handle /start — if no owner, this chat is unlinked (we'll store the chatId for later linking)
        if (msg.text === '/start') {
            if (!uid) {
                // Send a welcome but can't route yet — user needs to link from FlowSync
                await this.sendMessage(chatId,
                    `👋 Welcome to FlowSync Bot!\n\nTo link this chat to your FlowSync account, go to your FlowSync dashboard → Accounts → Telegram → Connect FlowSync Bot.\n\nYour Chat ID: ${chatId}`
                );
            } else {
                await this.sendMessage(chatId, `✅ You're already linked to FlowSync! Send me any message and I'll route it to your inbox.`);
            }
            return;
        }

        if (!uid) return; // Can't route — no owner

        const name = msg.from?.first_name
            ? `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`
            : msg.chat.title || chatId;
        const avatar = (msg.from?.first_name || msg.chat.title || '?').substring(0, 2).toUpperCase();
        const time = new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const threadId = `telegram:${BOT_ID}:${chatId}`;

        // Save to Firestore
        await store.saveThread(uid, threadId, {
            platform: 'telegram',
            botId: BOT_ID,
            telegramChatId: chatId,
            name,
            avatar,
        });
        await store.saveMessage(uid, threadId, {
            id: `tg_msg_${upd.update_id}`,
            text: msg.text || '(media)',
            time,
            incoming: true,
        });

        // Emit to user's socket room
        if (this.io) {
            this.io.to(uid).emit('telegram_incoming_message', {
                chatId: threadId,
                telegramChatId: chatId,
                platform: 'telegram',
                botId: BOT_ID,
                name,
                avatar,
                text: msg.text || '(media)',
                time,
                incoming: true,
            });
        }

        // Auto-reply check
        try {
            const conn = await store.getConnection(uid, 'telegram_flowsync');
            if (conn?.autoReply && msg.text) {
                const reply = await autoReply.generateReply(uid, threadId, msg.text, name);
                if (reply) {
                    await this.sendMessage(chatId, reply);
                    await store.saveMessage(uid, threadId, {
                        text: reply,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        incoming: false,
                    });
                    if (this.io) {
                        this.io.to(uid).emit('telegram_incoming_message', {
                            chatId: threadId,
                            telegramChatId: chatId,
                            platform: 'telegram',
                            botId: BOT_ID,
                            name: 'FlowSync Bot',
                            text: reply,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            incoming: false,
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('[FlowSync Bot] Auto-reply error:', e.message);
        }
    }
}

const bot = new FlowSyncBot();
module.exports = bot;
