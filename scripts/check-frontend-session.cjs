const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/frontend-runtime.js', 'utf8');

function visit(route = 'https://ofoq.example/Freelance/freelance.html') {
  const events = {}, frameEvents = {}, navigated = [], history = [];
  const frame = { contentWindow: {location: {replace: value => navigated.push(value)}}, addEventListener: (name, fn) => frameEvents[name] = fn };
  const window = {};
  const context = vm.createContext({
    URL, URLSearchParams, Map, window,
    location: {search: '?route=' + encodeURIComponent(route), href: 'https://ofoq.example/app.html'},
    history: {replaceState: (_, __, value) => history.push(['replace', String(value)]), pushState: (_, __, value) => history.push(['push', String(value)])},
    document: {currentScript: {src: 'https://ofoq.example/assets/frontend-runtime.js'}, documentElement: {dataset: {appShell: 'true'}}, getElementById: () => frame},
    addEventListener: (name, fn) => events[name] = fn
  });
  vm.runInContext(source, context);
  return {app: window.OfoqFrontend, frame, events, history, navigated};
}

const first = visit();
assert.equal(first.frame.src, 'https://ofoq.example/Freelance/freelance.html');
first.app.memory.setItem('cart', '["react"]');
first.app.navigate('https://ofoq.example/Academy/Cart/cart.html');
assert.equal(first.app.memory.getItem('cart'), '["react"]', 'Navigation retains the current visit');
assert.equal(first.history.at(-1)[0], 'push');
first.app.apply('project', 1, 'Project', '/Freelance/Project/project.html?id=1');
first.app.apply('project', 1, 'Project', '/Freelance/Project/project.html?id=1');
first.app.apply('job', 1, 'Job', '/Jobs/Job/job.html?id=1');
assert.equal(first.app.applications.length, 2, 'Duplicate applications are suppressed by kind and ID');
first.app.register('e1', 'Event', '/Events/Event/event.html?id=e1');
first.app.register('e1', 'Event', '/Events/Event/event.html?id=e1');
assert.equal(first.app.registrations.length, 1);
const calls = first.navigated.length;
first.app.navigate('https://another.example/steal.html');
first.app.navigate('javascript:alert(1)');
first.app.navigate('https://ofoq.example/app.html');
assert.equal(first.navigated.length, calls, 'The host accepts only local HTML pages');
const fresh = visit();
assert.equal(fresh.app.memory.getItem('cart'), null);
assert.equal(fresh.app.applications.length, 0);
assert.equal(fresh.app.registrations.length, 0);
assert.equal(fresh.app.user.signedIn, false, 'Refresh or a new tab starts a fresh session');
assert.equal(visit('https://another.example/page.html').frame.src, 'https://ofoq.example/hero/userHero.html');

for (const folder of ['Account', 'Academy', 'Auth', 'Events', 'Freelance', 'Internships', 'Jobs', 'assets', 'Admin', 'company']) walk(folder);
function walk(folder) {
  for (const entry of fs.readdirSync(folder, {withFileTypes:true})) {
    const path = folder + '/' + entry.name;
    if (entry.isDirectory()) { walk(path); continue; }
    const content = fs.readFileSync(path, 'utf8');
    if (path.endsWith('.js')) assert(!/\b(?:localStorage|sessionStorage|indexedDB)\b|document\.cookie/.test(content), path + ': must not persist data');
    if (path.endsWith('.html')) {
      assert(content.includes('assets/frontend-runtime.js'), path + ': must share the visit runtime');
      if (!['Admin','company'].includes(folder)) assert(!/href=["'][^"']*\/(?:Admin|company)\//i.test(content), path + ': user UI links to management');
    }
  }
}
assert(!fs.readFileSync('hero/userHero.html','utf8').includes('../Admin/'));
console.log('Passed: tab-local memory, cross-page session, fresh visit reset, duplicate prevention, safe routes, zero persistence and user/management navigation separation.');
