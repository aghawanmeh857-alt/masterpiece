// Render synchronously so page scripts bind to the same shared navigation.
(() => {
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const mode = script.dataset.mode || 'site';
  const hero = mode === 'hero';
  const theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';
  const accountIcons = {
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    messages: '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8Z"/><path d="M7 9h9M7 13h6"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    login: '<path d="M14 3h6v18h-6M3 12h12m-4-4 4 4-4 4"/>',
    register: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M20 8v6m-3-3h6"/>'
  };
  const accountIcon = key => `<svg class="account-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${accountIcons[key]}</svg>`;
  const url = path => { const target = new URL(path, root); target.searchParams.set('theme', theme); return target.href; };
  const links = [
    ['lobby','الرئيسية','hero/userHero.html'],
    ['freelance','العمل الحر','Freelance/freelance.html'],
    ['academy','الأكاديمية','Academy/academy.html'],
    ['internships','فرص التدريب','Internships/internships.html'],
    ['jobs','الوظائف','Jobs/jobs.html'],
    ['events','الفعاليات','Events/events.html']
  ];
  const brand = `<a class="brand" href="${hero?'#lobby':url('hero/userHero.html')}" aria-label="سعي | SAEI الرئيسية"><span class="ofoq-brand"><img class="ofoq-logo" src="${new URL('assets/branding/saei-logo.svg',root).href}" alt="سعي | SAEI" width="116" height="50"></span></a>`;
  const header = document.createElement('header');
  header.className = hero ? 'topbar container-fluid hero-navbar shared-navbar' : 'site-header shared-navbar';
  header.dataset.navbarMode = mode;
  if (mode === 'auth') {
    header.innerHTML = `<div class="container-xl header-inner">${brand}<a class="auth-home-link" href="${url('hero/userHero.html')}">العودة للرئيسية ←</a></div>`;
  } else {
    const navigation = `<details class="site-navigation${hero?' hero-navigation':''}" open><summary aria-label="الأقسام"><span class="hero-menu-label">الأقسام</span><span aria-hidden="true">☰</span></summary><nav class="${hero?'room-nav':'section-nav'}" aria-label="أقسام سعي">${links.filter((_,index)=>!hero||index<6).map(([id,label,path],index)=>`<a href="${hero?'#'+id:url(path)}" ${hero?`data-room="${index}"`:`data-section-link="${id}"`}>${label}</a>`).join('')}</nav></details>`;
    const actions = `<nav class="account-links header-actions" aria-label="الحساب والمظهر">
      ${hero?'':`<a class="shopping-cart-link" href="${url('Academy/Cart/cart.html')}" aria-label="سلة المشتريات"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3h2l2.4 12h11.2l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>السلة</span></a><a class="project-favorites-link" href="${url('Account/Favorites/favorites.html')}">♡ المفضلة</a>`}
      <button class="theme-toggle" type="button" aria-label="${theme==='dark'?'التبديل إلى الوضع النهاري':'التبديل إلى الوضع الليلي'}" ${hero?'disabled':''}>${theme==='dark'?'☀ الوضع النهاري':'☾ الوضع الليلي'}</button>
      ${hero?`<a class="navbar-login" data-auth="guest" href="${url('Auth/Login/login.html?next=../../hero/userHero.html')}">تسجيل الدخول</a><button class="navbar-logout" data-auth="member" data-logout type="button" hidden>تسجيل الخروج</button>`:''}
      <details class="account-menu"><summary>${accountIcon('profile')}الحساب</summary><div class="account-menu-links">
        <p class="account-dropdown-heading">حسابك على سعي<small>ملفك، نشاطك وتواصلك</small></p>
        <a data-auth="guest" href="${url('Auth/Login/login.html')}">${accountIcon('login')}تسجيل الدخول</a><a data-auth="guest" class="register-link" href="${url('Auth/Register/register.html')}">${accountIcon('register')}إنشاء حساب</a>
        <a href="${url('Account/Profile/profile.html')}">${accountIcon('profile')}الملف الشخصي</a><a href="${url('Account/Dashboard/dashboard.html')}">${accountIcon('dashboard')}لوحة المتابعة</a><a href="${url('Account/Messages/messages.html')}">${accountIcon('messages')}الرسائل</a><a href="${url('Account/Settings/settings.html')}">${accountIcon('settings')}الإعدادات</a>
      </div></details></nav>`;
    const controls = hero ? '<div class="day-night-controls" hidden aria-hidden="true"><button id="dayMode" type="button" aria-pressed="true" disabled>نهار</button><button id="nightMode" type="button" aria-pressed="false" disabled>ليل</button></div>' : '';
    header.innerHTML = hero ? brand+navigation+actions+controls : `<div class="container-xl header-inner">${brand}${navigation}${actions}</div>`;
  }
  script.replaceWith(header);
})();
