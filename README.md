# 삼성 공통 컴포넌트 퍼블 검토본

원본 첨부 파일은 수정하지 않았다. 저장소의 기존 revamp 파일명을 유지해 반영했다. 최신 carousel을 기준으로 세 페이지를 같은 폴더에 정리했다. 별도 기획서 원문은 제공되지 않았으므로 기존 HTML의 BO 매핑 주석과 이번 요청을 기준으로 작성했다.

## 파일과 로드 순서

- `revamp-new-carousel.html`: 기존 carousel 마크업과 6개 영상 생성 호출 유지.
- `revamp-new-column.html`: 2열 및 기존 모바일 Swiper 옵션 유지.
- `revamp-new-benefit-card.html`: 3열 및 autoplay:false 유지. 전달받은 파일명 유지.
- `style.css`: 세 타입 공통 스타일. 파생 페이지에 누락된 스타일 연결과 jQuery 의존성 보완.
- 리소스 주소는 원본처럼 `/sec/...` 및 `//images.samsung.com/...` 형태다. HTML에 추가했던 삼성 본사이트 절대 도메인은 제거했다.
- 각 HTML 내부 공통 블록 → 영상 블록 → 호출 블록 순서. `async` 사용 금지.

각 HTML은 공통 블록 → 영상 블록 → 호출 블록 순서다. 호출 블록은 DOMContentLoaded 콜백을 먼저 등록한 직후 `NewCarouselSetup.common()`과 `NewCarouselSetup.video()`를 호출한다. 각 콜백 안에서 영상 생성 → `initComponentSwiper()` → `refreshComponentSwiper()` 순서를 유지한다. 여러 컴포넌트를 한 페이지에 배치할 때 공통/영상 블록은 페이지에 한 번씩 포함하고 section id와 영상 id를 각각 고유하게 생성한다. Setup 객체는 중복 설치 방지 상태를 보존하므로 삭제하지 않는다.

## BO indicator 적용

각 컴포넌트의 `.page-area`에 설정한다.

```html
<div class="page-area"
     data-indicator-theme-pc="dot"
     data-indicator-theme-mobile="line"
     data-indicator-show-pc="show"
     data-indicator-show-mobile="show"
     data-indicator-color="white"
     data-indicator-position="outer">
    <div class="swiper-pagination"></div>
</div>
```

테마는 `dot | line`, 표시 여부는 `show | hide`다. 위치 `inner | outer`는 테마와 별개다. 기존 carousel의 `theme-mobile="inner"`는 잘못된 테마 값이므로 원래 dot 표시를 유지하는 `dot`으로 정리했다. 현재 carousel 샘플은 PC line / Mobile dot으로 설정했다. column과 bentfit 기본값은 dot을 유지한다. 위 예시처럼 PC와 Mobile을 다르게 지정할 수 있다.

indicator의 기기 구분은 Mobile 800px 이하 / PC 801px 이상이다. 기존 파생 페이지의 Swiper breakpoint 값은 그대로 보존했다. `data-indicator-theme`와 `data-indicator-type`는 스크립트가 현재 기기의 설정을 해석해 생성하는 값이다. BO에서는 `-pc/-mobile` 설정을 출력한다. 구형 `data-indicator-pc/mobile` 표시 속성도 호환한다.

자동 슬라이드는 호출 옵션의 `autoplay:false` 또는 `autoplay:{delay:3000, disableOnInteraction:false, pauseOnMouseEnter:false}`로 지정한다. 기존의 조작 후 3초 대기 및 남은 시간부터 재개하는 정책을 유지한다. 개별 영상의 Auto/Loop는 슬라이드 자동 전환과 별개다.

## 정리한 반복 실행

- 파일 중복 로드, Setup 재호출, init 재호출 시 이벤트/Swiper 중복 생성 방지.
- 같은 프레임의 refresh 요청을 한 번으로 합침.
- 같은 영상 전환에서 반복 발생하는 정지 이벤트를 합침. 활성 영상 초기화 타이머는 영상 모듈이 관리.
- 전환·수동 조작 후 이전 지연 재생/표시 보정이 실행되지 않도록 활성 슬라이드와 요청 버전 확인.
- 영상 target 자체가 video/iframe/Brightcove player인 경우에도 정지·표시 복구 대상에 포함.
- 기존 Swiper 연결 경로의 `root - closest(...)` 오타 수정.
- 컴포넌트 제거/destroy 시 Swiper 참조·이벤트·관찰·타이머 정리.
- 중첩 `.bundle-area > .visual-area`를 높이 보정 대상으로 포함. iframe 높이를 지웠다 다시 쓰는 반복 관찰 방지.
- CSS의 동일 아이콘 정의·중복 선언 제거. PC/Mobile show/hide 우선순위와 line 진행률 스타일 연결 보완.

## 검토 환경 전용 영상 호환

`preview-media-compat.css/js`와 section의 `data-preview-media-compat="on"`은 외부 검토 환경용이다. 기존 PC/Mobile preview 이미지 비율과 모바일 최소 높이를 유지하면서 `.kvVideo`, video, YouTube iframe, Brightcove player/tech를 외곽에 맞춘다. 영상 URL·재생/중지·preview 표시 상태는 바꾸지 않는다. fullscreen 상태는 보정에서 제외한다.

