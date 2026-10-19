const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ids = ['newCarouselCommonScript', 'newCarouselVideoScript', 'newCarouselInitScript'];
let shared;
for (const file of ['revamp-new-carousel.html', 'revamp-new-column.html', 'revamp-new-benefit-card.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  let previous = -1;
  const blocks = ids.map(id => {
    const matches = [...html.matchAll(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>', 'g'))];
    assert.equal(matches.length, 1, file + ': one ' + id);
    assert.ok(matches[0].index > previous, file + ': script order');
    previous = matches[0].index;
    new vm.Script(matches[0][1], {filename: file + ':' + id});
    return matches[0][1];
  });
  if (shared) assert.deepEqual(blocks.slice(0, 2), shared, file + ': identical shared scripts');
  else shared = blocks.slice(0, 2);
  assert.ok(!html.includes('preview-media-compat'), file + ': no preview-only dependency');
  assert.ok(!/<script[^>]+src=["'][^"']*\/(?:common|video)\.js/.test(html), file + ': inline shared scripts');
  console.log('PASS ' + file + ': syntax, order and shared-script invariants');
}
console.log('9 script blocks parsed; 3 templates passed');
