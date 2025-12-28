/**
 * Seed Script: Populate Firestore with SOCyberX Question Banks
 * 
 * This script populates questionsPublic and questionsPrivate collections
 * with comprehensive SOC (Security Operations Center) questions.
 * 
 * Usage:
 *   1. Place your Firebase service account key as serviceAccountKey.json in the scripts/ directory
 *   2. npm install firebase-admin (if not already installed)
 *   3. node scripts/seedQuestions.js
 * 
 * Note: This script can be run multiple times. It will warn before overwriting existing documents.
 */

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found in scripts/ directory');
    console.error('   Please download your Firebase service account key and place it as:');
    console.error('   scripts/serviceAccountKey.json');
    process.exit(1);
  }
  
  // Read and parse JSON file in ES modules
  const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ==================== QUESTION BANKS ====================

// Level 1 Questions (25 questions) - SOC Basics & Fundamentals
const LEVEL_1_QUESTIONS = [
  {
    id: 'l1_q1',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What does SOC stand for?',
      scenario: '',
      choices: ['Security Operations Center', 'System Operations Center', 'Security Organization Center', 'Secure Operations Command'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Security Operations Center',
      keywords: [],
      explanation: 'SOC stands for Security Operations Center, the centralized team responsible for monitoring and defending an organization\'s IT infrastructure.'
    }
  },
  {
    id: 'l1_q2',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What is the primary purpose of a SOC?',
      scenario: '',
      choices: ['Monitor network traffic for threats', 'Develop security policies', 'Manage user accounts', 'Install software updates'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Monitor network traffic for threats',
      keywords: [],
      explanation: 'The primary purpose of a SOC is continuous monitoring of network traffic, systems, and logs to detect and respond to security threats.'
    }
  },
  {
    id: 'l1_q3',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'tf',
      title: 'A SIEM system aggregates logs from multiple sources for centralized analysis.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'SIEM (Security Information and Event Management) systems collect, aggregate, and analyze security logs from various sources in one central location.'
    }
  },
  {
    id: 'l1_q4',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What does SIEM stand for?',
      scenario: '',
      choices: ['Security Information and Event Management', 'System Information and Event Management', 'Secure Information and Event Management', 'Security Intelligence and Event Management'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Security Information and Event Management',
      keywords: [],
      explanation: 'SIEM stands for Security Information and Event Management, a technology that provides real-time analysis of security alerts.'
    }
  },
  {
    id: 'l1_q5',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'short',
      title: 'What is the standard port number for HTTPS?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: '443',
      keywords: ['443'],
      explanation: 'Port 443 is the standard port for HTTPS (HyperText Transfer Protocol Secure) encrypted web traffic.'
    }
  },
  {
    id: 'l1_q6',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'Which of the following is a common indicator of a phishing email?',
      scenario: '',
      choices: ['Urgent language requesting immediate action', 'Professional email signature', 'Clear sender information', 'Proper grammar and spelling'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Urgent language requesting immediate action',
      keywords: [],
      explanation: 'Phishing emails often use urgent language to pressure recipients into acting quickly without thinking, a common social engineering tactic.'
    }
  },
  {
    id: 'l1_q7',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'tf',
      title: 'A firewall can block malicious traffic based on IP addresses and port numbers.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Firewalls use rules based on IP addresses, port numbers, protocols, and other criteria to allow or block network traffic.'
    }
  },
  {
    id: 'l1_q8',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What does IDS stand for?',
      scenario: '',
      choices: ['Intrusion Detection System', 'Intrusion Defense System', 'Information Detection System', 'Internet Defense System'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Intrusion Detection System',
      keywords: [],
      explanation: 'IDS stands for Intrusion Detection System, a security tool that monitors network or system activities for malicious activities or policy violations.'
    }
  },
  {
    id: 'l1_q9',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'short',
      title: 'What is the standard port number for SSH?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: '22',
      keywords: ['22'],
      explanation: 'Port 22 is the standard port for SSH (Secure Shell), used for secure remote access to systems.'
    }
  },
  {
    id: 'l1_q10',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What is the first step in the incident response process?',
      scenario: '',
      choices: ['Preparation', 'Detection', 'Containment', 'Recovery'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Preparation',
      keywords: [],
      explanation: 'Preparation is the first phase of incident response, involving setting up processes, tools, and team readiness before incidents occur.'
    }
  },
  {
    id: 'l1_q11',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'tf',
      title: 'All security alerts require immediate escalation to the security team.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'false',
      keywords: [],
      explanation: 'Not all alerts are equal. Security analysts triage alerts to determine severity and prioritize only genuine threats requiring immediate attention.'
    }
  },
  {
    id: 'l1_q12',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What does DDoS stand for?',
      scenario: '',
      choices: ['Distributed Denial of Service', 'Direct Denial of Service', 'Dynamic Denial of Service', 'Digital Denial of Service'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Distributed Denial of Service',
      keywords: [],
      explanation: 'DDoS stands for Distributed Denial of Service, an attack where multiple compromised systems flood a target with traffic to make it unavailable.'
    }
  },
  {
    id: 'l1_q13',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'short',
      title: 'What does the acronym APT stand for in cybersecurity?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Advanced Persistent Threat',
      keywords: ['advanced persistent threat', 'apt'],
      explanation: 'APT stands for Advanced Persistent Threat, a long-term targeted attack campaign conducted by skilled adversaries.'
    }
  },
  {
    id: 'l1_q14',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'Which log type is most useful for detecting failed login attempts?',
      scenario: '',
      choices: ['Authentication logs', 'Application logs', 'Network logs', 'System logs'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Authentication logs',
      keywords: [],
      explanation: 'Authentication logs record login attempts, both successful and failed, making them critical for detecting brute force attacks and unauthorized access attempts.'
    }
  },
  {
    id: 'l1_q15',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'tf',
      title: 'A false positive is when a security tool correctly identifies a real threat.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'false',
      keywords: [],
      explanation: 'A false positive is when a security tool incorrectly flags benign activity as a threat. A correct identification of a real threat is a true positive.'
    }
  },
  {
    id: 'l1_q16',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What is malware?',
      scenario: '',
      choices: ['Any software designed to harm or exploit computer systems', 'Only viruses and worms', 'Software that slows down computers', 'Outdated software'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Any software designed to harm or exploit computer systems',
      keywords: [],
      explanation: 'Malware (malicious software) is a broad term encompassing any software designed to harm, exploit, or otherwise compromise computer systems, including viruses, trojans, ransomware, and spyware.'
    }
  },
  {
    id: 'l1_q17',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'short',
      title: 'What is the standard port number for HTTP?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: '80',
      keywords: ['80'],
      explanation: 'Port 80 is the standard port for HTTP (HyperText Transfer Protocol), used for unencrypted web traffic.'
    }
  },
  {
    id: 'l1_q18',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What is the primary function of a SOC analyst?',
      scenario: '',
      choices: ['Monitor security alerts and respond to incidents', 'Develop new security software', 'Manage user passwords', 'Install operating systems'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Monitor security alerts and respond to incidents',
      keywords: [],
      explanation: 'SOC analysts monitor security alerts, investigate potential threats, and respond to security incidents as part of the security operations team.'
    }
  },
  {
    id: 'l1_q19',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'tf',
      title: 'Security logs should be retained for compliance and forensic analysis purposes.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Retaining security logs is essential for compliance requirements, forensic investigations, and understanding the timeline of security incidents.'
    }
  },
  {
    id: 'l1_q20',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What does VPN stand for?',
      scenario: '',
      choices: ['Virtual Private Network', 'Virtual Public Network', 'Verified Private Network', 'Virtual Protected Network'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Virtual Private Network',
      keywords: [],
      explanation: 'VPN stands for Virtual Private Network, a technology that creates a secure, encrypted connection over a public network.'
    }
  },
  {
    id: 'l1_q21',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'scenario',
      title: 'Phishing Detection',
      scenario: 'An employee receives an email claiming to be from IT support requesting immediate password reset. The email has poor grammar and a suspicious sender address. What should the employee do?',
      choices: ['Report the email to the security team', 'Click the link and reset the password', 'Forward the email to all colleagues', 'Delete the email immediately without reporting'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Report the email to the security team',
      keywords: [],
      explanation: 'Suspicious emails should be reported to the security team immediately so they can investigate, block the threat, and alert other users if needed.'
    }
  },
  {
    id: 'l1_q22',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'short',
      title: 'What is the process of examining security logs to identify threats called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Log analysis',
      keywords: ['log analysis', 'log review', 'log examination'],
      explanation: 'Log analysis is the process of examining security logs to identify patterns, anomalies, and potential security threats.'
    }
  },
  {
    id: 'l1_q23',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What is ransomware?',
      scenario: '',
      choices: ['Malware that encrypts files and demands payment', 'Software that speeds up computers', 'A type of firewall', 'Legitimate backup software'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Malware that encrypts files and demands payment',
      keywords: [],
      explanation: 'Ransomware is malicious software that encrypts a victim\'s files and demands payment (ransom) in exchange for the decryption key.'
    }
  },
  {
    id: 'l1_q24',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'tf',
      title: 'SOC analysts work in shifts to provide 24/7 security monitoring.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Most SOCs operate 24/7 with analysts working in shifts to ensure continuous monitoring and rapid response to security threats at any time.'
    }
  },
  {
    id: 'l1_q25',
    public: {
      level: 1,
      difficulty: 'easy',
      type: 'mcq',
      title: 'What is the purpose of threat intelligence?',
      scenario: '',
      choices: ['Provide information about current and emerging threats', 'Manage user access permissions', 'Install security patches', 'Configure network routers'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Provide information about current and emerging threats',
      keywords: [],
      explanation: 'Threat intelligence provides actionable information about current and emerging threats, helping security teams proactively defend against attacks.'
    }
  }
];

