
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
  let store = OfoqLearning.create(courses);
  const get = id => document.getElementById(id);
  const labels = {development:'التطوير',design:'التصميم',marketing:'التسويق',career:'المهارات المهنية',beginner:'مبتدئ',intermediate:'متوسط',path:'مسار تعلّم',workshop:'ورشة'};
  const requestedLibrary = new URLSearchParams(location.search).get('library');
  let library = ['overview', 'enrolled', 'wishlist'].includes(requestedLibrary) ? requestedLibrary : 'all';
  function node(tag,text,className) { const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element; }
  function button(text,action,className='learn-primary') { const element=node('button',text,className);element.type='button';element.addEventListener('click',action);return element; }
  function card(course) {
    const owned=store.has(course.id), article=node('article',undefined,'course-card'),cover=node('a',undefined,'course-cover');
    article.dataset.course=course.id;cover.href=OfoqLearning.url(course.id);cover.setAttribute('aria-label','تفاصيل '+course.title);
    const image=node('img');image.src=OfoqLearning.cover(course.id);image.alt='';image.width=800;image.height=450;image.loading='lazy';cover.append(image);
    const body=node('div',undefined,'course-body'),title=node('h2'),link=node('a',course.title);link.href=cover.href;title.append(link);
    const owner=node('a',course.instructor,'course-instructor');owner.href=OfoqPublishers.url('Profile',OfoqPublishers.forRecord('course',course).id);
    const badge=node('span',course.price?'تعلّم عملي':'دورة مجانية','learning-badge');
    const meta=node('p',course.hours+' ساعة · '+course.syllabus.length+' دروس تفاعلية · '+labels[course.level],'course-meta');
    const price=node('strong',course.price?'$'+course.price:'مجاني','course-price');
    const actions=node('div',undefined,'course-actions');
    actions.append(button(owned?'متابعة التعلّم ←':course.price?'اشترِ الآن':'التحق مجانًا',()=>{
      if(owned)location.assign(cover.href);else if(course.price)store.checkout([course.id],()=>location.assign(cover.href));else{store.enroll([course.id]);location.assign(cover.href);}
    }));
    const wish=button(store.state.wishlist.includes(course.id)?'♥':'♡',()=>{store.toggle('wishlist',course.id);render();},'learn-wish');wish.setAttribute('aria-label','المفضلة: '+course.title);wish.setAttribute('aria-pressed',String(store.state.wishlist.includes(course.id)));actions.append(wish);
    if(!owned&&course.price)actions.append(button(store.state.cart.includes(course.id)?'إزالة من السلة':'أضف للسلة',()=>{store.toggle('cart',course.id);render();},'learn-text'));
    body.append(badge,title,owner,meta,price);
    if(owned){const progress=node('progress');progress.max=100;progress.value=store.percent(course.id);progress.setAttribute('aria-label','تقدّمك في '+course.title);body.append(progress,node('small',store.percent(course.id)+'% مكتمل'));}
    body.append(actions);article.append(cover,body);return article;
  }
  function renderOverview() {
    const enrolled = courses.filter(course => store.has(course.id));
    const completed = enrolled.filter(course => store.percent(course.id) === 100);
    const lessonTotal = enrolled.reduce((sum, course) => sum + course.syllabus.length, 0);
    const finished = enrolled.reduce((sum, course) => sum + store.state.progress[course.id].length, 0);
    const percent = lessonTotal ? Math.round(finished / lessonTotal * 100) : 0;
    const summary = store.cartSummary(store.state.cart);
    const metrics = [
      ['دوراتي', enrolled.length, 'دورات التحقت بها'],
      ['التقدّم العام', percent + '%', finished + ' من ' + lessonTotal + ' دروس'],
      ['دورات مكتملة', completed.length, 'إنجازاتك حتى الآن'],
      ['في السلة', summary.items.length, '$' + summary.total.toFixed(2) + ' إجمالي السلة']
    ];
    get('overviewMetrics').replaceChildren(...metrics.map(([label, value, hint]) => {
      const item = node('article', undefined, 'overview-metric');
      item.append(node('span', label), node('strong', value), node('small', hint));
      return item;
    }));
    const inProgress = [...enrolled].sort((a, b) => Number(store.percent(a.id) === 100) - Number(store.percent(b.id) === 100));
    get('overviewCourses').replaceChildren(...inProgress.map(card));
    get('overviewEmpty').hidden = enrolled.length > 0;
    function miniCard(course) {
      const link = node('a', undefined, 'overview-mini-course');
      link.href = OfoqLearning.url(course.id);
      const image = node('img'); image.src = OfoqLearning.cover(course.id); image.alt = ''; image.width = 80; image.height = 45;
      const info = node('span'); info.append(node('strong', course.title), node('small', course.price ? '$' + course.price : 'مجاني'));
      link.append(image, info); return link;
    }
    get('overviewCartItems').replaceChildren(...summary.items.map(miniCard));
    if (!summary.items.length) get('overviewCartItems').append(node('p', 'ما في دورات بالسلة حاليًا.', 'overview-hint'));
    get('overviewCartTotal').textContent = '$' + summary.total.toFixed(2);
    const wishlist = courses.filter(course => store.state.wishlist.includes(course.id));
    get('overviewWishlist').replaceChildren(...wishlist.slice(0, 3).map(miniCard));
    if (!wishlist.length) get('overviewWishlist').append(node('p', 'احفظ الدورات اللي تهمّك لتعود لها لاحقًا.', 'overview-hint'));
  }
  function render(){
    get('academyOverview').hidden = library !== 'overview';
    get('catalogWorkspace').hidden = library === 'overview';
    if (library === 'overview') renderOverview();
    const query=get('searchQuery').value.trim().toLowerCase(),category=get('category').value,level=get('level').value,format=get('format').value,price=get('price').value;
    const items=courses.filter(course=>{
      if(library==='enrolled'&&!store.has(course.id))return false;if(library==='wishlist'&&!store.state.wishlist.includes(course.id))return false;
      return (!query||[course.title,course.description,course.instructor,...course.syllabus].join(' ').toLowerCase().includes(query))&&(!category||course.category===category)&&(!level||course.level===level)&&(!format||course.format===format)&&(price!=='free'||course.price===0)&&(price!=='paid'||course.price>0);
    });
    if(get('sortBy').value==='duration')items.sort((a,b)=>a.hours-b.hours);if(get('sortBy').value==='price')items.sort((a,b)=>a.price-b.price);
    get('courseList').replaceChildren(...items.map(card));get('emptyState').hidden=items.length>0;get('resultCount').textContent=items.length+' دورات';
    get('learningCount').textContent=store.state.enrolled.length;get('wishCount').textContent=store.state.wishlist.length;get('cartCount').textContent=store.state.cart.length;
    get('academyCartCount').textContent = store.state.cart.length;
    get('featuredWishCount').textContent = store.state.wishlist.length;
    get('academyCartButton').setAttribute('aria-label', 'فتح سلة مشتريات الأكاديمية، ' + store.state.cart.length + ' دورات');
    get('featuredWishlist').setAttribute('aria-label', 'عرض المفضلة، ' + store.state.wishlist.length + ' دورات');
    document.querySelectorAll('[data-library]').forEach(element=>element.setAttribute('aria-pressed',String(element.dataset.library===library)));
  }
  function clear(){get('filterForm').reset();get('searchForm').reset();render();}
  for(const id of ['filterForm','searchForm'])get(id).addEventListener('submit',event=>{event.preventDefault();render();});
  for(const id of ['category','level','format','price','sortBy'])get(id).addEventListener('change',render);
  get('searchQuery').addEventListener('input',render);get('clearFilters').addEventListener('click',clear);get('resetEmpty').addEventListener('click',clear);
  document.querySelectorAll('[data-library]').forEach(element=>element.addEventListener('click',()=>{library=element.dataset.library;render();}));
  get('overviewDiscover').addEventListener('click', () => { library = 'all'; clear(); });
  get('overviewViewWishlist').addEventListener('click', () => { library = 'wishlist'; clear(); });
  get('featuredWishlist').addEventListener('click', () => {
    library = 'wishlist'; clear();
    get('trainingCourses').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  get('year').textContent=new Date().getFullYear();
  const refresh=()=>{store=OfoqLearning.create(courses);render();};
  addEventListener('pageshow',refresh);
  addEventListener('storage',event=>{if(event.key==='ofoq-learning-v1')refresh();});
  render();
})();
