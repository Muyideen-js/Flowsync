// Telegram Service - OAuth version
import axios from 'axios';

const BACKEND_URL = 'https://flowsync-3fd5.onrender.com';

class TelegramService {
    // Get OAuth authorization URL
    async getAuthUrl() {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/telegram/auth-url`);
            return response.data;
        } catch (error) {
            console.error('Error getting Telegram auth URL:', error);
            throw error;
        }
    }

    // Check connection status
    async checkStatus() {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/telegram/status`);
            return response.data;
        } catch (error) {
            console.error('Error checking Telegram status:', error);
            return { success: false, connected: false };
        }
    }

    // Send message (requires authentication)
    async sendMessage(text) {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/telegram/send`, { text });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
}

const telegramService = new TelegramService();
export default telegramService;
