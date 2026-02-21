const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store OAuth states and tokens temporarily (use database in production)
const oauthStates = new Map();
const userTokens = new Map();

// API Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = 'FlowSyncBot'; // Replace with your bot username
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/twitter/callback`
    : 'https://ai-automation-app.vercel.app/api/twitter/callback';

// ============ WHATSAPP QAUTH (Real-time QR) ============

let whatsappClient = null;
let isWhatsAppReady = false;
let lastQr = null;          // ← cached so new sockets get it instantly
let isInitializing = false; // ← prevents parallel Puppeteer launches
let waState = 'idle';       // idle | restoring | qr | ready | error



const initWhatsApp = async () => {
    if (whatsappClient) return; // Prevent multiple initializations

    console.log('Initializing WhatsApp Client...');
    waState = 'restoring';
    io.emit('wa_state', { state: waState });

    whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: 60000,
        }
    });

    whatsappClient.on('qr', (qr) => {
        console.log('QR Code generated at', Date.now());
        lastQr = qr; // ← cache it
        waState = 'qr';
        io.emit('wa_state', { state: waState });
        io.emit('qr_code', qr);
    });

    whatsappClient.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        isWhatsAppReady = true;
        lastQr = null; // QR no longer needed once authenticated
        isInitializing = false;
        waState = 'ready';
        io.emit('wa_state', { state: waState });
        io.emit('whatsapp_ready');
    });

    whatsappClient.on('authenticated', () => {
        console.log('WhatsApp Authenticated');
        io.emit('whatsapp_authenticated');
    });

    whatsappClient.on('auth_failure', (msg) => {
        console.error('WhatsApp Auth Failure:', msg);
        isWhatsAppReady = false;
        waState = 'error';
        io.emit('wa_state', { state: waState });
        io.emit('whatsapp_auth_failure', msg);
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log('WhatsApp Disconnected:', reason);
        whatsappClient = null;
        isWhatsAppReady = false;
        lastQr = null;
        isInitializing = false;
        waState = 'idle';
        io.emit('wa_state', { state: waState });
        io.emit('whatsapp_disconnected');
    });

    whatsappClient.on('message_create', async (msg) => {
        try {
            const chat = await msg.getChat();
            const contact = await msg.getContact();

            const messageData = {
                id: msg.id.id,
                text: msg.body,
                from: contact.number,
                name: contact.name || contact.pushname || contact.number,
                incoming: !msg.fromMe,
                time: new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                chatId: chat.id._serialized
            };

            io.emit('whatsapp_message', messageData);
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    try {
        await whatsappClient.initialize();
    } catch (err) {
        console.error('Failed to initialize WhatsApp client:', err.message);
        whatsappClient = null;
        isInitializing = false;
        io.emit('error', 'Failed to initialize WhatsApp. Please restart the backend.');
    }
};

/* Handle socket connections */
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // ① Always send current WA status immediately
    socket.emit('whatsapp_status', { initialized: !!whatsappClient, ready: isWhatsAppReady });
    socket.emit('wa_state', { state: waState });

    // ② If ready, let the client know right away
    if (isWhatsAppReady) {
        socket.emit('whatsapp_ready');
        socket.emit('whatsapp_authenticated');
    }

    // ③ If not ready but we have a cached QR, send it instantly
    //    so the user doesn't wait 15-20s for the next refresh cycle
    if (!isWhatsAppReady && lastQr) {
        console.log('[WA] Sending cached QR to new client');
        socket.emit('qr_code', lastQr);
    }

    /* start_whatsapp — supports ack callback for instant UI feedback */
    socket.on('start_whatsapp', async (ack) => {
        try {
            if (isWhatsAppReady) {
                socket.emit('whatsapp_ready');
                socket.emit('whatsapp_authenticated');
                return typeof ack === 'function' && ack({ ok: true, ready: true });
            }

            // Send cached QR right now if we have one
            if (lastQr) {
                socket.emit('qr_code', lastQr);
            }

            // Start client if not already running
            if (!whatsappClient && !isInitializing) {
                isInitializing = true;
                initWhatsApp(); // non-blocking — QR arrives via event
            }

            return typeof ack === 'function' && ack({ ok: true, ready: false, hasQr: !!lastQr });
        } catch (e) {
            isInitializing = false;
            console.error('start_whatsapp error:', e);
            socket.emit('whatsapp_auth_failure', e.message);
            return typeof ack === 'function' && ack({ ok: false, error: e.message });
        }
    });

    socket.on('get_whatsapp_status', () => {
        socket.emit('whatsapp_status', { initialized: !!whatsappClient, ready: isWhatsAppReady });
        // Also send cached QR on status request
        if (!isWhatsAppReady && lastQr) socket.emit('qr_code', lastQr);
    });

    /* ── connect_telegram: verify bot token and mark connected ── */
    socket.on('connect_telegram', async () => {
        try {
            const res = await axios.get(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
            );
            if (res.data?.ok) {
                const bot = res.data.result;
                console.log(`[TG] Bot verified: @${bot.username}`);
                socket.emit('telegram_connected', {
                    username: bot.username,
                    firstName: bot.first_name,
                    chatId: process.env.TELEGRAM_CHAT_ID || null
                });
            } else {
                socket.emit('telegram_connect_error', { error: 'Invalid bot token' });
            }
        } catch (err) {
            console.error('[TG] connect_telegram error:', err.message);
            socket.emit('telegram_connect_error', { error: err.message });
        }
    });

    /* ── Send WhatsApp message ── */
    socket.on('send_whatsapp_message', async ({ chatId, text }) => {
        if (!whatsappClient || !isWhatsAppReady) {
            socket.emit('send_message_error', { chatId, error: 'WhatsApp not ready' });
            return;
        }
        try {
            await whatsappClient.sendMessage(chatId, text);
            console.log(`[WA] Sent to ${chatId}: ${text.substring(0, 40)}`);
            socket.emit('send_message_ok', { chatId });
        } catch (err) {
            console.error('[WA] Send error:', err.message);
            socket.emit('send_message_error', { chatId, error: err.message });
        }
    });

    /* ── Telegram: fetch recent messages as inbox threads ── */
    socket.on('get_telegram_messages', async () => {
        try {
            const res = await axios.get(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=50&offset=-50`
            );
            const updates = res.data?.result || [];

            // Group by chat id
            const chatMap = {};
            for (const upd of updates) {
                const msg = upd.message || upd.channel_post;
                if (!msg) continue;
                const cid = String(msg.chat.id);
                if (!chatMap[cid]) {
                    chatMap[cid] = {
                        id: `tg_${cid}`,
                        platform: 'telegram',
                        from: cid,
                        name: msg.chat.first_name
                            ? `${msg.chat.first_name}${msg.chat.last_name ? ' ' + msg.chat.last_name : ''}`
                            : msg.chat.title || msg.chat.username || cid,
                        avatar: (msg.chat.first_name || msg.chat.title || 'T').substring(0, 2).toUpperCase(),
                        intent: 'general',
                        vip: false,
                        tags: [],
                        messages: [],
                        unread: false,
                        flagged: false,
                        telegramChatId: cid
                    };
                }
                chatMap[cid].messages.push({
                    text: msg.text || '(media)',
                    time: new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    incoming: true
                });
            }

            const threads = Object.values(chatMap);
            socket.emit('telegram_threads', threads);
        } catch (err) {
            console.error('[TG] getUpdates error:', err.message);
            socket.emit('telegram_error', { error: err.message });
        }
    });

    /* ── Send Telegram message ── */
    socket.on('send_telegram_message', async ({ telegramChatId, text }) => {
        try {
            await axios.post(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                { chat_id: telegramChatId, text }
            );
            console.log(`[TG] Sent to ${telegramChatId}: ${text.substring(0, 40)}`);
            socket.emit('send_message_ok', { chatId: `tg_${telegramChatId}` });
        } catch (err) {
            console.error('[TG] Send error:', err.response?.data || err.message);
            socket.emit('send_message_error', { chatId: `tg_${telegramChatId}`, error: err.message });
        }
    });

    socket.on('get_whatsapp_chats', async () => {
        if (!whatsappClient || !isWhatsAppReady) {
            console.log('WhatsApp not ready yet, skipping chat fetch');
            socket.emit('whatsapp_chats_error', { reason: 'not_ready' });
            return;
        }
        try {
            const chats = await whatsappClient.getChats();
            const personalChats = chats.filter(c => !c.isGroup).slice(0, 15);

            const formattedChats = [];
            let processedCount = 0;
            const totalChats = personalChats.length;

            socket.emit('whatsapp_loading_progress', { current: 0, total: totalChats, message: 'Starting fetch...' });

            for (const chat of personalChats) {
                processedCount++;
                try {
                    socket.emit('whatsapp_loading_progress', {
                        current: processedCount,
                        total: totalChats,
                        message: `Processing chat ${processedCount}/${totalChats}`
                    });

                    const contact = await chat.getContact();
                    const contactName = contact.name || contact.pushname || contact.number || 'Unknown';

                    let messages = [];
                    try {
                        // Increase resilience for individual chat fetch
                        messages = await chat.fetchMessages({ limit: 12 });
                    } catch (fetchErr) {
                        console.warn(`[WA] Timeout fetching messages for ${contactName}, skipping message history.`);
                    }

                    formattedChats.push({
                        id: chat.id._serialized,
                        platform: 'whatsapp',
                        from: contact.number || chat.id.user,
                        name: contactName,
                        avatar: contactName.substring(0, 2).toUpperCase(),
                        intent: 'general',
                        vip: false,
                        tags: [],
                        messages: messages.map(m => ({
                            text: m.body || '(media)',
                            time: new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            incoming: !m.fromMe
                        })),
                        unread: chat.unreadCount > 0,
                        flagged: false
                    });
                } catch (chatErr) {
                    console.error('Error processing individual chat:', chatErr.message);
                }
            }

            console.log(`Sending ${formattedChats.length} WhatsApp chats to client`);
            socket.emit('whatsapp_chats', formattedChats);
        } catch (error) {
            console.error('Error fetching chats:', error.message);

            if (error.message.includes('detached') || error.message.includes('Session closed') || error.message.includes('Protocol error')) {
                console.log('WhatsApp session is stale, reinitializing...');
                isWhatsAppReady = false;

                try {
                    await whatsappClient.destroy();
                } catch (e) {
                    console.log('Error destroying stale client:', e.message);
                }
                whatsappClient = null;

                socket.emit('whatsapp_chats_error', { reason: 'session_stale', message: 'WhatsApp session expired. Reconnecting...' });
                io.emit('whatsapp_disconnected');

                initWhatsApp();
            } else {
                socket.emit('whatsapp_chats_error', { reason: 'fetch_failed', message: error.message });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Auto-initialize WhatsApp when server starts
console.log('Auto-initializing WhatsApp...');
initWhatsApp();


// ============ TELEGRAM OAUTH ============

// Telegram Login Widget - generates auth URL
app.get('/api/telegram/auth-url', (req, res) => {
    // Telegram uses Login Widget or direct bot link
    const botUsername = TELEGRAM_BOT_USERNAME;
    const authUrl = `https://t.me/${botUsername}?start=auth`;

    res.json({
        success: true,
        authUrl: authUrl,
        instructions: 'Click the link to open Telegram and authorize the bot'
    });
});

// Telegram webhook for receiving updates
app.post('/api/telegram/webhook', async (req, res) => {
    const update = req.body;
    console.log('Telegram Update:', update);

    // Handle /start command with auth parameter
    if (update.message && update.message.text === '/start auth') {
        const chatId = update.message.chat.id;
        const username = update.message.from.username;

        // Store user token
        userTokens.set('telegram', {
            chatId,
            username,
            firstName: update.message.from.first_name
        });

        // Send confirmation message
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: '✅ Successfully connected to FlowSync! You can now close this chat.'
        });
    }

    res.sendStatus(200);
});

// Check Telegram connection status
app.get('/api/telegram/status', (req, res) => {
    const telegramData = userTokens.get('telegram');

    if (telegramData) {
        res.json({
            success: true,
            connected: true,
            data: {
                username: telegramData.username,
                chatId: telegramData.chatId,
                firstName: telegramData.firstName
            }
        });
    } else {
        res.json({
            success: false,
            connected: false,
            message: 'Not connected to Telegram'
        });
    }
});

// ============ TWITTER OAUTH 2.0 ============

// Step 1: Generate Twitter OAuth URL
app.get('/api/twitter/auth-url', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const codeChallenge = crypto.randomBytes(32).toString('base64url');

    // Store state for verification
    oauthStates.set(state, { codeChallenge, timestamp: Date.now() });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        scope: 'tweet.read tweet.write users.read offline.access',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'plain'
    });

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    res.json({
        success: true,
        authUrl: authUrl,
        state: state
    });
});

