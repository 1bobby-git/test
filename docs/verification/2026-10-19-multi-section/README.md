# Multiple independent sections

`NewCarouselSetup.init()` now discovers all three component types and initializes every section using the existing per-type options. Common/video/init remain inline, in that order, once per page. Each section creates its own videos before its Swiper and refresh call. Existing media sources, Auto/Loop flags, CSS, breakpoints and video control implementation are preserved.

Navigation and pagination receive DOM elements scoped to the root rather than document-wide selectors. Copied duplicate IDs and missing root IDs receive unique values; local accessibility references follow renamed IDs. BO should still output globally unique IDs. Video settings live on each `.kvVideo` as data attributes. Repeated init reuses existing instances; newly inserted sections initialize automatically. Existing slide-content replacement still uses `refreshComponentSwiper(section)`.

SDK creation state belongs to `.kvVideo`, since the SDK can replace its `.target` node. A failed creation warns once and stays marked failed rather than being retried by every mutation. This also prevents one SDK failure from aborting initialization of the remaining sections. Explicit SDK replacement should clear the old video's creation state as part of its own teardown/rebuild.

## Evidence

- Before: six copied sections (two per type) produced only two initialized containers, duplicate IDs and only six video create calls; FAIL recorded in multi-before.json.
- After in Codex in-app Chromium: **14 PASS / 0 FAIL**, two sections per type plus one late carousel; distinct navigation, pagination, support states, preserved provider/Auto/Loop flags, unique target IDs, no recreation after SDK target replacement, repeated init or resize. The fixture replaces targets through a test SDK; it verifies dispatch/ownership, not original media playback.
- Existing real-public-SDK inline/accessibility/navigation/theme fixture: **37 PASS / 0 FAIL** after the final creation-state correction.
- Existing height/typography browser fixture: **15 PASS / 0 FAIL**.
- `node tests/section-bootstrap.cjs`: PASS, including an SDK that throws after target mutation; repeated scan stays bounded and other sections initialize.
- `node tests/check-inline.cjs`: **9 blocks / 3 templates passed**, exit 0.
- `node tests/mp4-controls.cjs`: **20 PASS / 0 FAIL**, exit 0; video control block unchanged.
- `git diff --check`: exit 0.

Generate the multi-section fixture with `python tests/build-multi-section.py <output.html>` and open it through a local server. Preview/resource server is expected at port 8765. Only delivery HTML and style.css are needed in production, not fixtures or evidence.

During verification, an intermediate target-owned creation flag caused repeated SDK replacement and unresponsive temporary tabs. That implementation was corrected to parent-owned state before the recorded final results. A fresh actual delivery carousel with the public SDK initialized normally after the correction. Earlier hung temporary contexts could not be closed through browser control; no browser processes were killed. The exact internal SDK and original externally inaccessible MP4 playback were not reverified by these initialization tests.
