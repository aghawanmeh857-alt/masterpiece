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

// The dashboard reflects only actions from this tab's current visit.
const app = window.OfoqFrontend;
const get = id => document.getElementById(id);
const root = new URL('../../', location.href);
const catalog = app.courses || [];
const learning = app.learning || {enrolled:[], progress:{}};
const buttons = [...document.querySelectorAll('[data-filter]')];
const panel = get('activityTitle').closest('section');
panel.querySelectorAll('[data-activity]').forEach(card => card.remove());
const rows = {
 project: app.ideas.map(item => ({title:item.title, description:item.description, href:new URL('Freelance/freelance.html#idea-'+item.id, root).href})),
 application: app.applications.map(item => ({...item, description:({project:'مشروع',job:'وظيفة',internship:'تدريب'}[item.kind] || '')+' · '+item.status})),
 course: learning.enrolled.map(id => {const course=catalog.find(item=>item.id===id);return course ? {title:course.title,description:Math.round((learning.progress[id]?.length||0)/course.syllabus.length*100)+'% مكتمل',href:new URL('Academy/Course/course.html?id='+id,root).href}:null;}).filter(Boolean),
 event: app.registrations.map(item => ({...item, description:'تم تأكيد التسجيل خلال هذه الزيارة'}))
};
const eventButton = document.createElement('button');eventButton.type='button';eventButton.dataset.filter='event';eventButton.textContent='فعالياتي';
panel.querySelector('.activity-toolbar').append(eventButton);buttons.push(eventButton);
const labels={project:'منشوراتي',application:'طلباتي',course:'تعلّمي',event:'فعالياتي'};
const stats=document.querySelectorAll('.stat-card');
[rows.project.length,rows.application.length,rows.course.length,rows.event.length].forEach((value,index)=>{
 stats[index].querySelector('strong').textContent=value;
 stats[index].querySelector('small').textContent='خلال هذه الزيارة';
});
stats[3].querySelector('span').textContent='الفعاليات';
document.querySelector('.preview-note').textContent='نشاطك خلال هذه الزيارة. تحديث الصفحة يبدأ تجربة جديدة بدون حفظ بيانات.';
function showSection(filter){
 if(!rows[filter])filter='application';
 panel.querySelectorAll('[data-activity]').forEach(card=>card.remove());
 get('activityTitle').textContent=labels[filter];
 get('activityDescription').textContent='نشاطك الحالي في '+labels[filter];
 get('activityCount').textContent=rows[filter].length+' عناصر';
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
 const items=rows[filter].length?rows[filter]:[{title:'لا يوجد نشاط بعد',description:'ابدأ باستكشاف الفرص والدورات، وسيظهر نشاطك هنا.',href:new URL(filter==='course'?'Academy/academy.html':filter==='event'?'Events/events.html':'Freelance/freelance.html',root).href}];
 for(const item of items){
 const card=document.createElement('article');card.className='activity-card';card.dataset.activity=filter;
 const title=document.createElement('h3');title.textContent=item.title;
 const description=document.createElement('p');description.textContent=item.description;
 const link=document.createElement('a');link.href=item.href;link.textContent='فتح التفاصيل ←';card.append(title,description,link);
 if(filter==='application'&&rows[filter].length){const cancel=document.createElement('button');cancel.type='button';cancel.className='text-button';cancel.textContent='سحب الطلب';cancel.addEventListener('click',()=>{app.applications=app.applications.filter(row=>!(row.id===item.id&&row.kind===item.kind));rows.application=rows.application.filter(row=>row!==item);stats[1].querySelector('strong').textContent=app.applications.length;showSection(filter);});card.append(cancel);}
 if(filter==='event'&&rows[filter].length){const cancel=document.createElement('button');cancel.type='button';cancel.className='text-button';cancel.textContent='إلغاء التسجيل';cancel.addEventListener('click',()=>{app.registrations=app.registrations.filter(row=>row.id!==item.id);rows.event=rows.event.filter(row=>row!==item);stats[3].querySelector('strong').textContent=app.registrations.length;showSection(filter);});card.append(cancel);}
 panel.append(card);
 }
}
buttons.forEach(button=>button.addEventListener('click',()=>showSection(button.dataset.filter)));
showSection(new URLSearchParams(location.search).get('tab')||'application');
})();
