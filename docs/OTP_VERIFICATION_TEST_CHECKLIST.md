# OTP Verification System - Testing Checklist

This checklist verifies the secure OTP verification system for signup and password reset flows.

## Prerequisites

- [ ] Firebase Cloud Functions are deployed or emulator is running
- [ ] Firestore emulator is running (for local testing)
- [ ] Email service (Resend) is configured OR dev mode is enabled
- [ ] Browser console is open to check logs
- [ ] Firestore security rules are deployed

## Test Environment Setup

- [ ] Functions emulator: `cd functions && npm run serve`
- [ ] Firestore emulator: Running on port 8080
- [ ] Frontend dev server: `npm run dev`
- [ ] Check `FUNCTIONS_BASE_URL` in signup.js, forgot-password.js, and otp.js

---

## GOAL A: SIGNUP WITH OTP (No Account Before OTP)

### Test 1.1: Successful Signup Flow
- [ ] Navigate to `/html/signup.html`
- [ ] Enter valid username (e.g., "TestUser123")
- [ ] Enter valid email (e.g., "test@example.com")
- [ ] Enter valid password (meets requirements)
- [ ] Confirm password matches
- [ ] Submit form
- [ ] **Expected:** Status shows "Sending verification code..."
- [ ] **Expected:** Redirects to OTP verification page (`/html/success.html`)
- [ ] **Expected:** Email displays on OTP page
- [ ] **Expected:** OTP code received in email (or console in dev mode)
- [ ] **Expected:** NO Firebase Auth account created yet (check Firebase Console)
- [ ] Enter correct 6-digit OTP
- [ ] Click "Verify OTP"
- [ ] **Expected:** Status shows "Creating your account..."
- [ ] **Expected:** Firebase Auth account is created
- [ ] **Expected:** Firestore user document created at `/users/{uid}`
- [ ] **Expected:** Redirects to home page
- [ ] **Expected:** User is logged in

### Test 1.2: Wrong OTP Code
- [ ] Complete signup form and submit
- [ ] Wait for OTP page
- [ ] Enter incorrect 6-digit OTP
- [ ] Click "Verify OTP"
- [ ] **Expected:** Error message: "Invalid OTP code. X attempt(s) remaining. (رمز التحقق غير صحيح...)"
- [ ] **Expected:** OTP input is cleared
- [ ] **Expected:** Attempts counter decreases
- [ ] **Expected:** NO Firebase Auth account created
- [ ] **Expected:** Console logs technical error details

### Test 1.3: Expired OTP
- [ ] Complete signup form and submit
- [ ] Wait for OTP page
- [ ] Wait 5+ minutes (or manually expire in Firestore)
- [ ] Enter OTP code
- [ ] Click "Verify OTP"
- [ ] **Expected:** Error message: "OTP code has expired. Please request a new one. (انتهت صلاحية رمز التحقق...)"
- [ ] **Expected:** NO Firebase Auth account created
- [ ] **Expected:** OTP request status is "expired" in Firestore

### Test 1.4: Too Many Failed Attempts
- [ ] Complete signup form and submit
- [ ] Wait for OTP page
- [ ] Enter wrong OTP 5 times
- [ ] **Expected:** After 5th wrong attempt, error: "Too many failed attempts. Please request a new OTP. (محاولات كثيرة فاشلة...)"
- [ ] **Expected:** OTP request status is "expired" in Firestore
- [ ] **Expected:** NO Firebase Auth account created
- [ ] **Expected:** Cannot verify OTP anymore (must request new one)

### Test 1.5: Resend OTP
- [ ] Complete signup form and submit
- [ ] Wait for OTP page
- [ ] Click "Resend OTP" immediately
- [ ] **Expected:** Error: "Please wait X seconds before requesting a new OTP. (يرجى الانتظار...)"
- [ ] Wait 60+ seconds
- [ ] Click "Resend OTP"
- [ ] **Expected:** Status: "Verification code resent. Check your email."
- [ ] **Expected:** New OTP code received
- [ ] **Expected:** OTP input is cleared
- [ ] **Expected:** Can verify with new OTP

### Test 1.6: Email Send Failure
- [ ] Disable email service (or use invalid API key)
- [ ] Complete signup form and submit
- [ ] **Expected:** Error message: "We could not send the verification code to your email. Please try again in a moment. (تعذر إرسال رمز التحقق...)"
- [ ] **Expected:** OTP request status is "failed" in Firestore
- [ ] **Expected:** NO Firebase Auth account created
- [ ] **Expected:** User can retry sending OTP
- [ ] **Expected:** Console logs email error details

