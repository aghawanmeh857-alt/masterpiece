const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('Internships/internships.js', 'utf8');
const html = fs.readFileSync('Internships/internships.html', 'utf8');
const start = source.indexOf('const pageData =');
const runtimeStart = source.indexOf('\n(async function () {', start);
const pageData = vm.runInNewContext(source.slice(start, runtimeStart) + '\npageData');
const runtime = source.slice(runtimeStart);

class Element {
  constructor() { this.value = ''; this.textContent = ''; this.listeners = {}; this.hidden = false; this.dataset = {}; this.attributes = {}; }
  set innerHTML(value) { this.html = value; }
  get innerHTML() { return this.html ?? this.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  fire(name, event = {}) { for (const fn of this.listeners[name] || []) fn(event); }
  setAttribute(name, value) { this.attributes[name] = value; }
  querySelector() { return null; }
  focus() {}
  scrollIntoView() {}
  reset() {}
}

async function fixture(memory = new Map(), blocked = false) {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
  elements.get('sortBy').value = 'recent';
  elements.get('filterForm').reset = () => { for (const id of ['category', 'location', 'itemType', 'extra']) elements.get(id).value = ''; };
  let modalOpens = 0;
  const context = vm.createContext({
    pageData, console,
    window: {componentsReady: Promise.resolve(), OfoqPublishers: {card: () => '', forRecord: () => ({})}},
    document: {getElementById: id => elements.get(id), createElement: () => new Element()},
    localStorage: {
      getItem(key) { if (blocked) throw Error('blocked'); return memory.get(key) || null; },
      setItem(key, value) { if (blocked) throw Error('blocked'); memory.set(key, value); }
    },
    bootstrap: {Modal: {getOrCreateInstance: () => ({show() { modalOpens++; }})}},
    matchMedia: () => ({matches: true}), addEventListener() {}
  });
  vm.runInContext(runtime, context);
  await new Promise(setImmediate);
  const get = id => elements.get(id);
  const count = () => (get('itemList').innerHTML.match(/class="listing-card"/g) || []).length;
  function save(id) {
    const button = {dataset: {saveId: id}};
    get('itemList').fire('click', {target: {closest: selector => selector === 'button[data-save-id]' ? button : null}});
  }
  return {get, count, save, memory, modalOpens: () => modalOpens};
}

(async () => {
  const page = await fixture();
  assert.equal(page.count(), 4);
  const first = pageData.items[0];
  assert(page.get('itemList').innerHTML.includes('Internship/internship.html?id=' + first.id));
  assert(page.get('itemList').innerHTML.includes('project-covers/mobile.svg'));
  page.save(first.id);
  assert.equal(page.get('savedCount').textContent, 1);
  assert.equal(page.modalOpens(), 0, 'Saving must not open the application modal');
  page.get('savedShortcut').fire('click');
  assert.equal(page.count(), 1);
  assert.equal(page.get('savedOpportunities').attributes['aria-pressed'], 'true');
  page.get('searchQuery').value = 'does not exist';
  page.get('searchQuery').fire('input');
  assert.equal(page.count(), 0);
  assert.equal(page.get('emptyState').hidden, false);
  page.get('resetEmpty').fire('click');
  assert.equal(page.count(), 4);
  page.get('category').value = 'development';
  page.get('filterForm').fire('change');
  assert.equal(page.count(), 2);
  page.get('clearFilters').fire('click');
  assert.equal(page.count(), 4);
  const reload = await fixture(page.memory);
  assert.equal(reload.get('savedCount').textContent, 1);
  reload.get('savedOpportunities').fire('click');
  assert.equal(reload.count(), 1);
  reload.save(first.id);
  assert.equal(reload.count(), 0);
  assert.equal(reload.get('savedCount').textContent, 0);
  const blocked = await fixture(new Map(), true);
  blocked.save(first.id);
  assert.equal(blocked.get('savedNotice').hidden, false);
  assert.equal(blocked.get('savedCount').textContent, 1);
  const corrupt = await fixture(new Map([['ofoq-saved-internships-v1', '{invalid']]));
  assert.equal(corrupt.count(), 4);
  assert.equal(corrupt.get('savedCount').textContent, 0);
  console.log('Passed: internship cards/routes, instant search and filters, favorites toggle/count/reload, application isolation, empty states and storage fallbacks.');
})().catch(error => { console.error(error); process.exitCode = 1; });
