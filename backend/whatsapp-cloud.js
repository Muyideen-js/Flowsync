/**
 * whatsapp-cloud.js — Per-user Meta WhatsApp Cloud API integration
 *
 * Token-based auth, webhooks for incoming messages, no Puppeteer/Chrome.
 * All credentials and conversations stored in Firestore per userId.
 */

const axios = require('axios');
const store = require('./firestore');

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Validate Cloud API credentials by calling Meta API
 */
async function validateCredentials(accessToken, phoneNumberId) {
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
 * Connect (validate and store credentials per user)
 */
async function connect(userId, accessToken, phoneNumberId, wabaId) {
    const validation = await validateCredentials(accessToken, phoneNumberId);
    if (!validation.valid) {
        return { ok: false, error: validation.error };
    }

    await store.setConnection(userId, 'whatsapp', {
        accessToken,
        phoneNumberId,
        wabaId,
        displayPhone: validation.displayPhone,
        state: 'ready',
        connectedAt: new Date().toISOString(),
    });

    console.log(`[WA Cloud:${userId.substring(0, 8)}] Connected: ${validation.displayPhone}`);
    return { ok: true, displayPhone: validation.displayPhone };
}

/**
 * Disconnect (remove credentials from Firestore)
 */
async function disconnect(userId) {
    await store.deleteConnection(userId, 'whatsapp');
    console.log(`[WA Cloud:${userId.substring(0, 8)}] Disconnected`);
}

/**
 * Check if a user is connected
 */
async function isConnected(userId) {
    const conn = await store.getConnection(userId, 'whatsapp');
    return !!(conn?.accessToken);
}

/**
 * Get credentials for a user
 */
async function getCredentials(userId) {
    return store.getConnection(userId, 'whatsapp');
}

/**
 * Send text message via Cloud API
 */
async function sendMessage(userId, to, text) {
    const conn = await store.getConnection(userId, 'whatsapp');
    if (!conn?.accessToken) throw new Error('WhatsApp not connected');

    // Normalize phone number
    let normalized = String(to).replace(/@c\.us$/, '').replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = normalized.slice(1);

    const url = `${BASE_URL}/${conn.phoneNumberId}/messages`;
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
                Authorization: `Bearer ${conn.accessToken}`,
            },
            timeout: 15000,
        }
    );

    // Save outgoing message to Firestore
    const chatId = `wa_${normalized}`;
    await store.saveMessage(userId, chatId, {
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        incoming: false,
    });

    return res.data;
}

/**
 * Process webhook payload — save to Firestore per user, return parsed messages
 * NOTE: Webhooks are account-level (not per-user). We need to map the
 * phoneNumberId back to the user who connected it.
 */
async function processWebhookPayload(body, io) {
    const results = [];
    if (body.object !== 'whatsapp_business_account') return results;

    const entries = body.entry || [];
    for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
            if (change.field !== 'messages') continue;
            const value = change.value || {};
            const metadata = value.metadata || {};
            const phoneNumberId = metadata.phone_number_id;
            const messages = value.messages || [];
            const contacts = value.contacts || [];
            const fromIndex = {};

            for (const c of contacts) {
                if (c.wa_id) fromIndex[c.wa_id] = c.profile?.name || c.wa_id;
            }

            // Find which user owns this phoneNumberId
            // For now, we'll broadcast and let the frontend filter
            // In a multi-user production app, you'd query Firestore for the owner

            for (const msg of messages) {
                const from = msg.from;
                const name = fromIndex[from] || from;
                const chatId = `wa_${from}`;
                let text = '';
                const timestamp = msg.timestamp;

                if (msg.type === 'text' && msg.text) {
                    text = msg.text.body || '';
                } else if (msg.type === 'button' && msg.button?.text) {
                    text = msg.button.text;
                } else if (msg.type) {
                    text = `[${msg.type}]`;
                }

                const time = timestamp
                    ? new Date(parseInt(timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                results.push({
                    chatId,
                    from,
                    name,
                    text,
                    time,
                    id: msg.id,
                    phoneNumberId,
                    timestamp,
                });
            }
        }
    }
    return results;
}

/**
 * Get all WhatsApp threads from Firestore
 */
async function getThreads(userId) {
    return store.getInbox(userId, 'whatsapp');
}

/**
 * Extract phone number from chatId
 */
function chatIdToPhoneNumber(chatId) {
    if (!chatId) return null;
    if (typeof chatId === 'string' && chatId.startsWith('wa_')) {
        return chatId.replace(/^wa_/, '');
    }
    return String(chatId).replace(/@c\.us$/, '').replace(/\D/g, '');
}

/** Verify token for Meta webhook subscription */
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
    chatIdToPhoneNumber,
    getVerifyToken,
    validateCredentials,
};
