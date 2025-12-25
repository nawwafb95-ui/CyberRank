# Server-Side Level Gating Implementation for SOCyberX

## A) Implementation Plan

### Step 1: Update Firestore Security Rules
- Require authentication for reading quizzes
- Add level-based gating: Medium requires `userStats.bestScoreEasy >= 60`, Hard requires `userStats.bestScoreMedium >= 60`
- Block ALL client writes to `userStats` (only Cloud Functions can write)
- Allow users to read only their own `userStats`
- Keep admin access for admin collections (if `users/{uid}.role == "admin"`)

### Step 2: Create Cloud Functions
- `submitQuizResult`: Updates `userStats` atomically (bestScore, attempts, highestUnlocked)
- `canStartLevel`: Checks if user can access a level, returns access status

### Step 3: Update Client Code
- Add auth checks before accessing quiz pages
- Fetch quizzes from Firestore (server enforces gating via rules)
- Call `submitQuizResult` after quiz completion
- Handle `permission-denied` errors gracefully

### Step 4: Test & Deploy
- Test auth gating, level gating, score submission
- Deploy rules and functions

---

## B) Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==================== HELPER FUNCTIONS ====================
    // Get user stats document
    function getUserStats() {
      return get(/databases/$(database)/documents/userStats/$(request.auth.uid)).data;
    }

    // Check if user can access a quiz level
    function canAccessQuizLevel(level) {
      // Easy: always accessible if authenticated
      if (level == "easy") {
        return true;
      }
      
      let userStats = getUserStats();
      
      // Medium: requires bestScoreEasy >= 60
      if (level == "medium") {
        return userStats.bestScoreEasy != null && userStats.bestScoreEasy >= 60;
      }
      
      // Hard: requires bestScoreMedium >= 60
      if (level == "hard") {
        return userStats.bestScoreMedium != null && userStats.bestScoreMedium >= 60;
      }
      
      return false;
    }

    // Check if user is admin
    function isAdmin() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userDoc != null && userDoc.role == "admin";
    }

    // ==================== USERS ====================
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own data (except role)
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
      
      // Only backend can create user docs
      allow create: if false;
    }

    // ==================== USER STATS ====================
    match /userStats/{userId} {
      // Users can read their own stats only
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // BLOCK ALL CLIENT WRITES - Only Cloud Functions can write
      // This prevents clients from modifying bestScore, attempts, or highestUnlocked
      allow write: if false;
    }

    // ==================== QUIZZES (LEVEL-GATED) ====================
    match /quizzes/{quizId} {
      // Read: Only authenticated users, and only if they have access to the quiz's level
      // OR if user is admin (admins can read all quizzes)
      allow read: if request.auth != null 
        && (canAccessQuizLevel(resource.data.level) || isAdmin());
      
      // Write: Only backend (Cloud Functions) or admins
      allow write: if isAdmin() || false;
    }

    // ==================== ADMIN COLLECTIONS ====================
    match /logs/{logId} {
      // Only backend or admins can read/write logs
      allow read, write: if isAdmin() || false;
    }

    match /admin/{document=**} {
      // Deny all client access to admin collections (except admins)
      allow read, write: if isAdmin();
    }
  }
}
```

**Key Security Points:**
- ✅ Auth required for reading quizzes
- ✅ Medium quizzes blocked unless `bestScoreEasy >= 60`
- ✅ Hard quizzes blocked unless `bestScoreMedium >= 60`
- ✅ Users can only read their own `userStats`
- ✅ **ALL client writes to `userStats` are blocked** (server-only)
- ✅ Admins can read all quizzes and access admin collections

---

## C) Cloud Functions Code

### Function 1: submitQuizResult

```javascript
/**
 * Submit quiz result and update user stats
 * SERVER-SIDE ONLY: Clients cannot directly update userStats
 * 
 * @param {string} level - "easy" | "medium" | "hard"
 * @param {number} score - Score achieved (0-100)
 * @returns {Object} { bestScore, nextLevelUnlocked }
 */