// Level 2 Questions (30 questions) - Intermediate: Alert Triage, Incident Response, Log Analysis
const LEVEL_2_QUESTIONS = [
  {
    id: 'l2_q1',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Alert Triage',
      scenario: 'You receive an alert showing 50 failed login attempts from a single IP address to a user account within 5 minutes. What is the most likely threat?',
      choices: ['Brute force attack', 'Legitimate user forgot password', 'Network configuration issue', 'System update in progress'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Brute force attack',
      keywords: [],
      explanation: 'Multiple failed login attempts from a single IP in a short timeframe is a classic indicator of a brute force attack attempting to guess passwords.'
    }
  },
  {
    id: 'l2_q2',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is the difference between IDS and IPS?',
      scenario: '',
      choices: ['IDS detects threats, IPS detects and blocks threats', 'IDS is newer than IPS', 'IPS only works on Windows', 'There is no difference'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'IDS detects threats, IPS detects and blocks threats',
      keywords: [],
      explanation: 'IDS (Intrusion Detection System) only detects and alerts on threats, while IPS (Intrusion Prevention System) can also automatically block malicious traffic.'
    }
  },
  {
    id: 'l2_q3',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'short',
      title: 'What is the term for the process of determining the priority and severity of security alerts?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Alert triage',
      keywords: ['triage', 'alert triage', 'alert prioritization'],
      explanation: 'Alert triage is the process of evaluating security alerts to determine their priority, severity, and whether they require immediate action or further investigation.'
    }
  },
  {
    id: 'l2_q4',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'In incident response, what does containment mean?',
      scenario: '',
      choices: ['Isolating the threat to prevent further damage', 'Deleting all affected files', 'Shutting down all systems', 'Restarting the network'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Isolating the threat to prevent further damage',
      keywords: [],
      explanation: 'Containment in incident response involves isolating the affected systems or network segments to prevent the threat from spreading and causing additional damage.'
    }
  },
  {
    id: 'l2_q5',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Phishing Analysis',
      scenario: 'An email contains a suspicious link that appears to go to "example.com" but hovering shows it actually points to "ev1l-site.net". What type of attack is this?',
      choices: ['URL obfuscation', 'Email encryption', 'Legitimate redirect', 'Typo in the email'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'URL obfuscation',
      keywords: [],
      explanation: 'URL obfuscation is a phishing technique where the displayed link text differs from the actual destination URL to trick users into clicking malicious links.'
    }
  },
  {
    id: 'l2_q6',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What does IOC stand for in cybersecurity?',
      scenario: '',
      choices: ['Indicator of Compromise', 'Index of Compromise', 'Indicator of Compliance', 'Index of Compliance'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Indicator of Compromise',
      keywords: [],
      explanation: 'IOC (Indicator of Compromise) is a piece of forensic data that suggests an intrusion or malicious activity, such as IP addresses, file hashes, or domain names.'
    }
  },
  {
    id: 'l2_q7',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'short',
      title: 'What type of log analysis technique uses statistical methods to identify patterns that deviate from normal behavior?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Anomaly detection',
      keywords: ['anomaly detection', 'anomaly analysis', 'behavioral analysis'],
      explanation: 'Anomaly detection uses statistical methods and machine learning to identify patterns that deviate from normal behavior, helping detect unknown threats.'
    }
  },
  {
    id: 'l2_q8',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is the primary purpose of network segmentation in security?',
      scenario: '',
      choices: ['Limit the spread of attacks', 'Increase network speed', 'Reduce bandwidth usage', 'Simplify network management'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Limit the spread of attacks',
      keywords: [],
      explanation: 'Network segmentation divides the network into smaller zones, limiting the lateral movement of attackers and containing potential breaches.'
    }
  },
  {
    id: 'l2_q9',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'tf',
      title: 'A honeypot is a security tool designed to attract and detect attackers.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'A honeypot is a decoy system designed to attract attackers, allowing security teams to study attack methods and gather threat intelligence.'
    }
  },
  {
    id: 'l2_q10',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Log Analysis',
      scenario: 'You notice a user account successfully logged in from New York at 9:00 AM, then from London at 9:05 AM. What should you investigate?',
      choices: ['Possible account compromise', 'Normal user behavior', 'Time zone issue', 'Network latency'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Possible account compromise',
      keywords: [],
      explanation: 'Impossible travel (logging in from geographically distant locations in a short time) is a strong indicator of account compromise or credential sharing.'
    }
  },
  {
    id: 'l2_q11',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is the kill chain in cybersecurity?',
      scenario: '',
      choices: ['The stages of a cyber attack from initial access to objective completion', 'A type of malware', 'A security protocol', 'A network topology'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'The stages of a cyber attack from initial access to objective completion',
      keywords: [],
      explanation: 'The cyber kill chain describes the stages of a cyber attack: reconnaissance, weaponization, delivery, exploitation, installation, command and control, and actions on objectives.'
    }
  },
  {
    id: 'l2_q12',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'short',
      title: 'What is the process of preserving evidence after a security incident called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Forensics',
      keywords: ['forensics', 'digital forensics', 'computer forensics', 'incident forensics'],
      explanation: 'Forensics is the process of collecting, preserving, and analyzing digital evidence after a security incident for investigation and potential legal proceedings.'
    }
  },
  {
    id: 'l2_q13',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What does MITRE ATT&CK framework provide?',
      scenario: '',
      choices: ['A knowledge base of adversary tactics and techniques', 'A firewall solution', 'A SIEM system', 'A password manager'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'A knowledge base of adversary tactics and techniques',
      keywords: [],
      explanation: 'MITRE ATT&CK is a globally accessible knowledge base of adversary tactics and techniques based on real-world observations, used to improve security defenses.'
    }
  },
  {
    id: 'l2_q14',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'tf',
      title: 'All security incidents should be escalated immediately to the CISO.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'false',
      keywords: [],
      explanation: 'Incident severity determines escalation. Low-severity incidents can be handled by SOC analysts, while only critical incidents require CISO notification.'
    }
  },
  {
    id: 'l2_q15',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Malware Detection',
      scenario: 'A process is making outbound connections to known command-and-control servers and transferring large amounts of data. What type of threat is this?',
      choices: ['Data exfiltration', 'Legitimate backup', 'Software update', 'User downloading files'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Data exfiltration',
      keywords: [],
      explanation: 'Data exfiltration occurs when malware or attackers transfer sensitive data from an organization\'s network to external servers, often to command-and-control infrastructure.'
    }
  },
  {
    id: 'l2_q16',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is sandboxing in cybersecurity?',
      scenario: '',
      choices: ['Isolating suspicious code in a secure environment for analysis', 'Blocking all network traffic', 'Encrypting files', 'Backing up data'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Isolating suspicious code in a secure environment for analysis',
      keywords: [],
      explanation: 'Sandboxing is a security technique that isolates suspicious code or applications in a controlled environment to analyze their behavior safely without risking the main system.'
    }
  },
  {
    id: 'l2_q17',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'short',
      title: 'What protocol is commonly used for secure remote administration of network devices?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'SSH',
      keywords: ['ssh', 'secure shell'],
      explanation: 'SSH (Secure Shell) is the standard protocol for secure remote administration, providing encrypted connections for managing network devices and servers.'
    }
  },
  {
    id: 'l2_q18',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is the purpose of a playbook in SOC operations?',
      scenario: '',
      choices: ['Provide standardized procedures for responding to security incidents', 'Track employee attendance', 'Manage software licenses', 'Schedule meetings'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Provide standardized procedures for responding to security incidents',
      keywords: [],
      explanation: 'Security playbooks document standardized procedures and workflows for responding to different types of security incidents, ensuring consistent and effective responses.'
    }
  },
  {
    id: 'l2_q19',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'tf',
      title: 'Network traffic analysis can reveal command-and-control communication patterns.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Network traffic analysis can identify patterns consistent with C2 communication, such as regular connections to suspicious domains, unusual data transfer volumes, and beaconing behavior.'
    }
  },
  {
    id: 'l2_q20',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Alert Correlation',
      scenario: 'Multiple users report receiving phishing emails from the same sender. The emails contain malicious attachments. What action should be taken first?',
      choices: ['Block the sender domain and scan affected systems', 'Ignore if only a few users received it', 'Wait for more reports', 'Send an all-staff email warning'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Block the sender domain and scan affected systems',
      keywords: [],
      explanation: 'When multiple users report the same phishing campaign, immediate action is required: block the threat source and scan systems to check for potential compromise from opened attachments.'
    }
  },
  {
    id: 'l2_q21',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is behavioral analysis in security monitoring?',
      scenario: '',
      choices: ['Analyzing user and system behavior patterns to detect anomalies', 'Reviewing firewall rules', 'Checking software versions', 'Monitoring disk space'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Analyzing user and system behavior patterns to detect anomalies',
      keywords: [],
      explanation: 'Behavioral analysis monitors normal patterns of user and system activity to establish baselines, then identifies deviations that may indicate security threats.'
    }
  },
  {
    id: 'l2_q22',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'short',
      title: 'What is the term for malware that can replicate itself across networks?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Worm',
      keywords: ['worm', 'network worm'],
      explanation: 'A worm is a type of malware that can self-replicate and spread across networks without user interaction, exploiting vulnerabilities to propagate.'
    }
  },
  {
    id: 'l2_q23',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What does EDR stand for?',
      scenario: '',
      choices: ['Endpoint Detection and Response', 'Endpoint Defense and Response', 'Enterprise Detection and Response', 'Endpoint Detection and Recovery'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Endpoint Detection and Response',
      keywords: [],
      explanation: 'EDR (Endpoint Detection and Response) is a cybersecurity technology that continuously monitors endpoint devices to detect and respond to threats.'
    }
  },
  {
    id: 'l2_q24',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'tf',
      title: 'Threat hunting is a proactive approach to finding security threats before they cause damage.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Threat hunting is a proactive security practice where analysts actively search for threats and indicators of compromise, rather than waiting for alerts.'
    }
  },
  {
    id: 'l2_q25',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Incident Response',
      scenario: 'During an active security incident, you discover a compromised server. What is the recommended first step before taking containment actions?',
      choices: ['Document and preserve evidence', 'Immediately disconnect the server', 'Delete suspicious files', 'Restart the server'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Document and preserve evidence',
      keywords: [],
      explanation: 'Before containment, it\'s critical to document and preserve evidence (screenshots, logs, memory dumps) for forensic analysis and investigation.'
    }
  },
  {
    id: 'l2_q26',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is the purpose of DNS logging in security monitoring?',
      scenario: '',
      choices: ['Track domain name resolutions to identify suspicious queries', 'Monitor internet speed', 'Block websites', 'Manage email servers'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Track domain name resolutions to identify suspicious queries',
      keywords: [],
      explanation: 'DNS logging helps identify suspicious domain queries, such as connections to known malicious domains, DGA domains, or command-and-control infrastructure.'
    }
  },
  {
    id: 'l2_q27',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'short',
      title: 'What is the practice of using multiple layers of security controls called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Defense in depth',
      keywords: ['defense in depth', 'layered security', 'multi-layered defense'],
      explanation: 'Defense in depth is a security strategy that uses multiple layers of security controls to protect systems, so if one layer fails, others can still provide protection.'
    }
  },
  {
    id: 'l2_q28',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'mcq',
      title: 'What is a security incident?',
      scenario: '',
      choices: ['Any event that compromises the confidentiality, integrity, or availability of information', 'Only successful attacks', 'Failed login attempts', 'Software updates'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Any event that compromises the confidentiality, integrity, or availability of information',
      keywords: [],
      explanation: 'A security incident is any event that compromises the confidentiality, integrity, or availability of information systems or data, including both successful and attempted attacks.'
    }
  },
  {
    id: 'l2_q29',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'tf',
      title: 'Log retention policies should be based on compliance requirements and business needs.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Log retention policies must balance compliance requirements (which often mandate specific retention periods) with storage costs and business needs for forensic analysis.'
    }
  },
  {
    id: 'l2_q30',
    public: {
      level: 2,
      difficulty: 'medium',
      type: 'scenario',
      title: 'Malware Analysis',
      scenario: 'A file download is flagged as suspicious by antivirus. The file has a .exe extension but is named "invoice.pdf.exe". What red flag does this represent?',
      choices: ['File extension hiding', 'Legitimate PDF file', 'Corrupted file', 'Normal naming convention'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'File extension hiding',
      keywords: [],
      explanation: 'Double file extensions (like .pdf.exe) are a common malware technique to hide the executable nature of a file and trick users into thinking it\'s a safe document.'
    }
  }
];

