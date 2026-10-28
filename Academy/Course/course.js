
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
const courses = window.OfoqCourses;

(function () {
  const get=id=>document.getElementById(id),store=OfoqLearning.create(courses),id=new URLSearchParams(location.search).get('id')||'web',course=courses.find(item=>item.id===id);
  get('year').textContent=new Date().getFullYear();
  if(!course){get('detailContent').hidden=true;get('notFound').hidden=false;get('notFound').focus();return;}
  document.title=course.title+' — أفق';get('detailTitle').textContent=course.title;get('detailDescription').textContent=course.description;
  get('courseInstructor').insertAdjacentHTML('beforeend',OfoqPublishers.card(OfoqPublishers.forRecord('course',course)));
  get('courseCover').src=OfoqLearning.cover(id);get('coursePrice').textContent=course.price?'$'+course.price:'مجاني';get('courseFacts').textContent=course.hours+' ساعة في المسار · '+course.syllabus.length+' دروس تفاعلية · '+(course.level==='beginner'?'مبتدئ':'متوسط');
  course.syllabus.forEach(title=>{const item=document.createElement('li');item.textContent='✓ '+title;get('learningOutcomes').append(item);});get('courseProject').textContent='مشروعك التطبيقي: '+course.project;
  let lesson=store.has(id)?store.state.current[id]:0,slide=0,playing=false,elapsed=0,last=0,frame=0,noteTimer;
  const content=OfoqLessons[id],slides=()=>{
    const data=content[lesson];return [
      {title:course.syllabus[lesson],body:data[0],example:'تعلّم، جرّب، ثم طبّق على مشروعك.'},
      {title:data[0],body:data[1],example:data[2]},
      {title:'جرّب بنفسك',body:data[3],example:'المشروع التطبيقي: '+course.project}
    ];
  };
  function stop(){playing=false;cancelAnimationFrame(frame);get('playLesson').textContent='▶ تشغيل';get('playLesson').setAttribute('aria-label','تشغيل الدرس');}
  function saveNote(){clearTimeout(noteTimer);if(store.has(id))get('notesStatus').textContent=store.note(id,lesson,get('lessonNotes').value)?'تم حفظ الملاحظة على هذا المتصفح.':'الملاحظة متاحة خلال هذه الزيارة فقط.';}
  function showSlide(){const data=slides()[slide];get('slideEyebrow').textContent='الدرس '+(lesson+1)+' / '+course.syllabus.length;get('slideTitle').textContent=data.title;get('slideBody').textContent=data.body;get('slideExample').textContent=data.example;get('slideNumber').textContent=(slide+1)+' / '+slides().length;get('slideProgress').value=((slide+elapsed/10)/slides().length)*100;get('previousSlide').disabled=slide===0;get('nextSlide').disabled=slide===slides().length-1;}
  function render(){
    const owned=store.has(id),done=store.state.progress[id].includes(lesson),percent=store.percent(id);
    get('buyCourse').textContent=owned?'متابعة التعلّم ←':course.price?'اشترِ الآن — $'+course.price:'التحق مجانًا';get('addCart').hidden=owned||!course.price;get('addCart').textContent=store.state.cart.includes(id)?'إزالة من السلة':'أضف إلى السلة';get('wishCourse').textContent=store.state.wishlist.includes(id)?'♥ في المفضلة':'♡ أضف للمفضلة';get('wishCourse').setAttribute('aria-pressed',String(store.state.wishlist.includes(id)));
    get('previewAccess').textContent=owned?'أنت ملتحق بهذه الدورة. تقدّمك وملاحظاتك محفوظة محليًا.':'معاينة مجانية للدرس الأول. التحق بالدورة للوصول لباقي الدروس وحفظ التقدّم.';
    get('lessonTitle').textContent=course.syllabus[lesson];get('completeLesson').disabled=!owned;get('completeLesson').textContent=done?'✓ مكتمل — إلغاء الإكمال':'تحديد الدرس كمكتمل';get('nextLesson').disabled=lesson===course.syllabus.length-1;get('lessonNotes').disabled=!owned;
    get('progressPercent').textContent=percent+'%';get('courseProgress').value=percent;get('progressSummary').textContent=(owned?store.state.progress[id].length:0)+' من '+course.syllabus.length+' دروس';get('completionBanner').hidden=percent!==100;
    get('curriculumList').replaceChildren(...course.syllabus.map((title,index)=>{const button=document.createElement('button');button.type='button';button.className='curriculum-lesson';button.textContent=(owned&&store.state.progress[id].includes(index)?'✓ ':(!owned&&index>0?'🔒 ':'▷ '))+(index+1)+'. '+title;button.setAttribute('aria-current',index===lesson?'step':'false');button.addEventListener('click',()=>selectLesson(index));return button;}));
    get('checkQuiz').disabled=!owned;showSlide();
  }
  function selectLesson(index){if(!store.has(id)&&index>0){purchase();return;}saveNote();stop();lesson=index;slide=0;elapsed=0;store.remember(id,index);get('lessonNotes').value=store.state.notes[id+':'+index]||'';get('notesStatus').textContent='';get('lessonFeedback').textContent='';render();}
  function purchase(){if(store.has(id)){get('classroom').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}const done=()=>{render();get('classroom').scrollIntoView({behavior:'smooth'});};if(course.price)store.checkout([id],done);else{store.enroll([id]);done();}}
  function tick(now){if(!playing)return;const dt=Math.min((now-last)/1000,.25);last=now;elapsed+=dt*Number(get('playbackSpeed').value);if(elapsed>=10){elapsed=0;if(slide<slides().length-1)slide++;else{stop();if(store.has(id)){store.complete(id,lesson);get('lessonFeedback').textContent='أنهيت مشاهدة الدرس التفاعلي. تم تحديث تقدّمك.';}else get('lessonFeedback').textContent='انتهت المعاينة. التحق بالدورة لحفظ تقدّمك.';elapsed=10;render();return;}}showSlide();frame=requestAnimationFrame(tick);}
  get('playLesson').addEventListener('click',()=>{if(playing){stop();return;}if(slide===slides().length-1&&elapsed>=10){slide=0;elapsed=0;}playing=true;last=performance.now();get('playLesson').textContent='Ⅱ إيقاف مؤقت';get('playLesson').setAttribute('aria-label','إيقاف الدرس مؤقتًا');frame=requestAnimationFrame(tick);});
  get('previousSlide').addEventListener('click',()=>{stop();slide=Math.max(0,slide-1);elapsed=0;showSlide();});get('nextSlide').addEventListener('click',()=>{stop();slide=Math.min(slides().length-1,slide+1);elapsed=0;showSlide();});
  get('fullscreenLesson').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await get('lectureScreen').requestFullscreen();}catch{get('lessonFeedback').textContent='ملء الشاشة غير متاح في هذا المتصفح.';}});
  get('completeLesson').addEventListener('click',()=>{if(!store.has(id))return;store.complete(id,lesson,!store.state.progress[id].includes(lesson));render();});get('nextLesson').addEventListener('click',()=>selectLesson(Math.min(course.syllabus.length-1,lesson+1)));
  get('buyCourse').addEventListener('click',purchase);get('addCart').addEventListener('click',()=>{store.toggle('cart',id);render();});get('wishCourse').addEventListener('click',()=>{store.toggle('wishlist',id);render();});
  get('lessonNotes').value=store.state.notes[id+':'+lesson]||'';get('lessonNotes').addEventListener('input',()=>{clearTimeout(noteTimer);noteTimer=setTimeout(saveNote,400);});
  addEventListener('pagehide',()=>{saveNote();stop();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  const questions={web:['ما الطريقة الآمنة لعرض نص المستخدم؟',['textContent','innerHTML مباشرة','eval'],0],ux:['كيف تبدأ اختبار قابلية الاستخدام؟',['تشرح كل الأزرار','تعطي مهمة محددة وتراقب','تطلب اختيار اللون المفضل'],1],portfolio:['ماذا تفعل عند غياب أرقام النتائج؟',['تختلق نسبة نجاح','تحذف المشروع','تصف ما اختبرته وتعلمته بوضوح'],2],react:['ما الذي تعرضه عند فشل تحميل البيانات؟',['صفحة فارغة','رسالة خطأ وطريقة لإعادة المحاولة','نتائج قديمة دون توضيح'],1],brand:['ماذا يتضمن دليل الهوية؟',['الشعار فقط','الألوان فقط','قواعد الخطوط والألوان والاستخدام'],2],marketing:['ما معدل التحويل لـ20 تسجيلًا من 500 زيارة؟',['4%','25%','40%'],0]};
  const quiz=questions[id];get('quizQuestion').textContent=quiz[0];quiz[1].forEach((text,index)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='courseQuizAnswer';input.value=index;label.append(input,document.createTextNode(text));get('quizOptions').append(label);});
  get('checkQuiz').addEventListener('click',()=>{if(!store.has(id))return;const answer=document.querySelector('input[name="courseQuizAnswer"]:checked');get('quizResult').textContent=!answer?'اختر إجابة أولًا.':Number(answer.value)===quiz[2]?'✓ إجابة صحيحة! طبّق الفكرة على مشروعك.':'راجع الدروس وجرّب مرة أخرى.';});render();
})();
