// Publishing fields and PDFs belong to the current tab's session, never browser storage.
(() => {
  async function validatePDFFile(file) {
    if(!/\.pdf$/i.test(file.name)||file.size>10*1024*1024||file.size<5)throw new Error('اختر ملف PDF صحيحًا لا يتجاوز 10 ميغابايت.');
    if(await file.slice(0,5).text()!=='%PDF-')throw new Error('محتوى الملف ليس PDF صالحًا.');
    return file;
  }
  async function validateEducationFile(file) {
    if(/\.pdf$/i.test(file.name)){await validatePDFFile(file);return 'pdf';}
    if(file.size>10*1024*1024||file.size<3)throw new Error('حجم كل مرفق يجب ألا يتجاوز 10 ميغابايت.');
    const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
    const png=/\.png$/i.test(file.name)&&[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
    const jpg=/\.jpe?g$/i.test(file.name)&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    const webp=/\.webp$/i.test(file.name)&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
    if(!png&&!jpg&&!webp)throw new Error('اختر ملف PDF أو صورة JPG أو PNG أو WebP صحيحة.');
    return 'image';
  }
  if(typeof module!=='undefined'&&module.exports){module.exports={validatePDFFile,validateEducationFile};return;}
  const states=new WeakMap(),app=window.OfoqFrontend;
  function documentFor(pdf){if(!pdf)return null;const local=pdf.id?app.documentFor(pdf.id):null;if(local)return local;if(typeof pdf.url!=='string'||!pdf.url.trim())return null;try{const url=new URL(pdf.url,location.href);return ['https:','http:'].includes(url.protocol)?{url:url.href,name:pdf.name||'details.pdf'}:null;}catch{return null;}}
  const locationField='<label>نمط العمل<select name="location"><option value="remote">عن بُعد</option><option value="onsite">في الموقع</option><option value="hybrid">هجين</option></select></label>';
  const jobFields='<label>نوع الدوام<select name="itemType"><option value="full-time">دوام كامل</option><option value="part-time">دوام جزئي</option><option value="contract">عقد مؤقت</option></select></label><label>الخبرة<select name="extra"><option value="junior">مبتدئ</option><option value="mid">متوسط الخبرة</option><option value="senior">خبير</option></select></label>';
  const internshipFields='<label>مدة التدريب<select name="itemType"><option value="2-months">شهران</option><option value="3-months">3 أشهر</option><option value="6-months">6 أشهر</option></select></label><label>المقابل<select name="extra"><option value="paid">مدفوع</option><option value="unpaid">دون مقابل مالي</option></select></label>';
  const opportunityFields='<label>الراتب / المقابل<input name="offer" required maxlength="120"></label><label>آخر موعد للتقديم<input name="deadline" type="date" required></label><label>المتطلبات — كل متطلب بسطر<textarea name="requirements" rows="3" maxlength="5000" required></textarea></label>';
  const groups={
    jobs:locationField+jobFields+opportunityFields,
    internships:locationField+internshipFields+opportunityFields,
    projects:'<div class="form-row"><label>الميزانية بالدولار<input name="budget" type="number" min="1" max="1000000" required></label><label>المدة بالأسابيع<input name="weeks" type="number" min="1" max="104" required></label></div><label>نوع المشروع<select name="type"><option value="fixed">بسعر ثابت</option><option value="ongoing">مشروع مستمر</option></select></label><label>المهارات — مفصولة بفواصل<input name="skills" maxlength="500"></label><label>المخرجات المطلوبة — كل مخرج بسطر<textarea name="outputs" rows="3" maxlength="4000"></textarea></label><label>مراحل التنفيذ — كل مرحلة بسطر<textarea name="steps" rows="3" maxlength="4000"></textarea></label>',
    courses:'<label>نوع المحتوى<select name="format"><option value="path">دورة / مسار أكاديمي</option><option value="workshop">ورشة تدريبية</option></select></label><label>اسم المدرّب<input name="instructor" maxlength="100" required></label><div class="form-row"><label>الساعات<input name="hours" type="number" min="0.5" max="500" step="0.5" required></label><label>السعر بالدولار<input name="price" type="number" min="0" max="100000" value="0" required></label></div><label>المستوى<select name="level"><option value="beginner">مبتدئ</option><option value="intermediate">متوسط</option><option value="advanced">متقدم</option></select></label><label>محتوى الدورة / الورشة — كل وحدة بسطر<textarea name="syllabus" maxlength="5000" rows="4" required></textarea></label><label>المشروع التطبيقي<textarea name="project" maxlength="2000" rows="2"></textarea></label>',
    events:'<label>الموعد<input name="eventDate" type="datetime-local" required></label><label>المكان أو رابط الحضور<input name="venue" maxlength="300" required></label><label>نوع الفعالية<select name="itemType"><option value="meetup">لقاء</option><option value="talk">جلسة حوارية</option><option value="workshop">ورشة عمل</option></select></label>'+locationField+'<label>سعر التذكرة بالدولار<input name="price" type="number" min="0" max="100000" value="0" required></label>'
  };
  function mount(form,{admin=false}={}) {
    if(states.has(form))return;
    const block=document.createElement('fieldset');block.className='publisher-fields';
    block.innerHTML='<div class="publisher-image-field"><div class="publisher-image-heading"><div><strong>صورة الغلاف</strong><p>الصورة التي ستظهر على الكارد</p></div><small>اختياري</small></div><label class="publisher-image-picker"><span class="publisher-image-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg></span><b>أضف صورة تعبّر عن المحتوى</b><small>JPG، PNG أو WebP · حتى 10 ميغابايت</small><span class="publisher-image-action">اختيار صورة</span><input name="publisherImage" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-label="اختيار صورة الكارد"></label><div class="publisher-image-preview" hidden><img alt="معاينة صورة الكارد"></div><p class="publisher-current-image"></p><label class="publisher-image-remove" hidden><input name="removePublisherImage" type="checkbox"> إزالة الصورة الحالية</label></div><legend>تفاصيل الناشر وملف PDF</legend><label>التفاصيل الكاملة — كل نقطة بسطر<textarea name="publisherDetails" rows="5" maxlength="10000" placeholder="الأهداف، الشروط، المخرجات أو التعليمات…"></textarea></label><label>ملف التفاصيل PDF (اختياري، حتى 10 ميغابايت)<input name="publisherPDF" type="file" accept=".pdf,application/pdf"></label><p class="publisher-current-file"></p><label class="publisher-remove-label" hidden><input name="removePublisherPDF" type="checkbox"> إزالة الملف الحالي</label><p class="publisher-file-note">الملف متاح خلال هذه الزيارة فقط ويختفي عند تحديث الصفحة. لا يُرفع إلى خادم.</p><p class="publisher-error" role="alert"></p>';
    block.prepend(block.querySelector('legend'));
    if(admin)for(const [kind,html]of Object.entries(groups)){const group=document.createElement('fieldset');group.dataset.publisherKind=kind;group.innerHTML=html;block.insertBefore(group,block.querySelector(':scope > label'));}
    const anchor=form.querySelector('.dialog-actions')||[...form.children].find(child=>child.matches('button[type="submit"]'));
    form.insertBefore(block,anchor||null);states.set(form,{block,existing:null,busy:false});
    let previewURL=null,imageRequest=0;
    const preview=block.querySelector('.publisher-image-preview');
    form.elements.publisherImage.addEventListener('change',async()=>{const request=++imageRequest,file=form.elements.publisherImage.files[0];if(!file)return;try{if(await validateEducationFile(file)!=='image')throw new Error('اختر صورة JPG أو PNG أو WebP فقط.');if(request!==imageRequest)return;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(file);preview.querySelector('img').src=previewURL;preview.hidden=false;block.querySelector('.publisher-image-action').textContent='تغيير الصورة';form.elements.removePublisherImage.checked=false;block.querySelector('.publisher-current-image').textContent=file.name;block.querySelector('.publisher-error').textContent='';}catch(error){if(request!==imageRequest)return;form.elements.publisherImage.value='';block.querySelector('.publisher-error').textContent=error.message;}});
    form.elements.removePublisherImage.addEventListener('change',()=>{preview.hidden=form.elements.removePublisherImage.checked;});
    form.addEventListener('reset',()=>{imageRequest++;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;preview.hidden=true;block.querySelector('.publisher-image-action').textContent='اختيار صورة';block.querySelector('.publisher-image-remove').hidden=true;});
    form.addEventListener('reset',()=>{const state=states.get(form);state.existing=null;state.image=null;block.querySelector('.publisher-current-image').textContent='';block.querySelector('.publisher-current-file').textContent='';block.querySelector('.publisher-remove-label').hidden=true;block.querySelector('.publisher-error').textContent='';});
    form.addEventListener('input',()=>block.querySelector('.publisher-error').textContent='');
  }
  function fill(form,row={},kind='') {
    const state=states.get(form);if(!state)return;
    state.block.hidden=Boolean(kind&&!['courses','events','jobs','internships','projects'].includes(kind));
    const image=documentFor(row.coverImage);state.block.querySelector('.publisher-image-remove').hidden=!image;const imagePreview=state.block.querySelector('.publisher-image-preview');imagePreview.hidden=!image;state.block.querySelector('.publisher-image-action').textContent=image?'تغيير الصورة':'اختيار صورة';if(image)imagePreview.querySelector('img').src=image.url;
    state.existing=row.pdf||null;state.image=row.coverImage||null;form.elements.publisherImage.value='';form.elements.removePublisherImage.checked=false;state.block.querySelector('.publisher-current-image').textContent=row.coverImage?'الصورة الحالية: '+row.coverImage.name:'لم تُرفق صورة بعد.';
    form.elements.publisherDetails.value=Array.isArray(row.details)?row.details.join('\n'):(row.publisherDetails||'');
    form.elements.publisherPDF.value='';form.elements.removePublisherPDF.checked=false;
    state.block.querySelector('.publisher-current-file').textContent=row.pdf?'الملف الحالي: '+row.pdf.name:'لا يوجد ملف مرفق.';
    const attachment=documentFor(row.pdf);if(attachment){const holder=state.block.querySelector('.publisher-current-file');for(const [label,download]of [['عرض الملف',false],['تحميل الملف',true]]){const link=document.createElement('a');link.href=attachment.url;link.textContent=label;link.className='publisher-file-link';if(download)link.download=attachment.name;else{link.target='_blank';link.rel='noopener';}holder.append(document.createTextNode(' '),link);}}
    state.block.querySelector('.publisher-remove-label').hidden=!row.pdf;
    for(const group of state.block.querySelectorAll('[data-publisher-kind]')){
      const enabled=group.dataset.publisherKind===kind;group.hidden=!enabled;group.disabled=!enabled;
      if(enabled)for(const field of group.querySelectorAll('[name]'))field.value=Array.isArray(row[field.name])?row[field.name].join(field.name==='skills'?'، ':'\n'):(row[field.name]??(field.type==='number'?field.defaultValue||'':field.options?.[0]?.value||''));
    }
  }
  async function read(form) {
    const state=states.get(form);if(!state)return {};
    if(state.block.hidden)return {};
    if(state.busy)throw new Error('جاري تجهيز الملف، انتظر قليلًا.');
    const file=form.elements.publisherPDF.files[0],remove=form.elements.removePublisherPDF.checked;
    let pdf=remove?null:state.existing;
    const details=form.elements.publisherDetails.value.split('\n').map(line=>line.trim()).filter(Boolean);
    const extra={};for(const group of state.block.querySelectorAll('[data-publisher-kind]'))if(!group.disabled)for(const field of group.querySelectorAll('[name]'))extra[field.name]=field.type==='number'?Number(field.value):['requirements','skills','outputs','steps'].includes(field.name)?field.value.split(field.name==='skills'?/[\n,،]/:/\n/).map(line=>line.trim()).filter(Boolean):field.value.trim();
    const imageFile=form.elements.publisherImage.files[0];let coverImage=form.elements.removePublisherImage.checked?null:state.image;
    state.busy=true;
    try{
      if(file){
        await validatePDFFile(file);
        pdf=app.addDocument(file);
      }
      if(imageFile){const kind=await validateEducationFile(imageFile);if(kind!=='image')throw new Error('اختر صورة JPG أو PNG أو WebP.');coverImage=app.addDocument(imageFile);}
      return {details,pdf,coverImage,...extra};
    }catch(error){state.block.querySelector('.publisher-error').textContent=error.message;throw error;}
    finally{state.busy=false;}
  }
  window.OfoqPublishing={mount,fill,read,validatePDFFile,validateEducationFile,documentFor};
})();
