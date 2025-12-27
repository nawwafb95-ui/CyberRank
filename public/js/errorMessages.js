/**
 * Centralized Error Handling Utility for SOCyberX
 * 
 * Maps Firebase error codes and common app errors to user-friendly messages
 * in English with Arabic translations in parentheses.
 * 
 * Usage:
 *   import { getErrorMessage, handleError } from './errorMessages.js';
 *   
 *   try {
 *     await someFirebaseOperation();
 *   } catch (error) {
 *     const friendlyMsg = getErrorMessage(error);
 *     handleError('form-id', friendlyMsg);
 *   }
 */

/**
 * Error message mappings
 * Format: English message (Arabic translation)
 */
const ERROR_MESSAGES = {
  // Firebase Authentication Errors
  'auth/user-not-found': 'User not found. Please check your email. (المستخدم غير موجود. يرجى التحقق من بريدك الإلكتروني)',
  'auth/wrong-password': 'Incorrect password. Please try again. (كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى)',
  'auth/email-already-in-use': 'This email is already registered. Please use a different email or try logging in. (البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني مختلف أو محاولة تسجيل الدخول)',
  'auth/weak-password': 'Password is too weak. Please use at least 8 characters with uppercase, number, and symbol. (كلمة المرور ضعيفة. يرجى استخدام 8 أحرف على الأقل مع حرف كبير ورقم ورمز)',
  'auth/invalid-email': 'Invalid email address. Please enter a valid email. (عنوان بريد إلكتروني غير صحيح. يرجى إدخال بريد إلكتروني صحيح)',
  'auth/user-disabled': 'This account has been disabled. Please contact support. (تم تعطيل هذا الحساب. يرجى الاتصال بالدعم)',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later. (محاولات كثيرة فاشلة. يرجى المحاولة لاحقاً)',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support. (هذه العملية غير مسموحة. يرجى الاتصال بالدعم)',
  'auth/requires-recent-login': 'Please log out and log back in to complete this action. (يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى لإكمال هذا الإجراء)',
  'auth/network-request-failed': 'Network error. Please check your internet connection. (خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت)',
  'auth/invalid-credential': 'Invalid email or password. Please try again. (بريد إلكتروني أو كلمة مرور غير صحيحة. يرجى المحاولة مرة أخرى)',
  'auth/unauthorized-domain': 'This domain is not authorized. Please contact support. (هذا النطاق غير مخول. يرجى الاتصال بالدعم)',
  
  // Firebase Firestore Errors
  'permission-denied': 'You do not have permission to perform this action. (ليس لديك إذن لتنفيذ هذا الإجراء)',
  'unavailable': 'Service temporarily unavailable. Please try again later. (الخدمة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً)',
  'deadline-exceeded': 'Request timed out. Please try again. (انتهت مهلة الطلب. يرجى المحاولة مرة أخرى)',
  'unauthenticated': 'Please log in to continue. (يرجى تسجيل الدخول للمتابعة)',
  'not-found': 'The requested resource was not found. (لم يتم العثور على المورد المطلوب)',
  'already-exists': 'This item already exists. (هذا العنصر موجود بالفعل)',
  'failed-precondition': 'Operation cannot be completed. Please try again. (لا يمكن إكمال العملية. يرجى المحاولة مرة أخرى)',
  'aborted': 'Operation was cancelled. Please try again. (تم إلغاء العملية. يرجى المحاولة مرة أخرى)',
  'out-of-range': 'Invalid input. Please check your data. (إدخال غير صحيح. يرجى التحقق من بياناتك)',
  'internal': 'An internal error occurred. Please try again later. (حدث خطأ داخلي. يرجى المحاولة لاحقاً)',
  'unimplemented': 'This feature is not yet available. (هذه الميزة غير متاحة بعد)',
  'data-loss': 'Data loss occurred. Please try again. (حدث فقدان للبيانات. يرجى المحاولة مرة أخرى)',
  
  // Network & General Errors
  'network-error': 'Network error. Please check your internet connection and try again. (خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى)',
  'timeout': 'Request timed out. Please try again. (انتهت مهلة الطلب. يرجى المحاولة مرة أخرى)',
  'unknown-error': 'An unexpected error occurred. Please try again or contact support. (حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم)',
  
  // OTP Errors
  'otp-invalid': 'Invalid OTP code. Please check and try again. (رمز OTP غير صحيح. يرجى التحقق والمحاولة مرة أخرى)',
  'otp-expired': 'OTP code has expired. Please request a new one. (انتهت صلاحية رمز OTP. يرجى طلب رمز جديد)',
  'otp-send-failed': 'Failed to send OTP. Please try again. (فشل إرسال OTP. يرجى المحاولة مرة أخرى)',
  
  // Quiz/Challenge Errors
  'quiz-load-failed': 'Failed to load quiz. Please refresh the page. (فشل تحميل الاختبار. يرجى تحديث الصفحة)',
  'quiz-save-failed': 'Failed to save your results. Please try again. (فشل حفظ النتائج. يرجى المحاولة مرة أخرى)',
  'quiz-submit-failed': 'Failed to submit your answers. Please try again. (فشل إرسال إجاباتك. يرجى المحاولة مرة أخرى)',
  
  // Admin Errors
  'admin-permission-denied': 'Admin access required. (مطلوب وصول المسؤول)',
  'admin-action-failed': 'Admin action failed. Please try again. (فشل إجراء المسؤول. يرجى المحاولة مرة أخرى)',
  
  // Profile Errors
  'profile-update-failed': 'Failed to update profile. Please try again. (فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى)',
  'profile-load-failed': 'Failed to load profile. Please refresh the page. (فشل تحميل الملف الشخصي. يرجى تحديث الصفحة)',
};

