
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


(async function () {
// 1) انتظر تحميل النافبار والفلاتر والفوتر قبل ربط الأحداث.
async function startAcademy() {
  if (!window.componentsReady) {
    throw new Error('Page initialization is unavailable.');
  }
  await window.componentsReady;

  // بيانات تجريبية: عدّل المسارات والأسعار والخطة التعليمية هنا.


  const labels = {
    development: 'التطوير', design: 'التصميم', marketing: 'التسويق',
    career: 'مهارات مهنية', beginner: 'مبتدئ', intermediate: 'متوسط',
    path: 'مسار تعلّم', workshop: 'ورشة عمل'
  };

  function get(id) {
    return document.getElementById(id);
  }

  function priceLabel(price) {
    return price === 0 ? 'مجاني' : '$' + price;
  }

  // استخدم النص بأمان داخل HTML، حتى لو أضفت أسماء تحتوي على رموز.
  function safeText(text) {
    const span = document.createElement('span');
    span.textContent = text;
    return span.innerHTML.replace(/"/g, '&quot;');
  }

  // 2) اقرأ الفلاتر، ثم رتّب المسارات واعرض البطاقات.
  function renderCourses() {
    const query = get('searchQuery').value.trim().toLowerCase();
    const category = get('category').value;
    const level = get('level').value;
    const format = get('format').value;
    const price = get('price').value;
    const sort = get('sortBy').value;

    const filtered = courses.filter(course => {
      const searchableText = [course.title, course.description, course.category,
        course.instructor, ...course.syllabus].join(' ').toLowerCase();

      if (query && !searchableText.includes(query)) return false;
      if (category && course.category !== category) return false;
      if (level && course.level !== level) return false;
      if (format && course.format !== format) return false;
      if (price === 'free' && course.price !== 0) return false;
      if (price === 'paid' && course.price === 0) return false;
      return true;
    });

    if (sort === 'duration') filtered.sort((a, b) => a.hours - b.hours);
    if (sort === 'price') filtered.sort((a, b) => a.price - b.price);

    get('courseList').innerHTML = filtered.map(courseCard).join('');
    get('resultCount').textContent = filtered.length + ' مسارات تعلّم متاحة';
    get('emptyState').hidden = filtered.length > 0;
  }

  function courseCard(course) {
    return `
      <article class="course-card" data-course="${course.id}">
        <div class="course-cover ${course.category}">
          <span class="course-symbol" aria-hidden="true">${safeText(course.symbol)}</span>
          <span class="cover-caption" aria-hidden="true">${safeText(course.cover)}</span>

        </div>
        <div class="course-body">
          <p class="course-category">${labels[course.category]} / ${labels[course.format]}</p>
          <h2>${safeText(course.title)}</h2>
          <p class="course-description">${safeText(course.description)}</p>
          ${window.OfoqPublishers.card(window.OfoqPublishers.forRecord("course", course))}
          <div class="course-meta">
            <span>${labels[course.level]}</span>
            <span>${course.hours} ${course.hours >= 3 && course.hours <= 10 ? 'ساعات' : 'ساعة'}</span>
            <span>${course.sessions} ${course.sessions === 1 ? 'جلسة' : 'جلسات'}</span>
          </div>
          <div class="course-bottom">
            <span class="course-price">${priceLabel(course.price)}</span>
            <button class="btn btn-orange" type="button" data-action="${course.price > 0 ? 'pay' : 'view'}"
              ${course.price > 0 ? `data-payment-title="${safeText(course.title)}" data-payment-amount="${course.price}" data-payment-kind="دورة تدريبية"` : ''}
              aria-label="${course.price > 0 ? 'دفع رسوم' : 'عرض'} ${safeText(course.title)}">${course.price > 0 ? 'دفع ←' : 'عرض المسار ↗'}</button>
          </div>
          <a class="details-link" href="./Course/course.html?id=${encodeURIComponent(course.id)}">تفاصيل المسار ←</a>
        </div>
      </article>`;
  }

  function clearFilters() {
    get('filterForm').reset();
    get('searchQuery').value = '';
    renderCourses();
  }

  // 3) نافذة تفاصيل المسار ومعاينة التسجيل التجريبي.
  function resetEnrollment() {
    get('enrollmentForm').reset();
    get('enrollArea').hidden = false;
    get('enrollmentSuccess').hidden = true;
  }

  function openCourse(course) {
    resetEnrollment();
    get('courseTitle').textContent = course.title;
    get('courseDescription').textContent = course.description;
    get('courseProject').textContent = course.project;
    get('courseSummary').textContent = [labels[course.level], labels[course.format],
      course.hours + (course.hours >= 3 && course.hours <= 10 ? ' ساعات' : ' ساعة'), priceLabel(course.price), 'مع ' + course.instructor].join(' · ');
    get('courseSyllabus').innerHTML = course.syllabus.map(step => '<li>' + safeText(step) + '</li>').join('');
    bootstrap.Modal.getOrCreateInstance(get('courseModal')).show();
  }

  // زر واحد لكل إجراء؛ لا نحتاج إلى ربط الأحداث مجددًا بعد كل فلترة.
  get('courseList').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = button.closest('.course-card').dataset.course;
    const course = courses.find(item => item.id === id);

    if (button.dataset.action === 'view') {
      openCourse(course);
      return;
    }


  });

  get('filterForm').addEventListener('submit', event => {
    event.preventDefault();
    renderCourses();
  });
  get('searchForm').addEventListener('submit', event => {
    event.preventDefault();
    renderCourses();
  });
  get('searchQuery').addEventListener('search', renderCourses);
  get('sortBy').addEventListener('change', renderCourses);
  get('clearFilters').addEventListener('click', clearFilters);
  get('resetEmpty').addEventListener('click', clearFilters);

  get('enrollmentForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!get('enrollmentForm').reportValidity()) return;
    get('enrollArea').hidden = true;
    get('enrollmentSuccess').hidden = false;
    get('enrollmentSuccess').setAttribute('tabindex', '-1');
    get('enrollmentSuccess').focus();
  });
  get('courseModal').addEventListener('hidden.bs.modal', resetEnrollment);

  get('year').textContent = new Date().getFullYear();
  renderCourses();
}

startAcademy().catch(error => console.error('Academy page:', error));


})();
