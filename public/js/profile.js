// public/js/profile.js
import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';

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

// Debug log
console.log('[profile] location:', window.location.href);

// Initialize Firebase - reuse existing app/auth if available, or wait for it
let app, auth, db;

async function initializeFirebase() {
  // Wait up to 1 second for window.auth to be available (from navAuth.js)
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!window.auth && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.firebaseApp && window.auth) {
    // Reuse existing Firebase instances from navAuth.js
    console.log('[profile] Reusing existing Firebase instances');
    app = window.firebaseApp;
    auth = window.auth;
    db = getFirestore(app);
  } else {
    // Initialize new instances if not available
    console.log('[profile] Initializing new Firebase instances');
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Export for potential reuse
    window.firebaseApp = app;
    window.auth = auth;
  }
  
  console.log('[profile] auth.currentUser:', auth.currentUser);
  
  // Now initialize auth state listener
  initializeAuthListener();
}

// UI Elements (will be initialized after DOM is ready)
let profileForm, passwordForm, deleteAccountBtn, profileMsg;
let profileFullname, profileEmailDisplay;
let usernameInput, emailInput, dobInput, majorInput, universityInput;
let countryInput, userTypeInput, stageInput, dobHint;
let currentPasswordInput, newPasswordInput, confirmPasswordInput;

let currentUser = null;
let userDocData = null;
let dobLocked = false;

// Initialize UI elements
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
  
  // Set up event listeners
  if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
  }
  
  if (passwordForm) {
    passwordForm.addEventListener('submit', updatePasswordHandler);
  }
  
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', deleteAccount);
  }
}

// Initialize auth listener
function initializeAuthListener() {

// Show message helper
function showMessage(message, isError = false) {
  if (!profileMsg) return;
  profileMsg.textContent = message;
  profileMsg.style.color = isError ? '#f97373' : '#10b981';
  profileMsg.style.padding = '12px';
  profileMsg.style.borderRadius = '8px';
  profileMsg.style.background = isError 
    ? 'rgba(249, 115, 115, 0.1)' 
    : 'rgba(16, 185, 129, 0.1)';
  profileMsg.style.border = `1px solid ${isError ? 'rgba(249, 115, 115, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`;
  profileMsg.style.display = 'block';
  
  // Clear message after 5 seconds
  setTimeout(() => {
    if (profileMsg) {
      profileMsg.textContent = '';
      profileMsg.style.display = 'none';
    }
  }, 5000);
}

// Load user profile from Firestore
async function loadProfile() {
  if (!currentUser) {
    window.location.href = './login.html';
    return;
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      userDocData = userDocSnap.data();
    } else {
      // Create document if it doesn't exist
      userDocData = {};
      await setDoc(userDocRef, {
        username: currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        createdAt: new Date().toISOString()
      });
      userDocData = (await getDoc(userDocRef)).data();
    }

    // Populate form fields
    usernameInput.value = userDocData.username || '';
    emailInput.value = currentUser.email || '';
    profileEmailDisplay.textContent = currentUser.email || '—';
    profileFullname.textContent = userDocData.username || currentUser.email?.split('@')[0] || '—';
    
    majorInput.value = userDocData.major || '';
    universityInput.value = userDocData.university || '';
    countryInput.value = userDocData.country || '';
    userTypeInput.value = userDocData.userType || '';
    stageInput.value = userDocData.stage || userDocData.stageLevel || '';

    // Handle DOB
    if (userDocData.dob) {
      dobInput.value = userDocData.dob;
      dobInput.disabled = true;
      dobLocked = true;
      dobHint.textContent = 'Locked - Date of birth cannot be changed';
      dobHint.style.color = '#94a3b8';
      dobInput.style.background = 'var(--surface, #1e293b)';
      dobInput.style.opacity = '0.7';
      dobInput.style.cursor = 'not-allowed';
    } else {
      dobInput.disabled = false;
      dobLocked = false;
      dobHint.textContent = 'You can set your date of birth only once';
      dobHint.style.color = '#fbbf24';
      dobInput.style.background = '#1e293b';
      dobInput.style.opacity = '1';
      dobInput.style.cursor = 'text';
    }

  } catch (error) {
    console.error('Error loading profile:', error);
    showMessage('Failed to load profile: ' + error.message, true);
  }
}

