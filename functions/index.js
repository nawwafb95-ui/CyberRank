const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");

// Load .env file for local development (only when running in emulator)
// In production, use Firebase Functions runtime config: firebase functions:config:set resend.key="..."
// Note: Firebase Functions config values are accessible via functions.config() in production
if (process.env.FUNCTIONS_EMULATOR) {
  require("dotenv").config();
}

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Get secrets from environment variables
// Production: Set via Firebase Functions runtime config: firebase functions:config:set resend.key="..."
// Local dev: Set via .env file (not committed to git)
// Priority: process.env > functions.config().resend.key > null (will fail gracefully)
let RESEND_API_KEY = process.env.RESEND_API_KEY;
let FROM_EMAIL = process.env.FROM_EMAIL;

// OTP Feature Flag - OTP temporarily disabled – can be re-enabled by setting OTP_ENABLED = true
// When disabled: Skip OTP generation, skip email sending, auto-verify all requests
// Default: false (OTP disabled)
let OTP_ENABLED = process.env.OTP_ENABLED === "true" || process.env.OTP_ENABLED === true;

// Fallback to Firebase Functions config (for production v1 functions)
if (!RESEND_API_KEY) {
  try {
    RESEND_API_KEY = functions.config().resend?.key || null;
  } catch (e) {
    // functions.config() may not be available in all environments
    RESEND_API_KEY = null;
  }
}
if (!FROM_EMAIL) {
  try {
    FROM_EMAIL = functions.config().resend?.from_email || null;
  } catch (e) {
    FROM_EMAIL = null;
  }
}
// Check OTP_ENABLED from Firebase Functions config as fallback
if (!OTP_ENABLED) {
  try {
    const configValue = functions.config().otp?.enabled;
    OTP_ENABLED = configValue === true || configValue === "true";
  } catch (e) {
    // functions.config() may not be available in all environments
    OTP_ENABLED = false;
  }
}

// Allow localhost origins and production domains
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:8080",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5000",
      "https://socyberx.com",
      "https://www.socyberx.com"
    ];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    return true;
  }
  return ALLOWED_ORIGINS.includes(origin);
}

