// Render synchronously so page scripts bind to the same shared navigation.
(() => {
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const mode = script.dataset.mode || 'site';
  const hero = mode === 'hero';
  const theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';
  const url = path => { const target = new URL(path, root); target.searchParams.set('theme', theme); return target.href; };
  const links = [
    ['lobby','الرئيسية','hero/userHero.html'],
    ['freelance','العمل الحر','Freelance/freelance.html'],
    ['academy','الأكاديمية','Academy/academy.html'],
    ['internships','فرص التدريب','Internships/internships.html'],
    ['jobs','الوظائف','Jobs/jobs.html'],
    ['events','الفعاليات','Events/events.html'],
    ['workshops','الورش التدريبية','Academy/academy.html?format=workshop']
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
      <details class="account-menu"><summary>الحساب</summary><div class="account-menu-links">
        <a data-auth="guest" href="${url('Auth/Login/login.html')}">تسجيل الدخول</a><a data-auth="guest" class="register-link" href="${url('Auth/Register/register.html')}">إنشاء حساب</a>
        <a href="${url('Account/Profile/profile.html')}">الملف الشخصي</a><a href="${url('Account/Dashboard/dashboard.html')}">لوحة المتابعة</a><a href="${url('Account/Messages/messages.html')}">الرسائل</a><a href="${url('Account/Settings/settings.html')}">الإعدادات</a>
      </div></details></nav>`;
    const controls = hero ? '<div class="day-night-controls" hidden aria-hidden="true"><button id="dayMode" type="button" aria-pressed="true" disabled>نهار</button><button id="nightMode" type="button" aria-pressed="false" disabled>ليل</button></div>' : '';
    header.innerHTML = hero ? brand+navigation+actions+controls : `<div class="container-xl header-inner">${brand}${navigation}${actions}</div>`;
  }
  script.replaceWith(header);
})();
