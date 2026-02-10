// Twitter Service - OAuth version
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

class TwitterService {
    // Get OAuth authorization URL
    async getAuthUrl() {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/auth-url`);
            return response.data;
        } catch (error) {
            console.error('Error getting Twitter auth URL:', error);
            throw error;
        }
    }

    // Check connection status
    async checkStatus() {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/twitter/status`);
            return response.data;
        } catch (error) {
            console.error('Error checking Twitter status:', error);
            return { success: false, connected: false };
        }
    }

    // Post tweet (requires authentication)
    async postTweet(text) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/twitter/tweet`, { text });
            return response.data;
        } catch (error) {
            console.error('Error posting tweet:', error);
            throw error;
        }
    }
}

export default new TwitterService();
