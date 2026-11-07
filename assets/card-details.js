

const selector = '.project-card,.listing-card,.course-card';
const dialog = document.createElement('dialog'); dialog.className = 'card-details-dialog';
dialog.setAttribute('aria-labelledby','cardPopupTitle');
dialog.innerHTML = '<div class="card-popup-toolbar"><span>سعي / التفاصيل</span><button type="button" class="card-popup-close" aria-label="إغلاق التفاصيل">×</button></div><div class="card-popup-content"></div><div class="card-popup-actions"><button type="button" class="card-popup-pdf">تنزيل التفاصيل PDF ↓</button><button type="button" class="card-popup-primary"></button></div><p class="card-popup-status" role="status"></p>';
document.body.append(dialog);
const content = dialog.querySelector('.card-popup-content'), pdf = dialog.querySelector('.card-popup-pdf'), action = dialog.querySelector('.card-popup-primary');
let source = null, activeTitle = '', activeSections = [];

let publisherPDF = null;
const labels = {development:'برمجة وتطوير',design:'تصميم',marketing:'تسويق رقمي',career:'مهارات مهنية',beginner:'مبتدئ',intermediate:'متوسط',advanced:'متقدم',path:'مسار تعلّم',workshop:'ورشة عمل','full-time':'دوام كامل','part-time':'دوام جزئي',contract:'عقد مؤقت',remote:'عن بُعد',hybrid:'هجين',onsite:'في الموقع',junior:'مبتدئ',mid:'متوسط الخبرة',senior:'خبير',fixed:'سعر ثابت',ongoing:'مشروع مستمر','2-months':'شهران','3-months':'3 أشهر','6-months':'6 أشهر',fee:'برسوم على المتدرّب',paid:'بمكافأة للمتدرّب',unpaid:'دون مقابل مالي',free:'مجاني',meetup:'لقاء',talk:'جلسة حوارية'};
const node = (tag,text) => { const el=document.createElement(tag); if(text!==undefined)el.textContent=String(text); return el; };
function dataFor(card) {
  if(card.ofoqDetails)return card.ofoqDetails;
  try { return JSON.parse(card.dataset.cardDetails || '{}'); } catch { return {}; }
}
function sectionsFor(card,data) {
  const sections = [], add = (heading,items) => { const values=items.filter(value=>value!==undefined&&value!==null&&value!=='').map(String); if(values.length)sections.push({heading,items:values}); };
  add('نبذة',[data.description]);
  add('الجهة الناشرة',[data.publisherName||data.owner||data.company||data.instructor]);
  const metadata = [];
  const course=card.matches('.course-card'),project=card.matches('.project-card');
  const courseKeys=['category','instructor','level','format'],projectKeys=['category'];
  for(const [key,label] of [['category','المجال'],['company','الجهة'],['instructor','المدرّب'],['location','الموقع'],['itemType','نوع الفرصة'],['extra','الخبرة'],['level','المستوى'],['format','طريقة التعلّم'],['deadline','آخر موعد'],['eventTime','الموعد'],['venue','المكان'],['offer','العرض']]) {
    if(course&&!courseKeys.includes(key)||project&&!projectKeys.includes(key))continue;
    if(data[key]){const fieldLabel=document.body.dataset.section==='internships'?(key==='itemType'?'مدة التدريب':key==='extra'?'المقابل':label):document.body.dataset.section==='events'&&key==='extra'?'رسوم الحضور':label;metadata.push(`${fieldLabel}: ${labels[data[key]]||data[key]}`);}
  }
  if(data.budget!==undefined)metadata.push(`الميزانية: ${data.budget} دولار`);
  if(data.weeks)metadata.push(`مدة التنفيذ: ${data.weeks} أسبوع`);
  if(data.price!==undefined)metadata.push(`السعر: ${data.price ? data.price+' دولار' : 'مجاني'}`);
  if(data.hours)metadata.push(`المدة: ${data.hours} ساعة`);
  if(data.sessions)metadata.push(`عدد الجلسات: ${data.sessions}`);
  add('المعلومات الأساسية',metadata);
  for(const [key,label] of [['details','التفاصيل والمهام'],['requirements','المتطلبات'],['skills','المهارات المطلوبة'],['syllabus','محتوى التعلّم'],['outputs','المخرجات المطلوبة'],['steps','مراحل التنفيذ']]) {
    if(data[key])add(label,Array.isArray(data[key])?data[key]:[data[key]]);
  }
  add('المشروع التطبيقي',[data.project]);
  const specific=card.matches('.project-card')?window.OfoqProjectSpecs?.[data.id]:null;
  if(specific){add('هدف المشروع',[specific.goal]);add('المخرجات المطلوبة',specific.outputs);add('مراحل التنفيذ',specific.steps);}
  const scope=card.querySelector('.project-scope');if(scope)add('نطاق التسليم',[scope.textContent]);
  return sections;
}
function open(card) {
  source=card; const data=dataFor(card);
  publisherPDF=data.pdf?.id?window.OfoqFrontend.documentFor(data.pdf.id):null;
  // Backend records can provide pdf: {url, name}; only web URLs are accepted.
  if(!publisherPDF&&data.pdf?.url){try{const url=new URL(data.pdf.url,location.href);if(['https:','http:'].includes(url.protocol))publisherPDF={url:url.href,name:data.pdf.name||'details.pdf'};}catch{}}
  pdf.hidden=false;
  pdf.textContent='تنزيل ملف التفاصيل PDF ↓';
  activeTitle=data.title||card.querySelector('h2')?.textContent||'التفاصيل';activeSections=sectionsFor(card,data);
  content.replaceChildren();
  const original=card.querySelector('.project-cover>img,.opportunity-cover>img,.course-cover>img');
  if(original){const image=node('img');image.src=original.src;image.alt='';image.className='card-popup-cover';content.append(image);}
  const title=node('h2',activeTitle);title.id='cardPopupTitle';content.append(title);
  for(const section of activeSections){const block=node('section');block.append(node('h3',section.heading));const list=node('ul');section.items.forEach(text=>list.append(node('li',text)));block.append(list);content.append(block);}
  const attachment=node('section');attachment.append(node('h3','ملف PDF من الناشر'),node('p',publisherPDF?publisherPDF.name:'لم يرفق الناشر ملف PDF حتى الآن.'));content.append(attachment);
  const primary=card.querySelector('.project-offer>.btn,.listing-offer>.btn,.course-actions>.learn-primary');
  action.hidden=!primary;action.textContent=primary?.textContent||'';action.disabled=primary?.disabled||false;
  if(document.body.dataset.section==='internships' && Number(data.applicationFee||0)>0) action.textContent='التقديم والدفع · '+data.applicationFee+' دولار';
  dialog.querySelector('.card-popup-download')?.remove();
  dialog.querySelector('.card-popup-cart')?.remove();
  const originalCart=card.querySelector('.course-add-cart');
  if(originalCart){const cart=node('button',originalCart.textContent);cart.type='button';cart.className='card-popup-cart';cart.addEventListener('click',()=>{dialog.close();passthrough.add(card);try{originalCart.click();}finally{passthrough.delete(card);}});dialog.querySelector('.card-popup-actions').append(cart);}
  dialog.querySelector('.card-popup-status').textContent='';
  if(!dialog.open)dialog.showModal();content.scrollTop=0;
}
function enhance(root=document) {
  root.querySelectorAll(selector).forEach(card=>{
    if(card.querySelector('.card-preview-actions'))return;
    const data=dataFor(card);const cover=card.querySelector('.project-cover>img,.opportunity-cover>img,.course-cover>img');const image=data.coverImage?.id?window.OfoqFrontend.documentFor(data.coverImage.id):null;if(cover&&image)cover.src=image.url;
    const body=card.querySelector('.project-details,.listing-details,.course-body');
    const summary=node('div');summary.className='card-preview-summary';
    const add=(label,value)=>{if(value===undefined||value===null||value==='')return;const item=node('div');item.append(node('small',label),node('span',value));summary.append(item);};
    add('المجال',labels[data.category]||data.category);
    if(data.budget!==undefined)add('الميزانية',data.budget+' دولار');
    else if(data.price!==undefined)add('السعر',data.price?data.price+' دولار':'مجاني');
    else if(document.body.dataset.section==='internships' && Number(data.applicationFee||0)>0) add('رسوم التدريب',data.applicationFee+' دولار');
    else add(document.body.dataset.section==='internships'?'المكافأة':'العرض',data.offer);
    if(data.weeks)add('مدة التنفيذ',data.weeks===1?'أسبوع واحد':data.weeks===2?'أسبوعان':data.weeks+' أسابيع');
    else if(data.hours)add('مدة التعلّم',data.hours+' ساعة');
    else add(data.eventTime?'الموعد':'نمط العمل',data.eventTime||labels[data.location]||data.location);
    if(summary.children.length)body?.append(summary);
    const actions=node('div');actions.className='card-preview-actions';
    const button=node('button','عرض التفاصيل ←');button.type='button';button.className='card-preview-open';
    button.setAttribute('aria-label','عرض تفاصيل '+(card.querySelector('h2')?.textContent||''));actions.append(button);
    // Keep the original favorite handler and its state when a catalog re-renders.
    let favorite=card.querySelector('.project-favorite-button,.course-actions .learn-wish,.save-internship');
    if (!favorite && card.matches('.listing-card')) {
      const kind = document.body.dataset.section;
      const app = window.OfoqFrontend;
      const file = {jobs:'../Jobs/Job/job.html',events:'../Events/Event/event.html',internships:'../Internships/Internship/internship.html'}[kind];
      if (app && file) {
        favorite=node('button'); favorite.type='button'; favorite.className='learn-wish global-favorite';
        const update = () => { const saved=app.savedRecords.some(row=>row.kind===kind&&String(row.id)===String(data.id));favorite.textContent=saved?'♥':'♡';favorite.setAttribute('aria-pressed',String(saved));favorite.setAttribute('aria-label',(saved?'إزالة من المفضلة: ':'إضافة للمفضلة: ')+data.title); };
        update(); favorite.addEventListener('click',event=>{event.stopPropagation();const href=new URL(file,location.href);href.searchParams.set('id',data.id);app.toggleFavorite(kind,data,href.href);update();});
      }
    }
    const app = window.OfoqFrontend;
    const kind = card.matches('.project-card') ? 'projects' : card.matches('.course-card') ? 'courses' : document.body.dataset.section;
    const cart = node('button'); cart.type='button'; cart.className='shared-card-cart';
    const readLearning = () => { try { return JSON.parse(app.memory.getItem('ofoq-learning-v1') || '{}'); } catch { return {}; } };
    const inCart = () => kind==='courses' ? (readLearning().cart||[]).includes(data.id) : kind==='internships' ? (()=>{try{return JSON.parse(app.memory.getItem('ofoq-internship-cart-v1')||'[]').some(row=>String(row.id)===String(data.id));}catch{return false;}})() : app.cartRecords.some(row=>row.kind===kind&&String(row.id)===String(data.id));
    const updateCart = () => {
      const saved = inCart(); cart.setAttribute('aria-pressed',String(saved));cart.setAttribute('aria-label',(saved?'إزالة من السلة: ':'إضافة إلى السلة: ')+data.title);cart.title=saved?'إزالة من السلة':'إضافة إلى السلة';
      cart.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.4 12h11.2l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>'+(saved?'<path d="m10 9 2 2 4-4"/>':'')+'</svg>';
    };
    updateCart();
    if (kind==='courses' && (readLearning().enrolled||[]).includes(data.id)) { cart.disabled=true;cart.title='ملتحق بهذه الدورة';cart.setAttribute('aria-label','ملتحق بالفعل: '+data.title); }
    cart.addEventListener('click',event=>{
      event.stopPropagation();const saved=inCart();
      if(kind==='courses') {
        const learning=readLearning();learning.cart=saved?(learning.cart||[]).filter(id=>id!==data.id):[...(learning.cart||[]),data.id];app.memory.setItem('ofoq-learning-v1',JSON.stringify(learning));if(app.learning)app.learning.cart=learning.cart;
        window.dispatchEvent(new Event('pageshow'));
      } else if(kind==='internships') {
        let items=[];try{items=JSON.parse(app.memory.getItem('ofoq-internship-cart-v1')||'[]');}catch{}
        app.memory.setItem('ofoq-internship-cart-v1',JSON.stringify(saved?items.filter(row=>String(row.id)!==String(data.id)):[...items,{id:String(data.id),title:data.title,company:data.company,applicationFee:Number(data.applicationFee||0)}]));
      } else {
        if(saved)app.cartRecords=app.cartRecords.filter(row=>!(row.kind===kind&&String(row.id)===String(data.id)));
        else { const file={projects:'../Freelance/Project/project.html',jobs:'../Jobs/Job/job.html',events:'../Events/Event/event.html'}[kind];const href=new URL(file,location.href);href.searchParams.set('id',data.id);app.cartRecords.push({kind,id:data.id,title:data.title,company:data.company||data.owner||'',href:href.href,price:Number(data.price ?? data.reward ?? 0)}); }
      }
      updateCart();
    });
    const supportsCart = kind !== 'projects' && kind !== 'jobs';
    if (supportsCart) actions.append(cart);
    else {
      actions.classList.add('card-actions-no-cart');
      // Remove legacy selections so these sections no longer populate the shared cart.
      app.cartRecords = app.cartRecords.filter(row => row.kind !== 'projects' && row.kind !== 'jobs');
    }
    if(favorite){favorite.classList.add('shared-card-favorite');favorite.textContent=favorite.getAttribute('aria-pressed')==='true'?'♥':'♡';actions.append(favorite);}
    card.append(actions);card.classList.add('card-preview');
  });
}
const passthrough=new WeakSet();
document.addEventListener('click',event=>{
  const card=event.target.closest(selector);if(!card||passthrough.has(card))return;
  if(event.target.closest('.project-favorite-button,.learn-wish,.save-internship,.shared-card-cart'))return;
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();event.stopImmediatePropagation();open(card);
},true);
action.addEventListener('click',()=>{
  const card=source,primary=card?.querySelector('.project-offer>.btn,.listing-offer>.btn,.course-actions>.learn-primary');
  if (card && document.body.dataset.section === 'internships') {
    const data = dataFor(card);
    const fee = Number(data.applicationFee || 0);
    if (fee > 0 && window.OfoqPayment) {
      dialog.close();
      window.OfoqPayment.open({title:data.title,amount:fee,kind:'رسوم التدريب',onComplete:()=>{
        const href=new URL('../Internships/Internship/internship.html',location.href);href.searchParams.set('id',data.id);
        window.OfoqFrontend.apply('internship',data.id,data.title,href.href);
        action.textContent='✓ تم التقديم';
      }});
      return;
    }
  }
  if(!primary)return;dialog.close();passthrough.add(card);try{primary.click();}finally{passthrough.delete(card);}
});
dialog.querySelector('.card-popup-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{source?.querySelector('.card-preview-open')?.focus({preventScroll:true});});
pdf.addEventListener('click',()=>{
  if(!publisherPDF){dialog.querySelector('.card-popup-status').textContent='لم يرفق الناشر ملف PDF حتى الآن.';return;}
  const link=node('a','تحميل ملف الناشر ↓');link.href=publisherPDF.url;link.download=publisherPDF.name;link.className='card-popup-download';
  dialog.querySelector('.card-popup-status').replaceChildren(link);link.click();
});

enhance();new MutationObserver(()=>enhance()).observe(document.querySelector('#projectList,#itemList,#courseList')||document.body,{childList:true,subtree:true});
