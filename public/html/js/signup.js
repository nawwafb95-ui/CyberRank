// ================== OTP Feature Flag ==================
// OTP verification is DISABLED by default (set to false to avoid Cloud Functions calls)
// Controlled by config.js - can be overridden via window.__SOCYBERX_CONFIG__
const OTP_ENABLED =
  window.SOCYBERX_CONFIG?.OTP_ENABLED ??
  window.__SOCYBERX_CONFIG__?.OTP_ENABLED ??
  false;

// Cloud Functions base URL from config.js
const FUNCTIONS_BASE_URL =
  window.SOCYBERX_CONFIG?.FUNCTIONS_BASE_URL ??
  window.__SOCYBERX_CONFIG__?.FUNCTIONS_BASE_URL ??
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001/cyberrank-a4380/us-central1"
    : "https://us-central1-cyberrank-a4380.cloudfunctions.net");

// Import Firebase modules (your firebaseInit.js must export auth, db)
import { auth, db } from "./firebaseInit.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Import error handling utilities
import { handleError, clearAllErrors } from "./errorMessages.js";

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  if (!signupForm) {
    console.error("[Signup] signup-form not found ❌");
    return;
  }

  console.log("[Signup] signup.js loaded ✅");

  // Access window globals from core.js (module-safe)
  const setError = window.setError;
  const clearErrors = window.clearErrors;
  const emailRegex = window.emailRegex;

  const usernameInput = document.getElementById("signup-username");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const confirmPasswordInput = document.getElementById("signup-confirm");

  const usernameHint = document.getElementById("username-hint");
  const passwordHint = document.getElementById("password-hint");

  // ================== Username Hint (shows on focus) ==================
  if (usernameInput && usernameHint) {
    usernameInput.addEventListener("focus", () => usernameHint.classList.add("visible"));
    usernameInput.addEventListener("blur", () => {
      if (!usernameInput.value.trim()) usernameHint.classList.remove("visible");
    });
  }

  // ================== Password Hint ==================
  if (passwordInput && passwordHint) {
    passwordInput.addEventListener("focus", () => passwordHint.classList.add("visible"));
    passwordInput.addEventListener("blur", () => {
      if (!passwordInput.value.trim()) passwordHint.classList.remove("visible");
    });
  }

  // ================== Username Validation ==================
  function validateUsername(username) {
    const usernameRegex = /^[A-Z][a-z0-9_-]{3,}$/;

    if (!username) {
      if (typeof setError === "function") setError("signup-username", "Username is required.");
      return false;
    }

    if (!usernameRegex.test(username)) {
      if (typeof setError === "function") {
        setError(
          "signup-username",
          'Username must start with a capital letter and can contain lowercase letters, numbers, "-" or "_". Minimum 4 characters.'
        );
      }
      return false;
    }

    return true;
  }

  // ================== Password Validation ==================
  function validatePassword(password) {
    if (!password) {
      if (typeof setError === "function") setError("signup-password", "Password is required.");
      return false;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{};:,.?/~_+\-=|<>]).{8,}$/;

    if (!passwordRegex.test(password)) {
      if (typeof setError === "function") {
        setError(
          "signup-password",
          "Password must be at least 8 characters and include at least 1 uppercase letter, 1 number, and 1 symbol."
        );
      }
      return false;
    }

    return true;
  }

  function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
      if (typeof setError === "function") setError("signup-confirm", "Please confirm your password.");
      return false;
    }
    if (password !== confirmPassword) {
      if (typeof setError === "function") setError("signup-confirm", "Passwords do not match.");
      return false;
    }
    return true;
  }

  // ================== Form Validation ==================
  function validateSignup() {
    // Clear errors (both systems)
    if (typeof clearErrors === "function") clearErrors(signupForm);
    clearAllErrors(signupForm);

    let ok = true;

    // ✅ IMPORTANT FIX: read by IDs (works even if inputs have no name="")
    const username = document.getElementById("signup-username")?.value.trim();
    const email = document.getElementById("signup-email")?.value.trim();
    const password = document.getElementById("signup-password")?.value;
    const confirmPassword = document.getElementById("signup-confirm")?.value;

    if (!validateUsername(username)) ok = false;

    const emailOk = email && (emailRegex ? emailRegex.test(email) : true);
    if (!emailOk) {
      if (typeof setError === "function") setError("signup-email", "Enter a valid email.");
      ok = false;
    }

    if (!validatePassword(password)) ok = false;
    if (!validateConfirmPassword(password, confirmPassword)) ok = false;

    return { ok, values: { username, email, password } };
  }

  // ================== Submit Handler ==================
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("[Signup] Submit clicked ✅");

    const { ok, values } = validateSignup();
    if (!ok) {
      console.warn("[Signup] Validation failed ❌");
      return;
    }

    const signupStatus = document.getElementById("signup-status");

    // ================== OTP Bypass Logic ==================
    if (!OTP_ENABLED) {
      console.log("[Signup] OTP disabled - creating account with Firebase Auth");

      if (signupStatus) {
        signupStatus.textContent = "Creating account...";
        signupStatus.className = "";
      }

      try {
        const { email, password, username } = values;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user doc in Firestore (non-blocking)
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(
            userDocRef,
            {
              email: user.email,
              username,
              role: "user",
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              stats: { totalPoints: 0, attemptsCount: 0, bestScore: 0 },
              progress: { easyCompleted: false, mediumCompleted: false, hardCompleted: false },
            },
            { merge: true }
          );
          console.log("[Signup] User document created at users/" + user.uid);
        } catch (firestoreError) {
          handleError("signup-form", firestoreError, {
            errorType: "form",
            logToConsole: true,
            fallbackMessage: null,
          });
        }

        if (signupStatus) {
          signupStatus.textContent = "Account created successfully!";
          signupStatus.className = "success";
        }

        const homePath = typeof window.getPath === "function" ? window.getPath("home") : "/index.html";
        setTimeout(() => (window.location.href = homePath), 300);
      } catch (err) {
        const friendlyMsg = handleError("signup-form", err, { errorType: "form", logToConsole: true });

        if (err.code === "auth/email-already-in-use") {
          handleError("signup-email", err, { errorType: "field" });
        } else if (err.code === "auth/weak-password") {
          handleError("signup-password", err, { errorType: "field" });
        } else if (err.code === "auth/invalid-email") {
          handleError("signup-email", err, { errorType: "field" });
        }

        if (signupStatus) {
          signupStatus.textContent = friendlyMsg;
          signupStatus.className = "error";
        }
      }

      return;
    }

    // ================== SECURE OTP FLOW ==================
    if (signupStatus) {
      signupStatus.textContent = "Sending verification code...";
      signupStatus.className = "";
    }

    // Store signup data temporarily
    try {
      localStorage.setItem(
        "pendingSignup",
        JSON.stringify({ ...values, timestamp: Date.now() })
      );
      console.log("[Signup] pendingSignup saved ✅");
    } catch (err) {
      console.error("[Signup] Error saving pendingSignup:", err);
      handleError("signup-form", new Error("Failed to save signup data. Please try again."), {
        errorType: "form",
        logToConsole: true,
      });
      return;
    }

    // Request OTP from backend
    try {
      const endpoint = `${FUNCTIONS_BASE_URL}/requestOtp`;
      console.log("[Signup] Requesting OTP from:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, purpose: "signup" }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: res.statusText || "Unknown error",
      }));

      if (!res.ok || !data.success) {
        const error = new Error(data.error || `Failed to send OTP (${res.status})`);
        error.code = "otp-send-failed";

        const friendlyMsg = handleError("signup-form", error, {
          errorType: "form",
          logToConsole: true,
          fallbackMessage: data.error || "Failed to send verification code. Please try again.",
        });

        if (signupStatus) {
          signupStatus.textContent = friendlyMsg;
          signupStatus.className = "error";
        }

        localStorage.removeItem("pendingSignup");
        return;
      }

      if (signupStatus) {
        signupStatus.textContent = "Verification code sent! Check your email. (تم إرسال الكود ✅)";
        signupStatus.className = "success";
      }

      // Redirect to OTP page (adjust to your real route)
      const otpPath = typeof window.getPath === "function" ? window.getPath("otp") : "/success.html";
      console.log("[Signup] Redirecting to:", otpPath);

      setTimeout(() => (window.location.href = otpPath), 800);
    } catch (err) {
      console.error("[Signup] Error requesting OTP:", err);

      const friendlyMsg = handleError("signup-form", err, {
        errorType: "form",
        logToConsole: true,
        fallbackMessage:
          "Network error. Please check your connection and try again. (خطأ شبكة، تأكد من الإنترنت وجرب مرة ثانية)",
      });

      if (signupStatus) {
        signupStatus.textContent = friendlyMsg;
        signupStatus.className = "error";
      }

      localStorage.removeItem("pendingSignup");
    }
  });
});