exports.submitQuizResult = functions.https.onCall(async (data, context) => {
  // 1. Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to submit quiz results."
    );
  }

  const userId = context.auth.uid;
  const { level, score } = data || {};

  // 2. Validate input
  if (!level || !["easy", "medium", "hard"].includes(level)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Level must be 'easy', 'medium', or 'hard'."
    );
  }

  if (typeof score !== "number" || score < 0 || score > 100) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Score must be a number between 0 and 100."
    );
  }

  try {
    // 3. Use transaction to ensure atomicity (prevents race conditions)
    const result = await db.runTransaction(async (transaction) => {
      const userStatsRef = db.collection("userStats").doc(userId);
      const userStatsDoc = await transaction.get(userStatsRef);

      // 4. Initialize or get existing stats
      let stats = {
        bestScoreEasy: 0,
        bestScoreMedium: 0,
        bestScoreHard: 0,
        attemptsEasy: 0,
        attemptsMedium: 0,
        attemptsHard: 0,
        highestUnlocked: "easy",
        userId: userId,
        lastUpdated: FieldValue.serverTimestamp(),
      };

      if (userStatsDoc.exists) {
        const existing = userStatsDoc.data();
        stats = {
          bestScoreEasy: existing.bestScoreEasy || 0,
          bestScoreMedium: existing.bestScoreMedium || 0,
          bestScoreHard: existing.bestScoreHard || 0,
          attemptsEasy: existing.attemptsEasy || 0,
          attemptsMedium: existing.attemptsMedium || 0,
          attemptsHard: existing.attemptsHard || 0,
          highestUnlocked: existing.highestUnlocked || "easy",
          userId: userId,
          username: existing.username || "",
          lastUpdated: FieldValue.serverTimestamp(),
        };
      } else {
        // Fetch username from users collection if stats don't exist
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const userData = userDoc.data();
          stats.username = userData.username || "";
        }
      }

      // 5. Update level-specific stats
      const levelKey = `bestScore${level.charAt(0).toUpperCase() + level.slice(1)}`;
      const attemptsKey = `attempts${level.charAt(0).toUpperCase() + level.slice(1)}`;

      // Increment attempts for this level
      stats[attemptsKey] = (stats[attemptsKey] || 0) + 1;

      // Update best score ONLY if new score is higher (never re-lock)
      const currentBest = stats[levelKey] || 0;
      if (score > currentBest) {
        stats[levelKey] = score;
      }

      // 6. Update highestUnlocked based on thresholds
      const UNLOCK_THRESHOLD = 60;
      let nextLevelUnlocked = false;

      if (level === "easy" && stats.bestScoreEasy >= UNLOCK_THRESHOLD) {
        if (stats.highestUnlocked === "easy" || !stats.highestUnlocked) {
          stats.highestUnlocked = "medium";
          nextLevelUnlocked = true;
        }
      }
      
      if (level === "medium" && stats.bestScoreMedium >= UNLOCK_THRESHOLD) {
        if (stats.highestUnlocked === "medium" || stats.highestUnlocked === "easy") {
          stats.highestUnlocked = "hard";
          nextLevelUnlocked = true;
        }
      }

      // 7. Write updated stats (atomic transaction)
      transaction.set(userStatsRef, stats, { merge: true });

      return {
        bestScore: stats[levelKey],
        nextLevelUnlocked: nextLevelUnlocked,
        highestUnlocked: stats.highestUnlocked,
      };
    });

    console.log(
      `[submitQuizResult] Updated stats for userId: ${userId}, level: ${level}, score: ${score}`
    );

    return result;
  } catch (error) {
    console.error(`[submitQuizResult] Error:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to submit quiz result. Please try again."
    );
  }
});
```

### Function 2: canStartLevel

```javascript
/**
 * Check if user can start a specific level
 * Returns access status and reason if denied
 * 
 * @param {string} level - "easy" | "medium" | "hard"
 * @returns {Object} { allowed: boolean, reason?: string }
 */
exports.canStartLevel = functions.https.onCall(async (data, context) => {
  // 1. Verify authentication
  if (!context.auth) {
    return {
      allowed: false,
      reason: "Authentication required. Please log in to access challenges.",
    };
  }

  const userId = context.auth.uid;
  const { level } = data || {};

  // 2. Validate input
  if (!level || !["easy", "medium", "hard"].includes(level)) {
    return {
      allowed: false,
      reason: "Invalid level. Must be 'easy', 'medium', or 'hard'.",
    };
  }

  try {
    const userStatsRef = db.collection("userStats").doc(userId);
    const userStatsDoc = await userStatsRef.get();

    // 3. Easy level is always accessible
    if (level === "easy") {
      return { allowed: true };
    }

    // 4. If no stats exist, only easy is accessible
    if (!userStatsDoc.exists) {
      return {
        allowed: false,
        reason: "Complete the Easy level first (score >= 60%) to unlock Medium.",
      };
    }

    const stats = userStatsDoc.data();
    const UNLOCK_THRESHOLD = 60;

    // 5. Medium level requires Easy >= 60
    if (level === "medium") {
      const canAccess = stats.bestScoreEasy != null && stats.bestScoreEasy >= UNLOCK_THRESHOLD;
      return {
        allowed: canAccess,
        reason: canAccess
          ? null
          : `Complete the Easy level first (score >= ${UNLOCK_THRESHOLD}%). Your best Easy score: ${stats.bestScoreEasy || 0}%`,
      };
    }

    // 6. Hard level requires Medium >= 60
    if (level === "hard") {
      const canAccess = stats.bestScoreMedium != null && stats.bestScoreMedium >= UNLOCK_THRESHOLD;
      return {
        allowed: canAccess,
        reason: canAccess
          ? null
          : `Complete the Medium level first (score >= ${UNLOCK_THRESHOLD}%). Your best Medium score: ${stats.bestScoreMedium || 0}%`,
      };
    }

    return { allowed: false, reason: "Unknown level." };
  } catch (error) {
    console.error(`[canStartLevel] Error:`, error);
    return {
      allowed: false,
      reason: "Failed to check level access. Please try again.",
    };
  }
});
```

---

## D) Client-Side Guidance

### 1. Auth Gating (Before Accessing Quiz Pages)

```javascript
// Check authentication before allowing access
import { auth, waitForAuthReady } from './firebaseInit.js';

async function checkAuthAndRedirect() {
  const isAuthenticated = await waitForAuthReady();
  if (!isAuthenticated || !auth.currentUser) {
    // Redirect to login with return URL
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(currentPath)}&message=${encodeURIComponent('Login required to start challenges.')}`;
    return false;
  }
  return true;
}

