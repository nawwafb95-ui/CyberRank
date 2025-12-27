# Quick Signup Fix Checklist

## Code Changes Applied ✅

1. **`public/js/signup.js`** - Added explicit error logging
   - `console.error('SIGNUP_ERROR', err.code, err.message, err);`
   - Error code displayed in UI: `[Error Code: auth/xxx]`

2. **`public/js/errorMessages.js`** - Added `auth/unauthorized-domain` error message

## Immediate Action Required

### Step 1: Deploy Code
```bash
firebase deploy --only hosting
```

### Step 2: Check Browser Console for Error Code

1. Go to `https://socyberx.com/signup`
2. Open DevTools (F12) → Console tab
3. Fill signup form and submit
4. Look for: `SIGNUP_ERROR auth/xxx ...`
5. Note the error code

### Step 3: Fix Based on Error Code

**If `auth/unauthorized-domain`:**
- Firebase Console → Authentication → Settings → Authorized domains
- Add: `socyberx.com`
- Add: `www.socyberx.com`
- Wait 1-2 minutes, retry signup

**If `auth/operation-not-allowed`:**
- Firebase Console → Authentication → Sign-in method
- Click Email/Password
- Toggle **Enable** to ON
- Save
- Wait 1-2 minutes, retry signup

**If `403 Forbidden`:**
- Google Cloud Console → APIs & Services → Credentials
- Find Firebase Web API Key
- Check HTTP referrer restrictions
- Add `socyberx.com` or set to None temporarily
- Save, wait a few minutes, retry

**If success (no error):**
- Check Firebase Console → Authentication → Users
- User should appear in list ✅

## Verification

After fix:
- [ ] Error code visible in console: `SIGNUP_ERROR auth/xxx`
- [ ] Error code visible in UI: `[Error Code: auth/xxx]`
- [ ] Firebase Console configured (domain added OR provider enabled)
- [ ] Signup creates user in Firebase Authentication
- [ ] User document created in Firestore at `users/{uid}`

