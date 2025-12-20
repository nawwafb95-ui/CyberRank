# OTP Feature Fix Summary

## 🔴 Root Cause Identified

The **"Failed to generate OTP"** error on your machine is caused by **one or more of these issues:**

### **PRIMARY ROOT CAUSE: Missing Environment Variables**

**File:** `functions/index.js:11-12`

The Cloud Functions require:
- `RESEND_API_KEY` - API key for Resend email service
- `FROM_EMAIL` - Verified email address for sending

**Why it works on teammate's machine:**
- They have a `functions/.env` file with these variables configured
- This file is in `.gitignore` (correctly), so it's not in the repository

**Why it fails on your machine:**
- No `functions/.env` file exists
- Environment variables are `undefined`
- While the code handles missing email config gracefully, **if Firestore emulator is also not running, the database write fails → "Failed to generate OTP"**

---

### **SECONDARY ROOT CAUSE: Firebase Emulators Not Running**

**Files:** 
- `public/js/otp.js:1`
- `public/js/signup.js:175`

The frontend code expects:
- **Functions Emulator** on `http://localhost:5001`
- **Firestore Emulator** on `http://localhost:8080`

**Why it works on teammate's machine:**
- They have emulators running in the background
- They may have a script or process manager keeping them alive

**Why it fails on your machine:**
- Emulators are not started
- Network requests to `localhost:5001` fail with connection errors

---

### **TERTIARY ROOT CAUSE: CORS Configuration**

**File:** `functions/index.js:13`

Previously hardcoded to only allow `http://localhost:5173`.

**Why it works on teammate's machine:**
- They're running frontend on port 5173 (Vite default)

**Why it fails on your machine:**
- If you're using a different port (3000, 8080, etc.), CORS blocks the request

---

## ✅ Fixes Applied

### **Fix 1: Flexible CORS Configuration**

**File:** `functions/index.js`

**Changes:**
- Now allows **any localhost origin** (any port) for development
- Supports `ALLOWED_ORIGINS` environment variable for production
- Better error logging for CORS issues

**Before:**
```javascript
const ALLOWED_ORIGIN = "http://localhost:5173";
if (origin !== ALLOWED_ORIGIN) {
  return res.status(403).send("CORS blocked");
}
```

**After:**
```javascript
// Allows any localhost origin in development
if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
  return true;
}
```

---

### **Fix 2: Improved Error Messages**

**File:** `functions/index.js`

**Changes:**
- Database errors now indicate if Firestore emulator is not running
- More descriptive error messages to help diagnose issues

**Example error message:**
```
"Failed to generate OTP: Firestore emulator not running. Start with: firebase emulators:start"
```

---

### **Fix 3: Environment Variables Template**

**File:** `functions/env.template`

Created a template file that documents required environment variables:
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `ALLOWED_ORIGINS` (optional)

**Usage:**
```bash
cd functions
cp env.template .env
# Edit .env with your actual values
```

---

### **Fix 4: Setup Documentation**

**File:** `SETUP.md`

Created comprehensive setup guide covering:
- Prerequisites
- Step-by-step installation
- Environment variable configuration
- Starting emulators
- Troubleshooting common issues

---

## 🚀 How to Fix Your Local Environment

### **Step 1: Create Environment Variables File**

```bash
cd functions
cp env.template .env
```

Edit `functions/.env`:
```env
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=onboarding@resend.dev
```

**Get Resend API Key:**
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create new API key
4. Copy the key (starts with `re_`)

**Note:** For testing, you can use `onboarding@resend.dev` as `FROM_EMAIL` (pre-verified by Resend).

---

### **Step 2: Start Firebase Emulators**

```bash
# In project root
firebase emulators:start
```

**Verify:**
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

**Keep this terminal open** - emulators must stay running.

---

### **Step 3: Start Frontend**

In a **new terminal**:

```bash
# Option A: Vite dev server (if using React app)
npm run dev

# Option B: Static server (if using legacy HTML)
npx http-server public -p 8000
```

---

