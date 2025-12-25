# Quick Reference: Server-Side Level Gating

## Collections Structure

- `/users/{uid}` - User profile (`role: "admin"` for admins)
- `/userStats/{uid}` - Progress tracking
  - `bestScoreEasy`, `bestScoreMedium`, `bestScoreHard` (0-100)
  - `attemptsEasy`, `attemptsMedium`, `attemptsHard` (counters)
  - `highestUnlocked` ("easy" | "medium" | "hard")
- `/quizzes/{quizId}` - Quiz content (`level: "easy" | "medium" | "hard"`)

## Security Rules Summary

```javascript
// Quizzes: Auth required + level gating
allow read: if authenticated && (canAccessLevel(level) || isAdmin())

// userStats: Read own only, NO client writes
allow read: if authenticated && uid == userId
allow write: if false  // Server-only
```

## Cloud Functions

### submitQuizResult({ level, score })
- Updates `userStats` atomically
- Returns: `{ bestScore, nextLevelUnlocked }`

### canStartLevel({ level })
- Checks access to level
- Returns: `{ allowed: boolean, reason?: string }`

## Client Usage

```javascript
// 1. Check auth before page load
if (!auth.currentUser) redirect('/login');

// 2. Fetch quizzes (server enforces gating)
const quizzes = await getDocs(query(collection(db, 'quizzes'), where('level', '==', 'medium')));
// Will get permission-denied if bestScoreEasy < 60

// 3. Submit result after quiz
await submitQuizResult({ level: 'easy', score: 75 });
// Returns: { bestScore: 75, nextLevelUnlocked: true }
```

## Key Security Points

✅ **Rules enforce at database level** - Cannot bypass by editing client code  
✅ **Functions handle all updates** - Clients cannot write to userStats  
✅ **Atomic transactions** - Prevents race conditions  
✅ **Input validation** - All inputs validated server-side  

## Testing

1. Try reading Medium quiz without Easy >= 60 → `permission-denied`
2. Try writing to userStats → `permission-denied`
3. Try submitting score > 100 → Validation error
4. Modify client code → Server still blocks access

