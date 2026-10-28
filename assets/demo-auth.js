// Frontend demo state only. No credentials or personal data are stored.
(() => {
  const key = 'ofoq-demo-signed-in';
  const root = new URL('../', document.currentScript.src);
  let signedIn = false;
  try { signedIn = sessionStorage.getItem(key) === 'true'; } catch {}
  function sync() {
    try { signedIn = sessionStorage.getItem(key) === 'true'; } catch {}
    document.querySelectorAll('[data-auth]').forEach(element => {
      element.hidden = element.dataset.auth === 'member' ? !signedIn : signedIn;
    });
  }
  window.OfoqDemoAuth = {
    signIn() {
      signedIn = true;
      try { sessionStorage.setItem(key, 'true'); } catch {}
      sync();
    },
    destination() {
      const fallback = new URL('Account/Dashboard/dashboard.html', root);
      const next = new URLSearchParams(location.search).get('next');
      if (!next) return fallback.href;
      try {
        const target = new URL(next, location.href);
        if (target.origin === root.origin && target.pathname.startsWith(root.pathname) && target.pathname.endsWith('.html') && !target.pathname.includes('/Auth/')) return target.href;
      } catch {}
      return fallback.href;
    }
  };
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-logout]')) return;
    signedIn = false;
    try { sessionStorage.removeItem(key); } catch {}
    sync();
    const home = new URL('hero/userHero.html', root);
    home.searchParams.set('theme', document.documentElement.dataset.theme || 'light');
    location.assign(home.href);
  });
  addEventListener('pageshow', sync);
  sync();
})();
