
// Forms are interface examples. Only search and filter forms process their inputs.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (['searchForm', 'filterForm'].includes(form.id)) return;
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
// Simple front-end previews. Updates stay on the current page only.
window.componentsReady.then(() => {
  document.getElementById('year').textContent = new Date().getFullYear();
}).catch(() => {});

const profileForm = document.getElementById('profileForm');

// This part runs only on the Profile page.
if (profileForm) {
  const editButton = document.getElementById('editProfile');
  const cancelButton = document.getElementById('cancelEdit');
  const status = document.getElementById('profileStatus');
  let profile = {
    name: 'أليكس مورغان',
    role: 'مصمم واجهات ومطوّر مواقع',
    location: 'عمّان، الأردن',
    bio: 'أحوّل الأفكار إلى تجارب رقمية واضحة وسهلة. أستمتع ببناء المواقع والعمل مع أشخاص يهتمون بجودة التصميم.',
    skills: 'تصميم الواجهات, Figma, HTML, CSS, JavaScript'
  };

  function showProfile() {
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileRole').textContent = profile.role;
    document.getElementById('profileLocation').textContent = profile.location;
    document.getElementById('profileBio').textContent = profile.bio;
    document.getElementById('profileAvatar').textContent = profile.name[0].toUpperCase();
    const skills = document.getElementById('profileSkills');
    skills.replaceChildren();
    profile.skills.split(',').map(skill => skill.trim()).filter(Boolean).forEach(skill => {
      const tag = document.createElement('span');
      tag.textContent = skill;
      tag.dir = 'auto';
      skills.append(tag);
    });
    document.getElementById('profileSkillCount').textContent = skills.children.length;
  }

  function closeEditor() {
    profileForm.hidden = true;
    editButton.hidden = false;
    editButton.focus();
  }

  editButton.addEventListener('click', () => {
    profileForm.querySelectorAll('input, textarea').forEach(input => input.setCustomValidity(''));
    document.getElementById('editName').value = profile.name;
    document.getElementById('editRole').value = profile.role;
    document.getElementById('editLocation').value = profile.location;
    document.getElementById('editBio').value = profile.bio;
    document.getElementById('editSkills').value = profile.skills;
    profileForm.hidden = false;
    editButton.hidden = true;
    status.textContent = '';
    document.getElementById('editName').focus();
  });

  cancelButton.addEventListener('click', closeEditor);
  profileForm.addEventListener('input', event => {
    event.target.setCustomValidity('');
  });

  showProfile();
}

// One account can publish projects and apply as a freelancer.
const filterButtons = document.querySelectorAll('[data-filter]');
const sections = {
  project: ['مشاريعي', 'المشاريع التي نشرتها، ومتابعة المتقدّمين عليها.', 'مشاريع منشورة'],
  application: ['طلباتي', 'المشاريع التي قدّمت عليها كمستقل، وحالة كل طلب.', 'طلبات تقديم'],
  course: ['تعلّمي', 'مساراتك التعليمية والتقدّم فيها.', 'مسارات تعلّم']
};
function showSection(filter) {
  const [title, description, countLabel] = sections[filter];
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  let count = 0;
  document.querySelectorAll('[data-activity]').forEach(card => {
    card.hidden = card.dataset.activity !== filter;
    if (!card.hidden) count++;
  });
  document.getElementById('activityTitle').textContent = title;
  document.getElementById('activityDescription').textContent = description;
  document.getElementById('activityCount').textContent = `${count} · ${countLabel} توضيحية`;
}
filterButtons.forEach(button => button.addEventListener('click', () => showSection(button.dataset.filter)));
showSection('project');

})();
