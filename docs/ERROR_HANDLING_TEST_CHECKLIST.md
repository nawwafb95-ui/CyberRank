# Error Handling System - Testing Checklist

This checklist helps verify that the centralized error handling system works correctly across all scenarios.

## Prerequisites

- [ ] Development server is running (`npm run dev`)
- [ ] Firebase is properly configured
- [ ] Browser console is open to check error logs

## Test Cases

### 1. Login Page (`/html/login.html`)

#### Test 1.1: Invalid Email Format
- [ ] Enter invalid email (e.g., "notanemail")
- [ ] Submit form
- [ ] **Expected:** Field-level error appears under email input
- [ ] **Expected:** Error message: "Invalid email address. Please enter a valid email. (عنوان بريد إلكتروني غير صحيح...)"
- [ ] **Expected:** Form-level error box appears at top of form
- [ ] **Expected:** Console shows technical error details

#### Test 1.2: Wrong Password
- [ ] Enter valid email
- [ ] Enter incorrect password
- [ ] Submit form
- [ ] **Expected:** Error message: "Incorrect password. Please try again. (كلمة المرور غير صحيحة...)"
- [ ] **Expected:** Error appears under password field
- [ ] **Expected:** Form-level error box shows friendly message
- [ ] **Expected:** Console logs technical Firebase error

#### Test 1.3: User Not Found
- [ ] Enter non-existent email
- [ ] Enter any password
- [ ] Submit form
- [ ] **Expected:** Error message: "User not found. Please check your email. (المستخدم غير موجود...)"
- [ ] **Expected:** Error appears under password field (for security)
- [ ] **Expected:** Console logs technical error

#### Test 1.4: Too Many Requests
- [ ] Attempt login with wrong password 5+ times
- [ ] **Expected:** Error message: "Too many failed attempts. Please try again later. (محاولات كثيرة فاشلة...)"
- [ ] **Expected:** Error appears in form-level error box
- [ ] **Expected:** Console logs technical error

#### Test 1.5: Network Error (Simulate)
- [ ] Disconnect internet
- [ ] Attempt login
- [ ] **Expected:** Error message: "Network error. Please check your internet connection. (خطأ في الشبكة...)"
- [ ] **Expected:** Console logs network error details

#### Test 1.6: Successful Login
- [ ] Enter correct credentials
- [ ] Submit form
- [ ] **Expected:** No errors displayed
- [ ] **Expected:** Redirects to home page
- [ ] **Expected:** Error boxes are hidden

### 2. Signup Page (`/html/signup.html`)

#### Test 2.1: Email Already in Use
- [ ] Enter email that already exists
- [ ] Fill other required fields correctly
- [ ] Submit form
- [ ] **Expected:** Error message: "This email is already registered. Please use a different email or try logging in. (البريد الإلكتروني مسجل بالفعل...)"
- [ ] **Expected:** Error appears under email field
- [ ] **Expected:** Form-level error box shows message
- [ ] **Expected:** Console logs technical error

#### Test 2.2: Weak Password
- [ ] Enter valid email
- [ ] Enter weak password (e.g., "123")
- [ ] Submit form
- [ ] **Expected:** Error message: "Password is too weak. Please use at least 8 characters with uppercase, number, and symbol. (كلمة المرور ضعيفة...)"
- [ ] **Expected:** Error appears under password field
- [ ] **Expected:** Console logs technical error

#### Test 2.3: Invalid Email
- [ ] Enter invalid email format
- [ ] Fill other fields
- [ ] Submit form
- [ ] **Expected:** Error message: "Invalid email address. Please enter a valid email. (عنوان بريد إلكتروني غير صحيح...)"
- [ ] **Expected:** Error appears under email field

#### Test 2.4: Network Error (Simulate)
- [ ] Disconnect internet
- [ ] Fill form correctly
- [ ] Submit form
- [ ] **Expected:** Network error message appears
- [ ] **Expected:** Console logs network error

#### Test 2.5: Successful Signup
- [ ] Enter all valid information
- [ ] Submit form
- [ ] **Expected:** No errors displayed
- [ ] **Expected:** Success message appears
- [ ] **Expected:** Redirects to home page

### 3. OTP Page (`/html/success.html` - if OTP enabled)

#### Test 3.1: Invalid OTP Code
- [ ] Enter incorrect 6-digit code
- [ ] Click verify
- [ ] **Expected:** Error message: "Invalid OTP code. Please check and try again. (رمز OTP غير صحيح...)"
- [ ] **Expected:** Error appears in status element
- [ ] **Expected:** Console logs technical error

#### Test 3.2: Network Error (OTP Send)
- [ ] Disconnect internet
- [ ] Click resend OTP
- [ ] **Expected:** Network error message
- [ ] **Expected:** Console logs error

#### Test 3.3: Successful OTP Verification
- [ ] Enter correct OTP code
- [ ] Click verify
- [ ] **Expected:** Success message
- [ ] **Expected:** Account created
- [ ] **Expected:** Redirects to home

