
document.querySelectorAll('form').forEach(form => form.autocomplete = 'off');
(function () {
// Theme travels in page links; no browser storage or backend is needed.

window.siteThemeUrl = function(href) {
  const url = new URL(href, location.href);
  url.searchParams.set('theme', document.documentElement.dataset.theme);
  return url.href;
};
function updateThemeLinks(root = document) {
  const links = [...root.querySelectorAll('a[href]')];
  if (root.matches?.('a[href]')) links.push(root);
  links.forEach(link => {
    if (link.getAttribute('href').startsWith('#')) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname.endsWith('.html')) {
      link.href = window.siteThemeUrl(url.href);
    }
  });
}
window.setSiteTheme = function(theme) {
  const dark = theme === 'dark';
  const current = document.documentElement.dataset.theme;
  if (current && current !== (dark ? 'dark' : 'light')) document.documentElement.classList.add('theme-transition');
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  updateThemeLinks();
  const url = new URL(location.href);
  url.searchParams.set('theme', dark ? 'dark' : 'light');
  history.replaceState(null, '', url);
  document.querySelectorAll('.theme-toggle').forEach(button => {
    button.textContent = dark ? '☀ الوضع النهاري' : '☾ الوضع الليلي';
    button.setAttribute('aria-label', dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#0b1526' : '#f3f6fb';
};
window.setSiteTheme(new URLSearchParams(location.search).get('theme'));
// Include newly rendered cards, menus and detail links before they are opened.
new MutationObserver(records => {
  records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) updateThemeLinks(node);
  }));
}).observe(document.body, { childList: true, subtree: true });

document.addEventListener('click', event => {
  const toggle = event.target.closest('.theme-toggle');
  if (toggle) {
    const dark = document.documentElement.dataset.theme === 'dark';
    // The entrance buttons also animate the sun, moon and street lights.
    const sceneButton = document.getElementById(dark ? 'dayMode' : 'nightMode');
    if (sceneButton) sceneButton.click();
    else window.setSiteTheme(dark ? 'light' : 'dark');
  }
  const link = event.target.closest('a[href]');
  if (!link || link.getAttribute('href').startsWith('#')) return;
  const url = new URL(link.href);
  if (url.origin === location.origin && url.pathname.endsWith('.html')) link.href = window.siteThemeUrl(link.href);
}, true);


window.componentsReady = Promise.resolve();

})();

(function () {
// Messages and settings are front-end previews. No data is sent or stored.
const get = id => document.getElementById(id);
window.componentsReady.then(() => {
  get('year').textContent = new Date().getFullYear();
}).catch(() => {});

if (document.body.dataset.page === 'messages') {
  const conversations = [
    { name: 'لينا حداد', role: 'مصممة · محادثة توضيحية', messages: [
      { mine: false, text: 'مرحبًا! ما المساعدة التي تحتاجها في التصميم؟' },
      { mine: true, text: 'أعمل على فكرة تطبيق تعليمي وأحتاج إلى مساعدة في تصميم الواجهات.' }
    ] },
    { name: 'عمر خليل', role: 'مطوّر · محادثة توضيحية', messages: [
      { mine: false, text: 'مرحبًا! هل لديك نبذة عن فكرة الموقع؟' }
    ] }
  ];
  let selected = 0;

  function showConversation() {
    const conversation = conversations[selected];
    get('chatName').textContent = conversation.name;
    get('chatRole').textContent = conversation.role;
    get('chatMessages').replaceChildren();
    conversation.messages.forEach(message => {
      const bubble = document.createElement('p');
      bubble.className = message.mine ? 'chat-bubble mine' : 'chat-bubble';
      bubble.textContent = message.text;
      bubble.dir = 'auto';
      get('chatMessages').append(bubble);
    });
    get('chatMessages').scrollTop = get('chatMessages').scrollHeight;
    document.querySelectorAll('[data-conversation]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.conversation) === selected));
    });
    get('messageForm').reset();
    get('messageInput').setCustomValidity('');
    get('messageStatus').textContent = '';
  }

  document.querySelectorAll('[data-conversation]').forEach(button => {
    button.addEventListener('click', () => {
      selected = Number(button.dataset.conversation);
      showConversation();
    });
  });

  get('conversationSearch').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll('[data-conversation]').forEach(button => {
      button.hidden = !button.textContent.toLowerCase().includes(query);
      if (!button.hidden) count++;
    });
    get('noConversations').hidden = count !== 0;
  });

  get('messageInput').addEventListener('input', event => event.target.setCustomValidity(''));
  showConversation();
}

if (document.body.dataset.page === 'settings') {
  const form = get('settingsForm');
  const app = window.OfoqFrontend;
  function populate() {
    get('settingsName').value = app.profile.name;
    get('settingsEmail').value = app.profile.email;
    get('settingsAvailability').value = app.settings.availability;
    for (const id of ['projectUpdates', 'courseUpdates', 'communityUpdates']) get(id).checked = app.settings[id];
  }
  populate();
  form.addEventListener('submit', event => {
    event.preventDefault();
    get('settingsName').value = get('settingsName').value.trim();
    get('settingsName').setCustomValidity(get('settingsName').value.length >= 2 ? '' : 'اكتب اسمًا من حرفين على الأقل.');
    if (!form.reportValidity()) return;
    app.profile.name = get('settingsName').value;
    app.profile.email = get('settingsEmail').value.trim();
    app.settings.availability = get('settingsAvailability').value;
    for (const id of ['projectUpdates', 'courseUpdates', 'communityUpdates']) app.settings[id] = get(id).checked;
    get('settingsStatus').textContent = 'تم تطبيق التفضيلات وتحديث بيانات ملفك خلال هذه الزيارة.';
  });
  form.addEventListener('input', event => event.target.setCustomValidity(''));
  get('resetSettings').addEventListener('click', () => {
    form.reset();
    populate();
    form.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
    get('settingsStatus').textContent = 'أُعيدت الإعدادات التوضيحية.';
  });
}

})();
