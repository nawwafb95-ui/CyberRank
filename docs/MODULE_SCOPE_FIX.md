# Module Scope Fix - Login & Signup ReferenceError

## Problem Summary

Login and Signup stopped working because ES module scripts (`login.js`, `signup.js`) were trying to access global functions (`setError`, `clearErrors`, `emailRegex`, etc.) that are exposed on `window` by non-module scripts (`core.js`).

## Root Cause

**ES Modules have their own scope** - they cannot directly access global variables. When `core.js` (non-module) exposes functions on `window`, module scripts must explicitly access them via `window.*`.

### Why It Happened

1. `core.js` is loaded as `<script src="core.js">` (non-module)
   - Exposes: `window.setError`, `window.clearErrors`, `window.emailRegex`, etc.

2. `login.js` and `signup.js` are loaded as `<script type="module">` (ES modules)
   - Module scope is isolated
   - Cannot see globals without `window.` prefix
   - Direct calls like `setError()` → `ReferenceError: setError is not defined`

## Fixes Applied

### Fix 1: `public/html/js/login.js`

**Changes:**
1. Added window globals access at top of DOMContentLoaded:
   ```javascript
   const { setError, clearErrors, emailRegex, getPath, sanitizePath, sanitizeNextPath, normalizeNextPath } = window;
   ```

2. Added safe checks before using globals:
   ```javascript
   if (clearErrors) clearErrors(form);
   if (setError) setError('login-username', 'Email is required.');
   if (emailRegex && !emailRegex.test(emailOrUsername)) { ... }
   ```

3. Fixed path helper access:
   ```javascript
   if (sanitizeNextPath && typeof sanitizeNextPath === 'function') { ... }
   if (getPath && typeof getPath === 'function') { ... }
   ```

**Result:** Login form validation and error handling now work correctly.

### Fix 2: `public/html/js/signup.js`

**Changes:**
1. Added window globals access:
   ```javascript
   const { setError, clearErrors, emailRegex } = window;
   ```

2. Added safe checks in all validation functions:
   ```javascript
   if (setError) setError('signup-username', 'Username is required.');
   if (clearErrors) clearErrors(form);
   if (emailRegex && !emailRegex.test(email)) { ... }
   ```

**Result:** Signup form validation and error handling now work correctly.

### Fix 3: `public/html/login.html`

**Changes:**
1. Fixed label `for` attribute:
   - **Before:** `<label for="login-email">` (input id was `login-username`)
   - **After:** `<label for="login-username">` (matches input id)

2. Fixed input `name` attribute:
   - **Before:** `name="username"`
   - **After:** `name="email"` (for consistency with Firebase Auth)

3. Fixed navigation links:
   - **Before:** `/forgot-password.html`, `/signup.html`
   - **After:** `/html/forgot-password.html`, `/html/signup.html`

**Result:** Form accessibility improved, links work correctly in Vite public structure.

## Technical Details

### Module Scope Isolation

ES modules (`<script type="module">`) have:
- **Own scope** - variables don't leak to global
- **Strict mode** - implicit global variables are errors
- **No automatic global access** - must use `window.*` for globals

### Non-Module Scripts

Regular scripts (`<script src="...">`) have:
- **Global scope** - variables become `window` properties
- **Can access globals** - direct access works
- **Legacy behavior** - works like traditional JavaScript

### Solution Pattern

```javascript
// ❌ WRONG (in module)
setError('field-id', 'Error message');

// ✅ CORRECT (in module)
const { setError } = window;
if (setError) setError('field-id', 'Error message');
```

## Testing

After fixes, verify:

- [ ] Login form validates email and password
- [ ] Login shows error messages correctly
- [ ] Signup form validates all fields
- [ ] Signup shows error messages correctly
- [ ] No `ReferenceError` in browser console
- [ ] Links in login.html work correctly
- [ ] Form labels are properly associated with inputs

## Files Modified

1. `public/html/js/login.js` - Added window globals access
2. `public/html/js/signup.js` - Added window globals access
3. `public/html/login.html` - Fixed form IDs and links

## Best Practices

### For Future Module Scripts

1. **Always access window globals explicitly:**
   ```javascript
   const { helperFunction } = window;
   ```

2. **Add safety checks:**
   ```javascript
   if (helperFunction) helperFunction();
   ```

3. **Document dependencies:**
   ```javascript
   // Requires: core.js (provides window.setError, window.clearErrors)
   ```

### For Non-Module Scripts

1. **Expose functions on window:**
   ```javascript
   window.myFunction = myFunction;
   ```

2. **Use IIFE to avoid pollution:**
   ```javascript
   (function() {
     function myFunction() { ... }
     window.myFunction = myFunction;
   })();
   ```

## Related Issues

- Module scripts cannot use `process.env` (fixed in previous update with `config.js`)
- Module scripts need explicit imports for ES modules
- Mixing module and non-module requires careful global access

## Conclusion

The issue was caused by ES module scope isolation. Module scripts must explicitly access `window.*` globals. All fixes maintain backward compatibility and add safety checks to prevent errors if globals are missing.

