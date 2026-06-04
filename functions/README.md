# Daily Haiku — Cloud Functions

HTTPS Callable functions that proxy OpenAI calls so the API key never ships in
the mobile bundle.

- `generateHaiku({ theme, tier })` → `{ line1, line2, line3 }`
- `generateHaikuImage({ lines, theme })` → `{ base64Data, mimeType }`

## Setup (one-time)

```bash
# 1. Install Firebase CLI globally if you haven't
npm install -g firebase-tools

# 2. Sign in
firebase login

# 3. Confirm the project alias is correct
cat ../.firebaserc   # → "dailyhaikuandroidios"

# 4. Set the OpenAI API key as a secret
firebase functions:secrets:set OPENAI_API_KEY
# Paste the key when prompted. It's stored in Google Secret Manager,
# never in source.
```

## Deploy

```bash
cd functions   # or run from repo root, both work
npm run build
npm run deploy
```

Or from the repo root: `firebase deploy --only functions`.

## Local emulator

```bash
npm run serve
# Functions emulator runs on http://localhost:5001
# Emulator UI on http://localhost:4000
```

To make the app talk to the emulator instead of production functions, set
`EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR=true` in the app's `.env` and restart Metro.

## Logs

```bash
npm run logs                       # last 200 entries
firebase functions:log -n 50       # last 50
firebase functions:log --only generateHaiku
```

Or in the Firebase Console: Functions → Logs.

## Updating the OpenAI key

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions   # redeploy so functions pick up the new value
```

## Costs

- Functions invocations: 2M free / month, then $0.40/M.
- Secret Manager: 6 secrets free.
- Outbound networking (calls to OpenAI): 5 GB free / month — image responses
  are ~1–3 MB base64, so you'd hit the free tier limit at ~2,000 images/month.

The dominant cost is OpenAI itself (text ~$0.0001/call, image ~$0.17/call).
