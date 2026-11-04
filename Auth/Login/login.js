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
  success.hidden = false;
  success.focus();
  window.OfoqDemoAuth.signIn(companyAccount ? 'company' : 'member');
  window.OfoqFrontend.navigate(window.siteThemeUrl(companyAccount ? "../../company/dashboard.html" : window.OfoqDemoAuth.destination()));
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
