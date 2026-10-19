# MP4 native-first 호환 수정 검증

사용자 확인: 실패 환경은 내부망 또는 다른 위치에 복사한 HTML이며, 영상 원형 버튼 클릭 후 정지 아이콘이 그대로이고 영상도 계속 재생된다.

공개 SDK만 있는 localhost에서는 이 증상이 재현되지 않았다. 따라서 실제 내부망 SDK의 정확한 실패 원인이 확인됐다고 주장하지 않는다. 공개 obj/sort 계약에 진입을 의존하는 취약점을 제거하는 호환 수정이다.

- 테스트 SDK는 native H.264 MP4를 private Map에서 관리하며 obj/sort 공개 registry가 없다. 원본 내부망 SDK를 복제하거나 입수한 것이 아니다.
- 수정 전 364c00e 영상 블록은 원형 버튼 click 후 paused=false, currentTime=13.180554, kvVideoBtn play 유지. 증상을 재현.
- 수정 후 동일 조건은 paused=true/currentTime=0, kvVideoBtn pause/동영상 재생. SDK 재시도에도 정지 유지, Enter 재개와 Space 정지 확인. private-sdk-after.json에 실제 브라우저 측정 저장.
- 공개 삼성 SDK의 원래 create/canplay 경로 + H.264 테스트 MP4에서도 자동재생 중 원형 버튼 정지 및 재개 확인. 원본 삼성 영상 URL 자체는 외부에서 재생되지 않으므로 콘텐츠 재생 검증과 구분.
- node tests/mp4-controls.cjs: 20 PASS / 0 FAIL. SDK registry 없음/MP4 타입명 차이/SDK stop 예외/재생 Promise 실패 재시도/Promise 계약 포함. 최초 추가 3개는 수정 전 실패했고 수정 후 통과.
- node tests/check-inline.cjs: 9개 JS 블록 구문 및 3 HTML 공통/영상 블록 일치, 순서 통과.
- Codex Chromium 3종 회귀: 37 PASS / 0 FAIL. browser-checks.json 참조.
- 높이 CSS, 공통 스크립트, 호출 스크립트, 원본 영상 URL은 변경하지 않음. 실제 내부망 배포 환경에서 최종 확인 필요.
