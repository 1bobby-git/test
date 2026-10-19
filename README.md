# 삼성 공통 컴포넌트 퍼블 템플릿

실제 적용 파일은 `revamp-new-carousel.html`, `revamp-new-column.html`, `revamp-new-benefit-card.html`, `style.css`다. 원본 첨부 파일은 수정하지 않았다. 각 HTML에 연결된 삼성 공통 CSS/JS 의존성은 그대로 필요하다. 리소스 주소는 `/sec/...`, `//images.samsung.com/...` 형태를 유지한다.

## 로드 및 호출 순서

각 HTML 내부의 `newCarouselCommonScript` → `newCarouselVideoScript` → `newCarouselInitScript` 순서를 유지한다. 별도 common.js/video.js 및 preview-media-compat 파일은 필요 없다. 호출 블록은 DOMContentLoaded 콜백을 등록한 뒤 `NewCarouselSetup.common()`과 `.video()`를 설치한다. 콜백 안에서는 영상 생성 → `initComponentSwiper()` → `refreshComponentSwiper()`를 실행한다. async 로드는 사용하지 않는다.

한 페이지에 여러 컴포넌트를 배치할 때 공통·영상 블록은 한 번씩 포함하고 section/영상 id는 고유하게 출력한다. Ajax 갱신 뒤 `refreshComponentSwiper('#컴포넌트ID')`를 호출한다. Setup 객체는 중복 설치 방지 상태를 보존하므로 삭제하지 않는다.

## BO indicator 및 자동재생

`.page-area`의 `data-indicator-theme-pc/mobile` 값은 각각 `dot | line`, `data-indicator-show-pc/mobile`은 `show | hide`다. `data-indicator-position="inner | outer"`는 테마와 별개다. Mobile은 800px 이하, PC는 801px 이상이며 리사이즈 시 전환한다. carousel 샘플은 PC line / Mobile dot이다. 파생 페이지의 기존 열 수, breakpoint, 자동재생 옵션은 유지한다.

슬라이드 자동 전환과 영상 Auto/Loop는 별개다. 기존 조작 후 3초 대기와 남은 시간부터 재개하는 정책을 유지한다. 수동 MP4 중지는 지연 SDK 재생·스크롤·같은 활성 슬라이드의 refresh/resize보다 우선한다. 실제 슬라이드 이탈·재진입 뒤에는 원래 Auto 정책을 적용한다.

## 영상 공간과 접근성

- SDK/썸네일 크기가 없을 때도 공통 CSS와 공통 스크립트가 영상 공간을 확보한다. 썸네일의 현재 PC/Mobile 비율을 우선하고 로드·metadata·resize에서 다시 계산한다. YouTube/Brightcove의 실제 플레이어는 외곽과 모바일 최소 높이까지 채운다. fullscreen은 플레이어가 관리한다.
- MP4 Auto ON 클릭은 실제 native 재생 상태, 대기 요청, 수동 의도로 판정한다. 버튼 클래스만으로 판정하지 않는다. native pause와 SDK 정지를 함께 호출하고 늦은 play를 차단한다.
- 영상 버튼은 재생 중 `동영상 일시정지`, 정지/일시정지 시 `동영상 재생`을 aria-label, title, 숨김 문구로 제공한다. aria-controls로 영상 id를 연결한다. 기존 정지 API의 처음으로 돌아가는 동작은 유지한다.
- indicator에 한국어 이름과 aria-current를 제공한다. 캐러셀은 제목으로 이름을 지정하고 슬라이드 순서를 제공한다. 화면 밖 슬라이드는 aria-hidden/inert로 제외하며 동시에 보이는 column/card는 모두 접근 가능하다. 키보드 초점을 표시하고 새 창 링크에 안내를 추가한다.
- BO에서는 샘플 `Image Alt Text`, 임시 figcaption, CTA 문구/URL을 실제 콘텐츠에 맞게 입력해야 한다. 장식 이미지는 alt="", 이미지 링크에는 목적지 이름을 제공한다. 이 템플릿의 상태 처리가 콘텐츠별 대체 텍스트 작성을 대신하지 않는다.

## 2026-10-19 검증

`node tests/mp4-controls.cjs`: MP4 정지/재개, 지연 재생, refresh, 실제 이탈·재진입, destroy, YouTube/BC 경로 분리 14 PASS. 이전 버전에서 버튼 불일치 관련 2개 실패를 확인한 뒤 수정본에서 통과했다.

Codex 자체 Chromium에서 세 타입 초기화·인라인 순서·반응형 indicator·이동·정지·접근성 집중 검사 37 PASS. 4~7번은 PC/Mobile에서 슬라이드·wrapper·visual·플레이어 높이를 확인했다. SDK와 preview 크기를 제거한 초기 로딩 fixture에서도 영역이 유지됐다. Space 정지, Enter 재개, 접근성 이름 전환, SDK 재생 요청 후 정지 유지를 실제 native video 요소로 검사했다.

MP4 제어 브라우저 검사는 외부 원본 접근 제한을 분리하기 위해 검증용 합성 WebM을 동일 MP4/video SDK 경로에 공급했다. 원본 MP4 URL은 현재 외부 HEAD 403이므로 원본 콘텐츠의 실제 재생은 미확인이다. 운영 파일의 원본 URL은 바꾸지 않았다. 실제 스크린리더·터치 단말·fullscreen·내부망 배포 환경과 콘텐츠별 색 대비/자막/대체 텍스트의 적절성은 별도 검증이 필요하다. Slick 오류는 요청대로 수정하지 않았다.

이전 2026-10-16 검증 자료는 `docs/verification/`에 보존한다. 당시 결과가 현재 변경 전체를 재검증한 수치는 아니다. 최신 근거는 `docs/verification/2026-10-19/`에 저장한다.

로컬 검토 서버는 `/sec/`를 삼성 본사이트로 연결하고 HTTP localhost에서 protocol-relative CDN을 HTTPS로 해석해야 한다. 전달 HTML에는 이 로컬 연결 코드를 포함하지 않는다.
