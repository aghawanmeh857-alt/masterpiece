(() => {
  const app=window.OfoqFrontend,sources={jobs:app.companyJobs||=[],internships:app.companyInternships||=[]};
  const labels={jobs:'الوظائف',internships:'فرص التدريب',applicants:'المتقدمون'};
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
  const all=()=>[...sources.jobs,...sources.internships];let current='jobs',saving=false;
  const panel=node('section');panel.id='companyJobsPanel';panel.hidden=true;
  panel.innerHTML='<div class="company-opportunity-toolbar"><div><h2 id="companyOpportunityTitle"></h2><p id="companyOpportunitySummary"></p></div><button type="button" class="primary" id="newCompanyOpportunity">+ إضافة فرصة</button></div><div id="companyJobList" class="company-opportunity-grid"></div><div id="companyJobApplicants" class="company-applicant-list"></div>';
  const main=document.getElementById('main');main.insertBefore(panel,main.querySelector('footer'));
  const nav=document.getElementById('navigation');
  const navIcons = {
    jobs: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a21 21 0 0 0 18 0M12 11v4"/>',
    internships: '<path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7l6 4 6-4v-7M22 8v8"/>',
    applicants: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M8 17a4 4 0 0 1 8 0"/>'
  };
  for(const kind of Object.keys(labels)){
    const button=node('button',labels[kind]);
    const icon=node('span',undefined,'nav-icon');
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+navIcons[kind]+'</svg>';
    button.prepend(icon);
    button.type='button';button.dataset.companySection=kind;if(kind==='jobs')button.id='companyJobsTab';nav.insertBefore(button,nav.querySelector('[data-view="profile"]'));button.addEventListener('click',()=>show(kind));
  }
  const dialog=node('dialog');dialog.id='companyOpportunityEditor';dialog.className='company-opportunity-dialog';
  dialog.innerHTML=`<form id="companyJobForm"><div class="dialog-heading"><div><p class="eyebrow">إدارة فرص شركتك</p><h2 id="companyJobEditorTitle"></h2></div><button type="button" class="icon-button" data-company-close aria-label="إغلاق">×</button></div><input name="id" type="hidden"><input name="kind" type="hidden"><div class="company-editor-grid"><label>عنوان الفرصة<input name="title" required minlength="3" maxlength="140"></label><label>اسم الشركة<input name="company" required maxlength="100"></label><label>المجال<select name="category"><option value="development">برمجة وتطوير</option><option value="design">تصميم</option><option value="marketing">تسويق رقمي</option><option value="career">أخرى</option></select></label><label>نمط العمل<select name="location"><option value="remote">عن بُعد</option><option value="onsite">في الموقع</option><option value="hybrid">هجين</option></select></label><label><span id="companyContractLabel">نوع الدوام</span><select name="itemType"></select></label><label><span id="companyExtraLabel">الخبرة</span><select name="extra"></select></label><label>المقابل / الراتب<input name="offer" required maxlength="120" placeholder="مثال: 900 دينار / شهر"></label><label>آخر موعد للتقديم<input name="deadline" type="date" required></label><label class="company-field-wide">نبذة عن الفرصة<textarea name="description" required minlength="20" maxlength="3000" rows="3"></textarea></label><label class="company-field-wide">المتطلبات — كل متطلب بسطر<textarea name="requirements" required maxlength="3000" rows="3"></textarea></label></div><p id="companyJobStatus" role="status" class="form-error"></p><div class="dialog-actions"><button type="button" class="secondary" data-company-close>إلغاء</button><button type="submit" class="primary">نشر الفرصة</button></div></form>`;
  document.body.append(dialog);const form=dialog.querySelector('form'),status=dialog.querySelector('#companyJobStatus');window.OfoqPublishing.mount(form);
  const feeField=node('label');feeField.innerHTML='رسوم التدريب على المتدرّب بالدولار — صفر للمجاني<input name="applicationFee" type="number" min="0" max="100000" step="0.01" value="0"><small>رسوم يدفعها المتدرّب للالتحاق. ضع صفرًا إذا كان التدريب دون رسوم.</small>';form.querySelector('.company-editor-grid').append(feeField);
  const options=(field,rows,value)=>{field.replaceChildren(...rows.map(([key,label])=>{const option=node('option',label);option.value=key;return option;}));if(value)field.value=value;};
  function edit(kind,record=null){
    form.reset();status.textContent='';form.elements.kind.value=kind;feeField.hidden=kind!=='internships';form.elements.applicationFee.disabled=kind!=='internships';form.elements.applicationFee.value=record?.applicationFee||0;
    options(form.elements.itemType,kind==='jobs'?[['full-time','دوام كامل'],['part-time','دوام جزئي'],['contract','عقد مؤقت']]:[['2-months','شهران'],['3-months','3 أشهر'],['6-months','6 أشهر']],record?.itemType);
    options(form.elements.extra,kind==='jobs'?[['junior','مبتدئ'],['mid','متوسط الخبرة'],['senior','خبير']]:[['paid','بمقابل مالي'],['unpaid','دون مقابل مالي']],record?.extra);
    document.getElementById('companyContractLabel').textContent=kind==='jobs'?'نوع الدوام':'مدة التدريب';document.getElementById('companyExtraLabel').textContent=kind==='jobs'?'الخبرة المطلوبة':'مقابل التدريب';
    document.getElementById('companyJobEditorTitle').textContent=(record?'تعديل ':'إضافة ')+(kind==='jobs'?'وظيفة':'فرصة تدريب');form.elements.company.value=app.companyProfile?.name||'برايت لابز';
    if(record)for(const key of ['id','title','company','category','location','offer','deadline','description','requirements'])form.elements[key].value=Array.isArray(record[key])?record[key].join('\n'):(record[key]??'');
    window.OfoqPublishing.fill(form,record||{});form.querySelector('[type=submit]').textContent=record?'حفظ التعديلات':'نشر الفرصة';dialog.showModal();form.elements.title.focus();
  }
  function show(kind){
    current=kind;document.querySelectorAll('#main>section').forEach(section=>section.hidden=section!==panel);panel.hidden=false;
    document.getElementById('pageTitle').textContent=labels[kind];document.getElementById('breadcrumb').textContent=labels[kind];document.getElementById('pageDescription').textContent=kind==='applicants'?'راجع الطلبات الواردة على فرص شركتك.':'أضف التفاصيل والمتطلبات وملف PDF لفرص شركتك.';document.getElementById('addButton').hidden=true;
    nav.querySelectorAll('button').forEach(button=>{if(button.dataset.companySection===kind)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    document.getElementById('sidebar').classList.remove('open');document.getElementById('menuButton').setAttribute('aria-expanded','false');history.replaceState(null,'','#'+kind);render();
  }
  nav.addEventListener('click',event=>{if(event.target.closest('[data-view]'))panel.hidden=true;});
  document.addEventListener('click',event=>{const target=event.target.closest('[data-company-open]');if(target){show(target.dataset.companyOpen);if(target.hasAttribute('data-company-create'))edit(current);}});
  dialog.querySelectorAll('[data-company-close]').forEach(button=>button.addEventListener('click',()=>{if(!saving)dialog.close();}));
  dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
  document.getElementById('newCompanyOpportunity').addEventListener('click',()=>edit(current));
  form.addEventListener('input',event=>{event.target.setCustomValidity('');status.textContent='';});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(saving)return;
    for(const field of form.querySelectorAll('[required]')){field.value=field.value.trim();field.setCustomValidity(field.value?'':'يرجى تعبئة الحقل.');}if(!form.reportValidity())return;
    if(form.elements.deadline.value<new Date().toISOString().slice(0,10)){status.textContent='اختر موعدًا للتقديم لم ينتهِ بعد.';return;}
    const values=Object.fromEntries(new FormData(form)),kind=values.kind,old=sources[kind].find(row=>row.id===values.id);delete values.publisherImage;delete values.removePublisherImage;delete values.publisherPDF;delete values.removePublisherPDF;
    saving=true;form.querySelector('[type=submit]').disabled=true;status.textContent='جاري تجهيز المنشور…';
    try{const publishing=await window.OfoqPublishing.read(form);const record={...old,...values,...publishing,id:old?.id||'company-'+crypto.randomUUID(),kind,status:old?.status||'published',publisherRole:'company',publisherName:values.company,requirements:values.requirements.split('\n').map(line=>line.trim()).filter(Boolean),date:old?.date||new Date().toISOString().slice(0,10),reward:0,symbol:'↗'};if(old)Object.assign(old,record);else sources[kind].unshift(record);app.publishContent(kind,record);dialog.close();show(kind);dispatchEvent(new Event('ofoq:company-content'));}
    catch(error){status.textContent=error.message;}finally{saving=false;form.querySelector('[type=submit]').disabled=false;}
  });
  function attachment(row,container){if(!row.pdf)return;const file=app.documentFor(row.pdf.id);if(!file)return;const link=node('a','تحميل ملف PDF ↓','text-button');link.href=file.url;link.download=file.name;container.append(link);}
  function render(){
    const list=document.getElementById('companyJobList'),requests=document.getElementById('companyJobApplicants');list.replaceChildren();requests.replaceChildren();const applicantView=current==='applicants';list.hidden=applicantView;requests.hidden=!applicantView;document.getElementById('newCompanyOpportunity').hidden=applicantView;document.getElementById('companyOpportunityTitle').textContent=labels[current];
    if(applicantView){
      const rows=app.companyApplications();document.getElementById('companyOpportunitySummary').textContent=rows.length+' طلبات على فرص شركتك';if(!rows.length)requests.append(node('p','لا توجد طلبات على فرص شركتك بعد.','company-empty'));
      for(const request of rows){const card=node('article',undefined,'panel company-applicant-card'),heading=node('div');heading.append(node('h3',request.name),node('p',request.title),node('p',[request.email,request.phone,request.experience,request.message].filter(Boolean).join(' · ')),node('span',request.status,'company-label'));const actions=node('div',undefined,'row-actions');for(const decision of ['مقبول','مرفوض','قيد المراجعة']){const button=node('button',decision,'secondary');button.type='button';button.disabled=request.status===decision;button.addEventListener('click',()=>{app.reviewApplication(request.applicationId,decision,'company');render();dispatchEvent(new Event('ofoq:company-content'));});actions.append(button);}if(request.resume?.url){const cv=node('a','عرض السيرة الذاتية ↗','secondary');cv.href=request.resume.url;cv.target='_blank';cv.rel='noopener';actions.append(cv);}if(request.portfolioUrl&&/^https?:\/\//i.test(request.portfolioUrl)){const portfolio=node('a','معرض الأعمال ↗','secondary');portfolio.href=request.portfolioUrl;portfolio.target='_blank';portfolio.rel='noopener noreferrer';actions.append(portfolio);}card.append(heading,actions);requests.append(card);}
    }else{
      const rows=sources[current];document.getElementById('companyOpportunitySummary').textContent=rows.length?rows.length+' فرص · '+rows.filter(row=>row.status==='published').length+' منشورة':'';if(!rows.length)list.append(node('p','لا توجد فرص منشورة بعد.','company-empty'));
      for(const row of rows){const card=node('article',undefined,'panel company-opportunity-card');card.append(node('span',row.status==='published'?'منشورة':'متوقفة','company-label'),node('h3',row.title),node('p',row.description));const info=node('dl');for(const [label,value]of [['الجهة',row.company],['المقابل',row.offer],['آخر موعد',row.deadline]]){const group=node('div');group.append(node('dt',label),node('dd',value));info.append(group);}card.append(info);attachment(row,card);const actions=node('div',undefined,'row-actions');const editButton=node('button','تعديل','secondary');editButton.type='button';editButton.addEventListener('click',()=>edit(current,row));const pause=node('button',row.status==='published'?'إيقاف النشر':'إعادة النشر','secondary');pause.type='button';pause.addEventListener('click',()=>{row.status=row.status==='published'?'paused':'published';app.publishContent(current,row);render();dispatchEvent(new Event('ofoq:company-content'));});const removeButton=node('button','حذف الفرصة','secondary company-delete-opportunity');
        removeButton.type='button';
        removeButton.setAttribute('aria-label','حذف الفرصة: '+row.title);
        const kind=current;
        removeButton.addEventListener('click',()=>{
          if(!window.confirm('هل تريد حذف «'+row.title+'»؟ ستختفي من الفرص المنشورة.'))return;
          const index=sources[kind].findIndex(item=>item.id===row.id);
          if(index<0)return;
          sources[kind].splice(index,1);
          if(app.contentChanges?.[kind])app.contentChanges[kind]=app.contentChanges[kind].filter(item=>String(item.id)!==String(row.id));
          const removed=((app.removedContent||={})[kind]||=[]);
          if(!removed.some(id=>String(id)===String(row.id)))removed.push(row.id);
          render();
          dispatchEvent(new Event('ofoq:company-content'));
        });
        actions.append(editButton,pause,removeButton);card.append(actions);list.append(card);}
    }
  }
  addEventListener('hashchange',()=>{const kind=location.hash.slice(1);if(labels[kind])show(kind);});
  if(labels[location.hash.slice(1)])show(location.hash.slice(1));else render();
})();
