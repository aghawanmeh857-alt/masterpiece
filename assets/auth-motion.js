(() => {
  const transitionKey = 'authTransition';
  const contextKeys = ['next', 'account', 'service', 'theme'];
  const initialUrl = new URL(location.href);
  const arriving = initialUrl.searchParams.get(transitionKey) === '1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (arriving && !reducedMotion.matches) document.documentElement.dataset.authArrival = '';

  document.addEventListener('DOMContentLoaded', () => {
    const shell = document.querySelector('.auth-shell');
    if (!shell) return;

    if (arriving) {
      const cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete(transitionKey);
      history.replaceState(history.state, '', cleanUrl);
    }

    for (const link of shell.querySelectorAll('[data-auth-switch]')) {
      const target = new URL(link.href);
      for (const key of contextKeys) {
        const value = initialUrl.searchParams.get(key);
        if (value && !target.searchParams.has(key)) target.searchParams.set(key, value);
      }
      link.href = target;
    }

    let switching = false;
    function reset() {
      switching = false;
      shell.inert = false;
      shell.classList.remove('is-auth-switching');
    }

    addEventListener('pageshow', (event) => {
      if (event.persisted) {
        delete document.documentElement.dataset.authArrival;
        reset();
      }
    });

    shell.addEventListener('click', (event) => {
      const link = event.target.closest('[data-auth-switch]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;

      event.preventDefault();
      if (switching) return;
      switching = true;
      const target = new URL(window.siteThemeUrl ? window.siteThemeUrl(link.href) : link.href);
      target.searchParams.set(transitionKey, '1');
      shell.classList.add('is-auth-switching');
      shell.inert = true;

      // Keep the existing application routing and use a timeout if the animation is interrupted.
      let fallback;
      function navigate() {
        clearTimeout(fallback);
        shell.removeEventListener('animationend', finish);
        if (window.OfoqFrontend?.navigate) window.OfoqFrontend.navigate(target.href);
        else location.assign(target.href);
      }
      function finish(event) {
        if (event.animationName === 'auth-panel-cover') navigate();
      }
      shell.addEventListener('animationend', finish);
      fallback = setTimeout(navigate, 420);
    });
  });
})();
