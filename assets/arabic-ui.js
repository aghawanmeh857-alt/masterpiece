// Native disclosure menus work with keyboard and touch; desktop sections stay visible.
(() => {
  const sharedScript = [...document.scripts].find(script => script.src.endsWith('/assets/arabic-ui.js'));
  if (sharedScript) {
    if (!/\/Auth\//i.test(location.pathname)) document.querySelectorAll('a[href*="Auth/Register/register.html"]').forEach(link => {
      const url = new URL(link.href); url.searchParams.set('next',location.href); url.searchParams.set('service',new URLSearchParams(location.search).get('format') === 'workshop' ? 'workshops' : document.body.dataset.section || 'profile'); link.href = url.href;
    });
    // User navigation contains user destinations only. Company tools live in
    // their dedicated dashboard, reached through a company sign-in.
    document.querySelectorAll('.account-menu-links a').forEach(link => {
      if (/\/(Admin|company)\//i.test(new URL(link.href).pathname)) link.remove();
    });
  }
  const navigation = document.querySelector('.site-navigation');
  const desktop = matchMedia('(min-width: 992px)');
  const syncNavigation = () => { if (navigation) navigation.open = desktop.matches; };
  syncNavigation();
  desktop.addEventListener('change', syncNavigation);

  const section = document.body.dataset.section;
  const workshopPage = section === 'academy' && new URLSearchParams(location.search).get('format') === 'workshop';
  document.querySelectorAll('.section-nav a[data-section-link]').forEach(link => {
    const active = link.dataset.sectionLink === (workshopPage ? 'workshops' : section);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  document.addEventListener('click', event => {
    document.querySelectorAll('.account-menu[open], .site-navigation[open]').forEach(menu => {
      if (menu === navigation && desktop.matches) return;
      if (!menu.contains(event.target)) menu.open = false;
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    document.querySelectorAll('.account-menu[open], .site-navigation[open]').forEach(menu => {
      if (menu === navigation && desktop.matches) return;
      const containedFocus = menu.contains(document.activeElement);
      menu.open = false;
      if (containedFocus) menu.querySelector('summary').focus();
    });
  });

  // Keep native form validation readable when the browser itself uses another language.
  document.addEventListener('invalid', event => {
    const field = event.target;
    const state = field.validity;
    if (!state || state.customError) return;
    let message = 'يرجى مراجعة القيمة المدخلة.';
    if (state.valueMissing) message = 'يرجى تعبئة هذا الحقل.';
    else if (state.typeMismatch) message = field.type === 'email' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'يرجى إدخال رابط صحيح يبدأ بـhttps://.';
    else if (state.tooShort) message = `يرجى إدخال ${field.minLength} أحرف على الأقل.`;
    else if (state.tooLong) message = `الحد الأقصى هو ${field.maxLength} حرفًا.`;
    else if (state.rangeUnderflow) message = `أدخل قيمة لا تقل عن ${field.min}.`;
    else if (state.rangeOverflow) message = `أدخل قيمة لا تزيد على ${field.max}.`;
    else if (state.badInput || state.stepMismatch) message = 'يرجى إدخال رقم صحيح ضمن القيم المتاحة.';
    field.setCustomValidity(message);
    field.dataset.arabicValidity = 'true';
  }, true);
  const clearValidation = event => {
    const field = event.target;
    if (field.dataset.arabicValidity) {
      field.setCustomValidity('');
      delete field.dataset.arabicValidity;
    }
  };
  document.addEventListener('input', clearValidation, true);
  document.addEventListener('change', clearValidation, true);
  document.addEventListener('reset', event => {
    event.target.querySelectorAll('[data-arabic-validity]').forEach(field => {
      field.setCustomValidity('');
      delete field.dataset.arabicValidity;
    });
  });
  document.addEventListener('change', event => {
    const field = event.target;
    if (!field.matches('input[type="file"][accept]')) return;
    const file = field.files?.[0];
    let message = '';
    if (file && /\.pdf|\.doc/i.test(field.accept)) {
      if (!/\.(pdf|doc|docx)$/i.test(file.name)) message = 'اختر ملف PDF أو Word.';
      else if (file.size > 5 * 1024 * 1024) message = 'الحد الأقصى لحجم الملف 5 ميغابايت.';
    }
    field.setCustomValidity(message);
    if (message) field.reportValidity();
  });
})();
