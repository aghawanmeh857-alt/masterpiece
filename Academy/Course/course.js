
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

// Fixed examples for this screen.
const courses = [
  {
    "id": "web",
    "title": "أساسيات تطوير المواقع",
    "category": "development",
    "level": "beginner",
    "format": "path",
    "price": 0,
    "hours": 16,
    "sessions": 8,
    "instructor": "عمر خليل",
    "symbol": "</>",
    "cover": "اكتب كود\nخطوتك الأولى",
    "description": "تعلّم HTML وCSS وJavaScript من خلال بناء موقع متجاوب من البداية.",
    "project": "موقع شخصي متجاوب يتضمن قائمة تنقّل تفاعلية ومعرض أعمال.",
    "syllabus": [
      "HTML: بنية الصفحة والعناصر الدلالية",
      "CSS: التخطيط والألوان والتصميم المتجاوب",
      "JavaScript: الأحداث والتفاعلات",
      "بناء موقع معرض أعمالك ومراجعته"
    ]
  },
  {
    "id": "ux",
    "title": "أساسيات تصميم واجهات وتجربة المستخدم",
    "category": "design",
    "level": "beginner",
    "format": "path",
    "price": 0,
    "hours": 12,
    "sessions": 6,
    "instructor": "لينا حداد",
    "symbol": "◈",
    "cover": "صمّم لأشخاص\nحقيقيين",
    "description": "حوّل احتياجات المستخدم إلى مسارات واضحة ومخططات ونماذج متقنة باستخدام Figma.",
    "project": "نموذج تفاعلي لتطبيق جوّال مع خطة مبسّطة لأبحاث المستخدمين.",
    "syllabus": [
      "فهم المستخدمين وتحديد المشكلة",
      "رسم مسارات الاستخدام ومخططات الواجهات",
      "بناء نظام بصري متناسق باستخدام Figma",
      "بناء نموذج أولي واختباره وتحسينه"
    ]
  },
  {
    "id": "portfolio",
    "title": "ابنِ معرض أعمال يروي قصتك",
    "category": "career",
    "level": "beginner",
    "format": "workshop",
    "price": 0,
    "hours": 2,
    "sessions": 1,
    "instructor": "سارة ناصر",
    "symbol": "↗",
    "cover": "دع أعمالك\nتتحدث عنك",
    "description": "اختر أفضل أعمالك وحوّلها إلى دراسات حالة توضح طريقة تفكيرك.",
    "project": "دراسة حالة مكتملة وخطة واضحة لمعرض أعمالك.",
    "syllabus": [
      "اختيار مشاريع تروي قصة واضحة",
      "شرح خطوات عملك وقراراتك",
      "عرض النتائج والدروس المستفادة"
    ]
  },
  {
    "id": "react",
    "title": "React: من المكوّنات إلى المنتجات",
    "category": "development",
    "level": "intermediate",
    "format": "path",
    "price": 49,
    "hours": 20,
    "sessions": 10,
    "instructor": "عمر خليل",
    "symbol": "{ }",
    "cover": "ابدأ صغيرًا\nوفكّر كبيرًا",
    "description": "تدرّب على المكوّنات والحالة وتدفّق البيانات من خلال لوحة متابعة تفاعلية متكاملة.",
    "project": "لوحة متابعة بـReact تتضمن مكوّنات قابلة لإعادة الاستخدام وفلاتر ونماذج تراعي سهولة الوصول.",
    "syllabus": [
      "بنية المكوّنات وخصائصها",
      "الحالة والأحداث وخطّافات قابلة لإعادة الاستخدام",
      "تحميل البيانات وحالات الخطأ",
      "بناء لوحة متابعة واختبارها وتحسينها"
    ]
  },
  {
    "id": "brand",
    "title": "تطبيقات عملية في الهوية البصرية",
    "category": "design",
    "level": "intermediate",
    "format": "workshop",
    "price": 25,
    "hours": 4,
    "sessions": 2,
    "instructor": "لينا حداد",
    "symbol": "Aa",
    "cover": "حوّل الأفكار\nإلى هوية",
    "description": "أنشئ هوية بصرية بفكرة واضحة ونظام خطوط ولوحة ألوان متناسقة.",
    "project": "دليل مختصر للهوية البصرية يتضمن تصوّر الشعار والخطوط والتطبيقات العملية.",
    "syllabus": [
      "تحديد شخصية العلامة التجارية",
      "استكشاف الخطوط والألوان",
      "إنشاء دليل مختصر للهوية البصرية وعرضه"
    ]
  },
  {
    "id": "marketing",
    "title": "انطلاقتك في التسويق الرقمي",
    "category": "marketing",
    "level": "beginner",
    "format": "path",
    "price": 35,
    "hours": 8,
    "sessions": 4,
    "instructor": "رامي صالح",
    "symbol": "◎",
    "cover": "تواصل مع\nجمهورك المناسب",
    "description": "خطّط لحملة واضحة، واكتب محتوى مفيدًا، وافهم مؤشرات الأداء المهمة.",
    "project": "تصوّر حملة وخطة محتوى لأسبوعين بأهداف قابلة للقياس.",
    "syllabus": [
      "الجمهور وموقع العلامة وأهداف الحملة",
      "تخطيط المحتوى وكتابته",
      "القنوات التسويقية وتنفيذ الحملة",
      "قياس الأداء وتحسين الخطة"
    ]
  }
];


