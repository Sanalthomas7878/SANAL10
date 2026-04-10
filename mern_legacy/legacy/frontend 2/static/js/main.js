window.addEventListener('DOMContentLoaded', () => {
  const flashes = document.querySelectorAll('.flash-item');
  if (flashes.length) {
    setTimeout(() => {
      flashes.forEach((flash) => {
        flash.style.transition = 'opacity 0.4s ease';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 450);
      });
    }, 3500);
  }
});
