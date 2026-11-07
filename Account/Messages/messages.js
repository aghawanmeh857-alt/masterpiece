(function () {
// Messages and settings are front-end previews. No data is sent or stored.
const get = id => document.getElementById(id);
window.componentsReady.then(() => {
  get('year').textContent = new Date().getFullYear();
}).catch(() => {});

if (document.body.dataset.page === 'messages') {
  const conversations = window.OfoqFrontend.conversations || [
    { name: 'لينا حداد', role: 'مصممة · محادثة توضيحية', messages: [
      { mine: false, text: 'مرحبًا! ما المساعدة التي تحتاجها في التصميم؟' },
      { mine: true, text: 'أعمل على فكرة تطبيق تعليمي وأحتاج إلى مساعدة في تصميم الواجهات.' }
    ] },
    { name: 'عمر خليل', role: 'مطوّر · محادثة توضيحية', messages: [
      { mine: false, text: 'مرحبًا! هل لديك نبذة عن فكرة الموقع؟' }
    ] }
  ];
  window.OfoqFrontend.conversations = conversations;
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
    const preview=document.createElement('span');preview.className='conversation-preview';preview.textContent=conversation.messages.at(-1)?.text||'ابدأ الحوار';
    text.append(name, role,preview);
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
    list.querySelectorAll('[data-conversation]').forEach(button=>{const row=conversations[Number(button.dataset.conversation)];button.querySelector('.conversation-preview').textContent=row.messages.at(-1)?.text||'ابدأ الحوار';});
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
      if (message.sentAt) {
        const time = document.createElement('time');
        time.className = 'chat-message-meta';
        time.dateTime = message.sentAt;
        time.textContent = new Intl.DateTimeFormat('ar-JO', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.sentAt));
        bubble.append(time);
      }
      const row=document.createElement('div');row.className=message.mine?'chat-message-row mine':'chat-message-row';const sender=document.createElement('small');sender.className='chat-message-sender';sender.textContent=message.mine?'أنت':conversation.name;row.append(sender,bubble);get('chatMessages').append(row);
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
  get('messageForm').addEventListener('submit', event => {
    event.preventDefault();
    const text = get('messageInput').value.trim();
    get('messageInput').setCustomValidity(text ? '' : 'اكتب رسالة أولًا.');
    if (!get('messageForm').reportValidity()) return;
    conversations[selected].messages.push({ mine: true, text, sentAt: new Date().toISOString() });
    showConversation();
    get('messageStatus').textContent = 'أُضيفت رسالتك إلى المحادثة خلال هذه الزيارة. لا تُرسل إلى طرف آخر.';
    get('messageInput').focus();
  });
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
