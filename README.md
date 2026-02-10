# FlowSync - AI-Powered Social Media Automation Platform

![FlowSync](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

FlowSync is a modern social media automation platform that connects your Twitter (X) and Telegram accounts, enabling AI-powered content management, scheduling, and automation.

## ✨ Features

- 🔐 **OAuth 2.0 Authentication** - Secure login with Twitter and Telegram
- 🤖 **AI-Powered Automation** - Create intelligent workflows for your social media
- 📅 **Smart Scheduling** - Schedule posts across multiple platforms
- 📊 **Analytics Dashboard** - Track engagement and performance metrics
- 💬 **Unified Inbox** - Manage all messages in one place
- 🎨 **Modern UI** - Clean, minimal dark theme interface

## 🚀 Live Demo

**[View Live Demo](https://ai-automation-app.vercel.app)**

## 📸 Screenshots


## 🛠️ Tech Stack

**Frontend:**
- React.js 18
- React Router
- Axios
- Framer Motion (animations)
- Vanilla CSS

**Backend:**
- Node.js
- Express.js
- OAuth 2.0
- Telegram Bot API
- Twitter API v2

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Twitter Developer Account
- Telegram Bot Token

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/flowsync.git
cd flowsync
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Set up environment variables**

Create `backend/.env`:
```env
PORT=5000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

4. **Run the application**

```bash
# Terminal 1 - Run backend
cd backend
npm start

# Terminal 2 - Run frontend
npm start
```

Frontend: http://localhost:3000  
Backend: http://localhost:5000

## 🌐 Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/flowsync)

### Manual Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/muyideen-js/flowsync.git
git push -u origin main
```

2. **Import to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Add environment variables in Settings
- Deploy!

3. **Add Environment Variables in Vercel**
- `TELEGRAM_BOT_TOKEN`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`

4. **Update Twitter Callback URL**
- Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- Update callback URL to: `https://your-app.vercel.app/api/twitter/callback`

## 🔑 Getting API Credentials

### Twitter OAuth 2.0
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Enable OAuth 2.0
4. Set callback URL: `https://your-domain.com/api/twitter/callback`
5. Copy Client ID and Client Secret

### Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Update bot username in `backend/server.js`

## 📁 Project Structure

```
flowsync/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── Sidebar/
│   │   ├── Button/
│   │   └── Card/
│   ├── pages/          # Page components
│   │   ├── Landing/
│   │   ├── Dashboard/
│   │   ├── Inbox/
│   │   ├── Automation/
│   │   └── Scheduling/
│   ├── services/       # API services
│   │   ├── telegramService.js
│   │   └── twitterService.js
│   └── App.js
├── backend/
│   ├── server.js       # Express server with OAuth
│   ├── package.json
│   └── .env
├── vercel.json         # Vercel configuration
└── package.json
```

## 🎯 Features Roadmap

- [x] Twitter OAuth 2.0 integration
- [x] Telegram Bot integration
- [x] Dashboard UI
- [x] Platform connection management
- [ ] Instagram integration
- [ ] WhatsApp Business integration
- [ ] AI-powered content generation
- [ ] Advanced analytics
- [ ] Multi-user support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name**
- GitHub: (https://github.com/muyideen-js)
- Twitter: (https://twitter.com/yaomin_dev)

## 🙏 Acknowledgments

- Twitter API v2
- Telegram Bot API
- React.js community
- Vercel for hosting

