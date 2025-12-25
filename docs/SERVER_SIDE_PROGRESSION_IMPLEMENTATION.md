# Server-Side Enforced Progression & Access Control Implementation Plan

## Overview
This document outlines the complete implementation of server-side enforced progression and access control for SOCyberX, ensuring that users cannot bypass level restrictions through client-side manipulation.

## Architecture

### Data Model

#### Collection: `userStats` (docId = auth.uid)
```javascript
{
  bestScoreEasy: number (0-100),      // Best score achieved in Easy level
  bestScoreMedium: number (0-100),     // Best score achieved in Medium level
  bestScoreHard: number (0-100),      // Best score achieved in Hard level
  attemptsEasy: number,                 // Total attempts for Easy level
  attemptsMedium: number,              // Total attempts for Medium level
  attemptsHard: number,                // Total attempts for Hard level
  highestUnlocked: string,             // "easy" | "medium" | "hard" (optional, for convenience)
  userId: string,                      // User ID (redundant but useful)
  username: string,                    // Username (optional)
  lastUpdated: Timestamp              // Last update timestamp
}
```

#### Collection: `questions` (docId = auto-generated)
```javascript
{
  level: string,                       // "easy" | "medium" | "hard"
  text: string,                        // Question text
  correct: string,                     // Correct answer
  order: number,                       // Display order within level
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Security Rules Strategy

1. **Questions Collection:**
   - Read: Only authenticated users
   - Additional restriction: Medium questions require `userStats.bestScoreEasy >= 60`
   - Additional restriction: Hard questions require `userStats.bestScoreMedium >= 60`
   - Write: Only backend (Cloud Functions)

2. **userStats Collection:**
   - Read: Users can only read their own stats
   - Write: **DENY ALL CLIENT WRITES** - Only Cloud Functions can write

3. **attempts Collection:**
   - Read: Users can read their own attempts
   - Create: Users can create their own attempts (for tracking)
   - Update/Delete: Only backend

### Cloud Functions Strategy

1. **submitQuizResult** (Callable)
   - Verifies authentication
   - Validates input (level, score)
   - Updates `userStats` atomically:
     - Increments attempts for the level
     - Updates bestScore if new score is higher
     - Updates highestUnlocked if threshold met
   - Returns success/failure

2. **canStartLevel** (Callable)
   - Verifies authentication
   - Checks if user can access the requested level
   - Returns `{ allowed: boolean, reason?: string }`

3. **updateUserStatsOnAttempt** (Firestore Trigger)
   - Already exists, but needs modification to use new data model
   - Updates bestScoreEasy/Medium/Hard instead of generic bestScore
   - Updates highestUnlocked field

## Implementation Steps

### Step 1: Update Firestore Security Rules
- Add level-based read restrictions for questions
- Ensure userStats is write-protected from clients
- Test rules with Firebase Emulator

### Step 2: Migrate Questions to Firestore
- Create a migration script or manual process
- Add questions with level field
- Verify questions are properly indexed

### Step 3: Create Cloud Functions
- Implement `submitQuizResult` callable function
- Implement `canStartLevel` callable function
- Update `updateUserStatsOnAttempt` trigger function
- Test functions locally with emulator

### Step 4: Update Client-Side Code
- Remove localStorage-based level tracking
- Add auth check before accessing quiz pages
- Fetch questions from Firestore (with server-side gating)
- Call `submitQuizResult` instead of direct Firestore writes
- Call `canStartLevel` to check access before showing level buttons
- Update challenges.js to use server-side checks

### Step 5: Testing & Validation
- Test auth gating (unauthenticated users redirected)
- Test level gating (cannot access Medium without Easy >= 60)
- Test score submission (bestScore updates correctly)
- Test level unlocking (highestUnlocked updates correctly)
- Test tamper resistance (client cannot bypass rules)

## Security Considerations

### Common Bypass Attempts & Mitigations

1. **Client-side code modification:**
   - ❌ User modifies JavaScript to skip auth checks
   - ✅ **Mitigation:** Firestore rules enforce auth requirement at database level

2. **Direct Firestore writes:**
   - ❌ User tries to write directly to `userStats` to unlock levels
   - ✅ **Mitigation:** Security rules deny all client writes to `userStats`

3. **Manipulating bestScore fields:**
   - ❌ User tries to update `bestScoreEasy` to 100 via Firestore SDK
   - ✅ **Mitigation:** Security rules deny writes, only Cloud Functions can update

4. **Bypassing question read restrictions:**
   - ❌ User tries to query Medium questions without completing Easy
   - ✅ **Mitigation:** Security rules check `userStats.bestScoreEasy >= 60` before allowing read

5. **Race conditions:**
   - ❌ User submits multiple quiz results simultaneously
   - ✅ **Mitigation:** Cloud Functions use Firestore transactions for atomic updates

6. **Token manipulation:**
   - ❌ User tries to use another user's auth token
   - ✅ **Mitigation:** Firestore rules verify `request.auth.uid == userId` for all operations

7. **Direct API calls:**
   - ❌ User tries to call Cloud Functions with fake data
   - ✅ **Mitigation:** Cloud Functions verify auth context and validate all inputs

## Migration Notes

### Existing Data
- Current `userStats` may have different structure
- Need to migrate existing stats to new format:
  - `bestScore` → `bestScoreEasy` (if level was Easy)
  - `currentLevel` → `highestUnlocked` (map 1→easy, 2→medium, 3→hard)
  - Initialize `attemptsEasy`, `attemptsMedium`, `attemptsHard` from `totalAttempts`

### Backward Compatibility
- Keep legacy quiz parameter support temporarily
- Gradually migrate to level-based system
- Remove localStorage-based tracking

## Testing Checklist

- [ ] Unauthenticated user cannot access quiz pages
- [ ] Unauthenticated user cannot read questions
- [ ] User cannot access Medium without Easy >= 60
- [ ] User cannot access Hard without Medium >= 60
- [ ] Client cannot write to userStats directly
- [ ] Client cannot read other users' stats
- [ ] submitQuizResult correctly updates bestScore
- [ ] submitQuizResult correctly unlocks next level
- [ ] canStartLevel returns correct access status
- [ ] Level unlocking persists (doesn't re-lock on lower scores)
- [ ] Multiple attempts work correctly
- [ ] Race conditions handled properly

## Deployment Order

1. Deploy Firestore Security Rules (non-breaking, adds restrictions)
2. Migrate questions to Firestore
3. Deploy Cloud Functions
4. Update client-side code
5. Test thoroughly
6. Remove old localStorage-based code
7. Monitor for errors

## Rollback Plan

If issues occur:
1. Revert Firestore rules to previous version
2. Keep Cloud Functions but mark as deprecated
3. Temporarily re-enable localStorage-based tracking
4. Fix issues and redeploy

