// Forgot password page - uses OTP verification before password reset
import { auth } from './firebaseInit.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { handleError, clearAllErrors } from './errorMessages.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Cloud Functions base URL from config.js
const FUNCTIONS_BASE_URL = window.SOCYBERX_CONFIG?.FUNCTIONS_BASE_URL ?? 
  window.__SOCYBERX_CONFIG__?.FUNCTIONS_BASE_URL ?? 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/cyberrank-a4380/us-central1'
    : 'https://us-central1-cyberrank-a4380.cloudfunctions.net');

function setError(inputId, message) {
  const errorEl = document.querySelector(`[data-error-for="${inputId}"]`);
  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

function clearErrors(form) {
  form.querySelectorAll('.error').forEach(e => (e.textContent = ''));
}

function showMessage(message, type = 'success') {
  const messageEl = document.getElementById('reset-message');
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.className = `reset-message ${type}`;
  messageEl.style.display = 'block';

  if (type === 'success') {
    messageEl.style.color = '#10b981';
  } else {
    messageEl.style.color = '#f97373';
  }
}

function hideMessage() {
  const messageEl = document.getElementById('reset-message');
  if (messageEl) {
    messageEl.style.display = 'none';
    messageEl.textContent = '';
  }
}

// Error handling is now done via errorMessages.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('reset-email');
  const submitBtn = document.getElementById('reset-submit-btn');

  if (!form || !emailInput || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    clearAllErrors(form);
    hideMessage();

    const email = emailInput.value.trim();

    if (!email) {
      handleError('reset-email', 'Email is required. (البريد الإلكتروني مطلوب)', {
        errorType: 'field'
      });
      emailInput.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      handleError('reset-email', 'Please enter a valid email address. (يرجى إدخال عنوان بريد إلكتروني صحيح)', {
        errorType: 'field'
      });
      emailInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending verification code...';

    // ================== OTP VERIFICATION FLOW ==================
    // Step 1: Request OTP (user must verify before password reset)
    // Step 2: Redirect to OTP verification page
    // Step 3: After OTP verification, allow password reset

    try {
      // Store email for OTP verification
      localStorage.setItem('pendingPasswordReset', JSON.stringify({
        email: email,
        timestamp: Date.now()
      }));

      // Request OTP from secure backend
      const endpoint = `${FUNCTIONS_BASE_URL}/requestOtp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          purpose: 'reset_password'
        }),
      });

      const data = await res.json().catch(() => ({ 
        success: false, 
        error: res.statusText || 'Unknown error' 
      }));

      if (!res.ok || !data.success) {
        const error = new Error(data.error || `Failed to send OTP (${res.status})`);
        error.code = 'otp-send-failed';
        const friendlyMsg = handleError('forgot-password-form', error, {
          errorType: 'form',
          logToConsole: true,
          fallbackMessage: data.error || 'Failed to send verification code. Please try again.'
        });
        
        handleError('reset-email', error, { errorType: 'field' });
        showMessage(friendlyMsg, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Verification Code';
        localStorage.removeItem('pendingPasswordReset');
        return;
      }

      // OTP sent successfully
      showMessage('Verification code sent! Check your email. (تم إرسال رمز التحقق! تحقق من بريدك الإلكتروني)', 'success');
      
      // Redirect to OTP verification page
      const otpPath = typeof window.getPath === 'function' ? window.getPath('otp') : '/html/success.html';
      setTimeout(() => {
        window.location.href = otpPath;
      }, 1500);
      
    } catch (error) {
      console.error('[Forgot Password] Error:', error);
      const friendlyMsg = handleError('forgot-password-form', error, {
        errorType: 'form',
        logToConsole: true,
        fallbackMessage: 'Network error. Please check your connection and try again. (خطأ في الشبكة، يرجى التحقق من اتصالك والمحاولة مرة أخرى)'
      });
      
      handleError('reset-email', error, { errorType: 'field' });
      showMessage(friendlyMsg, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Verification Code';
      localStorage.removeItem('pendingPasswordReset');
    }
  });
});

