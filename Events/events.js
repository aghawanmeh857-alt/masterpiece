
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

// بيانات تجريبية. عدّل القائمة هنا لإضافة فرص أو فعاليات.
const pageData = {
  "section": "events",
  "noun": "events",
  "action": "عرض الفعالية",
  "types": [
    [
      "workshop",
      "ورشة عمل"
    ],
    [
      "meetup",
      "لقاء"
    ],
    [
      "talk",
      "جلسة حوارية"
    ]
  ],
  "extras": [
    [
      "free",
      "مجاني"
    ],
    [
      "paid",
      "مدفوع"
    ]
  ],
  "items": [
    {
      "id": "ideas-event",
      "title": "أمسية صنّاع الأفكار",
      "company": "مجتمع أفق",
      "category": "career",
      "location": "onsite",
      "itemType": "meetup",
      "extra": "free",
      "reward": 0,
      "offer": "دخول مجاني",
      "date": "2026-10-10",
      "deadline": "2026-11-14",
      "eventTime": "6:00–8:00 مساءً · بتوقيت عمّان",
      "venue": "مساحة أفق · عمّان",
      "symbol": "↗",
      "description": "تعرّف على صنّاع آخرين، وشارك مشروعًا صغيرًا، وابنِ علاقات جديدة.",
      "details": [
        "الترحيب والتعارف",
        "عروض قصيرة للمشاريع",
        "تعارف وحوارات مفتوحة"
      ],
      "requirements": [
        "أحضر فكرة أو مشروعًا للمشاركة",
        "نرحّب بجميع مستويات الخبرة",
        "فعالية توضيحية: المكان والبرنامج أمثلة فقط"
      ]
    },
    {
      "id": "product-event",
      "title": "ابنِ منتجك الأول",
      "company": "برايت لابز",
      "category": "development",
      "location": "remote",
      "itemType": "workshop",
      "extra": "paid",
      "reward": 15,
      "offer": "تذكرة بـ15 دولارًا",
      "date": "2026-10-09",
      "deadline": "2026-11-07",
      "eventTime": "4:00–6:00 مساءً · بتوقيت عمّان",
      "venue": "عبر الإنترنت · جلسة توضيحية",
      "symbol": "</>",
      "description": "حوّل فكرة صغيرة إلى نموذج يعمل من خلال ورشة عملية بإرشاد مختصين.",
      "details": [
        "اختيار مشكلة تستحق الحل",
        "رسم تصوّر لحل واضح",
        "بناء نموذج أولي صغير ومشاركته"
      ],
      "requirements": [
        "حاسوب محمول ومتصفح",
        "المعرفة الأساسية بـHTML وCSS مفيدة",
        "جميع المواد محتوى توضيحي"
      ]
    },
    {
      "id": "design-event",
      "title": "التصميم لأشخاص حقيقيين",
      "company": "استوديو نورث",
      "category": "design",
      "location": "hybrid",
      "itemType": "talk",
      "extra": "free",
      "reward": 0,
      "offer": "دخول مجاني",
      "date": "2026-10-08",
      "deadline": "2026-11-21",
      "eventTime": "5:00–6:30 مساءً · بتوقيت عمّان",
      "venue": "مساحة أفق وعبر الإنترنت · مثال",
      "symbol": "◈",
      "description": "حوار حول الأبحاث وسهولة الوصول والقرارات التي تصنع منتجات أفضل.",
      "details": [
        "تجارب بحثية من فرق المنتجات",
        "تطبيقات عملية للتصميم الذي يراعي سهولة الوصول",
        "أسئلة الجمهور والنقاش"
      ],
      "requirements": [
        "متاح للمصممين وكل من يرغب بالتعلّم",
        "لا تُشترط خبرة سابقة",
        "Example event; no real booking is made"
      ]
    },
    {
      "id": "freelance-event",
      "title": "لقاء المستقلين على القهوة",
      "company": "أورنج كولكتيف",
      "category": "career",
      "location": "onsite",
      "itemType": "meetup",
      "extra": "paid",
      "reward": 5,
      "offer": "تذكرة بـ5 دولارات",
      "date": "2026-10-07",
      "deadline": "2026-11-28",
      "eventTime": "10:00 صباحًا–12:00 ظهرًا · بتوقيت عمّان",
      "venue": "مقهى المجتمع · عمّان · مثال",
      "symbol": "◎",
      "description": "تبادل الأفكار حول الوصول إلى العملاء وإدارة المشاريع وبناء عمل مستدام.",
      "details": [
        "تعارف على القهوة",
        "نقاشات ضمن مجموعات صغيرة",
        "نصائح وأسئلة وعلاقات مفيدة"
      ],
      "requirements": [
        "نرحّب بالمستقلين في جميع المراحل",
        "أحضر سؤالًا أو تجربة للمشاركة",
        "أسعار التذاكر والمكان أمثلة توضيحية"
      ]
    }
  ]
};


