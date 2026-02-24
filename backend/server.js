const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const registry = require('./wa-registry');
const tgRegistry = require('./tg-registry');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: ['http://localhost:3000', 'https://flowsync-automation.netlify.app'], methods: ['GET', 'POST'] }
});

// Give registries a reference to io so they can use io.to(userId).emit()
registry.setIO(io);
tgRegistry.setIO(io);

app.use(cors());
app.use(bodyParser.json());

const oauthStates = new Map();
const userTokens = new Map();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'FlowSyncAi_bot';
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/twitter/callback`
    : 'https://ai-automation-app.vercel.app/api/twitter/callback';

/* ─────────────────────────────────────────────────────────
   Socket Auth Middleware — require userId on handshake
   ───────────────────────────────────────────────────────── */
io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId || typeof userId !== 'string' || userId.length < 4) {
        return next(new Error('Socket auth: missing or invalid userId'));
    }
    socket.userId = userId;
    next();
});

/* ─────────────────────────────────────────────────────────
   Helper — sync this user's current WA state to one socket
   ───────────────────────────────────────────────────────── */
function syncWAState(socket) {
    const userId = socket.userId;
    const mgr = registry.get(userId);
    socket.emit('wa_state', { state: mgr.state });
    socket.emit('whatsapp_status', { initialized: !!mgr.client, ready: mgr.isReady() });
    if (mgr.isReady()) {
        socket.emit('whatsapp_ready');
        socket.emit('whatsapp_authenticated');
    } else if (mgr.state === 'qr' && mgr.lastQr) {
        socket.emit('qr_code', mgr.lastQr);
    }
}

function syncTGState(socket) {
    const mgr = tgRegistry.get(socket.userId);
    socket.emit('tg_state', { state: mgr.state });
    if (mgr.isReady()) {
        socket.emit('tg_connected', {
            username: mgr.botInfo?.username,
            firstName: mgr.botInfo?.first_name,
        });
    }
}

/* ─────────────────────────────────────────────────────────
   Socket Connections
   ───────────────────────────────────────────────────────── */
io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(userId);                    // ← private room for this user
    console.log(`[Socket] Connected: ${socket.id} (user: ${userId.substring(0, 8)}…)`);

    // Send current WA + TG state immediately
    syncWAState(socket);
    syncTGState(socket);

    /* ── start_whatsapp ── */
    socket.on('start_whatsapp', async (ack) => {
        try {
            const mgr = registry.get(userId);
            await mgr.start();
            const ready = mgr.isReady();
            if (typeof ack === 'function') ack({ ok: true, ready, hasQr: !!mgr.lastQr });
            if (!ready && mgr.lastQr) socket.emit('qr_code', mgr.lastQr);
        } catch (e) {
            if (typeof ack === 'function') ack({ ok: false, error: e.message });
        }
    });

    /* ── get_whatsapp_status ── */
    socket.on('get_whatsapp_status', () => syncWAState(socket));

    /* ── reset_whatsapp ── */
    socket.on('reset_whatsapp', async (payload, ack) => {
        await registry.reset(userId);
        const cb = typeof payload === 'function' ? payload : ack;
        if (typeof cb === 'function') cb({ ok: true });
    });

    /* ── get_whatsapp_chats ── */
    socket.on('get_whatsapp_chats', async () => {
        const mgr = registry.get(userId);
        if (!mgr.isReady()) {
            socket.emit('whatsapp_chats_error', { reason: 'not_ready' });
            return;
        }
        try {
            const threads = await mgr.fetchChats(socket);
            socket.emit('whatsapp_chats', threads);
        } catch (err) {
            console.error(`[WA:${userId.substring(0, 8)}] fetchChats error:`, err.message);
            socket.emit('whatsapp_chats_error', { reason: 'fetch_failed', message: err.message });
        }
    });

    /* ── send_whatsapp_message ── */
    socket.on('send_whatsapp_message', async ({ chatId, text }) => {
        const mgr = registry.get(userId);
        try {
            await mgr.sendMessage(chatId, text);
            socket.emit('send_message_ok', { chatId });
        } catch (err) {
            socket.emit('send_message_error', { chatId, error: err.message });
        }
    });

    /* ── connect_telegram_bot — user provides their own bot token ── */
    socket.on('connect_telegram_bot', async ({ botToken, chatId } = {}) => {
        if (!botToken?.trim()) {
            socket.emit('tg_error', { error: 'Please provide a bot token.' });
            return;
        }
        try {
            const mgr = tgRegistry.get(userId);
            const ok = await mgr.start(botToken.trim());
            if (ok) {
                const threads = await mgr.fetchHistory(30);
                if (threads.length > 0) socket.emit('telegram_threads', threads);
            } else {
                // tg_error already emitted inside mgr.start()
                socket.emit('tg_error', { error: 'Could not connect bot. Check your token and try again.' });
            }
        } catch (err) {
            socket.emit('tg_error', { error: err.message });
        }
    });

    /* ── get_telegram_messages ── */
    socket.on('get_telegram_messages', async () => {
        try {
            const mgr = tgRegistry.get(userId);
            if (!mgr.isReady()) return; // Bot not connected yet — silent
            const threads = await mgr.fetchHistory(50);
            if (threads.length > 0) socket.emit('telegram_threads', threads);
        } catch (err) {
            console.error(`[TG:${userId.substring(0, 8)}] get_telegram_messages error:`, err.message);
        }
    });

    /* ── disconnect_telegram_bot ── */
    socket.on('disconnect_telegram_bot', async () => {
        await tgRegistry.reset(userId);
    });

    /* ── send_telegram_message ── */
    socket.on('send_telegram_message', async ({ telegramChatId, text }) => {
        const mgr = tgRegistry.get(userId);
        try {
            await mgr.sendMessage(telegramChatId, text);
            socket.emit('send_message_ok', { chatId: `tg_${telegramChatId}` });
        } catch (err) {
            socket.emit('send_message_error', { chatId: `tg_${telegramChatId}`, error: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id} (user: ${userId.substring(0, 8)}…)`);
    });
});

