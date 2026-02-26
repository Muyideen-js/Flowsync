// Twitter Service - OAuth version (per-user)
import axios from 'axios';

const BACKEND_URL = 'https://flowsync-3fd5.onrender.com';

class TwitterService {
    // Get OAuth authorization URL — send Firebase ID token for auth
    async getAuthUrl(token) {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/auth-url`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Error getting Twitter auth URL:', error);
            throw error;
        }
    }

    // Check connection status — authenticated via token
    async checkStatus(token) {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Error checking Twitter status:', error);
            return { success: false, connected: false };
        }
    }

    // Post tweet — authenticated via token
    async postTweet(text, token) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/twitter/tweet`, { text }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Error posting tweet:', error);
            throw error;
        }
    }

    // Disconnect Twitter — authenticated via token
    async disconnect(token) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/twitter/disconnect`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Error disconnecting Twitter:', error);
            throw error;
        }
    }

    // Get DMs — authenticated via token
    async getDMs(token) {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/dms`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching DMs:', error);
            return { success: false, data: null };
        }
    }
}

const twitterService = new TwitterService();
export default twitterService;
