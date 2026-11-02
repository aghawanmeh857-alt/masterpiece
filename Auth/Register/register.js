
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

(function () {
// These forms preview the interface only. Nothing is saved or sent.
const form = document.getElementById('authForm');
const password = document.getElementById('password');
const confirmation = document.getElementById('confirmPassword');
const fullName = document.getElementById('fullName');
const serviceType = document.getElementById('serviceType');
if (new URLSearchParams(location.search).get('account') === 'company') document.getElementById('accountType').value = 'company';
const requestedService = new URLSearchParams(location.search).get('service');
if ([...serviceType.options].some(option => option.value === requestedService)) serviceType.value = requestedService;
let serviceChanged = false;
serviceType.addEventListener('change', () => { serviceChanged = true; });
if (fullName) fullName.addEventListener('input', () => fullName.setCustomValidity(''));

function checkPasswords() {
  if (confirmation) {
    confirmation.setCustomValidity(
      confirmation.value !== password.value ? 'يجب أن تتطابق كلمتا المرور.' : ''
    );
  }
}

password.addEventListener('input', checkPasswords);
if (confirmation) confirmation.addEventListener('input', checkPasswords);

document.querySelectorAll('[data-toggle-password]').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'إخفاء' : 'إظهار';
    button.setAttribute('aria-pressed', String(show));
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  checkPasswords();
  if (fullName) {
    fullName.setCustomValidity(fullName.value.trim().length >= 2 ? '' : 'يرجى إدخال اسمك.');
  }
  if (!form.reportValidity()) return;

  const companyAccount = document.getElementById("accountType").value === "company";
  const services = {freelance:'Freelance/freelance.html',jobs:'Jobs/jobs.html',internships:'Internships/internships.html',academy:'Academy/academy.html',workshops:'Academy/academy.html?format=workshop',events:'Events/events.html',profile:'Account/Profile/profile.html'};
  let nextPage = new URL('../../' + services[serviceType.value], location.href).href;
  const requestedNext = new URLSearchParams(location.search).get('next');
  if (requestedNext && !serviceChanged) {
    try { const url = new URL(requestedNext,location.href); const root = new URL('../../',location.href); if(url.origin===root.origin && url.pathname.startsWith(root.pathname) && url.pathname.endsWith('.html') && !/\/(Auth|Admin|company)\//i.test(url.pathname)) nextPage=url.href; } catch {}
  }
  window.OfoqFrontend.user = { signedIn: true, role: companyAccount ? 'company' : 'member' };
  window.OfoqFrontend.memory.setItem('ofoq-demo-signed-in', 'true');
  window.OfoqFrontend.profile.name = fullName.value.trim();
  window.OfoqFrontend.profile.email = form.querySelector('input[type="email"]').value.trim();
  // Clear passwords immediately after previewing the form.
  form.reset();
  checkPasswords();
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    document.getElementById(button.dataset.togglePassword).type = 'password';
    button.textContent = 'إظهار';
    button.setAttribute('aria-pressed', 'false');
  });
  form.hidden = true;
  const success = document.getElementById('authSuccess');
  const destination = success.querySelector("a");
  destination.href = window.siteThemeUrl(companyAccount ? "../../company/dashboard.html" : nextPage);
  destination.textContent = companyAccount ? "افتح لوحة الشركة ←" : "أكمل إلى الخدمة التي اخترتها ←";
  success.hidden = false;
  success.focus();
});

document.getElementById('tryAgain').addEventListener('click', () => {
  document.getElementById('authSuccess').hidden = true;
  form.hidden = false;
  form.querySelector('input').focus();
});

window.componentsReady.then(() => {
  document.getElementById('year').textContent = new Date().getFullYear();
}).catch(() => {});

})();
