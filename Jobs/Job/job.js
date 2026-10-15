
// Forms are interface examples. Only search and filter forms process their inputs.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (['searchForm', 'filterForm', 'jobApplicationForm'].includes(form.id)) return;
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
    }
  }
}


// The application opens here without storing or sending its contents.
const applicationDialog = get('jobApplicationDialog');
const applicationForm = get('jobApplicationForm');
const applicationStatus = get('jobApplicationStatus');
get('applyForJob').addEventListener('click', () => {
  if (!record) return;
  applicationForm.reset();
  applicationForm.hidden = false;
  applicationStatus.hidden = true;
  get('applicationJobTitle').textContent = record.title;
  applicationDialog.showModal();
});
get('closeJobApplication').addEventListener('click', () => applicationDialog.close());
applicationDialog.addEventListener('close', () => applicationForm.reset());
applicationForm.addEventListener('submit', event => {
  event.preventDefault();
  applicationForm.querySelectorAll('input:not([type]), textarea').forEach(input => {
    input.value = input.value.trim();
  });
  if (!applicationForm.reportValidity()) return;
  applicationForm.reset();
  applicationForm.hidden = true;
  applicationStatus.textContent = 'اكتملت معاينة الطلب. مُسحت معلوماتك والملف المحدد دون حفظ أو إرسال.';
  applicationStatus.hidden = false;
  applicationStatus.focus();
});

})();
