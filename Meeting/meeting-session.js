// Adapted from the supplied meetingZoom/script.js: JitsiMeetExternalAPI,
// roomName, parentNode, responsive dimensions and participant displayName.
const DOMAIN = 'meet.jit.si';

export function meetingRoom(url, crypto) {
  const requested = url.searchParams.get('room');
  if (requested && /^OfoqInterview-[a-f0-9]{32}$/i.test(requested)) return requested;
  const token = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replaceAll('-', '')
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  return 'OfoqInterview-' + token;
}

export function loadJitsi(win = window, doc = document) {
  if (win.JitsiMeetExternalAPI) return Promise.resolve(win.JitsiMeetExternalAPI);
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    const timeout = win.setTimeout(() => finish(new Error('Jitsi load timed out')), 15000);
    function finish(error) {
      win.clearTimeout(timeout);
      script.onload = script.onerror = null;
      if (error) { script.remove(); reject(error); }
      else resolve(win.JitsiMeetExternalAPI);
    }
    script.src = `https://${DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => finish(typeof win.JitsiMeetExternalAPI === 'function' ? null : new Error('Jitsi API missing'));
    script.onerror = () => finish(new Error('Jitsi could not be loaded'));
    doc.head.append(script);
  });
}

export function initializeMeeting(win = window, doc = document, load = () => loadJitsi(win, doc)) {
  const get = id => doc.getElementById(id);
  const pageUrl = new URL(win.location.href);
  const room = meetingRoom(pageUrl, win.crypto);
  pageUrl.searchParams.set('room', room);
  win.history.replaceState(null, '', pageUrl);
  const recipient = win.OfoqPublishers.get(pageUrl.searchParams.get('recipient'));
  const inviteUrl = `https://${DOMAIN}/${room}`;
  let api = null;
  let loading = false;
  let disposed = false;
  let session = 0;

  get('providerBadge').textContent = 'Jitsi Meet';
  get('inviteLink').value = inviteUrl;
  get('externalJitsi').href = inviteUrl;
  get('externalJitsi').hidden = false;
  get('meetingContext').textContent = 'شارك رابط الانضمام مع الطرف الآخر للدخول إلى نفس الغرفة.';
  if (recipient) {
    doc.title = 'مقابلة مع ' + recipient.name + ' — أفق';
    get('meetingTitle').textContent = 'مقابلة مع ' + recipient.name;
    get('candidateName').textContent = recipient.name;
    get('projectName').textContent = 'مقابلة من المحادثة';
    get('backToProject').href = win.OfoqPublishers.url('Messages', recipient.id);
    get('backToProject').textContent = 'العودة إلى المحادثة ←';
  }

  const status = text => { get('meetingStatus').textContent = text; };
  function closeMeeting(text = 'غادرت المقابلة. يمكنك الدخول مجددًا من نفس الرابط.') {
    session++;
    const current = api;
    api = null;
    try { current?.dispose(); } catch { /* Release the local UI even if the frame has closed. */ }
    get('meet').replaceChildren();
    get('meet').hidden = true;
    get('welcome').hidden = false;
    get('leaveMeeting').hidden = true;
    get('joinMeeting').disabled = false;
    get('joinMeeting').textContent = 'الدخول إلى المقابلة';
    loading = false;
    status(text);
  }

  get('displayName').addEventListener('input', () => get('displayName').setCustomValidity(''));
  get('joinMeeting').addEventListener('click', async () => {
    if (loading || api || disposed) return;
    const displayName = get('displayName').value.trim();
    get('displayName').setCustomValidity(displayName ? '' : 'يرجى إدخال اسمك في الاجتماع.');
    if (!get('displayName').reportValidity()) return;
    if (!win.isSecureContext) {
      status('لتمكين الكاميرا والميكروفون، افتح الموقع عبر HTTPS أو localhost، أو استخدم رابط Jitsi المباشر.');
      return;
    }
    loading = true;
    get('joinMeeting').disabled = true;
    get('joinMeeting').textContent = 'جارٍ تحميل المقابلة…';
    status('جارٍ تحميل Jitsi…');
    const attempt = ++session;
    try {
      const JitsiMeetExternalAPI = await load();
      if (disposed || attempt !== session) return;
      get('welcome').hidden = true;
      get('meet').hidden = false;
      // The source archive used a fixed room and 800x600 frame. Each interview
      // now keeps its own shareable room, and the frame follows the site layout.
      api = new JitsiMeetExternalAPI(DOMAIN, {
        roomName: room,
        width: '100%', height: '100%', parentNode: get('meet'), lang: 'ar',
        userInfo: { displayName },
        configOverwrite: { startWithAudioMuted: true, startWithVideoMuted: true }
      });
      get('leaveMeeting').hidden = false;
      status('أكمل إعداد الصوت والكاميرا والدخول داخل نافذة Jitsi.');
      api.addListener('videoConferenceJoined', () => {
        if (attempt === session) status('أنت الآن داخل المقابلة. شارك الرابط لدعوة الطرف الآخر.');
      });
      api.addListener('readyToClose', () => { if (attempt === session) closeMeeting(); });
      api.addListener('cameraError', () => {
        if (attempt === session) status('تعذّر الوصول إلى الكاميرا. راجع إذن الكاميرا أو تابع بالصوت.');
      });
      api.addListener('micError', () => {
        if (attempt === session) status('تعذّر الوصول إلى الميكروفون. راجع إذن الميكروفون في المتصفح.');
      });
      api.addListener('errorOccurred', () => {
        if (attempt === session) status('حدثت مشكلة في الاتصال بالاجتماع. راجع نافذة Jitsi أو افتح الرابط في نافذة منفصلة.');
      });
    } catch {
      if (!disposed && attempt === session) closeMeeting('تعذّر تحميل المقابلة. حاول مجددًا أو افتح رابط Jitsi في نافذة منفصلة.');
    } finally {
      if (attempt === session) loading = false;
    }
  });

  get('leaveMeeting').addEventListener('click', () => closeMeeting());
  get('copyInvite').addEventListener('click', async () => {
    try {
      await win.navigator.clipboard.writeText(inviteUrl);
      status('تم نسخ رابط المقابلة. أرسله للطرف الآخر للانضمام.');
    } catch {
      get('inviteLink').focus();
      get('inviteLink').select();
      status('انسخ الرابط المحدّد يدويًا وشاركه مع الطرف الآخر.');
    }
  });
  // pagehide also covers leaving for the conversation and browser history.
  win.addEventListener('pagehide', () => { disposed = true; closeMeeting(); });
  win.addEventListener('pageshow', () => { disposed = false; });
}
