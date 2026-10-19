2026-10-19 최종 검증 범위

- Codex 자체 Chromium, 최신 style.css?v=20261019-1 로드 확인.
- browser-checks.json: 37 PASS / 0 FAIL. 세 타입 초기화/인라인 순서/반응형 indicator/이동/정지/접근성.
- heights.json: 1440x1000 및 390x844에서 4~7번 visual과 player 높이 일치, wrapper와 slide 높이 일치, 가로 넘침 없음.
- SDK 및 preview 이미지 크기를 제거한 초기 로딩 fixture: 4~7번 preview naturalWidth=0, player=DIV 상태에서 visual=712px. 로딩 전 공간 확보 확인.
- MP4 native video 제어(검증용 합성 WebM, 원본 SDK video 경로): readyState=4 및 시간 증가 확인 → 버튼 클래스 불일치 → Space 정지(paused=true,currentTime=0,동영상 재생) → SDK 재생 요청 및 refresh 후 정지 유지 → Enter 재개(paused=false,동영상 일시정지).
- Brightcove 원본 콘텐츠도 readyState=4, paused=false, 시간 증가와 외곽 높이 일치를 확인.
- 초점 스타일: :focus-visible=true, solid 2px 확인. 화면 밖 aria-hidden 슬라이드 inert=true, 활성 슬라이드 inert=false.
- 원본 MP4 PC URL 외부 HEAD는 HTTP 403(2026-10-19). 원본 콘텐츠의 실제 재생은 미검증이며 production URL은 유지.
- 실제 스크린리더/자막/콘텐츠별 대체 텍스트/색 대비 적절성, 내부망 배포, 터치 및 fullscreen은 미검증. Slick 오류는 수정 범위 제외.

MP4 이전 버전 재현: 12 PASS / 2 FAIL(재생 중 버튼 불일치 정지, 정지 후 resize 버튼 불일치 재개). 수정본 node tests/mp4-controls.cjs: 14 PASS / 0 FAIL, exit 0.
