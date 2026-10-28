const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const catalogSource = fs.readFileSync('Academy/academy.js', 'utf8');
const catalogStart = catalogSource.indexOf('const courses =');
const catalogEnd = catalogSource.indexOf('\n(function () {', catalogStart);
const courses = vm.runInNewContext(fs.readFileSync('Academy/catalog.js', 'utf8') + '\nwindow.OfoqCourses', {window: {}});
const detailSource = fs.readFileSync('Academy/Course/course.js', 'utf8');
const runtime = detailSource.slice(detailSource.indexOf('(function () {', detailSource.indexOf('const courses =')));
const librarySource = fs.readFileSync('Academy/learning.js', 'utf8');
const contentSource = fs.readFileSync('Academy/lesson-content.js', 'utf8');
const html = fs.readFileSync('Academy/Course/course.html', 'utf8');

class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.listeners = {}; this.attributes = {};
    this.value = ''; this.hidden = false; this.disabled = false; this.textContent = '';
    this.dataset = {};
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  fire(name, event = {}) { for (const fn of this.listeners[name] || []) fn(event); }
  click() { if (!this.disabled) this.fire('click'); }
  focus() {}
  scrollIntoView() {}
  insertAdjacentHTML() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
  remove() { this.removed = true; }
}

function fixture(id = 'react', memory = new Map(), blocked = false) {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const frames = new Map(); let serial = 0;
  const body = new Element('body');
  const document = {
    currentScript: {src: 'https://example.test/Academy/learning.js'},
    documentElement: {dataset: {theme: 'light'}}, body, hidden: false,
    getElementById: name => elements.get(name),
    createElement: tag => new Element(tag), createTextNode: text => ({textContent: text}),
    querySelector: () => null, addEventListener() {}, activeElement: new Element()
  };
  const sandbox = {
    URL, URLSearchParams, document, courses,
    location: {search: '?id=' + id},
    localStorage: {
      getItem(key) { if (blocked) throw Error('blocked'); return memory.get(key) || null; },
      setItem(key, value) { if (blocked) throw Error('blocked'); memory.set(key, value); }
    },
    OfoqPublishers: {forRecord: () => ({}), card: () => ''},
    addEventListener() {}, matchMedia: () => ({matches: true}),
    performance: {now: () => 0},
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout() { return 1; }, clearTimeout() {}
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(librarySource, context); vm.runInContext(contentSource, context);
  return {context, elements, body, memory, frames, get: id => elements.get(id),
    store: () => context.OfoqLearning.create(courses), run: () => vm.runInContext(runtime, context)};
}

const state = fixture();
let store = state.store();
store.complete('react', 0);
assert.equal(store.percent('react'), 0, 'Locked courses cannot earn progress');
store.toggle('cart', 'react'); store.toggle('wishlist', 'react');
assert.equal(store.state.cart.length, 1);
store.checkout(['react']);
let dialog = state.body.children.at(-1);
dialog.children.at(-1).click();
assert.equal(store.has('react'), false, 'Cancel does not enroll');
store.checkout(['react']);
dialog = state.body.children.at(-1);
dialog.children.at(-2).click();
assert.equal(store.has('react'), true);
assert.equal(store.state.cart.length, 0, 'Purchased courses leave the cart');
store.complete('react', 0); store.complete('react', 0);
assert.equal(store.percent('react'), 25, 'Completion must be idempotent');
store.complete('react', 90);
assert.equal(store.percent('react'), 25, 'Invalid lesson indexes are rejected');
store.remember('react', 1); store.note('react', 1, 'My saved lesson note');
store = state.store();
assert.equal(store.percent('react'), 25);
assert.equal(store.state.current.react, 1);
assert.equal(store.state.notes['react:1'], 'My saved lesson note');

state.run();
assert.equal(state.get('progressPercent').textContent, '25%');
assert.equal(state.get('lessonNotes').value, 'My saved lesson note');
state.get('completeLesson').click();
assert.equal(state.get('progressPercent').textContent, '50%');
state.get('nextLesson').click();
assert.equal(state.get('lessonTitle').textContent, courses.find(course => course.id === 'react').syllabus[2]);
state.get('playbackSpeed').value = '1'; state.get('playLesson').click();
let now = 0;
for (let i = 0; i < 130 && state.frames.size; i++) {
  const [id, callback] = state.frames.entries().next().value;
  state.frames.delete(id); now += 250; callback(now);
}
assert.equal(state.get('progressPercent').textContent, '75%', 'Finished playback updates progress');
state.get('nextLesson').click(); state.get('completeLesson').click();
assert.equal(state.get('progressPercent').textContent, '100%');
assert.equal(state.get('completionBanner').hidden, false);
const reloaded = fixture('react', state.memory); reloaded.run();
assert.equal(reloaded.get('progressPercent').textContent, '100%', 'Progress survives page reload');

const preview = fixture(); preview.run();
assert.equal(preview.get('completeLesson').disabled, true);
preview.get('curriculumList').children[1].click();
assert.equal(preview.body.children.at(-1).open, true, 'Paid lessons open checkout');
assert.equal(preview.get('lessonTitle').textContent, courses.find(course => course.id === 'react').syllabus[0]);
const free = fixture('web'); free.run(); free.get('buyCourse').click();
assert.equal(free.get('completeLesson').disabled, false, 'Free enrollment unlocks lessons');
const missing = fixture('unknown'); missing.run();
assert.equal(missing.get('notFound').hidden, false);
assert.equal(missing.get('detailContent').hidden, true);
const blocked = fixture('web', new Map(), true); blocked.run(); blocked.get('buyCourse').click();
assert.equal(blocked.get('storageNotice').hidden, false);
assert.equal(blocked.get('completeLesson').disabled, false);
const corrupted = fixture('react', new Map([['ofoq-learning-v1', '{broken']]));
assert.doesNotThrow(() => corrupted.run());
for (const course of courses) {
  assert.equal(state.context.OfoqLessons[course.id].length, course.syllabus.length);
  for (const lesson of state.context.OfoqLessons[course.id]) assert.equal(lesson.length, 4);
}
const catalogFixture = fixture();
const catalogHtml = fs.readFileSync('Academy/academy.html', 'utf8');
for (const match of catalogHtml.matchAll(/\bid="([^"]+)"/g)) catalogFixture.elements.set(match[1], new Element());
catalogFixture.get('filterForm').reset = () => {
  for (const id of ['category', 'level', 'format', 'price']) catalogFixture.get(id).value = '';
};
catalogFixture.get('searchForm').reset = () => { catalogFixture.get('searchQuery').value = ''; };
const tabs = ['all', 'enrolled', 'wishlist', 'overview'].map(value => { const button = new Element('button'); button.dataset.library = value; return button; });
catalogFixture.context.document.querySelectorAll = () => tabs;
catalogFixture.context.OfoqPublishers.forRecord = () => ({id: 'omar'});
catalogFixture.context.OfoqPublishers.url = () => 'https://example.test/Account/Profile/profile.html?user=omar';
catalogFixture.context.location.assign = () => {};
vm.runInContext(catalogSource.slice(catalogEnd), catalogFixture.context);
assert.equal(catalogFixture.get('courseList').children.length, 6);
const reactCard = catalogFixture.get('courseList').children[3];
reactCard.children[1].children.at(-1).children[1].click();
assert.equal(catalogFixture.get('wishCount').textContent, 1);
assert.equal(catalogFixture.get('featuredWishCount').textContent, 1);
tabs[2].click();
assert.equal(catalogFixture.get('courseList').children.length, 1, 'Wishlist filters catalog');
catalogFixture.get('courseList').children[0].children[1].children.at(-1).children[2].click();
assert.equal(catalogFixture.get('cartCount').textContent, 1);
assert(catalogHtml.includes('id="openCart" href="Cart/cart.html"'), 'Catalog links to the full cart page');
tabs[0].click();
catalogFixture.get('searchQuery').value = 'React';
catalogFixture.get('searchQuery').fire('input');
assert.equal(catalogFixture.get('courseList').children.length, 1);
assert.equal(catalogFixture.get('academyCartCount').textContent, 1, 'Academy cart button updates with cart contents');
assert(catalogHtml.includes('id="academyCartButton"'), 'Academy includes a prominent cart button');
tabs[3].click();
assert.equal(catalogFixture.get('academyOverview').hidden, false);
assert.equal(catalogFixture.get('catalogWorkspace').hidden, true);
assert.equal(catalogFixture.get('overviewCartTotal').textContent, '$49.00');
assert.equal(catalogFixture.get('overviewCartItems').children.length, 1);
assert.equal(catalogFixture.get('overviewWishlist').children.length, 1);
assert.equal(catalogFixture.get('overviewEmpty').hidden, false);
catalogFixture.get('overviewDiscover').click();
assert.equal(catalogFixture.get('academyOverview').hidden, true);
assert.equal(catalogFixture.get('catalogWorkspace').hidden, false);
catalogFixture.get('featuredWishlist').click();
assert.equal(catalogFixture.get('courseList').children.length, 1, 'Featured wishlist button opens favorite courses');

const cartFixture = fixture();
const cartHtml = fs.readFileSync('Academy/Cart/cart.html', 'utf8');
for (const match of cartHtml.matchAll(/\bid="([^"]+)"/g)) cartFixture.elements.set(match[1], new Element());
cartFixture.get('purchaseSuccess').hidden = true;
cartFixture.context.document.documentElement.style = {};
const themeToggle = new Element('button');
cartFixture.context.document.querySelector = () => themeToggle;
cartFixture.context.document.querySelectorAll = () => [];
cartFixture.context.location = {href: 'https://example.test/Academy/Cart/cart.html', origin: 'https://example.test', search: ''};
cartFixture.context.history = {replaceState() {}};
cartFixture.context.OfoqCourses = courses;
const cartStore = cartFixture.store();
for (const id of ['react', 'brand', 'marketing']) cartStore.toggle('cart', id);
vm.runInContext(fs.readFileSync('Academy/Cart/cart.js', 'utf8'), cartFixture.context);
assert.equal(cartFixture.get('fullCartTotal').textContent, '$109.00');
assert.equal(cartFixture.get('selectedTotal').textContent, '$109.00');
assert.equal(cartFixture.get('cartItems').children.length, 3);
const brandCheckbox = cartFixture.get('cartItems').children[1].children[0];
brandCheckbox.checked = false; brandCheckbox.fire('change');
assert.equal(cartFixture.get('selectedTotal').textContent, '$84.00');
assert.equal(cartFixture.get('fullCartTotal').textContent, '$109.00');
assert.equal(cartFixture.get('unselectedTotal').textContent, '$25.00');
assert.equal(cartFixture.get('selectAll').indeterminate, true);
cartFixture.get('selectAll').checked = false;
cartFixture.get('selectAll').fire('change');
assert.equal(cartFixture.get('selectedTotal').textContent, '$0.00');
assert.equal(cartFixture.get('checkoutSelected').disabled, true);
cartFixture.get('selectAll').checked = true;
cartFixture.get('selectAll').fire('change');
assert.equal(cartFixture.get('selectedTotal').textContent, '$109.00');
brandCheckbox.checked = false; brandCheckbox.fire('change');
cartFixture.get('checkoutSelected').click();
cartFixture.body.children.at(-1).children.at(-1).click();
assert.equal(cartFixture.store().has('react'), false, 'Cancel leaves cart ownership unchanged');
cartFixture.get('checkoutSelected').click();
cartFixture.body.children.at(-1).children.at(-2).click();
const purchased = cartFixture.store();
assert.equal(purchased.has('react'), true);
assert.equal(purchased.has('marketing'), true);
assert.equal(purchased.has('brand'), false, 'Unselected courses must not be purchased');
assert.deepEqual([...purchased.state.cart], ['brand']);
assert.equal(cartFixture.get('purchaseSuccess').hidden, false);
assert.equal(cartFixture.get('selectedTotal').textContent, '$0.00');
cartFixture.get('cartItems').children[0].children[3].children[1].click();
const favorite = cartFixture.store();
assert(favorite.state.wishlist.includes('brand'));
assert.equal(favorite.state.cart.length, 0);
assert.equal(cartFixture.get('shoppingLayout').hidden, true);
assert.equal(cartFixture.get('checkoutSelected').disabled, true);
console.log('Passed: cart totals/selection/partial purchase/cancel/favorites, catalog search, free enrollment, access, playback, progress, notes, reload, unknown courses and storage fallbacks.');
