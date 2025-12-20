// public/js/home.js
document.addEventListener('DOMContentLoaded', () => {
  const portalCard = document.getElementById('enterChallengesPortal') || document.getElementById('enter-door');
  const scene = document.querySelector('.door-scene');
  let doorClicked = false;

  // Navigation function
  const navigateToChallenges = () => {
    if (doorClicked) return;
    doorClicked = true;

    // Play sound effect if available
    const portalSound = document.getElementById('portalSound');
    if (portalSound) {
      portalSound.currentTime = 0;
      portalSound.play().catch(err => {
        // Silently handle autoplay restrictions
        console.debug('Audio play prevented:', err);
      });
    }

    if (scene) {
      scene.classList.add('scene-zooming');
    }
    document.body.classList.add('door-animating');
    if (portalCard) {
      portalCard.classList.add('door-animating');
    }

    // Use absolute path for reliability
    setTimeout(() => {
      window.location.href = '/html/challenges.html';
    }, 1150);
  };

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
  if (doorBtn && !portalCard) {
    doorBtn.addEventListener('click', () => {
      if (doorBtn.classList.contains('door-animating')) return;
      doorBtn.classList.add('door-animating');
      const target = './challenges.html';
      setTimeout(() => {
        if (typeof go === 'function') {
          go(target);
        } else {
          window.location.href = target;
        }
      }, 200);
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

  // Leaderboard button
  document.getElementById("leaderboard-btn").addEventListener("click", () => {
    window.location.href = "/html/leaderboard.html";
  });
});
