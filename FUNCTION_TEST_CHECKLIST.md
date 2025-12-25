# Test Checklist: updateUserStatsOnAttempt Function

## Prerequisites
1. Start Firebase emulators: `firebase emulators:start --only functions,firestore`
2. Access Firestore UI at `http://localhost:4000`

## Test Cases

### ✅ Test 1: Missing userId Validation
**Action:** Create attempt document without `userId` field
```javascript
// In Firestore emulator UI or via SDK:
await db.collection('attempts').add({
  score: 50,
  maxScore: 100,
  level: 'easy'
});
```
**Expected:** Function logs error, no updates to userStats/pointTransactions/logs

---

### ✅ Test 2: New User - First Attempt
**Action:** Create attempt for new user
```javascript
const userId = 'test-user-1';
await db.collection('attempts').add({
  userId: userId,
  score: 80,
  maxScore: 100,
  level: 'easy',
  finishedAt: admin.firestore.FieldValue.serverTimestamp()
});
```
**Expected:**
- `userStats/{userId}` created with:
  - `totalAttempts: 1`
  - `totalScore: 80`
  - `bestScore: 80`
  - `currentLevel: 1`
  - `levelProgress: 80`
- `pointTransactions` doc created with `delta: 80`, `reason: "QUIZ_ATTEMPT"`
- `logs` doc created with `action: "ATTEMPT_STATS_UPDATED"`

---

### ✅ Test 3: Existing User - Score Update
**Action:** Create second attempt for same user
```javascript
// First create userStats manually or via previous test
await db.collection('attempts').add({
  userId: userId,
  score: 60,
  maxScore: 100,
  level: 'medium',
  finishedAt: admin.firestore.FieldValue.serverTimestamp()
});
```
**Expected:**
- `totalAttempts: 2`
- `totalScore: 140` (80 + 60)
- `bestScore: 80` (max of 80, 60)
- `levelProgress: 60` (updated to new attempt's percent)

---

### ✅ Test 4: Level Advancement (70%+ at Level 1)
**Action:** Create attempt with 75% score for user at level 1
```javascript
await db.collection('attempts').add({
  userId: userId,
  score: 75,
  maxScore: 100,
  level: 'hard',
  finishedAt: admin.firestore.FieldValue.serverTimestamp()
});
```
**Expected:**
- `currentLevel: 2` (advanced from 1)
- `levelProgress: 0` (reset on level up)

---

### ✅ Test 5: Level Advancement - Max Level (Level 3)
**Action:** Create attempt with 80% for user already at level 3
```javascript
// Set userStats.currentLevel = 3 first
await db.collection('attempts').add({
  userId: userId,
  score: 80,
  maxScore: 100,
  level: 'hard',
  finishedAt: admin.firestore.FieldValue.serverTimestamp()
});
```
**Expected:**
- `currentLevel: 3` (stays at max, no advancement)
- `levelProgress: 80` (updated normally)

---

### ✅ Test 6: Username from users Collection
**Action:** Create attempt when `users/{userId}` exists with username
```javascript
// Create user document first
await db.collection('users').doc(userId).set({
  username: 'testuser123',
  email: 'test@example.com'
});

await db.collection('attempts').add({
  userId: userId,
  score: 50,
  maxScore: 100,
  level: 'easy'
});
```
**Expected:**
- `userStats/{userId}.username` = `'testuser123'`

---

### ✅ Test 7: Zero Score / Edge Cases
**Action:** Create attempt with score: 0 or missing score
```javascript
await db.collection('attempts').add({
  userId: userId,
  score: 0,
  maxScore: 100,
  level: 'easy'
});
```
**Expected:**
- `pointsDelta: 0`
- `percent: 0`
- `totalScore` incremented by 0
- All documents still created

---

### ✅ Test 8: Missing maxScore (Division by Zero Protection)
**Action:** Create attempt without maxScore
```javascript
await db.collection('attempts').add({
  userId: userId,
  score: 50,
  level: 'easy'
});
```
**Expected:**
- `percent: 0` (not NaN)
- Function completes without errors

---

### ✅ Test 9: Transaction Atomicity
**Action:** Create multiple attempts simultaneously
```javascript
const promises = [];
for (let i = 0; i < 5; i++) {
  promises.push(db.collection('attempts').add({
    userId: userId,
    score: 10 + i,
    maxScore: 100,
    level: 'easy'
  }));
}
await Promise.all(promises);
```
**Expected:**
- All 5 attempts processed
- `totalAttempts` = previous + 5
- No race conditions or lost updates

---

### ✅ Test 10: Log Meta Fields Verification
**Action:** Create attempt and check logs document
```javascript
const attemptRef = await db.collection('attempts').add({
  userId: userId,
  score: 90,
  maxScore: 100,
  level: 'hard'
});

// Wait for function to complete, then check logs
const logsSnapshot = await db.collection('logs')
  .where('target', '==', attemptRef.id)
  .get();
```
**Expected:**
- Log document exists with all meta fields:
  - `level`, `score`, `percent`
  - `totalAttemptsAfter`, `totalScoreAfter`, `bestScoreAfter`
  - `currentLevelAfter`, `levelProgressAfter`

---

## Quick Manual Test Script

```javascript
// Run in Node.js with Firebase Admin SDK connected to emulator
const admin = require('firebase-admin');
const db = admin.firestore();

async function quickTest() {
  const testUserId = 'test-' + Date.now();
  
  // Test 1: First attempt
  await db.collection('attempts').add({
    userId: testUserId,
    score: 85,
    maxScore: 100,
    level: 'medium',
    finishedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Wait 2 seconds for function to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verify
  const stats = await db.collection('userStats').doc(testUserId).get();
  console.log('UserStats:', stats.data());
  
  const transactions = await db.collection('pointTransactions')
    .where('userId', '==', testUserId).get();
  console.log('Transactions:', transactions.size);
  
  const logs = await db.collection('logs')
    .where('actor', '==', testUserId).get();
  console.log('Logs:', logs.size);
}

quickTest();
```

