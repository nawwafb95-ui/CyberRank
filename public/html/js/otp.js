// ================== OTP Feature Flag ==================
// Set to false to bypass OTP verification during development
// Set to true to re-enable OTP email verification flow
// NOTE: This flag must match the one in signup.js
const OTP_ENABLED = false;

const FUNCTIONS_BASE_URL = "http://localhost:5001/cyberrank-a4380/us-central1";

function logRequest(endpoint, payload) {
  console.log(`[OTP] Request to: ${endpoint}`);
  console.log(`[OTP] Payload:`, payload);
}

document.addEventListener('DOMContentLoaded', () => {
  // ================== Check OTP Feature Flag ==================
  if (!OTP_ENABLED) {
    console.log('[OTP] OTP is disabled - redirecting to signup');
    window.location.href = '/signup.html';
    return;
  }

  const otpInputs = [
    document.getElementById('otp-0'),
    document.getElementById('otp-1'),
    document.getElementById('otp-2'),
    document.getElementById('otp-3'),
    document.getElementById('otp-4'),
    document.getElementById('otp-5')
  ];

  const emailEl = document.getElementById('otp-email');
  const resendLink = document.getElementById('resend-otp');
  const verifyBtn = document.getElementById('verify-otp');
  const statusEl = document.getElementById('otp-status');

  const pendingRaw = localStorage.getItem('pendingSignup');
  if (!pendingRaw) {
    window.location.href = '/signup.html';
    return;
  }

  let pendingSignup;
  try {
    pendingSignup = JSON.parse(pendingRaw);
  } catch (err) {
    console.error('Error parsing pendingSignup:', err);
    window.location.href = '/signup.html';
    return;
  }

  if (!pendingSignup.email) {
    window.location.href = '/signup.html';
    return;
  }

  const { email, username, password } = pendingSignup;
  if (emailEl) emailEl.textContent = email;

  function setStatus(message, type = '') {
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'otp-status' + (type ? ' ' + type : '');
    }
  }

  function getOTP() {
    return otpInputs.map(input => input.value.trim()).join('');
  }

  function clearOTP() {
    otpInputs.forEach(input => (input.value = ''));
    otpInputs[0].focus();
  }

  function focusNext(i) {
    if (i < 5) otpInputs[i + 1].focus();
  }

  function focusPrev(i) {
    if (i > 0) otpInputs[i - 1].focus();
  }

  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value && !/^\d$/.test(value)) {
        e.target.value = '';
        return;
      }
      if (value) focusNext(index);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        e.preventDefault();
        focusPrev(index);
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusPrev(index);
      } else if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        focusNext(index);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        verifyBtn.click();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);

      if (pasted.length === 6) {
        pasted.split('').forEach((d, i) => {
          if (otpInputs[i]) otpInputs[i].value = d;
        });
        otpInputs[5].focus();
      }
    });

    input.addEventListener('focus', () => input.select());
  });

  // 🔁 Resend OTP
  if (resendLink) {
    resendLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!OTP_ENABLED) {
        window.location.href = '/signup.html';
        return;
      }

      setStatus('Resending OTP...');

      const endpoint = `${FUNCTIONS_BASE_URL}/sendOtp`;
      logRequest(endpoint, { email });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const text = await res.text();
        if (!res.ok) {
          setStatus(text || 'Failed to resend OTP.', 'error');
          return;
        }

        setStatus('OTP resent. Check your email.', 'success');
        clearOTP();
        setTimeout(() => setStatus(''), 3000);
      } catch (err) {
        console.error('[OTP] Error resending OTP:', err);
        setStatus('Network error. Is the emulator running?', 'error');
      }
    });
  }

  // ✅ Verify OTP
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      if (!OTP_ENABLED) {
        window.location.href = '/signup.html';
        return;
      }

      const otp = getOTP();
      if (otp.length !== 6) {
        setStatus('Please enter the complete 6-digit code.', 'error');
        return;
      }

      setStatus('Verifying OTP...');
      verifyBtn.disabled = true;

      const endpoint = `${FUNCTIONS_BASE_URL}/verifyOtp`;
      logRequest(endpoint, { email, otp: '******' });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });

        const text = await res.text();
        if (!res.ok) {
          setStatus(text || 'OTP verification failed.', 'error');
          verifyBtn.disabled = false;
          clearOTP();
          return;
        }

        const users = getUsers();
        users[email] = {
          email,
          username,
          password,
          createdAt: new Date().toISOString(),
          verified: true
        };
        saveUsers(users);

        localStorage.setItem('currentUser', email);
        localStorage.removeItem('pendingSignup');

        setStatus('OTP verified! Redirecting...', 'success');
        setTimeout(() => (window.location.href = '/index.html'), 500);
      } catch (err) {
        console.error('[OTP] Verify error:', err);
        setStatus('Network error. Is the emulator running?', 'error');
        verifyBtn.disabled = false;
      }
    });
  }

  otpInputs[0].focus();
});
