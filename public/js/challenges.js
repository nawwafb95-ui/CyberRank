// public/js/challenges.js

document.addEventListener('DOMContentLoaded', () => {
  // localStorage keys for tracking level completion
  const STORAGE_KEYS = {
    easy: 'socyberx_easy_completed',
    medium: 'socyberx_medium_completed',
    hard: 'socyberx_hard_completed'
  };

  // Get completion status from localStorage
  function isLevelCompleted(level) {
    return localStorage.getItem(STORAGE_KEYS[level]) === 'true';
  }

  // Update UI based on completion status
  function updateLevelUI() {
    const easyCompleted = isLevelCompleted('easy');
    const mediumCompleted = isLevelCompleted('medium');
    const hardCompleted = isLevelCompleted('hard');

    // Easy is always enabled
    const easyCard = document.getElementById('level-easy');
    const easyBtn = document.getElementById('btn-easy');
    if (easyCard && easyBtn) {
      easyCard.classList.remove('level-locked');
      easyBtn.disabled = false;
    }

    // Medium: enabled if easy is completed
    const mediumCard = document.getElementById('level-medium');
    const mediumBtn = document.getElementById('btn-medium');
    const mediumBadge = mediumCard?.querySelector('.level-locked-badge');
    const mediumHint = mediumCard?.querySelector('p:last-of-type');
    
    if (mediumCard && mediumBtn) {
      if (easyCompleted) {
        mediumCard.classList.remove('level-locked');
        mediumBtn.disabled = false;
        if (mediumBadge) mediumBadge.style.display = 'none';
        if (mediumHint) mediumHint.style.display = 'none';
      } else {
        mediumCard.classList.add('level-locked');
        mediumBtn.disabled = true;
        if (mediumBadge) mediumBadge.style.display = 'block';
        if (mediumHint) mediumHint.style.display = 'block';
      }
    }

    // Hard: enabled if medium is completed
    const hardCard = document.getElementById('level-hard');
    const hardBtn = document.getElementById('btn-hard');
    const hardBadge = hardCard?.querySelector('.level-locked-badge');
    const hardHint = hardCard?.querySelector('p:last-of-type');
    
    if (hardCard && hardBtn) {
      if (mediumCompleted) {
        hardCard.classList.remove('level-locked');
        hardBtn.disabled = false;
        if (hardBadge) hardBadge.style.display = 'none';
        if (hardHint) hardHint.style.display = 'none';
      } else {
        hardCard.classList.add('level-locked');
        hardBtn.disabled = true;
        if (hardBadge) hardBadge.style.display = 'block';
        if (hardHint) hardHint.style.display = 'block';
      }
    }
  }

  // Open a level (redirect to question page with level parameter)
  function openLevel(level) {
    // Check if level is allowed
    if (level === 'easy') {
      // Easy is always allowed
      window.location.href = `./question.html?level=${level}&q=1`;
    } else if (level === 'medium') {
      // Medium requires easy to be completed
      if (!isLevelCompleted('easy')) {
        alert('Complete the Easy level first to unlock Medium.');
        return;
      }
      window.location.href = `./question.html?level=${level}&q=1`;
    } else if (level === 'hard') {
      // Hard requires medium to be completed
      if (!isLevelCompleted('medium')) {
        alert('Complete the Medium level first to unlock Hard.');
        return;
      }
      window.location.href = `./question.html?level=${level}&q=1`;
    }
  }

  // Attach event listeners to buttons
  const easyBtn = document.getElementById('btn-easy');
  const mediumBtn = document.getElementById('btn-medium');
  const hardBtn = document.getElementById('btn-hard');

  if (easyBtn) {
    easyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!easyBtn.disabled) {
        openLevel('easy');
      }
    });
  }

  if (mediumBtn) {
    mediumBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!mediumBtn.disabled) {
        openLevel('medium');
      }
    });
  }

  if (hardBtn) {
    hardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!hardBtn.disabled) {
        openLevel('hard');
      }
    });
  }

  // Initial UI update
  updateLevelUI();

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

