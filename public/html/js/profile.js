// public/js/profile.js
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

import { firebaseConfig } from './firebaseConfig.js';

let app, auth, db;

// UI Elements
let profileForm, passwordForm, deleteAccountBtn, profileMsg;
let profileFullname, profileEmailDisplay;
let usernameInput, emailInput, dobInput, majorInput, universityInput;
let countryInput, userTypeInput, stageInput, dobHint;
let currentPasswordInput, newPasswordInput, confirmPasswordInput;

let currentUser = null;
let userDocData = null;
let dobLocked = false;

function initializeUIElements() {
  profileForm = document.getElementById('profile-form');
  passwordForm = document.getElementById('password-form');
  deleteAccountBtn = document.getElementById('delete-account-btn');
  profileMsg = document.getElementById('profileMsg');
  profileFullname = document.getElementById('profile-fullname');
  profileEmailDisplay = document.getElementById('profile-email-display');

  usernameInput = document.getElementById('profile-username');
  emailInput = document.getElementById('profile-email');
  dobInput = document.getElementById('profile-dob');
  majorInput = document.getElementById('profile-major');
  universityInput = document.getElementById('profile-university');
  countryInput = document.getElementById('profile-country');
  userTypeInput = document.getElementById('profile-usertype');
  stageInput = document.getElementById('profile-stage');
  dobHint = document.getElementById('dob-hint');

  currentPasswordInput = document.getElementById('current-password');
  newPasswordInput = document.getElementById('new-password');
  confirmPasswordInput = document.getElementById('confirm-password');

  if (profileForm) profileForm.addEventListener('submit', saveProfile);
  if (passwordForm) passwordForm.addEventListener('submit', updatePasswordHandler);
  if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', deleteAccount);

  // DOB label helper
  if (dobInput) {
    dobInput.addEventListener('change', () => {
      dobInput.classList.toggle('dob-input--has-value', !!dobInput.value);
    });
  }

  // ✅ Password visibility toggle (👁️)
  document.querySelectorAll('.toggle-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

function showMessage(message, isError = false) {
  if (!profileMsg) return;
  profileMsg.textContent = message;
  profileMsg.style.color = isError ? '#f97373' : '#10b981';
  profileMsg.style.padding = '12px';
  profileMsg.style.borderRadius = '8px';
  profileMsg.style.background = isError ? 'rgba(249, 115, 115, 0.1)' : 'rgba(16, 185, 129, 0.1)';
  profileMsg.style.border = `1px solid ${isError ? 'rgba(249, 115, 115, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`;
  profileMsg.style.display = 'block';

  setTimeout(() => {
    if (profileMsg) {
      profileMsg.textContent = '';
      profileMsg.style.display = 'none';
    }
  }, 5000);
}

function redirectToLogin() {
  // Always redirect to profile page after login
  // Use origin-relative paths (no protocol/host/port) to preserve localStorage/auth state
  const profilePath = typeof getPath === 'function' ? getPath('profile') : '/profile.html';
  const params = new URLSearchParams();
  params.set('next', profilePath);
  const loginPath = typeof getPath === 'function' ? getPath('login') : '/login.html';
  // loginPath is origin-relative - ensures we stay on same origin
  window.location.href = `${loginPath}?${params.toString()}`;
}

async function initializeFirebase() {
  // Reuse instances if navAuth.js already set them
  if (window.firebaseApp && window.auth) {
    app = window.firebaseApp;
    auth = window.auth;
    db = getFirestore(app);
  } else {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    window.firebaseApp = app;
    window.auth = auth;
  }

  initializeAuthListener();
}

function initializeAuthListener() {
  if (!auth) {
    console.error('[profile] Firebase auth not available');
    return;
  }

  // Loading
  if (profileMsg) {
    profileMsg.textContent = 'Loading...';
    profileMsg.style.color = 'var(--text, #e5e7eb)';
    profileMsg.style.padding = '12px';
    profileMsg.style.borderRadius = '8px';
    profileMsg.style.background = 'var(--surface, #1e293b)';
    profileMsg.style.border = '1px solid var(--border, rgba(148, 163, 184, 0.4))';
    profileMsg.style.display = 'block';
  }

  // ✅ Single source of truth: onAuthStateChanged only
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      if (profileMsg) {
        profileMsg.textContent = '';
        profileMsg.style.display = 'none';
      }
      loadProfile();
    } else {
      redirectToLogin();
    }
  });
}

