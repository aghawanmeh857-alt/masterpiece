// Shared content adapters. Only the current application's memory is changed.
(() => {
  function mergeContent(seeds, changes = [], removed = []) {
    const rows = new Map(seeds.map(row => [String(row.id), {...row}]));
    for (const change of changes) {
      const old = rows.get(String(change.id));
      if (change.status && change.status !== 'published') { rows.delete(String(change.id)); continue; }
      rows.set(String(change.id), {...old, ...change});
    }
    for (const id of removed) rows.delete(String(id));
    return [...rows.values()];
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {mergeContent}; return; }
  const app = window.OfoqFrontend;
  if (!app) return;
  const category = value => ({'التطوير':'development','برمجة وتطوير':'development','التصميم':'design','التسويق':'marketing','تسويق رقمي':'marketing','المسار المهني':'career','مهارات مهنية':'career','أخرى':'career'}[value] || value || 'career');
  const standard = (kind, record) => {
    const base = {id:record.id,title:record.title,description:record.description || 'فرصة جديدة ضمن منصة سعي.',category:category(record.category),company:record.company || record.owner || 'برايت لابز',date:new Date().toISOString().slice(0,10),symbol:'↗',location:'remote',itemType:'full-time',extra:'mid',reward:0,offer:'بالاتفاق',deadline:'2027-12-31',details:record.details || [],requirements:record.requirements || [],status:record.status};
    if (kind === 'projects') return {...base,budget:800,weeks:3,type:'fixed',skills:['التواصل','إدارة المشاريع'],icon:'code',color:'orange',...record};
    if (kind === 'courses') return {...base,instructor:'عمر خليل',level:'beginner',format:'path',price:record.price || 0,hours:Number(record.hours) || 6,sessions:Array.isArray(record.syllabus)?record.syllabus.length:typeof record.syllabus==='string'?record.syllabus.split('\n').filter(Boolean).length:0,project:'تطبيق ما تعلمته في مشروع عملي',syllabus:typeof record.syllabus === 'string' ? record.syllabus.split('\n').filter(Boolean) : ['المقدمة','تطبيق عملي','مراجعة المشروع'],...record,category:category(record.category),...(typeof record.syllabus === 'string' ? {syllabus:record.syllabus.split('\n').filter(Boolean)} : {})};
    if (kind === 'events') return {...base,itemType:'workshop',extra:record.price ? 'paid':'free',reward:Number(record.price)||0,offer:record.price ? '$'+record.price : 'مجاني',deadline:record.eventDate?.slice(0,10) || base.deadline,eventTime:record.eventDate || 'يُحدد لاحقًا',venue:record.venue || 'عبر الإنترنت',...record,category:category(record.category)};
    return {...base,...record,category:category(record.category)};
  };
  app.contentFor = (kind, seeds) => {
    const changes = [];
    if (kind === 'jobs') changes.push(...(app.companyJobs || []));
    if (kind === 'internships') changes.push(...(app.companyInternships || []));
    changes.push(...(app.contentChanges?.[kind] || []));
    const result = mergeContent(seeds, changes.map(row => { const old = seeds.find(item => String(item.id) === String(row.id)); const normalized = standard(kind,row); return {...normalized,...old,...row,category:normalized.category,...(kind === 'courses' ? {syllabus:normalized.syllabus} : {})}; }), app.removedContent?.[kind] || []);
    (app.catalogs ||= {})[kind] = result;
    return result;
  };
  app.publishContent = (kind, row) => {
    const list = (app.contentChanges ||= {})[kind] ||= [];
    const old = list.find(item => String(item.id) === String(row.id));
    if (old) Object.assign(old,row); else list.push({...row});
    app.log?.('publish',(old?'تعديل محتوى: ':'نشر محتوى: ')+row.title,kind);
    if (app.removedContent?.[kind]) app.removedContent[kind] = app.removedContent[kind].filter(id => String(id) !== String(row.id));
  };
})();
