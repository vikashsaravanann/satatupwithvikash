# Vikash's AI Portfolio Platform

This repository contains the source code for Vikash's professional developer portfolio. It features a custom AI Chatbot, automated workflow bridges, a unified serverless contact delivery backend, and a premium modern UI design.

## Recent UI/UX Enhancements
We recently undertook a comprehensive redesign to ensure the portfolio reflects enterprise-level standards:
* **Component Restyling**:
  * Transformed the "Get In Touch" and "Visitor Guest Book" forms into sharp, fully-covered rectangular layouts (`100%` width, `8px` border radius) for a sleek, modern appearance without awkward gaps.
  * Reordered the footer widgets to prioritize key information: *About the Engineer*, *Contact Card*, *Quick Actions*, and *Digital Presence*.
  * Cleaned up the "Quick Actions" and "Digital Presence" link lists, removing boxed borders and backgrounds, and utilizing a unified professional accent color (`#0ea5e9`) for all icons.
* **Typography & Styling**: Upgraded the "About Me" section and headers using the professional 'Outfit' font (bold), enhancing visual hierarchy and readability.
* **Integrations**: Integrated a dynamic LinkedIn profile badge block directly into the UI.
* **AI Chatbot**: Fixed click-handling bugs in the AI Chatbot's send button and quick-action chips to ensure lightning-fast responsiveness.

## Contact Form Backend Configuration

Both contact forms (the main footer contact form and the interactive form inside the AI Chatbot bubble) submit messages directly to the unified backend route `/api/contact`.

To receive incoming contact messages, configure **any** of the following notification channels in your local `.env` file or Vercel Environment Variables dashboard. The backend will automatically detect and route messages to all configured systems:

### 1. Discord Webhooks (Recommended & Free)
Deliver form submissions directly as rich cards to a Discord server channel:
* `DISCORD_WEBHOOK_URL`: The webhook URL copied from your Discord channel settings.

### 2. Telegram Bot (Free)
Deliver form submissions as instant alerts directly to your phone via Telegram:
* `TELEGRAM_BOT_TOKEN`: The HTTP API token received from `@BotFather`.
* `TELEGRAM_CHAT_ID`: Your private Telegram user chat ID (you can get this by messaging `@userinfobot`).

### 3. SMTP Emails (Nodemailer)
Deliver submissions directly to your email inbox:
* `SMTP_HOST`: The SMTP server host address (e.g., `smtp.gmail.com`).
* `SMTP_PORT`: The connection port, typically `465` (SSL/TLS) or `587` (STARTTLS).
* `SMTP_USER`: The sender email address.
* `SMTP_PASS`: The sender account password (if using Gmail, generate and use a secure **App Password**).
* `CONTACT_RECEIVER_EMAIL`: The inbox address where you want to receive these messages (defaults to `vikash07052008@gmail.com` if left blank).

---

## Local Development

1. Install local dependencies:
   ```bash
   npm install
   ```
2. Start the local Express bridge server:
   ```bash
   npm start
   ```
3. Open `index.html` in your browser. The frontend will automatically detect localhost and route form submissions and chatbot completions to `http://localhost:3000`.