function setCorsHeaders(res, origin) {
  if (isOriginAllowed(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

function handleOptions(res, origin) {
  setCorsHeaders(res, origin);
  return res.status(204).send("");
}

/**
 * Generate a secure 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using SHA-256 (never store plain OTP)
 */
function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Verify OTP by comparing hashes
 */
function verifyOTPHash(otp, hash) {
  return hashOTP(otp) === hash;
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(to, subject, text, html) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  if (!FROM_EMAIL) throw new Error("FROM_EMAIL is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      from: FROM_EMAIL, 
      to, 
      subject, 
      text,
      html: html || text.replace(/\n/g, "<br>")
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

function withCors(handler) {
  return async (req, res) => {
    const origin = req.get("Origin") || "";

    if (req.method === "OPTIONS") return handleOptions(res, origin);

    if (req.method !== "POST") {
      setCorsHeaders(res, origin);
      return res.status(405).send("Only POST allowed");
    }

    if (origin && !isOriginAllowed(origin)) {
      setCorsHeaders(res, origin);
      return res.status(403).send("CORS blocked");
    }

    try {
      setCorsHeaders(res, origin);
      await handler(req, res);
    } catch (err) {
      console.error("[Function Error]", err);
      if (!res.headersSent) {
        res.status(500).send("Internal server error: " + err.message);
      }
    }
  };
}

// ==================== SECURE OTP FUNCTIONS ====================

/**
 * Request OTP for signup or password reset
 * Purpose: "signup" | "reset_password"
 * 
 * OTP temporarily disabled – can be re-enabled by setting OTP_ENABLED = true
 * When OTP is disabled, this function returns success without generating/sending OTP
 */
exports.requestOtp = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email, purpose } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required. (البريد الإلكتروني مطلوب)" 
      });
    }

    if (!purpose || !["signup", "reset_password"].includes(purpose)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid purpose. Must be 'signup' or 'reset_password'. (الغرض غير صحيح)" 
      });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const now = Date.now();
    const resendAvailableAt = now + 60 * 1000; // 60 seconds cooldown

    // OTP temporarily disabled – can be re-enabled by setting OTP_ENABLED = true
    // When disabled: Skip OTP generation, skip email sending, return success immediately
    if (!OTP_ENABLED) {
      console.log(`[requestOtp] OTP disabled - auto-approving request for ${emailTrimmed} (${purpose})`);
      
      // Create a "verified" OTP request record for tracking (optional, but helps with flow consistency)
      try {
        // Check for existing request
        const existingQuery = await db.collection("otpRequests")
          .where("email", "==", emailTrimmed)
          .where("purpose", "==", purpose)
          .where("status", "==", "verified")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (existingQuery.empty) {
          // Create a verified request record (no OTP needed)
          await db.collection("otpRequests").add({
            email: emailTrimmed,
            purpose,
            status: "verified",
            otpHash: null, // No OTP generated
            verifiedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            otpDisabled: true // Flag to indicate OTP was disabled
          });
        }
      } catch (dbError) {
        // Log but don't fail - OTP is disabled anyway
        console.warn("[requestOtp] Failed to create OTP record (OTP disabled):", dbError);
      }

      return res.status(200).json({
        success: true,
        message: "OTP verification skipped (OTP disabled). (تم تخطي التحقق - OTP معطل)",
        resendAvailableAt,
        otpDisabled: true
      });
    }

    // OTP ENABLED - Original OTP generation and email sending logic
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    try {
      // Check for existing pending OTP request
      const existingQuery = await db.collection("otpRequests")
        .where("email", "==", emailTrimmed)
        .where("purpose", "==", purpose)
        .where("status", "==", "pending")
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        const existing = existingQuery.docs[0].data();
        
        // Check cooldown
        if (now < existing.resendAvailableAt) {
          const secondsLeft = Math.ceil((existing.resendAvailableAt - now) / 1000);
          return res.status(429).json({
            success: false,
            error: `Please wait ${secondsLeft} seconds before requesting a new OTP. (يرجى الانتظار ${secondsLeft} ثانية قبل طلب رمز جديد)`,
            resendAvailableAt: existing.resendAvailableAt
          });
        }

        // Update existing request
        await existingQuery.docs[0].ref.update({
          otpHash,
          expiresAt,
          attemptsRemaining: 5, // Reset attempts
          resendAvailableAt,
          status: "pending",
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        // Create new request
        await db.collection("otpRequests").add({
          email: emailTrimmed,
          purpose,
          otpHash,
          expiresAt,
          attemptsRemaining: 5,
          resendAvailableAt,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      console.log(`[requestOtp] OTP generated for ${emailTrimmed} (${purpose})`);

      // Send email
      try {
        const emailSubject = purpose === "signup" 
          ? "Verify Your Email - SOCyberX" 
          : "Reset Your Password - SOCyberX";
        
        const emailText = purpose === "signup"
          ? `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`
          : `Your password reset code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`;

        const emailHtml = purpose === "signup"
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Verify Your Email</h2>
              <p>Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 20px 0;">${otp}</div>
              <p>This code expires in 5 minutes.</p>
              <p style="color: #64748b; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Reset Your Password</h2>
              <p>Your password reset code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 20px 0;">${otp}</div>
              <p>This code expires in 5 minutes.</p>
              <p style="color: #64748b; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `;

        if (RESEND_API_KEY && FROM_EMAIL) {
          await sendEmailViaResend(emailTrimmed, emailSubject, emailText, emailHtml);
          console.log(`[requestOtp] Email sent to ${emailTrimmed}`);
        } else {
          // Dev mode - log OTP
          console.log(`[DEV MODE] OTP for ${emailTrimmed}: ${otp}`);
        }

        return res.status(200).json({
          success: true,
          message: "OTP sent successfully. (تم إرسال رمز التحقق بنجاح)",
          resendAvailableAt
        });
      } catch (emailError) {
        console.error("[requestOtp] Email send failed:", emailError);
        
        // Mark request as failed
        const failedQuery = await db.collection("otpRequests")
          .where("email", "==", emailTrimmed)
          .where("purpose", "==", purpose)
          .where("status", "==", "pending")
          .limit(1)
          .get();

        if (!failedQuery.empty) {
          await failedQuery.docs[0].ref.update({
            status: "failed",
            emailError: emailError.message,
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        return res.status(500).json({
          success: false,
          error: "We could not send the verification code to your email. Please try again in a moment. (تعذر إرسال رمز التحقق إلى بريدك الإلكتروني، حاول مرة أخرى لاحقًا)"
        });
      }
    } catch (err) {
      console.error("[requestOtp] Error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to generate OTP. Please try again. (فشل إنشاء رمز التحقق، يرجى المحاولة مرة أخرى)"
      });
    }
  })
);

/**
 * Verify OTP
 * 
 * OTP temporarily disabled – can be re-enabled by setting OTP_ENABLED = true
 * When OTP is disabled, this function auto-verifies all requests
 */
exports.verifyOtp = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email, otp, purpose } = req.body || {};
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required. (البريد الإلكتروني مطلوب)"
      });
    }

    if (!purpose || !["signup", "reset_password"].includes(purpose)) {
      return res.status(400).json({
        success: false,
        error: "Invalid purpose. (الغرض غير صحيح)"
      });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // OTP temporarily disabled – can be re-enabled by setting OTP_ENABLED = true
    // When disabled: Auto-verify all requests without checking OTP
    if (!OTP_ENABLED) {
      console.log(`[verifyOtp] OTP disabled - auto-verifying for ${emailTrimmed} (${purpose})`);
      
      // Find or create a verified OTP request record
      try {
        const query = await db.collection("otpRequests")
          .where("email", "==", emailTrimmed)
          .where("purpose", "==", purpose)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (!query.empty) {
          // Update existing request to verified
          await query.docs[0].ref.update({
            status: "verified",
            verifiedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            otpDisabled: true
          });
        } else {
          // Create new verified request
          await db.collection("otpRequests").add({
            email: emailTrimmed,
            purpose,
            status: "verified",
            otpHash: null,
            verifiedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            otpDisabled: true
          });
        }
      } catch (dbError) {
        // Log but don't fail - OTP is disabled anyway
        console.warn("[verifyOtp] Failed to update OTP record (OTP disabled):", dbError);
      }

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully (OTP disabled). (تم التحقق بنجاح - OTP معطل)",
        verifiedAt: Date.now(),
        otpDisabled: true
      });
    }

    // OTP ENABLED - Original OTP verification logic
    if (!otp) {
      return res.status(400).json({
        success: false,
        error: "OTP is required. (رمز التحقق مطلوب)"
      });
    }

    const otpTrimmed = otp.trim().replace(/\D/g, ""); // Remove non-digits

    if (otpTrimmed.length !== 6) {
      return res.status(400).json({
        success: false,
        error: "OTP must be 6 digits. (يجب أن يكون رمز التحقق 6 أرقام)"
      });
    }

    try {
      // Find pending OTP request
      const query = await db.collection("otpRequests")
        .where("email", "==", emailTrimmed)
        .where("purpose", "==", purpose)
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (query.empty) {
        return res.status(400).json({
          success: false,
          error: "OTP request not found. Please request a new OTP. (لم يتم العثور على طلب رمز التحقق، يرجى طلب رمز جديد)"
        });
      }

      const doc = query.docs[0];
      const data = doc.data();

      // Check expiry
      if (Date.now() > data.expiresAt) {
        await doc.ref.update({
          status: "expired",
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.status(400).json({
          success: false,
          error: "OTP code has expired. Please request a new one. (انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد)"
        });
      }

      // Check attempts
      if (data.attemptsRemaining <= 0) {
        await doc.ref.update({
          status: "expired",
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.status(400).json({
          success: false,
          error: "Too many failed attempts. Please request a new OTP. (محاولات كثيرة فاشلة، يرجى طلب رمز جديد)"
        });
      }

      // Verify OTP hash
      if (!verifyOTPHash(otpTrimmed, data.otpHash)) {
        const newAttempts = data.attemptsRemaining - 1;
        await doc.ref.update({
          attemptsRemaining: newAttempts,
          updatedAt: FieldValue.serverTimestamp()
        });

        if (newAttempts <= 0) {
          await doc.ref.update({
            status: "expired",
            updatedAt: FieldValue.serverTimestamp()
          });
          return res.status(400).json({
            success: false,
            error: "Too many failed attempts. Please request a new OTP. (محاولات كثيرة فاشلة، يرجى طلب رمز جديد)"
          });
        }

        return res.status(400).json({
          success: false,
          error: `Invalid OTP code. ${newAttempts} attempt(s) remaining. (رمز التحقق غير صحيح، متبقي ${newAttempts} محاولة)`,
          attemptsRemaining: newAttempts
        });
      }

      // OTP verified successfully
      await doc.ref.update({
        status: "verified",
        verifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`[verifyOtp] OTP verified for ${emailTrimmed} (${purpose})`);

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully! (تم التحقق من رمز التحقق بنجاح)",
        verifiedAt: Date.now()
      });
    } catch (err) {
      console.error("[verifyOtp] Error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to verify OTP. Please try again. (فشل التحقق من رمز التحقق، يرجى المحاولة مرة أخرى)"
      });
    }
  })
);

