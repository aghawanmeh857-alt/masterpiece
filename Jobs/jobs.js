
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
  "section": "jobs",
  "noun": "jobs",
  "action": "عرض الوظيفة",
  "types": [
    [
      "full-time",
      "دوام كامل"
    ],
    [
      "part-time",
      "دوام جزئي"
    ],
    [
      "contract",
      "عقد مؤقت"
    ]
  ],
  "extras": [
    [
      "junior",
      "مبتدئ"
    ],
    [
      "mid",
      "متوسط الخبرة"
    ],
    [
      "senior",
      "خبير"
    ]
  ],
  "items": [
    {
      "id": "frontend-job",
      "title": "مطوّر واجهات أمامية",
      "company": "برايت لابز",
      "category": "development",
      "location": "remote",
      "itemType": "full-time",
      "extra": "mid",
      "reward": 1800,
      "offer": "1,800 دولار / شهر",
      "date": "2026-10-10",
      "deadline": "2026-11-10",
      "symbol": "</>",
      "description": "ابنِ واجهات سريعة وسهلة الوصول بالتعاون مع فريق المنتج والتصميم.",
      "details": [
        "بناء مكوّنات React قابلة لإعادة الاستخدام",
        "التعاون مع فرق التصميم والبرمجة الخلفية",
        "تحسين الأداء وسهولة الوصول"
      ],
      "requirements": [
        "خبرة سنتين أو أكثر في تطوير الواجهات",
        "إتقان JavaScript وReact وHTML وCSS",
        "معرض أعمال لواجهات منشورة"
      ]
    },
    {
      "id": "designer-job",
      "title": "مصمم منتجات",
      "company": "استوديو نورث",
      "category": "design",
      "location": "hybrid",
      "itemType": "full-time",
      "extra": "senior",
      "reward": 2200,
      "offer": "2,200 دولار / شهر",
      "date": "2026-10-09",
      "deadline": "2026-11-05",
      "symbol": "◈",
      "description": "قُد تصميم تجارب منتجات واضحة، من البحث حتى التسليم.",
      "details": [
        "قيادة استكشاف المنتج وتصميمه",
        "إنشاء نماذج أولية وإجراء اختبارات سهولة الاستخدام",
        "المساهمة في تطوير نظام التصميم"
      ],
      "requirements": [
        "خبرة 4 سنوات أو أكثر في تصميم المنتجات",
        "مهارات قوية في Figma والأبحاث",
        "دراسات حالة توضّح قراراتك"
      ]
    },
    {
      "id": "community-job",
      "title": "منسّق مجتمع",
      "company": "مجتمع المسار المهني",
      "category": "marketing",
      "location": "onsite",
      "itemType": "part-time",
      "extra": "junior",
      "reward": 650,
      "offer": "650 دولار / شهر",
      "date": "2026-10-08",
      "deadline": "2026-10-25",
      "symbol": "◎",
      "description": "اجمع الناس من خلال محتوى مفيد وفعاليات صغيرة وحوارات ترحّب بالجميع.",
      "details": [
        "دعم التواصل مع المجتمع",
        "تنسيق اللقاءات وملاحظات الأعضاء",
        "إعداد تقارير مبسّطة للتفاعل"
      ],
      "requirements": [
        "مهارات تواصل وتنظيم واضحة",
        "اهتمام ببناء المجتمعات",
        "خبرة بأدوات التواصل الاجتماعي"
      ]
    },
    {
      "id": "content-job",
      "title": "مصمم محتوى",
      "company": "أورنج كولكتيف",
      "category": "marketing",
      "location": "remote",
      "itemType": "contract",
      "extra": "mid",
      "reward": 1200,
      "offer": "1,200 دولار / شهر",
      "date": "2026-10-07",
      "deadline": "2026-11-01",
      "symbol": "Aa",
      "description": "اكتب محتوى واضحًا للمنتجات وساعد الفرق على شرح الأفكار المعقّدة بلغة بسيطة.",
      "details": [
        "كتابة محتوى الواجهات وتهيئة المستخدمين",
        "تطوير إرشادات أسلوب الكتابة ونبرتها",
        "اختبار المحتوى وتحسينه مع الفريق"
      ],
      "requirements": [
        "معرض أعمال في الكتابة أو المحتوى",
        "خبرة في المنتجات الرقمية",
        "مهارات قوية في التحرير والتعاون"
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
    const detailUrl = detailFile + '?id=' + encodeURIComponent(item.id);
    const cover = {development: 'dashboard', design: 'mobile', marketing: 'marketing', career: 'code'}[item.category] || 'dashboard';
    return `
      <article class="listing-card" data-item="${item.id}">
        <div class="opportunity-media"><a class="opportunity-cover" href="${detailUrl}" aria-label="تفاصيل ${safeText(item.title)}"><img src="../assets/project-covers/${cover}.svg" alt="" width="800" height="450" loading="lazy"><span class="opportunity-badge">${labels[item.itemType]}</span></a></div>
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
          <p class="listing-date">${isEvent ? safeText(item.eventTime) : 'آخر موعد للتقديم: ' + dateLabel(item.deadline)}</p>
        </div>
        <div class="listing-offer">
          <strong>${safeText(item.offer)}</strong>
          <button type="button" class="btn btn-orange" aria-label="عرض ${safeText(item.title)}">${pageData.action} ↗</button>
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
  get('resetEmpty').addEventListener('click', clearFilters);

  get('previewForm').addEventListener('submit', event => {
    event.preventDefault();
    get('previewForm').querySelectorAll('input[type="text"], input:not([type]), textarea').forEach(input => {
      input.value = input.value.trim();
    });
    if (!get('previewForm').reportValidity()) return;
    get('previewForm').reset();
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