### Test 1.7: Network Error During OTP Request
- [ ] Stop Functions emulator
- [ ] Complete signup form and submit
- [ ] **Expected:** Error message: "Network error. Please check your connection. (خطأ في الشبكة...)"
- [ ] **Expected:** NO Firebase Auth account created
- [ ] **Expected:** User can retry

### Test 1.8: Network Error During OTP Verification
- [ ] Complete signup form and submit
- [ ] Wait for OTP page
- [ ] Enter correct OTP
- [ ] Stop Functions emulator
- [ ] Click "Verify OTP"
- [ ] **Expected:** Error message: "Network error. Please check your connection."
- [ ] **Expected:** NO Firebase Auth account created
- [ ] **Expected:** Can retry after emulator restarts

---

## GOAL B: FORGOT PASSWORD WITH OTP

### Test 2.1: Successful Password Reset Flow
- [ ] Navigate to `/html/forgot-password.html`
- [ ] Enter valid email (must be registered)
- [ ] Click "Send Verification Code"
- [ ] **Expected:** Status shows "Sending verification code..."
- [ ] **Expected:** Redirects to OTP verification page
- [ ] **Expected:** Email displays on OTP page
- [ ] **Expected:** OTP code received in email
- [ ] Enter correct 6-digit OTP
- [ ] Click "Verify OTP"
- [ ] **Expected:** Status shows "Sending password reset link..."
- [ ] **Expected:** Firebase password reset email is sent
- [ ] **Expected:** Success message: "Password reset link sent! Check your email."
- [ ] **Expected:** Redirects to login page after 3 seconds
- [ ] **Expected:** Check email for Firebase password reset link
- [ ] **Expected:** Can reset password using Firebase link

### Test 2.2: Wrong OTP (Password Reset)
- [ ] Request password reset
- [ ] Wait for OTP page
- [ ] Enter incorrect OTP
- [ ] Click "Verify OTP"
- [ ] **Expected:** Error message with attempts remaining
- [ ] **Expected:** NO password reset email sent
- [ ] **Expected:** Cannot reset password without OTP verification

### Test 2.3: Expired OTP (Password Reset)
- [ ] Request password reset
- [ ] Wait for OTP page
- [ ] Wait 5+ minutes
- [ ] Enter OTP
- [ ] Click "Verify OTP"
- [ ] **Expected:** Error: "OTP code has expired. Please request a new one."
- [ ] **Expected:** NO password reset email sent

### Test 2.4: Resend OTP (Password Reset)
- [ ] Request password reset
- [ ] Wait for OTP page
- [ ] Wait 60+ seconds
- [ ] Click "Resend OTP"
- [ ] **Expected:** New OTP code received
- [ ] **Expected:** Can verify with new OTP

### Test 2.5: Email Send Failure (Password Reset)
- [ ] Disable email service
- [ ] Request password reset
- [ ] **Expected:** Error: "We could not send the verification code..."
- [ ] **Expected:** OTP request status is "failed"
- [ ] **Expected:** Can retry

---

## Security Tests

### Test 3.1: OTP Hash Verification
- [ ] Check Firestore `otpRequests` collection
- [ ] **Expected:** OTP is stored as hash (SHA-256), NOT plain text
- [ ] **Expected:** Cannot see actual OTP value in Firestore
- [ ] **Expected:** Only backend can verify OTP

### Test 3.2: Firestore Security Rules
- [ ] Try to read `otpRequests` collection from client
- [ ] **Expected:** Permission denied (403 error)
- [ ] **Expected:** Clients cannot access OTP data
- [ ] **Expected:** Only Cloud Functions can read/write OTP requests

### Test 3.3: Account Creation Prevention
- [ ] Complete signup form
- [ ] Submit form (OTP requested)
- [ ] **Expected:** NO Firebase Auth account exists yet
- [ ] **Expected:** Cannot login with email/password yet
- [ ] Enter correct OTP and verify
- [ ] **Expected:** Account is created ONLY after OTP verification

### Test 3.4: Password Reset Prevention
- [ ] Request password reset
- [ ] **Expected:** NO password reset email sent yet
- [ ] **Expected:** Must verify OTP first
- [ ] Enter correct OTP and verify
- [ ] **Expected:** Password reset email is sent ONLY after OTP verification

