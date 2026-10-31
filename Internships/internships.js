
// Forms are interface examples. Only search and filter forms process their inputs.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (['searchForm', 'filterForm', 'previewForm'].includes(form.id)) return;
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

// بيانات تجريبية. عدّل القائمة هنا لإضافة فرص أو فعاليات.
const pageData = {
  "section": "internships",
  "noun": "internships",
  "action": "عرض فرصة التدريب",
  "types": [
    [
      "2-months",
      "شهران"
    ],
    [
      "3-months",
      "3 أشهر"
    ],
    [
      "6-months",
      "6 أشهر"
    ]
  ],
  "extras": [
    [
      "paid",
      "مدفوع"
    ],
    [
      "unpaid",
      "دون مقابل مالي"
    ]
  ],
  "items": [
    {
      "id": "design-intern",
      "title": "متدرّب تصميم واجهات وتجربة المستخدم",
      "company": "استوديو نورث",
      "category": "design",
      "location": "hybrid",
      "itemType": "3-months",
      "extra": "paid",
      "reward": 350,
      "offer": "350 دولار / شهر",
      "date": "2026-10-10",
      "deadline": "2026-11-02",
      "symbol": "◈",
      "description": "ساهم في تحويل أبحاث المستخدمين إلى مخططات ونماذج أولية مع فريق تصميم ذي خبرة.",
      "details": [
        "العمل على مسارات المستخدم ونماذج Figma",
        "المشاركة في مراجعات التصميم مع مرشد",
        "إنشاء دراسة حالة لمعرض أعمالك"
      ],
      "requirements": [
        "معرفة أساسية بـFigma",
        "اهتمام بالتصميم الذي يركّز على المستخدم",
        "معرض أعمال صغير أو مشروع شخصي"
      ]
    },
    {
      "id": "web-intern",
      "title": "متدرّب تطوير واجهات أمامية",
      "company": "برايت لابز",
      "category": "development",
      "location": "remote",
      "itemType": "2-months",
      "extra": "paid",
      "reward": 400,
      "offer": "400 دولار / شهر",
      "date": "2026-10-09",
      "deadline": "2026-10-28",
      "symbol": "</>",
      "description": "تدرّب على HTML وCSS وJavaScript من خلال مهام واجهات ومراجعات دورية للكود.",
      "details": [
        "بناء مكوّنات واجهات متجاوبة",
        "معالجة مشاكل سهولة الوصول والتخطيط",
        "تعلّم سير عمل الفريق ومراجعة الكود"
      ],
      "requirements": [
        "معرفة بأساسيات HTML وCSS",
        "معرفة أساسية بـJavaScript",
        "مشروع نموذجي أو ملف على GitHub"
      ]
    },
    {
      "id": "marketing-intern",
      "title": "متدرّب تسويق رقمي",
      "company": "أورنج كولكتيف",
      "category": "marketing",
      "location": "onsite",
      "itemType": "3-months",
      "extra": "unpaid",
      "reward": 0,
      "offer": "دون مقابل مالي",
      "date": "2026-10-08",
      "deadline": "2026-11-08",
      "symbol": "◎",
      "description": "ساهم في تخطيط المحتوى وأبحاث الحملات، وتعرّف على طريقة عمل فرق التسويق.",
      "details": [
        "دراسة الجمهور وأفكار المحتوى",
        "المساعدة في تخطيط منشورات التواصل الاجتماعي",
        "مراجعة مؤشرات الحملة مع مرشد"
      ],
      "requirements": [
        "كتابة واضحة ورغبة في الاستكشاف",
        "اهتمام بالتسويق الرقمي",
        "القدرة على العمل باستخدام جداول البيانات"
      ]
    },
    {
      "id": "backend-intern",
      "title": "متدرّب تطوير برمجيات خلفية",
      "company": "كلاود وركس",
      "category": "development",
      "location": "hybrid",
      "itemType": "6-months",
      "extra": "paid",
      "reward": 500,
      "offer": "500 دولار / شهر",
      "date": "2026-10-07",
      "deadline": "2026-11-12",
      "symbol": "{ }",
      "description": "تعلّم تطوير واجهات البرمجة وقواعد البيانات من خلال مهام برمجة خلفية صغيرة.",
      "details": [
        "بناء نقاط اتصال برمجية بسيطة واختبارها",
        "التدرّب على استعلامات قواعد البيانات",
        "توثيق العمل ومراجعته مع الفريق"
      ],
      "requirements": [
        "خبرة أساسية بالبرمجة",
        "معرفة بـHTTP وقواعد البيانات",
        "الرغبة في التعلّم وطرح الأسئلة"
      ]
    }
  ]
};


