# Vikash's AI Portfolio - Copilot Instructions

## Project Overview
This is a full-stack AI-powered portfolio website for Vikash Saravanan featuring:
- **Frontend**: Interactive chatbot, dynamic content, dark/light theme toggle
- **Backend**: Node.js/Express API with Groq LLM integration, analytics tracking, streaming responses
- **Deployment**: Express server (local) + Vercel serverless (production)
- **Tech Stack**: JavaScript (vanilla + Node.js), HTML/CSS, Express, node-fetch, Groq API, Analytics

## Build & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Add your XAI_API_KEY to .env

# Run local Express server
npm start
# Server runs on http://localhost:3000

# Verify it's working
curl http://localhost:3000
```

### Testing
```bash
# Run available tests (if present)
npm test

# Manual testing
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Who is Vikash?"}],"model":"grok-beta"}'

# Test analytics
curl http://localhost:3000/api/analytics
```

### Production Deployment
```bash
# Deploy to Vercel (configured via vercel.json)
vercel deploy --prod

# GitHub Pages deployment (automatic via gh-pages branch)
git push origin main
```

## Project Structure
```
.
├── .github/                   # GitHub-specific files
│   └── copilot-instructions.md
├── api/
│   ├── chat.js               # Vercel serverless chat endpoint
│   ├── analytics.js          # Analytics endpoint (Vercel)
│   └── contact.js            # Contact form submission
├── lib/
│   ├── analytics-store.js    # In-memory event store
│   ├── contact-delivery.js   # Email/contact handling
│   ├── http-utils.js         # CORS, security headers, rate limiting
│   └── rate-limit.js         # Rate limiter for API endpoints
├── assets/                    # Images, icons, data
├── index.html                # Main portfolio page
├── projects.html             # Projects showcase
├── chatbot.js                # Chat widget frontend logic
├── script.js                 # Portfolio page interactions
├── style.css                 # Unified styling (dark/light theme)
├── animations.js             # Animation library
├── particles.js              # Background particle effects
├── server.js                 # Express API server (local development)
├── package.json              # Dependencies & scripts
├── vercel.json               # Vercel configuration
└── .env.example              # Environment variables template
```

## Key Features & Implementation

### 1. AI Chatbot (chatbot.js)
- **Model Support**: grok-beta (primary), fallback retry on failure
- **Streaming**: SSE-based streaming parser for real-time response rendering
- **Memory Toggle**: Remember/forget mode (localStorage) with export capability
- **Analytics**: Track messages, responses, model changes, contact conversions
- **Input Validation**: 800-char limit, control character filtering
- **Fallback Badge**: Visual indicator when fallback model is used

### 2. Backend API (server.js + api/chat.js)
- **Endpoints**:
  - `POST /api/chat` - Chat completions with streaming
  - `GET/POST /api/analytics` - Event tracking and statistics
  - `POST /api/contact` - Contact form (with analytics tracking)
- **Features**:
  - Groq API integration with streaming support
  - Auto-retry with fallback model on primary failure
  - Input validation (message roles, content type, length)
  - Rate limiting per IP address
  - CORS-compliant cross-origin requests
  - Security headers (Helmet + custom)

### 3. Analytics (lib/analytics-store.js + api/analytics.js)
- **Privacy-First**: No message content stored, only event metadata
- **Event Types**: 'chat_message_sent', 'chat_response_received', 'model_changed', 'contact_conversion'
- **Storage**: In-memory (session-only; consider persistent DB for production)
- **Accessible**: GET /api/analytics returns aggregated stats

### 4. Styling & Theme (style.css)
- **Dark Mode**: Default with networking motif (particles.js)
- **Light Mode**: Optional toggle via navbar button (theme persisted in localStorage)
- **Responsive**: Mobile-first design with flexbox/grid
- **Animations**: Smooth transitions, hover effects, fade-ins
- **Components**:
  - Memory toggle (green when active)
  - Export button (blue)
  - Fallback badge (amber)
  - Theme toggle button in navbar

## Code Conventions

### Naming
- **Functions**: camelCase (e.g., `validateMessages`, `streamResponse`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_USER_CHARS`, `DEFAULT_MODEL`)
- **Classes/Constructors**: PascalCase (rare; mostly functional style)
- **Files**: kebab-case for utilities (`http-utils.js`), descriptive for pages (`index.html`)