### Test 3.5: OTP Reuse Prevention
- [ ] Complete signup and verify OTP successfully
- [ ] Try to use same OTP again
- [ ] **Expected:** OTP status is "verified" (cannot reuse)
- [ ] **Expected:** Error if trying to reuse

---

## Error Handling Tests

### Test 4.1: User-Friendly Messages
- [ ] Trigger various errors (wrong OTP, expired, network, etc.)
- [ ] **Expected:** All errors show friendly messages in English + Arabic
- [ ] **Expected:** No technical error codes visible to users
- [ ] **Expected:** No stack traces visible to users

### Test 4.2: Console Logging
- [ ] Trigger errors
- [ ] Check browser console
- [ ] **Expected:** Technical errors logged to console
- [ ] **Expected:** Full error details available for debugging
- [ ] **Expected:** User-friendly messages also logged

### Test 4.3: Error Recovery
- [ ] Trigger network error
- [ ] Fix network issue
- [ ] Retry operation
- [ ] **Expected:** Can retry successfully
- [ ] **Expected:** Previous errors are cleared

---

## Edge Cases

### Test 5.1: Invalid Email Format
- [ ] Enter invalid email in signup/forgot password
- [ ] **Expected:** Validation error before OTP request
- [ ] **Expected:** NO OTP request sent

### Test 5.2: Non-Existent Email (Password Reset)
- [ ] Enter non-existent email in forgot password
- [ ] **Expected:** OTP is still sent (for security - don't reveal if email exists)
- [ ] **Expected:** OTP verification fails if email doesn't exist in Firebase Auth

### Test 5.3: Multiple OTP Requests
- [ ] Request OTP for same email multiple times
- [ ] **Expected:** Cooldown prevents spam
- [ ] **Expected:** Latest OTP is the valid one
- [ ] **Expected:** Previous OTPs are invalidated

### Test 5.4: Browser Refresh on OTP Page
- [ ] Complete signup and reach OTP page
- [ ] Refresh browser
- [ ] **Expected:** Redirects to signup (pendingSignup lost)
- [ ] **Expected:** OR maintains state if localStorage persists

### Test 5.5: Concurrent OTP Requests
- [ ] Open two tabs
- [ ] Request OTP in both tabs simultaneously
- [ ] **Expected:** Cooldown prevents duplicate requests
- [ ] **Expected:** Only one OTP is sent

---

## Integration Tests

### Test 6.1: Signup → OTP → Login Flow
- [ ] Complete full signup with OTP
- [ ] Account is created
- [ ] Logout
- [ ] Login with same credentials
- [ ] **Expected:** Login successful
- [ ] **Expected:** User data is correct

### Test 6.2: Password Reset → Login Flow
- [ ] Complete password reset with OTP
- [ ] Receive Firebase password reset email
- [ ] Click reset link
- [ ] Set new password
- [ ] Login with new password
- [ ] **Expected:** Login successful

### Test 6.3: Error Handling Integration
- [ ] Verify error handling system is used
- [ ] Check that `handleError()` is called
- [ ] **Expected:** Errors use centralized error messages
- [ ] **Expected:** Arabic translations appear

---

## Performance Tests

### Test 7.1: OTP Request Speed
- [ ] Request OTP
- [ ] **Expected:** Response within 2-3 seconds
- [ ] **Expected:** Email sent within 5 seconds

### Test 7.2: OTP Verification Speed
- [ ] Verify OTP
- [ ] **Expected:** Verification completes within 1-2 seconds
- [ ] **Expected:** Account creation completes within 2-3 seconds

---

## Final Verification

- [ ] All test cases pass
- [ ] No Firebase Auth accounts created before OTP verification
- [ ] OTPs are hashed in Firestore
- [ ] Firestore security rules prevent client access to OTPs
- [ ] Error messages are user-friendly (English + Arabic)
- [ ] Technical errors logged to console
- [ ] Email failures handled gracefully
- [ ] Cooldown and rate limiting work correctly
- [ ] OTP expiry works correctly
- [ ] Account creation works after OTP verification
- [ ] Password reset works after OTP verification

---

## Notes

- Use Firebase Console to verify account creation timing
- Use Firestore Console to check OTP request status
- Check browser console for technical error logs
- In dev mode, OTP is logged to console (not sent via email)
- Test both local emulator and production environments

## Reporting Issues

If any test fails:
1. Note the test case number
2. Describe what happened vs. what was expected
3. Check browser console for error details
4. Check Firestore for OTP request status
5. Check Firebase Console for account creation
6. Verify Cloud Functions logs

