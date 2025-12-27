# Error Handling Integration Guide

This guide shows how to integrate the centralized error handling system (`errorMessages.js`) into your Firebase operations.

## Quick Start

```javascript
import { handleError, clearAllErrors, getErrorMessage } from './errorMessages.js';

// In your async function
try {
  await someFirebaseOperation();
} catch (error) {
  handleError('form-id', error, { errorType: 'form' });
}
```

## Integration Patterns

### 1. Form Submission (Login, Signup, etc.)

```javascript
import { handleError, clearAllErrors } from './errorMessages.js';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Clear previous errors
  clearAllErrors(form);
  
  try {
    await firebaseOperation();
    // Success handling...
  } catch (error) {
    // Show form-level error box
    handleError('form-id', error, {
      errorType: 'form',
      logToConsole: true
    });
    
    // Optionally show field-specific errors
    if (error.code === 'auth/invalid-email') {
      handleError('email-input-id', error, { errorType: 'field' });
    }
  }
});
```

### 2. OTP Verification

```javascript
import { handleError } from './errorMessages.js';

async function verifyOTP(email, otp) {
  try {
    const res = await fetch('/verifyOtp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    
    if (!res.ok) {
      const error = new Error('OTP verification failed');
      error.code = 'otp-invalid';
      throw error;
    }
    
    // Success...
  } catch (error) {
    handleError('otp-form', error, {
      errorType: 'form',
      logToConsole: true
    });
  }
}
```

### 3. Quiz/Challenge Operations

```javascript
import { handleError } from './errorMessages.js';

async function loadQuiz(quizId) {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const error = new Error('Quiz not found');
      error.code = 'not-found';
      throw error;
    }
    
    return docSnap.data();
  } catch (error) {
    handleError('quiz-container', error, {
      errorType: 'form',
      logToConsole: true,
      fallbackMessage: 'Failed to load quiz. Please refresh the page.'
    });
    throw error; // Re-throw if caller needs to handle
  }
}

async function saveQuizResults(userId, results) {
  try {
    const resultsRef = doc(db, 'users', userId, 'results', Date.now().toString());
    await setDoc(resultsRef, results);
  } catch (error) {
    handleError('quiz-form', error, {
      errorType: 'form',
      logToConsole: true
    });
  }
}
```

### 4. Profile Updates

```javascript
import { handleError } from './errorMessages.js';

async function updateProfile(userId, updates) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    // Check for permission errors
    if (error.code === 'permission-denied') {
      handleError('profile-form', error, {
        errorType: 'form',
        logToConsole: true
      });
    } else {
      handleError('profile-form', error, {
        errorType: 'form',
        logToConsole: true,
        fallbackMessage: 'Failed to update profile. Please try again.'
      });
    }
  }
}
```

### 5. Admin Operations

```javascript
import { handleError } from './errorMessages.js';

async function adminAction(action, data) {
  try {
    // Check admin permission first
    const user = auth.currentUser;
    if (!user) {
      const error = new Error('Not authenticated');
      error.code = 'unauthenticated';
      throw error;
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.data()?.role !== 'admin') {
      const error = new Error('Admin access required');
      error.code = 'admin-permission-denied';
      throw error;
    }
    
    // Perform admin action...
  } catch (error) {
    handleError('admin-panel', error, {
      errorType: 'form',
      logToConsole: true
    });
  }
}
```

### 6. Network Operations with Retry

```javascript
import { handleError, getErrorMessage } from './errorMessages.js';

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (i === maxRetries - 1) {
        // Last attempt failed
        const friendlyMsg = getErrorMessage(error);
        handleError('network-container', error, {
          errorType: 'form',
          logToConsole: true
        });
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 7. Using withErrorHandling Wrapper

```javascript
import { withErrorHandling } from './errorMessages.js';

// Wrap an async function with automatic error handling
const safeLoadQuiz = withErrorHandling(
  async (quizId) => {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Quiz not found');
    return docSnap.data();
  },
  'quiz-container',
  { errorType: 'form' }
);

// Use it
try {
  const quiz = await safeLoadQuiz('quiz-123');
} catch (error) {
  // Error already handled by wrapper
}
```

## HTML Markup

### Form-Level Error Box

Add this inside your form (before form fields):

```html
<form id="my-form">
  <!-- Form-level error box -->
  <div class="error-box" style="display: none;"></div>
  
  <!-- Form fields... -->
</form>
```

### Field-Level Error Messages

Field errors use the existing pattern with `data-error-for`:

```html
<div class="form-group">
  <input id="email-input" type="email" />
  <p class="error" data-error-for="email-input"></p>
</div>
```

## Error Types

- **`errorType: 'field'`** - Inline error under specific input field
- **`errorType: 'form'`** - Error box at top of form

## Available Error Codes

The system recognizes these Firebase error codes:
- `auth/user-not-found`
- `auth/wrong-password`
- `auth/email-already-in-use`
- `auth/weak-password`
- `auth/invalid-email`
- `auth/network-request-failed`
- `permission-denied`
- `unavailable`
- `not-found`
- `otp-invalid`
- `otp-expired`
- `quiz-load-failed`
- `quiz-save-failed`
- And more...

See `errorMessages.js` for the complete list.

## Best Practices

1. **Always clear errors before new operations:**
   ```javascript
   clearAllErrors(form);
   ```

2. **Log technical errors to console:**
   ```javascript
   handleError('form-id', error, { logToConsole: true });
   ```

3. **Use field errors for validation, form errors for async operations:**
   ```javascript
   // Validation error
   handleError('email-input', 'Email is required', { errorType: 'field' });
   
   // Firebase error
   handleError('login-form', error, { errorType: 'form' });
   ```

4. **Provide fallback messages for unknown errors:**
   ```javascript
   handleError('form-id', error, {
     fallbackMessage: 'Something went wrong. Please try again.'
   });
   ```

5. **Don't expose technical details to users:**
   - Technical errors are automatically logged to console
   - Users only see friendly messages with Arabic translations

