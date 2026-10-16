# YLAC Signage

The four touch screens beside the event space in UVU's Young Living Alumni Center. Each screen is a web page that PlaySignage shows full screen.

| Screen | Link (paste into PlaySignage) | Edit this file |
|---|---|---|
| 1 · Alumni | `https://zoeallgaier.github.io/ylac-signage/alumni/` | `content/alumni.json` |
| 2 · Student Impact | `https://zoeallgaier.github.io/ylac-signage/impact/` | `content/impact.json` |
| 3 · Give | `https://zoeallgaier.github.io/ylac-signage/give/` | `content/give.json` |
| 4 · Gratitude | `https://zoeallgaier.github.io/ylac-signage/gratitude/` | `content/gratitude.json` |

Preview all four side by side at `/wall.html`.

## How Each Screen Works

- **Demo loop.** Branded motion scenes play on repeat, like a store demo. A QR code and a "Touch to Explore" button stay on screen the whole time, so the screen works even when nobody touches it.
- **Explore.** A tap anywhere opens topic cards. Each topic has its own QR code. After 45 seconds with no touch, the screen slides back to the demo.
- **Edits show up on their own.** At the end of every loop the screen checks for new content. Nobody needs to restart the player.

## Editing Content

All words, photos, and links live in the `content/` folder. You never need to touch the HTML, CSS, or JS.

1. On GitHub, open the screen's file in `content/` and click the pencil icon.
2. Change the text between the quotes. Keep the quotes, colons, and commas.
3. Click **Commit changes**. The screen updates within a few minutes.

If a comma or quote goes missing, the **Check Content** step on GitHub turns red and tells you the line. The screens keep showing the last good version until it's fixed.

### Scene Types (the `demo` list)

| `type` | Use it for | Fields |
|---|---|---|
| `title` | A big welcome or headline | `eyebrow`, `headline`, `lead` |
| `stat` | One big number that counts up | `eyebrow`, `value`, `unit`, `label`, `note` |
| `photo` | Full-screen photo with a green fade | `photo`, `alt`, `eyebrow`, `headline`, `lead` |
| `framed` | Photo in the uvu.edu image style with APFY shapes | `photo`, `alt`, `portrait` (true/false), `eyebrow`, `headline`, `lead` |
| `timeline` | Years that light up one by one | `eyebrow`, `headline`, `items` (`year`, `name`) |
| `list` | Up to four funds or options | `eyebrow`, `headline`, `items` (`icon`, `amount`, `title`, `text`) |
| `quote` | A student or donor in their own words | `quote`, `name`, `detail`, `photo` |
| `names` | A slowly scrolling donor or board list | `eyebrow`, `headline`, `lead`, `names` |
| `cta` | One big QR code | `eyebrow`, `headline`, `lead`, `qr` |

Any scene can take `"seconds": 10` to stay up longer (the default is 7).

### Topics (the `explore` list)

Each topic needs `label` (card title), `teaser` (one short line), and `icon`. Its detail page can use `photo`, `eyebrow`, `title`, `body`, `stats`, and `qr`. Topics without their own `qr` use the screen's main QR code.

### Photos

Put photos in `assets/img/` and refer to them as `assets/img/name.jpg`.
- **Full-screen `photo` scenes:** vertical, at least 1080 × 1920 (2160 × 3840 for 4K screens), subject in the upper half.
- **`framed` scenes and topic photos:** 4:3, about 1600 × 1200.

### Icons

Use names from the UVU Icon Library that are already in `assets/icons/`: award, calendar, cash-1, communicate, diploma-3, donation, financial-growth, graduation, history, info-1, person, relationship, student-life, team, university. To add one, copy its `-green.svg` and `-white.svg` files from the Alumni Web System kit.

### QR Codes

Every `qr` has three parts:

```json
"qr": { "url": "https://www.uvu.edu/give/", "label": "Give to UVU", "short": "uvu.edu/give" }
```

The code is generated from `url`, so changing the link changes the code. Labels say where the code goes ("Give to Scholarships," never "Scan Here").

## Making a New Version

To run a different version for an event, a season, or a campaign push:

1. Copy a content file, for example `content/give.json` → `content/give-gala.json`.
2. Edit the copy.
3. In PlaySignage, schedule a slide with `…/give/?content=give-gala`.

## PlaySignage Setup

For each screen:

1. Make a playlist with **one** Website slide. The page runs its own loop, so a second slide would interrupt someone mid-tap.
2. Paste the screen's link and set the slide duration very long (for example 24 hours).
3. Turn on **Enable scrolling** so touches reach the page.
4. Leave **Screenshot Mode** off. It shows a still image that can't be touched.

## Brand

Built on the UVU Alumni Web System v1.2: one UVU Green (#185C33), Rajdhani for display, Lato for reading, Title Case, UVU Icon Library only, photos with rounded corners and APFY shapes, accents under 20%, and one primary action per view. Type sizes are the system's roles scaled for a portrait screen read from 3–10 feet.

## Touch Notes

Tapping failed in the old Adobe XD version because of hover states. This version:
- has no hover styles at all (press feedback only),
- counts the first tap, with no double-tap or 300 ms delay,
- ignores long-press menus, drags, pinch zoom, and accidental double taps,
- keeps every interactive element in the lower half of the screen, where people can reach it.

## Reviewing on a Laptop

- <kbd>→</kbd> / <kbd>←</kbd> step through scenes, <kbd>E</kbd> opens Explore, <kbd>Esc</kbd> closes it.
- `?debug` shows the cursor and marks each tap.
- `?scene=3` starts on the fourth scene. `?explore` opens Explore right away. `?idle=10` shortens the idle timeout.

## Before Launch

Each content file starts with a `_verify` note listing what still needs confirming:
- the `uvu.edu` links (most point to /alumni or /give until fund-specific links are confirmed),
- the history dates on the Alumni screen,
- the Food Pantry numbers (2024),
- the donor and Foundation Board names (currently placeholders).