### **Step 4: Test OTP**

1. Navigate to signup page
2. Fill form and submit
3. Check:
   - **Browser console** - should show successful request
   - **Emulator terminal** - should show OTP generation logs
   - **Emulator UI** (http://localhost:4000) - should show function execution

---

## 📋 Verification Checklist

After applying fixes, verify:

- [ ] `functions/.env` file exists with `RESEND_API_KEY` and `FROM_EMAIL`
- [ ] Firebase emulators are running (`firebase emulators:start`)
- [ ] Can access Functions emulator: http://localhost:5001
- [ ] Can access Firestore emulator: http://localhost:8080
- [ ] Frontend dev server is running
- [ ] Browser console shows no CORS errors
- [ ] Signup form submits successfully
- [ ] OTP page loads and shows email address
- [ ] OTP can be verified (check emulator logs for OTP code if email not sent)

---

## 🔍 Debugging Tips

### **Check Emulator Logs**

When you submit the signup form, check the emulator terminal for:
```
[sendOtp] Generated OTP for user@example.com
[sendOtp] OTP for user@example.com is: 123456
```

If email is not configured, the OTP will be printed here.

### **Check Browser Console**

Open browser DevTools → Console, look for:
```
[Signup] Sending OTP request to: http://localhost:5001/cyberrank-a4380/us-central1/sendOtp
[Signup] Response status: 200 OK
```

### **Check Network Tab**

Open browser DevTools → Network:
- Find the request to `/sendOtp`
- Check status code (should be 200)
- Check response body for error messages

### **Common Error Messages**

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Failed to generate OTP" | Firestore emulator not running | Start emulators: `firebase emulators:start` |
| "Network error. Is the emulator running?" | Functions emulator not running | Start emulators: `firebase emulators:start` |
| "CORS blocked: origin not allowed" | Frontend origin mismatch | Fixed - now allows any localhost origin |
| "RESEND_API_KEY is not configured" | Missing `.env` file | Create `functions/.env` with API key |
| "ECONNREFUSED" | Emulator not running | Start emulators |

---

## 📝 Files Modified

1. **`functions/index.js`**
   - Updated CORS to allow any localhost origin
   - Improved error messages for database connection issues
   - Better logging

2. **`functions/env.template`** (NEW)
   - Template for environment variables
   - Documentation for each variable

3. **`SETUP.md`** (NEW)
   - Complete setup guide
   - Troubleshooting section
   - Quick start checklist

4. **`OTP_DIAGNOSIS.md`** (NEW)
   - Detailed root cause analysis
   - File-by-file breakdown

---

## 🎯 Expected Behavior After Fixes

1. **With emulators running and `.env` configured:**
   - OTP is generated and stored in Firestore
   - Email is sent via Resend API
   - User receives email with OTP code

2. **With emulators running but no `.env`:**
   - OTP is generated and stored in Firestore
   - Email sending is skipped
   - OTP code is printed in emulator logs
   - User can check logs for OTP code

3. **Without emulators running:**
   - Request fails with connection error
   - Error message indicates emulator is not running

---

## ⚠️ Important Notes

1. **`.env` file is not committed to Git** - This is correct for security. Each developer needs their own copy.

2. **Emulators must stay running** - Keep the terminal with `firebase emulators:start` open while developing.

3. **Resend API Key** - You need a Resend account to send emails. For testing without email, check emulator logs for OTP codes.

4. **Firebase Project ID** - The project ID `cyberrank-a4380` is hardcoded in URLs. This matches your `.firebaserc` file.

---

## 🆘 Still Having Issues?

1. **Check emulator logs** - Most errors are logged there
2. **Check browser console** - Network errors and CORS issues appear here
3. **Verify `.env` file** - Ensure it's in `functions/` directory, not root
4. **Restart emulators** - After creating/updating `.env`, restart emulators
5. **Check ports** - Ensure ports 5001, 8080, 4000 are not in use

For more details, see `SETUP.md` and `OTP_DIAGNOSIS.md`.

