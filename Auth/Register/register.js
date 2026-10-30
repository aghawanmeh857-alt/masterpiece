
// Forms are interface examples. Only search and filter forms process their inputs.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (['searchForm', 'filterForm', 'authForm'].includes(form.id)) return;
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

(function () {
// These forms preview the interface only. Nothing is saved or sent.
const form = document.getElementById('authForm');
const password = document.getElementById('password');
const confirmation = document.getElementById('confirmPassword');
const fullName = document.getElementById('fullName');
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
  destination.href = window.siteThemeUrl(companyAccount ? "../../company/dashboard.html" : "../../Freelance/freelance.html");
  destination.textContent = companyAccount ? "افتح لوحة الشركة ←" : "استكشف العمل الحر ←";
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
