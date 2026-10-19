# YLAC Signage

The four touch screens beside the event space in UVU's Young Living Alumni Center. Each screen is one topic with one action, shown full screen in PlaySignage.

| Screen | Topic | The action (QR code) | Link for PlaySignage | Edit |
|---|---|---|---|---|
| 1 | Alumni | Claim Your Alumni Profile | `https://zoeallgaier.github.io/ylac-signage/alumni/` | `content/alumni.json` |
| 2 | Students | Read Student Stories | `https://zoeallgaier.github.io/ylac-signage/impact/` | `content/impact.json` |
| 3 | Giving | Give to UVU | `https://zoeallgaier.github.io/ylac-signage/give/` | `content/give.json` |
| 4 | Donors | Plan a Legacy Gift | `https://zoeallgaier.github.io/ylac-signage/gratitude/` | `content/gratitude.json` |

Preview all four side by side at `/wall.html`.

## How a Screen Works

**Home** is one composition, read top to bottom from across the room:

1. the UVU monogram,
2. a headline,
3. a photo in the UVU image style (rounded corners and APFY shapes, a different composition per screen),
4. one stat,
5. one QR code (the screen's action),
6. one button that opens the options.

The background is that photo, mirrored and pre-blurred, under a wash of the screen color.

**QR spotlight (idle loop).** While nobody is touching the screen:

1. Every 25 seconds, the photo, stat, and small QR fade out.
2. The action takes the middle of the screen: a 600 px QR code with breathing corner brackets, a scan line, and the action in large type.
3. After 7 seconds it eases back, and the stat counts up again.

**Options.** Tap anywhere on home. The options sit in fixed rows at the bottom, within reach, and the first one is selected. Tapping a row shows its sentence, stat, and QR code in a fixed panel above, so nothing on screen moves. **Back** returns home. After 45 seconds with no touch, the screen goes home on its own.

**Smoothness on PlaySignage.** Every element is absolutely positioned on a fixed 1080 × 1920 stage, so nothing reflows. Only opacity and transform animate, which the GPU handles. The background blur is a 5 KB baked image, not a live filter. The CSS and JS avoid newer features that older Android or Chrome players don't support.

## Editing a Screen

Everything lives in that screen's file in `content/`. On GitHub, open the file, click the pencil, change the text between the quotes, and commit. The screen picks up the change within 10 minutes while it's on its home view. If a comma or quote goes missing, the **Check Content** step on GitHub turns red, and the screen keeps showing the last good version.

```json
{
  "screen": "Giving",                       // shown in the browser tab only
  "theme": "green",                         // "green" or "white"
  "headline": "Your Gift Opens Doors",      // two lines at most
  "photo": { "src": "assets/img/band-give.jpg", "alt": "Describe the photo" },
  "stat": { "value": "6,053", "label": "students supported by donor-funded scholarships since 2018", "_source": "Report, page" },
  "cta":  { "label": "Give to UVU", "url": "https://www.uvu.edu/give/", "short": "uvu.edu/give" },
  "menu": {
    "button": "Choose a Fund",              // names where the button goes
    "items": [
      { "label": "Wolverine Club", "icon": "athletics",
        "text": "One or two sentences.",
        "stat": { "value": "94%", "label": "graduation rate" },          // optional
        "qr":   { "label": "Give to the Wolverine Club", "url": "…", "short": "Opens the UVU giving form" } // optional: uses the screen's cta if left out
      }
    ]
  }
}
```
(JSON can't hold comments; they're here only to explain.)

**Rules that keep it clear**
- **One topic per screen**, and no two screens share the same action.
- **Numbers** come only from the UVU 2024–2025 Annual Report or the EverGREEN Campaign Report. Add a `_source` naming the report and page.
- **Labels** say where they go: "Give to the Wolverine Club," never "Learn More."
- **Options:** 4 or 5 per screen.
- **Photos** are 1776 × 1040, with the subject centered. Each also needs a `backdrop-*.jpg`: the same photo mirrored and blurred at 270 × 480. `tools/crop.py` (Pillow) makes both. Don't use photos showing the Athletics-only Wolverine mark.
- **Option text:** about three lines, so it clears its QR code. Check with `?open=N`.
- **Icons** come from the UVU Icon Library and live in `assets/icons/` as `name-green.svg` and `name-white.svg`.

**Making a new version** (an event, a campaign push): copy a content file, for example `give.json` to `give-gala.json`, edit the copy, and schedule `…/give/?content=give-gala` in PlaySignage.

## PlaySignage Setup

For each screen:

1. Make a playlist with **one** Website slide and a long duration.
2. Paste the screen's link.
3. Turn on **Enable scrolling** so touches reach the page.
4. Leave **Screenshot Mode** off.

## Type, Color, and Accessibility

- **Stratum 1** comes from UVU's Adobe Fonts web project, kit `jum4oqb`, linked in each screen's `<head>`. If the kit can't load, Rajdhani (the approved web fallback) takes over. Never commit Stratum font files: the desktop license doesn't allow web serving.
- **Lato** is used for body text.
- **Two text styles:** display (Stratum Bold) and body (Lato).
- **Color:** UVU Green or White screens. Links are Pale Meadow on green (5.2:1) and UVU Green on white (8.0:1).
- **Contrast:** white on UVU Green and UVU Green on White are 8.0:1. The blurred backdrop sits under an 86–88% wash of the screen color, so text stays above 4.5:1 even over the brightest part of the blur.
- **Touch targets** are 112–128 px on the stage, about 3 inches on a 55" screen, and sit in the lower half of the screen. There are no hover or press effects; hover broke tapping in the old XD version.
- Motion respects reduced-motion settings. Options use real buttons with `aria-expanded`.

## Reviewing on a Laptop

- **O** opens the options, **1–9** picks one, **Esc** goes home, **S** plays the QR spotlight now.
- `?debug` shows the cursor and marks each tap. `?menu` opens the options, `?open=2` picks the third option, `?spot` plays the spotlight right away, and `?idle=5` shortens the idle timeout.
