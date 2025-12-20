document.addEventListener('DOMContentLoaded', () => {
    // Flip card functionality
    document.querySelectorAll('.flip-card').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        card.classList.toggle('flipped');
      });
    });

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
  });
  