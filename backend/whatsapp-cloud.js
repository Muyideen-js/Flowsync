/**
 * Meta WhatsApp Cloud API integration
 * Token-based auth, webhooks for incoming messages, no Puppeteer/whatsapp-web.js
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const CREDENTIALS_FILE = path.join(__dirname, '.whatsapp_cloud_credentials.json');

/** @type {{ accessToken: string, phoneNumberId: string, wabaId: string, connectedAt?: string } | null} */
let credentials = null;

/** In-memory conversations: phoneNumber -> { name, messages: [{ text, time, incoming }] } */
const conversations = new Map();

/**
 * Load credentials from file (persists across restarts)
 */
function loadCredentials() {
    try {
        if (fs.existsSync(CREDENTIALS_FILE)) {
            const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
            credentials = JSON.parse(raw);
            return credentials;
        }
    } catch (e) {
        console.warn('[WA Cloud] Could not load credentials file:', e.message);
    }
    return null;
}

/**
 * Save credentials to file
 */
function saveCredentials() {
    if (!credentials) return;
    try {
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
    } catch (e) {
        console.warn('[WA Cloud] Could not save credentials:', e.message);
    }
}

/**
 * Initialize from env or saved file
 */
function initFromEnv() {
    const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const wabaId = process.env.WHATSAPP_WABA_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (token && phoneNumberId && wabaId) {
        credentials = {
            accessToken: token,
            phoneNumberId,
            wabaId,
            connectedAt: new Date().toISOString(),
        };
        saveCredentials();
        return true;
    }
    return loadCredentials() !== null;
}

// Load on module load
initFromEnv();

/**
 * Validate credentials by calling Meta API
 */
async function validateCredentials(accessToken, phoneNumberId, wabaId) {
    try {
        const url = `${BASE_URL}/${phoneNumberId}`;
        const res = await axios.get(url, {
            params: { access_token: accessToken },
            timeout: 10000,
        });
        if (res.data && res.data.id === phoneNumberId) {
            return { valid: true, displayPhone: res.data.display_phone_number };
        }
        return { valid: false, error: 'Invalid phone number ID' };
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        return { valid: false, error: msg };
    }
}

/**
 * Connect (validate and store credentials)
 */
async function connect(accessToken, phoneNumberId, wabaId) {
    const validation = await validateCredentials(accessToken, phoneNumberId, wabaId);
    if (!validation.valid) {
        return { ok: false, error: validation.error };
    }

    credentials = {
        accessToken,
        phoneNumberId,
        wabaId,
        connectedAt: new Date().toISOString(),
    };
    saveCredentials();
    console.log('[WA Cloud] Connected:', validation.displayPhone);
    return { ok: true, displayPhone: validation.displayPhone };
}

/**
 * Disconnect (clear credentials)
 */
function disconnect() {
    credentials = null;
    try {
        if (fs.existsSync(CREDENTIALS_FILE)) {
            fs.unlinkSync(CREDENTIALS_FILE);
        }
    } catch (e) {}
    conversations.clear();
}

/**
 * Check if connected
 */
function isConnected() {
    return credentials !== null && !!credentials.accessToken;
}

/**
 * Get current credentials (for socket status)
 */
function getCredentials() {
    return credentials ? { ...credentials } : null;
}

/**
 * Send text message via Cloud API
 * @param {string} to - Phone number (E.164 format, e.g. 14155238886)
 * @param {string} text - Message body
 */
async function sendMessage(to, text) {
    if (!credentials) {
        throw new Error('WhatsApp not connected');
    }

    // Normalize: remove @c.us suffix, +, spaces, leading zeros
    let normalized = String(to).replace(/@c\.us$/, '').replace(/\D/g, '');
    if (normalized.startsWith('0')) {
        normalized = normalized.slice(1);
    }

    const url = `${BASE_URL}/${credentials.phoneNumberId}/messages`;
    const res = await axios.post(
        url,
        {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalized,
            type: 'text',
            text: { preview_url: false, body: text },
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${credentials.accessToken}`,
            },
            timeout: 15000,
        }
    );

    return res.data;
}

/**
 * Add or update conversation from webhook message
 */
function addConversationFromWebhook(from, name, text, incoming, timestamp) {
    const chatId = `wa_${from}`;
    if (!conversations.has(chatId)) {
        conversations.set(chatId, {
            id: chatId,
            platform: 'whatsapp',
            from,
            name: name || from,
            avatar: (name || from).substring(0, 2).toUpperCase(),
            intent: 'general',
            vip: false,
            tags: [],
            messages: [],
            unread: false,
            flagged: false,
        });
    }
    const conv = conversations.get(chatId);
    if (name) conv.name = name;
    conv.messages.push({
        text: text || '(media)',
        time: timestamp ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        incoming,
    });
    if (incoming) conv.unread = true;

    return conv;
}

/**
 * Process webhook payload and return parsed messages
 */
function processWebhookPayload(body) {
    const results = [];
    if (body.object !== 'whatsapp_business_account') return results;

    const entries = body.entry || [];
    for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
            if (change.field !== 'messages') continue;
            const value = change.value || {};
            const metadata = value.metadata || {};
            const messages = value.messages || [];
            const contacts = value.contacts || [];
            const fromIndex = {};

            for (const c of contacts) {
                if (c.wa_id) fromIndex[c.wa_id] = c.profile?.name || c.wa_id;
            }

            for (const msg of messages) {
                const from = msg.from;
                const name = fromIndex[from] || value.profile?.name || from;
                let text = '';
                let timestamp = msg.timestamp;

                if (msg.type === 'text' && msg.text) {
                    text = msg.text.body || '';
                } else if (msg.type === 'button' && msg.button?.text) {
                    text = msg.button.text;
                } else if (msg.type) {
                    text = `[${msg.type}]`;
                }

                const conv = addConversationFromWebhook(from, name, text, true, timestamp);
                results.push({
                    chatId: conv.id,
                    from,
                    name,
                    text,
                    id: msg.id,
                    timestamp,
                });
            }
        }
    }
    return results;
}

/**
 * Get all conversations as thread list (for get_whatsapp_chats)
 */
function getThreads() {
    return Array.from(conversations.values()).map((c) => ({
        ...c,
        messages: c.messages.slice(-12),
    }));
}

/**
 * Extract phone number from chatId for sending
 */
function chatIdToPhoneNumber(chatId) {
    if (!chatId) return null;
    if (typeof chatId === 'string' && chatId.startsWith('wa_')) {
        return chatId.replace(/^wa_/, '');
    }
    return String(chatId).replace(/@c\.us$/, '').replace(/\D/g, '');
}

/** Verify token for Meta webhook subscription (must match Meta App config) */
function getVerifyToken() {
    return process.env.WHATSAPP_VERIFY_TOKEN || 'flowsync_verify_token';
}

module.exports = {
    connect,
    disconnect,
    isConnected,
    getCredentials,
    getThreads,
    sendMessage,
    processWebhookPayload,
    addConversationFromWebhook,
    chatIdToPhoneNumber,
    loadCredentials,
    initFromEnv,
    getVerifyToken,
};
