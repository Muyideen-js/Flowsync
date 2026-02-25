# ── Base image: Node 20 on Debian slim ──────────────────────
FROM node:20-slim

# No Chromium/Puppeteer needed — using WhatsApp Cloud API

# ── App setup ───────────────────────────────────────────────
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

EXPOSE 5000
ENV PORT=5000

CMD ["node", "server.js"]
