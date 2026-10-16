/* 세 타입 공통. 로드만으로 설치 확장을 실행하지 않는다.
 * 순서: common.js → video.js → 페이지 호출 스크립트.
 * 각 페이지는 DOMContentLoaded 콜백 등록 후 NewCarouselSetup.common()/video() 호출.
 * 파일은 페이지당 한 번 로드. 중복 로드는 아래 가드로 무시한다. */
(function () {
    'use strict';
    if (window.__newComponentCommonLoaded) return;
    window.__newComponentCommonLoaded = true;
// 공통 스크립트
(function () {
    'use strict';

    var swiperMap = Object.create(null);
    var defaultEqualHeightSelectors = [
        '.link-area',
        '.title-area',
        '.sub-title-area',
        '.description-area',
        '.btn-area',
        '.disclaimer-area'
    ];

    function normalizeSelector(container) {
        if (!container) {
            return '';
        }

        if (typeof container !== 'string') {
            if (container.id) {
                return '#' + container.id;
            }

            return '';
        }

        if (container.charAt(0) === '#') {
            return container;
        }

        return '#' + container;
    }

    function getOptions(options) {
        var result = {};
        var defaults = {
            speed: 400,
            spaceBetween: 24,
            autoHeight: true,
            slidesPerView: 1,
            slidesPerGroup: 1,
            breakpoints: null,
            equalHeight: false,
            equalHeightSelectors: defaultEqualHeightSelectors,
            autoplay: true,
            autoplayText: false,
            bulletLabel: '번째 슬라이드 보기'
        };
        var key;

        options = options || {};

        for (key in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, key)) {
                result[key] = defaults[key];
            }
        }

        for (key in options) {
            if (Object.prototype.hasOwnProperty.call(options, key)) {
                result[key] = options[key];
            }
        }

        return result;
    }

    function renderCarouselBullet(state, index, className) {
        return '<button type="button" class="' + className + '" aria-label="' + (index + 1) + state.options.bulletLabel + '"></button>';
    }

    function getPaginationElement(state) {
        if (state.swiper && state.swiper.pagination && state.swiper.pagination.el) {
            return state.swiper.pagination.el;
        }

        return state.root.querySelector('.swiper-pagination');
    }

    function setControlState(button, disabled) {
        if (!button) {
            return;
        }

        if ('disabled' in button) {
            button.disabled = disabled;
        }

        button.setAttribute('role', 'button');
        button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        button.setAttribute('aria-hidden', disabled ? 'true' : 'false');
        button.setAttribute('tabindex', disabled ? '-1' : '0');
        button.style.display = disabled ? 'none' : '';
    }

    function isAutoplayRunning(state) {
        return Boolean(state.swiper && state.swiper.autoplay && state.swiper.autoplay.running);
    }

    function updateAutoplayControls(state) {
        var playBtn = state.root.querySelector('.swiper-button-play');
        var stopBtn = state.root.querySelector('.swiper-button-stop');
        var isPlaying = isAutoplayRunning(state);

        if (!playBtn || !stopBtn) {
            return;
        }

        setControlState(playBtn, isPlaying);
        setControlState(stopBtn, !isPlaying);
    }

    function renderAutoplayControls(state) {
        var pagination = getPaginationElement(state);
        var playText = '';
        var stopText = '';

        if (!state.options.autoplay || !pagination) {
            return;
        }

        if (pagination.querySelector('.swiper-button-play')) {
            updateAutoplayControls(state);
            return;
        }

        if (state.options.autoplayText) {
            playText = '재생';
            stopText = '정지';
        }

        pagination.insertAdjacentHTML(
            'beforeend',
            '<button type="button" class="swiper-button-play" aria-label="자동 재생 시작" aria-disabled="true" aria-hidden="true" tabindex="-1">' + playText + '</button>' +
            '<button type="button" class="swiper-button-stop" aria-label="자동 재생 정지" aria-disabled="false" aria-hidden="false" tabindex="0">' + stopText + '</button>'
        );

        updateAutoplayControls(state);
    }

    function updateCarouselPagination(state) {
        var pagination;
        var bulletLength;
        var isHidden;
        var prevBtn;
        var nextBtn;
        var navButtons;
        var i;
        var button;

        if (!state.swiper || !state.swiper.pagination) {
            return;
        }

        if (state.swiper.pagination.render) {
            state.swiper.pagination.render();
        }

        if (state.swiper.pagination.update) {
            state.swiper.pagination.update();
        }

        pagination = getPaginationElement(state);

        if (!pagination) {
            return;
        }

        prevBtn = state.root.querySelector('.swiper-button-prev');
        nextBtn = state.root.querySelector('.swiper-button-next');

        bulletLength = pagination.querySelectorAll('.swiper-pagination-bullet').length;
        isHidden = bulletLength <= 1;

        pagination.hidden = isHidden;
        pagination.setAttribute('aria-hidden', isHidden ? 'true' : 'false');

        navButtons = [prevBtn, nextBtn];

        for (i = 0; i < navButtons.length; i += 1) {
            button = navButtons[i];

            if (!button) {
                continue;
            }

            button.hidden = isHidden;
            button.setAttribute('aria-hidden', isHidden ? 'true' : 'false');

            if (isHidden) {
                button.disabled = true;
                button.setAttribute('tabindex', '-1');
            } else {
                button.disabled = false;
                button.removeAttribute('tabindex');
            }
        }

        if (isHidden) {
            return;
        }

        if (state.swiper.navigation && state.swiper.navigation.update) {
            state.swiper.navigation.update();
        }

        renderAutoplayControls(state);
    }

    function getKvSwiperElement(state) {
        var swiperEl;
        var list;
        var i;

        if (!state || !state.root) {
            return null;
        }

        if (state.swiper && state.swiper.el && state.swiper.el.querySelector) {
            if (state.swiper.el.querySelector('.kvItem')) {
                return state.swiper.el;
            }
        }

        if (!state.root.querySelectorAll) {
            return null;
        }

        list = state.root.querySelectorAll('.swiper-container');

        for (i = 0; i < list.length; i += 1) {
            swiperEl = list[i];

            if (swiperEl.querySelector('.kvItem')) {
                return swiperEl;
            }
        }

        return null;
    }

    function getRealKvSlides(swiper) {
        if (!swiper || !swiper.el || !swiper.el.querySelectorAll) {
            return [];
        }

        return Array.prototype.slice.call(
            swiper.el.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)')
        );
    }

    function getActiveRealKvSlide(swiper) {
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

        realSlides = getRealKvSlides(swiper);
        realIndex = String(swiper.realIndex);

        for (i = 0; i < realSlides.length; i += 1) {
            if (realSlides[i].getAttribute('data-swiper-slide-index') === realIndex) {
                return realSlides[i];
            }
        }

        return realSlides[swiper.realIndex] || null;
    }

    function getKvSlideVodId(slide) {
        var target;

        if (!slide || !slide.querySelector) {
            return '';
        }

        target = slide.querySelector('.kvVideo .target[id]');

        if (!target) {
            return '';
        }

        return target.getAttribute('id') || '';
    }

    function stopOtherKvVideos(state, activeSlide, activeVodId) {
        var realSlides;
        var i;
        var slide;
        var vodId;

        if (!state || !state.swiper || !window.kvVideoPlayer || typeof window.kvVideoPlayer.videoStop !== 'function') {
            return;
        }

        realSlides = getRealKvSlides(state.swiper);

        for (i = 0; i < realSlides.length; i += 1) {
            slide = realSlides[i];

            if (activeSlide && slide === activeSlide) {
                continue;
            }

            vodId = getKvSlideVodId(slide);

            if (!vodId || vodId === activeVodId) {
                continue;
            }

            window.kvVideoPlayer.videoStop(vodId, true);
        }
    }

    function syncActiveKvVideo(state) {
        var swiper;
        var activeSlide;
        var activeVodId;
        var item;
        var videoAuto;

        if (!hasKvVideo(state) || !window.kvVideoPlayer || !window.kvVideoPlayer.obj) {
            return;
        }

        swiper = state.swiper;

        if (!swiper) {
            return;
        }

        if (swiper.__kvStopBound) return;
        clearTimeout(state.root.__kvActiveVideoTimer);

        state.root.__kvActiveVideoTimer = setTimeout(function () {
            activeSlide = getActiveRealKvSlide(swiper);
            activeVodId = getKvSlideVodId(activeSlide);

            if (!activeVodId) {
                return;
            }

            stopOtherKvVideos(state, activeSlide, activeVodId);

            item = window.kvVideoPlayer.obj[activeVodId];

            if (!item) {
                return;
            }

            videoAuto = item.auto;

            if (item.videoBtn && item.videoBtn.classList) {
                item.videoBtn.classList.remove('play', 'pause');
            }

            if (videoAuto === true || videoAuto === 'true') {
                setTimeout(function () {
                    if (item.videoBtn && item.videoBtn.classList) {
                        item.videoBtn.classList.add('play');
                    }

                    if (typeof window.kvVideoPlayer.videoPlay === 'function') {
                        window.kvVideoPlayer.videoPlay(activeVodId);
                    }

                    if (typeof window.kvVideoPlayer.hidePreview === 'function') {
                        window.kvVideoPlayer.hidePreview(activeVodId);
                    }
                }, 30);

                return;
            }

            if (item.videoBtn && item.videoBtn.classList) {
                item.videoBtn.classList.add('pause');
            }

            if (typeof window.kvVideoPlayer.videoStop === 'function') {
                window.kvVideoPlayer.videoStop(activeVodId, true);
            }

            if (typeof window.kvVideoPlayer.showPreview === 'function') {
                window.kvVideoPlayer.showPreview(activeVodId);
            }
        }, 200);
    }

    function syncKvControlArea(state) {
        var swiperEl;
        var realSlideCount;
        var pageArea;
        var ctrlArea;
        var shouldHide;

        if (!state || !state.swiper || !state.root) {
            return;
        }

        swiperEl = getKvSwiperElement(state);

        if (!swiperEl) {
            return;
        }

        realSlideCount = getRealKvSlides(state.swiper).length;
        pageArea = state.root.querySelector('.page-area');
        ctrlArea = state.root.querySelector('.ctrl-area');
        shouldHide = realSlideCount <= 1;

        if (pageArea) {
            pageArea.style.display = shouldHide ? 'none' : '';
            pageArea.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
        }

        if (ctrlArea) {
            ctrlArea.style.display = shouldHide ? 'none' : '';
            ctrlArea.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
        }

        state.swiper.allowTouchMove = !shouldHide;

        if (shouldHide) {
            if (state.swiper.autoplay) {
                state.swiper.autoplay.stop();
            }

            return;
        }

        if (!state.swiper.autoplay) {
            return;
        }

        if (state.options.autoplay && state.__userAutoplayPaused !== true) {
            state.swiper.autoplay.start();
        } else {
            state.swiper.autoplay.stop();
        }

        updateAutoplayControls(state);
    }

    function refreshComponentLayout(state) {
        updateActiveSlideHeight(state);
        updateEqualHeight(state);
        updateAutoplayControls(state);
        syncKvSlide(state);
        syncKvControlArea(state);
    }

    function refreshComponentContent(state) {
        if (!state || !state.swiper || state.swiper.destroyed) {
            return;
        }

        if (state.swiper.update) {
            state.swiper.update();
        }

        updateCarouselPagination(state);
        bindMediaLoadEvents(state);
        refreshComponentLayout(state);
        syncActiveKvVideo(state);
    }

    function requestComponentRefresh(state) {
        if (!state || !state.swiper || state.swiper.destroyed || !state.swiper.el) {
            return;
        }

        if (state.swiper.el.__componentRefreshFrame) {
            return;
        }

        state.swiper.el.__componentRefreshFrame = requestAnimationFrame(function () {
            refreshComponentContent(state);
            state.swiper.el.__componentRefreshFrame = null;
        });
    }

    function handleInitialLoad(state) {
        bindComponentEvents(state);
        refreshComponentContent(state);
    }

    function handleAjaxSuccess(state) {
        requestComponentRefresh(state);
    }

    function createSwiperOptions(state) {
        function pauseSlideMedia() {
            pauseKvSlide(state);
        }

        function refreshLayout() {
            refreshComponentLayout(state);
        }

        function refreshAutoplayControls() {
            updateAutoplayControls(state);
        }

        var swiperOptions = {
            speed: state.options.speed,
            spaceBetween: state.options.spaceBetween,
            autoHeight: state.options.autoHeight,
            preloadImages: false,
            lazy: true,
            watchSlidesProgress: true,
            slidesPerView: state.options.slidesPerView,
            slidesPerGroup: state.options.slidesPerGroup,
            a11y: {
                prevSlideMessage: '이전 슬라이드',
                nextSlideMessage: '다음 슬라이드'
            },
            navigation: {
                prevEl: state.selector + ' .swiper-button-prev',
                nextEl: state.selector + ' .swiper-button-next'
            },
            pagination: {
                el: state.selector + ' .swiper-pagination',
                type: 'bullets',
                clickable: true,
                renderBullet: function (index, className) {
                    return renderCarouselBullet(state, index, className);
                }
            },
            on: {
                init: function () {
                    state.swiper = this;
                    handleInitialLoad(state);
                    syncKvSlide(state);
                },
                slideChangeTransitionStart: pauseSlideMedia,
                transitionStart: pauseSlideMedia,
                slideChange: refreshLayout,
                slideChangeTransitionEnd: refreshLayout,
                transitionEnd: refreshLayout,
                resize: refreshLayout,
                breakpoint: function () {
                    requestComponentRefresh(state);
                },
                autoplayStart: refreshAutoplayControls,
                autoplayStop: refreshAutoplayControls
            }
        };

        if (state.options.breakpoints) {
            swiperOptions.breakpoints = state.options.breakpoints;
        }

        if (state.options.autoplay) {
            swiperOptions.autoplay = Object.assign({
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false
            }, typeof state.options.autoplay === 'object' ? state.options.autoplay : {});
        }

        return swiperOptions;
    }

    function initComponentSwiper(container, options) {
        var selector = normalizeSelector(container);
        var root = selector ? document.querySelector(selector) : null;
        var state;

        if (!selector || !root || typeof Swiper === 'undefined') {
            return null;
        }

        state = swiperMap[selector];

        if (state && state.root !== root) {
            if (state.swiper && state.swiper.destroy) {
                state.swiper.destroy(true, true);
            }

            delete swiperMap[selector];
            state = null;
        }

        if (state && state.swiper && !state.swiper.destroyed) {
            return state.swiper;
        }

        state = {
            selector: selector,
            root: root,
            options: getOptions(options),
            swiper: null,
            __userAutoplayPaused: false
        };

        swiperMap[selector] = state;
        state.swiper = new Swiper(selector + ' .swiper-container', createSwiperOptions(state));
        state.swiper.on('destroy', function () {
            var el = state.swiper.el;
            if (el && el.__componentRefreshFrame) cancelAnimationFrame(el.__componentRefreshFrame);
            clearTimeout(root.__kvActiveVideoTimer);
            if (swiperMap[selector] === state) delete swiperMap[selector];
        });

        return state.swiper;
    }

    function refreshComponentSwiper(container) {
        var selector = normalizeSelector(container);
        var state = swiperMap[selector];

        if (!state) {
            return null;
        }

        handleAjaxSuccess(state);

        return state.swiper;
    }

    window.initComponentSwiper = initComponentSwiper;
    window.refreshComponentSwiper = refreshComponentSwiper;
}());
// 공통 확장: 높이, 조작 중 일시정지, 인디케이터와 컨트롤 위치.
window.NewCarouselSetup = window.NewCarouselSetup || {};
Object.assign(window.NewCarouselSetup, {
    common: function () {
        if (window.NewCarouselSetup.commonReady) return;
        window.NewCarouselSetup.commonReady = true;

        // 공통 파일에 없는 함수만 제공한다.
        // - sec 공용 스크립트가 제공하는 동명 함수가 이미 있으면 정의하지 않음.
        // - 없을 때만 최소 동작으로 메워 초기화가 끝까지 진행되게 함.
        (function (win, doc) {
            'use strict';

            function define(name, fn) {
                try {
                    if (typeof win[name] !== 'function') win[name] = fn;
                } catch (ignore) { }
            }

            /* 영상 타깃 존재 여부 */
            define('hasKvVideo', function (state) {
                try {
                    var scope = state && state.root ? state.root : (state && state.swiper ? state.swiper.el : null);
                    return !!(scope && scope.querySelector && scope.querySelector('.kvVideo .target[id]'));
                } catch (ignore) {
                    return false;
                }
            });

            /* 유튜브 여부. 구형 youtube 전용 경로에서만 참조됨. */
            define('isYoutubeVod', function (id) {
                var item = win.kvVideoPlayer && win.kvVideoPlayer.obj && win.kvVideoPlayer.obj[id];
                return !!item && (item.type === 'youtube' || item.videoType === 'youtube');
            });

            /* 활성 슬라이드 높이에 맞춤. autoHeight 보조. */
            define('updateActiveSlideHeight', function (state) {
                try {
                    if (state && state.swiper && state.swiper.updateAutoHeight) state.swiper.updateAutoHeight();
                } catch (ignore) { }
            });

            /* equalHeight:false(기본)이면 무동작 */
            define('updateEqualHeight', function (state) {
                var selectors;
                var s;
                var j;
                var nodes;
                var max;
                try {
                    if (!state || !state.options || !state.options.equalHeight) return;
                    selectors = state.options.equalHeightSelectors || [];
                    for (s = 0; s < selectors.length; s++) {
                        nodes = state.root.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate) ' + selectors[s]);
                        for (j = 0; j < nodes.length; j++) nodes[j].style.minHeight = '';
                        max = 0;
                        for (j = 0; j < nodes.length; j++) max = Math.max(max, Math.ceil(nodes[j].offsetHeight || 0));
                        if (max > 0) {
                            for (j = 0; j < nodes.length; j++) nodes[j].style.minHeight = max + 'px';
                        }
                    }
                } catch (ignore) { }
            });

            /* 전환 시점 영상 정지. KvVideoStopper와 같은 동작이라 중복 호출돼도 무해. */
            define('pauseKvSlide', function (state) {
                try {
                    if (state && state.swiper && !state.swiper.__kvStopBound && win.KvVideoStopper && win.KvVideoStopper.stopAll) {
                        win.KvVideoStopper.stopAll(state.swiper);
                    }
                } catch (ignore) { }
            });

            /* 슬라이드 접근성 표시. tabindex는 건드리지 않음. */
            define('syncKvSlide', function (state) {
                var slides;
                var i;
                try {
                    if (!state || !state.swiper || !state.swiper.slides) return;
                    slides = state.swiper.slides;
                    for (i = 0; i < slides.length; i++) {
                        if (!slides[i].classList || !slides[i].classList.contains('kvItem')) continue;
                        slides[i].setAttribute('aria-hidden', slides[i].classList.contains('swiper-slide-active') ? 'false' : 'true');
                    }
                } catch (ignore) { }
            });

            define('bindComponentEvents', function (state) {
                if (state && state.root && win.NewCarouselSupport) {
                    win.NewCarouselSupport.attach(state.root, state.swiper, state);
                }
            });

            define('bindMediaLoadEvents', function (state) {
                if (state && state.root && win.NewCarouselSupport) {
                    win.NewCarouselSupport.attach(state.root, state.swiper, state);
                }
            });
        })(window, document);


        (function (win, doc) {
            'use strict';
            var roots = [];
            var layoutPass = 0;
            var heightProperties = ['height', 'block-size', 'min-height', 'min-block-size', 'max-height', 'max-block-size'];
            var youtubeParser = doc.createElement('a');
            var mediaEvents = ['load', 'loadedmetadata', 'loadeddata', 'emptied', 'resize', 'fullscreenchange', 'webkitfullscreenchange'];
            var events = ['slideChange', 'transitionEnd', 'resize', 'breakpoint', 'observerUpdate', 'imagesReady', 'update', 'paginationRender', 'paginationUpdate', 'autoplayStart', 'autoplayStop', 'autoplayPause', 'autoplayResume'];
            var raf = win.requestAnimationFrame || function (fn) { return win.setTimeout(fn, 16); };
            function attr(node, name, value) { if (node.getAttribute(name) !== value) node.setAttribute(name, value); }
            function css(node, name, value) {
                var current = node.style.getPropertyValue(name);
                var priority = node.style.getPropertyPriority(name);
                if (current === value && !priority) return;
                var records = node.__ncLayoutStyles || (node.__ncLayoutStyles = {});
                if (!records[name]) records[name] = { value: current, priority: priority };
                if (value) node.style.setProperty(name, value);
                else node.style.removeProperty(name);
                records[name].written = node.style.getPropertyValue(name);
                if (!node.style.length) node.removeAttribute('style');
            }
            function clearStyle(node, names) {
                for (var i = 0; i < names.length; i += 1) {
                    if (node.style.getPropertyValue(names[i]) || node.style.getPropertyPriority(names[i])) css(node, names[i], '');
                }
            }
            function releaseLayout(node) {
                var records = node.__ncLayoutStyles || {};
                Object.keys(records).forEach(function (name) {
                    var r = records[name];
                    if (node.style.getPropertyValue(name) !== r.written || node.style.getPropertyPriority(name)) return;
                    if (r.value) node.style.setProperty(name, r.value, r.priority);
                    else node.style.removeProperty(name);
                });
                delete node.__ncLayoutStyles;
                delete node.__ncSpacerPass;
                if (node.hasAttribute('style') && !node.style.length) node.removeAttribute('style');
            }
            function releaseRoot(root) {
                // 복원 기록은 JS에서만 보관한다. 해제할 때만 전체 자식의 기록을 확인한다.
                var nodes = root.querySelectorAll('*');
                for (var i = 0; i < nodes.length; i += 1) {
                    if (nodes[i].__ncLayoutStyles || nodes[i].__ncSpacerPass) releaseLayout(nodes[i]);
                }
            }
            function matches(node, selector) {
                var fn = node && (node.matches || node.msMatchesSelector);
                return !!fn && fn.call(node, selector);
            }
            function closest(node, selector, limit) {
                while (node && node !== limit) { if (matches(node, selector)) return node; node = node.parentElement; }
                return null;
            }
            function ratio(w, h) { w = Number(w); h = Number(h); return isFinite(w) && isFinite(h) && w > 1 && h > 1 ? w / h : 0; }
            function parseRatio(value) {
                var p = String(value || '').replace(/auto/g, '').trim().split(/\s*[/:]\s*/);
                return p.length === 2 ? ratio(p[0], p[1]) : 0;
            }
            function naturalBox(node) {
                clearStyle(node, heightProperties);
                if (node.__ncLayoutStyles && node.__ncLayoutStyles['--nc-visual-height']) css(node, '--nc-visual-height', '');
            }
            function spacer(node) {
                if (node.__ncSpacerPass === layoutPass) return;
                node.__ncSpacerPass = layoutPass;
                ['before', 'after'].forEach(function (name) {
                    var property = '--nc-spacer-' + name;
                    if (node.style.getPropertyValue(property) === 'none') return;
                    var style = win.getComputedStyle(node, '::' + name);
                    if ((style.content === '\"\"' || style.content === "''") && style.position !== 'absolute' &&
                        (parseFloat(style.paddingTop) > 0 || parseFloat(style.paddingBottom) > 0 || parseRatio(style.aspectRatio))) {
                        css(node, property, 'none');
                    }
                });
            }
            function flow(node) {
                clearStyle(node, ['position', 'top', 'right', 'bottom', 'left', 'padding-top', 'padding-bottom', 'aspect-ratio']);
                naturalBox(node);
                spacer(node);
            }
            function path(leaf, end) {
                for (var node = leaf.parentElement; node && node !== end; node = node.parentElement) flow(node);
            }
            function sourceRatio(node) {
                var w = node.getAttribute('width') || '';
                var h = node.getAttribute('height') || '';
                if (/^\d+(\.\d+)?$/.test(w) && /^\d+(\.\d+)?$/.test(h) && !(Number(w) === 300 && Number(h) === 150)) return ratio(w, h);
                if (node.__ncOriginalRatio) return node.__ncOriginalRatio;
                var s = win.getComputedStyle(node);
                var value = parseRatio(s.aspectRatio);
                if (!value && matches(node, '.vjs-fluid') && node.clientWidth) {
                    var padding = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
                    if (padding > 0) value = node.clientWidth / padding;
                }
                if (value) node.__ncOriginalRatio = value;
                return value;
            }
            function isYoutubeFrame(node) {
                if (!matches(node, 'iframe')) return false;
                var source = node.getAttribute('src') || '';
                var url = node.src || source;
                var cached = node.__ncYoutubeFrame;
                if (cached && cached.url === url) return cached.matches;
                youtubeParser.href = url;
                var result = /(^|\.)youtube(?:-nocookie)?\.com$/i.test(youtubeParser.hostname) && /^\/(?:embed|v)\//i.test(youtubeParser.pathname);
                node.__ncYoutubeFrame = { url: url, matches: result };
                return result;
            }
            function videoVisual(visual, box) {
                var fullscreen = doc.fullscreenElement || doc.webkitFullscreenElement;
                if (fullscreen && (visual.contains(fullscreen) || fullscreen.contains(visual))) return;
                var player = box.querySelector('.video-js, video-js');
                if (player && matches(player, '.vjs-fullscreen')) return;
                var video = box.querySelector('video');
                var frame = box.querySelector('iframe');
                var preview = box.querySelector('.previewImg img');
                var value = video && ratio(video.videoWidth, video.videoHeight);
                if (!value && player) value = sourceRatio(player);
                if (!value && frame) value = sourceRatio(frame);
                if (!value && preview && !/img_baseimg_null\./.test(preview.currentSrc || preview.src || '')) {
                    value = ratio(preview.naturalWidth, preview.naturalHeight);
                }
                if (!value && frame && isYoutubeFrame(frame)) value = 16 / 9;
                if (!value || !visual.clientWidth) return;

                // 높이는 visual 외곽만 만든다. kvBox/kvVideo/target/preview/플레이어 UI는 원본이 제어한다.
                var height = Math.round(visual.clientWidth / value * 100) / 100 + 'px';
                spacer(visual);
                clearStyle(visual, heightProperties);
                css(visual, '--nc-visual-height', height);
                // iframe은 고유 크기가 없으므로 크기만 지정한다. 표시·위치·전환 상태는 변경하지 않는다.
                if (frame && isYoutubeFrame(frame)) {
                    for (var node = frame; node && node !== visual; node = node.parentElement) {
                        css(node, 'width', '100%');
                        css(node, 'min-width', '0px');
                        css(node, 'max-width', 'none');
                    }
                    // 같은 프레임 높이를 지웠다가 다시 쓰면 MutationObserver가 반복 실행된다.
                    css(frame, 'height', 'var(--nc-visual-height, auto)');
                    css(frame, 'block-size', 'var(--nc-visual-height, auto)');
                    css(frame, 'min-height', '0px');
                    css(frame, 'min-block-size', '0px');
                    css(frame, 'max-height', 'none');
                    css(frame, 'max-block-size', 'none');
                }
            }
            function media(visual) {
                clearStyle(visual, ['position', 'padding-top', 'padding-bottom', 'aspect-ratio']);
                var box = visual.querySelector('.kvVideo');
                if (box) { videoVisual(visual, box); return; }
                naturalBox(visual);
                spacer(visual);
                var images = visual.querySelectorAll('.link-area img, .kvimg img, .prd-figure img');
                for (var i = 0; i < images.length; i += 1) {
                    clearStyle(images[i], heightProperties);
                    clearStyle(images[i], ['position', 'top', 'left', 'width']);
                    path(images[i], visual);
                }
            }
            function boxOf(root) { return root.querySelector('.list-area > .swiper-container') || root.querySelector('.swiper-container'); }
            function activeHeight(state) {
                if (state.measuring) return;
                state.measuring = true;
                layoutPass += 1;
                try {
                    var root = state.root, box = boxOf(root), sw = state.swiper;
                    if (!box) return;
                    naturalBox(box);
                    naturalBox(box.parentElement);
                    var inner = root.querySelector('.innr');
                    if (inner) naturalBox(inner);
                    var slides = box.querySelectorAll('.swiper-wrapper > .kvItem.swiper-slide');
                    var nodes, i, j;
                    // 교체·삭제된 슬라이드는 관찰 대상과 참조 목록에서 해제한다.
                    if (state.ro) {
                        for (i = state.observed.length - 1; i >= 0; i -= 1) {
                            if (Array.prototype.indexOf.call(slides, state.observed[i]) !== -1) continue;
                            state.ro.unobserve(state.observed[i]);
                            state.observed.splice(i, 1);
                        }
                    }
                    for (i = 0; i < slides.length; i += 1) {
                        naturalBox(slides[i]);
                        spacer(slides[i]);
                        nodes = slides[i].querySelectorAll('.visual-area, .bundle-area > .title-area, .bundle-area > .sub-title-area, .bundle-area > .description-area, .bundle-area > .btn-area, .bundle-area > .disclaimer-area');
                        for (j = 0; j < nodes.length; j += 1) {
                            if (matches(nodes[j], '.visual-area')) media(nodes[j]);
                            else if (matches(nodes[j], '.title-area, .sub-title-area, .description-area, .btn-area, .disclaimer-area')) naturalBox(nodes[j]);
                        }
                        if (state.ro && state.observed.indexOf(slides[i]) < 0) { state.observed.push(slides[i]); state.ro.observe(slides[i]); }
                    }
                    var slide = sw && sw.slides && sw.slides[sw.activeIndex];
                    var wrapper = box.querySelector('.swiper-wrapper');
                    if (!slide || !wrapper || !slide.offsetWidth) return;
                    var s = win.getComputedStyle(slide);
                    var height = Math.ceil(slide.offsetHeight + (parseFloat(s.marginTop) || 0) + (parseFloat(s.marginBottom) || 0)) + 'px';
                    clearStyle(wrapper, heightProperties);
                    css(wrapper, '--nc-active-height', height);
                } finally { state.measuring = false; }
            }
            function locked(state) { return state.userPaused === true || !!(state.interaction && state.interaction.paused); }
            function stop(state) {
                var sw = state.swiper, auto = sw && sw.autoplay;
                if (!auto) return;
                if (auto.stop) auto.stop();
                // 구형 Swiper의 대기 타이머가 정지 후 재개되지 않도록 비운다.
                if (typeof auto.timeout !== 'undefined') { win.clearTimeout(auto.timeout); auto.timeout = undefined; }
                auto.running = false;
                auto.paused = false;
            }
            // BO: PC 801px 이상 / Mobile 800px 이하. theme와 position은 별도 설정이다.
            // 새 설정 속성을 우선하고 구형 data-indicator-theme/type 및 show 속성도 허용한다.
            function indicator(page) {
                var mobile = win.matchMedia('(max-width: 800px)').matches;
                var device = mobile ? 'mobile' : 'pc';
                if (typeof page.__ncLegacyTheme === 'undefined') {
                    page.__ncLegacyTheme = page.getAttribute('data-indicator-theme') || page.getAttribute('data-indicator-type') || 'dot';
                }
                var theme = page.getAttribute('data-indicator-theme-' + device) || page.__ncLegacyTheme;
                if (theme !== 'line' && theme !== 'dot') theme = 'dot';
                attr(page, 'data-indicator-theme', theme);
                attr(page, 'data-indicator-type', theme);
                ['pc', 'mobile'].forEach(function (name) {
                    var legacy = page.getAttribute('data-indicator-' + name);
                    if (!page.hasAttribute('data-indicator-show-' + name) && (legacy === 'show' || legacy === 'hide')) {
                        attr(page, 'data-indicator-show-' + name, legacy);
                    }
                });
            }
            function controls(state) {
                var sw = state.swiper, page = state.root.querySelector('.page-area');
                if (!sw || sw.destroyed || !page) return;
                indicator(page);
                var pagination = page.querySelector('.swiper-pagination');
                var count = sw.el.querySelectorAll('.swiper-wrapper > .swiper-slide:not(.swiper-slide-duplicate)').length;
                var on = !!(sw.params && sw.params.autoplay && sw.params.autoplay.enabled !== false) && count > 1;
                if (locked(state) && sw.autoplay && sw.autoplay.running) stop(state);
                // 조작 중 임시 정지는 자동 전환 ON 상태다. 정지 버튼으로 영구 정지를 선택할 수 있다.
                var running = !state.userPaused && !!(sw.autoplay && (sw.autoplay.running || (state.interaction && state.interaction.paused)));
                ['play', 'stop'].forEach(function (name) {
                    var button = page.querySelector('.swiper-button-' + name);
                    // 원본 버튼을 사용한다. pagination 재생성으로 없어진 경우에만 복구한다.
                    if (!button && on && pagination) {
                        button = doc.createElement('button');
                        button.type = 'button';
                        button.className = 'swiper-button-' + name;
                        pagination.appendChild(button);
                    }
                    if (!button) return;
                    var shown = on && (name === 'play' ? !running : running);
                    var label = name === 'play' ? '자동 재생 시작' : '자동 재생 정지';
                    attr(button, 'aria-label', label);
                    attr(button, 'title', label);
                    attr(button, 'aria-disabled', shown ? 'false' : 'true');
                    attr(button, 'aria-hidden', shown ? 'false' : 'true');
                    attr(button, 'tabindex', shown ? '0' : '-1');
                    if (button.disabled === shown) button.disabled = !shown;
                    // 표시 여부는 기존 disabled 상태와 CSS로 결정한다.
                    button.style.removeProperty('display');
                    if (!button.style.length) button.removeAttribute('style');
                });
            }
            // 실제 콘텐츠 조작이 끝난 뒤 3초 동안 입력이 없으면 남은 시간부터 재개한다.
            var interactionIdle = 3000;
            function noHoverPause(sw) {
                if (!sw || !sw.el || !closest(sw.el, '.rvmp-cmpnt[class*="cmpnt-new-"]')) return;
                function configure(options) {
                    if (!options) return;
                    if (options.autoplay && typeof options.autoplay === 'object') options.autoplay.pauseOnMouseEnter = false;
                    if (options.breakpoints) Object.keys(options.breakpoints).forEach(function (key) {
                        var option = options.breakpoints[key];
                        if (option && option.autoplay && typeof option.autoplay === 'object') option.autoplay.pauseOnMouseEnter = false;
                    });
                }
                [sw.params, sw.originalParams, sw.passedParams].forEach(configure);
            }
            function installInteractionPolicy() {
                var Swiper = win.Swiper;
                if (!Swiper || !Swiper.use || Swiper.__ncInteractionPolicy) return;
                if (Swiper.prototype && Swiper.prototype.modules) {
                    Swiper.use({
                        name: 'ncInteractionPolicy', on: {
                            beforeInit: function () { noHoverPause(this); },
                            breakpoint: function () { noHoverPause(this); }
                        }
                    });
                } else {
                    Swiper.use(function (context) {
                        context.on('beforeInit', function () { noHoverPause(context.swiper); });
                        context.on('breakpoint', function () { noHoverPause(context.swiper); });
                    });
                }
                Swiper.__ncInteractionPolicy = true;
            }
            function interactionEnabled(state) {
                var sw = state.swiper, options = sw && sw.params && sw.params.autoplay;
                return !!(sw && !sw.destroyed && sw.autoplay && options && options.enabled !== false &&
                    !(sw.__kvOptions && sw.__kvOptions.autoplay === false) &&
                    sw.el.querySelectorAll('.swiper-wrapper > .swiper-slide:not(.swiper-slide-duplicate)').length > 1);
            }
            function contentState(node) {
                if (node && node.nodeType !== 1) node = node.parentElement;
                var slide = closest(node, '.swiper-slide');
                var root = slide && closest(slide, '.rvmp-cmpnt[class*="cmpnt-new-"]');
                var state = root && root.__ncSupport, sw = state && state.swiper;
                return sw && !sw.destroyed && sw.slides && sw.slides[sw.activeIndex] === slide &&
                    !closest(node, '.page-area, .ctrl-area', root) ? state : null;
            }
            function countdownSnapshot(state) {
                var sw = state.swiper, clock = sw && sw.__ncLineClock;
                return clock && clock.capture ? clock.capture() : null;
            }
            function resumeCountdown(state, snapshot) {
                var sw = state.swiper, auto = sw && sw.autoplay;
                if (!auto || sw.destroyed || locked(state) || doc.hidden) return;
                var slide = sw.slides && sw.slides[sw.activeIndex];
                if (!snapshot || snapshot.slide !== slide) { auto.paused = false; auto.start(); return; }
                var options = sw.params.autoplay, delay = options.delay;
                var previous = slide.getAttribute('data-swiper-autoplay');
                var remaining = Math.max(1, Math.ceil(snapshot.remaining));
                // SDK의 전환 타이머를 그대로 사용한다. 재개 1회에만 남은 간격을 전달한다.
                sw.__ncResumeCountdown = snapshot;
                try {
                    options.delay = remaining;
                    if (previous !== null) slide.setAttribute('data-swiper-autoplay', String(remaining));
                    auto.paused = false;
                    auto.start();
                } finally {
                    options.delay = delay;
                    if (previous !== null) slide.setAttribute('data-swiper-autoplay', previous);
                    delete sw.__ncResumeCountdown;
                }
            }
            function clearInteraction(state) {
                if (state.interaction) win.clearTimeout(state.interaction.timer);
                state.interaction = null;
            }
            function holdInteraction(state) {
                var value = state.interaction;
                var fullscreen = doc.fullscreenElement || doc.webkitFullscreenElement;
                return doc.hidden || Object.keys(value.pointers).length || Object.keys(value.keys).length ||
                    value.dragging || value.composing || (fullscreen && state.root.contains(fullscreen));
            }
            function armInteraction(state) {
                var value = state.interaction;
                if (!value) return;
                win.clearTimeout(value.timer);
                value.timer = null;
                if (holdInteraction(state)) return;
                value.timer = win.setTimeout(function () {
                    value.timer = null;
                    if (state.interaction !== value) return;
                    if (!doc.documentElement.contains(state.root) || !interactionEnabled(state) || state.userPaused) {
                        clearInteraction(state); return;
                    }
                    if (value.until > Date.now() || holdInteraction(state)) { armInteraction(state); return; }
                    var snapshot = value.snapshot;
                    clearInteraction(state);
                    resumeCountdown(state, snapshot);
                    controls(state);
                }, Math.max(1, value.until - Date.now()));
            }
            function touchInteraction(state) {
                if (!state || state.userPaused || !interactionEnabled(state)) return null;
                var auto = state.swiper.autoplay, value = state.interaction;
                if (!value && !auto.running && !auto.paused) return null;
                if (!value) {
                    value = {
                        paused: true, until: 0, timer: null, pointers: {}, keys: {}, composing: false,
                        dragging: false, snapshot: countdownSnapshot(state)
                    };
                    state.interaction = value;
                }
                value.until = Date.now() + interactionIdle;
                if (auto.running || auto.paused) { stop(state); controls(state); }
                armInteraction(state);
                return value;
            }
            function interactionEvent(event) {
                var type = event.type, target = event.target;
                var state = contentState(target), value, changed, i, j;
                var key = event.code || event.key || String(event.keyCode || '');
                var pointer = event.pointerId === undefined ? 'mouse' : String(event.pointerId);
                var moving = /^(pointermove|mousemove|touchmove|drag)$/.test(type);
                var release = /^(pointerup|pointercancel|mouseup|touchend|touchcancel|keyup|compositionend|dragend|drop)$/.test(type);
                if (moving || release) {
                    for (i = 0; i < roots.length; i += 1) {
                        value = roots[i].interaction;
                        if (!value) continue;
                        changed = false;
                        if (/^(pointermove|mousemove|pointerup|pointercancel|mouseup)$/.test(type) && value.pointers[pointer]) {
                            if (release || (typeof event.buttons === 'number' && event.buttons === 0)) delete value.pointers[pointer];
                            changed = true;
                        }
                        if (event.changedTouches) {
                            for (j = 0; j < event.changedTouches.length; j += 1) {
                                var touch = 'touch' + event.changedTouches[j].identifier;
                                if (value.pointers[touch]) { if (release) delete value.pointers[touch]; changed = true; }
                            }
                        }
                        if (type === 'keyup' && value.keys[key]) { delete value.keys[key]; changed = true; }
                        if (type === 'compositionend' && value.composing) { value.composing = false; changed = true; }
                        if (/^(drag|dragend|drop)$/.test(type) && value.dragging) {
                            if (release) { value.dragging = false; value.pointers = {}; }
                            changed = true;
                        }
                        if (changed) { value.until = Date.now() + interactionIdle; armInteraction(roots[i]); }
                    }
                    return;
                }
                if (!state || (/^(pointerdown|mousedown)$/.test(type) && event.button > 0)) return;
                if (type === 'keydown' && /^(Shift|Control|Alt|Meta|CapsLock)/.test(key)) return;
                value = touchInteraction(state);
                if (!value) return;
                if (/^(pointerdown|mousedown)$/.test(type)) value.pointers[pointer] = true;
                if (type === 'touchstart') {
                    for (i = 0; i < event.changedTouches.length; i += 1) value.pointers['touch' + event.changedTouches[i].identifier] = true;
                }
                if (type === 'keydown') value.keys[key] = true;
                if (type === 'compositionstart') value.composing = true;
                if (type === 'dragstart') value.dragging = true;
                armInteraction(state);
            }
            function interactionVisibility() {
                roots.forEach(function (state) {
                    var value = state.interaction;
                    if (!value) return;
                    value.pointers = {}; value.keys = {}; value.composing = false; value.dragging = false;
                    value.until = Date.now() + interactionIdle;
                    armInteraction(state);
                });
            }
            function watchInteraction() {
                var names = ['click', 'keydown', 'keyup', 'input', 'change', 'wheel', 'compositionstart', 'compositionend', 'dragstart', 'drag', 'dragend', 'drop'];
                names = names.concat(win.PointerEvent ?
                    ['pointerdown', 'pointerup', 'pointercancel', 'pointermove'] :
                    ['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchmove', 'touchend', 'touchcancel']);
                names.forEach(function (name) { doc.addEventListener(name, interactionEvent, { capture: true, passive: true }); });
                doc.addEventListener('visibilitychange', interactionVisibility, true);
                ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (name) {
                    doc.addEventListener(name, interactionVisibility, true);
                });
                win.addEventListener('blur', function () {
                    roots.forEach(function (state) {
                        if (!state.interaction) return;
                        state.interaction.pointers = {}; state.interaction.keys = {}; state.interaction.dragging = false;
                        armInteraction(state);
                    });
                }, false);
            }
            installInteractionPolicy();
            function connect(state, sw) {
                if (!sw || sw.destroyed || state.swiper === sw) return;
                if (state.swiper) disconnect(state);
                state.swiper = sw;
                noHoverPause(sw);
                state.guards = [];
                ['start', 'run', 'resume'].forEach(function (name) {
                    var original = sw.autoplay && sw.autoplay[name];
                    if (typeof original !== 'function') return;
                    var guard = function () {
                        if (locked(state)) return false;
                        if (name === 'start' && sw.autoplay.running) return false;
                        return original.apply(this, arguments);
                    };
                    state.guards.push({ name: name, original: original, guard: guard });
                    sw.autoplay[name] = guard;
                });
                events.forEach(function (name) { sw.on(name, state.schedule); });
                state.onCountdownSlide = function () {
                    if (state.interaction) state.interaction.snapshot = null;
                    state.manualCountdown = null;
                };
                sw.on('slideChange', state.onCountdownSlide);
                // hover 해제 시 SDK가 별도 타이머를 재개하더라도 조작/수동 정지를 우선한다.
                state.onAutoResume = function () {
                    if (!locked(state)) return;
                    win.clearTimeout(state.interactionGuardTimer);
                    state.interactionGuardTimer = win.setTimeout(function () {
                        if (state.swiper === sw && !sw.destroyed && locked(state)) {
                            sw.autoplay.running = true;
                            stop(state);
                        }
                    }, 0);
                };
                sw.on('autoplayResume', state.onAutoResume);
                state.onDestroy = function () { clearInteraction(state); disconnect(state); };
                sw.on('destroy', state.onDestroy);
                if (win.NewCarouselLine) win.NewCarouselLine.bind(sw, state.root);
                if (locked(state)) stop(state);
            }
            function disconnect(state) {
                var sw = state.swiper;
                if (!sw) return;
                events.forEach(function (name) { sw.off(name, state.schedule); });
                sw.off('destroy', state.onDestroy);
                sw.off('slideChange', state.onCountdownSlide);
                sw.off('autoplayResume', state.onAutoResume);
                win.clearTimeout(state.interactionGuardTimer);
                (state.guards || []).forEach(function (item) { if (sw.autoplay[item.name] === item.guard) sw.autoplay[item.name] = item.original; });
                clearInteraction(state);
                state.manualCountdown = null;
                state.swiper = null;
                state.component = null;
            }
            function attach(root, sw, component) {
                if (!root || !matches(root, '.rvmp-cmpnt[class*="cmpnt-new-"]')) return null;
                var state = root.__ncSupport;
                if (!state) {
                    state = { root: root, swiper: null, component: null, userPaused: false, queued: false, observed: [], measuring: false };
                    root.__ncSupport = state;
                    roots.push(state);
                    state.schedule = function () { if (!state.queued) { state.queued = true; raf(function () { run(state); }); } };
                    // 재생·정지 클릭만 한 번 처리한다. 영상·불릿·화살표 이벤트는 유지한다.
                    state.click = function (event) {
                        var button = closest(event.target, '.swiper-button-play, .swiper-button-stop', root);
                        if (!button || !closest(button, '.page-area', root) || closest(button, '.visual-area', root)) return;
                        var current = state.swiper;
                        if (!current || current.destroyed || !current.autoplay) return;
                        if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        var pause = matches(button, '.swiper-button-stop');
                        var snapshot = state.interaction ? state.interaction.snapshot : state.manualCountdown;
                        if (pause && !state.interaction) snapshot = countdownSnapshot(state);
                        clearInteraction(state);
                        state.userPaused = pause;
                        state.manualCountdown = pause ? snapshot : null;
                        state.lastControl = { action: state.userPaused ? 'pause' : 'play', time: Date.now() };
                        if (state.component) state.component.__userAutoplayPaused = state.userPaused;
                        var focus = doc.activeElement === button;
                        if (state.userPaused) stop(state);
                        else resumeCountdown(state, snapshot);
                        controls(state);
                        if (focus) {
                            var next = root.querySelector('.page-area .swiper-button-play:not(:disabled), .page-area .swiper-button-stop:not(:disabled)');
                            if (next) { try { next.focus({ preventScroll: true }); } catch (e) { next.focus(); } }
                        }
                        state.schedule();
                    };
                    root.addEventListener('click', state.click, true);
                    mediaEvents.forEach(function (name) { root.addEventListener(name, state.schedule, true); });
                    win.addEventListener('resize', state.schedule, false);
                    if (win.ResizeObserver) { state.ro = new win.ResizeObserver(state.schedule); state.ro.observe(root); }
                    if (win.MutationObserver) {
                        state.mo = new win.MutationObserver(function (records) {
                            for (var i = 0; i < records.length; i += 1) {
                                var node = records[i].target;
                                // line 채움 변화만으로 높이를 다시 계산하지 않는다.
                                if (matches(node, '.seg-fill, .swiper-pagination-bullet')) continue;
                                state.schedule(); return;
                            }
                        });
                        state.mo.observe(root, {
                            childList: true, subtree: true, characterData: true, attributes: true,
                            attributeFilter: ['style', 'class', 'src', 'srcset', 'media', 'width', 'height', 'disabled', 'data-indicator-theme-pc', 'data-indicator-theme-mobile', 'data-indicator-show-pc', 'data-indicator-show-mobile', 'data-indicator-pc', 'data-indicator-mobile']
                        });
                    }
                    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(state.schedule);
                }
                connect(state, sw);
                if (component) { state.component = component; component.__userAutoplayPaused = state.userPaused; }
                state.schedule();
                return state;
            }
            function run(state) {
                state.queued = false;
                if (!doc.documentElement.contains(state.root)) {
                    if (state.component && state.swiper && !state.swiper.destroyed) state.swiper.destroy(true, true);
                    clearInteraction(state);
                    disconnect(state);
                    releaseRoot(state.root);
                    if (state.mo) state.mo.disconnect();
                    if (state.ro) state.ro.disconnect();
                    state.root.removeEventListener('click', state.click, true);
                    mediaEvents.forEach(function (name) { state.root.removeEventListener(name, state.schedule, true); });
                    win.removeEventListener('resize', state.schedule, false);
                    roots.splice(roots.indexOf(state), 1);
                    delete state.root.__ncSupport;
                    return;
                }
                var box = boxOf(state.root);
                if (box) connect(state, box.swiper);
                activeHeight(state);
                controls(state);
            }
            function boot() {
                var list = doc.querySelectorAll('.rvmp-cmpnt[class*="cmpnt-new-"]');
                for (var i = 0; i < list.length; i += 1) { var box = boxOf(list[i]); attach(list[i], box && box.swiper); }
            }
            function watchComponents() {
                if (!win.MutationObserver || !doc.body) return;
                var pending = false;
                var observer = new win.MutationObserver(function (records) {
                    var changed = false;
                    for (var i = 0; i < records.length && !changed; i += 1) {
                        var nodes = records[i].addedNodes;
                        for (var j = 0; j < nodes.length; j += 1) {
                            var node = nodes[j];
                            if (node.nodeType === 1 && (matches(node, '.rvmp-cmpnt[class*="cmpnt-new-"]') || node.querySelector('.rvmp-cmpnt[class*="cmpnt-new-"]'))) {
                                changed = true;
                                break;
                            }
                        }
                    }
                    for (var k = 0; k < roots.length; k += 1) {
                        if (!doc.documentElement.contains(roots[k].root)) roots[k].schedule();
                    }
                    if (!changed || pending) return;
                    pending = true;
                    raf(function () { pending = false; boot(); });
                });
                observer.observe(doc.body, { childList: true, subtree: true });
            }
            // BO: 주소 끝 #carousel-debug. 진단 표시·저장만 수행하며 재생 상태는 변경하지 않음.
            function inspect() {
                function dimensions(node) {
                    if (!node) return null;
                    var st = win.getComputedStyle(node);
                    return {
                        tag: node.tagName, id: node.id, classes: node.className,
                        offsetWidth: node.offsetWidth, offsetHeight: node.offsetHeight,
                        height: st.height, minHeight: st.minHeight, blockSize: st.blockSize,
                        position: st.position, display: st.display, aspectRatio: st.aspectRatio, inlineStyle: node.getAttribute('style') || '',
                        visibility: st.visibility, opacity: st.opacity, pointerEvents: st.pointerEvents, zIndex: st.zIndex
                    };
                }
                return {
                    version: '2026-10-14.clean-styles.1',
                    environment: {
                        swiper: typeof win.Swiper, kvVideoPlayer: typeof win.kvVideoPlayer,
                        viewport: [win.innerWidth, win.innerHeight]
                    },
                    styles: Array.prototype.map.call(doc.querySelectorAll('link[rel="stylesheet"]'), function (link) {
                        return { href: link.getAttribute('href'), sheetAttached: !!link.sheet };
                    }),
                    carousels: roots.map(function (state) {
                        var sw = state.swiper;
                        return {
                            id: state.root.id, userPaused: state.userPaused,
                            interactionPaused: !!(state.interaction && state.interaction.paused),
                            interactionIdleMs: interactionIdle,
                            interactionRemainingMs: state.interaction ? Math.max(0, state.interaction.until - Date.now()) : 0,
                            lastControl: state.lastControl || null,
                            componentPaused: state.component ? state.component.__userAutoplayPaused : null,
                            swiperReady: !!sw && !sw.destroyed, activeIndex: sw ? sw.activeIndex : null,
                            autoplayRunning: sw && sw.autoplay ? sw.autoplay.running : null,
                            wrapper: dimensions(sw && (sw.wrapperEl || (sw.$wrapperEl && sw.$wrapperEl[0]))),
                            bulletCount: state.root.querySelectorAll('.swiper-pagination-bullet').length,
                            slides: Array.prototype.map.call(state.root.querySelectorAll('.swiper-wrapper > .kvItem'), function (slide) {
                                return {
                                    slide: dimensions(slide), visual: dimensions(slide.querySelector('.visual-area')),
                                    videoButton: dimensions(slide.querySelector('.kvVideoBtn')),
                                    videoBox: dimensions(slide.querySelector('.kvVideo')),
                                    target: dimensions(slide.querySelector('.kvVideo .target')),
                                    preview: dimensions(slide.querySelector('.previewBox')),
                                    media: Array.prototype.map.call(slide.querySelectorAll('img, video, iframe'), function (node) {
                                        var item = dimensions(node);
                                        item.naturalSize = [node.naturalWidth || node.videoWidth || 0, node.naturalHeight || node.videoHeight || 0];
                                        if (matches(node, 'video')) {
                                            item.paused = node.paused; item.currentTime = node.currentTime;
                                            item.readyState = node.readyState; item.errorCode = node.error ? node.error.code : null;
                                        }
                                        return item;
                                    })
                                };
                            }),
                            controls: Array.prototype.map.call(state.root.querySelectorAll('.page-area .swiper-button-play, .page-area .swiper-button-stop'), function (node) {
                                return {
                                    action: matches(node, '.swiper-button-play') ? 'play' : 'pause', disabled: node.disabled,
                                    visible: win.getComputedStyle(node).display !== 'none'
                                };
                            })
                        };
                    })
                };
            }
            function diagnostics() {
                var debug = win.location.hash === '#carousel-debug';
                var panel = doc.getElementById('newCarouselDiagnostics');
                if (!debug) { if (panel) panel.hidden = true; return; }
                if (!panel) {
                    panel = doc.createElement('details');
                    panel.id = 'newCarouselDiagnostics';
                    panel.open = true;
                    panel.style.cssText = 'margin:16px;padding:16px;border:1px solid #ccc;background:#fff;color:#111;font:14px/1.5 sans-serif;';
                    panel.innerHTML = '<summary>캐러셀 진단</summary><p>현재 재생 상태와 높이, 공통 리소스 연결 상태를 확인합니다.</p>' +
                        '<button type="button" name="refresh">진단 갱신</button> ' +
                        '<button type="button" name="save">진단 저장</button>' +
                        '<textarea readonly aria-label="캐러셀 진단 결과" style="display:block;width:100%;height:240px;margin-top:12px;font:12px/1.5 monospace"></textarea>';
                    doc.body.appendChild(panel);
                    panel.addEventListener('click', function (event) {
                        var action = event.target.tagName === 'BUTTON' ? event.target.name : '';
                        if (!action) return;
                        var report = inspect();
                        if (action === 'save') {
                            // 사용자 저장 시에만 실제 공통 재생 함수도 담는다. 네트워크 전송은 하지 않는다.
                            report.playerApi = {};
                            ['create', 'videoPlay', 'videoStop', 'showPreview', 'hidePreview'].forEach(function (name) {
                                var fn = win.kvVideoPlayer && win.kvVideoPlayer[name];
                                if (typeof fn === 'function') report.playerApi[name] = String(fn);
                            });
                        }
                        var text = JSON.stringify(report, null, 2);
                        panel.querySelector('textarea').value = text;
                        if (action === 'save' && win.URL && win.URL.createObjectURL) {
                            var url = win.URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
                            var link = doc.createElement('a');
                            link.href = url; link.download = 'carousel-diagnostics.json';
                            doc.body.appendChild(link); link.click(); doc.body.removeChild(link);
                            win.setTimeout(function () { win.URL.revokeObjectURL(url); }, 1000);
                        }
                    });
                }
                panel.hidden = false;
                panel.querySelector('textarea').value = JSON.stringify(inspect(), null, 2);
            }
            win.NewCarouselSupport = { attach: attach, refresh: boot, inspect: inspect };
            win.addEventListener('hashchange', diagnostics, false);
            if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', diagnostics, false); else diagnostics();

            watchInteraction();
            function ready() { boot(); watchComponents(); }
            if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ready, false); else ready();
            win.addEventListener('load', boot, false);
        })(window, document);

        (function (win, doc) {
            'use strict';
            function bind(swiper, root) {
                if (!swiper || !swiper.on || swiper.__ncLineBound) return;
                var page = root.querySelector('.page-area');
                if (!page) return;
                swiper.__ncLineBound = true;
                var completed = [];
                var current = -1;
                var outgoing = -1;
                var wrapped = false;
                var amount = 0;
                var remaining = 0;
                var started = 0;
                var ticking = false;
                var pending = true;
                var dragging = false;
                var queued = false;
                var disposed = false;
                var observer;
                var handlers = [];
                function now() { return win.performance && win.performance.now ? win.performance.now() : Date.now(); }
                function line() { return page.getAttribute('data-indicator-type') === 'line'; }
                function bullets() { return page.querySelectorAll('.swiper-pagination-bullet'); }
                function delay() {
                    var slide = swiper.slides && swiper.slides[swiper.activeIndex];
                    var value = slide && Number(slide.getAttribute('data-swiper-autoplay'));
                    if (!(value > 0)) value = Number(swiper.params.autoplay && swiper.params.autoplay.delay);
                    return value > 0 ? value : 3000;
                }
                function index() {
                    var count = bullets().length;
                    var group = Number(swiper.params.slidesPerGroup) || 1;
                    var value = swiper.params.loop ? Math.floor((Number(swiper.realIndex) || 0) / group) :
                        (typeof swiper.snapIndex === 'number' ? swiper.snapIndex : Math.floor((Number(swiper.activeIndex) || 0) / group));
                    return count ? Math.max(0, Math.min(count - 1, value)) : -1;
                }
                function allowed() {
                    return !!(swiper.autoplay && swiper.autoplay.running) &&
                        !(root.__ncSupport && root.__ncSupport.userPaused);
                }
                function left() { return ticking ? Math.max(0, remaining - (now() - started)) : remaining; }
                function progress() {
                    if (!ticking || remaining <= 0) return amount;
                    return Math.min(1, amount + (1 - amount) * (1 - left() / remaining));
                }
                function freeze() {
                    var value = progress();
                    remaining = left();
                    amount = value;
                    ticking = false;
                }
                function start(reset) {
                    if (reset) { amount = 0; remaining = delay(); }
                    started = now();
                    ticking = remaining > 0;
                    pending = false;
                }
                var clock = {
                    capture: function () {
                        changed(); freeze();
                        var auto = swiper.autoplay;
                        if (auto && typeof auto.timeLeft === 'number' && isFinite(auto.timeLeft) && auto.timeLeft >= 0 &&
                            !pending && !swiper.animating && auto.running) {
                            remaining = Math.max(0, auto.timeLeft);
                            amount = Math.max(0, Math.min(1, 1 - remaining / delay()));
                        }
                        render();
                        return { slide: swiper.slides && swiper.slides[swiper.activeIndex], amount: amount, remaining: remaining };
                    }
                };
                swiper.__ncLineClock = clock;
                function changed() {
                    var next = index();
                    if (next < 0 || next === current) return;
                    outgoing = current;
                    wrapped = current === bullets().length - 1 && next === 0;
                    // 한 바퀴 뒤 첫 슬라이드로 돌아오면 완료 이력을 초기화한다.
                    if (wrapped) completed = [];
                    else if (current >= 0) completed[current] = true;
                    current = next;
                    completed[current] = false;
                    amount = 0;
                    remaining = delay();
                    ticking = false;
                    pending = true;
                }
                function render() {
                    var list = bullets();
                    var value = progress();
                    var duration = left();
                    var fill;
                    var activeFill = null;
                    var i;
                    page.classList.toggle('is-paused', line() && (!allowed() || (!ticking && !pending)));
                    if (!line()) return;
                    if (page.style.getPropertyValue('--seg-time') !== delay() + 'ms') page.style.setProperty('--seg-time', delay() + 'ms');
                    for (i = 0; i < list.length; i += 1) {
                        fill = list[i].querySelector('.seg-fill');
                        if (!fill) {
                            fill = doc.createElement('span');
                            fill.className = 'seg-fill';
                            fill.setAttribute('aria-hidden', 'true');
                            list[i].appendChild(fill);
                        }
                        list[i].classList.toggle('is-complete', i < current);
                        fill.classList.remove('go');
                        fill.style.transition = 'none';
                        fill.style.width = (i < current ? 100 : (i === current ? value * 100 : 0)) + '%';
                        if (i === current) activeFill = fill;
                    }
                    if (activeFill && ticking && allowed() && duration > 0) {
                        void activeFill.offsetWidth;
                        activeFill.style.transition = 'width ' + duration + 'ms linear';
                        activeFill.style.width = '100%';
                        activeFill.classList.add('go');
                    }
                }
                function sync() {
                    queued = false;
                    if (disposed || swiper.destroyed) return;
                    changed();
                    if (!allowed() || doc.hidden || dragging || swiper.autoplay.paused) freeze();
                    else if (!ticking && !swiper.animating && !swiper.autoplay.paused) start(pending);
                    render();
                }
                function schedule() {
                    if (queued || disposed) return;
                    queued = true;
                    (win.requestAnimationFrame || function (fn) { return win.setTimeout(fn, 16); })(sync);
                }
                function on(name, fn) { swiper.on(name, fn); handlers.push([name, fn]); }
                on('slideChange', function () { changed(); schedule(); });
                on('autoplay', function () {
                    // 이동은 기존 Swiper가 담당한다. 완료된 구간의 표시만 보존한다.
                    if (!wrapped && outgoing >= 0 && outgoing !== current) completed[outgoing] = true;
                    outgoing = -1;
                    schedule();
                });
                on('transitionEnd', function () {
                    changed();
                    if (pending && allowed() && !swiper.autoplay.paused && !doc.hidden && !dragging) start(true);
                    schedule();
                });
                on('autoplayStart', function () {
                    changed();
                    var saved = swiper.__ncResumeCountdown;
                    var resume = saved && saved.slide === (swiper.slides && swiper.slides[swiper.activeIndex]);
                    amount = resume ? saved.amount : 0;
                    remaining = resume ? saved.remaining : delay();
                    ticking = false; pending = !resume;
                    if (!swiper.animating && !doc.hidden && !dragging) start(!resume);
                    schedule();
                });
                on('autoplayStop', function () { freeze(); pending = false; schedule(); });
                on('autoplayPause', function () { freeze(); schedule(); });
                on('autoplayResume', function () {
                    changed();
                    if (allowed() && !doc.hidden && !dragging) start(pending);
                    schedule();
                });
                on('sliderFirstMove', function () { dragging = true; freeze(); schedule(); });
                on('touchEnd', function () { dragging = false; changed(); schedule(); });
                ['paginationRender', 'paginationUpdate', 'breakpoint', 'resize', 'update', 'observerUpdate'].forEach(function (name) { on(name, schedule); });
                function visibility() {
                    if (doc.hidden) freeze();
                    else pending = true;
                    schedule();
                }
                doc.addEventListener('visibilitychange', visibility, false);
                if (win.MutationObserver) {
                    observer = new win.MutationObserver(function (records) {
                        for (var i = 0; i < records.length; i += 1) {
                            if (records[i].type === 'attributes' || records[i].target === page ||
                                (records[i].target.classList && records[i].target.classList.contains('swiper-pagination'))) {
                                schedule(); return;
                            }
                        }
                    });
                    observer.observe(page, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-indicator-type'] });
                }
                function destroy() {
                    disposed = true;
                    if (observer) observer.disconnect();
                    doc.removeEventListener('visibilitychange', visibility, false);
                    for (var i = 0; i < handlers.length; i += 1) swiper.off(handlers[i][0], handlers[i][1]);
                    swiper.off('destroy', destroy);
                    if (swiper.__ncLineClock === clock) delete swiper.__ncLineClock;
                    delete swiper.__ncLineBound;
                }
                swiper.on('destroy', destroy);
                changed();
                if (allowed() && !swiper.animating && !doc.hidden) start(true);
                schedule();
            }
            win.NewCarouselLine = { bind: bind };
        })(window, document);


        (function (win, doc) {
            'use strict';
            function bind(root) {
                if (root.__ncIndicatorPosition) return;
                var box = root.querySelector('.list-area > .swiper-container');
                if (!box) return;
                root.__ncIndicatorPosition = true;
                var page = null, swiper = null, queued = false, disposed = false;
                var observer, resizeObserver, observedVisual = null, observedArrows = [];
                var events = ['slideChange', 'transitionEnd', 'resize', 'breakpoint', 'update', 'observerUpdate', 'imagesReady', 'paginationRender'];
                function write(node, name, value) {
                    var current = node.style.getPropertyValue(name);
                    var priority = node.style.getPropertyPriority(name);
                    if (current === value && !priority) return;
                    var store = node.__ncPositionStyles || (node.__ncPositionStyles = {});
                    if (!store[name]) store[name] = { value: current, priority: priority };
                    if (value) node.style.setProperty(name, value);
                    else node.style.removeProperty(name);
                    store[name].written = node.style.getPropertyValue(name);
                }
                function restore(node) {
                    if (!node) return;
                    var store = node.__ncPositionStyles || {};
                    Object.keys(store).forEach(function (name) {
                        var old = store[name];
                        if (node.style.getPropertyValue(name) !== old.written || node.style.getPropertyPriority(name)) return;
                        if (old.value) node.style.setProperty(name, old.value, old.priority);
                        else node.style.removeProperty(name);
                    });
                    delete node.__ncPositionStyles;
                    if (node.hasAttribute('style') && !node.style.length) node.removeAttribute('style');
                }
                function schedule() {
                    if (queued || disposed) return;
                    queued = true;
                    (win.requestAnimationFrame || function (fn) { return win.setTimeout(fn, 16); })(update);
                }
                function connect(next) {
                    if (next === swiper) return;
                    if (swiper && swiper.off) events.forEach(function (name) { swiper.off(name, schedule); });
                    swiper = next;
                    if (swiper && swiper.on) events.forEach(function (name) { swiper.on(name, schedule); });
                }
                function scaleOf(host) {
                    var rect = host.getBoundingClientRect();
                    var scale = host.offsetHeight ? rect.height / host.offsetHeight : host.offsetWidth ? rect.width / host.offsetWidth : 1;
                    return scale > 0 ? scale : 1;
                }
                function centerAt(node, y) {
                    write(node, 'position', 'absolute');
                    write(node, 'bottom', 'auto');
                    if (node === page) {
                        if (node.style.getPropertyValue('top')) write(node, 'top', '');
                    } else {
                        write(node, 'top', 'var(--nc-control-top, 0px)');
                    }
                    var top = win.getComputedStyle(node).top;
                    if (!/^-?[\d.]+px$/.test(top)) { write(node, '--nc-control-top', '0px'); top = '0px'; }
                    var rect = node.getBoundingClientRect();
                    var host = node.offsetParent || box;
                    var offset = (y - rect.top - rect.height / 2) / scaleOf(host);
                    if (Math.abs(offset) > 0.05) write(node, '--nc-control-top', Math.round((parseFloat(top) + offset) * 100) / 100 + 'px');
                }
                function watchPage(next) {
                    if (page === next) return;
                    if (page) {
                        restore(page);
                        if (resizeObserver) resizeObserver.unobserve(page);
                    }
                    page = next;
                    if (page && resizeObserver) resizeObserver.observe(page);
                }
                function update() {
                    queued = false;
                    if (disposed) return;
                    if (!doc.documentElement.contains(root)) { dispose(); return; }
                    watchPage(root.querySelector('.page-area'));
                    connect(box.swiper && !box.swiper.destroyed ? box.swiper : null);
                    var slide = swiper && swiper.slides && swiper.slides[swiper.activeIndex];
                    var visual = slide && slide.querySelector('.visual-area');
                    if (resizeObserver && observedVisual !== visual) {
                        if (observedVisual) resizeObserver.unobserve(observedVisual);
                        if (visual) resizeObserver.observe(visual);
                        observedVisual = visual;
                    }
                    var arrows = root.querySelectorAll('.ctrl-area .swiper-button-prev, .ctrl-area .swiper-button-next');
                    var rect = visual && visual.getBoundingClientRect();
                    var usable = rect && rect.width > 0 && rect.height > 0;
                    for (var i = 0; i < arrows.length; i += 1) {
                        var arrow = arrows[i];
                        if (resizeObserver && observedArrows.indexOf(arrow) === -1) {
                            observedArrows.push(arrow); resizeObserver.observe(arrow);
                        }
                        if (!usable) { restore(arrow); continue; }
                        if (arrow.getClientRects().length && arrow.offsetHeight > 0) centerAt(arrow, rect.top + rect.height / 2);
                    }
                    if (!page) return;
                    // 위치 미지정은 원본 공통 CSS를 그대로 사용한다. 명시한 inner/outer만 보정한다.
                    var mode = page.getAttribute('data-indicator-position');
                    if (mode !== 'inner' || !usable || !page.offsetHeight) {
                        restore(page);
                        return;
                    }
                    var gap = parseFloat(win.getComputedStyle(page).getPropertyValue('--nc-indicator-gap'));
                    if (!isFinite(gap) || gap < 0) gap = 24;
                    var pageRect = page.getBoundingClientRect();
                    var scale = scaleOf(page.offsetParent || box);
                    var y = Math.max(rect.top + pageRect.height / 2, rect.bottom - gap * scale - pageRect.height / 2);
                    centerAt(page, y);
                }
                function dispose() {
                    disposed = true;
                    connect(null);
                    restore(page);
                    observedArrows.forEach(restore);
                    if (observer) observer.disconnect();
                    if (resizeObserver) resizeObserver.disconnect();
                    root.removeEventListener('load', schedule, true);
                    root.removeEventListener('loadedmetadata', schedule, true);
                    win.removeEventListener('resize', schedule, false);
                    delete root.__ncIndicatorPosition;
                }
                if (win.ResizeObserver) { resizeObserver = new win.ResizeObserver(schedule); resizeObserver.observe(box); }
                if (win.MutationObserver) {
                    observer = new win.MutationObserver(function (records) {
                        for (var i = 0; i < records.length; i += 1) {
                            var node = records[i].target;
                            if (node.nodeType === 1 && node.matches && node.matches('.seg-fill, .swiper-pagination-bullet')) continue;
                            schedule(); return;
                        }
                    });
                    observer.observe(root, {
                        childList: true, subtree: true, attributes: true,
                        attributeFilter: ['style', 'class', 'data-indicator-position', 'data-indicator-pc', 'data-indicator-mobile', 'data-arrow-pc', 'data-arrow-mobile']
                    });
                }
                root.addEventListener('load', schedule, true);
                root.addEventListener('loadedmetadata', schedule, true);
                win.addEventListener('resize', schedule, false);
                schedule();
            }
            function boot() {
                var roots = doc.querySelectorAll('.rvmp-cmpnt[class*="cmpnt-new-"]');
                for (var i = 0; i < roots.length; i += 1) bind(roots[i]);
            }
            if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, false);
            else boot();
            win.addEventListener('load', boot, false);
        })(window, document);

    }
});

}());
