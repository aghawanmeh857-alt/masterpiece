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
    app.log?.('settings','تحديث إعدادات الحساب');
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
