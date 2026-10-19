const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../revamp-new-carousel.html'), 'utf8');
const start = html.indexOf('// 여러 section의 호출 진입점.');
const end = html.indexOf('})(window, document);', start) + '})(window, document);'.length;
let creates = 0, inits = 0, warnings = 0;
const boxes = [];
const roots = [true, false].map((fails, i) => {
  const target = {id: 'media' + i};
  const box = {querySelector: () => target, getAttribute: name => ({
    'data-video-src-pc': 'source' + i, 'data-video-type': 'video',
    'data-video-autoplay': 'true', 'data-video-loop': 'false'
  })[name] || ''};
  boxes.push(box);
  return {
    nodeType: 1, isConnected: true, __ncSectionIdentity: true, id: 'section' + i,
    classList: {contains: name => name === 'cmpnt-new-carousel'},
    querySelector: () => ({}), querySelectorAll: () => [box], fails
  };
});
const document = {readyState: 'complete', body: {}, querySelectorAll: () => roots,
  getElementById: id => boxes.map(b => b.querySelector()).find(t => t.id === id)};
const window = {
  Swiper() {}, NewCarouselSetup: {common() {}, video() {}}, addEventListener() {},
  console: {warn() { warnings++; }},
  kvVideoPlayer: {create(pc, mo, id, type, auto, loop) {
    creates++;
    assert.equal(type, 'video'); assert.equal(auto, true); assert.equal(loop, false);
    if (id === 'media0') throw new Error('SDK failed after mutating its target');
    // SDK may replace the target; no success marker survives on this original node.
    boxes[1].querySelector = () => ({id});
  }},
  initComponentSwiper() { inits++; return {destroyed: false}; },
  refreshComponentSwiper() {}
};
vm.runInNewContext(html.slice(start, end), {window, document});
window.NewCarouselSetup.init();
window.NewCarouselSetup.init();
assert.equal(creates, 2, 'neither replaced nor failed targets are recreated on rescans');
assert.equal(inits, 2, 'each section gets one instance even after SDK failure');
assert.equal(warnings, 1, 'failed SDK creation is reported once');
assert.equal(boxes[0].__ncVideoCreated, 'failed');
assert.equal(boxes[1].__ncVideoCreated, true);
console.log('PASS SDK target replacement, bounded failure and independent section initialization');
