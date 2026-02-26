/**
 * wa-registry.js — Per-user WhatsApp session registry
 *
 * Each user gets their own isolated WhatsApp client (Puppeteer instance).
 * Sessions are stored in .wwebjs_auth/session-<userId> folders.
 *
 * State machine per-user:
 *   idle → restoring → qr → authenticated → ready → error
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const EventEmitter = require('events');
const fs = require('fs');
const QRCode = require('qrcode');
const store = require('./firestore');
const { execSync } = require('child_process');

const AUTH_DATA_PATH = path.join(__dirname, '.wwebjs_auth');

/* ── Find system Chrome ────────────────────────────────── */
function findChrome() {
    const local = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const candidates = [
        // Standard Windows Chrome paths
        `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
        `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
        // User-specific Chrome install
        `${local}\\Google\\Chrome\\Application\\chrome.exe`,
        // Microsoft Edge (Chromium-based — works as Puppeteer target)
        `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${local}\\Microsoft\\Edge\\Application\\msedge.exe`,
        // macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
    ].filter(Boolean);

    for (const p of candidates) {
        try {
            if (fs.existsSync(p)) {
                console.log(`[WA] Using browser: ${p}`);
                return p;
            }
        } catch (_) { }
    }

    console.warn('[WA] ⚠️  No system Chrome/Edge found — Puppeteer will try its own binary.');
    return undefined;
}

const CHROME_PATH = findChrome();
console.log(`[WA] Chrome path resolved to: ${CHROME_PATH || '(auto / Puppeteer default)'}`);


/* ── Per-user WA manager (EventEmitter) ─────────────────── */
class UserWAManager extends EventEmitter {
    constructor(userId, io) {
        super();
        this.userId = userId;
        this.io = io;             // reference so we can emit to the right room
        this.client = null;
        this.state = 'idle';
        this.lastQr = null;
        this.isInitializing = false;
    }

    /** Internal — set state + broadcast to this user only */
    _setState(state) {
        this.state = state;
        this.io.to(this.userId).emit('wa_state', { state });
        console.log(`[WA:${this.userId.substring(0, 8)}] → ${state}`);
    }

    isReady() { return this.state === 'ready'; }

