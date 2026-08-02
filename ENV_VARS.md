# Noor — Environment Variables (Vercel)

Add these in your Vercel project → **Settings → Environment Variables** (production + preview).

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key (cloud account backup & sync) |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender id |
| `VITE_FIREBASE_APP_ID` | Firebase web app id |
| `VITE_GEMINI_API_KEY` | Google AI Studio (Gemini) API key — powers Noor AI chat |
| `VITE_GEMINI_MODEL` | `gemini-flash-latest` (default) |

> Vite only exposes `VITE_`-prefixed vars to the browser — the prefix is required.
> Never commit real values; `.env.local` is gitignored.