운영 전달 시 두 파일 및 root 플래그를 제외하고 내부망의 원래 의존성으로 검증한다. 이 보정은 원본 영상/인증/외부 서비스 접근 문제를 해결하는 코드가 아니다.

## 전달 구성

실제 적용에 필요한 파일은 HTML 3개와 `style.css`이며, 삼성 공통 리소스 의존성은 각 HTML에 그대로 연결되어 있다. 공통·영상 로직은 HTML 안에 포함되어 별도 `common.js` 또는 `video.js` 파일을 전달하지 않는다. `preview-media-compat.css/js`와 `data-preview-media-compat`는 검토 환경용이므로 내부망 검증 후 운영 전달에서 제외한다.

## 전달 구성

실제 적용에 필요한 파일은 HTML 3개와 `style.css`, 각 HTML에 연결된 삼성 공통 CSS/JS 리소스다. 공통 JS 의존성은 jQuery, jQuery UI, Swiper, `base.js`, `newComponent.js`이며 페이지 내에 그대로 연결되어 있다. 공통·영상 로직은 HTML 안에 포함되어 별도 `common.js` 또는 `video.js` 파일을 전달하지 않는다. `preview-media-compat.css/js`와 `data-preview-media-compat`는 검토 환경용이므로 내부망 검증 후 운영 전달에서 제외한다.

## 검증 결과와 남은 범위

- 세 HTML에서 공통·영상 인라인 블록 6개와 호출 블록 3개를 추출해 `node --check` 실행: 모두 exit 0.
- 앱 내 Chromium에서 회귀 112 PASS / 0 FAIL, 수명·경계 집중 검사 36 PASS / 0 FAIL, 영상 외곽·플레이어 크기 검사 28 PASS / 0 FAIL. 총 176 PASS / 0 FAIL. `docs/verification/`에 JSON 결과와 화면 근거 저장.
- 1440/390px에서 제목 및 카드 영역의 원본 스크립트 비교, 열 수/간격, indicator 양방향 테마 변경·기기별 표시, 800/801px 전환, 불릿 이동, 정지 후 refresh, 중복 파일 로드/초기화, 1장→2장 Ajax 갱신, 제거/같은 id 재삽입을 검사했다.
- 6개 영상 슬라이드의 실제 플레이어와 visual 크기 일치를 PC/Mobile에서 확인. 정지 상태 450ms 동안 DOM mutation 0~2회로 무한 반복 징후가 없었다. 이 측정은 장기 성능 보증이 아니다.
- 외곽 크기 추가 비교에서는 PC의 원본 영상 영역이 150/152/16px로 접히는 현상을 확인했다. 이 6개 영역은 preview 원본 비율로 복구하는 것이 요청된 수정 범위다. 모바일 8개 슬라이드와 PC의 영상 외 슬라이드는 기존 외곽을 보존하도록 별도로 확인했다. 모바일 최소 높이가 비율과 결합해 가로폭을 밀어내지 않도록 100% 폭 제한을 추가했다.
- 실제 브라우저 클릭으로 Brightcove readyState=4, paused=false 및 시간 증가, YouTube의 서로 다른 재생 장면을 확인했다. 화면은 PNG 파일에 저장했다.
- 원본 MP4의 PC/Mobile `kdp_dev` URL 모두 외부 HEAD 403. 원본 MP4 재생은 미확인이다. 다른 샘플 영상으로 대체하지 않았다.
- 실제 fullscreen 진입, 터치 단말, 내부망 배포 환경은 미검증이다. Slick 등 기존 외부 공통 스크립트 오류는 요청대로 수정하지 않았다.
- 최초 검사 중 경계 대기 및 진행률 참조 오류를 발견해 수정했다. 합성 click 기반 재생 검사는 실제 사용자 클릭 검증으로 구분했다. 최종 위 수치는 수정 후 다시 실행한 결과다.

미리보기 주소: `http://127.0.0.1:8765/revamp-new-carousel.html`, `/revamp-new-column.html`, `/revamp-new-benefit-card.html`.


로컬 검토 서버는 `/sec/` 요청을 삼성 본사이트에 연결해야 한다. 현재 작업의 검토 서버에서만 이 경로 연결을 제공하며 전달 HTML의 상대경로는 그대로 유지한다. 운영 삼성 도메인에서는 기존 경로를 사용한다.

## 인라인 복원 및 MP4 Auto ON 정지 보완
- 공통/영상 스크립트를 각 HTML에 직접 포함했다. 별도 common.js와 video.js는 필요 없다.
- MP4 Auto ON 버튼은 원본 .kvSlide 위임에 기대지 않고 수동 제어한다. 중지 후 SDK의 지연 재생과 같은 활성 슬라이드의 refresh/resize를 차단하고, 실제 슬라이드 이탈 후 재진입 시 원래 자동재생 정책을 따른다.
- 현재 수정의 검증: 인라인 9개 구문 검사, 브라우저 스모크 21 PASS, MP4 회귀 fixture 12 PASS. 실제 video 요소는 검증용 합성 WebM 콘텐츠로 재생→정지→SDK 재생 요청 차단→수동 재개를 확인했다. 원본 MP4 403과 구분한 검사다.
