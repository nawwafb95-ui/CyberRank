// public/js/home.js
document.addEventListener('DOMContentLoaded', () => {
    const quizzesBtn = document.getElementById('home-quizzes');
    if (quizzesBtn) {
      quizzesBtn.addEventListener('click', () => {
        if (isLoggedIn()) {
          go('/quizzes.html');
        } else {
          go('/login.html');
        }
      });
    }
  
    if (window.updateNavigationState) {
      window.updateNavigationState();
    }
  });
  