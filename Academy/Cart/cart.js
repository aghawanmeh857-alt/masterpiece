(() => {
  const get = id => document.getElementById(id);
  const app = window.OfoqFrontend;
  const courses = window.OfoqCourses;
  const money = value => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(value);
  const trainingKey = 'ofoq-internship-cart-v1';
  let store = OfoqLearning.create(courses);
  let selected = null;
  let paying = false;
  const checkboxes = new Map();
  const labels = {courses:'دورة', internships:'فرصة تدريب', events:'فعالية'};
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function trainingItems() {
    try { const rows = JSON.parse(app.memory.getItem(trainingKey) || '[]'); return Array.isArray(rows) ? rows.filter(row => row && row.id != null) : []; } catch { return []; }
  }
  function href(kind, id, original) {
    const routes = {internships:'../../Internships/Internship/internship.html',events:'../../Events/Event/event.html'};
    const url = new URL(original || routes[kind], location.href);
    url.searchParams.set('id', id);
    url.searchParams.set('theme', document.documentElement.dataset.theme || 'light');
    return url.href;
  }
  function items() {
    const result = store.cartSummary([]).items.map(course => ({...course, kind:'courses', key:course.id, href:OfoqLearning.url(course.id)}));
    for (const row of trainingItems()) {
      const current = (app.catalogs?.internships || []).find(item => String(item.id) === String(row.id));
      const fee = current?.applicationFee ?? row.applicationFee;
      result.push({...row, kind:'internships', key:'internships:'+row.id, price:fee == null ? null : Number(fee), href:href('internships',row.id)});
    }
    app.cartRecords = (app.cartRecords || []).filter(row => !['jobs','projects'].includes(row.kind));
    for (const row of app.cartRecords) {
      if (row.kind !== 'events') continue;
      const current = (app.catalogs?.events || []).find(item => String(item.id) === String(row.id));
      const price = current?.price ?? current?.reward ?? row.price;
      result.push({...row, key:'events:'+row.id, price:price == null ? null : Number(price), href:href('events',row.id,row.href)});
    }
    return result.map(row => ({...row, price:Number.isFinite(row.price) && row.price >= 0 ? row.price : null}));
  }
  function remove(item) {
    if (item.kind === 'courses') store.toggle('cart',item.id);
    else if (item.kind === 'internships') app.memory.setItem(trainingKey,JSON.stringify(trainingItems().filter(row => String(row.id) !== String(item.id))));
    else app.cartRecords = app.cartRecords.filter(row => !(row.kind === item.kind && String(row.id) === String(item.id)));
    selected.delete(item.key);
  }
  function action(text, handler) { const button=node('button',text,'learn-text');button.type='button';button.addEventListener('click',handler);return button; }
  function summary() {
    const all = items();
    selected = new Set([...selected].filter(key => all.some(row => row.key === key && row.price !== null)));
    const chosen = all.filter(row => selected.has(row.key));
    const total = all.reduce((sum,row) => sum+(row.price || 0),0);
    const amount = chosen.reduce((sum,row) => sum+row.price,0);
    get('fullCartTotal').textContent=money(total);
    get('unselectedTotal').textContent=money(total-amount);
    get('selectedTotal').textContent=money(amount);
    get('selectionCount').textContent=chosen.length+' من '+all.length+' مختارة';
    get('selectedCount').textContent=chosen.length+' عناصر';
    get('cartDescription').textContent=all.length+' عناصر في سلتك المشتركة من أقسام المنصة.';
    get('selectedItems').replaceChildren(...chosen.map(row => {const item=node('li');item.append(node('span',row.title),node('strong',money(row.price)));return item;}));
    if (!chosen.length) get('selectedItems').append(node('li','لم تختر عناصر للمتابعة بعد.','nothing-selected'));
    get('checkoutSelected').disabled=!chosen.length || paying;
    get('checkoutSelected').textContent=chosen.length ? 'إتمام الطلب · '+money(amount) : 'اختر عناصر للمتابعة';
    const available=all.filter(row=>row.price!==null);
    get('selectAll').checked=available.length>0 && chosen.length===available.length;
    get('selectAll').indeterminate=chosen.length>0 && chosen.length<available.length;
    get('selectAll').disabled=!available.length;
    for(const [key, checkbox] of checkboxes)checkbox.checked=selected.has(key);
    get('shoppingLayout').hidden=!all.length;
    get('emptyCart').hidden=all.length>0 || !get('purchaseSuccess').hidden;
  }
  function render() {
    const all=items();
    if(selected===null)selected=new Set(all.filter(row=>row.price!==null).map(row=>row.key));
    checkboxes.clear();
    get('cartItems').replaceChildren(...all.map(item=>{
      const row=node('article',undefined,'shopping-course');row.dataset.kind=item.kind;
      const checkbox=node('input');checkbox.type='checkbox';checkbox.checked=selected.has(item.key);checkbox.disabled=item.price===null;
      checkbox.setAttribute('aria-label','اختيار '+item.title);
      checkbox.addEventListener('change',()=>{checkbox.checked?selected.add(item.key):selected.delete(item.key);summary();});checkboxes.set(item.key,checkbox);
      const cover=node('a',undefined,'shopping-cover');cover.href=item.href;cover.setAttribute('aria-label','تفاصيل '+item.title);
      const image=node('img');image.src=item.kind==='courses'?OfoqLearning.cover(item.id):'../../assets/project-covers/dashboard.svg';image.alt='';image.width=800;image.height=450;cover.append(image);
      const info=node('div',undefined,'shopping-info'),title=node('h2'),link=node('a',item.title);link.href=item.href;title.append(link);
      info.append(title,node('p',item.instructor || item.company || ''),node('p',item.kind==='courses'?item.hours+' ساعة · '+item.syllabus.length+' دروس':item.kind==='internships'?'رسوم التدريب على المتدرّب':'رسوم التسجيل بالفعالية'),node('span',labels[item.kind],'learning-badge'));
      const controls=node('div',undefined,'shopping-actions');
      controls.append(action('إزالة',()=>{remove(item);render();get('cartStatus').textContent='أُزيلت «'+item.title+'» من السلة.';}));
      controls.append(action('حفظ في المفضلة',()=>{
        if(item.kind==='courses'){if(!store.state.wishlist.includes(item.id))store.toggle('wishlist',item.id);}
        else if(!app.savedRecords.some(row=>row.kind===item.kind&&String(row.id)===String(item.id)))app.toggleFavorite(item.kind,item,item.href);
        remove(item);render();get('cartStatus').textContent='حُفظت «'+item.title+'» في المفضلة.';
      }));
      const price=node('strong',item.price===null?'راجع التفاصيل':item.price===0?'دون رسوم':money(item.price),'shopping-price');
      row.append(checkbox,cover,info,controls,price);return row;
    }));
    get('trainingCart').hidden=true;get('sharedCart').hidden=true;
    summary();
  }
  get('selectAll').addEventListener('change',()=>{selected=new Set(get('selectAll').checked?items().filter(row=>row.price!==null).map(row=>row.key):[]);summary();});
  get('checkoutSelected').addEventListener('click',()=>{
    const chosen=items().filter(row=>selected.has(row.key));if(!chosen.length||paying)return;
    const amount=chosen.reduce((sum,row)=>sum+row.price,0);
    const complete=()=>{
      const courseIds=chosen.filter(row=>row.kind==='courses').map(row=>row.id);store.enroll(courseIds);
      for(const item of chosen){
        if(item.kind==='internships')app.apply('internship',item.id,item.title,item.href);
        if(item.kind==='events')app.register(item.id,item.title,item.href);
        if(item.kind!=='courses')remove(item);
      }
      get('purchaseSuccess').hidden=false;
      get('purchasedCourses').replaceChildren(...chosen.map(item=>{const link=node('a',(item.kind==='courses'?'ابدأ ':'عرض ')+item.title+' ←','learn-primary');link.href=item.href;return link;}));
      selected.clear();paying=false;render();get('cartStatus').textContent='اكتمل طلب '+chosen.length+' عناصر تجريبيًا دون خصم مبلغ.';get('purchaseSuccess').focus();
    };
    if(amount===0){complete();return;}
    if(window.OfoqPayment){window.OfoqPayment.open({title:chosen.map(row=>row.title).join('، '),amount,kind:'عناصر سلتك المختارة',onComplete:complete});}
    else if(chosen.every(row=>row.kind==='courses'))store.checkout(chosen.map(row=>row.id),complete);
    else get('cartStatus').textContent='تعذّر فتح الدفع. حدّث الصفحة وحاول مجددًا.';
  });
  function setTheme(theme){document.documentElement.dataset.theme=theme==='dark'?'dark':'light';document.documentElement.style.colorScheme=document.documentElement.dataset.theme;const toggle=document.querySelector('.theme-toggle');toggle.textContent=theme==='dark'?'☀ الوضع النهاري':'☾ الوضع الليلي';const url=new URL(location.href);url.searchParams.set('theme',document.documentElement.dataset.theme);history.replaceState(null,'',url);document.querySelectorAll('a[href]').forEach(link=>{const target=new URL(link.href,location.href);if(target.origin===location.origin){target.searchParams.set('theme',document.documentElement.dataset.theme);link.href=target.href;}});}
  document.querySelector('.theme-toggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  const refresh=()=>{store=OfoqLearning.create(courses);render();};
  addEventListener('pageshow',refresh);addEventListener('storage',event=>{if(['ofoq-learning-v1',trainingKey,null].includes(event.key))refresh();});
  get('year').textContent=new Date().getFullYear();setTheme(new URLSearchParams(location.search).get('theme'));render();
})();