(function () {
// The list and detail pages read the same example data.
const kind = document.body.dataset.kind;
const records = kind === 'course' ? courses : kind === 'project' ? projects : pageData.items;
const requestedId = new URLSearchParams(location.search).get('id');
const record = requestedId === null ? records[0] : records.find(item => String(item.id) === requestedId);
const get = id => document.getElementById(id);

window.componentsReady.then(() => {
  get('year').textContent = new Date().getFullYear();
}).catch(() => {});

const detailLabels = { '2-months': 'شهران', '3-months': '3 أشهر', '6-months': '6 أشهر', development: 'التطوير', design: 'التصميم', marketing: 'التسويق', career: 'المسار المهني والمجتمع', beginner: 'مبتدئ', intermediate: 'متوسط', remote: 'عن بُعد', onsite: 'من مقر العمل', hybrid: 'هجين', 'full-time': 'دوام كامل', 'part-time': 'دوام جزئي', contract: 'عقد مؤقت', workshop: 'ورشة عمل', path: 'مسار تعلّم', talk: 'جلسة حوارية', meetup: 'لقاء' };

function addFact(label, value) {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = kind === 'event' && value === 'remote' ? 'عبر الإنترنت' : detailLabels[value] || value;
  row.append(term, description);
  get('detailFacts').append(row);
}

function showList(id, values) {
  values.forEach(value => {
    const item = document.createElement('li');
    item.textContent = value;
    get(id).append(item);
  });
}

if (!record) {
  get('detailContent').hidden = true;
  get('notFound').hidden = false;
  get('notFound').focus();
} else {
  document.title = record.title + ' — OFOQ';
  get('detailTitle').textContent = record.title;
  get('detailDescription').textContent = record.description;
  get('detailDescription').insertAdjacentHTML('afterend', window.OfoqPublishers.card(window.OfoqPublishers.forRecord(kind, record)));
  addFact('المجال', record.category);

  if (kind === 'project') {
    addFact('الميزانية', '$' + record.budget);
    addFact('المدة', record.weeks === 1 ? 'أسبوع واحد' : record.weeks === 2 ? 'أسبوعان' : record.weeks + ' أسابيع');
    addFact('نوع المشروع', record.type === 'fixed' ? 'بسعر ثابت' : 'مشروع مستمر');
    showList('detailTasks', [record.description, 'الاتفاق على نطاق العمل والمراحل قبل البدء.', 'عرض العمل وتطبيق الملاحظات.']);
    showList('detailRequirements', record.skills.map(skill => 'خبرة في ' + skill));
    get('projectConversation').hidden = false;
  } else if (kind === 'course') {
    addFact('المدرّب', record.instructor);
    addFact('المستوى', record.level);
    addFact('المدة', record.hours + (record.hours >= 3 && record.hours <= 10 ? ' ساعات · ' : ' ساعة · ') + record.sessions + ' جلسات');
    addFact('السعر', record.price ? '$' + record.price + ' (مثال)' : 'مجاني');
    get('tasksTitle').textContent = 'ما الذي ستتعلّمه؟';
    showList('detailTasks', record.syllabus);
    get('requirementsTitle').textContent = 'مشروعك التطبيقي';
    showList('detailRequirements', [record.project]);
    get('courseLessons').hidden = false;
    record.syllabus.forEach(title => {
      const lesson = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = title;
      const text = document.createElement('p');
      text.textContent = 'نبذة توضيحية للدرس: ' + title + '. تدرّب على هذا الموضوع أثناء تنفيذ: ' + record.project;
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      label.append(checkbox, ' تحديد هذه الوحدة التوضيحية كمقروءة');
      lesson.append(summary, text, label);
      get('lessonList').append(lesson);
    });
    get('lessonList').addEventListener('change', () => {
      const read = get('lessonList').querySelectorAll('input:checked').length;
      get('lessonProgress').max = record.syllabus.length;
      get('lessonProgress').value = read;
      get('lessonStatus').textContent = read + ' من أصل ' + record.syllabus.length + ' وحدات مقروءة';
    });
    get('previewFormTitle').textContent = 'معاينة التسجيل بالمسار';
    get('messageField').hidden = true;
    get('previewMessage').required = false;
  } else {
    addFact('الجهة', record.company);
    addFact('الموقع', record.location);
    addFact('النوع', record.itemType);
    addFact('المقابل', record.offer);
    addFact(kind === 'event' ? 'تاريخ الفعالية' : 'آخر موعد للتقديم', new Intl.DateTimeFormat('ar-JO', {dateStyle:'medium', timeZone:'UTC'}).format(new Date(record.deadline+'T12:00:00Z')));
    showList('detailTasks', record.details);
    showList('detailRequirements', record.requirements);
    if (kind === 'event') {
      addFact('الوقت', record.eventTime);
      addFact('المكان', record.venue);
      get('tasksTitle').textContent = 'برنامج الفعالية';
      get('previewFormTitle').textContent = 'معاينة التسجيل بالفعالية';
      get('messageField').hidden = true;
      get('previewMessage').required = false;
    }
  }
}

// Paid items open the shared payment-method popup; free registration stays available.
if (record && kind === 'course' && record.price > 0) {
  const form = get('previewForm');
  form.hidden = true;
  get('previewFormTitle').textContent = 'دفع رسوم الدورة التدريبية';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-orange detail-payment-button';
  button.textContent = 'دفع ←';
  button.setAttribute('aria-label', 'دفع رسوم الدورة التدريبية ' + record.title);
  button.dataset.paymentTitle = record.title;
  button.dataset.paymentAmount = record.price;
  button.dataset.paymentKind = 'رسوم الدورة التدريبية';
  form.after(button);
}

get('previewForm').addEventListener('input', event => event.target.setCustomValidity(''));
get('previewForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  form.querySelectorAll('[required]').forEach(input => {
    input.setCustomValidity(input.value.trim() ? '' : 'يرجى إدخال نص.');
  });
  if (!form.reportValidity()) return;
  form.reset();
  form.hidden = true;
  get('previewSuccess').hidden = false;
  get('previewSuccess').focus();
});

get('previewAgain').addEventListener('click', () => {
  get('previewSuccess').hidden = true;
  get('previewForm').hidden = false;
  get('previewName').focus();
});


})();