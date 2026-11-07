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
  const services = {freelance:'Freelance/freelance.html',jobs:'Jobs/jobs.html',internships:'Internships/internships.html',academy:'Academy/academy.html',events:'Events/events.html',profile:'Account/Profile/profile.html'};
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
