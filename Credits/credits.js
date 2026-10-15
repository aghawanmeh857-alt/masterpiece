(function () {
// 1. قراءة الوضع من الرابط، دون تخزين.
var theme = new URLSearchParams(location.search).get('theme');
var themeButton = document.getElementById('themeButton');

function changeTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeButton.textContent = dark ? '☀ الوضع النهاري' : '☾ الوضع الليلي';

  // نحمل اختيار اللون معنا عند الانتقال إلى شاشة أخرى.
  document.querySelectorAll('a[href]').forEach(function (link) {
    var url = new URL(link.href);
    if (url.origin === location.origin && url.pathname.endsWith('.html')) {
      url.searchParams.set('theme', dark ? 'dark' : 'light');
      link.href = url.href;
    }
  });
}

changeTheme(theme === 'dark');
themeButton.addEventListener('click', function () {
  var dark = !document.body.classList.contains('dark');
  changeTheme(dark);
  var url = new URL(location.href);
  url.searchParams.set('theme', dark ? 'dark' : 'light');
  history.replaceState(null, '', url);
});


})();