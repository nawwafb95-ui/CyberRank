# Signup Fix Summary

## Issues Fixed

### 1. ✅ window.APP_CONFIG Missing
**File**: `public/js/config.js`
- Added `window.APP_CONFIG = config;` to expose config object globally
- Added console log: `console.log('[Config] window.APP_CONFIG ready:', window.APP_CONFIG);`

### 2. ✅ Signup.js Direct Signup Path
**File**: `public/js/signup.js`
- Verified direct signup code is correct (runs when `OTP_ENABLED: false`)
- Added `userId: user.uid` field to user document
- Fixed redirect to use `window.getPath('home')` correctly
- Ensured error messages are displayed in UI

### 3. ✅ Script Loading Order
**File**: `public/signup.html`
- Scripts load in correct order:
  1. `/js/config.js` (non-module, loads first)
  2. `/js/core.js` (non-module)
  3. `/js/main.js` (non-module)
  4. `/js/navAuth.js` (module)
  5. `/js/sidebar-inject.js` (non-module)
  6. `/js/sidebar.js` (non-module)
  7. `/js/signup.js` (module - imports firebaseInit.js automatically)

Note: `firebaseInit.js` doesn't need to be loaded in HTML because `signup.js` imports it as an ES module.

---

## Code Patches

### File: `public/js/config.js`

**Before:**
```javascript
  console.log('[Config] SOCyberX configuration loaded:', {
    FUNCTIONS_BASE_URL: config.FUNCTIONS_BASE_URL,
    OTP_ENABLED: config.OTP_ENABLED,
    hostname: window.location.hostname
  });
})();
```

**After:**
```javascript
  // Expose as APP_CONFIG for compatibility
  window.APP_CONFIG = config;

  console.log('[Config] SOCyberX configuration loaded:', {
    FUNCTIONS_BASE_URL: config.FUNCTIONS_BASE_URL,
    OTP_ENABLED: config.OTP_ENABLED,
    hostname: window.location.hostname
  });
  console.log('[Config] window.APP_CONFIG ready:', window.APP_CONFIG);
})();
```

### File: `public/js/signup.js`

**Before (line 186-202):**
```javascript
          await setDoc(userDocRef, {
            email: user.email,
            username: username,
            role: 'user',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            stats: {
              totalPoints: 0,
              attemptsCount: 0,
              bestScore: 0
            },
            progress: {
              easyCompleted: false,
              mediumCompleted: false,
              hardCompleted: false
            }
          }, { merge: true });
```

**After:**
```javascript
          await setDoc(userDocRef, {
            userId: user.uid,
            username: username,
            email: user.email,
            role: 'user',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            stats: {
              totalPoints: 0,
              attemptsCount: 0,
              bestScore: 0
            },
            progress: {
              easyCompleted: false,
              mediumCompleted: false,
              hardCompleted: false
            }
          }, { merge: true });
```

**Before (line 222):**
```javascript
        const homePath = typeof getPath === 'function' ? getPath('home') : '/html/index.html';
```

**After:**
```javascript
        const homePath = (typeof window.getPath === 'function' ? window.getPath('home') : '/html/index.html');
```

---

## ✅ Firestore Rules Updated

Updated `firestore.rules` to allow authenticated users to create their own document:

**Changed:**
```javascript
// Before:
allow create: if false; // Deny client creation - handled by Cloud Functions

// After:
allow create: if request.auth != null && request.auth.uid == userId;
```

**Why this works:**
- `createUserWithEmailAndPassword` creates the Auth user first
- At that point, `request.auth.uid` exists and equals `userId`
- The user can then create their own Firestore document

---

## Files Changed

1. ✅ `public/js/config.js` - Added `window.APP_CONFIG`
2. ✅ `public/js/signup.js` - Added `userId` field, fixed redirect path
3. ✅ `firestore.rules` - Updated to allow authenticated users to create their own document

---

## Signup Flow (OTP Disabled)

When `OTP_ENABLED: false` in `config.js`:

1. User fills signup form (username, email, password, confirm password)
2. Form validation runs (non-empty, password match, basic length)
3. `createUserWithEmailAndPassword(auth, email, password)` creates Firebase Auth user
4. User document created in Firestore: `users/{uid}` with:
   - `userId`: user.uid
   - `username`: from form
   - `email`: from Firebase Auth user
   - `role`: "user" (hardcoded)
   - `createdAt`: serverTimestamp()
   - `lastLoginAt`: serverTimestamp()
   - `stats`: { totalPoints: 0, attemptsCount: 0, bestScore: 0 }
   - `progress`: { easyCompleted: false, mediumCompleted: false, hardCompleted: false }
5. Success message displayed
6. Redirect to home page after 500ms

**Note:** `userStats` collection is NOT created during signup because:
- It's managed by Cloud Functions (see `firestore.rules` line 32: `allow write: if false`)
- The stats are embedded in the `users` document instead

---

## Deploy Command

```bash
firebase deploy --only hosting,firestore:rules
```

This deploys both hosting files and Firestore rules in one command.

---

## Verification Checklist

After deployment:

- [ ] `window.APP_CONFIG` is defined in browser console
- [ ] Signup form validates inputs correctly
- [ ] Firebase Auth user is created (check Firebase Console → Authentication)
- [ ] Firestore user document is created at `users/{uid}` (check Firebase Console → Firestore)
- [ ] User document contains: userId, username, email, role, createdAt, stats, progress
- [ ] Success message appears after signup
- [ ] Redirect to home page works
- [ ] No Cloud Function calls in Network tab
- [ ] Error messages display correctly if signup fails (email already in use, weak password, etc.)

---

## Notes

- OTP code is preserved behind `OTP_ENABLED` flag (currently `false`)
- No Cloud Functions are called during signup
- All error handling is in place with visible UI feedback
- Script loading order is correct (config.js loads before signup.js)
- ES module imports handle firebaseInit.js automatically

