const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const tgRegistry = require('./tg-registry');
const waCloud = require('./whatsapp-cloud');
const store = require('./firestore');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: ['http://localhost:3000', 'https://flowsync-automation.netlify.app'], methods: ['GET', 'POST'] }
});

// Give registries a reference to io
tgRegistry.setIO(io);

app.use(cors());
app.use(bodyParser.json());

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api/twitter/callback`
    : 'https://flowsync-3fd5.onrender.com/api/twitter/callback';

// Temporary in-memory store for OAuth state → userId mapping
const oauthStates = new Map();

/* ─────────────────────────────────────────────────────────
   Firebase ID Token Verification — REST Middleware
   ───────────────────────────────────────────────────────── */
async function verifyTokenFromHeader(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing auth token' });
    }
    try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
        req.userId = decoded.uid;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid auth token' });
    }
}

/* ─────────────────────────────────────────────────────────
   Build Full Connection States Helper
   ───────────────────────────────────────────────────────── */
async function buildFullStates(userId) {
    const conn = await store.getUserConnections(userId);
    return {
        telegram: {
            connected: !!(conn.telegram?.botToken && conn.telegram?.state === 'ready'),
            username: conn.telegram?.botUsername || null,
            firstName: conn.telegram?.botFirstName || null,
        },
        whatsapp: {
            connected: !!(conn.whatsapp?.accessToken),
            displayPhone: conn.whatsapp?.displayPhone || null,
        },
        twitter: {
            connected: !!(conn.twitter?.accessToken),
            username: conn.twitter?.username || null,
            name: conn.twitter?.name || null,
        },
    };
}

/* ─────────────────────────────────────────────────────────
   Socket Auth Middleware — Firebase ID Token Verification
   ───────────────────────────────────────────────────────── */
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Socket auth: missing token'));
    }
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        socket.userId = decoded.uid;
        next();
    } catch (err) {
        return next(new Error('Socket auth: invalid token'));
    }
});

/* ─────────────────────────────────────────────────────────
   Socket Connections — Unified State Restore
   ───────────────────────────────────────────────────────── */
io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(userId);
    console.log(`[Socket] Connected: ${socket.id} (user: ${userId.substring(0, 8)}…)`);

    // ── Load ALL connection states from Firestore and emit at once ──
    socket.emit('connection_states', await buildFullStates(userId));

    // ── Auto-restore Telegram bot if connected ──
    const connections = await store.getUserConnections(userId);
    if (connections.telegram?.botToken) {
        const mgr = tgRegistry.get(userId);
        if (!mgr.isReady()) {
            mgr.restoreFromFirestore().then(ok => {
                if (ok) console.log(`[TG:${userId.substring(0, 8)}] Auto-restored from Firestore`);
            }).catch(err => {
                console.error(`[TG:${userId.substring(0, 8)}] Auto-restore failed:`, err.message);
            });
        }
    }

    /* ── get_connection_states — re-sync on demand ── */
    socket.on('get_connection_states', async () => {
        socket.emit('connection_states', await buildFullStates(userId));
    });

    /* ── get_inbox — load from Firestore ── */
    socket.on('get_inbox', async ({ platform } = {}) => {
        try {
            const threads = await store.getInbox(userId, platform || null);
            socket.emit('inbox_threads', threads);
        } catch (err) {
            console.error(`[Inbox:${userId.substring(0, 8)}] Error:`, err.message);
            socket.emit('inbox_threads', []);
        }
    });

    /* ── mark_thread_read ── */
    socket.on('mark_thread_read', async ({ chatId }) => {
        await store.markThreadRead(userId, chatId);
    });

    /* ═══════════════════════════════════════════════════════
       WhatsApp Cloud API Events
       ═══════════════════════════════════════════════════════ */

    /* ── connect_whatsapp ── */
    socket.on('connect_whatsapp', async ({ accessToken, phoneNumberId, wabaId } = {}) => {
        if (!accessToken || !phoneNumberId) {
            socket.emit('wa_error', { error: 'Missing WhatsApp Cloud API credentials' });
            return;
        }
        try {
            const result = await waCloud.connect(userId, accessToken, phoneNumberId, wabaId);
            if (result.ok) {
                socket.emit('connection_states', await buildFullStates(userId));
            } else {
                socket.emit('wa_error', { error: result.error });
            }
        } catch (err) {
            socket.emit('wa_error', { error: err.message });
        }
    });

    /* ── get_whatsapp_status ── */
    socket.on('get_whatsapp_status', async () => {
        socket.emit('connection_states', await buildFullStates(userId));
    });

    /* ── get_whatsapp_chats ── */
    socket.on('get_whatsapp_chats', async () => {
        try {
            const threads = await waCloud.getThreads(userId);
            socket.emit('whatsapp_chats', threads);
        } catch (err) {
            socket.emit('whatsapp_chats_error', { reason: 'fetch_failed', message: err.message });
        }
    });

    /* ── send_whatsapp_message ── */
    socket.on('send_whatsapp_message', async ({ chatId, text }) => {
        try {
            const phoneNumber = waCloud.chatIdToPhoneNumber(chatId);
            await waCloud.sendMessage(userId, phoneNumber, text);
            socket.emit('send_message_ok', { chatId });
        } catch (err) {
            socket.emit('send_message_error', { chatId, error: err.message });
        }
    });

    /* ── disconnect_whatsapp ── */
    socket.on('disconnect_whatsapp', async () => {
        await waCloud.disconnect(userId);
        socket.emit('connection_states', await buildFullStates(userId));
    });

    /* ═══════════════════════════════════════════════════════
       Telegram Events
       ═══════════════════════════════════════════════════════ */

    /* ── connect_telegram_bot ── */
    socket.on('connect_telegram_bot', async ({ botToken } = {}) => {
        if (!botToken?.trim()) {
            socket.emit('tg_error', { error: 'Please provide a bot token.' });
            return;
        }
        try {
            const mgr = tgRegistry.get(userId);
            const ok = await mgr.start(botToken.trim());
            if (ok) {
                // Emit FULL connection states
                socket.emit('connection_states', await buildFullStates(userId));
                // Fetch existing threads from Firestore
                const threads = await mgr.fetchHistory();
                if (threads.length > 0) socket.emit('telegram_threads', threads);
            } else {
                socket.emit('tg_error', { error: 'Could not connect bot. Check your token and try again.' });
            }
        } catch (err) {
            socket.emit('tg_error', { error: err.message });
        }
    });

    /* ── get_telegram_status ── */
    socket.on('get_telegram_status', async () => {
        const mgr = tgRegistry.get(userId);
        socket.emit('tg_state', { state: mgr.state });
        if (mgr.isReady()) {
            socket.emit('tg_connected', {
                username: mgr.botInfo?.username,
                firstName: mgr.botInfo?.first_name,
            });
        }
    });

    /* ── get_telegram_messages ── */
    socket.on('get_telegram_messages', async () => {
        try {
            const mgr = tgRegistry.get(userId);
            // Always try Firestore first (even if bot is temporarily disconnected)
            const threads = await store.getInbox(userId, 'telegram');
            if (threads.length > 0) {
                socket.emit('telegram_threads', threads);
            } else if (mgr.isReady()) {
                // Fallback: fetch from Telegram API if Firestore is empty
                const apiThreads = await mgr.fetchHistory();
                if (apiThreads.length > 0) socket.emit('telegram_threads', apiThreads);
            }
        } catch (err) {
            console.error(`[TG:${userId.substring(0, 8)}] get_telegram_messages error:`, err.message);
        }
    });

    /* ── disconnect_telegram_bot ── */
    socket.on('disconnect_telegram_bot', async () => {
        await tgRegistry.reset(userId);
        socket.emit('connection_states', await buildFullStates(userId));
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

    /* ═══════════════════════════════════════════════════════
       Socket Disconnect
       ═══════════════════════════════════════════════════════ */
    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id} (user: ${userId.substring(0, 8)}…)`);
    });
});

