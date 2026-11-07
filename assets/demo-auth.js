// Frontend demo state only. No credentials or personal data are stored.
(() => {
  const key = 'ofoq-demo-signed-in';
  const root = new URL('../', document.currentScript.src);
  let signedIn = false;
  document.querySelectorAll('.account-menu-links a').forEach(link => {
    if (/\/Auth\//i.test(new URL(link.href).pathname)) link.dataset.auth = 'guest';
  });
  document.querySelectorAll('.account-menu-links').forEach(menu => {
    if (menu.querySelector('[data-logout]')) return;
    const logout = document.createElement('button');
    logout.type = 'button'; logout.dataset.logout = ''; logout.dataset.auth = 'member';
    logout.className = 'text-button';
    logout.innerHTML = '<svg class="account-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3H4v18h6M9 12h12m-4-4 4 4-4 4"/></svg>تسجيل الخروج';
    menu.append(logout);
  });
  try { signedIn = window.OfoqFrontend.memory.getItem(key) === 'true'; } catch {}
  function sync() {
    try { signedIn = window.OfoqFrontend.memory.getItem(key) === 'true'; } catch {}
    document.querySelectorAll('[data-auth]').forEach(element => {
      element.hidden = element.dataset.auth === 'member' ? !signedIn : signedIn;
    });
  }
  window.OfoqDemoAuth = {
    signIn(role = 'member') {
      signedIn = true;
      window.OfoqFrontend.user = { signedIn: true, role };
      try { window.OfoqFrontend.memory.setItem(key, 'true'); } catch {}
      sync();
    },
    destination() {
      const fallback = new URL('Account/Dashboard/dashboard.html', root);
      const next = new URLSearchParams(location.search).get('next');
      if (!next) return fallback.href;
      try {
        const target = new URL(next, location.href);
        if (target.origin === root.origin && target.pathname.startsWith(root.pathname) && target.pathname.endsWith('.html') && !/\/(Auth|Admin|company)\//i.test(target.pathname)) return target.href;
      } catch {}
      return fallback.href;
    }
  };
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-logout]')) return;
    signedIn = false;
    window.OfoqFrontend.user = { signedIn: false, role: 'member' };
    try { window.OfoqFrontend.memory.removeItem(key); } catch {}
    sync();
    const home = new URL('hero/userHero.html', root);
    home.searchParams.set('theme', document.documentElement.dataset.theme || 'light');
    window.OfoqFrontend.navigate(home.href);
  });
  addEventListener('pageshow', sync);
  sync();
})();
