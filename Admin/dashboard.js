
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
const sections = {
  overview: ['نظرة عامة', '◫', 'المحتوى والنشاط في مساحة واحدة.'],
  users: ['المستخدمون', '♙', 'إدارة الحسابات والحالات والصلاحيات التوضيحية.'],
  projects: ['العمل الحر', '▣', 'إدارة المشاريع ومراجعة تفاصيلها.'],
  jobs: ['الوظائف', '▤', 'فرص العمل والشركات وحالة النشر.'],
  internships: ['التدريب', '◇', 'إدارة فرص التدريب والجهات المقدّمة.'],
  courses: ['الأكاديمية', '▧', 'الدورات والمدرّبون والمحتوى التعليمي.'],
  events: ['الفعاليات', '▦', 'اللقاءات والورش وتفاصيل التسجيل.'],
  community: ['المجتمع', '◌', 'مراجعة المنشورات والتعليقات التوضيحية.'],
  messages: ['الرسائل', '✉', 'متابعة رسائل الدعم وكتابة ردود تجريبية.'],
  review: ['المراجعة', '✓', 'المحتوى الذي ينتظر الموافقة من مختلف الأقسام.'],
  settings: ['إعدادات الموقع', '⚙', 'معاينة الهوية والألوان دون تغيير الموقع.'],
  scene: ['المشهد والأنيميشن', '◈', 'تجربة إعدادات الحركة في نموذج مبسّط.'],
  logs: ['سجل التغييرات', '↺', 'العمليات المؤقتة خلال الجلسة الحالية.']
};
const statusLabels = { published: 'منشور / نشط', pending: 'بانتظار المراجعة', archived: 'مؤرشف / معطّل' };
const roleLabels = { member: 'مستخدم', editor: 'محرر', admin: 'أدمن' };
const contentKeys = ['projects', 'jobs', 'internships', 'courses', 'events', 'community'];

