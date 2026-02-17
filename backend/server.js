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



const initWhatsApp = async () => {
    if (whatsappClient) return; // Prevent multiple initializations

    console.log('Initializing WhatsApp Client...');
    whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
    });

    whatsappClient.on('qr', (qr) => {
        console.log('QR Code generated');
        io.emit('qr_code', qr);
    });

    whatsappClient.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        isWhatsAppReady = true;
        io.emit('whatsapp_ready');
    });

    whatsappClient.on('authenticated', () => {
        console.log('WhatsApp Authenticated');
        io.emit('whatsapp_authenticated');
    });

    whatsappClient.on('auth_failure', (msg) => {
        console.error('WhatsApp Auth Failure:', msg);
        isWhatsAppReady = false;
        io.emit('whatsapp_auth_failure', msg);
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log('WhatsApp Disconnected:', reason);
        whatsappClient = null;
        isWhatsAppReady = false;
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
        whatsappClient = null; // Reset on failure
        io.emit('error', 'Failed to initialize WhatsApp. Please restart the backend.');
    }
};

/* Handle socket connections */
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Send current WhatsApp status immediately on connect
    if (isWhatsAppReady) {
        socket.emit('whatsapp_ready');
        socket.emit('whatsapp_authenticated');
    }

    socket.on('start_whatsapp', () => {
        if (whatsappClient) {
            // Already initialized — send current status
            if (isWhatsAppReady) {
                socket.emit('whatsapp_ready');
                socket.emit('whatsapp_authenticated');
            }
        } else {
            initWhatsApp();
        }
    });

    socket.on('get_whatsapp_status', () => {
        socket.emit('whatsapp_status', {
            initialized: !!whatsappClient,
            ready: isWhatsAppReady
        });
    });

    socket.on('get_whatsapp_chats', async () => {
        if (!whatsappClient || !isWhatsAppReady) {
            console.log('WhatsApp not ready yet, skipping chat fetch');
            return;
        }
        try {
            const chats = await whatsappClient.getChats();
            const formattedChats = await Promise.all(
                chats.filter(c => !c.isGroup).slice(0, 15).map(async (chat) => {
                    const contact = await chat.getContact();
                    const messages = await chat.fetchMessages({ limit: 5 });

                    return {
                        id: chat.id._serialized,
                        platform: 'whatsapp',
                        from: contact.number,
                        name: contact.name || contact.pushname || contact.number,
                        avatar: (contact.name || contact.pushname || contact.number || 'WA').substring(0, 2).toUpperCase(),
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
                    };
                })
            );

            console.log(`Sending ${formattedChats.length} WhatsApp chats to client`);
            socket.emit('whatsapp_chats', formattedChats);
        } catch (error) {
            console.error('Error fetching chats:', error);
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