/**
 * Get user-friendly error message from error object
 * @param {Error|Object} error - Error object (Firebase error or generic error)
 * @param {string} fallbackMessage - Optional fallback message if error code not found
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, fallbackMessage = null) {
  // Handle null/undefined
  if (!error) {
    return fallbackMessage || ERROR_MESSAGES['unknown-error'];
  }

  // Check for Firebase error code (auth/* or firestore error code)
  if (error.code) {
    const message = ERROR_MESSAGES[error.code];
    if (message) {
      return message;
    }
  }

  // Check for error message that might contain error code
  if (error.message) {
    // Try to extract Firebase error code from message
    const codeMatch = error.message.match(/(auth\/[a-z-]+|permission-denied|unavailable|deadline-exceeded)/i);
    if (codeMatch) {
      const code = codeMatch[1].toLowerCase();
      const message = ERROR_MESSAGES[code];
      if (message) {
        return message;
      }
    }

    // Check for network errors in message
    if (error.message.toLowerCase().includes('network') || 
        error.message.toLowerCase().includes('fetch') ||
        error.message.toLowerCase().includes('failed to fetch')) {
      return ERROR_MESSAGES['network-error'];
    }

    // Check for timeout errors
    if (error.message.toLowerCase().includes('timeout')) {
      return ERROR_MESSAGES['timeout'];
    }
  }

  // Check error type/name
  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    if (error.message && error.message.includes('fetch')) {
      return ERROR_MESSAGES['network-error'];
    }
  }

  // Return fallback or unknown error
  return fallbackMessage || ERROR_MESSAGES['unknown-error'];
}

/**
 * Handle error by displaying it in the UI and logging to console
 * @param {string|HTMLElement} target - Form ID, input ID, or error container element
 * @param {Error|Object|string} error - Error object or error message string
 * @param {Object} options - Options for error handling
 * @param {string} options.fallbackMessage - Custom fallback message
 * @param {boolean} options.logToConsole - Whether to log to console (default: true)
 * @param {string} options.errorType - Type of error ('field' for inline, 'form' for form-level)
 */