/**
 * Check if OTP is verified (for signup/password reset flow)
 */
exports.checkOtpStatus = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email, purpose } = req.body || {};
    
    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        error: "Email and purpose are required. (البريد الإلكتروني والغرض مطلوبان)"
      });
    }

    const emailTrimmed = email.trim().toLowerCase();

    try {
      const query = await db.collection("otpRequests")
        .where("email", "==", emailTrimmed)
        .where("purpose", "==", purpose)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (query.empty) {
        return res.status(404).json({
          success: false,
          error: "OTP request not found. (لم يتم العثور على طلب رمز التحقق)"
        });
      }

      const data = query.docs[0].data();
      
      return res.status(200).json({
        success: true,
        status: data.status,
        verified: data.status === "verified",
        expiresAt: data.expiresAt,
        attemptsRemaining: data.attemptsRemaining
      });
    } catch (err) {
      console.error("[checkOtpStatus] Error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to check OTP status. (فشل التحقق من حالة رمز التحقق)"
      });
    }
  })
);

// ==================== QUIZ PROGRESSION FUNCTIONS ====================

/**
 * Submit quiz result and update user stats
 * This is the SERVER-SIDE source of truth for score updates and level unlocking
 * 
 * @param {string} level - "easy" | "medium" | "hard"
 * @param {number} score - Score achieved (0-100)
 * @param {string} attemptId - Optional attempt ID for tracking
 */
