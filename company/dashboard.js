// Session-only company workspace. No authentication or public publishing backend.
(() => {
  const contentStates = { draft: 'مسودة', published: 'منشور', paused: 'متوقف', archived: 'مؤرشف' };
  const applicationStates = { pending: 'جديد', accepted: 'مقبول', rejected: 'مرفوض' };
  const typeLabel = type => type === 'event' ? 'فعالية' : 'درس أكاديمي';
  function createWorkspace() {
    let serial = 20;
    const content = [
      { id: 'e1', type: 'event', title: 'من الفكرة إلى منتجك الأول', category: 'التطوير', status: 'published', description: 'ورشة عملية لتحويل فكرة منتج إلى نموذج أولي قابل للتجربة.', eventDate: '2026-11-14T17:00', capacity: 30, venue: 'مساحة أفق · عمّان', price: 15 },
      { id: 'c1', type: 'course', title: 'أساسيات تطوير الواجهات', category: 'التطوير', status: 'published', description: 'تعلّم بناء صفحات ويب متجاوبة من خلال تطبيقات عملية.', instructor: 'عمر خليل', hours: 12, capacity: 25, level: 'مبتدئ', syllabus: 'بنية صفحات HTML\nالتنسيق باستخدام CSS\nمقدمة إلى JavaScript', video: '', price: 0 },
      { id: 'e2', type: 'event', title: 'لقاء المصممين وصنّاع الأفكار', category: 'التصميم', status: 'draft', description: 'لقاء لمشاركة المشاريع والأفكار وبناء علاقات مهنية جديدة.', eventDate: '2026-11-21T18:00', capacity: 40, venue: 'عبر الإنترنت', price: 0 },
      { id: 'c2', type: 'course', title: 'تصميم واجهات وتجربة المستخدم', category: 'التصميم', status: 'paused', description: 'درس تطبيقي لفهم المستخدم وتصميم واجهات واضحة باستخدام Figma.', instructor: 'لينا حداد', hours: 8, capacity: 20, level: 'متوسط', syllabus: 'فهم احتياجات المستخدم\nرسم مسارات الاستخدام\nبناء النموذج الأولي', video: '', price: 25 }
    ];
    const applications = [
      { id: 'a1', contentId: 'e1', name: 'سارة ناصر', skills: 'تصميم المنتجات · Figma', date: '2026-10-28', status: 'pending', email: 'sara@example.com', message: 'أرغب بالمشاركة لتطوير فكرة منصة تعليمية والعمل على نموذجها الأولي.' },
      { id: 'a2', contentId: 'c1', name: 'أحمد العلي', skills: 'HTML · CSS', date: '2026-10-29', status: 'pending', email: 'ahmad@example.com', message: 'لدي معرفة بأساسيات HTML وأرغب بتطوير مهاراتي من خلال الدرس.' },
      { id: 'a3', contentId: 'e1', name: 'محمد خالد', skills: 'تطوير المواقع · JavaScript', date: '2026-10-27', status: 'accepted', email: 'mohammad@example.com', message: 'أعمل على فكرة تطبيق وأود مشاركة نموذجي والحصول على ملاحظات.' },
      { id: 'a4', contentId: 'c2', name: 'نور سمير', skills: 'أبحاث المستخدمين · التصميم', date: '2026-10-26', status: 'pending', email: 'nour@example.com', message: 'أود الانضمام لتطوير مهارات البحث وبناء النماذج الأولية.' },
      { id: 'a5', contentId: 'c1', name: 'ليان يوسف', skills: 'تطوير الواجهات', date: '2026-10-25', status: 'rejected', email: 'layan@example.com', message: 'أرغب بتعلّم بناء موقع متجاوب لعرض أعمالي.' }
    ];
    const find = id => content.find(item => item.id === id);
    return {
      content, applications, find,
      save(record, id) {
        if (!['event', 'course'].includes(record.type) || !contentStates[record.status]) throw new Error('يرجى مراجعة نوع المنشور وحالته.');
        if (record.title.trim().length < 3 || record.description.trim().length < 10) throw new Error('يرجى كتابة عنوان ووصف واضحين.');
        if (!Number.isInteger(record.capacity) || record.capacity < 1 || record.capacity > 10000) throw new Error('عدد المقاعد يجب أن يكون بين 1 و10000.');
        if (!Number.isFinite(record.price) || record.price < 0 || record.price > 100000) throw new Error('يرجى إدخال سعر صحيح.');
        if (record.type === 'event' && (!record.eventDate || Number.isNaN(new Date(record.eventDate).valueOf()) || !record.venue.trim())) throw new Error('يرجى إدخال موعد ومكان الفعالية.');
        if (record.type === 'course' && (!record.instructor.trim() || !record.syllabus.trim() || !Number.isFinite(record.hours) || record.hours < 0.5 || record.hours > 500)) throw new Error('أكمل بيانات المدرّب والمدة ومحتوى الدرس.');
        if (record.type === 'course' && record.video) {
          let url;
          try { url = new URL(record.video); } catch { throw new Error('أدخل رابط فيديو صحيحًا.'); }
          if (!['https:', 'http:'].includes(url.protocol)) throw new Error('رابط الفيديو يجب أن يبدأ بـ https:// أو http://.');
        }
        const old = id ? find(id) : null;
        if (id && !old) throw new Error('المنشور غير موجود.');
        if (old && old.type !== record.type) throw new Error('لا يمكن تغيير نوع المنشور.');
        const accepted = applications.filter(item => item.contentId === id && item.status === 'accepted').length;
        if (record.capacity < accepted) throw new Error('عدد المقاعد لا يمكن أن يكون أقل من عدد المقبولين.');
        const item = { ...record, title: record.title.trim(), description: record.description.trim(), id: old?.id || 'content-' + ++serial };
        if (old) Object.assign(old, item); else content.unshift(item);
        return item;
      },
      setPublication(id, status) {
        const item = find(id);
        if (!item || !contentStates[status]) throw new Error('تعذّر تغيير حالة النشر.');
        item.status = status;
      },
      review(id, status) {
        const application = applications.find(item => item.id === id);
        if (!application || !applicationStates[status]) throw new Error('الطلب غير موجود.');
        const item = find(application.contentId);
        if (status === 'accepted' && application.status !== 'accepted') {
          if (item.status === 'archived') throw new Error('أعد تفعيل المنشور قبل قبول طلبات جديدة.');
          if (applications.filter(other => other.contentId === item.id && other.status === 'accepted').length >= item.capacity) throw new Error('اكتملت المقاعد المتاحة لهذا المنشور.');
        }
        application.status = status;
      }
    };
  }
  // Also exposed for checks of the company workflow without a browser.
  if (typeof module !== 'undefined' && module.exports) { module.exports = { createWorkspace }; return; }

  const iconPaths = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    events: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
    courses: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
    published: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    applicants: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4"/>',
    profile: '<path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h1m6 0h1m-8 4h1m6 0h1m-6 9v-5h4v5"/>'
  };
  const icon = key => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + iconPaths[key] + '</svg>';
  document.querySelectorAll('#navigation [data-view]').forEach(button => { button.querySelector('.nav-icon').innerHTML = icon(button.dataset.view); });
  const model = createWorkspace();
  const $ = id => document.getElementById(id);
  const fields = $('contentForm').elements;
  let current = 'overview', editingId = null, editingType = 'event', reviewingId = null, toastTimer;
  const views = {
    overview: ['نظرة عامة', 'فعالياتك ودروسك والمتقدمون، في مساحة واحدة.'],
    events: ['الفعاليات', 'أنشئ فعاليات شركتك، وحدّث تفاصيلها وتحكّم بنشرها.'],
    courses: ['دروس الأكاديمية', 'شارك خبرة شركتك من خلال دروس ووحدات تعليمية.'],
    applicants: ['المتقدمون', 'راجع طلبات الفعاليات والدروس وحدّد المقبولين.'],
    profile: ['بيانات الشركة', 'عرّف بشركتك وحدّث بيانات التواصل وهويتها.']
  };
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const badge = (state, application = false) => `<span class="company-status ${state}">${(application ? applicationStates : contentStates)[state]}</span>`;
  const button = (text, action, id, className = 'secondary') => `<button class="${className}" data-action="${action}" data-id="${id}">${text}</button>`;
  function toast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4000); }
  function show(view, updateHash = true) {
    current = views[view] ? view : 'overview';
    for (const [id, active] of [['overviewView', 'overview'], ['contentView', ['events', 'courses']], ['applicantsView', 'applicants'], ['profileView', 'profile']]) $(id).hidden = Array.isArray(active) ? !active.includes(current) : current !== active;
    $('pageTitle').textContent = $('breadcrumb').textContent = views[current][0];
    $('pageDescription').textContent = views[current][1];
    $('addButton').hidden = !['events', 'courses'].includes(current);
    $('addButton').textContent = current === 'courses' ? '+ درس جديد' : '+ فعالية جديدة';
    document.querySelectorAll('#navigation [data-view]').forEach(item => { if (item.dataset.view === current) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current'); });
    $('sidebar').classList.remove('open'); $('menuButton').setAttribute('aria-expanded', 'false');
    if (updateHash) history.replaceState(null, '', '#' + current);
    render();
  }
  function date(value, time = false) {
    return new Intl.DateTimeFormat('ar-JO', time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value.length === 10 ? value + 'T12:00:00' : value));
  }
  function renderOverview() {
    const stats = [
      ['الفعاليات', model.content.filter(item => item.type === 'event').length, 'فعاليات شركتك'],
      ['دروس الأكاديمية', model.content.filter(item => item.type === 'course').length, 'دروس ووحدات تعليمية'],
      ['المنشورات النشطة', model.content.filter(item => item.status === 'published').length, 'حالتها منشور في المعاينة'],
      ['المتقدمون', model.applications.length, model.applications.filter(item => item.status === 'pending').length + ' طلبات بانتظار مراجعتك']
    ];
    $('stats').innerHTML = stats.map(([title, total, hint], index) => `<article class="stat"><div class="stat-top">${title}<span class="stat-icon" aria-hidden="true">${icon(["events", "courses", "published", "applicants"][index])}</span></div><strong>${total}</strong><small>${hint}</small></article>`).join('');
    $('recentContent').innerHTML = model.content.slice(0, 4).map(item => `<div class="company-row"><div><h3>${escape(item.title)}</h3><p>${typeLabel(item.type)} · ${escape(item.category)}</p></div><div class="row-actions">${badge(item.status)}${button('تعديل', 'edit', item.id, 'text-button')}</div></div>`).join('');
    const pending = model.applications.filter(item => item.status === 'pending');
    $('pendingApplicants').innerHTML = pending.length ? pending.slice(0, 3).map(item => `<div class="company-row"><div><h3>${escape(item.name)}</h3><p>${escape(model.find(item.contentId).title)}</p></div>${button('مراجعة الطلب', 'application', item.id, 'text-button')}</div>`).join('') : '<p class="muted">راجعت كل الطلبات. لا توجد طلبات جديدة الآن.</p>';
  }
  function labelTable(id) {
    const body = $(id);
    const labels = [...body.closest('table').querySelectorAll('thead th')].map(cell => cell.textContent);
    for (const row of body.rows) [...row.cells].forEach((cell, index) => cell.dataset.label = labels[index]);
  }
  function renderContent() {
    const type = current === 'courses' ? 'course' : 'event';
    const query = $('contentSearch').value.trim().toLowerCase();
    const filtered = model.content.filter(item => item.type === type && (!$('contentStatus').value || item.status === $('contentStatus').value) && (item.title + ' ' + item.category).toLowerCase().includes(query));
    $('contentCaption').textContent = views[current][0];
    $('dateColumn').textContent = type === 'event' ? 'الموعد' : 'المدرّب / المدة';
    $('contentCount').textContent = filtered.length + ' منشورات';
    $('contentEmpty').hidden = filtered.length > 0;
    $('contentRows').innerHTML = filtered.map(item => {
      const count = model.applications.filter(application => application.contentId === item.id).length;
      const accepted = model.applications.filter(application => application.contentId === item.id && application.status === 'accepted').length;
      const stateAction = item.status === 'published' ? button('إيقاف النشر', 'pause', item.id) : button(item.status === 'draft' ? 'نشر' : 'إعادة النشر', 'publish', item.id);
      return `<tr><td class="content-title"><strong>${escape(item.title)}</strong><small>${escape(item.category)} · ${item.price ? '$' + item.price : 'مجاني'}</small></td><td>${type === 'event' ? escape(date(item.eventDate, true)) : escape(item.instructor) + '<br><small>' + item.hours + ' ساعات</small>'}</td><td>${badge(item.status)}</td><td><button class="count-button" data-action="applications" data-id="${item.id}" aria-label="عرض المتقدمين إلى ${escape(item.title)}">${count} متقدمين</button><br><small class="muted">${accepted} / ${item.capacity} مقاعد محجوزة</small></td><td><div class="row-actions">${button('تعديل', 'edit', item.id)}${stateAction}${item.status !== 'archived' ? button('أرشفة', 'archive', item.id, 'text-button') : ''}</div></td></tr>`;
    }).join('');
    labelTable('contentRows');
  }
  function renderApplications() {
    const select = $('applicantContent'), selected = select.value;
    select.innerHTML = '<option value="">كل المنشورات</option>' + model.content.map(item => `<option value="${item.id}">${typeLabel(item.type)} · ${escape(item.title)}</option>`).join('');
    select.value = model.find(selected) ? selected : '';
    const query = $('applicantSearch').value.trim().toLowerCase();
    const filtered = model.applications.filter(item => (!select.value || item.contentId === select.value) && (!$('applicantStatus').value || item.status === $('applicantStatus').value) && (item.name + ' ' + item.skills).toLowerCase().includes(query));
    $('applicantEmpty').hidden = filtered.length > 0;
    $('applicantCount').textContent = filtered.length + ' طلبات';
    $('applicantRows').innerHTML = filtered.map(item => `<tr><td class="applicant-identity"><strong>${escape(item.name)}</strong><small>${escape(item.skills)}</small></td><td class="content-title">${escape(model.find(item.contentId).title)}</td><td>${escape(date(item.date))}</td><td>${badge(item.status, true)}</td><td>${button('عرض الطلب', 'application', item.id)}</td></tr>`).join('');
    labelTable('applicantRows');
  }
  function render() { renderOverview(); if (['events', 'courses'].includes(current)) renderContent(); if (current === 'applicants') renderApplications(); }
  function openEditor(type, id = null) {
    const item = id ? model.find(id) : null;
    editingId = id; editingType = item?.type || type;
    $('contentForm').reset(); $('editorError').textContent = '';
    $('contentForm').querySelectorAll('input,textarea').forEach(field => field.setCustomValidity(''));
    for (const [fieldset, active] of [['eventFields', editingType === 'event'], ['courseFields', editingType === 'course']]) { $(fieldset).hidden = !active; $(fieldset).disabled = !active; }
    $('editorTitle').textContent = (item ? 'تعديل ' : 'إضافة ') + typeLabel(editingType);
    if (item) {
      for (const key of ['title', 'category', 'status', 'description', 'eventDate', 'venue', 'instructor', 'hours', 'level', 'syllabus', 'video', 'price']) if (fields[key] && item[key] !== undefined) fields[key].value = item[key];
      fields[editingType === 'event' ? 'eventCapacity' : 'courseCapacity'].value = item.capacity;
    } else { fields.status.value = 'draft'; fields[editingType === 'event' ? 'eventCapacity' : 'courseCapacity'].value = 30; }
    $('editor').showModal();
    fields.title.focus();
  }
  function openApplication(id) {
    const application = model.applications.find(item => item.id === id);
    if (!application) return;
    reviewingId = id;
    $('applicantName').textContent = application.name;
    $('applicantSkills').textContent = application.skills;
    $('applicationTitle').textContent = model.find(application.contentId).title;
    $('applicationMessage').textContent = application.message;
    $('applicationEmail').textContent = application.email;
    $('applicationState').innerHTML = badge(application.status, true);
    $('acceptApplicant').disabled = application.status === 'accepted';
    $('rejectApplicant').disabled = application.status === 'rejected';
    if (!$('applicantDialog').open) $('applicantDialog').showModal();
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.view) { $('contentSearch').value = ''; $('contentStatus').value = ''; show(target.dataset.view); }
    if (target.dataset.create) openEditor(target.dataset.create);
    if (target.dataset.close) $(target.dataset.close).close();
    const { action, id } = target.dataset;
    if (action === 'edit') openEditor(model.find(id).type, id);
    if (action === 'application') openApplication(id);
    if (action === 'applications') {
      $('applicantSearch').value = ''; $('applicantStatus').value = '';
      show('applicants'); $('applicantContent').value = id; renderApplications();
    }
    const nextState = { pause: 'paused', publish: 'published', archive: 'archived' }[action];
    if (nextState) { model.setPublication(id, nextState); render(); toast('حالة المنشور الآن: ' + contentStates[nextState] + ' · داخل المعاينة'); }
  });
  $('contentForm').addEventListener('input', event => { event.target.setCustomValidity?.(''); $('editorError').textContent = ''; });
  $('contentForm').addEventListener('submit', event => {
    event.preventDefault();
    for (const field of $('contentForm').querySelectorAll('input[required],textarea[required]')) if (!field.matches(':disabled') && !field.value.trim()) field.setCustomValidity('يرجى تعبئة هذا الحقل.');
    if (!$('contentForm').reportValidity()) return;
    const record = { type: editingType, title: fields.title.value, category: fields.category.value, status: fields.status.value, description: fields.description.value, price: Number(fields.price.value), capacity: Number(fields[editingType === 'event' ? 'eventCapacity' : 'courseCapacity'].value) };
    const keys = editingType === 'event' ? ['eventDate', 'venue'] : ['instructor', 'hours', 'level', 'syllabus', 'video'];
    keys.forEach(key => { record[key] = key === 'hours' ? Number(fields[key].value) : fields[key].value.trim(); });
    try { model.save(record, editingId); $('editor').close(); show(editingType === 'event' ? 'events' : 'courses'); toast('تم حفظ المنشور في هذه الجلسة.'); } catch (error) { $('editorError').textContent = error.message; }
  });
  for (const [id, state] of [['acceptApplicant', 'accepted'], ['rejectApplicant', 'rejected']]) $(id).addEventListener('click', () => {
    try { model.review(reviewingId, state); openApplication(reviewingId); render(); toast(state === 'accepted' ? 'تم قبول الطلب في المعاينة.' : 'تم رفض الطلب في المعاينة.'); } catch (error) { toast(error.message); $('applicationState').textContent = error.message; }
  });
  $('companyForm').addEventListener('input', event => event.target.setCustomValidity(''));
  $('companyForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    for (const field of form.querySelectorAll('[required]')) if (!field.value.trim()) field.setCustomValidity('يرجى تعبئة هذا الحقل.');
    if (!form.reportValidity()) return;
    document.querySelectorAll('[data-company-name]').forEach(item => item.textContent = form.elements.companyName.value.trim());
    for (const [id, key] of [['companyIndustry', 'industry'], ['companyLocation', 'location'], ['companyBio', 'bio']]) $(id).textContent = form.elements[key].value.trim();
    toast('تم تحديث بيانات الشركة في هذه الجلسة.');
  });
  for (const id of ['contentSearch', 'contentStatus']) $(id).addEventListener(id === 'contentSearch' ? 'input' : 'change', renderContent);
  for (const id of ['applicantSearch', 'applicantContent', 'applicantStatus']) $(id).addEventListener(id === 'applicantSearch' ? 'input' : 'change', renderApplications);
  $('addButton').addEventListener('click', () => openEditor(current === 'courses' ? 'course' : 'event'));
  $('emptyCreate').addEventListener('click', () => openEditor(current === 'courses' ? 'course' : 'event'));
  $('menuButton').addEventListener('click', () => { const open = $('sidebar').classList.toggle('open'); $('menuButton').setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('sidebar').classList.remove('open'); $('menuButton').setAttribute('aria-expanded', 'false'); } });
  function theme(value) {
    const dark = value === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    $('themeToggle').textContent = dark ? '☀ الوضع النهاري' : '☾ الوضع الليلي';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0b1526' : '#f3f6fb';
    const url = new URL(location.href); url.searchParams.set('theme', dark ? 'dark' : 'light'); history.replaceState(null, '', url);
    document.querySelectorAll('a[href]').forEach(link => { const target = new URL(link.href, location.href); if (target.origin === location.origin && target.pathname.endsWith('.html')) { target.searchParams.set('theme', dark ? 'dark' : 'light'); link.href = target.href; } });
  }
  $('themeToggle').addEventListener('click', () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('today').textContent = new Intl.DateTimeFormat('ar-JO', { dateStyle: 'long', timeZone: 'Asia/Amman' }).format(new Date());
  $('year').textContent = new Date().getFullYear();
  theme(new URLSearchParams(location.search).get('theme'));
  show(location.hash.slice(1), false);
  window.addEventListener('hashchange', () => show(location.hash.slice(1), false));
})();
