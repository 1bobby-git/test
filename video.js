/* MP4 / YouTube / Brightcove 공통. common.js 다음에 로드한다.
 * 플레이어 생성은 각 HTML의 호출 스크립트에서 수행한다. */
(function () {
    'use strict';
    if (window.__newComponentVideoLoaded) return;
    window.__newComponentVideoLoaded = true;
// 영상 공통 스크립트
(function (win, doc) {
    'use strict';

    var kvSwipers = win.kvSwipers || [];
    win.kvSwipers = kvSwipers;

    function mediaNodes(target, selector) {
        var nodes = Array.prototype.slice.call(target.querySelectorAll(selector));
        if (matches(target, selector)) nodes.unshift(target);
        return nodes;
    }

    function matches(el, selector) {
        var fn;

        if (!el || el.nodeType !== 1) {
            return false;
        }

        fn = Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

        if (!fn) {
            return false;
        }

        return fn.call(el, selector);
    }

    function closest(el, selector) {
        while (el && el.nodeType === 1) {
            if (matches(el, selector)) {
                return el;
            }

            el = el.parentElement;
        }

        return null;
    }

    function getRoot(container) {
        if (!container) {
            return null;
        }

        if (typeof container !== 'string') {
            return container.nodeType === 1 ? container : null;
        }

        if (container.charAt(0) !== '#' && container.charAt(0) !== '.') {
            container = '#' + container;
        }

        return doc.querySelector(container);
    }

    function hasKvVideo(swiper, root) {
        if (swiper && swiper.el && swiper.el.querySelector('.kvItem .kvVideo .target[id]')) {
            return true;
        }

        return Boolean(root && root.querySelector && root.querySelector('.kvItem .kvVideo .target[id]'));
    }

    function getRealSlides(swiper) {
        if (!swiper || !swiper.el || !swiper.el.querySelectorAll) {
            return [];
        }

        return Array.prototype.slice.call(
            swiper.el.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)')
        );
    }

    function getActiveRealSlide(swiper) {
        var activeSlide;
        var realSlides;
        var realIndex;
        var i;

        if (!swiper || !swiper.slides || typeof swiper.activeIndex === 'undefined') {
            return null;
        }

        activeSlide = swiper.slides[swiper.activeIndex];

        if (!activeSlide) {
            return null;
        }

        if (!activeSlide.classList.contains('swiper-slide-duplicate')) {
            return activeSlide;
        }

        if (swiper.slideToLoop && typeof swiper.realIndex !== 'undefined') {
            swiper.slideToLoop(swiper.realIndex, 0, false);
        }

        realSlides = getRealSlides(swiper);
        realIndex = String(swiper.realIndex);

        for (i = 0; i < realSlides.length; i += 1) {
            if (realSlides[i].getAttribute('data-swiper-slide-index') === realIndex) {
                return realSlides[i];
            }
        }

        return realSlides[swiper.realIndex] || null;
    }

    function getTarget(slide) {
        if (!slide || !slide.querySelector) {
            return null;
        }

        return slide.querySelector('.kvVideo .target[id]');
    }

    function getVodIdByTarget(target) {
        if (!target) {
            return '';
        }

        return target.getAttribute('id') || '';
    }

    function getItem(vodId) {
        if (!vodId || !win.kvVideoPlayer || !win.kvVideoPlayer.obj) {
            return null;
        }

        return win.kvVideoPlayer.obj[vodId] || null;
    }

    function isAuto(vodId) {
        var item = getItem(vodId);

        if (!item) {
            return false;
        }

        return item.auto === true || item.auto === 'true';
    }

    function postYoutube(iframe, command) {
        var message;

        if (!iframe || !iframe.contentWindow || !iframe.src) {
            return;
        }

        if (iframe.src.indexOf('youtube.com') === -1 && iframe.src.indexOf('youtube-nocookie.com') === -1) {
            return;
        }

        message = JSON.stringify({
            event: 'command',
            func: command,
            args: ''
        });

        try {
            iframe.contentWindow.postMessage(message, '*');
        } catch (e) { }
    }

    function hardStopYoutube(iframe) {
        var src;

        if (!iframe || !iframe.src) {
            return;
        }

        if (iframe.src.indexOf('youtube.com') === -1 && iframe.src.indexOf('youtube-nocookie.com') === -1) {
            return;
        }

        postYoutube(iframe, 'pauseVideo');
        postYoutube(iframe, 'stopVideo');

        src = iframe.getAttribute('src') || iframe.src;

        if (!src) {
            return;
        }

        src = src.replace(/([?&])autoplay=1/g, '$1autoplay=0');

        if (src.indexOf('autoplay=') === -1) {
            src += src.indexOf('?') > -1 ? '&autoplay=0' : '?autoplay=0';
        }

        /*
            YouTube는 postMessage만으로 멈추지 않는 케이스가 있어
            src를 autoplay=0 상태로 다시 세팅해 확실히 정지시킨다.
            Brightcove에는 이 처리를 하지 않는다.
        */
        try {
            iframe.setAttribute('src', src);
        } catch (e) { }
    }

    function stopDomMedia(target) {
        var videos;
        var iframes;
        var players;
        var i;
        var player;

        if (!target || !target.querySelectorAll) {
            return;
        }

        videos = mediaNodes(target, 'video');

        for (i = 0; i < videos.length; i += 1) {
            try {
                videos[i].pause();
                videos[i].currentTime = 0;
            } catch (e) { }
        }

        iframes = mediaNodes(target, 'iframe');

        for (i = 0; i < iframes.length; i += 1) {
            hardStopYoutube(iframes[i]);
        }

        if (win.videojs) {
            players = mediaNodes(target, '.video-js, video-js');

            for (i = 0; i < players.length; i += 1) {
                player = null;

                try {
                    if (players[i].id && win.videojs.getPlayer) {
                        player = win.videojs.getPlayer(players[i].id);
                    } else if (players[i].id && win.videojs.players) {
                        player = win.videojs.players[players[i].id];
                    }

                    if (player && player.pause) {
                        player.pause();
                    }

                    if (player && player.currentTime) {
                        player.currentTime(0);
                    }
                } catch (e2) { }
            }
        }
    }

    function setPreviewHidden(target, hidden) {
        var slide;
        var preview;

        if (!target) {
            return;
        }

        slide = closest(target, '.kvItem.swiper-slide');

        if (!slide) {
            return;
        }

        preview = slide.querySelector('.kvVideo .previewBox');

        if (!preview) {
            return;
        }

        preview.style.visibility = hidden ? 'hidden' : '';
        preview.style.opacity = hidden ? '0' : '';
        preview.style.pointerEvents = hidden ? 'none' : '';
        preview.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    }

    function setPlayingClass(target, playing) {
        var slide;
        var videoBox;

        if (!target) {
            return;
        }

        slide = closest(target, '.kvItem.swiper-slide');
        videoBox = closest(target, '.kvVideo');

        if (playing) {
            if (slide) {
                slide.classList.add('is-kv-playing');
                slide.classList.add('is-video-playing');
            }

            if (videoBox) {
                videoBox.classList.add('is-video-ready');
                videoBox.classList.add('is-video-playing');
            }

            return;
        }

        if (slide) {
            slide.classList.remove('is-kv-playing');
            slide.classList.remove('is-video-playing');
        }

        if (videoBox) {
            videoBox.classList.remove('is-video-playing');
        }
    }

    function repairBrightcoveVisible(target) {
        var nodes;
        var posters;
        var i;

        if (!target || !target.querySelectorAll) {
            return;
        }

        nodes = mediaNodes(target, 'video, iframe, .video-js, video-js, .vjs-tech, .bc-player-default_default, .bc-player-default_default video');

        for (i = 0; i < nodes.length; i += 1) {
            nodes[i].style.visibility = 'visible';
            nodes[i].style.opacity = '1';
            nodes[i].style.pointerEvents = 'auto';
        }

        posters = target.querySelectorAll('.vjs-poster, .vjs-big-play-button');

        for (i = 0; i < posters.length; i += 1) {
            posters[i].style.display = 'none';
            posters[i].style.visibility = 'hidden';
            posters[i].style.opacity = '0';
            posters[i].style.pointerEvents = 'none';
        }
    }

    function stopVod(vodId, target) {
        if (target) target.__ncPlayVersion = (target.__ncPlayVersion || 0) + 1;
        var item = getItem(vodId);

        if (item && item.videoBtn && item.videoBtn.classList) {
            item.videoBtn.classList.remove('play', 'pause');
            item.videoBtn.classList.add('pause');
        }

        if (win.kvVideoPlayer && typeof win.kvVideoPlayer.videoStop === 'function' && vodId) {
            try {
                win.kvVideoPlayer.videoStop(vodId, true);
            } catch (e) { }
        }

        if (win.kvVideoPlayer && typeof win.kvVideoPlayer.showPreview === 'function' && vodId) {
            try {
                win.kvVideoPlayer.showPreview(vodId);
            } catch (e2) { }
        }

        stopDomMedia(target);
        setPreviewHidden(target, false);
        setPlayingClass(target, false);
    }

    function playVod(vodId, target) {
        var version = target && target.__ncPlayVersion;
        function valid() {
            var slide = target && closest(target, '.swiper-slide');
            return target && target.__ncPlayVersion === version && doc.documentElement.contains(target) &&
                slide && slide.classList.contains('swiper-slide-active');
        }
        if (!valid()) return;
        var item = getItem(vodId);

        if (!item || !win.kvVideoPlayer) {
            return;
        }

        if (item.videoBtn && item.videoBtn.classList) {
            item.videoBtn.classList.remove('play', 'pause');
            item.videoBtn.classList.add('play');
        }

        if (typeof win.kvVideoPlayer.videoPlay === 'function') {
            try {
                win.kvVideoPlayer.videoPlay(vodId);
            } catch (e) { }
        }

        if (typeof win.kvVideoPlayer.hidePreview === 'function') {
            try {
                win.kvVideoPlayer.hidePreview(vodId);
            } catch (e2) { }
        }

        setPreviewHidden(target, true);
        setPlayingClass(target, true);
        repairBrightcoveVisible(target);

        setTimeout(function () {
            if (valid()) repairBrightcoveVisible(target);
        }, 120);

        setTimeout(function () {
            if (valid()) repairBrightcoveVisible(target);
        }, 400);
    }

    function stopAllVideos(swiper) {
        stopOtherVideos(swiper, null);
    }

    function stopOtherVideos(swiper, activeTarget) {
        var targets;
        var i;
        var target;
        var vodId;

        if (!swiper || !swiper.el || !swiper.el.querySelectorAll) {
            return;
        }

        targets = swiper.el.querySelectorAll('.kvVideo .target[id]');

        for (i = 0; i < targets.length; i += 1) {
            target = targets[i];

            if (activeTarget && target === activeTarget) {
                continue;
            }

            vodId = getVodIdByTarget(target);

            if (vodId) {
                stopVod(vodId, target);
            }
        }
    }

    function resetActiveVideo(swiper) {
        var activeSlide;
        var activeTarget;
        var activeVodId;

        if (!win.kvVideoPlayer || !win.kvVideoPlayer.obj) {
            return;
        }

        activeSlide = getActiveRealSlide(swiper);

        if (!activeSlide) {
            stopAllVideos(swiper);
            return;
        }

        activeTarget = getTarget(activeSlide);
        activeVodId = getVodIdByTarget(activeTarget);

        if (!activeVodId) {
            stopAllVideos(swiper);
            return;
        }

        stopOtherVideos(swiper, activeTarget);

        if (isAuto(activeVodId)) {
            var version = activeTarget.__ncPlayVersion = (activeTarget.__ncPlayVersion || 0) + 1;
            function playIfActive() {
                if (swiper.destroyed || !doc.documentElement.contains(activeTarget) ||
                    getActiveRealSlide(swiper) !== activeSlide || activeTarget.__ncPlayVersion !== version) return;
                playVod(activeVodId, activeTarget);
            }
            setTimeout(playIfActive, 30);
            setTimeout(playIfActive, 300);

            return;
        }

        stopVod(activeVodId, activeTarget);
    }

    function disableFocus(slide) {
        var items;
        var i;
        var item;
        var oldValue;

        if (!slide || !slide.querySelectorAll) {
            return;
        }

        items = slide.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, video[controls], [tabindex]:not([tabindex="-1"])'
        );

        for (i = 0; i < items.length; i += 1) {
            item = items[i];

            if (item.hasAttribute('data-kv-old-tabindex')) {
                continue;
            }

            oldValue = item.hasAttribute('tabindex') ? item.getAttribute('tabindex') : '';
            item.setAttribute('data-kv-old-tabindex', oldValue);
            item.setAttribute('tabindex', '-1');
        }
    }

    function restoreFocus(slide) {
        var items;
        var i;
        var item;
        var oldValue;

        if (!slide || !slide.querySelectorAll) {
            return;
        }

        items = slide.querySelectorAll('[data-kv-old-tabindex]');

        for (i = 0; i < items.length; i += 1) {
            item = items[i];
            oldValue = item.getAttribute('data-kv-old-tabindex');

            if (oldValue === '') {
                item.removeAttribute('tabindex');
            } else {
                item.setAttribute('tabindex', oldValue);
            }

            item.removeAttribute('data-kv-old-tabindex');
        }
    }

    function syncSlideA11y(swiper) {
        var slides;
        var i;
        var slide;
        var active;

        if (!swiper || !swiper.slides) {
            return;
        }

        slides = swiper.slides;

        for (i = 0; i < slides.length; i += 1) {
            slide = slides[i];

            if (!matches(slide, '.kvItem.swiper-slide')) {
                continue;
            }

            active = slide.classList.contains('swiper-slide-active') ||
                slide.classList.contains('swiper-slide-duplicate-active');

            if (active) {
                slide.setAttribute('aria-hidden', 'false');
                restoreFocus(slide);
            } else {
                slide.setAttribute('aria-hidden', 'true');
                disableFocus(slide);
            }
        }
    }

    function setVisible(el, visible) {
        if (!el) {
            return;
        }

        el.style.display = visible ? '' : 'none';
        el.setAttribute('aria-hidden', visible ? 'false' : 'true');
        el.setAttribute('tabindex', visible ? '0' : '-1');

        if ('disabled' in el) {
            el.disabled = !visible;
        }

        el.setAttribute('aria-disabled', visible ? 'false' : 'true');
    }

    function syncControls(root, swiper, options) {
        var realSlideCount;
        var pageArea;
        var ctrlArea;
        var playBtn;
        var stopBtn;
        var kvAutoplay;

        if (!root || !swiper || !hasKvVideo(swiper, root)) {
            return;
        }

        realSlideCount = getRealSlides(swiper).length;
        pageArea = root.querySelector('.page-area');
        ctrlArea = root.querySelector('.ctrl-area');
        playBtn = root.querySelector('.swiper-button-play');
        stopBtn = root.querySelector('.swiper-button-stop');
        kvAutoplay = !(options && options.autoplay === false);

        if (realSlideCount <= 1) {
            if (pageArea) {
                pageArea.style.display = 'none';
                pageArea.setAttribute('aria-hidden', 'true');
            }

            if (ctrlArea) {
                ctrlArea.style.display = 'none';
                ctrlArea.setAttribute('aria-hidden', 'true');
            }

            swiper.allowTouchMove = false;

            if (swiper.autoplay) {
                swiper.autoplay.stop();
            }

            return;
        }

        if (pageArea) {
            pageArea.style.display = '';
            pageArea.setAttribute('aria-hidden', 'false');
        }

        if (ctrlArea) {
            ctrlArea.style.display = '';
            ctrlArea.setAttribute('aria-hidden', 'false');
        }

        swiper.allowTouchMove = true;

        if (kvAutoplay) {
            if (swiper.autoplay) {
                swiper.autoplay.start();
            }

            setVisible(stopBtn, false);
            setVisible(playBtn, true);
        } else {
            if (swiper.autoplay) {
                swiper.autoplay.stop();
            }

            setVisible(playBtn, false);
            setVisible(stopBtn, true);
        }
    }

    function bindKvSwiper(swiper, root, options) {
        function stopAndSync() {
            // 같은 전환에서 발생하는 여러 이벤트의 정지 처리는 한 번만 수행한다.
            if (swiper.__kvStoppingIndex === swiper.activeIndex) return;
            swiper.__kvStoppingIndex = swiper.activeIndex;
            clearTimeout(swiper.__kvStopTask);
            swiper.__kvStopTask = setTimeout(function () { delete swiper.__kvStoppingIndex; }, 0);
            stopAllVideos(swiper);
            syncSlideA11y(swiper);
        }

        function queueActiveReset() {
            clearTimeout(swiper.__kvResetTimer);
            swiper.__kvResetTimer = setTimeout(function () {
                if (swiper.destroyed || !doc.documentElement.contains(root)) return;
                syncSlideA11y(swiper);
                resetActiveVideo(swiper);
            }, 200);
        }

        if (!swiper || !root || !hasKvVideo(swiper, root)) {
            return swiper;
        }

        swiper.__kvOptions = options || swiper.__kvOptions || {};

        if (kvSwipers.indexOf(swiper) === -1) {
            kvSwipers.push(swiper);
        }

        if (swiper.__kvStopBound === true) {
            syncSlideA11y(swiper);
            syncControls(root, swiper, swiper.__kvOptions);
            queueActiveReset();
            return swiper;
        }

        swiper.on('slideChangeTransitionStart', stopAndSync);

        swiper.on('transitionStart', stopAndSync);

        swiper.on('slideChange', stopAndSync);

        swiper.on('slideChangeTransitionEnd', queueActiveReset);

        swiper.on('transitionEnd', queueActiveReset);

        swiper.__kvStopBound = true;
        clearTimeout(root.__kvActiveVideoTimer);
        swiper.on('destroy', function cleanup() {
            stopAllVideos(swiper);
            clearTimeout(swiper.__kvResetTimer);
            clearTimeout(swiper.__kvStopTask);
            clearTimeout(root.__kvActiveVideoTimer);
            ['slideChangeTransitionStart', 'transitionStart', 'slideChange'].forEach(function (name) { swiper.off(name, stopAndSync); });
            ['slideChangeTransitionEnd', 'transitionEnd'].forEach(function (name) { swiper.off(name, queueActiveReset); });
            var index = kvSwipers.indexOf(swiper);
            if (index >= 0) kvSwipers.splice(index, 1);
        });

        syncControls(root, swiper, swiper.__kvOptions);
        syncSlideA11y(swiper);

        queueActiveReset();

        return swiper;
    }

    function patchComponentSwiper() {
        var originalInit;
        var originalRefresh;

        if (typeof win.initComponentSwiper === 'function' && win.initComponentSwiper.__kvStopPatched !== true) {
            originalInit = win.initComponentSwiper;

            win.initComponentSwiper = function (container, options) {
                var swiper = originalInit.apply(win, arguments);
                var root = getRoot(container);

                bindKvSwiper(swiper, root, options);

                return swiper;
            };

            win.initComponentSwiper.__kvStopPatched = true;
            win.initComponentSwiper.__kvStopOriginal = originalInit;
        }

        if (typeof win.refreshComponentSwiper === 'function' && win.refreshComponentSwiper.__kvStopPatched !== true) {
            originalRefresh = win.refreshComponentSwiper;

            win.refreshComponentSwiper = function (container) {
                var swiper = originalRefresh.apply(win, arguments);
                var root = getRoot(container);

                bindKvSwiper(swiper, root, swiper && swiper.__kvOptions);

                return swiper;
            };

            win.refreshComponentSwiper.__kvStopPatched = true;
            win.refreshComponentSwiper.__kvStopOriginal = originalRefresh;
        }
    }

    function bindExisting() {
        var list = doc.querySelectorAll('.swiper-container');
        var i;
        var swiperEl;
        var root;

        for (i = 0; i < list.length; i += 1) {
            swiperEl = list[i];

            if (!swiperEl.swiper || !swiperEl.querySelector('.kvItem .kvVideo .target[id]')) {
                continue;
            }

            root = closest(swiperEl, '.rvmp-cmpnt[class*="cmpnt-new-"]');
            if (!root) continue;

            bindKvSwiper(swiperEl.swiper, root, swiperEl.swiper.__kvOptions);
        }
    }

    function ready() {
        patchComponentSwiper();
        bindExisting();

        setTimeout(function () {
            patchComponentSwiper();
            bindExisting();
        }, 100);

        setTimeout(function () {
            patchComponentSwiper();
            bindExisting();
        }, 300);
    }

    win.KvVideoStopper = {
        bind: bindKvSwiper,
        stopAll: stopAllVideos,
        reset: resetActiveVideo
    };

    win.KvSlideBridge = {
        sync: function (context, swiper) {
            if (swiper) {
                syncSlideA11y(swiper);
            }
        },
        pause: function (context) {
            var swiperEl;

            if (!context || !context.querySelector) {
                return;
            }

            swiperEl = context.querySelector('.swiper-container');

            if (swiperEl && swiperEl.swiper) {
                stopAllVideos(swiperEl.swiper);
            }
        }
    };

    if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', ready, false);
    } else {
        ready();
    }
})(window, document);
// 영상 확장: 기존 MP4, YouTube, Brightcove 인스턴스의 재생·중지.
window.NewCarouselSetup.video = function () {
    if (window.NewCarouselSetup.videoReady) return;
    window.NewCarouselSetup.videoReady = true;

    (function (win, doc) {
        'use strict';
        if (win.__newCarouselManualPlayBound) return;
        win.__newCarouselManualPlayBound = true;

        function closest(node, selector) {
            while (node && node.nodeType === 1) {
                var match = node.matches || node.msMatchesSelector || node.webkitMatchesSelector;
                if (match && match.call(node, selector)) return node;
                node = node.parentElement;
            }
            return null;
        }
        function element(value) {
            return value && (value.nodeType === 1 ? value : value[0]);
        }
        function findItem(api, visual, button) {
            var target = visual.querySelector('.kvVideo .target[id]');
            var id = target && target.id;
            var items = api && api.obj;
            if (!items) return null;
            if (id && items[id]) return { id: id, item: items[id] };
            // SDK가 target을 교체한 경우에도 기존 버튼 참조로 찾는다.
            var keys = Object.keys(items);
            for (var i = 0; i < keys.length; i += 1) {
                var item = items[keys[i]];
                if (item && element(item.videoBtn) === button) return { id: keys[i], item: item };
            }
            return null;
        }
        function log(level, message, id, error) {
            if (!win.console || !win.console[level]) return;
            win.console[level]('[NewCarousel] ' + message, id || '', error || '');
        }
        function playButton(button, playing) {
            if (!button || !button.classList) return;
            button.classList.toggle('play', playing);
            button.classList.toggle('pause', !playing);
        }
        function showState(visual, playing) {
            var slide = closest(visual, '.kvItem.swiper-slide');
            var box = visual.querySelector('.kvVideo');
            var preview = box && box.querySelector('.previewBox');
            if (slide) {
                slide.classList.toggle('is-kv-playing', playing);
                slide.classList.toggle('is-video-playing', playing);
            }
            if (box) {
                if (playing) box.classList.add('is-video-ready');
                box.classList.toggle('is-video-playing', playing);
            }
            if (preview) {
                preview.style.visibility = playing ? 'hidden' : '';
                preview.style.opacity = playing ? '0' : '';
                preview.style.pointerEvents = playing ? 'none' : '';
                preview.setAttribute('aria-hidden', playing ? 'true' : 'false');
            }
        }
        function revealPlayer(visual, button) {
            // 원본 playVod의 표시 보정. 종료·슬라이드 이동 뒤에는 실행하지 않는다.
            var slide = closest(visual, '.kvItem.swiper-slide');
            if (!button.classList.contains('play') || !slide || !slide.classList.contains('swiper-slide-active')) return;
            var target = visual.querySelector('.kvVideo .target[id]');
            if (!target) return;
            var selector = 'video, iframe, .video-js, video-js, .vjs-tech, .bc-player-default_default';
            var nodes = Array.prototype.slice.call(target.querySelectorAll(selector));
            if (target.matches(selector)) nodes.unshift(target);
            for (var i = 0; i < nodes.length; i += 1) {
                nodes[i].style.visibility = 'visible';
                nodes[i].style.opacity = '1';
                nodes[i].style.pointerEvents = 'auto';
            }
            var posters = target.querySelectorAll('.vjs-poster, .vjs-big-play-button');
            for (var j = 0; j < posters.length; j += 1) {
                posters[j].style.display = 'none';
                posters[j].style.visibility = 'hidden';
                posters[j].style.opacity = '0';
                posters[j].style.pointerEvents = 'none';
            }
        }
        function isBrightcove(item, visual) {
            var type = String(item.type || item.videoType || '').toLowerCase();
            return type === 'bc' || type === 'brightcove' ||
                !!visual.querySelector('.kvVideo video-js, .kvVideo .video-js, .kvVideo [data-account]');
        }
        function brightcovePlayer(visual) {
            var videojs = win.videojs;
            if (!videojs) return null;
            var nodes = visual.querySelectorAll('.kvVideo .target[id], .kvVideo video-js[id], .kvVideo .video-js[id]');
            for (var i = 0; i < nodes.length; i += 1) {
                var player = null;
                try {
                    player = typeof videojs.getPlayer === 'function' ? videojs.getPlayer(nodes[i].id) :
                        videojs.players && videojs.players[nodes[i].id];
                } catch (ignore) { }
                if (!player || (player.isDisposed && player.isDisposed())) continue;
                var node = typeof player.el === 'function' ? player.el() : null;
                if (node && visual.contains(node) && typeof player.play === 'function' && typeof player.pause === 'function') return player;
            }
            return null;
        }
        function brightcoveClick(api, found, visual, button, root) {
            var previous = visual.__ncBrightcoveRequest;
            var auto = found.item.auto === true || found.item.auto === 'true';
            var playing = !(button.classList.contains('play') || (previous && previous.pending));
            // Auto ON은 버튼 표시보다 실제 플레이어 상태를 우선한다.
            var currentPlayer = auto && brightcovePlayer(visual);
            if (currentPlayer && typeof currentPlayer.paused === 'function') {
                try { playing = currentPlayer.paused() && !(previous && previous.pending); } catch (ignore) { }
            }
            if (previous) previous.dispose();
            var request = { pending: playing, desired: playing, player: null, ready: false, issued: false, disposed: false, departed: false };
            visual.__ncBrightcoveRequest = request;
            var originalButton = element(found.item.videoBtn);
            var box = closest(visual, '.swiper-container');

            if (box && closest(box, '.rvmp-cmpnt[class*="cmpnt-new-"]') !== root) {
                box = null;
            }
            var swiper = box && box.swiper;
            var timer = null, timeout = null, observer = null;
            var handlers = [];
            if (swiper) win.clearTimeout(swiper.__kvResetTimer);
            win.clearTimeout(root.__kvActiveVideoTimer);

            function valid() { return !request.disposed && visual.__ncBrightcoveRequest === request && doc.documentElement.contains(visual); }
            function active() {
                var slide = closest(visual, '.kvItem.swiper-slide');
                return !!slide && (!swiper || (!swiper.destroyed && swiper.slides && swiper.slides[swiper.activeIndex] === slide));
            }
            function clearWaiting() {
                win.clearTimeout(timer); timer = null;
                win.clearTimeout(timeout); timeout = null;
                if (observer) { observer.disconnect(); observer = null; }
            }
            function display(value) {
                playButton(button, value);
                if (originalButton !== button) playButton(originalButton, value);
                var preview = visual.querySelector('.kvVideo .previewBox');
                var style = preview && win.getComputedStyle(preview);
                var hidden = !!style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0');
                var method = value ? 'hidePreview' : 'showPreview';
                if (hidden !== value && typeof api[method] === 'function') {
                    try { api[method](found.id); } catch (error) { log('warn', 'Brightcove 미리보기 처리 실패', found.id, error); }
                }
                showState(visual, value);
                if (value) revealPlayer(visual, button);
            }
            function pausePlayer() {
                var player = request.player;
                if (!player || (player.isDisposed && player.isDisposed())) return;
                if (!player.paused || !player.paused()) player.pause();
                if (typeof player.currentTime === 'function' && (!player.readyState || player.readyState() > 0) &&
                    player.currentTime() !== 0) player.currentTime(0);
            }
            function fail(error) {
                if (!valid()) return;
                request.desired = false;
                request.pending = false;
                clearWaiting();
                try { pausePlayer(); } catch (ignore) { }
                display(false);
                log('error', 'Brightcove 재생 실패', found.id, error);
            }
            function playingEvent() {
                if (!valid()) return;
                if (!active() || request.desired === false) {
                    try { pausePlayer(); } catch (error) { log('warn', 'Brightcove 지연 재생 취소 실패', found.id, error); }
                    if (auto) schedule();
                    return;
                }
                request.pending = false;
                request.issued = true;
                clearWaiting();
                display(true);
            }
            function stopEvent() {
                // 플레이어 내부의 일시정지는 화면을 닫거나 다시 재생하지 않는다.
                if (valid() && request.desired === false) display(false);
            }
            function endedEvent() {
                if (!valid()) return;
                if (auto && request.desired && active() && request.player &&
                    typeof request.player.loop === 'function' && request.player.loop()) return;
                request.desired = false;
                request.pending = false;
                clearWaiting();
                display(false);
            }
            function on(player, name, fn) {
                if (typeof player.on !== 'function') return;
                player.on(name, fn);
                handlers.push([player, name, fn]);
            }
            function detachPlayer() {
                handlers.forEach(function (entry) { if (entry[0].off) entry[0].off(entry[1], entry[2]); });
                handlers = [];
            }
            request.dispose = function () {
                if (request.disposed) return;
                request.disposed = true;
                request.pending = false;
                clearWaiting();
                detachPlayer();
                if (swiper && swiper.off) {
                    swiper.off('slideChange', leave);
                    swiper.off('destroy', destroyed);
                }
            };
            function destroyed() {
                request.desired = false;
                try { pausePlayer(); } catch (ignore) { }
                request.dispose();
            }
            function leave() {
                if (!valid()) return;
                if (active()) {
                    // Auto ON의 중지 의도는 이번 진입에만 유지한다. 재진입은 원본 자동재생을 따른다.
                    if (auto && request.departed) request.dispose();
                    return;
                }
                request.departed = true;
                request.desired = false;
                request.pending = false;
                try { pausePlayer(); } catch (ignore) { }
                display(false);
                if (request.player) clearWaiting(); else schedule();
                if (swiper && swiper.destroyed) request.dispose();
                // 생성 대기 중이라면 인스턴스가 나타났을 때 지연 재생도 취소한다.
            }
            function schedule() {
                if (!valid() || timer !== null) return;
                timer = win.setTimeout(function () { timer = null; check(); }, 0);
            }
            function connect(player) {
                if (request.player === player) return;
                detachPlayer();
                request.player = player;
                request.ready = false;
                on(player, 'playing', playingEvent);
                on(player, 'play', function () {
                    if (!valid()) return;
                    if (!active() || request.desired === false) {
                        try { pausePlayer(); } catch (ignore) { }
                        // 원본의 지연 playVod가 뒤이어 바꾼 버튼·미리보기 상태도 중지로 되돌린다.
                        if (auto) schedule();
                    } else request.issued = true;
                });
                on(player, 'pause', stopEvent);
                on(player, 'ended', endedEvent);
                on(player, 'loadedmetadata', schedule);
                on(player, 'loadstart', schedule);
                on(player, 'error', function () { fail(player.error ? player.error() : new Error('PLAYER_ERROR')); });
                on(player, 'dispose', request.dispose);
                if (typeof player.ready === 'function') {
                    player.ready(function () {
                        if (!valid() || request.player !== player) return;
                        request.ready = true;
                        schedule();
                    });
                } else request.ready = true;
            }
            function check() {
                if (!valid()) { request.dispose(); return; }
                if (!active()) { request.desired = false; request.pending = false; }
                var player = brightcovePlayer(visual);
                if (!player) {
                    // 인스턴스 생성은 원본 클릭 핸들러가 담당한다. 다른 슬라이드의 플레이어는 사용하지 않는다.
                    timer = win.setTimeout(function () { timer = null; check(); }, 100);
                    return;
                }
                connect(player);
                if (request.desired === false) {
                    try { pausePlayer(); } catch (error) { log('warn', 'Brightcove 중지 실패', found.id, error); }
                    display(false);
                    clearWaiting();
                    return;
                }
                if (!request.ready) return;
                var paused = typeof player.paused === 'function' ? player.paused() : true;
                if (!paused) {
                    request.issued = true;
                    if (!player.readyState || player.readyState() >= 2) playingEvent();
                    return;
                }
                if (request.issued) return;
                var source = typeof player.currentSource === 'function' ? player.currentSource() : null;
                var hasSource = (typeof player.currentSrc === 'function' && player.currentSrc()) || (source && source.src) ||
                    (typeof player.readyState === 'function' && player.readyState() > 0);
                if (!hasSource) return;
                // 원본의 loadedmetadata 핸들러를 먼저 실행한다. preload=none만 play로 로딩을 시작한다.
                if (player.readyState && player.readyState() === 0 &&
                    (!player.preload || player.preload() !== 'none')) return;
                // 원본 클릭 뒤에도 시작되지 않은 경우에만 기존 Video.js 인스턴스로 재생한다.
                request.issued = true;
                var result;
                try { result = player.play(); } catch (error) { fail(error); return; }
                if (result && typeof result.then === 'function') {
                    result.then(function () {
                        if (valid() && request.desired && (!player.paused || !player.paused())) playingEvent();
                    }, fail);
                }
            }
            if (swiper && swiper.on) {
                swiper.on('slideChange', leave);
                swiper.on('destroy', destroyed);
            }
            if (win.MutationObserver) {
                observer = new win.MutationObserver(schedule);
                observer.observe(visual, { childList: true, subtree: true });
            }
            timeout = win.setTimeout(function () {
                if (!valid()) { request.dispose(); return; }
                if (!request.pending) { clearWaiting(); return; }
                fail(new Error(request.player ? 'VIDEO_SOURCE_OR_PLAYBACK_NOT_READY' : 'BRIGHTCOVE_PLAYER_NOT_FOUND'));
            }, 8000);
            var player = brightcovePlayer(visual);
            if (player) connect(player);
            // 캡처 단계에서는 원본 이벤트를 차단하거나 버튼 클래스를 바꾸지 않는다.
            schedule();
        }
        function click(event) {
            var button = closest(event.target, '.kvVideoBtn');
            var visual = button && closest(button, '.visual-area');
            var root = visual && closest(visual, '.rvmp-cmpnt[class*="cmpnt-new-"]');
            if (!root || event.defaultPrevented || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
            var api = win.kvVideoPlayer;
            var found = findItem(api, visual, button);
            if (!found) {
                log('warn', '영상 버튼의 플레이어 연결을 찾지 못했습니다.');
                return;
            }
            var item = found.item;
            var target = visual.querySelector('.kvVideo .target[id]');
            if (target) target.__ncPlayVersion = (target.__ncPlayVersion || 0) + 1;
            var container = closest(visual, '.swiper-container');
            if (container && container.swiper) win.clearTimeout(container.swiper.__kvResetTimer);
            win.clearTimeout(root.__kvActiveVideoTimer);
            // Brightcove는 Auto ON/OFF 모두 기존 플레이어 상태를 확인한다.
            if (isBrightcove(item, visual)) {
                brightcoveClick(api, found, visual, button, root);
                return;
            }
            // MP4·YouTube Auto ON의 원본 버튼 처리는 유지한다.
            if (item.auto === true || item.auto === 'true') return;
            var playing = !button.classList.contains('play');
            var method = playing ? 'videoPlay' : 'videoStop';
            var previewMethod = playing ? 'hidePreview' : 'showPreview';
            if (typeof api[method] !== 'function') {
                log('warn', '영상 제어 API가 없습니다: ' + method, found.id);
                return;
            }

            // 한 클릭에서 기존 핸들러와 API가 중복 실행되지 않게 한다.
            event.preventDefault();
            event.stopImmediatePropagation();
            var box = closest(visual, '.swiper-container');

            if (box && closest(box, '.rvmp-cmpnt[class*="cmpnt-new-"]') !== root) {
                box = null;
            }

            var swiper = box && box.swiper;
            if (swiper) win.clearTimeout(swiper.__kvResetTimer);
            win.clearTimeout(root.__kvActiveVideoTimer);
            var previous = visual.__ncManualRequest;
            if (previous) previous.timers.forEach(function (timer) { win.clearTimeout(timer); });
            var request = { timers: [] };
            visual.__ncManualRequest = request;

            var originalButton = element(item.videoBtn);
            playButton(button, playing);
            if (originalButton !== button) playButton(originalButton, playing);
            log('info', (playing ? '수동 재생 요청: ' : '수동 중지 요청: ') + method, found.id);
            var result;
            function failed(error) {
                // 이전 요청의 지연 오류가 중지·재재생 이후의 상태를 되돌리지 않게 한다.
                var slide = closest(visual, '.kvItem.swiper-slide');
                if (visual.__ncManualRequest !== request || !slide || !slide.classList.contains('swiper-slide-active') ||
                    button.classList.contains('play') !== playing) return;
                request.timers.forEach(function (timer) { win.clearTimeout(timer); });
                playButton(button, !playing);
                if (originalButton !== button) playButton(originalButton, !playing);
                showState(visual, !playing);
                var restorePreview = playing ? 'showPreview' : 'hidePreview';
                if (typeof api[restorePreview] === 'function') {
                    try { api[restorePreview](found.id); } catch (ignore) { }
                }
                log('error', '영상 제어 실패: ' + method, found.id, error);
            }
            try {
                // 원본과 같은 인스턴스·API를 사용한다. 중지는 원본의 초기화 인자를 유지한다.
                result = playing ? api.videoPlay(found.id) : api.videoStop(found.id, true);
            } catch (error) { failed(error); return; }
            if (typeof api[previewMethod] === 'function') {
                try { api[previewMethod](found.id); }
                catch (error) { log('warn', '미리보기 처리 실패: ' + previewMethod, found.id, error); }
            }
            showState(visual, playing);
            if (playing) {
                revealPlayer(visual, button);
                [120, 400].forEach(function (delay) {
                    request.timers.push(win.setTimeout(function () {
                        if (visual.__ncManualRequest === request) revealPlayer(visual, button);
                    }, delay));
                });
            }
            if (result && typeof result.catch === 'function') result.catch(failed);
        }
        // 실제 클릭과 키보드가 생성하는 click을 동일하게 처리한다. 플레이어를 다시 생성하지 않는다.
        doc.addEventListener('click', click, true);
    })(window, document);
};

}());
