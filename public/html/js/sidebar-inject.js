// public/js/sidebar-inject.js
// Inject unified SOCyberX sidebar into all pages

(function() {
  'use strict';

  // Only inject if sidebar doesn't already exist
  if (document.getElementById('socxSidebar')) {
    return; // Sidebar already exists
  }

  // Sidebar HTML structure
  const sidebarHTML = `
    <!-- Minimal Side Menu (Cyber Side Dot) - Toggle Handle -->
    <aside class="cyber-side-menu" id="cyber-side-menu">
      <button class="cyber-side-dot" id="cyber-side-dot" type="button" aria-label="Menu">
        <span class="dot-inner" style="display: none;"></span>
        <span class="rift-core"></span>
        <span class="rift-glow"></span>
        <span class="rift-sparks"></span>
      </button>
      <div class="cyber-side-panel" id="cyber-side-panel" style="display: none;">
        <!-- Old panel hidden, kept for compatibility -->
      </div>
    </aside>

    <!-- New SOCyberX Sidebar -->
    <aside class="socx-sidebar" id="socxSidebar" aria-label="SOCyberX sidebar">
      <div class="socx-sidebar-content">
        <!-- Profile Block -->
        <div class="socx-sidebar-profile">
          <div class="socx-sidebar-avatar">
            <img id="socxSidebarAvatar" src="../../images/default-avatar.jpeg" alt="User avatar" />
          </div>
          <span class="socx-sidebar-name" id="socxSidebarName">Guest</span>
        </div>

        <!-- Points/XP Block -->
        <div class="socx-sidebar-stats">
          <div class="socx-sidebar-points" id="socxSidebarPoints">
            <span class="socx-stat-label">Points</span>
            <span class="socx-stat-value">0</span>
          </div>
        </div>

        <!-- Level/Progress Bar -->
        <div class="socx-sidebar-level">
          <div class="socx-level-label">Level 1</div>
          <div class="socx-progress-bar">
            <div class="socx-progress-fill" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="socx-sidebar-nav">
          <a href="/index.html" class="socx-nav-link">Home Page</a>
          <a href="/profile.html" class="socx-nav-link">Profile</a>
          <a href="/leaderboard.html" class="socx-nav-link">Leaderboard</a>
          <a href="/settings.html" class="socx-nav-link">Settings</a>
          <a href="/about.html" class="socx-nav-link">About</a>
        </nav>

        <!-- Theme Toggle -->
        <div class="socx-sidebar-theme">
          <label for="themeToggle" class="socx-theme-label">
            <span class="socx-theme-text">Dark / Light</span>
            <input type="checkbox" id="themeToggle" class="socx-theme-toggle" aria-label="Toggle dark/light theme" />
          </label>
        </div>

        <!-- Social Media Icons -->
        <div class="socx-social">
          <a class="socx-social__btn instagram" href="https://www.instagram.com/socyberx?igsh=NW80aDd3dnhmdnZo&utm_source=qr"
             target="_blank" rel="noopener noreferrer" aria-label="SOCyberX Instagram">
            <!-- Instagram icon (inline SVG with gradient) -->
            <svg class="socx-social__icon" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="igGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#833AB4;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#E1306C;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#FCAF45;stop-opacity:1" />
                </linearGradient>
              </defs>
              <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5ZM18 6.7a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" fill="url(#igGradient)"/>
            </svg>
          </a>

          <a class="socx-social__btn linkedin" href="https://www.linkedin.com/in/socyberx-540a8339a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
             target="_blank" rel="noopener noreferrer" aria-label="SOCyberX LinkedIn">
            <!-- LinkedIn icon (inline SVG) -->
            <svg class="socx-social__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3.5 21h3V9h-3v12Zm5.5-12h2.9v1.64h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6V21h-3v-5.5c0-1.3-.02-3-1.84-3-1.84 0-2.12 1.44-2.12 2.92V21h-3V9Z" fill="#0A66C2"/>
            </svg>
          </a>
        </div>

        <!-- Logout/Login/Sign Up Buttons -->
        <div class="socx-sidebar-footer">
          <button id="socxLogoutBtn" type="button" class="socx-btn socx-btn--logout">Logout</button>
          <a id="socxLoginBtn" href="/login.html" class="socx-btn socx-btn--login" style="display:none;">Login</a>
          <a id="socxSignupBtn" href="/signup.html" class="socx-btn socx-btn--signup" style="display:none;">Sign Up</a>
        </div>
      </div>
    </aside>
  `;

  // Inject sidebar at the beginning of body
  function injectSidebar() {
    if (document.body) {
      // Create a temporary container to parse HTML
      const temp = document.createElement('div');
      temp.innerHTML = sidebarHTML.trim();
      
      // Insert each element at the beginning of body
      while (temp.firstChild) {
        document.body.insertBefore(temp.firstChild, document.body.firstChild);
      }
    }
  }

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSidebar);
  } else {
    injectSidebar();
  }

})();

