(() => {
  const get = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(value);
  const courses = window.OfoqCourses;
  let store = OfoqLearning.create(courses);
  let selected = new Set(store.state.cart);
  const checkboxes = new Map();

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function themedLink(link) {
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin) {
      url.searchParams.set('theme', document.documentElement.dataset.theme);
      link.href = url.href;
    }
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    const toggle = document.querySelector('.theme-toggle');
    toggle.textContent = theme === 'dark' ? '☀ الوضع النهاري' : '☾ الوضع الليلي';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
    const url = new URL(location.href);
    url.searchParams.set('theme', document.documentElement.dataset.theme);
    history.replaceState(null, '', url);
    document.querySelectorAll('a[href]').forEach(themedLink);
  }

  function summary() {
    const result = store.cartSummary([...selected]);
    selected = new Set(result.chosen.map(course => course.id));
    get('fullCartTotal').textContent = money(result.total);
    get('unselectedTotal').textContent = money(result.unselectedTotal);
    get('selectedTotal').textContent = money(result.selectedTotal);
    get('selectionCount').textContent = result.chosen.length + ' من ' + result.items.length + ' مختارة';
    get('selectedCount').textContent = result.chosen.length + ' دورات';
    get('cartDescription').textContent = result.items.length + ' دورات في سلتك. اختر ما تريد تعلّمه الآن.';
    get('selectedItems').replaceChildren(...result.chosen.map(course => {
      const item = node('li');
      item.append(node('span', course.title), node('strong', money(course.price)));
      return item;
    }));
    if (!result.chosen.length) get('selectedItems').append(node('li', 'لم تختر أي دورة للشراء بعد.', 'nothing-selected'));
    get('checkoutSelected').disabled = result.chosen.length === 0;
    get('checkoutSelected').textContent = result.chosen.length ? 'إتمام الشراء · ' + money(result.selectedTotal) : 'اختر دورة للمتابعة';
    get('selectAll').checked = result.items.length > 0 && result.chosen.length === result.items.length;
    get('selectAll').indeterminate = result.chosen.length > 0 && result.chosen.length < result.items.length;
    get('selectAll').disabled = !result.items.length;
    for (const [id, checkbox] of checkboxes) checkbox.checked = selected.has(id);
    get('shoppingLayout').hidden = !result.items.length;
    get('emptyCart').hidden = result.items.length > 0 || !get('purchaseSuccess').hidden;
  }

  function action(text, handler) {
    const button = node('button', text, 'learn-text');
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  function render() {
    checkboxes.clear();
    const rows = store.cartSummary([...selected]).items.map(course => {
      const row = node('article', undefined, 'shopping-course');
      row.dataset.course = course.id;
      const checkbox = node('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(course.id);
      checkbox.setAttribute('aria-label', 'اختيار ' + course.title + ' للشراء');
      checkbox.addEventListener('change', () => {
        checkbox.checked ? selected.add(course.id) : selected.delete(course.id);
        summary();
      });
      checkboxes.set(course.id, checkbox);
      const cover = node('a', undefined, 'shopping-cover');
      cover.href = OfoqLearning.url(course.id);
      cover.setAttribute('aria-label', 'تفاصيل ' + course.title);
      const image = node('img');
      image.src = OfoqLearning.cover(course.id);
      image.alt = ''; image.width = 800; image.height = 450;
      cover.append(image);
      const info = node('div', undefined, 'shopping-info');
      const title = node('h2');
      const titleLink = node('a', course.title);
      titleLink.href = cover.href; title.append(titleLink);
      const instructor = node('p', 'بواسطة ' + course.instructor);
      const details = node('p', course.hours + ' ساعة في المسار · ' + course.syllabus.length + ' دروس تفاعلية · ' + (course.level === 'beginner' ? 'مبتدئ' : 'متوسط'));
      const badge = node('span', 'وصول للدورة كاملة', 'learning-badge');
      info.append(title, instructor, details, badge);
      const controls = node('div', undefined, 'shopping-actions');
      controls.append(action('إزالة', () => {
        store.toggle('cart', course.id); selected.delete(course.id); render();
        get('cartStatus').textContent = 'أُزيلت «' + course.title + '» من السلة.';
      }));
      controls.append(action('حفظ في المفضلة', () => {
        if (!store.state.wishlist.includes(course.id)) store.toggle('wishlist', course.id);
        store.toggle('cart', course.id); selected.delete(course.id); render();
        get('cartStatus').textContent = 'حُفظت «' + course.title + '» في المفضلة.';
      }));
      const price = node('strong', money(course.price), 'shopping-price');
      row.append(checkbox, cover, info, controls, price);
      return row;
    });
    get('cartItems').replaceChildren(...rows);
    summary();
  }

  get('selectAll').addEventListener('change', () => {
    selected = new Set(get('selectAll').checked ? store.state.cart : []);
    summary();
  });
  get('checkoutSelected').addEventListener('click', () => {
    const ids = store.cartSummary([...selected]).chosen.map(course => course.id);
    if (!ids.length) return;
    store.checkout(ids, () => {
      get('purchaseSuccess').hidden = false;
      get('purchasedCourses').replaceChildren(...ids.map(id => {
        const course = courses.find(item => item.id === id);
        const link = node('a', 'ابدأ ' + course.title + ' ←', 'learn-primary');
        link.href = OfoqLearning.url(id); return link;
      }));
      selected.clear(); render();
      get('cartStatus').textContent = 'اكتمل شراء ' + ids.length + ' دورات تجريبيًا.';
      get('purchaseSuccess').focus();
    });
  });
  document.querySelector('.theme-toggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  const refresh = () => {
    store = OfoqLearning.create(courses);
    selected = new Set([...selected].filter(id => store.state.cart.includes(id)));
    render();
  };
  addEventListener('pageshow', refresh);
  addEventListener('storage', event => { if (event.key === 'ofoq-learning-v1') refresh(); });
  get('year').textContent = new Date().getFullYear();
  setTheme(new URLSearchParams(location.search).get('theme'));
  render();
})();
