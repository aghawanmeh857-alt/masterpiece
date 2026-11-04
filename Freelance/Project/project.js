// Fixed examples for this screen.
const projects = [
  {
    id: 1,
    title: "لوحة متابعة بـReact لشركة خدمات لوجستية",
    description: "بناء لوحة إدارة تتضمن رسومًا بيانية وأدوارًا للمستخدمين.",
    skills: ["React", "Node.js", "رسوم بيانية"],
    category: "development",
    budget: 800,
    weeks: 3,
    type: "fixed",
    date: "2026-10-08",
    icon: "dashboard",
    color: "orange"
  },
  {
    id: 2,
    title: "إعادة تصميم واجهات تطبيق جوّال",
    description: "إعادة تصميم شاشات تطبيق لياقة بدنية قائم.",
    skills: ["Figma", "UI/UX"],
    category: "design",
    budget: 450,
    weeks: 2,
    type: "fixed",
    date: "2026-10-07",
    icon: "mobile",
    color: "blue"
  },
  {
    id: 3,
    title: "صفحة تعريفية لمنتج برمجي",
    description: "صفحة تعريفية متجاوبة تعرض الأسعار ونموذج التواصل.",
    skills: ["HTML", "CSS"],
    category: "development",
    budget: 300,
    weeks: 1,
    type: "fixed",
    date: "2026-10-06",
    icon: "code",
    color: "green"
  },
  {
    id: 4,
    title: "محتوى تواصل اجتماعي لمقهى",
    description: "خطة شهرية للمنشورات والقصص على Instagram.",
    skills: ["التسويق الرقمي"],
    category: "marketing",
    budget: 200,
    weeks: 4,
    type: "ongoing",
    date: "2026-10-05",
    icon: "marketing",
    color: "purple"
  }
];


if (window.OfoqFrontend?.contentFor) projects.splice(0, projects.length, ...window.OfoqFrontend.contentFor('projects',projects));

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