### Error Handling
- **Frontend**: Try-catch for async operations, fallback UI states
- **Backend**: Return `{ ok: false, error: '...' }` for validation; stream 500 for server errors
- **API**: Expose error in response body; use appropriate HTTP status codes (400, 429, 500)

### Security
- **CORS**: Allowlist production domains + localhost; block * by default
- **Rate Limiting**: Per-IP windows (contact: 8/15min, chat: 20/60s)
- **Input Validation**: Sanitize message roles, check content type, limit payload size
- **Headers**: CSP, X-Content-Type-Options, X-Frame-Options (via Helmet)

### Performance
- **Image Lazy-Loading**: Skip first 2 images (protect LCP metric)
- **Preconnect Hints**: Link to API origins in index.html
- **Streaming**: SSE for progressive response rendering
- **CSS**: Unified single stylesheet; no CSS-in-JS

## Environment Variables
See `.env.example` for template. Required:
- `XAI_API_KEY` - Groq API key (register at console.groq.com)
- `ALLOWED_ORIGINS` - CORS allowlist (e.g., "http://localhost:3000,https://example.com")
- Optional: Rate limit tuning, body size limits, port number

## Common Tasks

### Add a New Model
1. Update `DEFAULT_MODEL` or add to allowlist in `server.js` + `api/chat.js`
2. Verify model exists in Groq's API
3. Test chat endpoint with `?model=new-model-id`

### Debug Streaming Issues
1. Check browser DevTools Network tab for SSE response
2. Verify `Content-Type: text/event-stream` in response headers
3. Ensure `x-fallback-used` header is present for badge display
4. Test with curl: `curl 'http://localhost:3000/api/chat' -d '...'` to see raw SSE format

### Test Analytics
1. Send chat message → check `POST /api/analytics` in Network tab
2. Verify event JSON: `{ type: 'chat_message_sent', data: {...} }`
3. GET `/api/analytics` to view aggregated stats

### Deploy Changes
1. Commit locally: `git add . && git commit -m "feat: your change"`
2. Push to main: `git push origin main` (triggers GitHub Actions if configured)
3. Verify on production URL (GitHub Pages or Vercel domain)
4. Check browser console for errors; use analytics endpoint to verify event tracking

## Troubleshooting

### Changes not showing on GitHub.io
- **Cause**: GitHub Pages cache or build delay
- **Fix**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- **Alternative**: Check if gh-pages branch was updated: `git branch -r | grep gh-pages`

### Chatbot not responding
- **Check**: XAI_API_KEY is set in .env and valid
- **Check**: Network tab shows 200 or streaming response
- **Check**: Browser console for JavaScript errors
- **Fallback**: Primary model failure triggers retry; check x-fallback-used header

### Rate limiting / 429 errors
- **Cause**: Too many requests from same IP
- **Fix**: Adjust `CHAT_RATE_LIMIT_MAX` in .env or wait for window to reset

## Future Enhancements
- Persistent analytics storage (MongoDB, Postgres)
- Multi-language support
- Advanced memory (pinecone or similar for semantic recall)
- Webhook integrations for contact notifications
- Custom background patterns (currently using particles.js)

## Resources
- **Groq API Docs**: https://console.groq.com/docs/speech-text
- **Vercel Docs**: https://vercel.com/docs
- **Express.js**: https://expressjs.com/
- **CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

---

**Last Updated**: May 26, 2026
**Maintained By**: Vikash Saravanan & GitHub Copilot
