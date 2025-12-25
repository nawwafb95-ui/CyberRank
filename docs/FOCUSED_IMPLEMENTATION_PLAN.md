# Implementation Plan: Server-Side Level Gating for SOCyberX

## Overview
Implement server-side enforced progression using `/users`, `/userStats`, and `/quizzes` collections.

## Data Structure
- `/users/{uid}` - User profile (includes `role: "admin"` for admins)
- `/userStats/{uid}` - Progress tracking (bestScoreEasy, bestScoreMedium, bestScoreHard, attempts, highestUnlocked)
- `/quizzes/{quizId}` - Quiz content (includes `level: "easy" | "medium" | "hard"`)

## Implementation Steps

### Step 1: Update Firestore Security Rules
- Add auth requirement for reading quizzes
- Add level-based gating: Medium requires bestScoreEasy >= 60, Hard requires bestScoreMedium >= 60
- Block all client writes to userStats (server-only)
- Keep admin access rules for admin collections

### Step 2: Create Cloud Functions
- `submitQuizResult`: Updates userStats atomically (bestScore, attempts, highestUnlocked)
- `canStartLevel`: Checks if user can access a level

### Step 3: Update Client Code
- Add auth checks before accessing quiz pages
- Fetch quizzes from Firestore (server will enforce gating)
- Call `submitQuizResult` after quiz completion
- Handle permission-denied errors gracefully

### Step 4: Test & Deploy
- Test auth gating (unauthenticated users blocked)
- Test level gating (Medium/Hard locked until prerequisites met)
- Test score submission (bestScore updates correctly)
- Deploy rules and functions

## Security Principles
1. **Never trust the client** - All critical logic server-side
2. **Defense in depth** - Rules + Functions + Client UX
3. **Atomic operations** - Transactions prevent race conditions
4. **Input validation** - All inputs validated in Cloud Functions