// Step 2: Twitter OAuth Callback
app.get('/api/twitter/callback', async (req, res) => {
    const { code, state } = req.query;

    // Verify state
    const storedData = oauthStates.get(state);
    if (!storedData) {
        return res.redirect('http://localhost:3000/dashboard?error=invalid_state');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: TWITTER_CLIENT_ID,
                redirect_uri: CALLBACK_URL,
                code_verifier: storedData.codeChallenge
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
                }
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        // Store tokens
        userTokens.set('twitter', {
            accessToken: access_token,
            refreshToken: refresh_token,
            username: userResponse.data.data.username,
            userId: userResponse.data.data.id,
            name: userResponse.data.data.name
        });

        // Cleanup
        oauthStates.delete(state);

        // Redirect back to dashboard
        res.redirect('http://localhost:3000/dashboard?twitter=connected');

    } catch (error) {
        console.error('Twitter OAuth Error:', error.response?.data || error.message);
        res.redirect('http://localhost:3000/dashboard?error=twitter_auth_failed');
    }
});

// Check Twitter connection status
app.get('/api/twitter/status', (req, res) => {
    const twitterData = userTokens.get('twitter');

    if (twitterData) {
        res.json({
            success: true,
            connected: true,
            data: {
                username: twitterData.username,
                userId: twitterData.userId,
                name: twitterData.name
            }
        });
    } else {
        res.json({
            success: false,
            connected: false,
            message: 'Not connected to Twitter'
        });
    }
});

// Post tweet (using stored token)
app.post('/api/twitter/tweet', async (req, res) => {
    const { text } = req.body;
    const twitterData = userTokens.get('twitter');

    if (!twitterData) {
        return res.status(401).json({
            success: false,
            error: 'Not authenticated with Twitter'
        });
    }

    try {
        const response = await axios.post(
            'https://api.twitter.com/2/tweets',
            { text },
            {
                headers: {
                    'Authorization': `Bearer ${twitterData.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            data: response.data.data
        });
    } catch (error) {
        console.error('Tweet Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'FlowSync Backend API with OAuth is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 FlowSync Backend running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 OAuth endpoints ready`);
    console.log(`📱 WhatsApp QR ready`);
});

// Graceful shutdown to prevent lingering Puppeteer/Chrome processes locking the session
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    if (whatsappClient) {
        console.log('Destroying WhatsApp client...');
        try {
            await whatsappClient.destroy();
            console.log('WhatsApp client destroyed.');
        } catch (e) {
            console.error('Error destroying WhatsApp client:', e.message);
        }
    }
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restarts
