# Deployment Steps: Server-Side Progression

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Project initialized: `firebase init` (if not already done)

## Step-by-Step Deployment

### Step 1: Deploy Firestore Security Rules

```bash
# From project root
firebase deploy --only firestore:rules
```

**Verify:**
- Go to Firebase Console → Firestore Database → Rules
- Check that new rules are active
- Rules should include level-based gating for questions

### Step 2: Migrate Questions to Firestore

**Option A: Using Migration Script (Recommended)**

```bash
cd functions
node migrate-questions.js
```

**Note:** You may need to set up Firebase Admin credentials:
- Create a service account key in Firebase Console
- Save it as `functions/serviceAccountKey.json`
- Update `migrate-questions.js` to use it

**Option B: Manual Migration via Firebase Console**

1. Go to Firebase Console → Firestore Database
2. Create collection: `questions`
3. Add documents with fields:
   - `level`: "easy" | "medium" | "hard"
   - `text`: Question text
   - `correct`: Correct answer
   - `order`: Number (for ordering)
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

### Step 3: Deploy Cloud Functions

```bash
cd functions
npm install  # Ensure dependencies are installed
cd ..
firebase deploy --only functions
```

**Verify:**
- Go to Firebase Console → Functions
- Check that `submitQuizResult` and `canStartLevel` are deployed
- Check function logs for any errors

### Step 4: Test the Implementation

#### Test 1: Auth Gating
1. Log out (if logged in)
2. Try to access `/html/challenges.html`
3. **Expected:** Redirected to login page with message

#### Test 2: Level Gating
1. Log in with a new user (no quiz attempts)
2. Try to access Medium level
3. **Expected:** Button disabled, message shows "Complete Easy level first"
4. Complete Easy level with score >= 60
5. Try to access Medium level again
6. **Expected:** Button enabled, can access Medium questions

#### Test 3: Score Submission
1. Complete a quiz level
2. Check Firebase Console → Firestore → `userStats/{userId}`
3. **Expected:** 
   - `bestScoreEasy` updated (if Easy level)
   - `attemptsEasy` incremented
   - `highestUnlocked` updated if score >= 60

#### Test 4: Direct Write Protection
1. Open browser console
2. Try to write directly to userStats:
```javascript
import { doc, updateDoc } from 'firebase/firestore';
await updateDoc(doc(db, 'userStats', userId), {
  bestScoreEasy: 100
});
```
3. **Expected:** `permission-denied` error

#### Test 5: Question Access Protection
1. Log in as user without Easy >= 60
2. Try to query Medium questions:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
const q = query(collection(db, 'questions'), where('level', '==', 'medium'));
await getDocs(q);
```
3. **Expected:** `permission-denied` error

## Troubleshooting

### Issue: Questions not loading

**Symptoms:** Quiz page shows "No questions found" or errors

**Solutions:**
1. Check questions are in Firestore with correct `level` field
2. Check Firestore rules allow reading questions
3. Check browser console for errors
4. Verify user is authenticated

### Issue: Cloud Functions not accessible

**Symptoms:** `canStartLevel` or `submitQuizResult` fail

**Solutions:**
1. Check functions are deployed: `firebase functions:list`
2. Check function logs: `firebase functions:log`
3. Verify CORS is configured (if needed)
4. Check function permissions in Firebase Console

### Issue: Level not unlocking

**Symptoms:** User scores >= 60 but level stays locked

**Solutions:**
1. Check `submitQuizResult` function logs
2. Verify score is being calculated correctly (0-100)
3. Check `userStats` document in Firestore
4. Verify `bestScoreEasy` or `bestScoreMedium` is >= 60

### Issue: Permission denied errors

**Symptoms:** User gets `permission-denied` when accessing questions

**Solutions:**
1. Check user is authenticated
2. Check user has completed prerequisite level with score >= 60
3. Verify Firestore rules are deployed correctly
4. Check `userStats` document exists and has correct fields

## Rollback Plan

If issues occur, you can rollback:

### Rollback Firestore Rules
```bash
# Revert to previous rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Cloud Functions
```bash
# Revert to previous functions
git checkout HEAD~1 functions/index.js
firebase deploy --only functions
```

### Temporary Workaround
- Client code includes fallback to hardcoded questions
- If Firestore is empty, questions will still work
- However, level gating won't be enforced until questions are in Firestore

## Post-Deployment Monitoring

### Monitor These Metrics

1. **Firestore Rules Denials:**
   - Firebase Console → Firestore → Usage
   - Watch for unusual `permission-denied` patterns

2. **Cloud Function Errors:**
   - Firebase Console → Functions → Logs
   - Watch for `submitQuizResult` failures

3. **User Progression:**
   - Check `userStats` collection
   - Monitor level unlock rates
   - Watch for unusual score patterns

### Set Up Alerts (Optional)

1. **Firebase Console → Alerts**
2. Set up alerts for:
   - High error rate in Cloud Functions
   - Unusual permission-denied patterns
   - Function execution timeouts

## Verification Checklist

After deployment, verify:

- [ ] Firestore rules deployed successfully
- [ ] Questions collection has questions with `level` field
- [ ] Cloud Functions deployed and accessible
- [ ] Auth gating works (unauthenticated users redirected)
- [ ] Level gating works (cannot access Medium without Easy >= 60)
- [ ] Score submission works (bestScore updates correctly)
- [ ] Level unlocking works (highestUnlocked updates correctly)
- [ ] Direct writes to userStats are blocked
- [ ] Questions for locked levels cannot be read
- [ ] Client code works with new server-side enforcement

## Support

If you need help:
1. Check Firebase Console logs
2. Check browser console for errors
3. Review `docs/SECURITY_NOTES.md` for security considerations
4. Review `docs/IMPLEMENTATION_SUMMARY.md` for implementation details