(async function () {
// أدوات بسيطة مشتركة لصفحات التدريب والوظائف والفعاليات.
async function startListings() {
  if (!window.componentsReady) throw new Error('Page initialization is unavailable.');
  await window.componentsReady;

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
  }

  function itemCard(item) {
    const isEvent = pageData.section === 'events';
    const detailFile = { jobs: 'Job/job.html', internships: 'Internship/internship.html', events: 'Event/event.html' }[pageData.section];
    const dateBlock = isEvent
      ? `<div class="event-date"><strong>${item.deadline.slice(8)}</strong><span>${new Intl.DateTimeFormat('ar-JO', {month:'short', timeZone:'UTC'}).format(new Date(item.deadline+'T12:00:00Z'))} ${item.deadline.slice(0,4)}</span></div>`
      : `<div class="listing-symbol ${item.category}" aria-hidden="true">${safeText(item.symbol)}</div>`;
    return `
      <article class="listing-card" data-item="${item.id}">
        ${dateBlock}
        <div class="listing-details">
          <p class="listing-category">${labels[item.category]}</p>
          <h2>${safeText(item.title)}</h2>
          ${window.OfoqPublishers.card(window.OfoqPublishers.forRecord(pageData.section, item))}
          <p class="listing-description">${safeText(item.description)}</p>
          <div class="listing-tags">
            <span>${labels[item.location]}</span>
            <span>${labels[item.itemType]}</span>
            <span>${labels[item.extra]}</span>
          </div>
          <p class="listing-date">${isEvent ? `<span>من ${item.eventTime.split(' · ')[0].split('–').map(part => `<bdi>${safeText(part)}</bdi>`).join(' إلى ')}</span><span class="event-timezone">${safeText(item.eventTime.split(' · ')[1] || '')}</span>` : 'آخر موعد للتقديم: ' + dateLabel(item.deadline)}</p>
        </div>
        <div class="listing-offer">
          <strong>${safeText(item.offer)}</strong>
          <button type="button" class="btn btn-orange"
            ${item.reward > 0 ? `data-payment-title="${safeText(item.title)}" data-payment-amount="${item.reward}" data-payment-kind="تذكرة فعالية"` : ''}
            aria-label="${item.reward > 0 ? 'دفع ثمن تذكرة' : 'عرض'} ${safeText(item.title)}">${item.reward > 0 ? 'دفع ←' : pageData.action + ' ↗'}</button>
          <a class="details-link" href="${detailFile}?id=${encodeURIComponent(item.id)}">التفاصيل الكاملة ←</a>
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
    const button = event.target.closest('button');
    if (!button || button.hasAttribute('data-payment-title')) return;
    const id = button.closest('.listing-card').dataset.item;
    openDetails(pageData.items.find(item => item.id === id));
  });

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
  get('resetEmpty').addEventListener('click', clearFilters);

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
