const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
require("dotenv").config();

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

// Allow localhost origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
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

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailViaResend(to, subject, text) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  if (!FROM_EMAIL) throw new Error("FROM_EMAIL is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, text }),
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

// 📩 Send OTP
exports.sendOtp = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email } = req.body || {};
    if (!email) return res.status(400).send("Email is required.");

    const emailTrimmed = email.trim().toLowerCase();
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    try {
      await db.collection("otps").doc(emailTrimmed).set({
        otp,
        expiresAt,
        used: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log("[sendOtp] OTP generated for", emailTrimmed);

      if (!RESEND_API_KEY || !FROM_EMAIL) {
        console.log("[DEV MODE] OTP:", otp);
        return res.status(200).json({ ok: true, message: "OTP generated (dev mode)." });
      }

      await sendEmailViaResend(
        emailTrimmed,
        "Your SOCyberX OTP Code",
        `Your OTP is ${otp}. It expires in 5 minutes.`
      );

      return res.status(200).json({ ok: true, message: "OTP sent successfully." });
    } catch (err) {
      console.error("[sendOtp] DB error:", err);
      return res.status(500).send("Failed to generate OTP. " + err.message);
    }
  })
);

// ✅ Verify OTP
exports.verifyOtp = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).send("Email and OTP required.");

    const emailTrimmed = email.trim().toLowerCase();
    const otpTrimmed = otp.trim();

    try {
      const doc = await db.collection("otps").doc(emailTrimmed).get();
      if (!doc.exists) return res.status(400).send("OTP not found.");

      const data = doc.data();
      if (data.used) return res.status(400).send("OTP already used.");
      if (Date.now() > data.expiresAt) return res.status(400).send("OTP expired.");
      if (String(data.otp) !== otpTrimmed) return res.status(400).send("Invalid OTP.");

      await db.collection("otps").doc(emailTrimmed).update({
        used: true,
        usedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true, message: "OTP verified successfully!" });
    } catch (err) {
      console.error("[verifyOtp] DB error:", err);
      return res.status(500).send("Failed to verify OTP. " + err.message);
    }
  })
);
