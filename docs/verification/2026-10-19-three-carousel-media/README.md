# Three carousel sections with independent MP4 controls

The carousel delivery HTML now contains three sections. Copies suffix every original ID with `-2` and `-3`; each section keeps its own media source/Auto/Loop attributes. Inline common/video/init code and CSS were not changed. Only one script set remains per page.

## Browser evidence

Codex in-app Chromium ran `tests/build-three-carousel-media.py`: **19 PASS / 0 FAIL** using actual H.264 video data through the existing public Samsung SDK create/autoplay paths. The fixture substitutes a local H.264 MP4 only for inaccessible source MP4 URLs, and places three sections side by side only in the test layout so SDK viewport visibility is equal. No SDK API stub is used. Production media sources and layout are unchanged.

- All three native videos loaded data and automatically played with advancing currentTime.
- Each section's circle button stopped only its own MP4 (`paused=true`, reset currentTime); both other videos stayed unpaused and advanced. Each resumed independently and exposed the Korean accessible label.
- Middle-section pagination produced active indices `[1, 0, 1]`; the outer MP4s kept playing and advancing. Returning the middle section to its MP4 restored automatic playback.
- Repeated initialization kept the same instances. All manual video stops survived the tested resize.
- `node tests/check-inline.cjs`: **9 script blocks / 3 templates passed**, exit 0.
- `node tests/mp4-controls.cjs`: **20 PASS / 0 FAIL**, exit 0.
- `git diff --check`: exit 0.

The JSON records actual paused/currentTime observations for all three videos. These are finite local-browser checks of real media through the public SDK. They do not verify the original externally restricted MP4 URL or the exact internal-network SDK. Existing slideshow automatic advancement remains enabled according to the original policy; the tests explicitly select the MP4 slide for their observation window.

Generate with `python tests/build-three-carousel-media.py <output.html>` and serve the file. It expects the preview/resource server at 8765 and a playable test H.264 file at `http://127.0.0.1:8766/mp4-autoplay.mp4`. This fixture/media is not part of delivery. Release means the existing GitHub-main publishing workflow and four-file delivery ZIP; no separate production web hosting deployment is configured in this task.
