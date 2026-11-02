(() => {
  const app = window.OfoqFrontend;
  const labels = {all:'الكل',projects:'المشاريع',courses:'الدورات',workshops:'الورش',jobs:'الوظائف',internships:'التدريب',events:'الفعاليات'};
  const legacy = {projects:'ofoq-project-favorites-v1',internships:'ofoq-saved-internships-v1'};
  let filter = 'all';
  const read = (key, fallback) => { try { return JSON.parse(app.memory.getItem(key)) || fallback; } catch { return fallback; } };
  const node = (tag, text, className) => { const el = document.createElement(tag); if(text)el.textContent=text;if(className)el.className=className;return el; };
  function saved() {
    const rows = [...app.savedRecords];
    for (const [kind,key] of Object.entries(legacy)) {
      const ids = read(key, []);
      for (const record of app.catalogs[kind] || []) {
        if (!ids.some(id=>String(id)===String(record.id))) continue;
        const file = kind==='projects' ? '../../Freelance/Project/project.html' : '../../Internships/Internship/internship.html';
        rows.push({kind,id:record.id,title:record.title,href:file+'?id='+encodeURIComponent(record.id),key});
      }
    }
    const learning = read('ofoq-learning-v1', {});
    for (const record of window.OfoqCourses || []) {
      if (!(learning.wishlist || []).includes(record.id)) continue;
      rows.push({kind:record.format==='workshop'?'workshops':'courses',id:record.id,title:record.title,href:'../../Academy/Course/course.html?id='+encodeURIComponent(record.id),key:'ofoq-learning-v1'});
    }
    return rows.filter((row,index)=>rows.findIndex(other=>other.kind===row.kind&&String(other.id)===String(row.id))===index);
  }
  function remove(row) {
    if (row.key === 'ofoq-learning-v1') {
      const learning=read(row.key,{}); learning.wishlist=(learning.wishlist||[]).filter(id=>String(id)!==String(row.id));app.memory.setItem(row.key,JSON.stringify(learning));if(app.learning)app.learning.wishlist=learning.wishlist;
    } else if (row.key) app.memory.setItem(row.key,JSON.stringify(read(row.key,[]).filter(id=>String(id)!==String(row.id))));
    app.savedRecords=app.savedRecords.filter(item=>!(item.kind===row.kind&&String(item.id)===String(row.id)));
    render();document.getElementById('favoritesStatus').textContent='أُزيلت «'+row.title+'» من المفضلة.';
  }
  function render() {
    const rows=saved(), filters=document.getElementById('favoriteFilters'); filters.replaceChildren();
    for (const [kind,label] of Object.entries(labels)) {
      const count=kind==='all'?rows.length:rows.filter(row=>row.kind===kind).length;
      const button=node('button',label+' · '+count);button.type='button';button.setAttribute('aria-pressed',String(filter===kind));button.addEventListener('click',()=>{filter=kind;render();});filters.append(button);
    }
    const shown=rows.filter(row=>filter==='all'||filter===row.kind), list=document.getElementById('favoriteItems');list.replaceChildren();
    for (const row of shown) {
      const article=node('article',null,'favorite-row'), text=node('div');text.append(node('small',labels[row.kind]),node('h2',row.title));
      const controls=node('div',null,'favorite-controls'),link=node('a','عرض التفاصيل ←','learn-primary');
      const url=new URL(row.href,location.href);url.searchParams.set('theme',document.documentElement.dataset.theme||'light');link.href=url.href;
      const button=node('button','إزالة','learn-secondary');button.type='button';button.setAttribute('aria-label','إزالة من المفضلة: '+row.title);button.addEventListener('click',()=>remove(row));
      controls.append(link,button);article.append(text,controls);list.append(article);
    }
    document.getElementById('favoritesEmpty').hidden=Boolean(shown.length);
  }
  document.getElementById('year').textContent=new Date().getFullYear();
  document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light';
  document.querySelector('.theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;const url=new URL(location.href);url.searchParams.set('theme',theme);history.replaceState(null,'',url);render();});
  render();
})();
