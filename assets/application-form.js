// Local application preview only. Files and form values are never sent or stored.
(() => {
  const form = document.querySelector('#applicationForm, #previewForm');
  if (!form) return;
  form.noValidate = true;
  form.classList.add('application-enhanced');
  const name = form.querySelector('#applicantName, #previewName');
  const email = form.querySelector('input[type="email"]');
  const experience = form.querySelector('textarea');
  const cv = form.querySelector('input[type="file"]');
  experience.required = false;
  form.querySelector(`label[for="${experience.id}"]`).textContent = 'خبراتك المرتبطة بالمشروع — اختياري';
  const portfolioField = document.createElement('div');
  portfolioField.className = 'field';
  portfolioField.innerHTML = '<label for="applicantPortfolio">رابط معرض الأعمال أو GitHub — اختياري</label><input id="applicantPortfolio" class="form-control" type="url" dir="ltr" maxlength="500" placeholder="https://" aria-describedby="portfolioHint"><p id="portfolioHint" class="field-hint">أضف رابطًا يعرض نماذج من أعمالك.</p>';
  cv.closest('.field').before(portfolioField);
  const portfolio = portfolioField.querySelector('input');
  const fileInfo = document.createElement('p');
  fileInfo.className = 'cv-file-info';
  fileInfo.setAttribute('role', 'status');
  const remove = document.createElement('button');
  remove.type = 'button'; remove.className = 'text-button cv-remove';
  remove.textContent = 'حذف الملف'; remove.hidden = true;
  cv.after(fileInfo, remove);
  document.getElementById('applicantCVHint').textContent = 'PDF أو Word، حتى 5 ميغابايت. الملف للمعاينة فقط؛ لا يُرفع أو يُحفظ.';
  const fields = [name, email, experience, portfolio, cv];
  const errors = new Map();
  fields.forEach(field => {
    const error = document.createElement('p');
    error.className = 'application-error'; error.id = field.id + 'Error'; error.hidden = true;
    field.closest('.field').append(error);
    field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    errors.set(field, error);
  });
  function message(field) {
    const value = field.value.trim();
    if (field === name && value.length < 2) return 'اكتب اسمك من حرفين على الأقل.';
    if (field === email && (!value || field.validity.typeMismatch)) return 'أدخل بريدًا إلكترونيًا صحيحًا، مثل name@example.com.';
    if (field === portfolio && value && (!/^https?:\/\//i.test(value) || field.validity.typeMismatch)) return 'أدخل رابطًا كاملًا يبدأ بـ https:// أو http://.';
    if (field === cv && field.files.length) {
      const file = field.files[0];
      if (!/\.(pdf|doc|docx)$/i.test(file.name)) return 'اختر ملف PDF أو Word بصيغة DOC أو DOCX.';
      if (file.size > 5 * 1024 * 1024) return 'حجم الملف أكبر من 5 ميغابايت. اختر ملفًا أصغر.';
    }
    if (field.maxLength > 0 && value.length > field.maxLength) return `الحد الأقصى ${field.maxLength} حرفًا.`;
    return '';
  }
  function validate(field) {
    field.setCustomValidity('');
    const text = message(field), error = errors.get(field);
    error.textContent = text; error.hidden = !text;
    field.setAttribute('aria-invalid', String(Boolean(text)));
    return !text;
  }
  fields.forEach(field => {
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); });
    field.addEventListener('blur', () => validate(field));
  });
  function updateFile() {
    const file = cv.files[0];
    fileInfo.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} ميغابايت` : '';
    remove.hidden = !file;
    validate(cv);
  }
  cv.addEventListener('change', updateFile);
  remove.addEventListener('click', () => { cv.value = ''; updateFile(); cv.focus(); });
  const review = document.createElement('section');
  review.className = 'application-review'; review.hidden = true; review.tabIndex = -1;
  review.setAttribute('aria-label', 'مراجعة طلب التقديم');
  review.innerHTML = '<h3>راجع طلبك</h3><dl></dl><p class="demo-note">هذه تجربة توضيحية؛ التأكيد لا يرسل طلبًا فعليًا ولا يرفع ملفك.</p><div class="application-review-actions"><button type="button" class="btn btn-orange" data-confirm>تأكيد المعاينة</button><button type="button" class="text-button" data-edit>تعديل المعلومات</button></div>';
  form.after(review);
  const submit = form.querySelector('button[type="submit"]');
  submit.textContent = 'مراجعة الطلب ←';
  form.addEventListener('submit', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const valid = fields.map(validate);
    if (valid.includes(false)) { fields[valid.indexOf(false)].focus(); return; }
    const list = review.querySelector('dl'); list.replaceChildren();
    [['الاسم', name.value], ['البريد الإلكتروني', email.value], ['الخبرات', experience.value || 'لم تُضف خبرات'], ['معرض الأعمال', portfolio.value || 'لم يُضف رابط'], ['السيرة الذاتية', fileInfo.textContent || 'لم يُرفق ملف']].forEach(([label, value]) => {
      const term = document.createElement('dt'), detail = document.createElement('dd');
      term.textContent = label; detail.textContent = value; detail.dir = 'auto'; list.append(term, detail);
    });
    form.hidden = true; review.hidden = false; review.focus();
  }, true);
  review.querySelector('[data-edit]').addEventListener('click', () => { review.hidden = true; form.hidden = false; name.focus(); });
  review.querySelector('[data-confirm]').addEventListener('click', () => {
    form.reset(); form.hidden = true;
    const success = document.querySelector('#applicationSuccess, #previewSuccess');
    success.hidden = false; success.tabIndex = -1; success.focus();
  });
  form.addEventListener('reset', () => {
    review.hidden = true; review.querySelector('dl').replaceChildren();
    fileInfo.textContent = ''; remove.hidden = true;
    fields.forEach(field => { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); errors.get(field).hidden = true; });
  });
})();