// Save profile
async function saveProfile(e) {
  e.preventDefault();

  if (!currentUser) {
    window.location.href = './login.html';
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

    // Handle DOB - only if not locked and user entered a value
    if (!dobLocked && dobInput.value) {
      const confirmed = confirm('Date of birth cannot be changed later. Continue?');
      if (confirmed) {
        updateData.dob = dobInput.value;
      } else {
        return; // User cancelled
      }
    }
    // If dob is locked, don't include it in update

    // Remove null/empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === '') {
        delete updateData[key];
      }
    });

    await updateDoc(userDocRef, updateData);

    // Update local data
    userDocData = { ...userDocData, ...updateData };
    
    // Update DOB lock status if we just saved it
    if (updateData.dob) {
      dobInput.disabled = true;
      dobLocked = true;
      dobHint.textContent = 'Locked - Date of birth cannot be changed';
      dobHint.style.color = '#94a3b8';
      dobInput.style.background = 'var(--surface, #1e293b)';
      dobInput.style.opacity = '0.7';
      dobInput.style.cursor = 'not-allowed';
    }

    // Update display name
    profileFullname.textContent = updateData.username || currentUser.email?.split('@')[0] || '—';

    showMessage('Profile updated successfully!');
  } catch (error) {
    console.error('Error saving profile:', error);
    showMessage('Failed to save profile: ' + error.message, true);
  }
}

// Update password
async function updatePasswordHandler(e) {
  e.preventDefault();

  if (!currentUser) {
    window.location.href = './login.html';
    return;
  }

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validation
  if (newPassword.length < 8) {
    showMessage('New password must be at least 8 characters long', true);
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage('New password and confirmation do not match', true);
    return;
  }

  try {
    // Reauthenticate
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await updatePassword(currentUser, newPassword);

    // Clear form
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';

    showMessage('Password updated successfully!');
  } catch (error) {
    console.error('Error updating password:', error);
    let errorMsg = 'Failed to update password: ';
    
    if (error.code === 'auth/wrong-password') {
      errorMsg = 'Current password is incorrect';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'New password is too weak';
    } else {
      errorMsg += error.message;
    }
    
    showMessage(errorMsg, true);
  }
}

// Delete account
async function deleteAccount() {
  if (!currentUser) {
    window.location.href = './login.html';
    return;
  }

  const confirmed = confirm('This will permanently delete your account. Continue?');
  if (!confirmed) {
    return;
  }

  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Delete Firestore document first
    await deleteDoc(userDocRef);

    // Delete Firebase Auth user
    // Note: deleteUser may require recent authentication
    try {
      await deleteUser(currentUser);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        showMessage('Please log out and log back in, then try deleting your account again.', true);
        return;
      }
      throw error;
    }

    // Redirect to login
    window.location.href = './login.html';
  } catch (error) {
    console.error('Error deleting account:', error);
    showMessage('Failed to delete account: ' + error.message, true);
  }
}

  // Wait for auth state with proper hydration delay
  let authStateResolved = false;
  let authCheckTimeout = null;

  // Show loading state
  if (profileMsg) {
    profileMsg.textContent = 'Loading...';
    profileMsg.style.color = 'var(--text, #e5e7eb)';
    profileMsg.style.padding = '12px';
    profileMsg.style.borderRadius = '8px';
    profileMsg.style.background = 'var(--surface, #1e293b)';
    profileMsg.style.border = '1px solid var(--border, rgba(148, 163, 184, 0.4))';
    profileMsg.style.display = 'block';
  }

  onAuthStateChanged(auth, (user) => {
    console.log('[profile] onAuthStateChanged user:', user ? 'authenticated' : 'null');
    
    if (user) {
      // User is authenticated
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
        authCheckTimeout = null;
      }
      authStateResolved = true;
      currentUser = user;
      // Clear loading message
      if (profileMsg) {
        profileMsg.textContent = '';
        profileMsg.style.display = 'none';
      }
      loadProfile();
    } else {
      // User is null - wait for auth hydration before redirecting
      if (!authStateResolved) {
        // First time seeing null - wait for potential hydration
        authCheckTimeout = setTimeout(() => {
          // Re-check after delay
          const currentUserCheck = auth.currentUser;
          console.log('[profile] After 800ms delay, auth.currentUser:', currentUserCheck ? 'authenticated' : 'null');
          
          if (!currentUserCheck) {
            // Still no user after delay - redirect to login
            authStateResolved = true;
            console.log('[profile] No user found, redirecting to login');
            window.location.href = './login.html';
          } else {
            // User found during delay - continue normally
            authStateResolved = true;
            currentUser = currentUserCheck;
            if (profileMsg) {
              profileMsg.textContent = '';
              profileMsg.style.display = 'none';
            }
            loadProfile();
          }
        }, 800); // Wait 800ms for auth hydration
      } else {
        // Already resolved, user logged out - redirect immediately
        console.log('[profile] User logged out, redirecting to login');
        window.location.href = './login.html';
      }
    }
  });
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeUIElements();
    initializeFirebase();
  });
} else {
  // DOM already ready
  initializeUIElements();
  initializeFirebase();
}
