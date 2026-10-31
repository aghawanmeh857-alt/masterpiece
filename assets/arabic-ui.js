// Native disclosure menus work with keyboard and touch; desktop sections stay visible.
(() => {
  const sharedScript = [...document.scripts].find(script => script.src.endsWith('/assets/arabic-ui.js'));
  if (sharedScript) {
    const cartUrl = new URL('../Academy/Cart/cart.html', sharedScript.src);
    document.querySelectorAll('.header-actions').forEach(actions => {
      if (actions.closest('.hero-navbar')) return;
      if (document.body.dataset.section === 'freelance') {
        if (actions.querySelector('.project-favorites-link')) return;
        const favorites = document.createElement('a');
        const url = new URL('../Freelance/freelance.html', sharedScript.src);
        url.searchParams.set('favorites', '1');
        url.searchParams.set('theme', document.documentElement.dataset.theme || new URLSearchParams(location.search).get('theme') || 'light');
        url.hash = 'project-favorites';
        favorites.className = 'project-favorites-link';
        favorites.href = url.href;
        favorites.textContent = '♡ المفضلة';
        actions.prepend(favorites);
        return;
      }
      if (actions.querySelector('.shopping-cart-link')) return;
      const link = document.createElement('a');
      link.className = 'shopping-cart-link';
      link.href = cartUrl.href;
      link.setAttribute('aria-label', 'سلة المشتريات');
      link.title = 'سلة المشتريات';
      link.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.4 12h11.2l2-8H6"/><path d="M8 15l-1 3h12"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg><span>السلة</span>';
      const syncCartTheme = () => {
        const url = new URL(cartUrl.href);
        url.searchParams.set('theme', document.documentElement.dataset.theme || new URLSearchParams(location.search).get('theme') || 'light');
        link.href = url.href;
      };
      syncCartTheme();
      link.addEventListener('click', syncCartTheme);
      if (location.pathname === cartUrl.pathname) link.setAttribute('aria-current', 'page');
      actions.prepend(link);
    });
    const companyUrl = new URL('../company/dashboard.html', sharedScript.src);
    companyUrl.searchParams.set('theme', document.documentElement.dataset.theme || new URLSearchParams(location.search).get('theme') || 'light');
    document.querySelectorAll('.account-menu-links').forEach(menu => {
      if (menu.querySelector('[data-company-dashboard]')) return;
      const link = document.createElement('a');
      link.href = companyUrl.href;
      link.dataset.companyDashboard = '';
      link.textContent = 'لوحة الشركة';
      menu.append(link);
    });
  }
  const navigation = document.querySelector('.site-navigation');
  const desktop = matchMedia('(min-width: 992px)');
  const syncNavigation = () => { if (navigation) navigation.open = desktop.matches; };
  syncNavigation();
  desktop.addEventListener('change', syncNavigation);

  const section = document.body.dataset.section;
  document.querySelectorAll('.section-nav a[data-section-link]').forEach(link => {
    if (link.dataset.sectionLink === section) link.setAttribute('aria-current', 'page');
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
})();