exports.submitQuizResult = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to submit quiz results."
    );
  }

  const userId = context.auth.uid;
  const { level, score, attemptId } = data || {};

  // Validate input
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
    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      const userStatsRef = db.collection("userStats").doc(userId);
      const userStatsDoc = await transaction.get(userStatsRef);

      // Initialize or get existing stats
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
        // Fetch username from users collection
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const userData = userDoc.data();
          stats.username = userData.username || "";
        }
      }

      // Update level-specific stats
      const levelKey = `bestScore${level.charAt(0).toUpperCase() + level.slice(1)}`;
      const attemptsKey = `attempts${level.charAt(0).toUpperCase() + level.slice(1)}`;

      // Increment attempts
      stats[attemptsKey] = (stats[attemptsKey] || 0) + 1;

      // Update best score if new score is higher (never re-lock)
      if (score > (stats[levelKey] || 0)) {
        stats[levelKey] = score;
      }

      // Update highestUnlocked based on thresholds
      const UNLOCK_THRESHOLD = 60;
      if (level === "easy" && stats.bestScoreEasy >= UNLOCK_THRESHOLD) {
        if (stats.highestUnlocked === "easy" || !stats.highestUnlocked) {
          stats.highestUnlocked = "medium";
        }
      }
      if (level === "medium" && stats.bestScoreMedium >= UNLOCK_THRESHOLD) {
        if (stats.highestUnlocked === "medium" || stats.highestUnlocked === "easy") {
          stats.highestUnlocked = "hard";
        }
      }

      // Write updated stats
      transaction.set(userStatsRef, stats, { merge: true });

      // Create point transaction if attemptId provided
      if (attemptId) {
        const pointTransactionRef = db.collection("pointTransactions").doc();
        transaction.set(pointTransactionRef, {
          userId: userId,
          delta: score,
          reason: "QUIZ_ATTEMPT",
          attemptId: attemptId,
          level: level,
          score: score,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Create audit log
      const logRef = db.collection("logs").doc();
      transaction.set(logRef, {
        action: "QUIZ_RESULT_SUBMITTED",
        target: attemptId || "unknown",
        actor: userId,
        meta: {
          level: level,
          score: score,
          bestScoreAfter: stats[levelKey],
          highestUnlockedAfter: stats.highestUnlocked,
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      // Determine if next level was just unlocked
      let nextLevelUnlocked = false;
      if (level === "easy" && stats.bestScoreEasy >= UNLOCK_THRESHOLD) {
        nextLevelUnlocked = (stats.highestUnlocked === "medium");
      } else if (level === "medium" && stats.bestScoreMedium >= UNLOCK_THRESHOLD) {
        nextLevelUnlocked = (stats.highestUnlocked === "hard");
      }

      return {
        bestScore: stats[levelKey],
        nextLevelUnlocked: nextLevelUnlocked,
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

/**
 * Validate answer for a question (SERVER-SIDE ONLY)
 * This function checks the answer against questionsPrivate collection
 * correctAnswer is NEVER exposed to the client
 * 
 * @param {string} questionId - The question ID from questionsPublic
 * @param {string|number} answer - The user's answer
 */
exports.validateAnswer = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to validate answers."
    );
  }

  const { questionId, answer } = data || {};

  // Validate input
  if (!questionId || typeof questionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "questionId is required and must be a string."
    );
  }

  if (answer === null || answer === undefined) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "answer is required."
    );
  }

  try {
    // Get correct answer from questionsPrivate (never exposed to client)
    const privateQuestionRef = db.collection("questionsPrivate").doc(questionId);
    const privateQuestionDoc = await privateQuestionRef.get();

    if (!privateQuestionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Question not found in private collection."
      );
    }

    const privateData = privateQuestionDoc.data();
    const correctAnswer = privateData.correctAnswer;

    if (correctAnswer === null || correctAnswer === undefined) {
      throw new functions.https.HttpsError(
        "internal",
        "Question does not have a correct answer configured."
      );
    }

    // Normalize answers for comparison
    let userAnswer = answer;
    let correctAnswerNormalized = correctAnswer;

    // Convert to strings and lowercase for comparison (case-insensitive)
    if (typeof userAnswer === "number") {
      userAnswer = userAnswer.toString();
    }
    if (typeof correctAnswerNormalized === "number") {
      correctAnswerNormalized = correctAnswerNormalized.toString();
    }

    // For string answers, do case-insensitive comparison
    if (typeof userAnswer === "string" && typeof correctAnswerNormalized === "string") {
      userAnswer = userAnswer.trim().toLowerCase();
      correctAnswerNormalized = correctAnswerNormalized.trim().toLowerCase();
    }

    // Compare answers
    const isCorrect = userAnswer === correctAnswerNormalized;

    // Log validation (without exposing correct answer)
    console.log(
      `[validateAnswer] Question ${questionId} validated for user ${context.auth.uid}: ${isCorrect ? "correct" : "incorrect"}`
    );

    return {
      isCorrect: isCorrect,
      // DO NOT return correctAnswer to client
    };
  } catch (error) {
    console.error(`[validateAnswer] Error:`, error);
    
    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otherwise, wrap it
    throw new functions.https.HttpsError(
      "internal",
      "Failed to validate answer. Please try again."
    );
  }
});

