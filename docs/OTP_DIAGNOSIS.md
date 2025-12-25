# OTP Failure Diagnosis Report

## 🔍 Root Cause Analysis

### **PRIMARY ISSUE: Missing Environment Variables**

**Location:** `functions/index.js:11-12`
```javascript
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
```

**Problem:** The Cloud Functions require `RESEND_API_KEY` and `FROM_EMAIL` environment variables, but:
- ❌ No `.env` file exists in `functions/` directory
- ❌ No `.env.example` file to guide setup
- ❌ These variables are not committed to Git (correctly, but undocumented)

**Impact:** When `sendOtp` function runs:
- If `RESEND_API_KEY` or `FROM_EMAIL` are missing, email sending is skipped (line 120-126)
- However, the function still tries to write to Firestore (line 111)
- **If Firestore emulator is not running, the database write fails → "Failed to generate OTP"**

---

### **SECONDARY ISSUE: Firebase Emulator Not Running**

**Location:** `public/js/otp.js:1` and `public/js/signup.js:175`
```javascript
const FUNCTIONS_BASE_URL = "http://localhost:5001/cyberrank-a4380/us-central1";
```

**Problem:** 
- Code expects Firebase Functions emulator on `localhost:5001`
- If emulator is not running, fetch requests fail with network errors
- Error message: "Failed to generate OTP" or "Network error. Is the emulator running?"

**Required Services:**
1. **Firebase Functions Emulator** (port 5001)
2. **Firestore Emulator** (port 8080) - for storing OTP codes

---

### **TERTIARY ISSUE: CORS Configuration Too Restrictive**

**Location:** `functions/index.js:13`
```javascript
const ALLOWED_ORIGIN = "http://localhost:5173";
```

**Problem:**
- CORS is hardcoded to `http://localhost:5173` (Vite default port)
- If frontend runs on different port (e.g., 3000, 8080, 5500), CORS blocks requests
- Error: "CORS blocked: origin not allowed" (line 82)

---

## 📍 Exact Files and Lines Involved

### 1. **Missing Environment Variables**
- **File:** `functions/index.js`
- **Lines:** 11-12, 34-38, 120-122
- **Issue:** `RESEND_API_KEY` and `FROM_EMAIL` not configured

### 2. **Hardcoded Functions URL**
- **File:** `public/js/otp.js`
- **Line:** 1
- **File:** `public/js/signup.js`
- **Line:** 175
- **Issue:** Assumes emulator is running on `localhost:5001`

### 3. **CORS Restriction**
- **File:** `functions/index.js`
- **Line:** 13, 16-17, 80-82
- **Issue:** Only allows `http://localhost:5173`

### 4. **Firestore Dependency**
- **File:** `functions/index.js`
- **Lines:** 111-116, 168-196
- **Issue:** Requires Firestore emulator to be running

---

## ✅ Step-by-Step Fixes

### **Fix 1: Create `.env` file in `functions/` directory**

Create `functions/.env` with:
```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

**Note:** Get `RESEND_API_KEY` from https://resend.com/api-keys
**Note:** `FROM_EMAIL` must be a verified domain in Resend

---

### **Fix 2: Start Firebase Emulators**

Run in project root:
```bash
firebase emulators:start
```

Or start only required services:
```bash
firebase emulators:start --only functions,firestore
```

**Verify:**
- Functions emulator: http://localhost:5001
- Firestore emulator: http://localhost:8080
- Emulator UI: http://localhost:4000

---

### **Fix 3: Fix CORS Configuration**

Update `functions/index.js:13` to allow multiple origins or detect from request.

---

### **Fix 4: Add Error Handling**

Improve error messages to indicate which service is missing.

---

## 🔧 Implementation

See fixes in the following files:
1. `functions/.env.example` - Template for environment variables
2. `functions/index.js` - Updated CORS and error handling
3. `SETUP.md` - Local development setup guide