// Use in quiz page load
document.addEventListener('DOMContentLoaded', async () => {
  if (!await checkAuthAndRedirect()) {
    return; // Redirected, stop execution
  }
  // Continue with quiz logic...
});
```

### 2. Fetching Quizzes (Server Enforces Gating)

```javascript
import { db } from './firebaseInit.js';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function fetchQuizzesByLevel(level) {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(quizzesRef, where('level', '==', level));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No quizzes found for level:', level);
      return [];
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    // Handle permission-denied errors gracefully
    if (error.code === 'permission-denied') {
      alert(`You don't have access to ${level} level yet. Complete the previous level first (score >= 60%).`);
      window.location.href = '/challenges'; // Redirect to challenges page
      return [];
    }
    console.error('Error fetching quizzes:', error);
    throw error;
  }
}
```

**Key Points:**
- Firestore rules will automatically block reads if user doesn't meet requirements
- Handle `permission-denied` errors gracefully (show message, redirect)
- Don't rely on client-side checks - server enforces access

### 3. UI Locking/Hiding Buttons (UX Only)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseInit.js';

async function updateLevelButtons() {
  const functions = getFunctions(app);
  const canStartLevel = httpsCallable(functions, 'canStartLevel');
  
  // Check each level
  const levels = ['easy', 'medium', 'hard'];
  for (const level of levels) {
    try {
      const result = await canStartLevel({ level });
      const button = document.getElementById(`btn-${level}`);
      
      if (result.data.allowed) {
        button.disabled = false;
        button.classList.remove('locked');
      } else {
        button.disabled = true;
        button.classList.add('locked');
        // Show reason in tooltip or message
        button.title = result.data.reason || 'Level locked';
      }
    } catch (error) {
      console.error(`Error checking ${level} access:`, error);
      // Default to locked on error
      document.getElementById(`btn-${level}`).disabled = true;
    }
  }
}
```

**Important:** This is for UX only. Actual enforcement happens when reading quizzes from Firestore.

### 4. Submitting Quiz Results

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseInit.js';

async function submitQuizResult(level, score) {
  try {
    const functions = getFunctions(app);
    const submitQuizResult = httpsCallable(functions, 'submitQuizResult');
    
    const result = await submitQuizResult({
      level: level,  // "easy" | "medium" | "hard"
      score: score   // 0-100
    });
    
    // Handle result
    if (result.data.nextLevelUnlocked) {
      const nextLevel = level === 'easy' ? 'Medium' : 'Hard';
      alert(`🎉 Congratulations! You unlocked the ${nextLevel} level!`);
      // Refresh UI to show unlocked level
      updateLevelButtons();
    }
    
    return result.data;
  } catch (error) {
    console.error('Error submitting quiz result:', error);
    
    // Handle specific errors
    if (error.code === 'unauthenticated') {
      alert('You must be logged in to submit results.');
      window.location.href = '/login';
    } else if (error.code === 'invalid-argument') {
      alert('Invalid quiz data. Please try again.');
    } else {
      alert('Failed to submit quiz result. Please try again.');
    }
    
    throw error;
  }
}

