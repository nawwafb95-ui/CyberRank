# Signup Production Fix - Error Code Exposure & Firebase Console Setup

## Changes Applied

### 1. Enhanced Error Logging in `public/js/signup.js`

**Patch:**
```diff
      } catch (err) {
+       // ALWAYS log the exact Firebase error code, message, and full error object
+       console.error('SIGNUP_ERROR', err.code, err.message, err);
+       
        // Use centralized error handling
        const friendlyMsg = handleError('signup-form', err, {
          errorType: 'form',
          logToConsole: true
        });
        
+       // Display error code in UI along with friendly message
+       let displayMessage = friendlyMsg;
+       if (err.code) {
+         displayMessage = `${friendlyMsg} [Error Code: ${err.code}]`;
+       }
        
        // Also set field-specific errors for better UX
        if (err.code === 'auth/email-already-in-use') {
          handleError('signup-email', err, { errorType: 'field' });
        } else if (err.code === 'auth/weak-password') {
          handleError('signup-password', err, { errorType: 'field' });
        } else if (err.code === 'auth/invalid-email') {
          handleError('signup-email', err, { errorType: 'field' });
        }
        
        // Update status element if it exists
        if (signupStatus) {
-         signupStatus.textContent = friendlyMsg;
+         signupStatus.textContent = displayMessage;
          signupStatus.className = 'error';
        }
      }
```

### 2. Added `auth/unauthorized-domain` Error Code Support

**File: `public/js/errorMessages.js`**
```diff
  'auth/invalid-credential': 'Invalid email or password. Please try again. (بريد إلكتروني أو كلمة مرور غير صحيحة. يرجى المحاولة مرة أخرى)',
+ 'auth/unauthorized-domain': 'This domain is not authorized. Please contact support. (هذا النطاق غير مخول. يرجى الاتصال بالدعم)',
```

---

## Common Production Signup Failures

### 1. `auth/unauthorized-domain`
**Cause:** Custom domain `socyberx.com` not added to Firebase Authorized domains

**Fix:** Add domain in Firebase Console (see steps below)

### 2. `auth/operation-not-allowed`
**Cause:** Email/Password sign-in provider is disabled

**Fix:** Enable Email/Password provider in Firebase Console (see steps below)

### 3. API Key Restrictions (403 Forbidden)
**Cause:** Firebase API key has HTTP referrer restrictions blocking `socyberx.com`

**Fix:** Update API key restrictions in Google Cloud Console

---

## Firebase Console Configuration Steps

### Step 1: Add Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`cyberrank-a4380`)
3. Navigate to: **Authentication** → **Settings** → **Authorized domains** tab
4. Click **Add domain**
5. Enter: `socyberx.com`
6. Click **Add**
7. Repeat for: `www.socyberx.com` (if needed)
8. Save

**Current authorized domains should include:**
- `localhost` (for development)
- `socyberx.com` ✅ **ADD THIS**
- `www.socyberx.com` ✅ **ADD THIS** (optional but recommended)

**Note:** Firebase automatically includes:
- `[project-id].web.app`
- `[project-id].firebaseapp.com`

---

### Step 2: Enable Email/Password Sign-in Provider

1. In Firebase Console, go to: **Authentication** → **Sign-in method**
2. Find **Email/Password** in the list
3. Click on **Email/Password**
4. Toggle **Enable** to ON
5. Ensure **Email link (passwordless sign-in)** is set as desired (usually OFF)
6. Click **Save**

**Verify:**
- **Email/Password** should show status: **Enabled** ✅

---

### Step 3: Check API Key Restrictions (If Still Failing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `cyberrank-a4380`
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your Firebase **Web API Key** (starts with `AIza...`)
5. Click on the API key name
6. Under **Application restrictions**:
   - If set to **HTTP referrers**, ensure `socyberx.com` and `www.socyberx.com` are in the list
   - Or temporarily set to **None** for testing (then restrict after verification)
7. Click **Save**

**Note:** Changes to API key restrictions can take a few minutes to propagate.

---

## Verification Checklist

After deploying the code and configuring Firebase Console:

- [ ] **Code deployed:**
  - `public/js/signup.js` includes `console.error('SIGNUP_ERROR', ...)`
  - Error code displays in UI: `[Error Code: auth/xxx]`

- [ ] **Firebase Console - Authorized domains:**
  - Go to Authentication → Settings → Authorized domains
  - Verify `socyberx.com` is in the list
  - Verify `www.socyberx.com` is in the list (if used)

- [ ] **Firebase Console - Sign-in method:**
  - Go to Authentication → Sign-in method
  - Verify Email/Password is **Enabled**

- [ ] **Test signup in production:**
  1. Go to `https://socyberx.com/signup`
  2. Fill form with valid data
  3. Click "Sign Up"
  4. Open Browser DevTools → Console tab
  5. Look for: `SIGNUP_ERROR` log with error code
  6. Check if error appears in UI with error code

- [ ] **Expected behavior:**
  - If `auth/unauthorized-domain`: Add domain (Step 1)
  - If `auth/operation-not-allowed`: Enable provider (Step 2)
  - If `403 Forbidden`: Check API key restrictions (Step 3)
  - If no error: User should be created in Firebase Authentication ✅

- [ ] **Verify user creation:**
  1. Go to Firebase Console → Authentication → Users
  2. Verify new user appears in the list
  3. Verify user email matches signup form
  4. Verify user has UID

- [ ] **Verify Firestore document:**
  1. Go to Firebase Console → Firestore Database
  2. Navigate to `users/{uid}` collection
  3. Verify document exists with:
     - `userId`: matches uid
     - `username`: from form
     - `email`: from form
     - `role`: "user"
     - `createdAt`: timestamp
     - `stats`: object with zeros
     - `progress`: object with false values

---

## Error Code Reference

Common Firebase Auth error codes during signup:

| Error Code | Meaning | Fix |
|------------|---------|-----|
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Authorized domains |
| `auth/operation-not-allowed` | Email/Password provider disabled | Enable provider in Sign-in method |
| `auth/email-already-in-use` | Email already registered | User should login instead |
| `auth/weak-password` | Password too weak | User needs stronger password |
| `auth/invalid-email` | Invalid email format | User needs valid email |
| `auth/network-request-failed` | Network error | Check internet connection |
| `403 Forbidden` | API key restricted | Update API key restrictions |

---

## Deploy Command

```bash
firebase deploy --only hosting
```

---

## Testing After Fix

1. **Open browser console** (F12 → Console tab)
2. **Go to** `https://socyberx.com/signup`
3. **Fill signup form** with test data
4. **Submit form**
5. **Check console** for:
   ```
   SIGNUP_ERROR auth/xxx Error message {...}
   ```
6. **Check UI** for error message with code:
   ```
   Friendly message [Error Code: auth/xxx]
   ```
7. **If error code is `auth/unauthorized-domain`** or `auth/operation-not-allowed`:
   - Follow Firebase Console steps above
   - Wait 1-2 minutes for changes to propagate
   - Try signup again
8. **If successful:**
   - Check Firebase Console → Authentication → Users
   - Verify user appears in list
   - Check Firestore → users collection
   - Verify document exists

---

## Files Changed

1. ✅ `public/js/signup.js` - Added explicit error logging and error code display in UI
2. ✅ `public/js/errorMessages.js` - Added `auth/unauthorized-domain` error message