/**
 * Check if user can start a specific level
 * Returns access status and reason if denied
 */
exports.canStartLevel = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    return {
      allowed: false,
      reason: "Authentication required. Please log in to access challenges.",
    };
  }

  const userId = context.auth.uid;
  const { level } = data || {};

  // Validate input
  if (!level || !["easy", "medium", "hard"].includes(level)) {
    return {
      allowed: false,
      reason: "Invalid level. Must be 'easy', 'medium', or 'hard'.",
    };
  }

  try {
    const userStatsRef = db.collection("userStats").doc(userId);
    const userStatsDoc = await userStatsRef.get();

    // Easy level is always accessible
    if (level === "easy") {
      return { allowed: true, reason: "" };
    }

    // If no stats exist, only easy is accessible
    if (!userStatsDoc.exists) {
      return {
        allowed: false,
        reason: "Complete the Easy level first (score >= 60%) to unlock Medium.",
      };
    }

    const stats = userStatsDoc.data();
    const UNLOCK_THRESHOLD = 60;

    // Medium level requires Easy >= 60
    if (level === "medium") {
      const canAccess = stats.bestScoreEasy != null && stats.bestScoreEasy >= UNLOCK_THRESHOLD;
      return {
        allowed: canAccess,
        reason: canAccess
          ? ""
          : `Complete the Easy level first (score >= ${UNLOCK_THRESHOLD}%) to unlock Medium. Your best Easy score: ${stats.bestScoreEasy || 0}%`,
      };
    }

    // Hard level requires Medium >= 60
    if (level === "hard") {
      const canAccess = stats.bestScoreMedium != null && stats.bestScoreMedium >= UNLOCK_THRESHOLD;
      return {
        allowed: canAccess,
        reason: canAccess
          ? ""
          : `Complete the Medium level first (score >= ${UNLOCK_THRESHOLD}%) to unlock Hard. Your best Medium score: ${stats.bestScoreMedium || 0}%`,
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

/**
 * Get or create a fixed question set for a user at a specific level
 * The set is deterministic based on hash(uid + level) - same user always gets same set
 * 
 * @param {string} level - "easy" | "medium" | "hard"
 * @returns {Object} { level, questionIds: [...], totalQuestions }
 */
exports.getOrCreateLevelSet = functions.https.onRequest(
  withCors(async (req, res) => {
    try {
      // Verify authentication via Authorization header
      const authHeader = req.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Authentication required. Please log in to get question sets."
        });
      }

      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authError) {
        return res.status(401).json({
          success: false,
          error: "Invalid authentication token. Please log in again."
        });
      }

      const userId = decodedToken.uid;
      const { level } = req.body || {};

      // Validate input
      if (!level || !["easy", "medium", "hard"].includes(level)) {
        return res.status(400).json({
          success: false,
          error: "Level must be 'easy', 'medium', or 'hard'."
        });
      }

      // Check if user already has a set for this level
      const levelSetRef = db.collection("userLevelSets").doc(`${userId}_${level}`);
      const levelSetDoc = await levelSetRef.get();

      if (levelSetDoc.exists) {
        const data = levelSetDoc.data();
        console.log(`[getOrCreateLevelSet] Returning existing set for userId: ${userId}, level: ${level}`);
        return res.status(200).json({
          success: true,
          level: data.level,
          questionIds: data.questionIds,
          totalQuestions: data.questionIds.length
        });
      }

      // Create new set - get all questions for this level from questionsPublic
      const questionsPublicRef = db.collection("questionsPublic");
      const questionsQuery = questionsPublicRef.where("level", "==", level);
      const questionsSnapshot = await questionsQuery.get();

      if (questionsSnapshot.empty) {
        return res.status(404).json({
          success: false,
          error: `No questions found for level: ${level}`
        });
      }

      // Get all question IDs
      const allQuestionIds = questionsSnapshot.docs.map(doc => doc.id);

      // Create deterministic selection based on hash(uid + level)
      // Use crypto to create a hash
      const hashInput = `${userId}_${level}`;
      const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
      
      // Convert hash to number and use it to seed selection
      // We'll select a subset deterministically
      const seed = parseInt(hash.substring(0, 8), 16);
      
      // Simple deterministic shuffle using seeded random
      function seededShuffle(array, seed) {
        const shuffled = [...array];
        let currentSeed = seed;
        
        // Simple LCG (Linear Congruential Generator) for seeded random
        function seededRandom() {
          currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
          return currentSeed / 0x7fffffff;
        }
        
        // Fisher-Yates shuffle with seeded random
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
      }
      
      // Shuffle and take up to 10 questions (or all if less than 10)
      const shuffled = seededShuffle(allQuestionIds, seed);
      const selectedQuestionIds = shuffled.slice(0, Math.min(10, shuffled.length));

      // Store the set for this user+level
      await levelSetRef.set({
        userId: userId,
        level: level,
        questionIds: selectedQuestionIds,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`[getOrCreateLevelSet] Created new set for userId: ${userId}, level: ${level}, questions: ${selectedQuestionIds.length}`);

      return res.status(200).json({
        success: true,
        level: level,
        questionIds: selectedQuestionIds,
        totalQuestions: selectedQuestionIds.length
      });
    } catch (error) {
      console.error(`[getOrCreateLevelSet] Error:`, error);
      
      // Don't send response if headers already sent
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: "Failed to get question set. Please try again."
        });
      }
    }
  })
);

