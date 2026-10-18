# YLAC Signage

The four touch screens beside the event space in UVU's Young Living Alumni Center. Each screen is a web page that PlaySignage shows full screen.

| Screen | Link (paste into PlaySignage) | Edit this file |
|---|---|---|
| 1 · Alumni | `https://zoeallgaier.github.io/ylac-signage/alumni/` | `content/alumni.json` |
| 2 · Student Impact | `https://zoeallgaier.github.io/ylac-signage/impact/` | `content/impact.json` |
| 3 · Give | `https://zoeallgaier.github.io/ylac-signage/give/` | `content/give.json` |
| 4 · Thank You | `https://zoeallgaier.github.io/ylac-signage/gratitude/` | `content/gratitude.json` |

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

Every loop is three scenes, in this order, so all four screens share one rhythm:

1. **A stat** (`stat`): one number from the reports, with its `_source`.
2. **An image** (`photo` for full screen, or `framed` for the uvu.edu image style).
3. **A scan** (`cta`): one big QR code. It uses the screen's main QR unless the scene has its own `qr`.

Keep headlines to two lines. There are no eyebrow labels. The other types below still work if a screen ever needs them.

| `type` | Use it for | Fields |
|---|---|---|
| `title` | A big welcome or headline | `headline`, `lead` |
| `stat` | One big number that counts up | `value`, `unit`, `prefix`, `label`, `lead` |
| `photo` | Full-screen photo with the UVU Green fade | `photo`, `alt`, `headline`, `lead` |
| `framed` | Photo in the uvu.edu image style (rounded corners and APFY shapes) | `photo`, `alt`, `headline`, `lead` |
| `timeline` | Years that light up one by one | `headline`, `items` (`year`, `name`) |
| `list` | Up to four funds or options as icon rows | `headline`, `items` (`icon`, `title`, `text`) |
| `quote` | A pull quote with a headshot | `quote`, `name`, `detail`, `photo` |
| `names` | A slowly scrolling donor or board list | `headline`, `lead`, `names` |
| `cta` | One big QR code | `headline`, `lead`, `qr` |

Any scene can take `"seconds": 10` to stay up longer (the default is 7).

**Numbers:** only use stats from the UVU Annual Report or the EverGREEN Campaign Report, and add a `_source` line naming the report and page. See AUDIT.md for the current list.

### Topics (the `explore` list)

Keep it to 4 topics. Each needs `label` and `icon`. Its page shows `title`, `body` (one or two short paragraphs), and its own `qr`, plus either a `photo` or a `people` list (`name`, `role`, `photo`) for award recipients or board members. `button` is the label on the screen's Explore button. Make it name the place ("Choose a Fund"), not "Touch Here."

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

Follows the UVU Brand Guidelines (2025) and the Alumni Web System v1.2 (shared with Giving v1.6). See [AUDIT.md](AUDIT.md) for the full check.
- **Colors.** Each screen is UVU Green or White, both primary colors. There are no Warm or dark-green fields, and accents stay under 20%.
- **Logo.** The UVU monogram sits in a UVU Green tab anchored to the top edge, with nothing beside it.
- **Type.** Rajdhani (the Stratum web fallback) and Lato, Title Case, seven sizes.
- **Photos and shapes.** APFY shapes appear only around framed photos.
- **Icons.** UVU Icon Library only.
- **Actions.** One primary action per view.
- **Copy and links.** Synced from the Alumni and Giving page mockups.

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
- a donor recognition list for a `names` scene, once IA approves one.
