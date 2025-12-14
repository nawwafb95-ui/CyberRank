// public/js/home.js
document.addEventListener('DOMContentLoaded', () => {
  const portalCard = document.getElementById('enter-door');
  const scene = document.querySelector('.door-scene');
  let doorClicked = false;

  if (portalCard && scene) {
    portalCard.addEventListener('click', () => {
      if (doorClicked) return;
      doorClicked = true;

      scene.classList.add('scene-zooming');
      document.body.classList.add('door-animating');
      portalCard.classList.add('door-animating');

      setTimeout(() => {
        window.location.href = './html/challenges.html';
      }, 1150);
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
