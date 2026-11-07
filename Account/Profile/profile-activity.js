// Derive profile activity from the same visit state used by the dashboard.
(() => {
  function activityRows(app, root, theme = 'light') {
    const url = href => {
      try {
        const result = new URL(href, root);
        if (result.origin !== new URL(root).origin || !['http:', 'https:'].includes(result.protocol)) return null;
        result.searchParams.set('theme', theme);
        return result.href;
      } catch { return null; }
    };
    const labels = {job: 'طلب وظيفة', internship: 'طلب تدريب', project: 'طلب مشروع'};
    const rows = (app.applications || []).map(item => ({
      title: item.title, type: item.kind, label: labels[item.kind] || 'طلب تقديم',
      status: item.status || 'قيد المراجعة', href: url(item.href)
    }));
    const learning = app.learning || {enrolled: [], progress: {}};
    for (const id of learning.enrolled || []) {
      const course = (app.courses || []).find(item => item.id === id);
      if (!course) continue;
      const completed = new Set((learning.progress?.[id] || []).filter(index => Number.isInteger(index) && index >= 0 && index < course.syllabus.length)).size;
      const percent = course.syllabus.length ? Math.round(completed / course.syllabus.length * 100) : 0;
      rows.push({title: course.title, type: 'course', label: 'دورة',
        status: percent === 100 ? 'مكتملة' : 'مسجّل', format:'path', percent, href: url('Academy/Course/course.html?id=' + encodeURIComponent(id))});
    }
    for (const item of app.registrations || []) rows.push({title: item.title, type: 'event', label: 'فعالية', status: 'تم التسجيل', href: url(item.href)});
    for (const item of app.ideas || []) rows.push({title: item.title, type: 'post', label: 'منشور مشروع', status: 'منشور', href: url('Freelance/freelance.html#idea-' + encodeURIComponent(item.id))});
    return rows;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {activityRows}; return; }
  const panel = document.getElementById('profileActivity');
  if (!panel) return;
  // Publisher profiles never expose the current visitor's private activity.
  if (new URLSearchParams(location.search).has('user')) { panel.hidden = true; return; }
  const root = new URL('../../', location.href);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const definitions=[
    ['courses','دوراتي','الدورات التي اشتريتها أو التحقت بها، مع متابعة تقدّمك.','Academy/academy.html',row=>row.type==='course'],
    ['jobs','طلبات الوظائف','الوظائف التي قدّمت عليها وحالة كل طلب.','Jobs/jobs.html',row=>row.type==='job'],
    ['internships','طلبات التدريب','فرص التدريب التي قدّمت عليها وحالة الطلبات.','Internships/internships.html',row=>row.type==='internship'],
    ['applications','طلبات المشاريع','المشاريع التي قدّمت لتنفيذها.','Freelance/freelance.html',row=>row.type==='project'],
    ['events','فعالياتي','الفعاليات التي سجلت فيها.','Events/events.html',row=>row.type==='event'],
    ['posts','مشاريعي المنشورة','أفكار المشاريع التي نشرتها وتستطيع تعديلها.','Freelance/freelance.html#shareTitle',row=>row.type==='post']
  ];
  const panels=[];
  for(const [id,title,description,href,matches]of definitions){
    const section=node('section',undefined,'account-panel profile-section');section.id='profile-'+id;section.dataset.profileSection=id;
    const heading=node('h2',title);heading.id=section.id+'-title';section.setAttribute('aria-labelledby',heading.id);section.append(heading,node('p',description,'profile-section-description'));
    const count=node('p',undefined,'profile-section-count');count.setAttribute('role','status');const list=node('div',undefined,'profile-activity-list');section.append(count,list);panel.before(section);panels.push({id,section,list,count,href,matches});
  }
  panel.remove();
  function render(){
    const rows=activityRows(window.OfoqFrontend,root.href,document.documentElement.dataset.theme||'light');
    for(const entry of panels){
      const items=rows.filter(entry.matches);entry.section.dataset.count=String(items.length);entry.count.textContent=items.length===1?'عنصر واحد':items.length+' عناصر';entry.list.replaceChildren();
      if(!items.length){const empty=node('div',undefined,'profile-section-empty');empty.append(node('span','◇','profile-empty-icon'),node('h3','لا توجد عناصر في هذا القسم بعد'),node('p','عندما تتفاعل مع هذا القسم ستظهر بياناتك هنا.'));const link=node('a','استكشف القسم ←','btn btn-orange');link.href=new URL(entry.href,root).href;empty.append(link);entry.list.append(empty);continue;}
      for(const item of items){const card=node('article',undefined,'profile-activity-card');card.append(node('small',item.label),node('h3',item.title),node('p',item.status,'profile-activity-state'));if(item.percent!==undefined){const progress=node('progress');progress.max=100;progress.value=item.percent;progress.setAttribute('aria-label','تقدّم '+item.title);card.append(progress,node('p',item.percent+'% مكتمل'));}if(item.href){const link=node('a',item.type==='course'?'متابعة التعلّم ←':'عرض التفاصيل ←','details-link');link.href=item.href;card.append(link);}entry.list.append(card);}
    }
    dispatchEvent(new Event('ofoq:profile-activity'));
  }
  addEventListener('pageshow',render);render();
})();
