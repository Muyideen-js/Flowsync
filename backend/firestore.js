/**
 * firestore.js — Firebase Admin SDK for server-side Firestore access
 *
 * Provides persistent storage for:
 *   - Platform connections (tokens, bot tokens, OAuth credentials)
 *   - Inbox messages (per-user, per-platform)
 *   - Connection states
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin — supports env var (for cloud) or local file (for dev)
let db;
try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Cloud deployment: parse JSON from environment variable
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        // Local dev: load from file
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
            || path.join(__dirname, 'serviceAccountKey.json');
        serviceAccount = require(serviceAccountPath);
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    console.log('[Firestore] ✅ Admin SDK initialized');
} catch (err) {
    console.error('[Firestore] ❌ Failed to initialize:', err.message);
    console.error('[Firestore] Set FIREBASE_SERVICE_ACCOUNT env var, or place serviceAccountKey.json in backend/');
    db = null;
}

/* ─────────────────────────────────────────────────────────
   Connection Helpers
   ───────────────────────────────────────────────────────── */

/**
 * Get all connections for a user
 * @returns {{ telegram?: object, whatsapp?: object, twitter?: object }}
 */
async function getUserConnections(userId) {
    if (!db) return {};
    try {
        const snap = await db.collection('users').doc(userId)
            .collection('connections').get();
        const result = {};
        snap.forEach(doc => { result[doc.id] = doc.data(); });
        return result;
    } catch (err) {
        console.error(`[Firestore] getUserConnections error:`, err.message);
        return {};
    }
}

/**
 * Get a specific platform connection
 */
async function getConnection(userId, platform) {
    if (!db) return null;
    try {
        const doc = await db.collection('users').doc(userId)
            .collection('connections').doc(platform).get();
        return doc.exists ? doc.data() : null;
    } catch (err) {
        console.error(`[Firestore] getConnection error:`, err.message);
        return null;
    }
}

/**
 * Set/update a platform connection
 */
async function setConnection(userId, platform, data) {
    if (!db) return;
    try {
        await db.collection('users').doc(userId)
            .collection('connections').doc(platform)
            .set(data, { merge: true });
    } catch (err) {
        console.error(`[Firestore] setConnection error:`, err.message);
    }
}

/**
 * Delete a platform connection
 */
async function deleteConnection(userId, platform) {
    if (!db) return;
    try {
        await db.collection('users').doc(userId)
            .collection('connections').doc(platform).delete();
    } catch (err) {
        console.error(`[Firestore] deleteConnection error:`, err.message);
    }
}

/* ─────────────────────────────────────────────────────────
   Inbox / Messages Helpers
   ───────────────────────────────────────────────────────── */

/**
 * Save or update a chat thread header
 */
async function saveThread(userId, chatId, threadData) {
    if (!db) return;
    try {
        await db.collection('users').doc(userId)
            .collection('inbox').doc(chatId)
            .set(threadData, { merge: true });
    } catch (err) {
        console.error(`[Firestore] saveThread error:`, err.message);
    }
}

/**
 * Save a message to a thread's messages subcollection
 */
async function saveMessage(userId, chatId, message) {
    if (!db) return;
    try {
        const msgId = message.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await db.collection('users').doc(userId)
            .collection('inbox').doc(chatId)
            .collection('messages').doc(msgId)
            .set({ ...message, timestamp: admin.firestore.FieldValue.serverTimestamp() });

        // Update thread header with last message
        await db.collection('users').doc(userId)
            .collection('inbox').doc(chatId)
            .set({
                lastMessage: message.text?.substring(0, 100) || '',
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                unread: message.incoming ? true : undefined,
            }, { merge: true });
    } catch (err) {
        console.error(`[Firestore] saveMessage error:`, err.message);
    }
}

/**
 * Get all inbox threads for a user (optionally filter by platform)
 */
async function getInbox(userId, platform = null) {
    if (!db) return [];
    try {
        let query = db.collection('users').doc(userId).collection('inbox');
        if (platform) query = query.where('platform', '==', platform);
        query = query.orderBy('lastMessageAt', 'desc').limit(50);

        const snap = await query.get();
        const threads = [];
        for (const doc of snap.docs) {
            const data = doc.data();
            // Fetch last 15 messages
            const msgSnap = await db.collection('users').doc(userId)
                .collection('inbox').doc(doc.id)
                .collection('messages')
                .orderBy('timestamp', 'desc').limit(15)
                .get();
            const messages = [];
            msgSnap.forEach(m => messages.unshift(m.data()));
            threads.push({ id: doc.id, ...data, messages });
        }
        return threads;
    } catch (err) {
        console.error(`[Firestore] getInbox error:`, err.message);
        return [];
    }
}

/**
 * Mark a thread as read
 */
async function markThreadRead(userId, chatId) {
    if (!db) return;
    try {
        await db.collection('users').doc(userId)
            .collection('inbox').doc(chatId)
            .set({ unread: false }, { merge: true });
    } catch (err) {
        console.error(`[Firestore] markThreadRead error:`, err.message);
    }
}

module.exports = {
    db,
    getUserConnections,
    getConnection,
    setConnection,
    deleteConnection,
    saveThread,
    saveMessage,
    getInbox,
    markThreadRead,
};
