document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flip-card').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        card.classList.toggle('flipped');
      });
    });
  });
  