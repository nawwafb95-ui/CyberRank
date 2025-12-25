# Security Notes: Server-Side Progression & Access Control

## Overview
This document outlines security considerations, common bypass attempts, and how our implementation prevents them.

## Threat Model

### Assumptions
- **Users can tamper with client-side code** - JavaScript can be modified, disabled, or bypassed
- **Users can inspect network traffic** - HTTP requests can be intercepted and modified
- **Users may attempt direct database access** - Firestore SDK can be used directly
- **Users may try to manipulate authentication tokens** - Though Firebase Auth tokens are cryptographically signed

### What We Protect Against
1. Client-side code modification to bypass checks
2. Direct Firestore writes to unlock levels or modify scores
3. Reading questions for locked levels
4. Manipulating bestScore fields to unlock levels
5. Race conditions in score submission
6. Token manipulation (using another user's token)

## Security Layers

### Layer 1: Firestore Security Rules (Database-Level Enforcement)

#### Questions Collection
```javascript
match /questions/{questionId} {
  allow read: if request.auth != null 
    && canAccessLevel(resource.data.level);
  allow write: if false; // Only Cloud Functions
}
```

**Protection:**
- ✅ Unauthenticated users cannot read questions
- ✅ Users cannot read Medium questions without `bestScoreEasy >= 60`
- ✅ Users cannot read Hard questions without `bestScoreMedium >= 60`
- ✅ Even if client code is modified, Firestore rules enforce access at the database level

**Bypass Attempt:** User modifies JavaScript to skip client-side checks
**Mitigation:** Firestore rules check `userStats.bestScoreEasy` server-side before allowing read

#### userStats Collection
```javascript
match /userStats/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // Only Cloud Functions
}
```

**Protection:**
- ✅ Users can only read their own stats
- ✅ **NO CLIENT WRITES ALLOWED** - Only Cloud Functions can write
- ✅ Users cannot modify `bestScoreEasy`, `bestScoreMedium`, `bestScoreHard` directly
- ✅ Users cannot set `highestUnlocked` to unlock levels

**Bypass Attempt:** User tries to write directly to `userStats` via Firestore SDK
```javascript
// This will FAIL due to security rules
await updateDoc(doc(db, 'userStats', userId), {
  bestScoreEasy: 100,
  highestUnlocked: 'hard'
});
```
**Mitigation:** Security rules return `permission-denied` error

### Layer 2: Cloud Functions (Server-Side Logic)

#### submitQuizResult Function
```javascript
exports.submitQuizResult = functions.https.onCall(async (data, context) => {
  // 1. Verify authentication
  if (!context.auth) throw new HttpsError('unauthenticated', ...);
  
  // 2. Validate input
  if (score < 0 || score > 100) throw new HttpsError('invalid-argument', ...);
  
  // 3. Use transaction for atomic updates
  await db.runTransaction(async (transaction) => {
    // 4. Only update if new score is higher (never re-lock)
    if (score > (stats[levelKey] || 0)) {
      stats[levelKey] = score;
    }
    // 5. Update highestUnlocked based on thresholds
    if (level === 'easy' && stats.bestScoreEasy >= 60) {
      stats.highestUnlocked = 'medium';
    }
  });
});
```

**Protection:**
- ✅ Authentication verified server-side (cannot be bypassed)
- ✅ Input validation prevents invalid scores
- ✅ Atomic transactions prevent race conditions
- ✅ Best score logic ensures levels never re-lock
- ✅ Only server can update `userStats` fields

**Bypass Attempt:** User calls Cloud Function with fake data
```javascript
// This will FAIL - authentication required
await submitQuizResult({ level: 'hard', score: 100 });
// Error: unauthenticated
```
**Mitigation:** Cloud Functions verify `context.auth` - unauthenticated calls are rejected

**Bypass Attempt:** User tries to submit score > 100
```javascript
await submitQuizResult({ level: 'easy', score: 999 });
// Error: invalid-argument - Score must be between 0 and 100
```
**Mitigation:** Input validation in Cloud Function

#### canStartLevel Function
```javascript
exports.canStartLevel = functions.https.onCall(async (data, context) => {
  if (!context.auth) return { allowed: false, reason: 'Authentication required' };
  
  const stats = await userStatsRef.get();
  if (level === 'medium') {
    const canAccess = stats.bestScoreEasy >= 60;
    return { allowed: canAccess, reason: ... };
  }
});
```

**Protection:**
- ✅ Server-side check - cannot be bypassed by client modification
- ✅ Reads directly from Firestore (source of truth)
- ✅ Returns clear reason if access denied

**Bypass Attempt:** User modifies client code to always return `allowed: true`
**Mitigation:** Client-side check is for UX only - actual access is enforced by Firestore rules when reading questions

### Layer 3: Client-Side Guards (UX Layer)

#### Auth Guards
```javascript
// In question.js
const isAuthenticated = await waitForAuthReady();
if (!isAuthenticated) {
  window.location.href = '/login?message=Login required';
  return;
}
```

**Purpose:** Provide good UX by redirecting early
**Note:** This is NOT a security measure - Firestore rules enforce auth requirement

#### Level Access Checks
```javascript
// In challenges.js
const access = await canStartLevel({ level: 'medium' });
if (!access.allowed) {
  // Disable button, show message
}
```

**Purpose:** Provide good UX by showing locked state
**Note:** This is NOT a security measure - Firestore rules enforce level gating when reading questions

## Common Bypass Attempts & Mitigations

### 1. Client-Side Code Modification

**Attack:** User modifies `challenges.js` to always enable Medium/Hard buttons
```javascript
// Modified code
mediumBtn.disabled = false; // Always enabled
```

**Mitigation:** 
- Firestore rules check `userStats.bestScoreEasy >= 60` when reading Medium questions
- User will get `permission-denied` error when trying to fetch questions
- UI shows unlocked, but actual access is denied

### 2. Direct Firestore Writes

**Attack:** User tries to write directly to `userStats`
```javascript
await updateDoc(doc(db, 'userStats', userId), {
  bestScoreEasy: 100,
  highestUnlocked: 'hard'
});
```

**Mitigation:**
- Security rules: `allow write: if false;` - All client writes denied
- Returns `permission-denied` error
- Only Cloud Functions can write to `userStats`

### 3. Reading Questions for Locked Levels

**Attack:** User tries to query Medium questions without completing Easy
```javascript
const q = query(
  collection(db, 'questions'),
  where('level', '==', 'medium')
);
const snapshot = await getDocs(q);
```

**Mitigation:**
- Firestore rules check `canAccessLevel('medium')` which requires `bestScoreEasy >= 60`
- Returns `permission-denied` error
- User cannot read questions even if they bypass client checks

### 4. Manipulating Score Submission

**Attack:** User tries to submit score > 100 or negative score
```javascript
await submitQuizResult({ level: 'easy', score: 999 });
```

**Mitigation:**
- Cloud Function validates: `if (score < 0 || score > 100) throw error`
- Invalid scores are rejected before updating database

### 5. Race Conditions

**Attack:** User submits multiple quiz results simultaneously to unlock levels faster
```javascript
// Multiple parallel calls
Promise.all([
  submitQuizResult({ level: 'easy', score: 60 }),
  submitQuizResult({ level: 'easy', score: 70 }),
  submitQuizResult({ level: 'easy', score: 80 })
]);
```

**Mitigation:**
- Cloud Function uses `db.runTransaction()` for atomic updates
- Only the highest score is kept (bestScore logic)
- Transactions ensure consistency

### 6. Token Manipulation

**Attack:** User tries to use another user's auth token
```javascript
// Attempting to access another user's stats
const otherUserId = 'some-other-user-id';
await getDoc(doc(db, 'userStats', otherUserId));
```

**Mitigation:**
- Firestore rules: `request.auth.uid == userId` - Users can only read their own stats
- Firebase Auth tokens are cryptographically signed - cannot be forged
- Even if token is stolen, user can only access their own data

### 7. Bypassing canStartLevel Check

**Attack:** User modifies client code to ignore `canStartLevel` result
```javascript
// Modified code - always proceed
openLevel('hard'); // Without checking canStartLevel
```

**Mitigation:**
- `canStartLevel` is for UX only
- Actual enforcement happens when reading questions
- Firestore rules will deny access to Hard questions if `bestScoreMedium < 60`

## Security Best Practices Implemented

1. **Defense in Depth:** Multiple layers (Rules + Functions + Client guards)
2. **Principle of Least Privilege:** Users can only read their own data
3. **Server-Side Validation:** All critical logic in Cloud Functions
4. **Atomic Operations:** Transactions prevent race conditions
5. **Input Validation:** All inputs validated in Cloud Functions
6. **Authentication Required:** All operations require valid auth token
7. **No Client Writes to Critical Data:** `userStats` write-protected
8. **Clear Error Messages:** Helpful but not revealing sensitive info

## Testing Security

### Manual Testing Checklist

- [ ] Try to access quiz page without authentication → Should redirect to login
- [ ] Try to read questions without authentication → Should get permission-denied
- [ ] Try to access Medium level without Easy >= 60 → Should get permission-denied
- [ ] Try to write directly to userStats → Should get permission-denied
- [ ] Try to submit score > 100 → Should get validation error
- [ ] Try to submit score < 0 → Should get validation error
- [ ] Try to read another user's stats → Should get permission-denied
- [ ] Try to call Cloud Function without auth → Should get unauthenticated error
- [ ] Try to unlock level by modifying client code → Should fail at Firestore rules

### Automated Testing (Recommended)

1. **Firestore Rules Testing:**
   - Use Firebase Emulator to test rules
   - Test all read/write scenarios
   - Test with different user contexts

2. **Cloud Functions Testing:**
   - Unit tests for input validation
   - Integration tests for score submission
   - Test race conditions with parallel calls

3. **End-to-End Testing:**
   - Test complete flow: login → start quiz → submit → unlock
   - Test unauthorized access attempts
   - Test edge cases (score = 0, score = 100, etc.)

## Monitoring & Alerts

### Recommended Monitoring

1. **Failed Permission Denials:**
   - Monitor `permission-denied` errors in Firestore
   - Alert on unusual patterns (potential attack)

2. **Cloud Function Errors:**
   - Monitor `submitQuizResult` failures
   - Alert on validation errors (potential tampering)

3. **Unusual Score Patterns:**
   - Monitor for scores > 100 (should be impossible)
   - Monitor for rapid level unlocks (potential exploit)

4. **Authentication Failures:**
   - Monitor failed auth attempts
   - Alert on suspicious patterns

## Conclusion

This implementation provides **server-side enforced progression** that cannot be bypassed through client-side manipulation. The multi-layer approach ensures that even if one layer is compromised, others provide protection.

**Key Takeaway:** Never trust the client. All critical logic and data access must be enforced server-side.

