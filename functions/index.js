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
const ALLOWED_ORIGIN = "http://localhost:5173";

function setCorsHeaders(res, origin) {
  if (origin === ALLOWED_ORIGIN) {
    res.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
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
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!FROM_EMAIL) {
    throw new Error("FROM_EMAIL is not configured");
  }

  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Use Node 18+ or add a fetch polyfill.");
  }

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

    if (req.method === "OPTIONS") {
      return handleOptions(res, origin);
    }

    if (req.method !== "POST") {
      setCorsHeaders(res, origin);
      return res.status(405).send("Only POST allowed");
    }

    if (origin && origin !== ALLOWED_ORIGIN) {
      setCorsHeaders(res, origin);
      return res.status(403).send("CORS blocked: origin not allowed");
    }

    try {
      setCorsHeaders(res, origin);
      await handler(req, res);
    } catch (err) {
      console.error("[Function Error]", err);
      setCorsHeaders(res, origin);
      if (!res.headersSent) {
        res.status(500).send("Internal server error: " + (err?.message || String(err)));
      }
    }
  };
}

exports.sendOtp = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).send("Email is required.");
    }

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

      console.log("[sendOtp] Generated OTP for", emailTrimmed);

      if (!RESEND_API_KEY || !FROM_EMAIL) {
        console.log("[sendOtp] OTP for", emailTrimmed, "is:", otp);
        console.log("[sendOtp] Email sending skipped. Missing RESEND_API_KEY or FROM_EMAIL.");
        return res.status(200).json({
          ok: true,
          message: "OTP generated (dev mode). Check emulator logs for OTP.",
        });
      }

      try {
        await sendEmailViaResend(
          emailTrimmed,
          "Your SOCyberX OTP Code",
          `Your OTP is ${otp}. It expires in 5 minutes.`
        );
        console.log("[sendOtp] OTP email sent successfully to", emailTrimmed);
        return res.status(200).json({ ok: true, message: "OTP sent successfully." });
      } catch (emailErr) {
        console.error("[sendOtp] Email error:", emailErr.message);
        console.log("[sendOtp] OTP logged due to email failure:", otp);
        return res.status(200).json({
          ok: true,
          message: "OTP generated. Email delivery failed. Check logs for OTP.",
        });
      }
    } catch (dbErr) {
      console.error("[sendOtp] Database error:", dbErr);
      return res.status(500).send("Failed to generate OTP. Please try again.");
    }
  })
);

exports.verifyOtp = functions.https.onRequest(
  withCors(async (req, res) => {
    const { email, otp } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).send("Email is required.");
    }

    if (!otp || typeof otp !== "string" || !otp.trim()) {
      return res.status(400).send("OTP is required.");
    }

    const emailTrimmed = email.trim().toLowerCase();
    const otpTrimmed = otp.trim();

    try {
      const doc = await db.collection("otps").doc(emailTrimmed).get();

      if (!doc.exists) {
        return res.status(400).send("OTP not found.");
      }

      const data = doc.data();

      if (data.used === true) {
        return res.status(400).send("OTP already used.");
      }

      if (Date.now() > data.expiresAt) {
        return res.status(400).send("OTP expired.");
      }

      if (String(data.otp) !== String(otpTrimmed)) {
        return res.status(400).send("Invalid OTP.");
      }

      await db.collection("otps").doc(emailTrimmed).update({
        used: true,
        usedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true, message: "OTP verified successfully!" });
    } catch (dbErr) {
      console.error("[verifyOtp] Database error:", dbErr);
      return res.status(500).send("Failed to verify OTP. Please try again.");
    }
  })
);
