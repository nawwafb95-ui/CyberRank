# Local Development Setup Guide

## Prerequisites

- Node.js 20+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project access (cyberrank-a4380)

## Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

## Step 2: Configure Environment Variables

**CRITICAL:** The OTP feature requires environment variables that are not committed to Git.

1. Create a `.env` file in the `functions/` directory:

```bash
cd functions
touch .env
```

2. Add the following content to `functions/.env`:

```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

3. **Get your Resend API Key:**
   - Sign up at https://resend.com
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

4. **Set FROM_EMAIL:**
   - For testing: Use `onboarding@resend.dev` (pre-verified by Resend)
   - For production: Use a verified domain email (e.g., `noreply@yourdomain.com`)

**Note:** The `.env` file is in `.gitignore` and will not be committed. Each developer needs their own copy.

## Step 3: Start Firebase Emulators

The OTP feature requires Firebase Functions and Firestore emulators to be running.

```bash
# Start all emulators
firebase emulators:start

# Or start only required services
firebase emulators:start --only functions,firestore
```

**Verify emulators are running:**
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

**Common Issues:**
- If port 5001 is already in use, check `firebase.json` for port configuration
- If you see "ECONNREFUSED" errors, the emulators are not running

## Step 4: Start Frontend Development Server

The frontend expects the Functions emulator on `localhost:5001`.

**Option A: Using Vite (React app)**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Option B: Using a static server (legacy HTML pages)**
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server public -p 8000
```

**Important:** The CORS configuration allows `localhost` on any port, so you can use any port for the frontend.

## Step 5: Test OTP Feature

1. Navigate to signup page
2. Fill in the form
3. Submit - this should trigger OTP generation
4. Check:
   - **Browser console** for request logs
   - **Emulator UI** (http://localhost:4000) for function logs
   - **Terminal** where emulators are running for detailed logs

## Troubleshooting

### Error: "Failed to generate OTP"

**Possible causes:**
1. **Firebase emulators not running**
   - Solution: Run `firebase emulators:start`
   - Verify: Check http://localhost:5001

2. **Missing environment variables**
   - Solution: Create `functions/.env` with `RESEND_API_KEY` and `FROM_EMAIL`
   - Verify: Check emulator logs for "Missing RESEND_API_KEY or FROM_EMAIL"

3. **Firestore connection error**
   - Solution: Ensure Firestore emulator is running (port 8080)
   - Check: Emulator UI at http://localhost:4000

4. **CORS error**
   - Solution: CORS now allows any localhost origin. If still blocked, check browser console for origin mismatch

### Error: "Network error. Is the emulator running?"

- **Cause:** Frontend cannot reach Functions emulator
- **Solution:** 
  1. Verify emulators are running: `firebase emulators:start`
  2. Check the URL in `public/js/otp.js` and `public/js/signup.js` matches your emulator port
  3. Check browser console for the exact endpoint being called

### Error: "CORS blocked: origin not allowed"

- **Cause:** Frontend origin doesn't match allowed origins
- **Solution:** The code now allows any `localhost` origin. If you're using a different hostname, add it to `ALLOWED_ORIGINS` in `functions/index.js` or set `ALLOWED_ORIGINS` env var

### OTP Generated but Email Not Sent

- **Cause:** Missing `RESEND_API_KEY` or `FROM_EMAIL`
- **Solution:** 
  1. Check `functions/.env` exists and has correct values
  2. Restart emulators after creating/updating `.env`
  3. Check emulator logs - OTP will be printed to console if email fails

### Check Emulator Logs for OTP

If email sending fails, the OTP code is logged to the emulator console:
```
[sendOtp] OTP for user@example.com is: 123456
```

## Development vs Production

**Development (Local):**
- Uses Firebase emulators
- Functions URL: `http://localhost:5001/cyberrank-a4380/us-central1`
- Environment variables from `functions/.env`

**Production:**
- Uses deployed Firebase Functions
- Functions URL: `https://us-central1-cyberrank-a4380.cloudfunctions.net/`
- Environment variables set in Firebase Console (Functions → Configuration → Environment Variables)

## Quick Start Checklist

- [ ] Installed dependencies (`npm install` in root and `functions/`)
- [ ] Created `functions/.env` with `RESEND_API_KEY` and `FROM_EMAIL`
- [ ] Started Firebase emulators (`firebase emulators:start`)
- [ ] Started frontend dev server
- [ ] Tested signup flow
- [ ] Checked browser console for errors
- [ ] Checked emulator logs for OTP codes (if email not configured)

