(() => {
  const form = document.getElementById('authForm');
  if (!form) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new WeakMap();
  const animations = new WeakMap();
  const lastPulse = new WeakMap();
  const dot = document.querySelector('.auth-dot');
  let angle = -110;
  let speed = 0;
  let orbitFrame = 0;
  let previousTime = 0;
  let typingUntil = 0;
  function orbit(time) {
    orbitFrame = 0;
    if (reduced.matches || document.hidden || !dot) { speed = 0; return; }
    const dt = Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    const targetSpeed = time < typingUntil ? 85 : 0;
    speed += (targetSpeed - speed) * (1 - Math.exp(-dt * 5));
    angle = (angle + speed * dt) % 360;
    dot.style.setProperty('--orbit-angle', `${angle}deg`);
    if (targetSpeed || speed > .15) orbitFrame = requestAnimationFrame(orbit);
    else speed = 0;
  }
  function moveOrbit() {
    if (!dot || reduced.matches || !dot.getClientRects().length) return;
    typingUntil = performance.now() + 650;
    if (!orbitFrame) {
      previousTime = performance.now();
      orbitFrame = requestAnimationFrame(orbit);
    }
  }
  function stopOrbit() {
    cancelAnimationFrame(orbitFrame);
    orbitFrame = 0;
    speed = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopOrbit(); });
  reduced.addEventListener('change', () => { if (reduced.matches) stopOrbit(); });
  window.addEventListener('pagehide', stopOrbit);
  form.addEventListener('input', event => {
    const field = event.target.closest('.field');
    if (!field) return;
    moveOrbit();
    field.classList.add('is-typing');
    clearTimeout(timers.get(field));
    timers.set(field, setTimeout(() => field.classList.remove('is-typing'), 650));
    const now = performance.now();
    if (reduced.matches || now - (lastPulse.get(field) ?? -Infinity) < 240) return;
    lastPulse.set(field, now);
    animations.get(field)?.cancel();
    animations.set(field, field.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-2px)', offset: .4 },
      { transform: 'translateY(0)' }
    ], { duration: 260, easing: 'ease-out' }));
  });
  form.addEventListener('focusout', event => {
    const field = event.target.closest('.field');
    if (field) { clearTimeout(timers.get(field)); field.classList.remove('is-typing'); }
  });
  form.addEventListener('invalid', event => {
    const field = event.target.closest('.field');
    if (!field || reduced.matches) return;
    animations.get(field)?.cancel();
    animations.set(field, field.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' }, { transform: 'translateX(3px)' },
      { transform: 'translateX(0)' }
    ], { duration: 320, easing: 'ease-out' }));
  }, true);
})();
