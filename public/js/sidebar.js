// public/js/sidebar.js
// Lightweight sidebar toggle and logout handler

(function() {
  'use strict';

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
      let isAuthenticated = false;

      // Try to use existing auth check functions
      if (typeof window.isLoggedIn === 'function') {
        isAuthenticated = window.isLoggedIn();
      } else if (window.auth && window.auth.currentUser) {
        isAuthenticated = true;
      } else {
        // Fallback: check localStorage
        try {
          const currentUser = localStorage.getItem('currentUser');
          isAuthenticated = !!currentUser;
        } catch (e) {
          // Ignore
        }
      }

      return isAuthenticated;
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
          // Clear localStorage (matching existing logout logic)
          try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('user');
          } catch (err) {
            console.warn('Error clearing localStorage:', err);
          }

          // Sign out from Firebase if available
          if (window.auth && typeof window.auth.signOut === 'function') {
            await window.auth.signOut();
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
        
        // Fallback: check Firebase auth
        if (displayName === 'Guest' && window.auth && window.auth.currentUser) {
          const user = window.auth.currentUser;
          displayName = user.displayName || user.email?.split('@')[0] || 'Guest';
        }
        
        // Fallback: check localStorage
        if (displayName === 'Guest') {
          try {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
              displayName = currentUser.includes('@') ? currentUser.split('@')[0] : currentUser;
            }
          } catch (e) {
            // Ignore
          }
        }
        
        nameEl.textContent = displayName;
      }

      // Update avatar
      const avatarEl = document.getElementById('socxSidebarAvatar');
      if (avatarEl) {
        let avatarSrc = '../images/default-avatar.jpeg';
        
        if (typeof window.getProfile === 'function') {
          const profile = window.getProfile();
          if (profile && profile.photo) {
            avatarSrc = profile.photo;
          }
        }
        
        // Fallback: check Firebase auth
        if (avatarSrc === '../images/default-avatar.jpeg' && window.auth && window.auth.currentUser) {
          const user = window.auth.currentUser;
          if (user.photoURL) {
            avatarSrc = user.photoURL;
          }
        }
        
        avatarEl.src = avatarSrc;
      }

      // Update points (placeholder for now - can be extended later)
      const pointsEl = document.getElementById('socxSidebarPoints');
      if (pointsEl) {
        const valueEl = pointsEl.querySelector('.socx-stat-value');
        if (valueEl) {
          // Calculate points from completed levels (if needed)
          let points = 0;
          try {
            if (localStorage.getItem('socyberx_easy_completed') === 'true') points += 100;
            if (localStorage.getItem('socyberx_medium_completed') === 'true') points += 200;
            if (localStorage.getItem('socyberx_hard_completed') === 'true') points += 300;
          } catch (e) {
            // Ignore
          }
          valueEl.textContent = points || '0';
        }
      }

      // Update progress bar (placeholder)
      const progressFill = document.querySelector('.socx-progress-fill');
      if (progressFill) {
        let completed = 0;
        try {
          if (localStorage.getItem('socyberx_easy_completed') === 'true') completed++;
          if (localStorage.getItem('socyberx_medium_completed') === 'true') completed++;
          if (localStorage.getItem('socyberx_hard_completed') === 'true') completed++;
        } catch (e) {
          // Ignore
        }
        const progress = (completed / 3) * 100;
        progressFill.style.width = progress + '%';
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
