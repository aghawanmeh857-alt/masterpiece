
document.querySelectorAll('form').forEach(form => form.autocomplete = 'off');
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
function createApplicants() { return {records:[]}; }
function localDateTime(value) { const date=new Date(value); if(!Number.isFinite(date.getTime()))return ''; return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16); }
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const id=new URLSearchParams(location.search).get('id');
if(window.OfoqFrontend.contentFor)projects.splice(0,projects.length,...window.OfoqFrontend.contentFor('projects',projects));
const project=id===null?projects[0]:projects.find(p=>String(p.id)===id);
const projectSelect=$('ownerProject');
projects.forEach(item=>{const option=el('option',item.title);option.value=item.id;projectSelect.append(option);});
projectSelect.value=project?String(project.id):'';
projectSelect.addEventListener('change',()=>{window.OfoqFrontend.navigate(window.siteThemeUrl('./owner.html?id='+encodeURIComponent(projectSelect.value)));});
$('ownerProjectTitle').textContent=project?project.title:'المنشور غير موجود';
$('projectApplicantsPanel').hidden=!project;
$('year').textContent=new Date().getFullYear();
if(project){
 const model=(window.OfoqFrontend.ownerWorkspaces ||= {})[project.id] ||= createApplicants(project);let selected=null;
 function notice(text){$('applicantStatus').textContent=text;}
 function button(text,action,record,cls='btn btn-small-outline'){const b=el('button',text,cls);b.type='button';b.dataset.applicant=record.id;b.dataset.action=action;return b;}
 function render(){
  const app=window.OfoqFrontend;
  const statusKeys={'قيد المراجعة':'pending','قائمة مختصرة':'shortlist','مقبول':'accepted','مرفوض':'rejected'};
  const prior=new Map(model.records.map(row=>[row.id,row]));
  model.records=app.applications.filter(row=>row.kind==='project'&&String(row.id)===String(project.id)).map(row=>({...prior.get(row.applicationId),id:row.applicationId,application:row,name:row.name,specialty:row.role||'متقدم للمشروع',experience:row.experience||'',message:row.message||'لم يرفق رسالة.',rating:'—',price:row.proposedAmount||project.budget,weeks:row.weeks||project.weeks,skills:String(row.skills||'').split(',').filter(Boolean),status:statusKeys[row.status]||'pending',meeting:prior.get(row.applicationId)?.meeting||null,messages:prior.get(row.applicationId)?.messages||[]}));
  const query=$('applicantSearch').value.trim().toLowerCase(),status=$('applicantFilter').value;
  const records=model.records.filter(r=>(!status||r.status===status)&&(r.name+' '+r.specialty+' '+r.skills.join(' ')).toLowerCase().includes(query));
  $('applicantCount').textContent=model.records.length+' متقدمين';
  $('applicantList').replaceChildren(...records.map(r=>{
   const card=el('article',undefined,'applicant-card'),heading=el('div',undefined,'applicant-heading'),info=el('div'),avatar=el('span',r.name.slice(0,1),'candidate-avatar');
   info.append(el('h3',r.name),el('p',[r.specialty,r.experience,r.application.email].filter(Boolean).join(' · ')));
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
  if(statuses[b.dataset.action]) { window.OfoqFrontend.reviewApplication(r.application.applicationId, b.dataset.action==='pending'?'قيد المراجعة':statuses[b.dataset.action], 'project', project.id);r.status=b.dataset.action;render();notice('تم تحديث حالة الطلب: '+statuses[r.status]); }
  if(b.dataset.action==='copy' && r.meeting) { try {await navigator.clipboard.writeText(r.meeting.page);notice('تم نسخ رابط المقابلة.');} catch {notice('تعذّر النسخ؛ يمكنك فتح المقابلة ونسخ الرابط.');} }
  if(b.dataset.action==='profile'){$('candidateProfileName').textContent=r.name;$('candidateProfileBio').textContent=r.specialty+' · '+r.experience+' · '+r.skills.join('، ');$('candidatePortfolio').replaceChildren();for(const [title,url]of [['السيرة الذاتية',r.application.resume?.url],['معرض الأعمال',r.application.portfolioUrl]]){if(!url)continue;if(title==='معرض الأعمال'&&!/^https?:\/\//i.test(url))continue;const link=el('a',title+' ↗','details-link');link.href=url;link.target='_blank';link.rel='noopener noreferrer';$('candidatePortfolio').append(link);}if(!$('candidatePortfolio').children.length)$('candidatePortfolio').append(el('p','لم يرفق المتقدم سيرة أو رابط أعمال.','demo-note'));$('candidateProfile').showModal();}
  if(b.dataset.action==='message'){$('messageRecipient').textContent='مراسلة '+r.name;$('privateMessageForm').reset();$('privateMessageStatus').textContent='';renderMessages();$('privateMessageDialog').showModal();}
  if(b.dataset.action==='meeting'){const form=$('meetingForm');form.reset();$('meetingError').textContent='';$('meetingCandidate').textContent='مقابلة '+r.name;for(const key of ['provider','date','url'])form.elements.namedItem(key).value=(key==='date'&&r.meeting?localDateTime(r.meeting.date):r.meeting?.[key])|| (key==='provider'?'jitsi':'');providerFields();$('meetingDialog').showModal();}
 });
 function providerFields(){const zoom=$('meetingForm').elements.provider.value==='zoom';$('zoomField').hidden=!zoom;$('meetingForm').elements.url.required=zoom;}
 $('meetingForm').elements.provider.addEventListener('change',providerFields);
 $('meetingForm').addEventListener('input',()=>$('meetingError').textContent='');
 $('privateMessageForm').addEventListener('submit', event => {
  event.preventDefault(); const field = $('privateMessageText'); field.value = field.value.trim();
  field.setCustomValidity(field.value ? '' : 'اكتب رسالة أولًا.');
  if (!event.currentTarget.reportValidity()) return;
  model.records.find(item => item.id === selected).messages.push(field.value);
  field.value = ''; renderMessages(); $('privateMessageStatus').textContent = 'أُضيفت الرسالة خلال هذه الزيارة.';
 });
 $('privateMessageText').addEventListener('input', event => event.target.setCustomValidity(''));
 $('meetingForm').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const when = new Date(form.elements.date.value);
  if (!Number.isFinite(when.getTime()) || when <= new Date()) { $('meetingError').textContent = 'اختر موعدًا في المستقبل.'; return; }
  const record = model.records.find(item => item.id === selected), provider = form.elements.provider.value;
  const target = new URL('../../Meeting/meeting.html', location.href);
  target.searchParams.set('room', 'OfoqInterview-' + crypto.randomUUID().replaceAll('-', ''));
  let page = target.href;
  if (provider === 'zoom') {
   try { const url = new URL(form.elements.url.value); if (url.protocol !== 'https:' || !/(^|\.)zoom\.us$/.test(url.hostname)) throw Error(); page = url.href; }
   catch { $('meetingError').textContent = 'أدخل رابط HTTPS صالحًا من Zoom.'; return; }
  }
  record.meeting = {provider, date: when.toISOString(), url: form.elements.url.value, page};
  $('meetingDialog').close(); render(); notice('تم تحديد موعد المقابلة خلال هذه الزيارة.');
 });
 render();
}

})();