(async function () {
// أدوات بسيطة مشتركة لصفحات التدريب والوظائف والفعاليات.
async function startListings() {
  const cartKey = 'ofoq-internship-cart-v1';
  let internshipCart = [];
  const readCart = () => {
    try { const value = JSON.parse(localStorage.getItem(cartKey) || '[]'); internshipCart = Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string') : []; } catch { internshipCart = []; }
  };
  readCart();
  const cartShortcut = document.createElement('a');
  cartShortcut.className = 'internship-cart-shortcut';
  cartShortcut.href = '../Academy/Cart/cart.html' + location.search;
  const cartCount = document.createElement('span');
  cartShortcut.append('عرض السلة ', cartCount);
  document.getElementById('savedShortcut').after(cartShortcut);
  function updateCartCount() {
    let courseCount = 0;
    try {
      const learning = JSON.parse(localStorage.getItem('ofoq-learning-v1') || '{}');
      if (Array.isArray(learning?.cart)) courseCount = new Set(learning.cart).size;
    } catch {}
    const count = internshipCart.length + courseCount;
    cartCount.textContent = count;
    cartShortcut.setAttribute('aria-label', 'عرض سلة المشتريات، ' + count + ' عناصر');
  }
  updateCartCount();
  if (!window.componentsReady) throw new Error('Page initialization is unavailable.');
  await window.componentsReady;

  const savedKey = 'ofoq-saved-internships-v1';
  const knownIds = new Set(pageData.items.map(item => item.id));
  let saved = new Set();
  let savedOnly = false;
  function readSaved() {
    try {
      const data = JSON.parse(localStorage.getItem(savedKey) || '[]');
      saved = new Set(Array.isArray(data) ? data.filter(id => knownIds.has(id)) : []);
    } catch { /* Keep the current selection if browser storage is unavailable. */ }
  }
  readSaved();
  function saveFavorites() {
    try { localStorage.setItem(savedKey, JSON.stringify([...saved])); get('savedNotice').hidden = true; }
    catch { get('savedNotice').hidden = false; get('savedNotice').textContent = 'التخزين غير متاح؛ المفضلة محفوظة خلال هذه الزيارة فقط.'; }
  }

  function get(id) {
    return document.getElementById(id);
  }

  function safeText(value) {
    const span = document.createElement('span');
    span.textContent = value;
    return span.innerHTML.replace(/"/g, '&quot;');
  }

  const labels = {
    development: 'التطوير', design: 'التصميم', marketing: 'التسويق',
    career: 'المسار المهني والمجتمع', remote: 'عن بُعد', onsite: 'من مقر العمل', hybrid: 'هجين'
  };
  for (const [value, label] of [...pageData.types, ...pageData.extras]) {
    labels[value] = label;
  }
  if (pageData.section === 'events') labels.remote = 'عبر الإنترنت';

  function dateLabel(date) {
    return new Intl.DateTimeFormat('ar-JO', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(date + 'T12:00:00Z'));
  }

  // 1) البحث والفلاتر والترتيب.
  function renderItems() {
    const query = get('searchQuery').value.trim().toLowerCase();
    const filters = ['category', 'location', 'itemType', 'extra'];
    const results = pageData.items.filter(item => {
      if (savedOnly && !saved.has(item.id)) return false;
      const text = [item.title, item.company, item.description,
        ...item.details, ...item.requirements].join(' ').toLowerCase();
      if (query && !text.includes(query)) return false;
      return filters.every(key => !get(key).value || item[key] === get(key).value);
    });

    const sort = get('sortBy').value;
    if (sort === 'recent') results.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'soon') results.sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (sort === 'reward') {
      results.sort((a, b) => pageData.section === 'events' ? a.reward - b.reward : b.reward - a.reward);
    }

    get('itemList').innerHTML = results.map(itemCard).join('');
    get('resultCount').textContent = results.length + ' من الفرص المتاحة';
    get('emptyState').hidden = results.length > 0;
    get('savedCount').textContent = saved.size;
    get('savedShortcutCount').textContent = saved.size;
    get('savedOpportunities').setAttribute('aria-pressed', String(savedOnly));
    get('allOpportunities').setAttribute('aria-pressed', String(!savedOnly));
    get('emptyTitle').textContent = savedOnly ? 'لا توجد فرص محفوظة مطابقة' : 'لا توجد فرص تدريب مطابقة';
    get('resetEmpty').textContent = savedOnly ? 'عرض كل الفرص' : 'مسح البحث والفلاتر';
  }

  function itemCard(item) {
    const detailUrl = 'Internship/internship.html?id=' + encodeURIComponent(item.id);
    const cover = {design: 'mobile', development: 'code', marketing: 'marketing', career: 'dashboard'}[item.category] || 'dashboard';
    return `
      <article class="listing-card" data-item="${item.id}">
        <div class="opportunity-media">
        <a class="opportunity-cover" href="${detailUrl}" aria-label="تفاصيل ${safeText(item.title)}">
          <img src="../assets/project-covers/${cover}.svg" alt="" width="800" height="450" loading="lazy">
          <span class="opportunity-badge">${labels[item.itemType]}</span>
        </a>
        <button class="save-internship" type="button" data-save-id="${safeText(item.id)}" aria-label="${saved.has(item.id) ? 'إزالة من المفضلة: ' : 'حفظ في المفضلة: '}${safeText(item.title)}" aria-pressed="${saved.has(item.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>
        </div>
        <div class="listing-details">
          <p class="listing-category">${labels[item.category]}</p>
          <h2><a href="${detailUrl}">${safeText(item.title)}</a></h2>
          ${window.OfoqPublishers.card(window.OfoqPublishers.forRecord(pageData.section, item))}
          <p class="listing-description">${safeText(item.description)}</p>
          <div class="listing-tags">
            <span>${labels[item.location]}</span>
            <span>${labels[item.itemType]}</span>
            <span>${labels[item.extra]}</span>
          </div>
          <p class="listing-date">آخر موعد للتقديم: ${dateLabel(item.deadline)}</p>
        </div>
        <div class="listing-offer">
          <strong>${safeText(item.offer)}</strong>
          <button type="button" class="internship-cart-button" data-cart-id="${safeText(item.id)}" aria-pressed="${internshipCart.some(entry => entry.id === item.id)}" aria-label="إضافة إلى السلة: ${safeText(item.title)}">${internshipCart.some(entry => entry.id === item.id) ? '✓ في السلة · عرض السلة' : 'إضافة إلى السلة'}</button>
          <button type="button" class="btn btn-orange" aria-label="عرض ${safeText(item.title)}">${pageData.action} ↗</button>
          <a class="details-link" href="${detailUrl}">التفاصيل الكاملة ←</a>
        </div>
      </article>`;
  }

  function clearFilters() {
    get('filterForm').reset();
    get('searchQuery').value = '';
    renderItems();
  }

  // 2) التفاصيل ومعاينة النموذج. لا تُرسل أي بيانات.
  function resetPreview() {
    get('previewForm').reset();
    get('previewArea').hidden = false;
    get('previewSuccess').hidden = true;
  }

  function openDetails(item) {
    resetPreview();
    get('detailTitle').textContent = item.title;
    get('detailDescription').textContent = item.description;
    const summary = [item.company, labels[item.location], labels[item.itemType], item.offer];
    if (pageData.section === 'events') summary.push(dateLabel(item.deadline), item.eventTime, item.venue);
    else summary.push('آخر موعد للتقديم: ' + dateLabel(item.deadline));
    get('detailSummary').textContent = summary.join(' · ');
    get('detailTasks').innerHTML = item.details.map(text => '<li>' + safeText(text) + '</li>').join('');
    get('detailRequirements').innerHTML = item.requirements.map(text => '<li>' + safeText(text) + '</li>').join('');
    bootstrap.Modal.getOrCreateInstance(get('detailModal')).show();
  }

  get('itemList').addEventListener('click', event => {
    const cartButton = event.target.closest('button[data-cart-id]');
    if (cartButton) {
      const item = pageData.items.find(item => item.id === cartButton.dataset.cartId);
      if (!item) return;
      if (internshipCart.some(entry => entry.id === item.id)) {
        const url = new URL('../Academy/Cart/cart.html', location.href);
        url.searchParams.set('theme', document.documentElement.dataset.theme || 'light');
        location.assign(url.href);
        return;
      }
      const next = [...internshipCart, {id: item.id, title: item.title, company: item.company}];
      try { localStorage.setItem(cartKey, JSON.stringify(next)); }
      catch { get('savedNotice').hidden = false; get('savedNotice').textContent = 'تعذّر حفظ الفرصة في السلة. يرجى السماح بالتخزين في المتصفح والمحاولة مجددًا.'; return; }
      internshipCart = next;
      updateCartCount();
      cartButton.textContent = '✓ في السلة · عرض السلة';
      cartButton.setAttribute('aria-pressed', 'true');
      cartButton.setAttribute('aria-label', 'عرض السلة: ' + item.title);
      return;
    }
    const saveButton = event.target.closest('button[data-save-id]');
    if (saveButton) {
      const id = saveButton.dataset.saveId;
      if (!knownIds.has(id)) return;
      saved.has(id) ? saved.delete(id) : saved.add(id);
      saveFavorites(); renderItems();
      const replacement = get('itemList').querySelector('button[data-save-id="' + id + '"]');
      (replacement || get('savedOpportunities')).focus();
      return;
    }
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.closest('.listing-card').dataset.item;
    openDetails(pageData.items.find(item => item.id === id));
  });

  get('filterForm').addEventListener('change', renderItems);
  get('searchQuery').addEventListener('input', renderItems);
  get('filterForm').addEventListener('submit', event => {
    event.preventDefault();
    renderItems();
  });
  get('searchForm').addEventListener('submit', event => {
    event.preventDefault();
    renderItems();
  });
  get('searchQuery').addEventListener('search', renderItems);
  get('sortBy').addEventListener('change', renderItems);
  get('clearFilters').addEventListener('click', clearFilters);
  get('resetEmpty').addEventListener('click', () => { savedOnly = false; clearFilters(); });
  get('allOpportunities').addEventListener('click', () => { savedOnly = false; renderItems(); });
  get('savedOpportunities').addEventListener('click', () => { savedOnly = true; renderItems(); });
  get('savedShortcut').addEventListener('click', () => {
    savedOnly = true; renderItems();
    get('internshipResults').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  addEventListener('pageshow', () => { readCart(); updateCartCount(); readSaved(); renderItems(); });
  addEventListener('storage', event => { if ([cartKey, 'ofoq-learning-v1', null].includes(event.key)) { readCart(); updateCartCount(); renderItems(); } });
  addEventListener('storage', event => { if (event.key === savedKey) { readSaved(); renderItems(); } });

  get('previewForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!get('previewForm').reportValidity()) return;
    get('previewArea').hidden = true;
    get('previewSuccess').hidden = false;
    get('previewSuccess').setAttribute('tabindex', '-1');
    get('previewSuccess').focus();
  });
  get('detailModal').addEventListener('hidden.bs.modal', resetPreview);

  get('year').textContent = new Date().getFullYear();
  renderItems();
}

startListings().catch(error => console.error('OFOQ listing page:', error));

})();
