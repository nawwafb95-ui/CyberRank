// public/js/main.js

// Controls navigation button states based on user login status
window.updateNavigationState = function () {
  const loggedIn = typeof isLoggedIn === "function" ? isLoggedIn() : false;

  const loginBtn = document.getElementById("nav-login");
  const signupBtn = document.getElementById("nav-signup");
  const logoutBtn = document.getElementById("nav-logout");
  const userInfoDropdown = document.getElementById("user-info-dropdown");

  if (loggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (userInfoDropdown) userInfoDropdown.style.display = "";
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (signupBtn) signupBtn.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userInfoDropdown) userInfoDropdown.style.display = "none";
  }

  // Also update side menu if on home page
  if (window.updateSideMenuState) {
    window.updateSideMenuState();
  }
};

// Updates side menu state on home page
window.updateSideMenuState = function () {
  const loggedIn = typeof isLoggedIn === "function" ? isLoggedIn() : false;

  const sideLogin = document.getElementById("side-login");
  const sideSignup = document.getElementById("side-signup");
  const sideLogout = document.getElementById("side-logout");
  const sideUserInfo = document.getElementById("side-user-info");

  if (loggedIn) {
    if (sideLogin) sideLogin.style.display = "none";
    if (sideSignup) sideSignup.style.display = "none";
    if (sideLogout) sideLogout.style.display = "block";
    if (sideUserInfo) sideUserInfo.style.display = "block";
  } else {
    if (sideLogin) sideLogin.style.display = "block";
    if (sideSignup) sideSignup.style.display = "block";
    if (sideLogout) sideLogout.style.display = "none";
    if (sideUserInfo) sideUserInfo.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize navigation if available
  if (window.initThemeControls) window.initThemeControls();
  if (window.initTopNav) window.initTopNav();

  // Password toggles
  try {
    document.querySelectorAll(".pw-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = targetId
          ? document.getElementById(targetId)
          : btn.previousElementSibling;
        if (input && input.tagName === "INPUT") {
          const isPassword = input.getAttribute("type") === "password";
          input.setAttribute("type", isPassword ? "text" : "password");
          btn.textContent = isPassword ? "🙈" : "👁️";
          btn.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
          );
        }
      });
    });
  } catch {}

  // Toggle visibility buttons (for signup/login pages)
  try {
    document.querySelectorAll(".toggle-visibility").forEach((btn) => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId) return;
      const input = document.getElementById(targetId);
      if (!input) return;

      // Initial state: eye icon
      btn.textContent = "👁️";
      btn.setAttribute("aria-label", "Show password");

      btn.addEventListener("click", () => {
        const isPassword = input.type === "password";

        if (isPassword) {
          input.type = "text";
          btn.textContent = "🙈";
          btn.setAttribute("aria-label", "Hide password");
        } else {
          input.type = "password";
          btn.textContent = "👁️";
          btn.setAttribute("aria-label", "Show password");
        }
      });
    });
  } catch {}

  // Logout button handler - ONLY for nav-logout (not nav-login which is handled by navAuth.js)
  const logoutBtn = document.getElementById("nav-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (logoutBtn.disabled) return;
      logoutBtn.disabled = true;
      
      try {
        // REFACTORED: Use Firebase signOut only - removed localStorage clearing
        // Firebase Auth manages session state, no need to clear localStorage
        if (typeof logout === "function") {
          await logout();
        } else if (window.auth) {
          // Firebase Auth fallback
          if (typeof signOut === "function") {
            await signOut(window.auth);
          } else if (typeof window.auth.signOut === "function") {
            await window.auth.signOut();
          }
        }
      } catch (err) {
        console.error("Logout error:", err);
        logoutBtn.disabled = false;
        return;
      }

      // After logout
      const loginPath = typeof getPath === 'function' ? getPath('login') : '/login';
      window.location.href = loginPath;

      // Update button states
      if (typeof window.updateNavigationState === "function") {
        window.updateNavigationState();
      }
    });
  }

  // Side menu handlers (for home page)
  const sideLogin = document.getElementById("side-login");
  const sideSignup = document.getElementById("side-signup");
  const sideLogout = document.getElementById("side-logout");

  if (sideLogin) {
    sideLogin.addEventListener("click", () => {
      const loginPath = typeof getPath === 'function' ? getPath('login') : '/login';
      window.location.href = loginPath;
    });
  }

  if (sideSignup) {
    sideSignup.addEventListener("click", () => {
      if (typeof go === "function") {
        const signupPath = typeof getPath === 'function' ? getPath('signup') : '/signup';
        window.location.href = signupPath;
      }
    });
  }

  if (sideLogout) {
    sideLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (sideLogout.disabled) return;
      sideLogout.disabled = true;
      
      try {
        // REFACTORED: Use Firebase signOut only - removed localStorage clearing
        // Firebase Auth manages session state, no need to clear localStorage
        if (typeof logout === "function") {
          await logout();
        } else if (window.auth) {
          if (typeof signOut === "function") {
            await signOut(window.auth);
          } else if (typeof window.auth.signOut === "function") {
            await window.auth.signOut();
          }
        }
      } catch (err) {
        console.error("Logout error:", err);
        sideLogout.disabled = false;
        return;
      }

      const homePath = typeof getPath === 'function' ? getPath('home') : '/';
      window.location.href = homePath;

      if (typeof window.updateNavigationState === "function") {
        window.updateNavigationState();
      }
    });
  }


  // Update button states on page load
  if (typeof window.updateNavigationState === "function") {
    window.updateNavigationState();
  }

  // Portal click handler - Sound + Shake + 3D Zoom sequence
  const door = document.getElementById('challengeDoor');
  const lightSpot = document.getElementById('doorLightSpot');
  const doorScene = document.getElementById('doorScene');
  const energyRift = document.getElementById('energyRift');
  const portalSound = document.getElementById('portalSound');
  
  if (door) {
    door.addEventListener('click', () => {
      // Prevent multiple clicks during animation
      if (door.classList.contains('door-animating')) {
        return;
      }

      // Mark as animating to prevent multiple triggers
      door.classList.add('door-animating');

      // ========================================
      // SEQUENCE 1: Play Sound Effect
      // ========================================
      if (portalSound) {
        portalSound.currentTime = 0;
        portalSound.play().catch(err => {
          // Silently handle autoplay restrictions
          console.debug('Audio play prevented:', err);
        });
      }

      // ========================================
      // SEQUENCE 2: Energy Shake (0.3s)
      // ========================================
      if (energyRift) {
        energyRift.classList.add('rift-shake');
        // Remove shake class after animation completes
        setTimeout(() => {
          energyRift.classList.remove('rift-shake');
        }, 300);
      }

      // ========================================
      // SEQUENCE 3: Start 3D Zoom-In + Rift Expansion
      // ========================================
      if (doorScene) {
        doorScene.classList.add('scene-zooming');
      }

      // ========================================
      // SEQUENCE 4: Intensify Light Spill
      // ========================================
      if (lightSpot) {
        lightSpot.classList.add('intense');
      }

      // ========================================
      // SEQUENCE 5: Fade Screen
      // ========================================
      document.body.classList.add('door-animating');

      // ========================================
      // SEQUENCE 6: Redirect after animation completes
      // ========================================
      setTimeout(() => {
        const challengesPath = typeof getPath === 'function' ? getPath('challenges') : '/challenges';
        window.location.href = challengesPath;
      }, 1100); // Match animation duration (1.1s)
    });
  }
});
