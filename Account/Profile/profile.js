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
  profile = { ...profile, ...window.OfoqFrontend.profile };

  const requestedUser = new URLSearchParams(location.search).get('user');
  const publisher = window.OfoqPublishers.get(requestedUser);
  if (requestedUser) {
    editButton.hidden = true;
    document.querySelector('.profile-dashboard-link').hidden = true;
    document.querySelector('.profile-stats').hidden = true;
    document.querySelector('[aria-labelledby="portfolioTitle"]').hidden = true;
    const heading = document.querySelector('.account-heading');
    heading.querySelector('h1').textContent = publisher ? 'حساب الناشر' : 'الحساب غير موجود';
    heading.querySelector('p:last-child').textContent = 'تعرّف على الناشر وتواصل معه.';
    heading.querySelector('a').href = '../../Freelance/freelance.html';
    heading.querySelector('a').textContent = 'العودة إلى المشاريع ←';
    document.querySelector('.preview-note').textContent = 'حساب ناشر توضيحي ضمن معاينة الموقع.';
    if (!publisher) {
      document.querySelector('.account-grid').hidden = true;
      return;
    }
    profile = { ...publisher };
    document.title = publisher.name + ' — سعي';
    const message = document.createElement('a');
    message.className = 'btn btn-orange';
    message.href = window.OfoqPublishers.url('Messages', publisher.id);
    message.textContent = 'مراسلة ↗';
    editButton.after(message);
    document.querySelector('.availability').textContent = 'ناشر على سعي';
  }

  function showProfile() {
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileRole').textContent = profile.role;
    document.getElementById('profileLocation').textContent = profile.location;
    document.getElementById('profileBio').textContent = profile.bio;
    if (!publisher) document.querySelector('.availability').textContent = window.OfoqFrontend.settings.availability;
    const avatar = document.getElementById('profileAvatar');
    if (publisher) {
      const image = document.createElement('img');
      image.src = publisher.avatar;
      image.alt = 'صورة حساب ' + publisher.name;
      image.width = 96;
      image.height = 96;
      avatar.removeAttribute('aria-hidden');
      avatar.replaceChildren(image);
    } else avatar.textContent = profile.name[0].toUpperCase();
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
  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    profileForm.querySelectorAll('[required]').forEach(input => input.setCustomValidity(input.value.trim() ? '' : 'يرجى تعبئة هذا الحقل.'));
    document.getElementById('editName').setCustomValidity(document.getElementById('editName').value.trim().length >= 2 ? '' : 'اكتب اسمًا من حرفين على الأقل.');
    if (!profileForm.reportValidity()) return;
    for (const [key, id] of Object.entries({name: 'editName', role: 'editRole', location: 'editLocation', bio: 'editBio', skills: 'editSkills'})) profile[key] = document.getElementById(id).value.trim();
    Object.assign(window.OfoqFrontend.profile, profile);
    showProfile(); closeEditor();
    status.textContent = 'تم تحديث ملفك خلال هذه الزيارة.';
  });
  profileForm.addEventListener('input', event => {
    event.target.setCustomValidity('');
  });

  showProfile();
}

// Dashboard filters show/hide existing cards, without rebuilding the page.
const filterButtons = document.querySelectorAll('[data-filter]');
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
    let count = 0;
    document.querySelectorAll('[data-activity]').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.activity !== filter;
      if (!card.hidden) count++;
    });
    document.getElementById('activityCount').textContent =
      `${count} من العناصر المعروضة`;
  });
});

})();
