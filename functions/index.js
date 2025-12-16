const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({
  origin: "http://localhost:5173",
});
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "http://localhost:5173");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
}

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

exports.sendOtp = functions.https.onRequest((req, res) =>
  cors(req, res, async () => {
    setCors(res);

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).send("Only POST allowed");
    }

    try {
      const { email } = req.body || {};
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
        return res.status(500).send("Failed to send OTP email: " + mailErr.message);
      }

      return res.status(200).send("OTP sent successfully.");
    } catch (err) {
      console.error("Error in sendOtp:", err);
      return res.status(500).send("Internal error sending OTP: " + err.message);
    }
  })
);

exports.verifyOtp = functions.https.onRequest((req, res) =>
  cors(req, res, async () => {
    setCors(res);

    if (req.method === "OPTIONS") {
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
  })
);
