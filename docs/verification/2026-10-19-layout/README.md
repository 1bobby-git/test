# Layout and legacy typography compatibility

The height adapter previously selected only `.kvItem.swiper-slide`, excluding all four column/card slides. It also forced the wrapper to the active slide's height even when two or three slides were visible. The adapter now observes every direct slide, supports both visual class names, and measures the tallest intersecting slide. Video-provider routing and inline common/video/init order remain unchanged.

CSS supports legacy `.bundle__visual-area` markup and legacy headline `data-font-size` on PC, alongside root `data-headline-size` on both devices. Card text remains an overlay. Explicit font selections include a Korean/sans-serif fallback and text children inherit the selected family. No font assets or external resource domains were added. Stylesheet query version is `20261019-4`.

The reported dot movement was clarified as the active dot following slide changes. That normal behavior remains unchanged. No pagination animation or autoplay policy was changed.

## Verification

- Before: column wrapper 730px vs visible second slide 1394px; after late image growth, wrapper stayed 730px vs slide 1866px. Mobile also clipped. Baseline card initialization timed out, so no baseline card pass is claimed.
- After: in-app-browser layout smoke **15 pass / 0 fail**. Deliberately unequal image heights, late image growth, all four slide observers, PC/mobile headline size, mobile partial-slide coverage, and column manual stop across resize.
- Existing in-app-browser accessibility/navigation/theme smoke **37 pass / 0 fail**.
- `node tests/check-inline.cjs`: **9 script blocks / 3 templates passed**, exit 0.
- `node tests/mp4-controls.cjs`: **20 pass / 0 fail**, exit 0.
- `git diff --check`: exit 0.
- Actual delivery column page at 1440px: headline 46px, wrapper 893px, visible slide heights 893px/831px. At 390px: headline 30px, wrapper 668px. Screenshots included.

Generate the browser fixture with `python tests/build-layout-smoke.py <output.html>`, serve that output, and open it in a browser. It expects the delivery preview/resource server on port 8765. Test-generated SVG image replacements exist only in the fixture, never in delivery HTML.

## Limits

The copied internal-network page, its exact SDK and loaded font files were not accessible. These checks prove the identified local selector/size bugs and regression coverage; they do not prove every internal font resource loads or that all internal-network symptoms are resolved. Original Samsung MP4 access remains outside this layout check. No diagnostic fixture is required for delivery: HTML 3 files plus style.css only.