/**
 * Submit an attempt for a question
 * Validates answer server-side and returns scoring breakdown
 * 
 * @param {string} level - "easy" | "medium" | "hard"
 * @param {string} questionId - The question ID from questionsPublic
 * @param {string|number|boolean} answer - The user's answer
 * @param {number} elapsedSeconds - Time spent on question in seconds
 * @returns {Object} { isCorrect, baseScore, timeBonus, finalScore, explanation? }
 */
exports.submitAttempt = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to submit attempts."
    );
  }

  const userId = context.auth.uid;
  const { level, questionId, answer, elapsedSeconds } = data || {};

  // Validate input
  if (!level || !["easy", "medium", "hard"].includes(level)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Level must be 'easy', 'medium', or 'hard'."
    );
  }

  if (!questionId || typeof questionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "questionId is required and must be a string."
    );
  }

  if (answer === null || answer === undefined) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "answer is required."
    );
  }

  if (typeof elapsedSeconds !== "number" || elapsedSeconds < 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "elapsedSeconds must be a non-negative number."
    );
  }

  try {
    // Get question from questionsPublic to check type and get explanation
    const publicQuestionRef = db.collection("questionsPublic").doc(questionId);
    const publicQuestionDoc = await publicQuestionRef.get();

    if (!publicQuestionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Question not found."
      );
    }

    const publicData = publicQuestionDoc.data();
    const questionType = publicData.type || "mcq";
    const difficulty = publicData.difficulty || "medium";
    const explanation = publicData.explanation || null;

    // Get correct answer from questionsPrivate (never exposed to client)
    const privateQuestionRef = db.collection("questionsPrivate").doc(questionId);
    const privateQuestionDoc = await privateQuestionRef.get();

    if (!privateQuestionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Question answer not found in private collection."
      );
    }

    const privateData = privateQuestionDoc.data();
    const correctAnswer = privateData.correctAnswer;

    if (correctAnswer === null || correctAnswer === undefined) {
      throw new functions.https.HttpsError(
        "internal",
        "Question does not have a correct answer configured."
      );
    }

    // Normalize answers for comparison
    let userAnswer = answer;
    let correctAnswerNormalized = correctAnswer;

    // Convert to strings and lowercase for comparison (case-insensitive for strings)
    if (typeof userAnswer === "number") {
      userAnswer = userAnswer.toString();
    }
    if (typeof correctAnswerNormalized === "number") {
      correctAnswerNormalized = correctAnswerNormalized.toString();
    }

    // For string answers, do case-insensitive comparison and trim
    if (typeof userAnswer === "string" && typeof correctAnswerNormalized === "string") {
      userAnswer = userAnswer.trim().toLowerCase();
      correctAnswerNormalized = correctAnswerNormalized.trim().toLowerCase();
    }

    // For short answer questions, check keywords if provided
    let isCorrect = false;
    if (questionType === "short" && privateData.keywords && Array.isArray(privateData.keywords)) {
      // Check if user answer contains any of the keywords
      const userAnswerLower = userAnswer.toLowerCase();
      isCorrect = privateData.keywords.some(keyword => 
        userAnswerLower.includes(keyword.toLowerCase())
      );
      
      // Also check exact match
      if (!isCorrect) {
        isCorrect = userAnswer === correctAnswerNormalized;
      }
    } else {
      // Exact match for other types
      isCorrect = userAnswer === correctAnswerNormalized;
    }

    // Calculate scoring
    // Base score: 10 points for correct, 0 for incorrect
    const baseScore = isCorrect ? 10 : 0;

    // Time bonus: based on difficulty and time remaining
    let timeBonus = 0;
    if (isCorrect) {
      const timeTargets = {
        easy: 120,    // 2 minutes
        medium: 240,  // 4 minutes
        hard: 360     // 6 minutes
      };
      
      const targetTime = timeTargets[difficulty] || timeTargets.medium;
      const timeRemaining = Math.max(0, targetTime - elapsedSeconds);
      
      // Bonus: up to 5 points based on time remaining (linear)
      // Full bonus if answered instantly, 0 bonus if answered at target time
      timeBonus = Math.round((timeRemaining / targetTime) * 5);
    }

    const finalScore = baseScore + timeBonus;

    // Create attempt record
    const attemptRef = db.collection("attempts").doc();
    await attemptRef.set({
      userId: userId,
      level: level,
      questionId: questionId,
      answer: answer,
      isCorrect: isCorrect,
      baseScore: baseScore,
      timeBonus: timeBonus,
      finalScore: finalScore,
      elapsedSeconds: elapsedSeconds,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(
      `[submitAttempt] Attempt recorded for userId: ${userId}, questionId: ${questionId}, ` +
      `isCorrect: ${isCorrect}, finalScore: ${finalScore}`
    );

    return {
      isCorrect: isCorrect,
      baseScore: baseScore,
      timeBonus: timeBonus,
      finalScore: finalScore,
      explanation: explanation
    };
  } catch (error) {
    console.error(`[submitAttempt] Error:`, error);
    
    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otherwise, wrap it
    throw new functions.https.HttpsError(
      "internal",
      "Failed to submit attempt. Please try again."
    );
  }
});