export function handleError(target, error, options = {}) {
  const {
    fallbackMessage = null,
    logToConsole = true,
    errorType = 'field' // 'field' for inline errors, 'form' for form-level error boxes
  } = options;

  // Get friendly error message
  const friendlyMessage = typeof error === 'string' 
    ? error 
    : getErrorMessage(error, fallbackMessage);

  // Log full technical error to console for developers
  if (logToConsole && typeof error === 'object' && error !== null) {
    console.error('[Error Handler] Technical error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    console.log('[Error Handler] User-friendly message:', friendlyMessage);
  }

  // Display error in UI
  if (errorType === 'field') {
    // Inline field error (existing setError pattern)
    if (typeof target === 'string') {
      // Target is an input ID
      const errorElement = document.querySelector(`[data-error-for="${target}"]`);
      if (errorElement) {
        errorElement.textContent = friendlyMessage;
        errorElement.classList.add('visible');
      } else {
        // Fallback: try to find by ID directly
        const input = document.getElementById(target);
        if (input) {
          const formGroup = input.closest('.form-group');
          if (formGroup) {
            let errorP = formGroup.querySelector('.error[data-error-for]');
            if (!errorP) {
              errorP = document.createElement('p');
              errorP.className = 'error';
              errorP.setAttribute('data-error-for', target);
              formGroup.appendChild(errorP);
            }
            errorP.textContent = friendlyMessage;
            errorP.classList.add('visible');
          }
        }
      }
    } else if (target instanceof HTMLElement) {
      // Target is an element
      target.textContent = friendlyMessage;
      target.classList.add('visible');
    }
  } else if (errorType === 'form') {
    // Form-level error box
    let errorBox;
    if (typeof target === 'string') {
      // Target is form ID - find or create error box
      const form = document.getElementById(target);
      if (form) {
        errorBox = form.querySelector('.error-box');
        if (!errorBox) {
          errorBox = document.createElement('div');
          errorBox.className = 'error-box';
          form.insertBefore(errorBox, form.firstChild);
        }
      }
    } else if (target instanceof HTMLElement) {
      errorBox = target;
    }

    if (errorBox) {
      errorBox.textContent = friendlyMessage;
      errorBox.classList.add('visible');
      // Auto-hide after 5 seconds (optional)
      setTimeout(() => {
        errorBox.classList.remove('visible');
      }, 5000);
    }
  }

  return friendlyMessage;
}

/**
 * Clear error for a specific field or form
 * @param {string|HTMLElement} target - Input ID, form ID, or error element
 * @param {string} errorType - 'field' or 'form'
 */
export function clearError(target, errorType = 'field') {
  if (errorType === 'field') {
    if (typeof target === 'string') {
      const errorElement = document.querySelector(`[data-error-for="${target}"]`);
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('visible');
      }
    } else if (target instanceof HTMLElement) {
      target.textContent = '';
      target.classList.remove('visible');
    }
  } else if (errorType === 'form') {
    let errorBox;
    if (typeof target === 'string') {
      const form = document.getElementById(target);
      if (form) {
        errorBox = form.querySelector('.error-box');
      }
    } else if (target instanceof HTMLElement) {
      errorBox = target;
    }

    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('visible');
    }
  }
}

/**
 * Clear all errors in a form
 * @param {string|HTMLElement} form - Form ID or form element
 */
export function clearAllErrors(form) {
  const formElement = typeof form === 'string' 
    ? document.getElementById(form) 
    : form;

  if (formElement) {
    // Clear inline field errors
    formElement.querySelectorAll('.error[data-error-for]').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });

    // Clear form-level error box
    const errorBox = formElement.querySelector('.error-box');
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.remove('visible');
    }
  }
}

/**
 * Wrap an async function with automatic error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string|HTMLElement} errorTarget - Target for error display
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(asyncFn, errorTarget, options = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(errorTarget, error, options);
      throw error; // Re-throw so caller can handle if needed
    }
  };
}

// Export error messages map for advanced usage
export { ERROR_MESSAGES };

