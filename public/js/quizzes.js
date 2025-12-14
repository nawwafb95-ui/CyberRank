// public/js/quizzes.js
document.addEventListener('DOMContentLoaded', () => {
  const quiz1Btn = document.getElementById('quiz-1');
  const quiz2Btn = document.getElementById('quiz-2');
  const quiz3Btn = document.getElementById('quiz-3');

  if (quiz1Btn) {
    quiz1Btn.addEventListener('click', () => {
      // First question in quiz 1
      go('./question.html?quiz=1&q=1');
    });
  }

  if (quiz2Btn) {
    quiz2Btn.addEventListener('click', () => {
      go('./question.html?quiz=2&q=1');
    });
  }

  if (quiz3Btn) {
    quiz3Btn.addEventListener('click', () => {
      go('./question.html?quiz=3&q=1');
    });
  }

  if (window.updateNavigationState) {
    window.updateNavigationState();
  }
});
