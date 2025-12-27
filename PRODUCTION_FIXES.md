# Production Deployment Fixes - SOCyberX

## Phase 1 — Diagnosis

### Issue 1: CORS Blocking Cloud Functions Requests
**Root Cause:** Cloud Functions `ALLOWED_ORIGINS` only included localhost origins, blocking requests from `https://socyberx.com` and `https://www.socyberx.com`.

**Location:** `functions/index.js` lines 16-24

**Why it breaks only in production:** Localhost origins are automatically allowed, but production domains must be explicitly added to the CORS allowlist.

**Status:** ✅ FIXED

---

### Issue 2: Config.js Domain Check
**Root Cause:** `config.js` checked for placeholder domain `'yourdomain.com'` instead of actual production domain `'socyberx.com'`.

**Location:** 
- `public/js/config.js` line 24
- `public/html/js/config.js` line 24

**Why it breaks only in production:** The fallback still works (returns production URL), but explicit domain check is better for clarity and potential future customizations.

**Status:** ✅ FIXED

---

### Issue 3: Emoji/Icons Not Rendering
**Root Cause:** CSS `font-family` declarations didn't include emoji font fallbacks, causing emojis to render as broken characters or not at all.

**Location:**
- `public/css/base.css` line 163
- `public/css/auth.css` line 3

**Why it breaks only in production:** Different font rendering behavior between local development and production hosting environments.

**Status:** ✅ FIXED

---

### Issue 4: Firebase Auth Domain Configuration (Manual Step Required)
**Root Cause:** Custom domain `socyberx.com` needs to be added to Firebase Console's authorized domains list.

**Location:** Firebase Console → Authentication → Settings → Authorized domains

**Why it breaks only in production:** Firebase Auth only allows requests from domains explicitly listed in the authorized domains list.

**Status:** ⚠️ REQUIRES MANUAL ACTION (see Phase 2)

---

## Phase 2 — Fixes Applied

### Fix 1: CORS Configuration
**File:** `functions/index.js`

**Change:**
```javascript
// BEFORE (lines 16-24)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ];

// AFTER
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "https://socyberx.com",
      "https://www.socyberx.com"
    ];
```

---

### Fix 2: Config.js Domain Recognition
**Files:** 
- `public/js/config.js`
- `public/html/js/config.js`

**Change:**
```javascript
// BEFORE (line 24)
if (hostname === 'yourdomain.com' || hostname === 'www.yourdomain.com') {

// AFTER
if (hostname === 'socyberx.com' || hostname === 'www.socyberx.com') {
```

---

### Fix 3: Emoji Font Fallbacks
**Files:**
- `public/css/base.css`
- `public/css/auth.css`

**Change in base.css (line 163):**
```css
/* BEFORE */
font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Arial, sans-serif;

/* AFTER */
font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

**Change in auth.css (line 3):**
```css
/* BEFORE */
font-family: "Inter", Arial, sans-serif;

/* AFTER */
font-family: "Inter", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

---

## Phase 3 — Deployment Commands

### Step 1: Deploy Cloud Functions (with CORS fix)
```bash
firebase deploy --only functions
```

**Expected output:** Functions deployed successfully. The `requestOtp`, `verifyOtp`, and `checkOtpStatus` functions will now accept requests from `https://socyberx.com` and `https://www.socyberx.com`.

---

### Step 2: Deploy Hosting (with config and CSS fixes)
```bash
firebase deploy --only hosting
```

**Expected output:** Hosting files deployed. Updated `config.js` and CSS files with emoji support are now live.

---

## Phase 4 — Manual Firebase Console Configuration

### Add Authorized Domains for Firebase Auth

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **cyberrank-a4380**
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add both domains:
   - `socyberx.com`
   - `www.socyberx.com`
6. Click **Done**

**Why this is needed:** Firebase Auth requires domains to be explicitly authorized. Without this, signup/login requests from your custom domain will be blocked.

**Note:** The default Firebase domain (`cyberrank-a4380.firebaseapp.com`) is already authorized and will continue to work.

---

## Phase 5 — Verification Checklist

### ✅ Signup Flow
1. Navigate to `https://socyberx.com/signup`
2. Fill in the signup form
3. Click "Sign Up"
4. **Expected:** OTP email is sent (if OTP enabled) OR account is created immediately
5. **Check browser console:** No CORS errors

### ✅ Login Flow
1. Navigate to `https://socyberx.com/login`
2. Enter email and password
3. Click "Login"
4. **Expected:** User is authenticated and redirected
5. **Check browser console:** No CORS errors

### ✅ OTP Verification (if enabled)
1. Complete signup form
2. **Expected:** Redirected to OTP verification page
3. Enter OTP code from email
4. **Expected:** OTP verified, account created
5. **Check browser console:** No CORS errors

### ✅ Emoji Rendering
1. Navigate to any page with emojis (login, signup, profile)
2. **Expected:** Eye emoji (👁️) displays correctly in password visibility toggles
3. **Expected:** All emojis render as proper Unicode characters, not broken symbols

### ✅ No Console Errors
1. Open browser DevTools (F12)
2. Navigate through signup/login flows
3. **Expected:** No CORS errors, no 403/404 errors from Cloud Functions
4. **Expected:** Config logs show correct `FUNCTIONS_BASE_URL` for production

---

## Additional Notes

### Environment Variables (Optional)
If you want to override CORS origins via environment variables instead of hardcoding:

1. Set in Firebase Functions environment:
```bash
firebase functions:config:set allowed_origins="https://socyberx.com,https://www.socyberx.com"
```

2. Or use `.env` file in `functions/` directory:
```env
ALLOWED_ORIGINS=https://socyberx.com,https://www.socyberx.com
```

**Note:** The current fix hardcodes the production domains in the default array, which works without additional configuration.

### Testing After Deployment

1. **Clear browser cache** to ensure new CSS and JS files are loaded
2. **Test in incognito/private window** to avoid cached files
3. **Check Network tab** in DevTools to verify:
   - Cloud Functions requests return 200 (not 403 CORS)
   - CSS files load with correct `Content-Type`
   - No 404 errors for assets

### Rollback (if needed)

If issues occur after deployment:

```bash
# Rollback hosting to previous version
firebase hosting:rollback

# Rollback functions (if needed)
# Note: Functions rollback requires manual version management
```

---

## Summary

**Files Modified:**
1. ✅ `functions/index.js` - Added production domains to CORS allowlist
2. ✅ `public/js/config.js` - Updated domain check to recognize socyberx.com
3. ✅ `public/html/js/config.js` - Updated domain check to recognize socyberx.com
4. ✅ `public/css/base.css` - Added emoji font fallbacks
5. ✅ `public/css/auth.css` - Added emoji font fallbacks

**Manual Steps Required:**
1. ⚠️ Add `socyberx.com` and `www.socyberx.com` to Firebase Auth authorized domains

**Deployment Commands:**
1. `firebase deploy --only functions`
2. `firebase deploy --only hosting`

**Expected Result:**
- ✅ Signup/login flows work correctly
- ✅ OTP requests succeed (no CORS errors)
- ✅ Emojis render properly
- ✅ No console errors in production

