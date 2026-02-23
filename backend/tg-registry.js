/**
 * tg-registry.js — Per-user Telegram bot registry
 *
 * Each user provides their OWN bot token.
 * The registry creates an isolated polling bot instance per user.
 * Incoming messages → emitted privately via io.to(userId).emit()
 *
 * State per user:  idle → connecting → ready | error
 */

const axios = require('axios');

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

    /** Start a bot with the given token */
    async start(token) {
        if (token) this.token = token; // update token if provided

        if (!this.token) {
            this._setState('error');
            this._emit('tg_error', { error: 'No bot token provided' });
            return false;
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
        // Poll every 2 seconds for new updates
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
            for (const upd of updates) {
                if (upd.update_id > this.lastUpdateId) {
                    this.lastUpdateId = upd.update_id;
                }
                const msg = upd.message || upd.channel_post;
                if (!msg?.text) continue;

                const chatId = String(msg.chat.id);
                this._emit('telegram_incoming_message', {
                    chatId: `tg_${chatId}`,
                    telegramChatId: chatId,
                    platform: 'telegram',
                    name: msg.from?.first_name
                        ? `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`
                        : msg.chat.title || chatId,
                    avatar: (msg.from?.first_name || msg.chat.title || '?').substring(0, 2).toUpperCase(),
                    text: msg.text,
                    time: new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    incoming: true,
                });
            }
        } catch (_) {
            // Silent — polling errors are transient
        }
    }

    /** Fetch last N messages as threads */
    async fetchHistory(limit = 30) {
        if (!this.token) return [];
        try {
            const res = await axios.get(
                `https://api.telegram.org/bot${this.token}/getUpdates`,
                { params: { limit, offset: -limit }, timeout: 12000 }
            );
            const updates = res.data?.result || [];

            // Update lastUpdateId so we don't re-emit these as new messages
            for (const upd of updates) {
                if (upd.update_id > this.lastUpdateId) this.lastUpdateId = upd.update_id;
            }

            const chatMap = {};
            for (const upd of updates) {
                const msg = upd.message || upd.channel_post;
                if (!msg) continue;
                const cid = String(msg.chat.id);
                if (!chatMap[cid]) {
                    chatMap[cid] = {
                        id: `tg_${cid}`, platform: 'telegram', telegramChatId: cid,
                        name: msg.chat.first_name
                            ? `${msg.chat.first_name}${msg.chat.last_name ? ' ' + msg.chat.last_name : ''}`
                            : msg.chat.title || msg.chat.username || cid,
                        avatar: (msg.chat.first_name || msg.chat.title || 'T').substring(0, 2).toUpperCase(),
                        intent: 'general', vip: false, tags: [],
                        messages: [], unread: false, flagged: false,
                    };
                }
                chatMap[cid].messages.push({
                    text: msg.text || '(media)',
                    time: new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    incoming: true,
                });
            }
            return Object.values(chatMap);
        } catch (err) {
            console.error(`[TG:${this.userId.substring(0, 8)}] fetchHistory error:`, err.message);
            return [];
        }
    }

    /** Send a message */
    async sendMessage(telegramChatId, text) {
        if (!this.token) throw new Error('Telegram bot not connected');
        await axios.post(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            { chat_id: telegramChatId, text },
            { timeout: 10000 }
        );
    }

    /** Stop the bot */
    stop() {
        if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
        this.token = null;
        this.botInfo = null;
        this._setState('idle');
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
        if (mgr) { mgr.stop(); this._managers.delete(userId); }
    }
}

const tgRegistry = new TGRegistry();
module.exports = tgRegistry;
