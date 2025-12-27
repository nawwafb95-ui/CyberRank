# Signup Debug Logging Instructions

## Debug Logs Added

The following console logs have been added to `public/js/signup.js`:

1. **STEP 1**: When submit handler fires (after e.preventDefault())
2. **STEP 2**: After reading inputs (after validateSignup)
3. **STEP 3**: Before createUserWithEmailAndPassword call
4. **Early returns**: Logged when code exits early
5. **Error catch**: Logs err.code and err.message, shows alert

## What to Look For in DevTools Console

After clicking "Sign Up" button, you should see logs in this order:

### Expected Log Sequence (Success Path):

```
[SIGNUP] STEP 1: Submit fired
[SIGNUP] STEP 2: After reading inputs { ok: true, email: "test@example.com", username: "TestUser", hasPassword: true }
[SIGNUP] OTP_ENABLED: false
[Signup] OTP disabled - creating account with Firebase Auth
[SIGNUP] STEP 3: Before createUserWithEmailAndPassword { email: "test@example.com", hasPassword: true, username: "TestUser", authExists: true }
[Signup] User document created in Firestore at users/...
```

### Expected Log Sequence (Validation Failure):

```
[SIGNUP] STEP 1: Submit fired
[SIGNUP] STEP 2: After reading inputs { ok: false, email: "...", username: "...", hasPassword: true }
[SIGNUP] EARLY RETURN: Validation failed
```

### Expected Log Sequence (Error During Signup):

```
[SIGNUP] STEP 1: Submit fired
[SIGNUP] STEP 2: After reading inputs { ok: true, email: "...", username: "...", hasPassword: true }
[SIGNUP] OTP_ENABLED: false
[Signup] OTP disabled - creating account with Firebase Auth
[SIGNUP] STEP 3: Before createUserWithEmailAndPassword { email: "...", hasPassword: true, username: "...", authExists: true }
[SIGNUP] CATCH ERROR: auth/xxx Error message {...}
[Alert popup: SIGNUP ERROR Code: auth/xxx Message: ...]
```

### Expected Log Sequence (Form Not Found):

```
[SIGNUP] EARLY RETURN: signup-form element not found
```

---

## Key Things to Check

### 1. Is STEP 1 firing?
- **If NO**: Form submit handler not attached → Check if signup.js loaded
- **If YES**: Continue to check STEP 2

### 2. Is STEP 2 showing ok: true?
- **If NO**: Validation is failing → Check validation errors in UI
- **If YES**: Continue to check STEP 3

### 3. Is OTP_ENABLED: false?
- **If NO**: OTP is enabled → Should be false for direct signup
- **If YES**: Continue to STEP 3

### 4. Is STEP 3 showing authExists: true?
- **If NO**: Firebase auth instance not initialized → Check firebaseInit.js
- **If YES**: Check if createUserWithEmailAndPassword is called

### 5. Does CATCH ERROR appear?
- **If YES**: 
  - **Check error code** (e.g., `auth/unauthorized-domain`, `auth/operation-not-allowed`)
  - **Check error message** for details
  - **Alert popup** will also show the error
  - Follow Firebase Console configuration steps from previous documentation

### 6. Does "User document created" log appear?
- **If YES**: Signup succeeded! ✅
- **If NO**: Either catch error occurred OR code didn't reach that point

---

## Common Issues to Diagnose

### Issue: STEP 1 doesn't appear
**Diagnosis**: Form submit handler not attached
**Check**: 
- Is signup.js loaded? (Check Network tab)
- Is signup-form element in DOM? (Check Elements tab)

### Issue: STEP 2 shows ok: false
**Diagnosis**: Form validation failed
**Check**:
- Look for validation error messages in UI
- Check if email format is valid
- Check if password meets requirements
- Check if passwords match

### Issue: STEP 3 shows authExists: false
**Diagnosis**: Firebase auth not initialized
**Check**:
- Check firebaseInit.js is loaded
- Check for errors in console before signup
- Check Firebase config is correct

### Issue: CATCH ERROR with auth/unauthorized-domain
**Diagnosis**: Domain not authorized in Firebase
**Fix**: Add `socyberx.com` to Firebase Console → Authentication → Settings → Authorized domains

### Issue: CATCH ERROR with auth/operation-not-allowed
**Diagnosis**: Email/Password provider disabled
**Fix**: Enable in Firebase Console → Authentication → Sign-in method → Email/Password

### Issue: No logs appear at all
**Diagnosis**: signup.js not loading or DOMContentLoaded not firing
**Check**:
- Check Network tab for signup.js 404
- Check console for syntax errors
- Check if script tag is correct in HTML

---

## How to Use This

1. **Open DevTools**: Press F12 or Right-click → Inspect
2. **Go to Console tab**: Click "Console" tab
3. **Clear console**: Click clear icon or press Ctrl+L
4. **Fill signup form**: Enter test data
5. **Click "Sign Up"**: Watch console logs appear
6. **Note the sequence**: Compare with expected sequences above
7. **Check for errors**: Look for CATCH ERROR or EARLY RETURN
8. **Copy error code**: If error appears, copy the error code (e.g., `auth/xxx`)

---

## Next Steps After Seeing Logs

- **If validation fails**: Fix form inputs
- **If auth/unauthorized-domain**: Add domain to Firebase Console
- **If auth/operation-not-allowed**: Enable Email/Password provider
- **If authExists: false**: Check firebaseInit.js loading
- **If no STEP 1**: Check if signup.js is loaded correctly
- **If success**: User should appear in Firebase Authentication console

