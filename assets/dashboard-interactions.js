// Delegated interactions survive filtering and rebuilding table rows.
(() => {
  const admin = document.body.dataset.dashboard === 'admin';
  const tooltip = document.createElement('div');
  tooltip.id = admin ? 'adminTooltip' : 'companyTooltip';
  tooltip.className = 'dashboard-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);
  const actionHints = {
    edit: admin ? 'فتح تفاصيل السجل للتعديل أو معاينة الرد.' : 'تعديل تفاصيل المنشور ومحتواه.',
    approve: 'معاينة اعتماد السجل؛ لا يغيّر ذلك الموقع المنشور.',
    delete: 'فتح نافذة تأكيد حذف السجل التجريبي.',
    publish: 'إظهار المنشور كمنشور داخل هذه المعاينة.',
    pause: 'إيقاف النشر مع الاحتفاظ بتفاصيل المنشور والمتقدمين.',
    archive: 'أرشفة المنشور؛ يمكنك إعادة نشره لاحقًا.',
    applications: 'فتح قائمة المتقدمين لهذا المنشور فقط.',
    application: 'عرض رسالة التقديم ومراجعة قرار القبول أو الرفض.'
  };
  const stateHints = {
    published: 'منشور: متاح ضمن المعاينة الحالية.', draft: 'مسودة: لم يُنشر بعد.',
    paused: 'متوقف: يمكنك استئناف النشر عند الجاهزية.', archived: 'مؤرشف: محفوظ ويمكن إعادة نشره.',
    pending: 'طلب جديد بانتظار مراجعتك.', accepted: 'طلب مقبول ضمن المقاعد المتاحة.', rejected: 'طلب مرفوض؛ يمكن مراجعة القرار من عرض الطلب.'
  };
  let anchor = null, showTimer, hideTimer;
  function clearDescription() {
    if (!anchor) return;
    const remaining = (anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== tooltip.id);
    if (remaining.length) anchor.setAttribute('aria-describedby', remaining.join(' '));
    else anchor.removeAttribute('aria-describedby');
  }
  function hide() {
    clearTimeout(showTimer); clearTimeout(hideTimer);
    clearDescription(); anchor = null; tooltip.hidden = true;
  }
  function position() {
    if (!anchor?.isConnected) { hide(); return; }
    const box = anchor.getBoundingClientRect(), tip = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.max(12, Math.min(innerWidth - tip.width - 12, box.left + (box.width - tip.width) / 2)) + 'px';
    const above = box.top - tip.height - 10;
    tooltip.style.top = Math.max(12, Math.min(innerHeight - tip.height - 12, above >= 12 ? above : box.bottom + 10)) + 'px';
  }
  function description(target) {
    if (target.matches('button')) {
      if (actionHints[target.dataset.action]) return actionHints[target.dataset.action];
      if (admin && target.dataset.create) return 'فتح نموذج إضافة سجل جديد لهذا القسم.';
      if (target.id === 'confirmDelete') return 'تأكيد حذف السجل في المعاينة التجريبية.';
      if (target.id === 'previousPage') return 'عرض الصفحة السابقة من سجلات الجدول.';
      if (target.id === 'nextPage') return 'عرض الصفحة التالية من سجلات الجدول.';
      if (target.id === 'replayScene') return 'إعادة تشغيل حركة المشهد في المعاينة.';
      if (target.dataset.create) return target.dataset.create === 'event' ? 'فتح نموذج إضافة فعالية جديدة لشركتك.' : 'فتح نموذج إضافة درس جديد للأكاديمية.';
      if (target.dataset.view) return 'الانتقال إلى قسم ' + target.textContent.trim() + (admin ? ' داخل لوحة الإدارة.' : ' داخل لوحة الشركة.');
      if (target.id === 'acceptApplicant') return 'قبول الطلب وحجز مقعد إذا توفرت سعة.';
      if (target.id === 'rejectApplicant') return 'تغيير حالة الطلب إلى مرفوض داخل المعاينة.';
      if (target.dataset.close) return 'إغلاق النافذة والعودة إلى اللوحة.';
      if (target.id === 'themeToggle') return 'التبديل بين المظهر النهاري والليلي.';
      if (target.id === 'menuButton') return 'فتح قائمة الأقسام أو إغلاقها.';
      if (admin && target.type === 'submit') return 'تطبيق الإجراء على المعاينة الحالية فقط.';
      return target.getAttribute('aria-label') || target.textContent.trim();
    }
    const state = target.querySelector('.company-status, .badge');
    if (state) {
      const key = Object.keys(stateHints).find(key => state.classList.contains(key));
      if (key) return admin ? state.textContent.trim() + ' · حالة السجل في المعاينة الحالية.' : stateHints[key];
    }
    return (target.dataset.label ? target.dataset.label + ': ' : '') + target.innerText.trim();
  }
  function show(target, immediate = false) {
    if (target.disabled || target.closest('[hidden]')) return;
    if (anchor === target) { clearTimeout(hideTimer); return; }
    hide(); anchor = target;
    showTimer = setTimeout(() => {
      if (!anchor?.isConnected) { hide(); return; }
      tooltip.textContent = description(target);
      if (!tooltip.textContent) return;
      // Native dialogs paint above body content; keep their hints in that layer.
      (target.closest('dialog[open]') || document.body).append(tooltip);
      tooltip.hidden = false;
      const ids = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (!ids.includes(tooltip.id)) ids.push(tooltip.id);
      target.setAttribute('aria-describedby', ids.join(' '));
      position();
    }, immediate ? 0 : 300);
  }
  const relevant = node => node instanceof Element ? node.closest('button, tbody td') : null;
  document.addEventListener('pointerover', event => {
    if (!['mouse', 'pen'].includes(event.pointerType)) return;
    const target = relevant(event.target);
    if (target) show(target);
  });
  document.addEventListener('pointerout', event => {
    if (!anchor) return;
    if (event.relatedTarget instanceof Node && (anchor.contains(event.relatedTarget) || tooltip.contains(event.relatedTarget))) return;
    hideTimer = setTimeout(hide, 120);
  });
  tooltip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave', () => { hideTimer = setTimeout(hide, 120); });
  document.addEventListener('focusin', event => { const target = relevant(event.target); if (target) show(target, true); });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('click', hide);
  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  // Add keyboard focus to non-actionable values, leaving buttons as their own stop.
  function prepareCells() {
    document.querySelectorAll('tbody td').forEach(cell => {
      const headings = cell.closest('table').querySelectorAll('thead th');
      if (headings[cell.cellIndex]) cell.dataset.label = headings[cell.cellIndex].textContent.trim();
      if (!cell.querySelector('button, a, input, select')) cell.tabIndex = 0;
    });
    if (anchor && !anchor.isConnected) hide();
  }
  document.querySelectorAll('tbody').forEach(body => new MutationObserver(prepareCells).observe(body, { childList: true }));
  prepareCells();
})();
