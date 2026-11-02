// A tab-local application session. Nothing is written to browser storage.
(() => {
  const root = new URL('../', document.currentScript.src);
  const makeSession = () => {
    const values = new Map(), documents = new Map();
    return {
      memory: {
        getItem: key => values.get(String(key)) ?? null,
        setItem: (key, value) => values.set(String(key), String(value)),
        removeItem: key => values.delete(String(key)),
        clear: () => values.clear()
      },
      user: { signedIn: false, role: 'member' },
      addDocument(file) {
        const id = crypto.randomUUID(), url = URL.createObjectURL(file);
        const attachment = {id,url,name:file.name,size:file.size};
        documents.set(id,attachment); return attachment;
      },
      documentFor(id) { return documents.get(id) || null; },
      profile: { name: 'أليكس مورغان', email: 'alex@example.com', role: 'مصمم واجهات ومطوّر مواقع', location: 'عمّان، الأردن', bio: 'أحوّل الأفكار إلى تجارب رقمية واضحة وسهلة.', skills: 'تصميم الواجهات, Figma, HTML, CSS, JavaScript' },
      applications: [], registrations: [], ideas: [], conversations: null,
      catalogs: {}, savedRecords: [], cartRecords: [],
      toggleFavorite(kind, record, href) {
        const index = this.savedRecords.findIndex(row => row.kind === kind && String(row.id) === String(record.id));
        if (index >= 0) this.savedRecords.splice(index, 1);
        else this.savedRecords.push({kind, id: record.id, title: record.title, href});
      },
      settings: { availability: 'متاح للعمل الحر', projectUpdates: true, courseUpdates: true, communityUpdates: false },
      apply(kind, id, title, href) {
        const existing = this.applications.find(row => row.kind === kind && row.id === String(id));
        if (existing) return existing;
        const row = { kind, id: String(id), title, href, status: 'قيد المراجعة' };
        this.applications.unshift(row);
        return row;
      },
      register(id, title, href) {
        if (!this.registrations.some(row => row.id === String(id))) this.registrations.unshift({ id: String(id), title, href });
      }
    };
  };
  const allowed = href => {
    try {
      const url = new URL(href, root);
      return url.origin === root.origin && url.pathname.startsWith(root.pathname) && url.pathname.endsWith('.html') && !url.pathname.endsWith('/app.html') ? url : null;
    } catch { return null; }
  };
  if (document.documentElement.dataset.appShell === 'true') {
    const session = makeSession();
    window.OfoqFrontend = session;
    const frame = document.getElementById('appPage');
    const initial = allowed(new URLSearchParams(location.search).get('route')) || new URL('hero/userHero.html', root);
    const navigate = (href, replace = false) => {
      const url = allowed(href);
      if (!url) return;
      history[replace ? 'replaceState' : 'pushState']({ ofoq: true }, '', url);
      frame.contentWindow.location.replace(url.href);
    };
    session.navigate = navigate;
    session.syncURL = href => {
      const url = allowed(href);
      if (url) history.replaceState({ ofoq: true }, '', url);
    };
    addEventListener('popstate', () => frame.contentWindow.location.replace(location.href));
    frame.addEventListener('load', () => {
      try { document.title = frame.contentDocument.title; session.syncURL(frame.contentWindow.location.href); } catch {}
    });
    history.replaceState({ ofoq: true }, '', initial);
    frame.src = initial.href;
    return;
  }
  let shared;
  try { if (parent !== window) shared = parent.OfoqFrontend; } catch {}
  if (!shared && parent === window) {
    const shell = new URL('app.html', root);
    shell.searchParams.set('route', location.href);
    // Stop parsing the outgoing document so its page scripts do not execute
    // against a document being replaced by the application host.
    window.stop();
    location.replace(shell.href);
    return;
  }
  // Admin's embedded scene preview has its own isolated session.
  window.OfoqFrontend = shared || makeSession();
  const app = window.OfoqFrontend;
  if (!app.navigate) app.navigate = href => location.assign(href);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = allowed(link.href);
    if (!url || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
    event.preventDefault();
    app.navigate(url.href);
  });
  const replace = history.replaceState.bind(history);
  history.replaceState = (...args) => { replace(...args); app.syncURL?.(location.href); };
  addEventListener('hashchange', () => app.syncURL?.(location.href));
})();
