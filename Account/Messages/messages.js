
// Forms are interface examples. Only search and filter forms process their inputs.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (['searchForm', 'filterForm'].includes(form.id)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  form.reset();
  let status = form.querySelector('[data-screen-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.screenStatus = '';
    status.setAttribute('role', 'status');
    form.append(status);
  }
  status.textContent = 'هذه شاشة عرض فقط؛ لا يتم حفظ أو إرسال أي بيانات.';
}, true);
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
  const recipientId = new URLSearchParams(location.search).get('recipient');
  const recipient = window.OfoqPublishers.get(recipientId);
  conversations[0].id = 'lina';
  conversations[1].id = 'omar';
  if (recipient) {
    selected = conversations.findIndex(conversation => conversation.id === recipient.id);
    if (selected === -1) {
      selected = conversations.length;
      conversations.push({ id: recipient.id, name: recipient.name, role: recipient.role + ' · محادثة توضيحية', messages: [] });
    }
  }
  const list = document.querySelector('.conversation-list');
  list.replaceChildren();
  conversations.forEach((conversation, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.conversation = index;
    const account = window.OfoqPublishers.get(conversation.id);
    const image = document.createElement('img');
    image.className = 'publisher-avatar';
    image.src = account.avatar;
    image.alt = '';
    image.width = 44;
    image.height = 44;
    const text = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = conversation.name;
    const role = document.createElement('small');
    role.textContent = conversation.role;
    text.append(name, role);
    button.append(image, text);
    list.append(button);
  });

  function showConversation() {
    const conversation = conversations[selected];
    const account = window.OfoqPublishers.get(conversation.id);
    get('chatProfileLink').href = window.OfoqPublishers.url('Profile', account.id);
    get('chatAvatar').src = account.avatar;
    get('chatAvatar').alt = 'صورة حساب ' + account.name;
    get('chatName').textContent = conversation.name;
    get('chatRole').textContent = conversation.role.split(' · ')[0];
    const meetingUrl = new URL('../../Meeting/meeting.html', location.href);
    meetingUrl.searchParams.set('recipient', account.id);
    get('startMeeting').href = window.siteThemeUrl(meetingUrl.href);
    get('startMeeting').setAttribute('aria-label', 'بدء اجتماع فيديو مع ' + account.name);
    get('startMeeting').title = 'بدء اجتماع فيديو مع ' + account.name;
    get('chatMessages').replaceChildren();
    if (!conversation.messages.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.innerHTML = '<span class="chat-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-4 3V11.5A7.5 7.5 0 0 1 9.5 4h3a7.5 7.5 0 0 1 7.5 7.5Z"/><path d="M7 10h8M7 14h5"/></svg></span>';
      const title = document.createElement('h3');
      title.textContent = 'ابدأ محادثة مع ' + conversation.name;
      const hint = document.createElement('p');
      hint.textContent = 'عرّف عن نفسك وشارك فكرتك لبدء الحوار.';
      empty.append(title, hint);
      get('chatMessages').append(empty);
    }
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
    get('messageForm').querySelector('[data-screen-status]')?.remove();
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
  form.addEventListener('input', event => event.target.setCustomValidity(''));
  get('resetSettings').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
    get('settingsStatus').textContent = 'أُعيدت الإعدادات التوضيحية.';
  });
}

})();
