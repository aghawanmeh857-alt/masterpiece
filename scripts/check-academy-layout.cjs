const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('Academy/academy.html', 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const root = {tag: 'document', children: []};
const stack = [root];
const nodes = [];

for (const match of html.matchAll(/<(\/?)([a-z][\w:-]*)\b([^>]*)>/gi)) {
  const [, closing, rawTag, attributes] = match;
  const tag = rawTag.toLowerCase();
  if (closing) {
    assert.equal(stack.at(-1).tag, tag, `Mismatched </${tag}> near offset ${match.index}; found <${stack.at(-1).tag}> still open`);
    stack.pop();
  } else {
    const node = {
      tag,
      id: attributes.match(/\bid="([^"]+)"/)?.[1],
      classes: attributes.match(/\bclass="([^"]+)"/)?.[1].split(/\s+/) || [],
      parent: stack.at(-1), children: []
    };
    stack.at(-1).children.push(node);
    nodes.push(node);
    if (!voidTags.has(tag) && !attributes.trimEnd().endsWith('/')) stack.push(node);
  }
}
assert.equal(stack.length, 1, 'All HTML elements must close');
const byId = id => nodes.find(node => node.id === id);
const byClass = name => nodes.find(node => node.classes.includes(name));
const main = byId('mainContent');
for (const name of ['page-heading', 'featured-path', 'academy-stats', 'learning-tabs']) {
  assert.equal(byClass(name)?.parent, main, `${name} must be a direct child of main`);
}
for (const id of ['academyOverview', 'catalogWorkspace']) {
  assert.equal(byId(id)?.parent, main, `${id} must sit outside the heading row`);
}
assert.equal(byId('academyCartButton').parent.classes.includes('featured-shortcuts'), true);
assert.equal(byId('featuredWishlist').parent, byId('academyCartButton').parent);
assert.equal(byId('academyCartButton').parent.parent.classes.includes('featured-copy'), true);
assert.equal(byClass('academy-heading-actions').parent, byClass('page-heading'));
assert.equal(byId('courseList').parent.classes.includes('results'), true);
console.log('Passed: balanced academy HTML, independent heading/hero/tabs/content sections, and correctly nested cart button and course grid.');
