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
    showPublicDocuments();
  }

  function showPublicDocuments() {
    const host = document.getElementById('profilePublicDocuments');
    const app = window.OfoqFrontend;
    const owner = !requestedUser;
    const source = owner ? app.profile : profile;
    host.replaceChildren();
    for (const [kind, title, file, remote] of [
      ['cv', 'السيرة الذاتية · CV', owner ? app.cvFile : null, source.resumeUrl],
      ['portfolio', 'معرض الأعمال · Portfolio', null, source.portfolioUrl]
    ]) {
      const card = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = title;
      card.append(heading);
      const actions = document.createElement('div');
      actions.className = 'profile-document-actions';
      let url = file?.url;
      if (!url && remote) {
        try { const parsed = new URL(remote); if (['https:', 'http:'].includes(parsed.protocol)) url = parsed.href; } catch {}
      }
      if (url) {
        const view = document.createElement('a');
        view.textContent = kind === 'portfolio' && !file ? 'عرض الأعمال ↗' : 'عرض الملف ↗';
        view.href = url; view.target = '_blank'; view.rel = 'noopener noreferrer';
        actions.append(view);
        if (file) {
          const download = document.createElement('a');
          download.textContent = 'تحميل ↓'; download.href = file.url; download.download = file.name;
          actions.append(download);
        }
      } else {
        const empty = document.createElement('p');
        empty.textContent = kind === 'cv' ? 'لم تُرفق سيرة ذاتية بعد.' : 'لم يُضف رابط أعمال بعد.';
        actions.append(empty);
      }
      if (owner) {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = kind === 'cv' ? (file ? 'تغيير الملف' : 'إرفاق PDF') : (url ? 'تعديل الرابط' : 'إضافة رابط');
        edit.addEventListener('click', () => {
          if (kind === 'cv') document.getElementById('cvFile').click();
          else { editButton.click(); document.getElementById('editPortfolioUrl').focus(); }
        });
        actions.append(edit);
      }
      card.append(actions); host.append(card);
    }
  }
  window.addEventListener('saei:profile-documents', showPublicDocuments);

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
    document.getElementById('editPortfolioUrl').value = window.OfoqFrontend.profile.portfolioUrl || '';
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
    const portfolioUrl = document.getElementById('editPortfolioUrl').value.trim();
    if (portfolioUrl) {
      try { if (!['https:', 'http:'].includes(new URL(portfolioUrl).protocol)) throw new Error(); }
      catch { const field = document.getElementById('editPortfolioUrl'); field.setCustomValidity('أدخل رابطًا يبدأ بـ https:// أو http://'); field.reportValidity(); return; }
    }
    profile.portfolioUrl = portfolioUrl;
    for (const [key, id] of Object.entries({name: 'editName', role: 'editRole', location: 'editLocation', bio: 'editBio', skills: 'editSkills'})) profile[key] = document.getElementById(id).value.trim();
    Object.assign(window.OfoqFrontend.profile, profile);
    window.OfoqFrontend.log?.('profile','تحديث المعلومات الشخصية');
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