async function loadProfile() {
  if (!currentUser) {
    redirectToLogin();
    return;
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      userDocData = userDocSnap.data();
    } else {
      await setDoc(userDocRef, {
        username: currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        createdAt: new Date().toISOString()
      });
      userDocData = (await getDoc(userDocRef)).data();
    }

    usernameInput.value = userDocData.username || '';
    emailInput.value = currentUser.email || '';
    profileEmailDisplay.textContent = currentUser.email || '—';
    profileFullname.textContent = userDocData.username || currentUser.email?.split('@')[0] || '—';

    majorInput.value = userDocData.major || '';
    universityInput.value = userDocData.university || '';
    countryInput.value = userDocData.country || '';
    userTypeInput.value = userDocData.userType || '';
    stageInput.value = userDocData.stage || userDocData.stageLevel || '';

    if (userDocData.dob) {
      dobInput.value = userDocData.dob;
      dobInput.disabled = true;
      dobLocked = true;

      if (dobHint) {
        dobHint.textContent = 'Locked - Date of birth cannot be changed';
        dobHint.classList.remove('dob-hint--warning');
        dobHint.classList.add('dob-hint--locked');
      }

      dobInput.classList.add('dob-input--locked', 'dob-input--has-value');
    } else {
      dobInput.value = '';
      dobInput.disabled = false;
      dobLocked = false;

      if (dobHint) {
        dobHint.textContent = 'You can set your date of birth only once';
        dobHint.classList.remove('dob-hint--locked');
        dobHint.classList.add('dob-hint--warning');
      }

      dobInput.classList.remove('dob-input--locked', 'dob-input--has-value');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showMessage('Failed to load profile: ' + error.message, true);
  }
}

async function saveProfile(e) {
  e.preventDefault();

  if (!currentUser) {
    redirectToLogin();
    return;
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updateData = {
      username: usernameInput.value.trim(),
      major: majorInput.value.trim() || null,
      university: universityInput.value.trim() || null,
      country: countryInput.value.trim() || null,
      userType: userTypeInput.value.trim() || null,
      stage: stageInput.value.trim() || null,
      updatedAt: new Date().toISOString()
    };

    if (!dobLocked && dobInput.value) {
      const confirmed = confirm('Date of birth cannot be changed later. Continue?');
      if (!confirmed) return;
      updateData.dob = dobInput.value;
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === null || updateData[key] === '') delete updateData[key];
    });

    await updateDoc(userDocRef, updateData);

    userDocData = { ...userDocData, ...updateData };

    if (updateData.dob) {
      dobInput.disabled = true;
      dobLocked = true;

      if (dobHint) {
        dobHint.textContent = 'Locked - Date of birth cannot be changed';
        dobHint.classList.remove('dob-hint--warning');
        dobHint.classList.add('dob-hint--locked');
      }

      dobInput.classList.add('dob-input--locked', 'dob-input--has-value');
    }

    profileFullname.textContent = updateData.username || currentUser.email?.split('@')[0] || '—';
    showMessage('Profile updated successfully!');
  } catch (error) {
    console.error('Error saving profile:', error);
    showMessage('Failed to save profile: ' + error.message, true);
  }
}

async function updatePasswordHandler(e) {
  e.preventDefault();

  if (!currentUser) {
    redirectToLogin();
    return;
  }

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword.length < 8) {
    showMessage('New password must be at least 8 characters long', true);
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage('New password and confirmation do not match', true);
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);

    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';

    showMessage('Password updated successfully!');
  } catch (error) {
    console.error('Error updating password:', error);

    if (error.code === 'auth/wrong-password') {
      showMessage('Current password is incorrect', true);
      return;
    }
    if (error.code === 'auth/weak-password') {
      showMessage('New password is too weak', true);
      return;
    }

    showMessage('Failed to update password: ' + error.message, true);
  }
}

async function deleteAccount() {
  if (!currentUser) {
    redirectToLogin();
    return;
  }

  const confirmed = confirm('This will permanently delete your account. Continue?');
  if (!confirmed) return;

  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    await deleteDoc(userDocRef);

    try {
      await deleteUser(currentUser);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        showMessage('Please log out and log back in, then try deleting your account again.', true);
        return;
      }
      throw error;
    }

    const loginPath = typeof getPath === 'function' ? getPath('login') : '/login.html';
    window.location.href = loginPath;
  } catch (error) {
    console.error('Error deleting account:', error);
    showMessage('Failed to delete account: ' + error.message, true);
  }
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeUIElements();
    initializeFirebase();
  });
} else {
  initializeUIElements();
  initializeFirebase();
}