    /** Start WhatsApp (idempotent) */
    async start() {
        if (this.isInitializing || this.client) {
            // Already running — re-broadcast current state
            this.io.to(this.userId).emit('wa_state', { state: this.state });
            if (this.lastQr) this.io.to(this.userId).emit('qr_code', this.lastQr);
            if (this.state === 'ready') {
                this.io.to(this.userId).emit('whatsapp_ready');
                this.io.to(this.userId).emit('whatsapp_authenticated');
            }
            return;
        }

        this.isInitializing = true;
        this._setState('restoring');

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: this.userId,
                dataPath: AUTH_DATA_PATH,
            }),
            puppeteer: {
                headless: true,
                // Only pass executablePath when we found one — passing undefined breaks Puppeteer
                ...(CHROME_PATH ? { executablePath: CHROME_PATH } : {}),
                args: [
                    '--no-sandbox', '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
                    '--no-first-run', '--no-zygote', '--disable-gpu',
                    '--disable-extensions', '--mute-audio',
                    '--disable-background-networking', '--disable-default-apps',
                    '--safebrowsing-disable-auto-update',
                ],
            },
        });

        this.client.on('qr', async (qr) => {
            this.lastQr = qr;
            this._setState('qr');
            // Convert QR string to base64 data URL for the frontend
            try {
                const qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
                this.io.to(this.userId).emit('wa_qr', qrDataUrl);
            } catch (e) {
                this.io.to(this.userId).emit('wa_qr', qr); // fallback: raw string
            }
        });

        this.client.on('authenticated', () => {
            this.lastQr = null;
            this._setState('authenticated');
            this.io.to(this.userId).emit('whatsapp_authenticated');
        });

        this.client.on('ready', async () => {
            this.isInitializing = false;
            this.lastQr = null;
            this._setState('ready');
            // Persist connection state in Firestore
            await store.setConnection(this.userId, 'whatsapp', {
                state: 'ready',
                connectedAt: new Date().toISOString(),
            });
            this.io.to(this.userId).emit('whatsapp_ready');
        });

        this.client.on('auth_failure', (msg) => {
            console.error(`[WA:${this.userId.substring(0, 8)}] Auth failure:`, msg);
            this.isInitializing = false;
            this.lastQr = null;
            this._setState('error');
            this.io.to(this.userId).emit('whatsapp_auth_failure', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log(`[WA:${this.userId.substring(0, 8)}] Disconnected:`, reason);
            this.client = null;
            this.isInitializing = false;
            this.lastQr = null;
            this._setState('idle');
            this.io.to(this.userId).emit('whatsapp_disconnected');
        });

        // Incoming messages — save to Firestore + emit to frontend
        this.client.on('message', async (msg) => {
            try {
                const chat = await msg.getChat();
                const contact = await msg.getContact();
                const name = contact.name || contact.pushname || contact.number;
                const time = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const chatId = chat.id._serialized;
                const messageData = {
                    id: msg.id.id,
                    text: msg.body,
                    from: contact.number,
                    name,
                    incoming: !msg.fromMe,
                    time,
                    chatId,
                };

                // Save to Firestore
                await store.saveThread(this.userId, chatId, {
                    platform: 'whatsapp',
                    name,
                    avatar: name.substring(0, 2).toUpperCase(),
                });
                await store.saveMessage(this.userId, chatId, {
                    id: msg.id.id,
                    text: msg.body || '(media)',
                    time,
                    incoming: !msg.fromMe,
                });

                // Emit to frontend
                this.io.to(this.userId).emit('whatsapp_message', messageData);
            } catch (e) {
                console.warn(`[WA:${this.userId.substring(0, 8)}] message error:`, e.message);
            }
        });

        try {
            await this.client.initialize();
        } catch (err) {
            console.error(`[WA:${this.userId.substring(0, 8)}] initialize() failed:`, err.message);

            // Special case: Chrome was left running from a previous server session
            if (err.message.includes('already running') || err.message.includes('user data directory is already in use')) {
                console.log(`[WA:${this.userId.substring(0, 8)}] Killing orphaned Chrome and retrying...`);
                try {
                    // Kill all Chrome instances (Windows)
                    execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
                    await new Promise(r => setTimeout(r, 2000)); // wait for Chrome to die
                } catch (_) { /* ignore if no Chrome to kill */ }

                // Retry once with a fresh client
                this.client = null;
                this.isInitializing = false;
                await this.start(); // recursive retry
                return;
            }

            this.client = null;
            this.isInitializing = false;
            this._setState('error');
        }
    }

    /** Destroy session completely */
    async reset() {
        try { if (this.client) await this.client.destroy(); } catch (_) { }
        this.client = null;
        this.isInitializing = false;
        this.lastQr = null;
        this._setState('idle');
        await store.deleteConnection(this.userId, 'whatsapp');
        this.io.to(this.userId).emit('whatsapp_disconnected');
    }

    /** Send a message */
    async sendMessage(chatId, text) {
        if (!this.client || this.state !== 'ready') throw new Error('WhatsApp not ready');
        return this.client.sendMessage(chatId, text);
    }

    /** Fetch and return recent chat threads */
    async fetchChats(socket, limit = 25) {
        if (!this.client || this.state !== 'ready') throw new Error('WhatsApp not ready');

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
                    intent: 'general', vip: false, tags: [],
                    unread: chat.unreadCount > 0, flagged: false,
                    messages: messages.map(m => ({
                        text: m.body || '(media)',
                        time: new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        incoming: !m.fromMe,
                    })),
                });
                socket.emit('whatsapp_loading_progress', { current: i + 1, total, message: `Loaded ${i + 1}/${total}…` });
            } catch (e) {
                console.warn(`[WA] Skipped chat ${i}:`, e.message);
            }
        }
        return threads;
    }
}

/* ── Registry — Map<userId, UserWAManager> ──────────────── */
class WARegistry {
    constructor() {
        this._managers = new Map();
        this.io = null; // set from server.js after io is created
    }

    setIO(io) { this.io = io; }

    /** Get or create manager for user */
    get(userId) {
        if (!this._managers.has(userId)) {
            this._managers.set(userId, new UserWAManager(userId, this.io));
        }
        return this._managers.get(userId);
    }

    /** Fully destroy a user's manager */
    async reset(userId) {
        const mgr = this._managers.get(userId);
        if (mgr) {
            await mgr.reset();
            this._managers.delete(userId);
        }
    }

    /** List all active states (for health check) */
    getStates() {
        const result = {};
        for (const [uid, mgr] of this._managers) {
            result[uid.substring(0, 8)] = mgr.state;
        }
        return result;
    }
}

const registry = new WARegistry();
module.exports = registry;
