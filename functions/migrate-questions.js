/**
 * Migration Script: Migrate Questions to Firestore
 * 
 * This script migrates hardcoded questions to Firestore with level field.
 * Run this once to populate the questions collection.
 * 
 * Usage:
 *   node migrate-questions.js
 * 
 * Note: Requires Firebase Admin SDK and proper credentials.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (adjust path to your service account key)
if (!admin.apps.length) {
  // Option 1: Use service account key file
  // const serviceAccount = require('./path/to/serviceAccountKey.json');
  // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  
  // Option 2: Use default credentials (if running on Firebase/Google Cloud)
  admin.initializeApp();
}

const db = admin.firestore();

// Questions to migrate
const QUESTIONS = {
  easy: [
    { text: 'What does CIA triad stand for?', correct: 'Confidentiality, Integrity, Availability', order: 1 },
    { text: 'Which protocol secures web traffic?', correct: 'HTTPS', order: 2 },
    { text: 'What is phishing?', correct: 'Social engineering attempt', order: 3 },
    { text: 'What is a firewall used for?', correct: 'Network security', order: 4 },
    { text: 'What does SSL/TLS provide?', correct: 'Encryption', order: 5 }
  ],
  medium: [
    { text: 'Port for HTTP?', correct: '80', order: 1 },
    { text: 'SQL injection affects which layer?', correct: 'Application', order: 2 },
    { text: 'One strong password trait?', correct: 'Length', order: 3 },
    { text: 'What is a DDoS attack?', correct: 'Distributed Denial of Service', order: 4 },
    { text: 'What is the purpose of a VPN?', correct: 'Secure remote access', order: 5 },
    { text: 'What does IDS stand for?', correct: 'Intrusion Detection System', order: 6 }
  ],
  hard: [
    { text: 'What is MFA?', correct: 'Multi-factor authentication', order: 1 },
    { text: 'Firewall purpose?', correct: 'Traffic filtering', order: 2 },
    { text: 'TLS provides?', correct: 'Encryption', order: 3 },
    { text: 'What is a zero-day vulnerability?', correct: 'Unknown security flaw', order: 4 },
    { text: 'What is the principle of least privilege?', correct: 'Minimum necessary access', order: 5 },
    { text: 'What is APT in cybersecurity?', correct: 'Advanced Persistent Threat', order: 6 },
    { text: 'What is social engineering?', correct: 'Manipulation technique', order: 7 },
    { text: 'What does SIEM stand for?', correct: 'Security Information and Event Management', order: 8 }
  ]
};

async function migrateQuestions() {
  console.log('Starting questions migration...');
  
  const batch = db.batch();
  let count = 0;
  
  for (const [level, questions] of Object.entries(QUESTIONS)) {
    for (const question of questions) {
      const questionRef = db.collection('questions').doc();
      batch.set(questionRef, {
        level: level,
        text: question.text,
        correct: question.correct,
        order: question.order,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
    }
  }
  
  await batch.commit();
  console.log(`✅ Successfully migrated ${count} questions to Firestore`);
  console.log(`   - Easy: ${QUESTIONS.easy.length} questions`);
  console.log(`   - Medium: ${QUESTIONS.medium.length} questions`);
  console.log(`   - Hard: ${QUESTIONS.hard.length} questions`);
}

// Run migration
migrateQuestions()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