function createModel(data) {
  const activity = [{ title: 'معاينة لوحة الإدارة', detail: 'هذه شاشة عرض فقط؛ لا يتم حفظ أو إرسال أي بيانات.' }];
  const all = keys => keys.flatMap(section => data[section].map(record => ({ ...record, section })));
  function list(section, search = '', status = '') {
    const records = section === 'review' ? all(contentKeys).filter(item => item.status === 'pending') : all([section]);
    const query = search.trim().toLowerCase();
    return records.filter(record => (!status || record.status === status) && [record.title, record.owner, record.category, record.description].join(' ').toLowerCase().includes(query));
  }
  return { data, activity, all, list };
}
const examples = {
  "projects": [
    {
      "id": "1",
      "title": "لوحة متابعة بـReact لشركة خدمات لوجستية",
      "owner": "فريق أفق",
      "category": "development",
      "description": "بناء لوحة إدارة تتضمن رسومًا بيانية وأدوارًا للمستخدمين.",
      "date": "2026-10-08",
      "status": "pending"
    },
    {
      "id": "2",
      "title": "إعادة تصميم واجهات تطبيق جوّال",
      "owner": "فريق أفق",
      "category": "design",
      "description": "إعادة تصميم شاشات تطبيق لياقة بدنية قائم.",
      "date": "2026-10-07",
      "status": "published"
    },
    {
      "id": "3",
      "title": "صفحة تعريفية لمنتج برمجي",
      "owner": "فريق أفق",
      "category": "development",
      "description": "صفحة تعريفية متجاوبة تعرض الأسعار ونموذج التواصل.",
      "date": "2026-10-06",
      "status": "published"
    },
    {
      "id": "4",
      "title": "محتوى تواصل اجتماعي لمقهى",
      "owner": "فريق أفق",
      "category": "marketing",
      "description": "خطة شهرية للمنشورات والقصص على Instagram.",
      "date": "2026-10-05",
      "status": "published"
    }
  ],
  "courses": [
    {
      "id": "web",
      "title": "أساسيات تطوير المواقع",
      "owner": "عمر خليل",
      "category": "development",
      "description": "تعلّم HTML وCSS وJavaScript من خلال بناء موقع متجاوب من البداية.",
      "date": "2026-10-13",
      "status": "pending"
    },
    {
      "id": "ux",
      "title": "أساسيات تصميم واجهات وتجربة المستخدم",
      "owner": "لينا حداد",
      "category": "design",
      "description": "حوّل احتياجات المستخدم إلى مسارات واضحة ومخططات ونماذج متقنة باستخدام Figma.",
      "date": "2026-10-13",
      "status": "published"
    },
    {
      "id": "portfolio",
      "title": "ابنِ معرض أعمال يروي قصتك",
      "owner": "سارة ناصر",
      "category": "career",
      "description": "اختر أفضل أعمالك وحوّلها إلى دراسات حالة توضح طريقة تفكيرك.",
      "date": "2026-10-13",
      "status": "published"
    },
    {
      "id": "react",
      "title": "React: من المكوّنات إلى المنتجات",
      "owner": "عمر خليل",
      "category": "development",
      "description": "تدرّب على المكوّنات والحالة وتدفّق البيانات من خلال لوحة متابعة تفاعلية متكاملة.",
      "date": "2026-10-13",
      "status": "published"
    },
    {
      "id": "brand",
      "title": "تطبيقات عملية في الهوية البصرية",
      "owner": "لينا حداد",
      "category": "design",
      "description": "أنشئ هوية بصرية بفكرة واضحة ونظام خطوط ولوحة ألوان متناسقة.",
      "date": "2026-10-13",
      "status": "pending"
    },
    {
      "id": "marketing",
      "title": "انطلاقتك في التسويق الرقمي",
      "owner": "رامي صالح",
      "category": "marketing",
      "description": "خطّط لحملة واضحة، واكتب محتوى مفيدًا، وافهم مؤشرات الأداء المهمة.",
      "date": "2026-10-13",
      "status": "archived"
    }
  ],
  "jobs": [
    {
      "id": "frontend-job",
      "title": "مطوّر واجهات أمامية",
      "owner": "برايت لابز",
      "category": "development",
      "description": "ابنِ واجهات سريعة وسهلة الوصول بالتعاون مع فريق المنتج والتصميم.",
      "date": "2026-10-10",
      "status": "pending"
    },
    {
      "id": "designer-job",
      "title": "مصمم منتجات",
      "owner": "استوديو نورث",
      "category": "design",
      "description": "قُد تصميم تجارب منتجات واضحة، من البحث حتى التسليم.",
      "date": "2026-10-09",
      "status": "published"
    },
    {
      "id": "community-job",
      "title": "منسّق مجتمع",
      "owner": "مجتمع المسار المهني",
      "category": "marketing",
      "description": "اجمع الناس من خلال محتوى مفيد وفعاليات صغيرة وحوارات ترحّب بالجميع.",
      "date": "2026-10-08",
      "status": "published"
    },
    {
      "id": "content-job",
      "title": "مصمم محتوى",
      "owner": "أورنج كولكتيف",
      "category": "marketing",
      "description": "اكتب محتوى واضحًا للمنتجات وساعد الفرق على شرح الأفكار المعقّدة بلغة بسيطة.",
      "date": "2026-10-07",
      "status": "published"
    }
  ],
  "internships": [
    {
      "id": "design-intern",
      "title": "متدرّب تصميم واجهات وتجربة المستخدم",
      "owner": "استوديو نورث",
      "category": "design",
      "description": "ساهم في تحويل أبحاث المستخدمين إلى مخططات ونماذج أولية مع فريق تصميم ذي خبرة.",
      "date": "2026-10-10",
      "status": "pending"
    },
    {
      "id": "web-intern",
      "title": "متدرّب تطوير واجهات أمامية",
      "owner": "برايت لابز",
      "category": "development",
      "description": "تدرّب على HTML وCSS وJavaScript من خلال مهام واجهات ومراجعات دورية للكود.",
      "date": "2026-10-09",
      "status": "published"
    },
    {
      "id": "marketing-intern",
      "title": "متدرّب تسويق رقمي",
      "owner": "أورنج كولكتيف",
      "category": "marketing",
      "description": "ساهم في تخطيط المحتوى وأبحاث الحملات، وتعرّف على طريقة عمل فرق التسويق.",
      "date": "2026-10-08",
      "status": "published"
    },
    {
      "id": "backend-intern",
      "title": "متدرّب تطوير برمجيات خلفية",
      "owner": "كلاود وركس",
      "category": "development",
      "description": "تعلّم تطوير واجهات البرمجة وقواعد البيانات من خلال مهام برمجة خلفية صغيرة.",
      "date": "2026-10-07",
      "status": "published"
    }
  ],
  "events": [
    {
      "id": "ideas-event",
      "title": "أمسية صنّاع الأفكار",
      "owner": "مجتمع أفق",
      "category": "career",
      "description": "تعرّف على صنّاع آخرين، وشارك مشروعًا صغيرًا، وابنِ علاقات جديدة.",
      "date": "2026-10-10",
      "status": "pending"
    },
    {
      "id": "product-event",
      "title": "ابنِ منتجك الأول",
      "owner": "برايت لابز",
      "category": "development",
      "description": "حوّل فكرة صغيرة إلى نموذج يعمل من خلال ورشة عملية بإرشاد مختصين.",
      "date": "2026-10-09",
      "status": "published"
    },
    {
      "id": "design-event",
      "title": "التصميم لأشخاص حقيقيين",
      "owner": "استوديو نورث",
      "category": "design",
      "description": "حوار حول الأبحاث وسهولة الوصول والقرارات التي تصنع منتجات أفضل.",
      "date": "2026-10-08",
      "status": "published"
    },
    {
      "id": "freelance-event",
      "title": "لقاء المستقلين على القهوة",
      "owner": "أورنج كولكتيف",
      "category": "career",
      "description": "تبادل الأفكار حول الوصول إلى العملاء وإدارة المشاريع وبناء عمل مستدام.",
      "date": "2026-10-07",
      "status": "published"
    }
  ],
  "users": [
    {
      "id": "admin",
      "title": "أدمن أفق",
      "owner": "admin@example.com",
      "category": "الإدارة",
      "role": "admin",
      "status": "published",
      "date": "2026-10-13",
      "description": "حساب توضيحي؛ لا يمنح صلاحيات حقيقية."
    },
    {
      "id": "user-0",
      "title": "أحمد خالد",
      "owner": "member0@example.com",
      "category": "مستقل",
      "role": "editor",
      "status": "published",
      "date": "2026-10-13",
      "description": "حساب توضيحي."
    },
    {
      "id": "user-1",
      "title": "ليان عمر",
      "owner": "member1@example.com",
      "category": "متعلّم",
      "role": "member",
      "status": "published",
      "date": "2026-10-13",
      "description": "حساب توضيحي."
    },
    {
      "id": "user-2",
      "title": "سارة يوسف",
      "owner": "member2@example.com",
      "category": "مستقل",
      "role": "member",
      "status": "published",
      "date": "2026-10-13",
      "description": "حساب توضيحي."
    },
    {
      "id": "user-3",
      "title": "عمر علي",
      "owner": "member3@example.com",
      "category": "متعلّم",
      "role": "member",
      "status": "published",
      "date": "2026-10-13",
      "description": "حساب توضيحي."
    },
    {
      "id": "user-4",
      "title": "نور محمد",
      "owner": "member4@example.com",
      "category": "مستقل",
      "role": "member",
      "status": "archived",
      "date": "2026-10-13",
      "description": "حساب توضيحي."
    }
  ],
  "community": [
    {
      "id": "post-1",
      "title": "أبحث عن مصمم لهوية مشروع جديد",
      "owner": "ليان عمر",
      "category": "فكرة مشروع",
      "status": "pending",
      "date": "2026-10-13",
      "description": "منشور توضيحي للمراجعة."
    },
    {
      "id": "post-2",
      "title": "تجربتي في بناء أول موقع",
      "owner": "أحمد خالد",
      "category": "مشاركة خبرة",
      "status": "published",
      "date": "2026-10-12",
      "description": "تعليق توضيحي: شكرًا على مشاركة التجربة."
    }
  ],
  "messages": [
    {
      "id": "message-1",
      "title": "استفسار عن دورة تطوير الويب",
      "owner": "learner@example.com",
      "category": "دعم الأكاديمية",
      "status": "pending",
      "date": "2026-10-13",
      "description": "هل الدورة مناسبة للمبتدئين؟ اكتب الرد في هذا الحقل."
    },
    {
      "id": "message-2",
      "title": "طلب معلومات عن التدريب",
      "owner": "intern@example.com",
      "category": "دعم الفرص",
      "status": "published",
      "date": "2026-10-12",
      "description": "هذه رسالة توضيحية؛ لا تُرسل الردود إلى بريد حقيقي."
    }
  ]
};
const $ = id => document.getElementById(id);
const make = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
let model, current = 'overview', page = 1, editing = null, deleting = null, toastTimer;
const pageSize = 7;
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function action(text, actionName, record, className = 'secondary') { const button = make('button', text, className); button.type = 'button'; button.dataset.action = actionName; button.dataset.id = record.id; button.dataset.section = record.section; return button; }
function activityList(target, limit) { $(target).replaceChildren(...model.activity.slice(0, limit).map(item => { const row = make('div', undefined, 'activity-row'); const detail = make('div'); detail.append(make('strong', item.title), make('small', item.detail)); row.append(make('span', '', 'activity-dot'), detail); return row; })); }
function overview() {
  const content = model.all(contentKeys), pending = content.filter(item => item.status === 'pending');
  const stats = [['المستخدمون', model.data.users.length, '♙', 'حسابات توضيحية'], ['الفرص', model.data.projects.length + model.data.jobs.length + model.data.internships.length, '▣', 'مشاريع ووظائف وتدريب'], ['الدورات والفعاليات', model.data.courses.length + model.data.events.length, '▦', 'تعلّم وتواصل'], ['بانتظار المراجعة', pending.length, '✓', 'سجلات تحتاج الموافقة']];
  $('stats').replaceChildren(...stats.map(([title, count, icon, note]) => { const card = make('article', undefined, 'stat'), top = make('div', undefined, 'stat-top'); top.append(make('span', title), make('span', icon, 'stat-icon')); card.append(top, make('strong', count.toLocaleString('ar')), make('small', note)); return card; }));
  const max = Math.max(1, ...contentKeys.map(key => model.data[key].length));
  $('contentChart').replaceChildren(...contentKeys.map(key => { const row = make('div', undefined, 'bar-row'), track = make('div', undefined, 'bar-track'), fill = make('div', undefined, 'bar-fill'); fill.style.width = model.data[key].length / max * 100 + '%'; track.append(fill); row.append(make('span', sections[key][0]), track, make('strong', model.data[key].length)); return row; }));
  const counts = ['published', 'pending', 'archived'].map(status => content.filter(item => item.status === status).length);
  const total = content.length, first = total ? counts[0] / total * 100 : 0, second = total ? (counts[0] + counts[1]) / total * 100 : 0;
  const layout = make('div', undefined, 'donut-layout'), donut = make('div', undefined, 'donut'), legend = make('div', undefined, 'legend');
  donut.style.background = total ? `conic-gradient(#46b88f 0 ${first}%, #ff783d ${first}% ${second}%, #8b9bb1 ${second}% 100%)` : 'var(--surface-raised)';
  const label = make('strong', total); label.append(make('small', 'إجمالي المحتوى')); donut.append(label);
  ['published', 'pending', 'archived'].forEach((status, i) => { const item = make('span'), marker = make('i'); marker.style.background = ['#46b88f', '#ff783d', '#8b9bb1'][i]; item.append(marker, make('span', statusLabels[status] + ' · ' + counts[i])); legend.append(item); });
  layout.append(donut, legend); $('statusChart').replaceChildren(layout);
  $('reviewList').replaceChildren(...pending.slice(0, 4).map(record => { const row = make('div', undefined, 'review-row'), detail = make('div'); detail.append(make('strong', record.title), make('small', sections[record.section][0] + ' · ' + record.owner)); row.append(detail, action('مراجعة', 'edit', record)); return row; }));
  if (!pending.length) $('reviewList').append(make('p', 'كل المحتوى تمت مراجعته.', 'muted'));
  activityList('activityList', 4);
}
function records() {
  const items = model.list(current, $('search').value, $('statusFilter').value), pages = Math.max(1, Math.ceil(items.length / pageSize)); page = Math.min(page, pages);
  $('resultCount').textContent = items.length + ' سجل'; $('tableCaption').textContent = sections[current][0];
  const head = make('tr'); ['العنوان / الاسم', 'الجهة / المسؤول', current === 'users' ? 'الصلاحية' : 'التصنيف', 'الحالة', 'إجراءات'].forEach(title => head.append(make('th', title))); $('tableHead').replaceChildren(head);
  $('tableBody').replaceChildren(...items.slice((page - 1) * pageSize, page * pageSize).map(record => {
    const row = make('tr'), title = make('td'), owner = make('td', record.owner), category = make('td', current === 'users' ? roleLabels[record.role] : record.category), status = make('td'), buttons = make('td'), controls = make('div', undefined, 'row-actions');
    title.append(make('strong', record.title), make('small', current === 'review' ? sections[record.section][0] : record.date));
    status.append(make('span', statusLabels[record.status], 'badge ' + record.status)); controls.append(action(current === 'messages' ? 'عرض / رد' : 'تعديل', 'edit', record));
    if (record.status === 'pending' && contentKeys.includes(record.section)) controls.append(action('اعتماد', 'approve', record));
    controls.append(action('حذف', 'delete', record)); buttons.append(controls); row.append(title, owner, category, status, buttons); return row;
  }));
  $('emptyState').hidden = items.length !== 0; $('previousPage').disabled = page <= 1; $('nextPage').disabled = page >= pages; $('pageNumber').textContent = `صفحة ${page} من ${pages}`;
}
function show(view, updateHash = true) {
  current = sections[view] ? view : 'overview'; page = 1;
  $('pageTitle').textContent = sections[current][0]; $('pageDescription').textContent = sections[current][2]; $('breadcrumb').textContent = sections[current][0];
  ['overview', 'records', 'settings', 'scene', 'logs'].forEach(key => $(key + 'عرض').hidden = key !== (model.data[current] || current === 'review' ? 'records' : current));
  document.querySelectorAll('#navigation button').forEach(button => { if (button.dataset.view === current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  $('addButton').hidden = !model.data[current]; $('addButton').textContent = '+ إضافة ' + (current === 'users' ? 'مستخدم' : 'سجل');
  $('search').value = ''; $('statusFilter').value = ''; render();
  $('sidebar').classList.remove('open'); $('menuButton').setAttribute('aria-expanded', 'false');
  if (updateHash) history.replaceState(null, '', '#' + current);
}
function render() { overview(); if (model.data[current] || current === 'review') records(); activityList('fullActivity', model.activity.length); }
function openEditor(section, id = null) {
  const record = id === null ? null : model.data[section]?.find(item => item.id === id); if (id !== null && !record) return;
  editing = { section, id }; const form = $('recordForm'); form.reset();
  for (const field of ['title', 'owner', 'category', 'description', 'status', 'role']) if (record) form.elements.namedItem(field).value = record[field] || '';
  $('editorTitle').textContent = (record ? 'تعديل · ' : 'إضافة · ') + sections[section][0]; $('roleLabel').hidden = section !== 'users';
  $('titleLabel').firstChild.textContent = section === 'users' ? 'الاسم' : 'العنوان'; $('ownerLabel').firstChild.textContent = section === 'users' ? 'البريد الإلكتروني' : 'المسؤول / الجهة';
  $('editor').showModal(); form.elements.title.focus();
}
function scenePreview() {
  const form = $('sceneSettings'), duration = form.elements.duration.value, smoothness = form.elements.smoothness.value;
  $('durationValue').textContent = duration + ' ثانية'; $('smoothnessValue').textContent = smoothness + ' ثانية';
  $('sceneSummary').textContent = `مدة الاقتراب: ${duration} ثانية · نعومة السكرول: ${smoothness} ثانية.`;
  const demo = $('sceneDemo'); demo.style.setProperty('--duration', duration + 's'); demo.querySelector('.demo-city').hidden = !form.elements.city.checked; demo.querySelector('.demo-person').hidden = !form.elements.people.checked;
  demo.classList.remove('playing'); void demo.offsetWidth; if (form.elements.autoplay.checked) demo.classList.add('playing');
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || !model) return;
  if (button.dataset.close) $(button.dataset.close).close();
  if (button.dataset.view) show(button.dataset.view);
  if (button.dataset.create) openEditor(button.dataset.create);
  const { action: name, section, id } = button.dataset;
  if (name === 'edit') openEditor(section, id);
  if (name === 'approve') toast('هذه شاشة عرض فقط؛ لا يتم حفظ أو إرسال أي بيانات.');
  if (name === 'delete') { deleting = { section, id }; $('deleteText').textContent = model.data[section].find(item => item.id === id)?.title || ''; $('deleteDialog').showModal(); }
});
$('confirmDelete').addEventListener('click', () => { $('deleteDialog').close(); toast('هذه شاشة عرض فقط؛ لا يتم حفظ أو إرسال أي بيانات.'); });
$('addButton').addEventListener('click', () => openEditor(current));
for (const id of ['search', 'statusFilter']) $(id).addEventListener(id === 'search' ? 'input' : 'change', () => { page = 1; records(); });
$('previousPage').addEventListener('click', () => { page--; records(); }); $('nextPage').addEventListener('click', () => { page++; records(); });
$('menuButton').addEventListener('click', () => { const open = $('sidebar').classList.toggle('open'); $('menuButton').setAttribute('aria-expanded', String(open)); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('sidebar').classList.remove('open'); $('menuButton').setAttribute('aria-expanded', 'false'); } });
$('sceneSettings').addEventListener('input', () => { $('durationValue').textContent = $('sceneSettings').elements.duration.value + ' ثانية'; $('smoothnessValue').textContent = $('sceneSettings').elements.smoothness.value + ' ثانية'; });
$('replayScene').addEventListener('click', scenePreview);
try {
  model = createModel(examples);
  $('navigation').replaceChildren(...Object.entries(sections).map(([key, [title, icon]]) => { const button = make('button'); button.type = 'button'; button.dataset.view = key; button.append(make('span', icon, 'nav-icon'), make('span', title)); return button; }));
  $('today').textContent = new Intl.DateTimeFormat('ar-JO', { dateStyle: 'long', timeZone: 'Asia/Amman' }).format(new Date()); $('year').textContent = new Date().getFullYear();
  show(location.hash.slice(1), false); scenePreview(); addEventListener('hashchange', () => show(location.hash.slice(1), false));
} catch (error) { $('pageDescription').textContent = 'تعذّر تحميل البيانات التوضيحية. افتح اللوحة عبر خادم الموقع أو Live Server.'; $('addButton').disabled = true; console.error(error); }

})();