// Level 3 Questions (30 questions) - Advanced: Complex Scenarios, Advanced IR, Malware Analysis, Exfiltration
const LEVEL_3_QUESTIONS = [
  {
    id: 'l3_q1',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Advanced Threat Detection',
      scenario: 'You detect encrypted traffic to an unknown external server on an unusual port. The traffic occurs at regular intervals every 5 minutes. This pattern suggests what type of activity?',
      choices: ['Command and control beaconing', 'Legitimate backup process', 'VPN connection', 'Software update'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Command and control beaconing',
      keywords: [],
      explanation: 'Regular, periodic encrypted communications to unknown servers on unusual ports is characteristic of C2 beaconing, where malware checks in with attackers at scheduled intervals.'
    }
  },
  {
    id: 'l3_q2',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is lateral movement in cybersecurity?',
      scenario: '',
      choices: ['The technique attackers use to move through a network after initial compromise', 'A firewall configuration', 'A type of malware', 'Network segmentation'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'The technique attackers use to move through a network after initial compromise',
      keywords: [],
      explanation: 'Lateral movement refers to techniques attackers use to progressively move through a network, accessing different systems and escalating privileges after gaining initial access.'
    }
  },
  {
    id: 'l3_q3',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'short',
      title: 'What is the technique of using legitimate credentials to access systems called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Credential abuse',
      keywords: ['credential abuse', 'credential misuse', 'credential compromise', 'stolen credentials'],
      explanation: 'Credential abuse occurs when attackers use stolen or compromised legitimate user credentials to access systems, often making their activity harder to detect.'
    }
  },
  {
    id: 'l3_q4',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Advanced Incident Response',
      scenario: 'During an investigation, you find that an attacker has been active in your network for 6 months. They used stolen credentials and mimicked normal user behavior. What type of attack is this?',
      choices: ['Advanced Persistent Threat', 'Brute force attack', 'DDoS attack', 'Phishing campaign'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Advanced Persistent Threat',
      keywords: [],
      explanation: 'An APT is characterized by long-term presence (months to years), use of sophisticated techniques, stolen credentials, and efforts to remain undetected by mimicking normal activity.'
    }
  },
  {
    id: 'l3_q5',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is memory forensics used for?',
      scenario: '',
      choices: ['Analyzing system memory to find evidence of malware and attacks', 'Checking disk storage', 'Monitoring network traffic', 'Reviewing firewall logs'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Analyzing system memory to find evidence of malware and attacks',
      keywords: [],
      explanation: 'Memory forensics involves analyzing RAM contents to detect malware that only exists in memory, rootkits, encryption keys, and other evidence that doesn\'t persist to disk.'
    }
  },
  {
    id: 'l3_q6',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'short',
      title: 'What is the term for malware that modifies system files to hide its presence?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Rootkit',
      keywords: ['rootkit'],
      explanation: 'A rootkit is malware designed to gain privileged access while hiding its presence by modifying system files, processes, and kernel components.'
    }
  },
  {
    id: 'l3_q7',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'tf',
      title: 'Data exfiltration can occur over encrypted channels, making detection more challenging.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Attackers often use encrypted channels (HTTPS, TLS) for data exfiltration to evade detection, making it necessary to monitor for anomalies in encrypted traffic patterns.'
    }
  },
  {
    id: 'l3_q8',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Malware Analysis',
      scenario: 'A malicious file uses code obfuscation and anti-analysis techniques. It also checks for virtualization environments before executing. What type of analysis environment would be most effective?',
      choices: ['Isolated bare-metal sandbox', 'Virtual machine', 'Production system', 'User workstation'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Isolated bare-metal sandbox',
      keywords: [],
      explanation: 'Sophisticated malware can detect virtualized environments. A bare-metal sandbox provides a more realistic environment for analyzing such malware while maintaining isolation.'
    }
  },
  {
    id: 'l3_q9',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is fileless malware?',
      scenario: '',
      choices: ['Malware that runs in memory without writing files to disk', 'Malware that deletes files', 'Corrupted files', 'Empty files'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Malware that runs in memory without writing files to disk',
      keywords: [],
      explanation: 'Fileless malware operates entirely in system memory, using legitimate system tools and processes, making it harder to detect with traditional file-based antivirus solutions.'
    }
  },
  {
    id: 'l3_q10',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'short',
      title: 'What is the technique of using multiple compromised systems to send attack traffic called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Botnet',
      keywords: ['botnet', 'zombie network'],
      explanation: 'A botnet is a network of compromised computers (bots) controlled by attackers, often used for DDoS attacks, spam distribution, or other malicious activities.'
    }
  },
  {
    id: 'l3_q11',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Threat Intelligence',
      scenario: 'Your threat intelligence feed reports a new zero-day exploit affecting a software your organization uses. What is the immediate priority?',
      choices: ['Assess exposure and implement mitigations', 'Wait for vendor patch', 'Ignore until patch is available', 'Upgrade all systems immediately'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Assess exposure and implement mitigations',
      keywords: [],
      explanation: 'For zero-day threats, immediate assessment of exposure and implementation of mitigations (workarounds, network controls) is critical while waiting for official patches.'
    }
  },
  {
    id: 'l3_q12',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is the purpose of a YARA rule in security?',
      scenario: '',
      choices: ['Identify and classify malware based on patterns', 'Configure firewalls', 'Manage user permissions', 'Encrypt files'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Identify and classify malware based on patterns',
      keywords: [],
      explanation: 'YARA is a tool for pattern matching in files, commonly used to create rules that identify malware families based on strings, byte sequences, and other characteristics.'
    }
  },
  {
    id: 'l3_q13',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'tf',
      title: 'Network traffic baselining helps identify anomalies by establishing normal traffic patterns.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Baselining normal network traffic patterns allows security teams to identify deviations and anomalies that may indicate security threats or attacks.'
    }
  },
  {
    id: 'l3_q14',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Advanced Log Analysis',
      scenario: 'You observe PowerShell commands executing base64-encoded scripts with no user interaction. The commands are obfuscated. What should this trigger?',
      choices: ['High-priority security alert', 'Normal system activity', 'Software update', 'Scheduled task'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'High-priority security alert',
      keywords: [],
      explanation: 'Obfuscated PowerShell execution, especially base64 encoding, is a common technique used by attackers and malware to evade detection and execute malicious code.'
    }
  },
  {
    id: 'l3_q15',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is the diamond model in cybersecurity?',
      scenario: '',
      choices: ['A framework for analyzing intrusions with four core elements', 'A network topology', 'A type of encryption', 'A firewall configuration'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'A framework for analyzing intrusions with four core elements',
      keywords: [],
      explanation: 'The Diamond Model is an intrusion analysis framework that examines four core elements: adversary, capability, infrastructure, and victim, helping understand attack patterns.'
    }
  },
  {
    id: 'l3_q16',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'short',
      title: 'What is the practice of using legitimate software and system features for malicious purposes called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Living off the land',
      keywords: ['living off the land', 'lotl', 'lolbins'],
      explanation: 'Living off the land (LotL) is a technique where attackers use legitimate system tools and features (like PowerShell, WMI, or built-in utilities) to avoid detection.'
    }
  },
  {
    id: 'l3_q17',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Data Exfiltration Detection',
      scenario: 'You notice a workstation is transferring 50GB of data to an external cloud storage service during off-hours. The user account has legitimate access but this is unusual behavior. What is the most likely scenario?',
      choices: ['Potential data exfiltration', 'Normal backup', 'Software update', 'User working from home'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Potential data exfiltration',
      keywords: [],
      explanation: 'Unusual large data transfers to external services, especially during off-hours, are strong indicators of data exfiltration, even from legitimate accounts.'
    }
  },
  {
    id: 'l3_q18',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is threat hunting?',
      scenario: '',
      choices: ['Proactive searching for threats and IOCs in the environment', 'Blocking known malicious IPs', 'Updating antivirus signatures', 'Installing security patches'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Proactive searching for threats and IOCs in the environment',
      keywords: [],
      explanation: 'Threat hunting is a proactive security practice where analysts actively search networks and systems for threats and indicators of compromise, beyond automated alerts.'
    }
  },
  {
    id: 'l3_q19',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'tf',
      title: 'Encrypted DNS (DoH/DoT) can be used by attackers to hide malicious domain queries.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'While encrypted DNS (DNS over HTTPS/TLS) improves privacy, it can also be exploited by attackers to hide malicious domain queries from traditional DNS monitoring.'
    }
  },
  {
    id: 'l3_q20',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Advanced Malware Analysis',
      scenario: 'A malware sample uses domain generation algorithms (DGA) for C2 communication. How does this affect detection?',
      choices: ['Makes C2 domains harder to predict and block', 'Makes detection easier', 'No impact on detection', 'Only affects network speed'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Makes C2 domains harder to predict and block',
      keywords: [],
      explanation: 'DGA generates a large number of potential domain names algorithmically, making it difficult to predict and block all possible C2 domains, allowing malware to maintain communication.'
    }
  },
  {
    id: 'l3_q21',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is the purpose of a sinkhole in cybersecurity?',
      scenario: '',
      choices: ['Redirect malicious traffic to a controlled server for analysis', 'Block all network traffic', 'Encrypt data', 'Backup systems'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Redirect malicious traffic to a controlled server for analysis',
      keywords: [],
      explanation: 'A DNS sinkhole redirects traffic destined for malicious domains to a controlled server, allowing security teams to analyze malware behavior and gather threat intelligence.'
    }
  },
  {
    id: 'l3_q22',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'short',
      title: 'What is the technique of using stolen credentials from one breach to access other accounts called?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Credential stuffing',
      keywords: ['credential stuffing', 'credential reuse attack'],
      explanation: 'Credential stuffing is an attack where stolen usernames and passwords from one breach are automatically tested against other services, exploiting password reuse.'
    }
  },
  {
    id: 'l3_q23',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Incident Response',
      scenario: 'During a ransomware incident, you discover the attack vector was a phishing email with a malicious attachment. The malware then moved laterally and encrypted multiple systems. What containment strategy should be prioritized?',
      choices: ['Isolate affected systems and prevent further lateral movement', 'Restore from backups immediately', 'Pay the ransom', 'Wait for vendor guidance'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Isolate affected systems and prevent further lateral movement',
      keywords: [],
      explanation: 'Immediate containment to stop lateral movement is critical in ransomware incidents to prevent further encryption and damage before recovery can begin.'
    }
  },
  {
    id: 'l3_q24',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is the purpose of a deception technology platform?',
      scenario: '',
      choices: ['Create decoys and honeypots to detect and analyze attacks', 'Block all incoming traffic', 'Encrypt all data', 'Monitor employee activity'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Create decoys and honeypots to detect and analyze attacks',
      keywords: [],
      explanation: 'Deception technology creates realistic decoys and honeypots throughout the network to detect attackers early, gather intelligence, and provide high-fidelity alerts.'
    }
  },
  {
    id: 'l3_q25',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'tf',
      title: 'Timeline analysis is crucial in incident response to understand the attack sequence.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'Creating a timeline of events helps incident responders understand the attack sequence, identify the attack vector, assess impact, and determine root cause.'
    }
  },
  {
    id: 'l3_q26',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Advanced Threat Detection',
      scenario: 'You detect suspicious network activity: a server is making outbound connections to multiple IP addresses in different countries, using random ports, and transferring small encrypted packets. This pattern suggests what?',
      choices: ['Data exfiltration using covert channels', 'Normal backup activity', 'VPN usage', 'Software updates'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Data exfiltration using covert channels',
      keywords: [],
      explanation: 'Covert channel exfiltration uses multiple destinations, random ports, and small encrypted packets to evade detection by blending in with normal traffic.'
    }
  },
  {
    id: 'l3_q27',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'short',
      title: 'What is the term for malware that can modify itself to evade detection?',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Polymorphic malware',
      keywords: ['polymorphic', 'polymorphic malware', 'self-modifying malware'],
      explanation: 'Polymorphic malware can change its code and appearance with each infection to evade signature-based detection while maintaining its malicious functionality.'
    }
  },
  {
    id: 'l3_q28',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'mcq',
      title: 'What is the kill chain phase where attackers establish communication channels?',
      scenario: '',
      choices: ['Command and Control', 'Weaponization', 'Delivery', 'Installation'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Command and Control',
      keywords: [],
      explanation: 'In the cyber kill chain, Command and Control (C2) is the phase where attackers establish communication channels with compromised systems to maintain persistence and control.'
    }
  },
  {
    id: 'l3_q29',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'tf',
      title: 'Machine learning can be used to detect zero-day malware by analyzing behavioral patterns.',
      scenario: '',
      choices: [],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'true',
      keywords: [],
      explanation: 'ML-based detection systems can identify malicious behavior patterns even for previously unseen malware (zero-days) by analyzing code characteristics, execution behavior, and other features.'
    }
  },
  {
    id: 'l3_q30',
    public: {
      level: 3,
      difficulty: 'hard',
      type: 'scenario',
      title: 'Advanced Incident Response',
      scenario: 'After containing a security breach, you need to determine the root cause. You have logs, network captures, and system images. What analysis approach should you take?',
      choices: ['Conduct forensic analysis following the attack timeline', 'Delete all evidence and rebuild systems', 'Restore from backups immediately', 'Ignore the breach and move on'],
      imageUrl: ''
    },
    private: {
      correctAnswer: 'Conduct forensic analysis following the attack timeline',
      keywords: [],
      explanation: 'Forensic analysis following the attack timeline helps identify root cause, attack vector, full scope of compromise, and informs improved defenses and recovery procedures.'
    }
  }
];