### 4. Error Box Styling

#### Test 4.1: Error Box Visibility
- [ ] Trigger any error on login/signup form
- [ ] **Expected:** Error box appears with red background
- [ ] **Expected:** Error box has warning icon (⚠️)
- [ ] **Expected:** Error box has smooth animation
- [ ] **Expected:** Error box is readable (good contrast)

#### Test 4.2: Error Box Auto-Hide
- [ ] Trigger form-level error
- [ ] Wait 5 seconds
- [ ] **Expected:** Error box fades out automatically (if implemented)

#### Test 4.3: Multiple Errors
- [ ] Submit form with multiple invalid fields
- [ ] **Expected:** Field-level errors appear under each invalid field
- [ ] **Expected:** Form-level error box shows general message
- [ ] **Expected:** All errors are visible and readable

### 5. Console Logging

#### Test 5.1: Technical Error Logging
- [ ] Trigger any Firebase error
- [ ] Check browser console
- [ ] **Expected:** Console shows `[Error Handler] Technical error:` with:
  - Error code
  - Error message
  - Stack trace
  - Full error object
- [ ] **Expected:** Console shows `[Error Handler] User-friendly message:` with friendly message

#### Test 5.2: No Sensitive Data Exposure
- [ ] Check all error messages shown to users
- [ ] **Expected:** No stack traces visible to users
- [ ] **Expected:** No internal error codes visible (only friendly messages)
- [ ] **Expected:** No file paths or technical details visible

### 6. Error Clearing

#### Test 6.1: Clear on New Submission
- [ ] Trigger an error
- [ ] Fix the issue
- [ ] Submit form again
- [ ] **Expected:** Previous errors are cleared
- [ ] **Expected:** New errors (if any) appear

#### Test 6.2: Clear on Input Change
- [ ] Trigger field-level error
- [ ] Start typing in the field
- [ ] **Expected:** Error clears (if implemented) OR stays until form submission

### 7. Arabic Translation

#### Test 7.1: Arabic Text Display
- [ ] Trigger any error
- [ ] **Expected:** Error message includes Arabic text in parentheses
- [ ] **Expected:** Arabic text is properly displayed (no encoding issues)
- [ ] **Expected:** Arabic text is readable

### 8. Edge Cases

#### Test 8.1: Unknown Error Code
- [ ] Simulate error with unknown code
- [ ] **Expected:** Generic error message: "An unexpected error occurred. Please try again or contact support. (حدث خطأ غير متوقع...)"
- [ ] **Expected:** Console logs full error details

#### Test 8.2: Null/Undefined Error
- [ ] Pass null or undefined to error handler
- [ ] **Expected:** Generic error message appears
- [ ] **Expected:** No JavaScript errors in console

#### Test 8.3: Network Timeout
- [ ] Simulate slow network (throttle in DevTools)
- [ ] Submit form
- [ ] **Expected:** Timeout error message appears
- [ ] **Expected:** Console logs timeout details

### 9. Integration with Other Pages

#### Test 9.1: Quiz Loading Error
- [ ] Navigate to quiz page
- [ ] Simulate Firestore permission error
- [ ] **Expected:** Friendly error message appears
- [ ] **Expected:** Console logs technical error

#### Test 9.2: Profile Update Error
- [ ] Navigate to profile page
- [ ] Attempt to update profile with invalid data
- [ ] **Expected:** Error message appears
- [ ] **Expected:** Console logs technical error

### 10. Responsive Design

#### Test 10.1: Mobile View
- [ ] Open on mobile device or resize browser
- [ ] Trigger error
- [ ] **Expected:** Error box is readable on mobile
- [ ] **Expected:** Error box doesn't overflow
- [ ] **Expected:** Text is properly sized

#### Test 10.2: Tablet View
- [ ] Test on tablet-sized viewport
- [ ] **Expected:** Error box displays correctly
- [ ] **Expected:** Layout is not broken

## Verification Summary

After completing all tests, verify:

- [ ] All Firebase error codes are mapped to friendly messages
- [ ] All error messages include Arabic translations
- [ ] Technical errors are logged to console but not shown to users
- [ ] Error boxes have proper styling and animations
- [ ] Error clearing works correctly
- [ ] System is extensible (easy to add new error codes)
- [ ] No JavaScript errors in console during normal operation
- [ ] Error handling doesn't break existing functionality

## Notes

- Some tests require simulating network conditions (use browser DevTools)
- Some tests require creating test accounts or using existing ones
- Keep browser console open during all tests to verify logging
- Test in both English and Arabic language contexts if applicable

## Reporting Issues

If any test fails:
1. Note the test case number
2. Describe what happened vs. what was expected
3. Check browser console for error details
4. Check if error is in `errorMessages.js` mapping
5. Verify HTML markup includes error box element

