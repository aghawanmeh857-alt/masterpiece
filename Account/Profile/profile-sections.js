(() => {
  if(new URLSearchParams(location.search).has('user'))return;
  const main=document.getElementById('mainContent'),stack=main.querySelector('.account-stack'),identity=main.querySelector('.profile-identity');
  main.classList.add('profile-organized');
  const personal=document.getElementById('aboutTitle').closest('section');personal.id='profile-personal';personal.dataset.profileSection='personal';
  document.getElementById('aboutTitle').textContent='معلوماتي الشخصية';
  const info=document.createElement('dl');info.className='profile-personal-info';personal.querySelector('h2').after(info);
  function personalInfo(){info.replaceChildren();for(const [label,key]of [['الاسم الكامل','name'],['البريد الإلكتروني','email'],['المسمى المهني','role'],['الموقع','location']]){const group=document.createElement('div'),term=document.createElement('dt'),value=document.createElement('dd');term.textContent=label;value.textContent=window.OfoqFrontend.profile[key]||'غير محدد';value.dir='auto';group.append(term,value);info.append(group);}}
  personalInfo();document.getElementById('profileForm').addEventListener('submit',personalInfo);
  const edit=document.getElementById('editProfile');personal.querySelector('h2').after(edit);
  const personalHeader=document.createElement('div');personalHeader.className='profile-panel-heading';personal.prepend(personalHeader);personalHeader.append(document.getElementById('aboutTitle'),edit);
  for(const [id,title]of [['profileBio','نبذة عني'],['profileSkills','مهاراتي']]){const element=document.getElementById(id),box=document.createElement('section'),heading=document.createElement('h3');box.className='profile-info-block';heading.textContent=title;element.before(box);box.append(heading,element);}
  document.getElementById('profileCV').dataset.profileSection='cv';
  const definitions=[['personal','معلوماتي الشخصية'],['courses','دوراتي'],['workshops','ورشي التدريبية'],['jobs','طلبات الوظائف'],['internships','طلبات التدريب'],['applications','طلبات المشاريع'],['events','فعالياتي'],['posts','مشاريعي المنشورة'],['cv','السيرة الذاتية']];
  const nav=document.createElement('div');nav.className='profile-section-nav';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','أقسام حسابي');nav.setAttribute('aria-orientation','vertical');
  const buttons=[];
  for(const [id,label]of definitions){const panel=stack.querySelector(`[data-profile-section="${id}"]`);if(!panel)continue;panel.classList.add('profile-section');panel.setAttribute('role','tabpanel');panel.setAttribute('tabindex','0');const button=document.createElement('button');button.type='button';button.id='profile-tab-'+id;button.dataset.profileTab=id;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);panel.setAttribute('aria-labelledby',button.id);const name=document.createElement('span');name.textContent=label;button.append(name);if(panel.dataset.count!==undefined){const count=document.createElement('small');count.textContent=panel.dataset.count;count.className='profile-nav-count';button.append(count);}button.addEventListener('click',()=>select(id));buttons.push(button);nav.append(button);}
  identity.append(nav);
  const paths={personal:'M4 21v-2a8 8 0 0 1 16 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',courses:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3zM12 6v16',workshops:'M4 4h16v12H4zM8 21l4-5 4 5',jobs:'M8 7V3h8v4M3 7h18v14H3zM3 12h18',internships:'M3 9l9-5 9 5-9 5zM6 11v7l6 3 6-3v-7',applications:'M4 5h6l2 3h8v13H4z',events:'M4 5h16v16H4zM8 3v4m8-4v4M4 11h16',posts:'M5 3h10l4 4v14H5zM9 12h6m-6 4h6',cv:'M5 3h10l4 4v14H5zM9 12h6m-6 4h6'};
  for(const button of buttons){const icon=document.createElement('span');icon.className='profile-nav-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[button.dataset.profileTab]+'"/></svg>';button.prepend(icon);}
  const hero=main.querySelector('.account-heading');hero.querySelector('h1').textContent='ملفي الشخصي';
  hero.querySelector('h1').nextElementSibling.textContent='اعرض معلوماتك الشخصية وتابع دوراتك وطلباتك وملفاتك.';
  const overview=document.createElement('div');overview.className='profile-overview';
  for(const [label,count]of [['دورات وورش',(window.OfoqFrontend.learning?.enrolled||[]).length],['طلبات تقديم',window.OfoqFrontend.applications.length],['فعاليات مسجّلة',window.OfoqFrontend.registrations.length]]){const item=document.createElement('div'),value=document.createElement('strong'),text=document.createElement('span');value.textContent=String(count);text.textContent=label;item.append(value,text);overview.append(item);}identity.insertBefore(overview,nav);
  const dashboardLink=hero.querySelector('a');dashboardLink.classList.add('profile-reference-dashboard');
  nav.prepend(dashboardLink);
  const accountType=document.createElement('span');accountType.className='profile-account-type';accountType.textContent='حساب شخصي';hero.append(accountType);
  function select(id,update=true){if(!buttons.some(button=>button.dataset.profileTab===id))id='personal';for(const panel of stack.querySelectorAll('[data-profile-section]'))panel.hidden=panel.dataset.profileSection!==id;for(const button of buttons){const active=button.dataset.profileTab===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}if(update)history.replaceState(null,'','#'+id);}
  function fromHash(){const hash=decodeURIComponent(location.hash.slice(1));select(({profileCV:'cv',portfolioTitle:'personal',profileActivity:'courses',mainContent:'personal'})[hash]||hash||'personal',false);}
  nav.addEventListener('keydown',event=>{const index=buttons.indexOf(event.target);if(index<0)return;let next;if(['ArrowDown','ArrowRight'].includes(event.key))next=(index+1)%buttons.length;else if(['ArrowUp','ArrowLeft'].includes(event.key))next=(index-1+buttons.length)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;event.preventDefault();buttons[next].focus();select(buttons[next].dataset.profileTab);});
  edit.addEventListener('click',()=>select('personal'));
  addEventListener('hashchange',fromHash);
  addEventListener('ofoq:profile-activity',()=>{for(const button of buttons){const count=button.querySelector('.profile-nav-count'),panel=document.getElementById(button.getAttribute('aria-controls'));if(count)count.textContent=panel.dataset.count||'0';}});
  fromHash();
})();
