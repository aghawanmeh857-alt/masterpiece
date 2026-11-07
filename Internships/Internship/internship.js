// بيانات تجريبية. عدّل القائمة هنا لإضافة فرص أو فعاليات.
const pageData = {
  "section": "internships",
  "noun": "internships",
  "action": "التقديم على التدريب",
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
      "بمكافأة للمتدرّب"
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
      "extra": "fee",
      "reward": 0,
      "applicationFee": 75,
      "offer": "75 دولار · رسوم التدريب",
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


(function () {
// The list and detail pages read the same example data.
const kind = document.body.dataset.kind;
if (window.OfoqFrontend?.contentFor) pageData.items = window.OfoqFrontend.contentFor('internships', pageData.items);
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
  document.title = record.title + ' — SAEI';
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
    addFact('نمط العمل', record.location);
    addFact('مدة التدريب', record.itemType);
    addFact(Number(record.applicationFee || 0) > 0 ? 'رسوم التدريب' : 'المكافأة', record.offer);
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

if(record&&Number(record.applicationFee||0)>0&&window.OfoqPayment){
  get('previewForm').hidden=true;
  const pay=document.createElement('button');pay.type='button';pay.className='btn btn-orange';pay.textContent='التقديم والدفع · '+record.applicationFee+' دولار';
  pay.addEventListener('click',()=>window.OfoqPayment.open({title:record.title,amount:Number(record.applicationFee),kind:'رسوم التدريب',onComplete:()=>{window.OfoqFrontend.apply('internship',record.id,record.title,location.href);pay.textContent='✓ تم التقديم';pay.disabled=true;}}));
  get('previewForm').before(pay);
}
get('previewForm').addEventListener('input', event => event.target.setCustomValidity(''));
get('previewForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  form.querySelectorAll('[required]').forEach(input => {
    input.setCustomValidity(input.value.trim() ? '' : 'يرجى إدخال نص.');
  });
  if (!form.reportValidity()) return;
  window.OfoqFrontend.apply('internship', record.id, record.title, location.href);
  form.reset();
  form.hidden = true;
  get('previewSuccess').querySelector('h3') && (get('previewSuccess').querySelector('h3').textContent = 'تم تقديم الطلب');
  get('previewSuccess').querySelector('p') && (get('previewSuccess').querySelector('p').textContent = 'يمكنك متابعة نشاطك من لوحة المتابعة خلال هذه الزيارة.');
  get('previewSuccess').hidden = false;
  get('previewSuccess').focus();
});

get('previewAgain').addEventListener('click', () => {
  get('previewSuccess').hidden = true;
  get('previewForm').hidden = false;
  get('previewName').focus();
});


})();
