
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

// Fixed examples for this screen.
const projects = [
  {
    id: 1,
    title: "لوحة متابعة بـReact لشركة خدمات لوجستية",
    description: "بناء لوحة إدارة تتضمن رسومًا بيانية وأدوارًا للمستخدمين.",
    skills: ["React", "Node.js", "رسوم بيانية"],
    category: "development",
    budget: 800,
    weeks: 3,
    type: "fixed",
    date: "2026-10-08",
    icon: "dashboard",
    color: "orange"
  },
  {
    id: 2,
    title: "إعادة تصميم واجهات تطبيق جوّال",
    description: "إعادة تصميم شاشات تطبيق لياقة بدنية قائم.",
    skills: ["Figma", "UI/UX"],
    category: "design",
    budget: 450,
    weeks: 2,
    type: "fixed",
    date: "2026-10-07",
    icon: "mobile",
    color: "blue"
  },
  {
    id: 3,
    title: "صفحة تعريفية لمنتج برمجي",
    description: "صفحة تعريفية متجاوبة تعرض الأسعار ونموذج التواصل.",
    skills: ["HTML", "CSS"],
    category: "development",
    budget: 300,
    weeks: 1,
    type: "fixed",
    date: "2026-10-06",
    icon: "code",
    color: "green"
  },
  {
    id: 4,
    title: "محتوى تواصل اجتماعي لمقهى",
    description: "خطة شهرية للمنشورات والقصص على Instagram.",
    skills: ["التسويق الرقمي"],
    category: "marketing",
    budget: 200,
    weeks: 4,
    type: "ongoing",
    date: "2026-10-05",
    icon: "marketing",
    color: "purple"
  }
];