// Combine all questions
const ALL_QUESTIONS = [
  ...LEVEL_1_QUESTIONS,
  ...LEVEL_2_QUESTIONS,
  ...LEVEL_3_QUESTIONS
];

// ==================== SEED FUNCTION ====================

async function seedQuestions() {
  console.log('🌱 Starting SOCyberX question seeding...\n');
  console.log(`📊 Question bank summary:`);
  console.log(`   - Level 1: ${LEVEL_1_QUESTIONS.length} questions`);
  console.log(`   - Level 2: ${LEVEL_2_QUESTIONS.length} questions`);
  console.log(`   - Level 3: ${LEVEL_3_QUESTIONS.length} questions`);
  console.log(`   - Total: ${ALL_QUESTIONS.length} questions\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Process questions in batches (Firestore batch limit is 500)
  const batchSize = 400; // Use 400 to stay well under limit
  const batches = [];
  
  for (let i = 0; i < ALL_QUESTIONS.length; i += batchSize) {
    batches.push(ALL_QUESTIONS.slice(i, i + batchSize));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = db.batch();
    const questionBatch = batches[batchIndex];
    let batchWrites = 0;
    
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${questionBatch.length} questions)...`);

    for (const question of questionBatch) {
      try {
        const publicRef = db.collection('questionsPublic').doc(question.id);
        const privateRef = db.collection('questionsPrivate').doc(question.id);

        // Check if document already exists
        const [publicDoc, privateDoc] = await Promise.all([
          publicRef.get(),
          privateRef.get()
        ]);

        if (publicDoc.exists || privateDoc.exists) {
          console.log(`   ⚠️  Question ${question.id} already exists - skipping`);
          skipped++;
          continue;
        }

        // Set both documents
        batch.set(publicRef, question.public);
        batch.set(privateRef, question.private);
        batchWrites += 2; // Two writes per question (public + private)
        inserted++;

      } catch (error) {
        console.error(`   ❌ Error processing question ${question.id}:`, error.message);
        errors++;
      }
    }

    // Commit batch only if there are writes
    if (batchWrites > 0) {
      try {
        await batch.commit();
        console.log(`   ✅ Batch ${batchIndex + 1} committed successfully (${batchWrites / 2} questions)`);
      } catch (error) {
        console.error(`   ❌ Error committing batch ${batchIndex + 1}:`, error.message);
        errors++;
      }
    } else {
      console.log(`   ⏭️  Batch ${batchIndex + 1} skipped (all questions already exist)`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 Seeding Summary:');
  console.log(`   ✅ Inserted: ${inserted} questions`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped (already exist): ${skipped} questions`);
  }
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors} questions`);
  }
  console.log('='.repeat(50));

  if (errors === 0) {
    console.log('\n✅ Question seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify data in Firebase Console:');
    console.log('      - Go to Firestore Database');
    console.log('      - Check questionsPublic collection');
    console.log('      - Check questionsPrivate collection');
    console.log('   2. Verify question counts match expected totals');
    console.log('   3. Test question retrieval in your application\n');
  } else {
    console.log('\n⚠️  Seeding completed with errors. Please review the output above.\n');
    process.exit(1);
  }
}

// ==================== RUN SEEDING ====================

seedQuestions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error during seeding:', error);
    process.exit(1);
  });

