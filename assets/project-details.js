(() => {
  const specifics = {
    1:{goal:'لوحة تجمع الشحنات والعملاء والمؤشرات اليومية في واجهة واحدة.',outputs:['لوحة مؤشرات متجاوبة مع رسوم بيانية','إدارة الشحنات والعملاء مع بحث وفلاتر','توثيق التشغيل وتسليم ملفات المصدر'],steps:['تحليل البيانات وتخطيط الشاشات','بناء المكوّنات وربط البيانات التجريبية','اختبار الشاشات ومراجعة التسليم']},
    2:{goal:'تحسين تجربة تطبيق اللياقة من التسجيل حتى متابعة التمارين.',outputs:['بحث مختصر عن المستخدم ومسارات الاستخدام','تصميم شاشات التطبيق ونظام ألوان ومكوّنات','نموذج تفاعلي على Figma وملف التسليم'],steps:['مراجعة الشاشات الحالية','رسم المسارات وتصميم الواجهات','اختبار قابلية الاستخدام وتطبيق الملاحظات']},
    3:{goal:'إطلاق صفحة تعريفية سريعة وواضحة تحوّل الزائر إلى عميل محتمل.',outputs:['صفحة متجاوبة للأجهزة المختلفة','أقسام المزايا والأسعار والأسئلة الشائعة','نموذج تواصل مع التحقق من المدخلات وملفات المصدر'],steps:['ترتيب المحتوى وتصميم الهيكل','تنفيذ HTML وCSS والتفاعلات','اختبار الوصول والأداء والتسليم']},
    4:{goal:'بناء حضور متّسق للمقهى وتشجيع التفاعل مع محتواه.',outputs:['تقويم محتوى شهري مع أهداف كل منشور','12 منشورًا و8 قصص بتصاميم قابلة للتعديل','دليل نبرة المحتوى وتقرير مؤشرات الأداء'],steps:['فهم الجمهور وهوية المقهى','اقتراح الأفكار وتصميم المحتوى','مراجعة وجدولة التسليم وقياس النتائج']}
  };
  window.OfoqProjectSpecs = specifics;
  const list=document.getElementById('projectList');
  if(list){const enhance=()=>list.querySelectorAll('.project-card').forEach((card,index)=>{if(card.querySelector('.project-scope'))return;const p=document.createElement('p');p.className='project-scope';p.textContent='نطاق واضح · تسليم ملفات العمل · مراجعة قبل الإغلاق';(card.querySelector('.project-details')||card).append(p);});new MutationObserver(enhance).observe(list,{childList:true});enhance();}
  const title=document.getElementById('detailTitle');if(!title||document.body.dataset.kind!=='project')return;
  const id=new URLSearchParams(location.search).get('id')||'1';const data=specifics[id];if(!data)return;
  const container=document.querySelector('#projectDetailsPanel .account-stack');if(!container)return;
  for(const [heading,items]of [['هدف المشروع',[data.goal]],['المخرجات المطلوبة',data.outputs],['مراحل التنفيذ',data.steps],['آلية العمل والتسليم',['الاتفاق على نطاق العمل والجدول قبل البدء.','مراجعة أولية ومراجعة نهائية ضمن النطاق المتفق عليه.','تسليم ملفات المصدر وتعليمات التشغيل أو الاستخدام.']]]){const section=document.createElement('section');section.className='account-panel';const h=document.createElement('h2');h.textContent=heading;const ul=document.createElement('ul');ul.className='detail-list';for(const text of items){const li=document.createElement('li');li.textContent=text;ul.append(li);}section.append(h,ul);container.append(section);}
})();
