const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/shared-navbar.js', 'utf8');
function render(mode, query = '?theme=dark') {
  let result;
  const script = {src:'https://example.test/site/assets/shared-navbar.js',dataset:{mode},replaceWith(header){result=header;}};
  vm.runInNewContext(source,{URL,URLSearchParams,location:{search:query},document:{currentScript:script,createElement(){return {dataset:{}};}}});
  return result;
}
const site=render('site');
assert.equal((site.innerHTML.match(/data-section-link=/g)||[]).length,7);
assert.equal((site.innerHTML.match(/class="shopping-cart-link"/g)||[]).length,1);
assert.equal((site.innerHTML.match(/class="project-favorites-link"/g)||[]).length,1);
assert(site.innerHTML.includes('format=workshop&amp;') || site.innerHTML.includes('format=workshop&theme=dark'));
assert(!/\/Admin\/|\/company\//.test(site.innerHTML),'User navigation must not link to management');
assert(site.innerHTML.includes('https://example.test/site/Account/Favorites/favorites.html?theme=dark'));
const hero=render('hero');
assert.equal((hero.innerHTML.match(/data-room=/g)||[]).length,6);
assert(hero.innerHTML.includes('id="dayMode"')&&hero.innerHTML.includes('id="nightMode"'));
assert(!hero.innerHTML.includes('shopping-cart-link'));
const auth=render('auth');
assert(auth.innerHTML.includes('auth-home-link'));
assert(!auth.innerHTML.includes('header-actions')&&!auth.innerHTML.includes('section-nav'));
assert(render('site','?theme=light').innerHTML.includes('theme=light'));
console.log('Passed: shared public navbar, seven destinations, six tour anchors, nested deployment paths, theme, one cart/favorites link, auth layout and management separation.');
