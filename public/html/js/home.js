// public/js/home.js
document.addEventListener('DOMContentLoaded', () => {
  // New hero CTA button
  const challengesBtn = document.getElementById('enterChallengesBtn');
  // Legacy portal/door buttons (for backward compatibility)
  const portalCard = document.getElementById('enterChallengesPortal') || document.getElementById('enter-door');
  const scene = document.querySelector('.door-scene');
  let buttonClicked = false;

  // Navigation function
  const navigateToChallenges = () => {
    if (buttonClicked) return;
    buttonClicked = true;

    // Navigate to challenges page
    window.location.href = '/challenges.html';
  };

  // Handle new hero CTA button
  if (challengesBtn) {
    // Click handler
    challengesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateToChallenges();
    });

    // Keyboard accessibility (Enter/Space)
    challengesBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        navigateToChallenges();
      }
    });
  }

  // Legacy portal card handler (for backward compatibility)
  if (portalCard) {
    // Click handler
    portalCard.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateToChallenges();
    });

    // Keyboard accessibility (Enter/Space)
    portalCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        navigateToChallenges();
      }
    });
  }

  // Fallback for old door ID if it exists
  const doorBtn = document.getElementById('challengeDoor');
  if (doorBtn && !portalCard && !challengesBtn) {
    doorBtn.addEventListener('click', () => {
      if (doorBtn.classList.contains('door-animating')) return;
      doorBtn.classList.add('door-animating');
      navigateToChallenges();
    });
  }

  // Side menu toggle
  const sideMenu = document.getElementById('cyber-side-menu');
  const sideDot = document.getElementById('cyber-side-dot');
  
  if (sideDot && sideMenu) {
    sideDot.addEventListener('click', (e) => {
      e.stopPropagation();
      sideMenu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sideMenu.contains(e.target)) {
        sideMenu.classList.remove('open');
      }
    });
  }

  // Update side menu navigation state
  if (window.updateSideMenuState) {
    window.updateSideMenuState();
  }

  // Leaderboard button (if exists)
  const leaderboardBtn = document.getElementById("leaderboard-btn");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      window.location.href = "/leaderboard.html";
    });
  }
});