(function () {
const statuses = { pending: 'جديد', shortlist: 'قائمة مختصرة', accepted: 'مقبول', rejected: 'مرفوض' };
function createApplicants(project) {
  const records = [
    {id:'ahmad',name:'أحمد خالد',specialty:'تطوير واجهات ومواقع',experience:'4 سنوات',message:'أستطيع تنفيذ المشروع على مراحل واضحة، مع مراجعة كل مرحلة معك.',rating:'4.9',ratio:0.95,weeks:project.weeks,status:'pending'},
    {id:'layan',name:'ليان عمر',specialty:'تصميم وتجربة المستخدم',experience:'3 سنوات',message:'أبدأ بفهم أهداف المشروع ثم أعرض تصورًا أوليًا قبل التنفيذ.',rating:'4.8',ratio:0.85,weeks:project.weeks+1,status:'shortlist'},
    {id:'omar',name:'عمر يوسف',specialty:'تطوير منتجات رقمية',experience:'5 سنوات',message:'لدي خبرة بمشاريع مشابهة، ويمكننا مناقشة نطاق العمل في مقابلة قصيرة.',rating:'4.9',ratio:1,weeks:project.weeks,status:'pending'}
  ].map(item=>({...item,price:Math.round(project.budget*item.ratio),skills:[...project.skills],meeting:null,messages:[]}));
  return { records };
}
function localDateTime(value) { const date=new Date(value); if(!Number.isFinite(date.getTime()))return ''; return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16); }
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const id=new URLSearchParams(location.search).get('id');
const project=id===null?projects[0]:projects.find(p=>String(p.id)===id);
const projectSelect=$('ownerProject');
projects.forEach(item=>{const option=el('option',item.title);option.value=item.id;projectSelect.append(option);});
projectSelect.value=project?String(project.id):'';
projectSelect.addEventListener('change',()=>{location.href=window.siteThemeUrl('./owner.html?id='+encodeURIComponent(projectSelect.value));});
$('ownerProjectTitle').textContent=project?project.title:'المنشور غير موجود';
$('projectApplicantsPanel').hidden=!project;
$('year').textContent=new Date().getFullYear();
if(project){
 const model=createApplicants(project);let selected=null;
 function notice(text){$('applicantStatus').textContent=text;}
 function button(text,action,record,cls='btn btn-small-outline'){const b=el('button',text,cls);b.type='button';b.dataset.applicant=record.id;b.dataset.action=action;return b;}
 function render(){
  const query=$('applicantSearch').value.trim().toLowerCase(),status=$('applicantFilter').value;
  const records=model.records.filter(r=>(!status||r.status===status)&&(r.name+' '+r.specialty+' '+r.skills.join(' ')).toLowerCase().includes(query));
  $('applicantCount').textContent=model.records.length+' متقدمين توضيحيين';
  $('applicantList').replaceChildren(...records.map(r=>{
   const card=el('article',undefined,'applicant-card'),heading=el('div',undefined,'applicant-heading'),info=el('div'),avatar=el('span',r.name.slice(0,1),'candidate-avatar');
   info.append(el('h3',r.name),el('p',r.specialty+' · '+r.experience),el('small','★ '+r.rating+' · تقييم توضيحي'));
   heading.append(avatar,info,el('span',statuses[r.status],'candidate-state '+r.status));card.append(heading,el('p',r.message,'candidate-message'));
   const tags=el('div',undefined,'candidate-skills');r.skills.forEach(skill=>tags.append(el('span',skill)));card.append(tags,el('p','$'+r.price+' · '+r.weeks+' أسبوع','candidate-offer'));
   if(r.meeting){const meeting=el('div',undefined,'meeting-card');meeting.append(el('strong',(r.meeting.provider==='jitsi'?'Jitsi':'Zoom')+' · '+new Intl.DateTimeFormat('ar-JO',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Amman'}).format(new Date(r.meeting.date))));const join=el('a','فتح المقابلة ↗','details-link');join.href=window.siteThemeUrl(r.meeting.page);meeting.append(join,button('نسخ رابط المقابلة','copy',r));card.append(meeting);}
   const actions=el('div',undefined,'candidate-actions');actions.append(button('الملف والأعمال','profile',r),button('مراسلة','message',r),button(r.meeting?'تعديل الموعد':'تحديد مقابلة','meeting',r,'btn btn-orange'));
   for(const [value,title]of [['shortlist','قائمة مختصرة'],['accepted','قبول'],['rejected','رفض']]){const b=button(title,value,r);b.disabled=r.status===value;actions.append(b);}if(r.status==='rejected')actions.append(button('إعادة للمراجعة','pending',r));
   if(r.status==='rejected')actions.querySelector('[data-action="meeting"]').disabled=true;
   card.append(actions);return card;
  }));if(!records.length)$('applicantList').append(el('p','لا توجد طلبات مطابقة.','demo-note'));
 }
 $('applicantSearch').addEventListener('input',render);$('applicantFilter').addEventListener('change',render);
 function renderMessages(){const r=model.records.find(item=>item.id===selected);$('candidateMessages').replaceChildren(...r.messages.map(text=>el('p',text,'detail-comment')));}
 document.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;if(b.dataset.close)$ (b.dataset.close).close();if(!b.dataset.applicant)return;
  const r=model.records.find(item=>item.id===b.dataset.applicant);selected=r.id;
  if(statuses[b.dataset.action]) notice('هذه شاشة عرض فقط؛ لا يتم حفظ أو إرسال أي بيانات.');
  if(b.dataset.action==='profile'){$('candidateProfileName').textContent=r.name;$('candidateProfileBio').textContent=r.specialty+' · '+r.experience+' · '+r.skills.join('، ');$('candidatePortfolio').replaceChildren(...['نموذج واجهة تطبيق','تصور موقع متجاوب','لوحة متابعة'].map(title=>el('div',title,'portfolio-sample')));$('candidateProfile').showModal();}
  if(b.dataset.action==='message'){$('messageRecipient').textContent='مراسلة '+r.name;$('privateMessageForm').reset();$('privateMessageStatus').textContent='';renderMessages();$('privateMessageDialog').showModal();}
  if(b.dataset.action==='meeting'){const form=$('meetingForm');form.reset();$('meetingError').textContent='';$('meetingCandidate').textContent='مقابلة '+r.name;for(const key of ['provider','date','url'])form.elements.namedItem(key).value=(key==='date'&&r.meeting?localDateTime(r.meeting.date):r.meeting?.[key])|| (key==='provider'?'jitsi':'');providerFields();$('meetingDialog').showModal();}
 });
 function providerFields(){const zoom=$('meetingForm').elements.provider.value==='zoom';$('zoomField').hidden=!zoom;$('meetingForm').elements.url.required=zoom;}
 $('meetingForm').elements.provider.addEventListener('change',providerFields);
 $('meetingForm').addEventListener('input',()=>$('meetingError').textContent='');
 render();
}

})();