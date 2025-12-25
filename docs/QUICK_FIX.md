# Quick Fix: OTP "Failed to generate OTP" Error

## 🚨 Immediate Fix (3 Steps)

### Step 1: Create Environment File
```bash
cd functions
cp env.template .env
```

Edit `functions/.env`:
```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=onboarding@resend.dev
```

**Get API Key:** https://resend.com/api-keys

---

### Step 2: Start Firebase Emulators
```bash
# In project root
firebase emulators:start
```

**Keep this terminal open!** Emulators must stay running.

---

### Step 3: Test
1. Open signup page in browser
2. Submit form
3. Check emulator terminal for OTP code (if email not configured)

---

## ✅ Verification

- [ ] `functions/.env` exists
- [ ] Emulators running (check http://localhost:5001)
- [ ] No errors in browser console
- [ ] OTP page loads after signup

---

## 🔍 If Still Failing

**Check emulator terminal logs** - Look for:
- `[sendOtp] Generated OTP for...`
- `[sendOtp] Database error:` ← This means Firestore not running
- `Missing RESEND_API_KEY` ← This means .env not loaded

**Check browser console** - Look for:
- Network errors → Emulator not running
- CORS errors → Should be fixed now
- 500 errors → Check emulator logs

---

## 📚 Full Documentation

- **`SETUP.md`** - Complete setup guide
- **`OTP_FIX_SUMMARY.md`** - Detailed fix explanation
- **`OTP_DIAGNOSIS.md`** - Root cause analysis

