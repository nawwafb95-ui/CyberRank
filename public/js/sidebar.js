// public/js/sidebar.js
// Lightweight sidebar toggle and logout handler

(function() {
  'use strict';

  // Safe Firestore imports - try window.db first, then dynamic import
  let db = null;
  let auth = null;
  let doc = null;
  let getDoc = null;

  // Try to get db/auth from window (if firebaseInit.js already loaded)
  if (window.db) {
    db = window.db;
  }
  if (window.auth) {
    auth = window.auth;
  }

  // Dynamically import Firestore functions if not available
  let onSnapshot = null;
  (async function() {
    try {
      // Import Firestore functions from CDN
      const firestoreModule = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js');
      doc = firestoreModule.doc;
      getDoc = firestoreModule.getDoc;
      onSnapshot = firestoreModule.onSnapshot;

      // If db not available from window, try importing from firebaseInit
      if (!db) {
        try {
          const firebaseInit = await import('/js/firebaseInit.js');
          db = firebaseInit.db || window.db;
          auth = firebaseInit.auth || window.auth;
        } catch (e) {
          // Fallback to window if import fails
          db = window.db;
          auth = window.auth;
        }
      }
    } catch (e) {
      // Silently fail - sidebar will work without Firestore integration
      console.warn('Firestore not available for sidebar:', e.message);
    }
  })();

  // Wait for sidebar to be injected (if using sidebar-inject.js)
  function initSidebar() {
    const sidebar = document.getElementById('socxSidebar');
    const dotButton = document.getElementById('cyber-side-dot');
    
    if (!sidebar || !dotButton) {
      // Retry after a short delay if elements not found (in case injection is delayed)
      if (document.readyState === 'loading') {
        setTimeout(initSidebar, 50);
      } else {
        console.warn('Sidebar elements not found');
      }
      return;
    }
    
    // Initialize sidebar functionality
    initSidebarBehavior(sidebar, dotButton);
  }

  function initSidebarBehavior(sidebar, dotButton) {
    // Toggle sidebar open/closed
    function toggleSidebar() {
      const isOpen = document.body.classList.toggle('sidebar-open');
      dotButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    // Close sidebar
    function closeSidebar() {
      document.body.classList.remove('sidebar-open');
      dotButton.setAttribute('aria-expanded', 'false');
    }

    // Initialize aria-expanded
    dotButton.setAttribute('aria-expanded', 'false');

    // Toggle on dot button click
    dotButton.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebar();
    });

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
        closeSidebar();
      }
    });

    // Close when clicking outside (on overlay)
    document.addEventListener('click', function(e) {
      if (document.body.classList.contains('sidebar-open')) {
        // If clicking outside sidebar and not on the dot button
        if (!sidebar.contains(e.target) && !dotButton.contains(e.target)) {
          closeSidebar();
        }
      }
    });

    // Prevent sidebar clicks from closing it
    sidebar.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Check authentication status
    function checkAuthState() {
      // REFACTORED: Use Firebase Auth only - removed localStorage fallback
      // Firebase Auth is the single source of truth
      if (typeof window.isLoggedIn === 'function') {
        return window.isLoggedIn();
      } else if (window.__authUser) {
        return true;
      } else if (window.auth && window.auth.currentUser) {
        return true;
      }
      return false;
    }

    // Update logout/login/signup button visibility
    function updateAuthButtons(isLoggedIn) {
      const logoutBtn = document.getElementById('socxLogoutBtn');
      const loginBtn = document.getElementById('socxLoginBtn');
      const signupBtn = document.getElementById('socxSignupBtn');
      
      if (!logoutBtn || !loginBtn || !signupBtn) return;

      if (isLoggedIn) {
        logoutBtn.style.display = 'block';
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
      } else {
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
      }
    }

    // Logout handler
    const logoutBtn = document.getElementById('socxLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (logoutBtn.disabled) return;
        logoutBtn.disabled = true;

        try {
          // Unsubscribe from stats listener on logout
          if (statsListenerUnsubscribe) {
            statsListenerUnsubscribe();
            statsListenerUnsubscribe = null;
          }
          
          // REFACTORED: Use Firebase signOut only - removed localStorage clearing
          // Firebase Auth manages session state, no need to clear localStorage
          if (window.auth) {
            // Import signOut if available
            if (typeof signOut === 'function') {
              await signOut(window.auth);
            } else if (typeof window.auth.signOut === 'function') {
              await window.auth.signOut();
            }
          }

          // Update buttons after logout (show Login and Sign Up, hide Logout)
          updateAuthButtons(false);
          logoutBtn.disabled = false;

          // Update sidebar content to reflect logged out state
          updateSidebarContent();
        } catch (err) {
          console.error('Logout error:', err);
          logoutBtn.disabled = false;
        }
      });
    }

    // Track if stats listener is already set up
    let statsListenerUnsubscribe = null;

    // Update sidebar content with user profile data
    function updateSidebarContent() {
      // Update username
      const nameEl = document.getElementById('socxSidebarName');
      if (nameEl) {
        let displayName = 'Guest';
        
        // Try to get profile from core.js
        if (typeof window.getProfile === 'function') {
          const profile = window.getProfile();
          if (profile) {
            displayName = profile.fullName || profile.username || profile.email?.split('@')[0] || 'Guest';
          }
        }
        
        // REFACTORED: Use Firebase auth only - removed localStorage fallback
        const user = window.__authUser || (window.auth && window.auth.currentUser);
        if (displayName === 'Guest' && user) {
          displayName = user.displayName || user.email?.split('@')[0] || 'Guest';
        }
        
        nameEl.textContent = displayName;
      }

      // Update avatar
      const avatarEl = document.getElementById('socxSidebarAvatar');
      if (avatarEl) {
        let avatarSrc = '/images/default-avatar.jpeg';
        
        if (typeof window.getProfile === 'function') {
          const profile = window.getProfile();
          if (profile && profile.photo) {
            avatarSrc = profile.photo;
          }
        }
        
        // Fallback: check Firebase auth
        const user = window.__authUser || (window.auth && window.auth.currentUser);
        if (avatarSrc === '/images/default-avatar.jpeg' && user) {
          if (user.photoURL) {
            avatarSrc = user.photoURL;
          }
        }
        
        avatarEl.src = avatarSrc;
      }

      // Update points, level, and progress from Firestore userStats (realtime)
      const pointsEl = document.getElementById('socxSidebarPoints');
      const progressFill = document.querySelector('.socx-progress-fill');
      const levelLabel = document.querySelector('.socx-level-label');
      
      const valueEl = pointsEl?.querySelector('.socx-stat-value');
      
      // Get current user
      const user = window.__authUser || (auth && auth.currentUser);
      
      if (user && db && doc && onSnapshot) {
        try {
          // Unsubscribe from previous listener if it exists
          if (statsListenerUnsubscribe) {
            statsListenerUnsubscribe();
            statsListenerUnsubscribe = null;
          }
          
          const userStatsRef = doc(db, 'userStats', user.uid);
          
          // Set up realtime listener for userStats
          statsListenerUnsubscribe = onSnapshot(userStatsRef, (snap) => {
            try {
              let points = 0;
              
              if (snap.exists()) {
                const data = snap.data();
                points = data.points ?? 0;
              }
              
              // Calculate level: floor(points / 100) + 1
              const level = Math.floor(points / 100) + 1;
              
              // Calculate progress percentage: (points % 100) / 100
              const progressPercent = (points % 100) / 100;
              const progressPercentDisplay = Math.max(0, Math.min(100, progressPercent * 100));
              
              // Update points display
              if (valueEl) {
                valueEl.textContent = points.toString();
              }
              
              // Update level display
              if (levelLabel) {
                levelLabel.textContent = `Level ${level}`;
              }
              
              // Update progress bar width
              if (progressFill) {
                progressFill.style.width = `${progressPercentDisplay}%`;
              }
            } catch (e) {
              console.warn('[sidebar] Error processing userStats snapshot:', e);
              // Fallback to defaults on error
              if (valueEl) valueEl.textContent = '0';
              if (levelLabel) levelLabel.textContent = 'Level 1';
              if (progressFill) progressFill.style.width = '0%';
            }
          }, (error) => {
            // Snapshot error handler
            console.warn('[sidebar] Failed to listen to userStats:', error);
            // Fallback to defaults
            if (valueEl) valueEl.textContent = '0';
            if (levelLabel) levelLabel.textContent = 'Level 1';
            if (progressFill) progressFill.style.width = '0%';
          });
        } catch (e) {
          console.warn('[sidebar] Failed to set up userStats listener:', e);
          // Fallback to defaults
          if (valueEl) valueEl.textContent = '0';
          if (levelLabel) levelLabel.textContent = 'Level 1';
          if (progressFill) progressFill.style.width = '0%';
        }
      } else {
        // Not logged in or Firestore not available - show defaults
        if (valueEl) valueEl.textContent = '0';
        if (levelLabel) levelLabel.textContent = 'Level 1';
        if (progressFill) progressFill.style.width = '0%';
      }
    }

    // Load saved theme from localStorage (called immediately)
    function loadTheme() {
      try {
        const savedTheme = localStorage.getItem('socx_theme');
        if (savedTheme === 'light' || savedTheme === 'night') {
          document.body.setAttribute('data-theme', savedTheme);
        } else {
          // Default to night if no saved theme
          document.body.setAttribute('data-theme', 'night');
        }
      } catch (e) {
        console.warn('Error loading theme:', e);
        document.body.setAttribute('data-theme', 'night');
      }
    }

    // Save theme to localStorage
    function saveTheme(theme) {
      try {
        localStorage.setItem('socx_theme', theme);
      } catch (e) {
        console.warn('Error saving theme:', e);
      }
    }

    // Theme toggle handler
    function initThemeToggle() {
      const themeToggle = document.getElementById('themeToggle');
      if (!themeToggle) return;

      // Sync toggle state with current theme
      const currentTheme = document.body.getAttribute('data-theme') || 'night';
      themeToggle.checked = currentTheme === 'light';

      // Handle toggle change
      themeToggle.addEventListener('change', function(e) {
        const newTheme = e.target.checked ? 'light' : 'night';
        document.body.setAttribute('data-theme', newTheme);
        saveTheme(newTheme);
      });
    }

    // Load theme immediately (before DOMContentLoaded)
    loadTheme();

    // Initialize theme toggle when DOM is ready
    initThemeToggle();

    // Update sidebar content on load
    updateSidebarContent();
    const isAuthenticated = checkAuthState();
    updateAuthButtons(isAuthenticated);

    // Update sidebar content periodically (in case auth state changes)
    // Also listen for custom events if other scripts fire them
    window.addEventListener('authstatechange', function() {
      updateSidebarContent();
      const isAuthenticated = checkAuthState();
      updateAuthButtons(isAuthenticated);
    });
    
    // Poll for auth state changes (as fallback)
    let lastAuthState = null;
    setInterval(function() {
      const currentAuthState = checkAuthState();
      if (currentAuthState !== lastAuthState) {
        lastAuthState = currentAuthState;
        updateSidebarContent();
        updateAuthButtons(currentAuthState);
      }
    }, 1000);
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    // If DOM already loaded, wait a tick for injection script
    setTimeout(initSidebar, 0);
  }

})();
