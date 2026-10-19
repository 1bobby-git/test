# Three sections in each derived page

Column and benefit delivery pages now contain three sections each. The existing section remains first; copies use `-2` and `-3` root IDs. Each page retains exactly one inline common/video/init script set. Script contents and CSS were not changed. The carousel delivery page was not changed.

## Verification

Codex in-app Chromium, using the actual delivery markup and existing public dependencies:

- `tests/build-three-section-pages.py`: **22 PASS / 0 FAIL** across the two pages. Three initialized instances, unique IDs, one script set, independent support states, original autoplay defaults, middle-section-only navigation, independent current pagination, PC/mobile visible-slide height coverage, manual stop across resize, and repeated-init instance reuse.
- PC test iframe width 1200px, mobile 390px, return to 1200px.
- `node tests/check-inline.cjs`: **9 script blocks / 3 templates passed**, exit 0.
- `git diff --check`: exit 0. Whitespace copied from original markup was removed only in the new copies.
- Opened the real `column.html` and `bentfit.html` delivery pages in separate in-app browser tabs and captured their complete three-section layouts. All three column autoplay controls were stopped independently for inspection.

Generate the fixture with `python tests/build-three-section-pages.py <output.html>` and serve/open that file. It expects the preview/resource server at port 8765. No test fixture is needed for delivery. These are local-browser checks, not an internal-network deployment verification. Unrelated existing Slick errors were left unchanged as requested.