/* ─────────────────────────────────────────────────────────
   Telegram Webhook — live incoming messages → broadcast
   ───────────────────────────────────────────────────────── */
app.post('/api/telegram/webhook', async (req, res) => {
    res.sendStatus(200);
    const msg = req.body?.message;
    if (!msg?.text) return;
    const chatId = String(msg.chat.id);
    console.log(`[TG Webhook] From ${chatId}: ${msg.text}`);
    // Broadcast to all connected sockets (Telegram is not per-user in this app)
    io.emit('telegram_incoming_message', {
        id: `tg_${chatId}`, platform: 'telegram', telegramChatId: chatId,
        name: msg.from?.first_name || chatId,
        text: msg.text,
        time: new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        incoming: true,
    });
});

app.get('/api/telegram/auth-url', (req, res) => {
    res.json({ success: true, authUrl: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=auth` });
});

app.get('/api/telegram/status', (req, res) => {
    const d = userTokens.get('telegram');
    res.json(d ? { success: true, connected: true, data: d } : { success: false, connected: false });
});

/* ─────────────────────────────────────────────────────────
   Twitter OAuth 2.0
   ───────────────────────────────────────────────────────── */
app.get('/api/twitter/auth-url', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const codeChallenge = crypto.randomBytes(32).toString('base64url');
    oauthStates.set(state, { codeChallenge, timestamp: Date.now() });
    const params = new URLSearchParams({
        response_type: 'code', client_id: TWITTER_CLIENT_ID, redirect_uri: CALLBACK_URL,
        scope: 'tweet.read tweet.write users.read offline.access',
        state, code_challenge: codeChallenge, code_challenge_method: 'plain',
    });
    res.json({ success: true, authUrl: `https://twitter.com/i/oauth2/authorize?${params}`, state });
});

app.get('/api/twitter/callback', async (req, res) => {
    const { code, state } = req.query;
    const storedData = oauthStates.get(state);
    if (!storedData) return res.redirect('https://flowsync-automation.netlify.app/dashboard?error=invalid_state');
    try {
        const tokenRes = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            new URLSearchParams({ code, grant_type: 'authorization_code', client_id: TWITTER_CLIENT_ID, redirect_uri: CALLBACK_URL, code_verifier: storedData.codeChallenge }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}` } }
        );
        const { access_token, refresh_token } = tokenRes.data;
        const userRes = await axios.get('https://api.twitter.com/2/users/me', { headers: { Authorization: `Bearer ${access_token}` } });
        userTokens.set('twitter', { accessToken: access_token, refreshToken: refresh_token, username: userRes.data.data.username, userId: userRes.data.data.id, name: userRes.data.data.name });
        oauthStates.delete(state);
        res.redirect('https://flowsync-automation.netlify.app/dashboard?twitter=connected');
    } catch (error) {
        res.redirect('https://flowsync-automation.netlify.app/dashboard?error=twitter_auth_failed');
    }
});

app.get('/api/twitter/status', (req, res) => {
    const d = userTokens.get('twitter');
    res.json(d ? { success: true, connected: true, data: { username: d.username, userId: d.userId, name: d.name } } : { success: false, connected: false });
});

app.post('/api/twitter/tweet', async (req, res) => {
    const { text } = req.body;
    const d = userTokens.get('twitter');
    if (!d) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
        const response = await axios.post('https://api.twitter.com/2/tweets', { text }, { headers: { Authorization: `Bearer ${d.accessToken}`, 'Content-Type': 'application/json' } });
        res.json({ success: true, data: response.data.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

/* ─────────────────────────────────────────────────────────
   Health Check
   ───────────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', waStates: registry.getStates(), timestamp: new Date().toISOString() });
});

/* ─────────────────────────────────────────────────────────
   Start
   ───────────────────────────────────────────────────────── */
server.listen(PORT, () => {
    console.log(`🚀 FlowSync Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready — per-user WA sessions`);
    console.log(`🔐 OAuth endpoints ready`);
});

const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down all WA sessions...`);
    // Destroy all active WA clients so Chrome is killed cleanly
    try {
        const destroyPromises = [];
        for (const [uid, mgr] of registry._managers) {
            if (mgr.client) {
                console.log(`[WA:${uid.substring(0, 8)}] Destroying on shutdown...`);
                destroyPromises.push(mgr.client.destroy().catch(() => { }));
            }
        }
        await Promise.allSettled(destroyPromises);
    } catch (_) { }
    process.exit(0);
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
