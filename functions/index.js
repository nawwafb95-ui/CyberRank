const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({
  origin: true
});
require("dotenv").config();

// Initialize Firebase Admin
// Set Firestore emulator host before initialization
if (process.env.FUNCTIONS_EMULATOR === "true" || !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
}

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Removed setCors - cors middleware handles all CORS headers

async function sendEmailViaResend(to, subject, text) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!FROM_EMAIL) {
    throw new Error("FROM_EMAIL is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      text: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

exports.sendOtp = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      console.log("[sendOtp] OPTIONS preflight request");
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).send("Only POST allowed");
    }

    try {
      const { email } = req.body || {};
      console.log("[sendOtp] Received request for email:", email);
      if (!email) {
        return res.status(400).send("Email is required.");
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      await db.collection("otps").doc(email).set({
        otp,
        expiresAt,
        used: false,
      });

      console.log("Generated OTP for", email, "=", otp);

      try {
        await sendEmailViaResend(
          email,
          "Your SOCyberX OTP Code",
          `Your OTP is ${otp}. It expires in 5 minutes.`
        );
        console.log("OTP email sent successfully to", email);
      } catch (mailErr) {
        console.error("Error sending email via Resend:", mailErr.message);
        // In emulator mode, log OTP to console instead of failing
        if (process.env.FUNCTIONS_EMULATOR || !RESEND_API_KEY) {
          console.log("[EMULATOR MODE] OTP for", email, "is:", otp);
          console.log("[EMULATOR MODE] Email sending skipped (RESEND_API_KEY not configured)");
          // Still return success in emulator mode
          return res.status(200).send(`OTP generated: ${otp} (emulator mode - check console logs)`);
        }
        return res.status(500).send("Failed to send OTP email: " + mailErr.message);
      }

      return res.status(200).send("OTP sent successfully.");
    } catch (err) {
      console.error("Error in sendOtp:", err);
      return res.status(500).send("Internal error sending OTP: " + err.message);
    }
  });
});

exports.verifyOtp = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      console.log("[verifyOtp] OPTIONS preflight request");
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).send("Only POST allowed");
    }

    try {
      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).send("Missing fields.");
      }

      const doc = await db.collection("otps").doc(email).get();
      if (!doc.exists) {
        return res.status(400).send("OTP not found.");
      }

      const data = doc.data();
      if (data.used) return res.status(400).send("OTP already used.");
      if (Date.now() > data.expiresAt)
        return res.status(400).send("OTP expired.");
      if (data.otp !== otp) return res.status(400).send("Invalid OTP.");

      await db.collection("otps").doc(email).update({ used: true });

      return res.status(200).send("OTP verified successfully!");
    } catch (err) {
      console.error("Error in verifyOtp:", err);
      return res.status(500).send("Internal error verifying OTP: " + err.message);
    }
  });
});
