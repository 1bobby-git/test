/* 검토 환경 전용: 원래 이미지 비율로 영상 공간을 확보한다.
 * 원본 영상 URL/자동재생/미리보기 상태는 바꾸지 않는다.
 * MP4 kdp_dev 주소가 외부에서 403이면 운영 원본 재생 검증은 별도로 필요하다. */
(function (win, doc) {
    'use strict';
    if (win.__previewMediaCompatLoaded) return;
    win.__previewMediaCompatLoaded = true;
    var roots = [], queued = false;
    function sync() {
        queued = false;
        for (var i = roots.length - 1; i >= 0; i--) {
            var state = roots[i];
            if (!doc.documentElement.contains(state.root)) {
                state.observer.disconnect();
                state.root.removeEventListener('load', schedule, true);
                state.root.removeEventListener('loadedmetadata', schedule, true);
                roots.splice(i, 1);
                continue;
            }
            if (state.root.getAttribute('data-preview-media-compat') !== 'on') continue;
            var visuals = state.root.querySelectorAll('.visual-area:has(.kvVideo)');
            for (var j = 0; j < visuals.length; j++) {
                var visual = visuals[j], img = visual.querySelector('.previewImg img');
                var video = visual.querySelector('video'), ratio = 0;
                if (img && !/img_baseimg_null\./.test(img.currentSrc || img.src) && img.naturalWidth && img.naturalHeight) ratio = img.naturalWidth / img.naturalHeight;
                if (!ratio && video && video.videoWidth && video.videoHeight) ratio = video.videoWidth / video.videoHeight;
                var value = String(ratio || 16 / 9);
                if (visual.style.getPropertyValue('--preview-media-ratio') !== value) visual.style.setProperty('--preview-media-ratio', value);
            }
        }
    }
    function schedule() {
        if (queued) return;
        queued = true;
        win.requestAnimationFrame(sync);
    }
    function boot() {
        var list = doc.querySelectorAll('[data-preview-media-compat="on"]');
        for (var i = 0; i < list.length; i++) {
            var root = list[i];
            if (root.__previewMediaCompat) continue;
            root.__previewMediaCompat = true;
            var observer = new MutationObserver(function (records) {
                for (var k = 0; k < records.length; k++) {
                    var target = records[k].target;
                    if (target.nodeType === 1 && (target.closest('.kvVideo') || target.querySelector('.kvVideo'))) { schedule(); break; }
                }
            });
            observer.observe(root, { childList: true, subtree: true });
            root.addEventListener('load', schedule, true);
            root.addEventListener('loadedmetadata', schedule, true);
            roots.push({root:root, observer:observer});
        }
        schedule();
    }
    function ready() {
        boot();
        // BO가 section 전체를 Ajax로 교체할 때에만 새 root를 연결한다.
        var observer = new MutationObserver(function (records) {
            for (var i = 0; i < records.length; i++) {
                var nodes = records[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                    if (nodes[j].nodeType === 1 && (nodes[j].matches('[data-preview-media-compat="on"]') || nodes[j].querySelector('[data-preview-media-compat="on"]'))) { boot(); return; }
                }
                if (records[i].removedNodes.length) schedule();
            }
        });
        observer.observe(doc.body, {childList:true, subtree:true});
    }
    win.addEventListener('resize', schedule, false);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ready, false); else ready();
})(window, document);