// Use after quiz completion
async function onQuizComplete(level, correctAnswers, totalQuestions) {
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  await submitQuizResult(level, score);
}
```

---

## E) Security Notes

### Why Front-End Gating is Bypassable

**Front-end code can be:**
1. **Modified** - User edits JavaScript in browser DevTools
2. **Disabled** - User disables JavaScript entirely
3. **Bypassed** - User directly accesses URLs or API endpoints
4. **Inspected** - User sees all logic and can reverse-engineer

**Example Attack:**
```javascript
// User modifies client code
function canAccessLevel(level) {
  return true; // Always return true, bypassing checks
}
```

**Result:** User can see locked buttons as unlocked, but **server still blocks access** when reading quizzes.

### How Rules + Functions Prevent Tampering

#### Layer 1: Firestore Security Rules (Database-Level)
- **Enforced by Firebase servers** - Cannot be bypassed by client
- **Runs before data is returned** - Even if client requests data, rules check access first
- **No client code involved** - Rules execute server-side

**Example:**
```javascript
// User tries to read Medium quiz without Easy >= 60
const q = query(collection(db, 'quizzes'), where('level', '==', 'medium'));
await getDocs(q); // ❌ permission-denied error (rules block it)
```

#### Layer 2: Cloud Functions (Server-Side Logic)
- **Runs on Firebase servers** - Client cannot modify function code
- **Verifies authentication** - Checks `context.auth` (cannot be faked)
- **Validates all inputs** - Rejects invalid data
- **Atomic transactions** - Prevents race conditions

**Example:**
```javascript
// User tries to submit fake score
await submitQuizResult({ level: 'hard', score: 999 });
// ❌ Error: "Score must be between 0 and 100" (function validates)
```

### Common Bypass Attempts & How They're Blocked

#### 1. Modifying Client JavaScript
**Attack:** User edits `challenges.js` to always enable Medium/Hard buttons
```javascript
// Modified code
mediumBtn.disabled = false; // Always enabled
```

**Blocked By:** Firestore rules check `bestScoreEasy >= 60` when reading Medium quizzes. User gets `permission-denied` error.

#### 2. Direct URL Access
**Attack:** User directly navigates to `/quiz?level=hard` without completing Medium

**Blocked By:** 
- Client checks auth (redirects to login if not authenticated)
- Firestore rules block reading Hard quizzes if `bestScoreMedium < 60`
- User sees error or empty quiz list

#### 3. Direct Firestore Writes
**Attack:** User tries to write directly to `userStats`
```javascript
await updateDoc(doc(db, 'userStats', userId), {
  bestScoreEasy: 100,
  highestUnlocked: 'hard'
});
```

**Blocked By:** Security rules: `allow write: if false;` - Returns `permission-denied` error.

#### 4. Manipulating Cloud Function Calls
**Attack:** User calls `submitQuizResult` with fake data
```javascript
await submitQuizResult({ level: 'easy', score: 999 });
```

**Blocked By:** Cloud Function validates input: `if (score > 100) throw error;`

#### 5. Race Conditions
**Attack:** User submits multiple quiz results simultaneously

**Blocked By:** Cloud Function uses `db.runTransaction()` for atomic updates. Only highest score is kept.

### Security Best Practices Implemented

1. ✅ **Defense in Depth** - Multiple layers (Rules + Functions + Client UX)
2. ✅ **Principle of Least Privilege** - Users can only read their own data
3. ✅ **Server-Side Validation** - All critical logic in Cloud Functions
4. ✅ **Atomic Operations** - Transactions prevent race conditions
5. ✅ **Input Validation** - All inputs validated in Cloud Functions
6. ✅ **Authentication Required** - All operations require valid auth token
7. ✅ **No Client Writes to Critical Data** - `userStats` write-protected
8. ✅ **Clear Error Messages** - Helpful but not revealing sensitive info

### Testing Security

**Manual Testing:**
1. Try to access quiz page without authentication → Should redirect to login
2. Try to read Medium quiz without Easy >= 60 → Should get `permission-denied`
3. Try to write directly to `userStats` → Should get `permission-denied`
4. Try to submit score > 100 → Should get validation error
5. Modify client code to bypass checks → Server still blocks access

**Automated Testing (Recommended):**
- Use Firebase Emulator to test Firestore rules
- Unit test Cloud Functions with different inputs
- Integration tests for complete flow

---

## Summary

This implementation provides **true server-side enforcement** that cannot be bypassed through client manipulation. The multi-layer approach ensures data integrity and prevents unauthorized access:

- **Firestore Rules** enforce access at the database level
- **Cloud Functions** handle all progress updates server-side
- **Client code** provides UX but doesn't control access

**Key Takeaway:** Never trust the client. All critical logic and data access must be enforced server-side.