/* ─────────────────────────────────────────────────────────
   WhatsApp Cloud API Webhook
   ───────────────────────────────────────────────────────── */
app.get('/api/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === waCloud.getVerifyToken()) {
        console.log('[WA Webhook] Verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/api/whatsapp/webhook', async (req, res) => {
    res.sendStatus(200); // Always respond immediately
    try {
        const messages = await waCloud.processWebhookPayload(req.body, io);
        for (const msg of messages) {
            // TODO: In multi-user mode, look up which user owns msg.phoneNumberId
            // For now, broadcast to all connected sockets
            // Save to Firestore for ALL users who have this phoneNumberId connected
            // This is a simplified single-user approach:
            const chatId = msg.chatId;
            const avatar = (msg.name || '?').substring(0, 2).toUpperCase();
            const time = msg.time;

            // Broadcast the incoming message
            io.emit('whatsapp_message', {
                chatId,
                from: msg.from,
                name: msg.name,
                text: msg.text,
                time,
                incoming: true,
            });
        }
    } catch (err) {
        console.error('[WA Webhook] Error:', err.message);
    }
});

/* ─────────────────────────────────────────────────────────
   Twitter OAuth 2.0 — Per-User with DM Scopes
   ───────────────────────────────────────────────────────── */
app.get('/api/twitter/auth-url', verifyTokenFromHeader, (req, res) => {
    const userId = req.userId;
    const state = crypto.randomBytes(16).toString('hex');
    const codeChallenge = crypto.randomBytes(32).toString('base64url');
    oauthStates.set(state, { codeChallenge, userId, timestamp: Date.now() });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        scope: 'tweet.read tweet.write users.read dm.read dm.write offline.access',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'plain',
    });
    res.json({ success: true, authUrl: `https://twitter.com/i/oauth2/authorize?${params}`, state });
});

