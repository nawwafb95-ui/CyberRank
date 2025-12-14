const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

// Email configuration (Mailtrap or other SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate random OTP code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
exports.sendOtp = functions.https.onRequest(async (req, res) => {
  const email = req.body.email;

  if (!email) return res.status(400).send("Email is required.");

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // Expires after 5 minutes

  await db.collection("otps").doc(email).set({
    otp,
    expiresAt,
    used: false,
  });

  // Send code via email
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Your SOCyberX OTP Code",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });

  res.send("OTP sent successfully!");
});

// Verify OTP code
exports.verifyOtp = functions.https.onRequest(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).send("Missing fields.");

  const doc = await db.collection("otps").doc(email).get();
  if (!doc.exists) return res.status(400).send("OTP not found.");

  const data = doc.data();
  if (data.used) return res.status(400).send("OTP already used.");
  if (Date.now() > data.expiresAt)
    return res.status(400).send("OTP expired.");

  if (data.otp !== otp) return res.status(400).send("Invalid OTP.");

  await db.collection("otps").doc(email).update({ used: true });

  res.send("OTP verified successfully!");
});
