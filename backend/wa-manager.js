/**
 * wa-manager.js — Production-grade WhatsApp singleton manager
 *
 * State machine:  idle → restoring → qr → authenticated → syncing → ready → error
 *
 * Guarantees:
 *  - Only ONE Puppeteer instance ever runs at a time
 *  - QR is cached and re-sent to any new socket that connects
 *  - Auth timeout is caught without crashing the process
 *  - Session is restored on restart without a new QR if session exists
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const EventEmitter = require('events');

class WAManager extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.state = 'idle';
        this.lastQr = null;
        this.isInitializing = false;
        this.dataPath = path.join(__dirname, '.wwebjs_auth');
    }

    /** Find system Chrome executable (Windows / Mac / Linux) */
    _findChrome() {
        const fs = require('fs');
        const candidates = [
            // Windows
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
            // macOS
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            // Linux
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
        ].filter(Boolean);

        for (const p of candidates) {
            try { if (fs.existsSync(p)) return p; } catch (_) { }
        }
        // Fall back to letting Puppeteer find it automatically
        return undefined;
    }

    /* ── Internal: set state and broadcast ── */
    _setState(state) {
        this.state = state;
        this.emit('state', state);
        console.log(`[WA] State → ${state}`);
    }

    _clearClientState() {
        this.isInitializing = false;
        this.lastQr = null;
    }

    /* ── Public API ─────────────────────────────────────────── */

    isReady() { return this.state === 'ready'; }
    getState() { return this.state; }
    getLastQr() { return this.lastQr; }

    /** Start WhatsApp connection. Idempotent — safe to call multiple times. */
    async start() {
        if (this.isInitializing || this.client) {
            // Already running — just re-emit current state so the caller gets something
            this.emit('state', this.state);
            if (this.lastQr) this.emit('qr', this.lastQr);
            if (this.state === 'ready') this.emit('ready');
            return;
        }

        this.isInitializing = true;
        this._setState('restoring');

        this.client = new Client({
            authStrategy: new LocalAuth({ dataPath: this.dataPath }),
            puppeteer: {
                headless: true,
                // Use system Chrome so we don't depend on Puppeteer's own download
                executablePath: this._findChrome(),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--mute-audio',
                    '--disable-translate',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--safebrowsing-disable-auto-update',
                ],
            },
        });

        this.client.on('qr', (qr) => {
            console.log('[WA] QR generated');
            this.lastQr = qr;
            this._setState('qr');
            this.emit('qr', qr);
        });

        this.client.on('authenticated', () => {
            console.log('[WA] Authenticated — syncing session');
            this.lastQr = null;
            this._setState('authenticated');
        });

        this.client.on('ready', () => {
            console.log('[WA] Ready! 🎉');
            this.isInitializing = false;
            this._setState('ready');
            this.emit('ready');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WA] Auth failure:', msg);
            this._clearClientState();
            this._setState('error');
            this.emit('auth_failure', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.warn('[WA] Disconnected:', reason);
            this.client = null;
            this._clearClientState();
            this._setState('idle');
            this.emit('disconnected', reason);
        });

        this.client.on('message_create', async (msg) => {
            try {
                const chat = await msg.getChat();
                const contact = await msg.getContact();
                this.emit('message', {
                    id: msg.id.id,
                    text: msg.body,
                    from: contact.number,
                    name: contact.name || contact.pushname || contact.number,
                    incoming: !msg.fromMe,
                    time: new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    chatId: chat.id._serialized,
                });
            } catch (e) {
                console.warn('[WA] message_create error:', e.message);
            }
        });

        try {
            await this.client.initialize();
        } catch (err) {
            console.error('[WA] initialize() failed:', err.message);
            this.client = null;
            this._clearClientState();
            this._setState('error');
        }
    }

    /** Gracefully destroy the session */
    async reset() {
        console.log('[WA] Resetting...');
        try { if (this.client) await this.client.destroy(); } catch (_) { }
        this.client = null;
        this._clearClientState();
        this._setState('idle');
    }

    /** Send a message (throws if not ready) */
    async sendMessage(chatId, text) {
        if (!this.client || this.state !== 'ready') {
            throw new Error('WhatsApp not ready');
        }
        return this.client.sendMessage(chatId, text);
    }

    /** Fetch and normalize recent chats */
    async fetchChats(socket, limit = 25) {
        if (!this.client || this.state !== 'ready') {
            throw new Error('WhatsApp not ready');
        }

        const chats = await this.client.getChats();
        const total = Math.min(chats.length, limit);
        socket.emit('whatsapp_loading_progress', { current: 0, total, message: `Loading ${total} chats…` });

        const threads = [];
        for (let i = 0; i < total; i++) {
            const chat = chats[i];
            try {
                const [messages, contact] = await Promise.all([
                    chat.fetchMessages({ limit: 10 }),
                    this.client.getContactById(chat.id._serialized),
                ]);
                const name = contact.name || contact.pushname || chat.name || chat.id.user;
                threads.push({
                    id: chat.id._serialized,
                    platform: 'whatsapp',
                    name,
                    avatar: name.substring(0, 2).toUpperCase(),
                    intent: 'general',
                    vip: false,
                    tags: [],
                    unread: chat.unreadCount > 0,
                    flagged: false,
                    messages: messages.map(m => ({
                        text: m.body || '(media)',
                        time: new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        incoming: !m.fromMe,
                    })),
                });
                socket.emit('whatsapp_loading_progress', { current: i + 1, total, message: `Loaded chat ${i + 1}/${total}…` });
            } catch (e) {
                console.warn(`[WA] Skipped chat ${i}:`, e.message);
            }
        }
        return threads;
    }
}

// Singleton
const waManager = new WAManager();

// Catch auth timeout unhandled rejection
process.on('unhandledRejection', (reason) => {
    const msg = (reason?.message || String(reason));
    if (msg.includes('auth timeout') || msg === 'auth timeout') {
        console.warn('[WA] Auth timeout — resetting session');
        waManager.reset();
    }
});

module.exports = waManager;