app.get('/api/twitter/callback', async (req, res) => {
    const { code, state } = req.query;
    const storedData = oauthStates.get(state);
    if (!storedData) return res.redirect('https://flowsync-automation.netlify.app/dashboard?error=invalid_state');

    const userId = storedData.userId;

    try {
        const tokenRes = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: TWITTER_CLIENT_ID,
                redirect_uri: CALLBACK_URL,
                code_verifier: storedData.codeChallenge,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
                },
            }
        );
        const { access_token, refresh_token } = tokenRes.data;
        const userRes = await axios.get('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const twitterData = userRes.data.data;

        // Store per-user in Firestore
        if (userId) {
            await store.setConnection(userId, 'twitter', {
                accessToken: access_token,
                refreshToken: refresh_token,
                username: twitterData.username,
                twitterUserId: twitterData.id,
                name: twitterData.name,
                state: 'ready',
                connectedAt: new Date().toISOString(),
            });

            // Notify user's socket of FULL connection state
            io.to(userId).emit('connection_states', await buildFullStates(userId));
        }

        oauthStates.delete(state);
        res.redirect('https://flowsync-automation.netlify.app/dashboard?twitter=connected');
    } catch (error) {
        console.error('[Twitter OAuth] Error:', error.response?.data || error.message);
        res.redirect('https://flowsync-automation.netlify.app/dashboard?error=twitter_auth_failed');
    }
});

app.get('/api/twitter/status', verifyTokenFromHeader, async (req, res) => {
    const userId = req.userId;

    const conn = await store.getConnection(userId, 'twitter');
    if (conn?.accessToken) {
        res.json({
            success: true,
            connected: true,
            data: { username: conn.username, userId: conn.twitterUserId, name: conn.name },
        });
    } else {
        res.json({ success: false, connected: false });
    }
});

app.post('/api/twitter/tweet', verifyTokenFromHeader, async (req, res) => {
    const { text } = req.body;
    const userId = req.userId;

    const conn = await store.getConnection(userId, 'twitter');
    if (!conn?.accessToken) return res.status(401).json({ success: false, error: 'Not authenticated' });

    try {
        const response = await axios.post(
            'https://api.twitter.com/2/tweets',
            { text },
            { headers: { Authorization: `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json' } }
        );
        res.json({ success: true, data: response.data.data });
    } catch (error) {
        // If token expired, try refresh
        if (error.response?.status === 401 && conn.refreshToken) {
            try {
                const refreshRes = await axios.post(
                    'https://api.twitter.com/2/oauth2/token',
                    new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: conn.refreshToken,
                        client_id: TWITTER_CLIENT_ID,
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
                        },
                    }
                );
                const newToken = refreshRes.data.access_token;
                const newRefresh = refreshRes.data.refresh_token || conn.refreshToken;
                await store.setConnection(userId, 'twitter', {
                    accessToken: newToken,
                    refreshToken: newRefresh,
                });

                // Retry with new token
                const retryRes = await axios.post(
                    'https://api.twitter.com/2/tweets',
                    { text },
                    { headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' } }
                );
                return res.json({ success: true, data: retryRes.data.data });
            } catch (refreshErr) {
                return res.status(401).json({ success: false, error: 'Token refresh failed. Please re-authenticate.' });
            }
        }
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

/* ── Twitter DMs endpoint ── */
app.get('/api/twitter/dms', verifyTokenFromHeader, async (req, res) => {
    const userId = req.userId;

    const conn = await store.getConnection(userId, 'twitter');
    if (!conn?.accessToken) return res.status(401).json({ success: false, error: 'Not authenticated' });

    try {
        const response = await axios.get(
            'https://api.twitter.com/2/dm_events',
            {
                params: { 'dm_event.fields': 'id,text,created_at,dm_conversation_id,sender_id', max_results: 50 },
                headers: { Authorization: `Bearer ${conn.accessToken}` },
            }
        );
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

/* ── Disconnect Twitter ── */
app.post('/api/twitter/disconnect', verifyTokenFromHeader, async (req, res) => {
    const userId = req.userId;
    await store.deleteConnection(userId, 'twitter');
    io.to(userId).emit('connection_states', await buildFullStates(userId));
    res.json({ success: true });
});

/* ─────────────────────────────────────────────────────────
   Telegram Auth URL (for bot link)
   ───────────────────────────────────────────────────────── */
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'FlowSyncAi_bot';
app.get('/api/telegram/auth-url', (req, res) => {
    res.json({ success: true, authUrl: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=auth` });
});

/* ─────────────────────────────────────────────────────────
   Health Check
   ───────────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─────────────────────────────────────────────────────────
   Start
   ───────────────────────────────────────────────────────── */
server.listen(PORT, () => {
    console.log(`🚀 FlowSync Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready — Firestore-backed connections`);
    console.log(`🔐 OAuth endpoints ready`);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
