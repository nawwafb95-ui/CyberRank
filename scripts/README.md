# SOCyberX Question Seeding Script

This directory contains the seed script for populating Firestore with SOCyberX question banks.

## Prerequisites

1. **Firebase Service Account Key**: Download your Firebase service account key JSON file
2. **Node.js**: Ensure Node.js is installed
3. **Firebase Admin SDK**: The script uses `firebase-admin` package

## Setup Instructions

### Step 1: Install Dependencies

The script requires `firebase-admin`. You can install it globally or in the project:

```bash
# Option 1: Install in the project root
npm install firebase-admin

# Option 2: Install in functions directory (if firebase-admin is already there, you can use it from there)
cd functions
npm install firebase-admin
cd ..
```

### Step 2: Place Service Account Key

1. Download your Firebase service account key from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

2. Place the file in the `scripts/` directory:
   ```
   scripts/
   ├── seedQuestions.js
   └── serviceAccountKey.json  ← Place your key here
   ```

**⚠️ IMPORTANT**: Add `serviceAccountKey.json` to `.gitignore` to avoid committing it to version control!

### Step 3: Run the Script

From the project root directory:

```bash
node scripts/seedQuestions.js
```

## What the Script Does

- Populates `questionsPublic` collection with question data (level, difficulty, type, title, scenario, choices, imageUrl)
- Populates `questionsPrivate` collection with answer data (correctAnswer, keywords, explanation)
- Uses the same document ID for matching questions in both collections
- Checks for existing documents to avoid duplicates
- Provides progress logging and summary statistics

## Question Bank Summary

- **Level 1**: 25 questions (Easy) - SOC Basics & Fundamentals
- **Level 2**: 30 questions (Medium) - Alert Triage, Incident Response, Log Analysis
- **Level 3**: 30 questions (Hard) - Advanced Scenarios, Malware Analysis, Exfiltration Detection
- **Total**: 85 questions

## Verifying Data in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Check the following collections:
   - `questionsPublic` - Should contain 85 documents
   - `questionsPrivate` - Should contain 85 documents
5. Verify a sample document:
   - Open a document in `questionsPublic` to see question data
   - Open the same document ID in `questionsPrivate` to see the corresponding answer
   - Confirm both collections have matching document IDs

## Re-running the Script

The script is safe to re-run:
- It checks if documents already exist before inserting
- Existing documents will be skipped (you'll see warnings)
- Only new documents will be inserted

## Troubleshooting

**Error: "serviceAccountKey.json not found"**
- Ensure the file is in the `scripts/` directory
- Check the file name is exactly `serviceAccountKey.json`

**Error: "Cannot find module 'firebase-admin'"**
- Run `npm install firebase-admin` in the project root or functions directory

**Permission Errors**
- Ensure your service account has Firestore write permissions
- Check that the service account key is valid and not expired

