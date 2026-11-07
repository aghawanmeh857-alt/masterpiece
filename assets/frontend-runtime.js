// A tab-local application session. Nothing is written to browser storage.
(() => {
  const root = new URL('../', document.currentScript.src);
  const makeSession = () => {
    const values = new Map(), documents = new Map();
    return {
      memory: {
        getItem: key => values.get(String(key)) ?? null,
        setItem: (key, value) => values.set(String(key), String(value)),
        removeItem: key => values.delete(String(key)),
        clear: () => values.clear()
      },
      user: { signedIn: false, role: 'member' },
      addDocument(file) {
        const id = crypto.randomUUID(), url = URL.createObjectURL(file);
        const attachment = {id,url,name:file.name,size:file.size};
        documents.set(id,attachment); return attachment;
      },
      documentFor(id) { return documents.get(id) || null; },
      profile: { name: 'أليكس مورغان', email: 'alex@example.com', role: 'مصمم واجهات ومطوّر مواقع', location: 'عمّان، الأردن', bio: 'أحوّل الأفكار إلى تجارب رقمية واضحة وسهلة.', skills: 'تصميم الواجهات, Figma, HTML, CSS, JavaScript' },
      applications: [], registrations: [], enrollments: [], orders: [], activity: [], knownUsers: [], ideas: [], conversations: null,
      catalogs: {}, savedRecords: [], cartRecords: [],
      person() {
        const userKey=this.profile.userKey ||= String(this.profile.email || '').trim().toLowerCase();
        return {userKey,name:this.profile.name,email:this.profile.email,role:this.profile.role,location:this.profile.location,skills:this.profile.skills,resume:this.cvFile || null,portfolioUrl:this.profile.portfolioUrl || ''};
      },
      applicationDetails(form) {
        if(!form?.querySelector)return {};
        const read=selector=>form.querySelector(selector)?.value?.trim() || '';
        const file=form.querySelector('input[type="file"]')?.files?.[0];
        return {name:read('[name="fullName"],#applicantName,#previewName') || this.profile.name,email:read('input[type="email"]') || this.profile.email,phone:read('[name="phone"]'),location:read('[name="location"]') || this.profile.location,experience:read('[name="experience"],#applicantExperience'),message:read('[name="coverLetter"],#applicantExperience,#previewMessage,textarea'),portfolioUrl:read('[name="portfolio"],#applicantPortfolio') || this.profile.portfolioUrl || '',resume:file?this.addDocument(file):this.cvFile || null};
      },
      listing(kind, id) {
        const section={project:'projects',job:'jobs',internship:'internships',course:'courses',event:'events'}[kind] || kind;
        return [...(this.contentChanges?.[section] || []),...(section==='jobs'?this.companyJobs || []:section==='internships'?this.companyInternships || []:[]),...(this.catalogs[section] || [])].find(row=>String(row.id)===String(id));
      },
      log(type, title, detail = '', person = this.person()) {
        if(person.userKey){const known=this.knownUsers.find(row=>row.userKey===person.userKey);if(known)Object.assign(known,person);else this.knownUsers.push({...person});}
        this.activity.unshift({id:'activity-'+(this.activity.length+1),type,title,detail,person,date:new Date().toISOString()});
      },
      companyOwns(kind, id) {
        const row=this.listing(kind,id);
        if(!row)return false;
        const name=this.companyProfile?.name || 'برايت لابز';
        return row.company===name || row.publisherName===name || (row.publisherRole==='company' && (this.companyJobs || []).concat(this.companyInternships || []).some(item=>String(item.id)===String(id)));
      },
      companyApplications() {
        return this.applications.filter(row=>['job','internship'].includes(row.kind) && this.companyOwns(row.kind,row.id));
      },
      reviewApplication(applicationId, status, scope, projectId) {
        const row=this.applications.find(item=>item.applicationId===applicationId);
        if(!row || !['قيد المراجعة','قائمة مختصرة','مقبول','مرفوض'].includes(status))return false;
        if(scope!=='admin' && !(scope==='company' && this.companyApplications().includes(row)) && !(scope==='project' && row.kind==='project' && String(row.id)===String(projectId)))return false;
        if(row.status===status)return true;
        row.status=status;row.reviewedAt=new Date().toISOString();
        this.log('decision','تحديث طلب: '+row.title,status,{userKey:row.userKey,name:row.name,email:row.email});
        return true;
      },
      enrollCourse(course) {
        const person=this.person();
        if(this.enrollments.some(row=>String(row.courseId)===String(course.id)&&row.userKey===person.userKey))return;
        this.enrollments.push({...person,courseId:String(course.id),title:course.title,status:'مسجّل',progress:0,date:new Date().toISOString(),company:course.company || course.publisherName || ''});
        this.log('enrollment','التحاق بدورة: '+course.title);
      },
      recordOrder(order) {
        const row={...order,id:'order-'+(this.orders.length+1),person:this.person(),date:new Date().toISOString(),status:'مكتمل تجريبيًا'};
        this.orders.unshift(row);this.log('order','تأكيد طلب: '+order.title,String(order.amount));return row;
      },
      toggleFavorite(kind, record, href) {
        const index = this.savedRecords.findIndex(row => row.kind === kind && String(row.id) === String(record.id));
        if (index >= 0) this.savedRecords.splice(index, 1);
        else this.savedRecords.push({kind, id: record.id, title: record.title, href});
        this.log('favorite',(index>=0?'إزالة من المفضلة: ':'إضافة للمفضلة: ')+record.title);
      },
      settings: { availability: 'متاح للعمل الحر', projectUpdates: true, courseUpdates: true, communityUpdates: false },
      apply(kind, id, title, href, details = {}) {
        const person=this.person();
        const existing = this.applications.find(row => row.kind === kind && row.id === String(id) && row.userKey===person.userKey);
        if (existing) return existing;
        const row = { ...person,...details,kind,id:String(id),title,href,status:'قيد المراجعة',applicationId:'application-'+(this.applications.length+1)+'-'+Date.now(),date:new Date().toISOString() };
        this.applications.unshift(row);
        this.log('application','تقديم: '+title,kind);
        return row;
      },
      register(id, title, href) {
        const person=this.person();
        if (!this.registrations.some(row => row.id === String(id) && row.userKey===person.userKey)) {
          this.registrations.unshift({...person,id:String(id),title,href,date:new Date().toISOString(),status:'مسجّل'});
          this.log('registration','تسجيل بفعالية: '+title);
        }
      }
    };
  };
  const allowed = href => {
    try {
      const url = new URL(href, root);
      return url.origin === root.origin && url.pathname.startsWith(root.pathname) && url.pathname.endsWith('.html') && !url.pathname.endsWith('/app.html') ? url : null;
    } catch { return null; }
  };
  if (document.documentElement.dataset.appShell === 'true') {
    const session = makeSession();
    window.OfoqFrontend = session;
    const frame = document.getElementById('appPage');
    const initial = allowed(new URLSearchParams(location.search).get('route')) || new URL('hero/userHero.html', root);
    const navigate = (href, replace = false) => {
      const url = allowed(href);
      if (!url) return;
      history[replace ? 'replaceState' : 'pushState']({ ofoq: true }, '', url);
      frame.contentWindow.location.replace(url.href);
    };
    session.navigate = navigate;
    session.syncURL = href => {
      const url = allowed(href);
      if (url) history.replaceState({ ofoq: true }, '', url);
    };
    addEventListener('popstate', () => frame.contentWindow.location.replace(location.href));
    frame.addEventListener('load', () => {
      try { document.title = frame.contentDocument.title; session.syncURL(frame.contentWindow.location.href); } catch {}
    });
    history.replaceState({ ofoq: true }, '', initial);
    frame.src = initial.href;
    return;
  }
  let shared;
  try { if (parent !== window) shared = parent.OfoqFrontend; } catch {}
  if (!shared && parent === window) {
    const shell = new URL('app.html', root);
    shell.searchParams.set('route', location.href);
    // Stop parsing the outgoing document so its page scripts do not execute
    // against a document being replaced by the application host.
    window.stop();
    location.replace(shell.href);
    return;
  }
  // Admin's embedded scene preview has its own isolated session.
  window.OfoqFrontend = shared || makeSession();
  const app = window.OfoqFrontend;
  if (!app.navigate) app.navigate = href => location.assign(href);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = allowed(link.href);
    if (!url || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
    event.preventDefault();
    app.navigate(url.href);
  });
  const replace = history.replaceState.bind(history);
  history.replaceState = (...args) => { replace(...args); app.syncURL?.(location.href); };
  addEventListener('hashchange', () => app.syncURL?.(location.href));
})();
