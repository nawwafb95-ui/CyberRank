// public/js/profile.js
// Profile page - uses Firebase Auth from firebaseInit.js

import { app, auth, waitForAuthReady } from './firebaseInit.js';
import {
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
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const db = getFirestore(app);

// Constants
const DEFAULT_AVATAR = '../images/default-avatar.jpeg';

// UI Elements
let profileForm, passwordForm, deleteAccountBtn, profileMsg;
let profileFullname, profileEmailDisplay;
let profileAvatarImg;
let usernameInput, emailInput, dobInput, majorInput, universityInput;
let countryInput, userTypeInput, stageInput, dobHint;
let currentPasswordInput, newPasswordInput, confirmPasswordInput;
let pointsHistoryContainer;
let editProfileBtn, cancelEditBtn;
let profileViewMode, profileEditMode;
let deleteModal, deleteConfirmBtn, deleteCancelBtn;
let editPasswordBtn, cancelPasswordBtn, updatePasswordBtn;
let passwordFormActions;

// View mode display elements
let viewUsername, viewEmail, viewDob, viewMajor, viewUniversity, viewCountry, viewUserType, viewStage;

// Stats elements
let statBestScore, statTotalPoints, statRank;

let currentUser = null;
let userDocData = null;
let dobLocked = false;
let isEditMode = false;

function initializeUIElements() {
  profileForm = document.getElementById('profile-form');
  passwordForm = document.getElementById('password-form');
  deleteAccountBtn = document.getElementById('delete-account-btn');
  profileMsg = document.getElementById('profileMsg');
  profileFullname = document.getElementById('profile-fullname');
  profileEmailDisplay = document.getElementById('profile-email-display');
  profileAvatarImg = document.getElementById('profile-avatar-img');

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
  pointsHistoryContainer = document.getElementById('points-history');

  // View/Edit mode elements
  editProfileBtn = document.getElementById('edit-profile-btn');
  cancelEditBtn = document.getElementById('cancel-edit-btn');
  profileViewMode = document.getElementById('profile-view-mode');
  profileEditMode = document.getElementById('profile-form');

  // Password edit mode elements
  editPasswordBtn = document.getElementById('edit-password-btn');
  cancelPasswordBtn = document.getElementById('cancel-password-btn');
  updatePasswordBtn = document.getElementById('update-password-btn');
  passwordFormActions = document.getElementById('password-form-actions');

  // View mode display elements
  viewUsername = document.getElementById('view-username');
  viewEmail = document.getElementById('view-email');
  viewDob = document.getElementById('view-dob');
  viewMajor = document.getElementById('view-major');
  viewUniversity = document.getElementById('view-university');
  viewCountry = document.getElementById('view-country');
  viewUserType = document.getElementById('view-usertype');
  viewStage = document.getElementById('view-stage');

  // Stats elements
  statBestScore = document.getElementById('stat-best-score');
  statTotalPoints = document.getElementById('stat-total-points');
  statRank = document.getElementById('stat-rank');

  // Modal elements
  deleteModal = document.getElementById('delete-modal');
  deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  deleteCancelBtn = document.getElementById('delete-cancel-btn');

  if (profileForm) profileForm.addEventListener('submit', saveProfile);
  if (passwordForm) passwordForm.addEventListener('submit', updatePasswordHandler);
  if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', showDeleteModal);
  if (editProfileBtn) editProfileBtn.addEventListener('click', enterEditMode);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', exitEditMode);
  if (editPasswordBtn) editPasswordBtn.addEventListener('click', enterPasswordEditMode);
  if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', exitPasswordEditMode);
  if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', deleteAccount);
  if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', hideDeleteModal);
  if (deleteModal) {
    deleteModal.querySelector('.modal__overlay')?.addEventListener('click', hideDeleteModal);
  }

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

  // Initialize password fields as disabled by default
  initializePasswordEditMode();
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
  const profilePath = typeof getPath === 'function' ? getPath('profile') : '/html/profile.html';
  const params = new URLSearchParams();
  params.set('next', profilePath);
  const loginPath = typeof getPath === 'function' ? getPath('login') : '/html/login.html';
  // loginPath is origin-relative - ensures we stay on same origin
  window.location.href = `${loginPath}?${params.toString()}`;
}

async function initializeFirebase() {
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

  // Wait for auth state to be ready (no timeout - waits for Firebase to resolve)
  const isAuthenticated = await waitForAuthReady();
  
  if (!isAuthenticated) {
    redirectToLogin();
    return;
  }
  
  // User is authenticated
  currentUser = window.__authUser;
  if (profileMsg) {
    profileMsg.textContent = '';
    profileMsg.style.display = 'none';
  }
  loadProfile();
  
  // Listen for auth state changes (logout, etc.)
  window.addEventListener('auth:state-changed', (e) => {
    if (!e.detail.user) {
      redirectToLogin();
    } else {
      currentUser = e.detail.user;
      loadProfile(); // This will also call loadPointsHistory()
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

    // Set avatar with fallback priority
    setAvatar();

    majorInput.value = userDocData.major || '';
    universityInput.value = userDocData.university || '';
    countryInput.value = userDocData.country || '';
    userTypeInput.value = userDocData.userType || '';
    stageInput.value = userDocData.stage || userDocData.stageLevel || '';

    // Update view mode display
    updateViewMode();

    // Load stats and points history
    loadUserStats();
    loadPointsHistory();

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
    userDocData = { ...userDocData, ...updateData };
    updateViewMode();
    exitEditMode();
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
    
    // Exit edit mode after successful password update
    exitPasswordEditMode();
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

function showDeleteModal() {
  if (deleteModal) {
    deleteModal.style.display = 'flex';
  }
}

function hideDeleteModal() {
  if (deleteModal) {
    deleteModal.style.display = 'none';
  }
}

async function deleteAccount() {
  if (!currentUser) {
    redirectToLogin();
    return;
  }

  hideDeleteModal();

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

    const loginPath = typeof getPath === 'function' ? getPath('login') : '/html/login.html';
    window.location.href = loginPath;
  } catch (error) {
    console.error('Error deleting account:', error);
    showMessage('Failed to delete account: ' + error.message, true);
  }
}

/**
 * Load and display points history from Firestore
 * Queries pointTransactions collection for the current user
 */
async function loadPointsHistory() {
  if (!currentUser || !pointsHistoryContainer) {
    return;
  }

  try {
    // Query pointTransactions collection
    const transactionsRef = collection(db, 'pointTransactions');
    const q = query(
      transactionsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      pointsHistoryContainer.innerHTML = `
        <div class="points-history-empty">
          <div class="points-history-empty__icon">📊</div>
          <h3 class="points-history-empty__title">No points yet</h3>
          <p class="points-history-empty__subtitle">Start your first challenge to see your history here.</p>
          <a href="${typeof getPath === 'function' ? getPath('quizzes') : '/html/quizzes.html'}" class="btn btn--primary">Start Challenge</a>
        </div>
      `;
      return;
    }

    // Build HTML for transactions
    let html = '<div class="points-history-list">';
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const delta = data.delta || 0;
      const reason = data.reason || 'N/A';
      const level = data.level;
      const createdAt = data.createdAt;

      // Format date
      let dateStr = 'N/A';
      if (createdAt) {
        try {
          // Handle both Timestamp and ISO string formats
          const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          dateStr = date.toLocaleString();
        } catch (e) {
          console.warn('Error formatting date:', e);
        }
      }

      // Format delta with + sign if positive
      const deltaFormatted = delta > 0 ? `+${delta}` : `${delta}`;
      const deltaClass = delta > 0 ? 'points-delta--positive' : 'points-delta--negative';

      html += `
        <div class="points-history-row">
          <div class="points-history-left">
            <div class="points-reason">${reason}</div>
            ${level ? `<div class="points-level">Level ${level}</div>` : ''}
          </div>
          <div class="points-history-right">
            <span class="points-delta ${deltaClass}">${deltaFormatted}</span>
            <span class="points-date">${dateStr}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';

    pointsHistoryContainer.innerHTML = html;
  } catch (error) {
    console.error('Error loading points history:', error);
    pointsHistoryContainer.innerHTML = '<p class="points-history-error">Ready to receive your points! Start your first challenge now.</p>';
    
    // Check if it's an index error
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index may be required. Create a composite index for pointTransactions: userId (ASC), createdAt (DESC)');
    }
  }
}

/**
 * Set profile avatar with fallback priority:
 * 1. Firestore user doc photo/avatar field
 * 2. Firebase auth user photoURL
 * 3. Default avatar
 */
function setAvatar() {
  if (!profileAvatarImg) return;

  let avatarUrl = null;

  // Priority 1: Firestore user doc photo/avatar field
  if (userDocData?.photo || userDocData?.avatar) {
    avatarUrl = userDocData.photo || userDocData.avatar;
  }
  // Priority 2: Firebase auth user photoURL
  else if (currentUser?.photoURL) {
    avatarUrl = currentUser.photoURL;
  }
  // Priority 3: Default avatar fallback
  else {
    avatarUrl = DEFAULT_AVATAR;
  }

  // Set the image source
  profileAvatarImg.src = avatarUrl || DEFAULT_AVATAR;
  profileAvatarImg.style.display = 'block';
  
  // Hide SVG fallback when image is set
  const svgFallback = profileAvatarImg.parentElement?.querySelector('.profile-avatar__fallback');
  if (svgFallback) svgFallback.style.display = 'none';

  // Add error handler to fallback to default if image fails to load
  profileAvatarImg.onerror = function() {
    // If current src is already default, show SVG fallback to prevent infinite loop
    if (this.src.includes('default-avatar.jpeg')) {
      this.style.display = 'none';
      if (svgFallback) svgFallback.style.display = 'block';
      this.onerror = null; // Prevent infinite loop
      return;
    }
    // Fallback to default avatar
    this.src = DEFAULT_AVATAR;
  };
}

// View/Edit Mode Functions
function enterEditMode() {
  isEditMode = true;
  if (profileViewMode) profileViewMode.style.display = 'none';
  if (profileEditMode) profileEditMode.style.display = 'block';
  if (editProfileBtn) {
    editProfileBtn.textContent = 'Editing...';
    editProfileBtn.disabled = true;
  }
}

function exitEditMode() {
  isEditMode = false;
  if (profileViewMode) profileViewMode.style.display = 'block';
  if (profileEditMode) profileEditMode.style.display = 'none';
  if (editProfileBtn) {
    editProfileBtn.textContent = 'Edit Profile';
    editProfileBtn.disabled = false;
  }
  // Reset form values from userDocData
  if (userDocData) {
    usernameInput.value = userDocData.username || '';
    majorInput.value = userDocData.major || '';
    universityInput.value = userDocData.university || '';
    countryInput.value = userDocData.country || '';
    userTypeInput.value = userDocData.userType || '';
    stageInput.value = userDocData.stage || userDocData.stageLevel || '';
  }
}

function updateViewMode() {
  if (!userDocData) return;
  
  const formatValue = (val) => val || '—';
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (viewUsername) viewUsername.textContent = formatValue(userDocData.username);
  if (viewEmail) viewEmail.textContent = formatValue(currentUser?.email);
  if (viewDob) viewDob.textContent = formatDate(userDocData.dob);
  if (viewMajor) viewMajor.textContent = formatValue(userDocData.major);
  if (viewUniversity) viewUniversity.textContent = formatValue(userDocData.university);
  if (viewCountry) viewCountry.textContent = formatValue(userDocData.country);
  if (viewUserType) viewUserType.textContent = formatValue(userDocData.userType);
  if (viewStage) viewStage.textContent = formatValue(userDocData.stage || userDocData.stageLevel);
}

// Password Edit Mode Functions
function initializePasswordEditMode() {
  // Ensure password fields start as disabled
  if (currentPasswordInput) currentPasswordInput.disabled = true;
  if (newPasswordInput) newPasswordInput.disabled = true;
  if (confirmPasswordInput) confirmPasswordInput.disabled = true;
  if (updatePasswordBtn) updatePasswordBtn.disabled = true;
  if (passwordFormActions) passwordFormActions.style.display = 'none';
}

function enterPasswordEditMode() {
  // Enable password inputs
  if (currentPasswordInput) currentPasswordInput.disabled = false;
  if (newPasswordInput) newPasswordInput.disabled = false;
  if (confirmPasswordInput) confirmPasswordInput.disabled = false;
  
  // Show and enable Update Password button
  if (passwordFormActions) passwordFormActions.style.display = 'flex';
  if (updatePasswordBtn) updatePasswordBtn.disabled = false;
  
  // Hide Edit button
  if (editPasswordBtn) {
    editPasswordBtn.style.display = 'none';
  }
  
  // Focus on current password input
  if (currentPasswordInput) {
    currentPasswordInput.focus();
  }
}

function exitPasswordEditMode() {
  // Clear password inputs
  if (currentPasswordInput) currentPasswordInput.value = '';
  if (newPasswordInput) newPasswordInput.value = '';
  if (confirmPasswordInput) confirmPasswordInput.value = '';
  
  // Disable password inputs
  if (currentPasswordInput) currentPasswordInput.disabled = true;
  if (newPasswordInput) newPasswordInput.disabled = true;
  if (confirmPasswordInput) confirmPasswordInput.disabled = true;
  
  // Hide form actions and disable Update button
  if (passwordFormActions) passwordFormActions.style.display = 'none';
  if (updatePasswordBtn) updatePasswordBtn.disabled = true;
  
  // Show Edit button (remove inline style to use default)
  if (editPasswordBtn) {
    editPasswordBtn.style.display = '';
  }
  
  // Reset password fields to password type (in case they were toggled to text)
  if (currentPasswordInput) currentPasswordInput.type = 'password';
  if (newPasswordInput) newPasswordInput.type = 'password';
  if (confirmPasswordInput) confirmPasswordInput.type = 'password';
}

/**
 * Load user stats from userStats collection
 */
async function loadUserStats() {
  if (!currentUser) return;

  try {
    const userStatsRef = doc(db, 'userStats', currentUser.uid);
    const userStatsSnap = await getDoc(userStatsRef);

    let bestScore = 0;
    let totalPoints = 0;

    if (userStatsSnap.exists()) {
      const statsData = userStatsSnap.data();
      bestScore = statsData.bestScore || 0;
      totalPoints = statsData.totalScore || 0;
    }

    // Update stats display
    if (statBestScore) statBestScore.textContent = bestScore.toLocaleString();
    if (statTotalPoints) statTotalPoints.textContent = totalPoints.toLocaleString();

    // Calculate rank (simplified - would need full query for accurate rank)
    if (statRank) {
      try {
        const usersStatsRef = collection(db, 'userStats');
        const allStatsQuery = query(usersStatsRef, orderBy('totalScore', 'desc'));
        const allStatsSnap = await getDocs(allStatsQuery);
        
        let rank = 1;
        allStatsSnap.forEach((docSnap) => {
          if (docSnap.id === currentUser.uid) {
            // Found current user
            return;
          }
          const data = docSnap.data();
          if ((data.totalScore || 0) > totalPoints) {
            rank++;
          }
        });
        
        statRank.textContent = `#${rank}`;
      } catch (error) {
        console.warn('Error calculating rank:', error);
        statRank.textContent = '—';
      }
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
    if (statBestScore) statBestScore.textContent = '—';
    if (statTotalPoints) statTotalPoints.textContent = '—';
    if (statRank) statRank.textContent = '—';
  }
}

// Tabs Navigation
function initializeTabs() {
  const tabs = document.querySelectorAll('.profile-tab');
  const sections = document.querySelectorAll('.profile-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetSectionId = tab.getAttribute('data-section');
      const targetSection = document.getElementById(targetSectionId);
      
      if (targetSection) {
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Smooth scroll to section
        const tabsHeight = document.getElementById('profile-tabs')?.offsetHeight || 0;
        const offset = 100; // Account for sticky tabs
        const targetPosition = targetSection.offsetTop - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Update active tab on scroll
  function updateActiveTab() {
    const scrollPosition = window.scrollY + 150;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.id;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        tabs.forEach(tab => {
          if (tab.getAttribute('data-section') === sectionId) {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveTab);
  updateActiveTab(); // Initial check
}

// Boot
(async () => {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }
  
  initializeUIElements();
  initializeTabs();
  await initializeFirebase();
})();