// 📊 Update userStats when a new attempt is created
// UPDATED: Now uses the new data model (bestScoreEasy/Medium/Hard)
// This function still works for backward compatibility but submitQuizResult is preferred
exports.updateUserStatsOnAttempt = functions.firestore
  .document("attempts/{attemptId}")
  .onCreate(async (snap, context) => {
    const attempt = snap.data();
    const attemptId = context.params.attemptId;

    // Validation: Check if userId exists
    if (!attempt.userId) {
      console.error(
        `[updateUserStatsOnAttempt] Missing userId in attempt ${attemptId}. Skipping stats update.`
      );
      return null;
    }

    const userId = attempt.userId;
    const level = attempt.level || "easy"; // Default to easy if not specified

    try {
      // Compute score percentage
      const score = attempt.score || 0;
      const maxScore = attempt.maxScore || 100;
      const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      // Use transaction to ensure atomicity
      await db.runTransaction(async (transaction) => {
        // Read userStats/{userId}
        const userStatsRef = db.collection("userStats").doc(userId);
        const userStatsDoc = await transaction.get(userStatsRef);

        // Initialize or get existing stats
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
          // Fetch username from users collection
          const userRef = db.collection("users").doc(userId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists) {
            const userData = userDoc.data();
            stats.username = userData.username || "";
          }
        }

        // Update level-specific stats
        const levelKey = `bestScore${level.charAt(0).toUpperCase() + level.slice(1)}`;
        const attemptsKey = `attempts${level.charAt(0).toUpperCase() + level.slice(1)}`;

        // Increment attempts
        stats[attemptsKey] = (stats[attemptsKey] || 0) + 1;

        // Update best score if new score is higher (never re-lock)
        if (percent > (stats[levelKey] || 0)) {
          stats[levelKey] = percent;
        }

        // Update highestUnlocked based on thresholds
        const UNLOCK_THRESHOLD = 60;
        if (level === "easy" && stats.bestScoreEasy >= UNLOCK_THRESHOLD) {
          if (stats.highestUnlocked === "easy" || !stats.highestUnlocked) {
            stats.highestUnlocked = "medium";
          }
        }
        if (level === "medium" && stats.bestScoreMedium >= UNLOCK_THRESHOLD) {
          if (stats.highestUnlocked === "medium" || stats.highestUnlocked === "easy") {
            stats.highestUnlocked = "hard";
          }
        }

        // Update or create userStats document
        transaction.set(userStatsRef, stats, { merge: true });

        // Create pointTransactions document
        const pointTransactionRef = db.collection("pointTransactions").doc();
        transaction.set(pointTransactionRef, {
          userId: userId,
          delta: score,
          reason: "QUIZ_ATTEMPT",
          attemptId: attemptId,
          level: level,
          score: score,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Create logs document
        const logRef = db.collection("logs").doc();
        transaction.set(logRef, {
          action: "ATTEMPT_STATS_UPDATED",
          target: attemptId,
          actor: userId,
          meta: {
            level: level,
            score: score,
            percent: percent,
            bestScoreAfter: stats[levelKey],
            highestUnlockedAfter: stats.highestUnlocked,
          },
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(
          `[updateUserStatsOnAttempt] Updated userStats for userId: ${userId}, attemptId: ${attemptId}, ` +
            `level: ${level}, score: ${percent}%, highestUnlocked: ${stats.highestUnlocked}`
        );
      });

      return null;
    } catch (error) {
      console.error(
        `[updateUserStatsOnAttempt] Error updating userStats for attempt ${attemptId}:`,
        error
      );
      // Don't throw - we don't want to retry the function if it fails
      return null;
    }
  });