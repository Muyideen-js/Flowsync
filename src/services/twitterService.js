// Twitter Service - OAuth version (per-user)
import axios from 'axios';

const BACKEND_URL = 'https://flowsync-3fd5.onrender.com';

class TwitterService {
    // Get OAuth authorization URL — pass userId so backend stores tokens per-user
    async getAuthUrl(userId) {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/auth-url`, {
                params: { userId },
            });
            return response.data;
        } catch (error) {
            console.error('Error getting Twitter auth URL:', error);
            throw error;
        }
    }

    // Check connection status — per-user
    async checkStatus(userId) {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/status`, {
                params: { userId },
            });
            return response.data;
        } catch (error) {
            console.error('Error checking Twitter status:', error);
            return { success: false, connected: false };
        }
    }

    // Post tweet — per-user
    async postTweet(text, userId) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/twitter/tweet`, { text, userId });
            return response.data;
        } catch (error) {
            console.error('Error posting tweet:', error);
            throw error;
        }
    }

    // Disconnect Twitter — per-user
    async disconnect(userId) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/twitter/disconnect`, { userId });
            return response.data;
        } catch (error) {
            console.error('Error disconnecting Twitter:', error);
            throw error;
        }
    }

    // Get DMs — per-user
    async getDMs(userId) {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/dms`, {
                params: { userId },
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
