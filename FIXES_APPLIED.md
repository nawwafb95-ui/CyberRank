# Signup Fix - Files Changed Summary

## Files Modified

### 1. `public/js/config.js`
**Change:** Added `window.APP_CONFIG` for compatibility

**Patch:**
```diff
+  // Expose as APP_CONFIG for compatibility
+  window.APP_CONFIG = config;
+
   console.log('[Config] SOCyberX configuration loaded:', {
     FUNCTIONS_BASE_URL: config.FUNCTIONS_BASE_URL,
     OTP_ENABLED: config.OTP_ENABLED,
     hostname: window.location.hostname
   });
+  console.log('[Config] window.APP_CONFIG ready:', window.APP_CONFIG);
 })();
```

### 2. `public/js/signup.js`
**Changes:**
- Added `userId: user.uid` field to user document
- Fixed redirect path to use `window.getPath` correctly

**Patch 1 (user document):**
```diff
          await setDoc(userDocRef, {
+           userId: user.uid,
            username: username,
            email: user.email,
            role: 'user',
```

**Patch 2 (redirect):**
```diff
-        const homePath = typeof getPath === 'function' ? getPath('home') : '/html/index.html';
+        const homePath = (typeof window.getPath === 'function' ? window.getPath('home') : '/html/index.html');
```

### 3. `firestore.rules`
**Change:** Allow authenticated users to create their own document

**Patch:**
```diff
      // Users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      
-     // Only backend can create user docs (during signup)
-     allow create: if false; // Deny client creation - handled by Cloud Functions
+     // Users can create their own document (during signup after auth is created)
+     allow create: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own data (except role)
      allow update: if request.auth != null
```

---

## Signup Flow (When OTP_ENABLED: false)

1. User submits signup form
2. Validation runs (username, email, password match, length)
3. `createUserWithEmailAndPassword(auth, email, password)` creates Firebase Auth user
4. User document created in Firestore: `users/{uid}` with:
   - `userId`: user.uid
   - `username`: from form
   - `email`: from Firebase Auth
   - `role`: "user" (hardcoded)
   - `createdAt`: serverTimestamp()
   - `lastLoginAt`: serverTimestamp()
   - `stats`: { totalPoints: 0, attemptsCount: 0, bestScore: 0 }
   - `progress`: { easyCompleted: false, mediumCompleted: false, hardCompleted: false }
5. Success message shown
6. Redirect to home page

**Note:** No `userStats` document is created because it's managed by Cloud Functions only.

---

## Deploy

```bash
firebase deploy --only hosting,firestore:rules
```

---

## Verification

After deployment, test signup:
1. Go to `/signup`
2. Fill form and submit
3. Check Firebase Console → Authentication: user should appear
4. Check Firebase Console → Firestore: document at `users/{uid}` should exist
5. Should redirect to home page

