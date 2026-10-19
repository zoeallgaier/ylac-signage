# YLAC Signage Audit

## v3.1 · Oct. 19, 2026 (current)

- **QR spotlight.** While idle, every 25 seconds the action takes over the middle of the screen for 7 seconds: a 600 px QR code with breathing corners, a scan line, and the action in 72 px type. This is the most motion on the screen, and it only runs when nobody is using it.
- **No more jumps.** Options moved from an accordion to fixed rows plus a fixed detail panel. Measured: every row, the panel, and Back keep the exact same pixel position through every pick. All 18 options fit their panel without touching their QR code.
- **Smoother on players.**
  - Everything is absolutely positioned, with no flex or grid layout at runtime.
  - Only opacity and transform animate.
  - The live 90 px CSS blur is replaced by baked 5 KB backdrops.
  - Removed clip-path, mask, `inset`, `aspect-ratio`, flex `gap`, `?.`, and `??`.
- **Simpler code.** The engine is about 200 lines of plain ES2017 with one tap handler and three states (home, spotlight, options).

## v3 Redesign · Oct. 19, 2026

Started over around one rule: **each screen is one topic with one action.**

| Screen | Topic | Action | Stat (source) |
|---|---|---|---|
| Alumni | Connecting with alumni | Claim Your Alumni Profile | 124,818 alumni since 1941 (EverGREEN p. 47) |
| Students | Student impact | Read Student Stories | 35,300 CARE Hub meals (Annual Report p. 19) |
| Giving | Giving | Give to UVU | 6,053 students supported by scholarships (EverGREEN p. 29) |
| Donors | Donor recognition | Plan a Legacy Gift | 14,166 donors, 33,538 gifts (EverGREEN p. 13) |

**What changed and why**

- **No rotating scenes.** Each screen is a single fixed layout: headline, photo, stat, action. It reads the same from across the room every time.
- **Options in place.** The topic and detail pages are gone. Options are one short list, and each opens in place to a sentence and its own QR code. **Back** replaced Close.
- **Donor recognition is real.** The Donors list names the five largest gifts in the EverGREEN report: Linder, UCCU, Smith, Kahlert, and Baugh.
- **Two text styles:** Stratum 1 Bold (display) and Lato (body). Stats are a number plus one line, with 112 px of space above.
- **Stratum 1 via UVU's Adobe Fonts kit** (`jum4oqb`), with Rajdhani as the fallback. The desktop font files are "preview & print" only, so none are committed.
- **Monogram without the tab:** plain white on green, or UVU Green on White, aligned with the text.
- **Links:** Pale Meadow on green (5.2:1), UVU Green on white (8.0:1).
- **Motion:**
  - On load and once a minute, headline words rise and the stat counts up; the QR code settles in last.
  - The photo drifts slowly.
  - The backdrop is the photo mirrored, blurred, and washed 84–88% with the screen color. It stays still, since animating a blur is expensive on signage players. Mirror and blur are used on the background only.
  - Taps change things instantly, with no press effects, pulse rings, or slide-ins.
- **Photos** use the UVU image style: rounded corners and APFY shapes, with a different composition per screen (hatch, stairs, dot, half) so neighbors never match.
- **Photos:** new 1776 × 1040 crops with subjects centered. The Donors aerial stops above the baseball field, so its Wolverine logo (Athletics-only) is out of frame.
- **Tap check:** synthetic taps at each row's center hit the right option. One option is open at a time, a second tap closes it, Back returns home, and the idle timer returns home.

**Open items**

- Confirm the named donors are comfortable appearing on public signage.
- Confirm Kyrsi Zamora's quote and title.
- The 365 Stories link is the current advancement URL; confirm it stays live.

---

## Earlier Versions (History)

### v2 · Oct. 15–16, 2026

Checked against the **UVU Brand Guidelines (2025)**, the **Alumni Web System v1.2** (shared with Giving v1.6), and **Apple HIG** basics. Each finding is marked **Fixed** or **Open** (needs someone outside this repo).

## Brand Guidelines

| # | Finding | Rule | Status |
|---|---|---|---|
| B1 | The top bar paired the UVU monogram with "Young Living Alumni Center," which reads as a homemade lockup. | 2.6: custom logo creation isn't permitted. 6.3: don't combine text or graphics with a logo tab. | **Fixed.** A UVU Green monogram tab anchored to the top edge, with nothing beside it. |
| B2 | The logo file used #275D38. | 4.1: no substitutions for UVU Green. | **Fixed.** #185C33 everywhere. |
| B3 | Two screens used Warm (#F2F0EB) as a full-screen background. | 4.2: avoid large areas or backgrounds in secondary colors. | **Fixed.** Light screens are White, a primary color. |
| B4 | Green screens were IA Dark Green (#1A321C) with glow pools in Wolverine Green and Pale Meadow. | 4.1 and 4.3: lead with UVU Green; accents stay under 20%. | **Fixed.** Solid UVU Green with no glow. |
| B5 | Pale Meadow showed up on every eyebrow, short URL, era year, progress tick, and pulse ring, adding up to more than 20%. | 4.2: accents under 20%; don't lead with secondary colors. | **Fixed.** Accents are limited to the stat rule (Wolverine Green on white, Sea Haze on green). |
| B6 | APFY shapes floated on every text scene, and a dot grid swept behind everything. | 6.1: patterns support the content, not overpower it. | **Fixed.** Shapes appear only around framed photos, as in the uvu.edu image style. No dot grid. |
| B7 | The EverGREEN campaign was referenced. | The campaign has ended. | **Fixed.** Removed. |
| B8 | Copy included invented specifics: Wee Care, era descriptions, "Mentor a Student," "Donor Name" placeholders. | 1.1: be authentic, with honest, real communication. | **Fixed.** All copy and links now come from the Alumni and Giving page mockups. Anything still unconfirmed is listed in each file's `_verify` note. |
| B9 | Stratum is the university typeface. | 5.1 | **Open.** Rajdhani stays as the approved web fallback, same as the web system. It's a one-variable swap if a Stratum web kit becomes available. |

## Alumni Web System

| # | Finding | Status |
|---|---|---|
| S1 | **Eyebrow-isms.** Almost every scene had a label above the headline ("Welcome Home," "Every Name, One Family," "Choose Where It Goes") that repeated or decorated the headline. | **Fixed.** Eyebrows are gone. A scene says what it needs in the headline and one lead line. |
| S2 | **Too many type sizes.** There were 14 sizes on the stage. The system has four text roles plus one style per heading level. | **Fixed.** Seven sizes: display, H2, lead, body, meta, button, stat, each a scaled system role. |
| S3 | **Quotes didn't match the web.** The signage used a giant quotation mark; the web uses a pull quote (Wolverine Green rule, Rajdhani Bold) with a square headshot. | **Fixed.** Uses the pull-quote pattern. |
| S4 | **Stats didn't match the web.** On the web, a stat is a big number with a short label and a 6px Wolverine Green rule. | **Fixed.** Same structure at stage scale. |
| S5 | **Topic picker.** Chunky white cards with teaser lines; the web uses icon rows (icon, label, arrow, divider) for "Give by Area" and quick links. | **Fixed.** Icon rows, 150px tall. |
| S6 | **Photo fade.** It faded to IA Dark Green; the system hero fades to UVU Green. | **Fixed.** |
| S7 | **Button labels.** "All Topics" and "Touch to See Student Stories" didn't say where they go. | **Fixed.** "Back" and "Close" in Explore. Explore buttons name the place: "Explore Alumni Benefits," "Choose a Fund." |
| S8 | **External links.** QR codes leave uvu.edu. | **Fixed.** Every QR label names its destination, and the line under it says it opens on your phone. |

## Apple HIG and Signage Usability

| # | Finding | Status |
|---|---|---|
| H1 | **Too much to take in.** There were 6 to 7 scenes per loop and 4 to 5 topics, plus an era picker, stat chips, and a progress bar. A passerby gets 5 to 10 seconds. | **Fixed.** 4 to 5 scenes per loop and 4 topics per screen. The era picker and progress ticks are gone. |
| H2 | **Reach.** Touch targets must sit low. | **Kept.** All targets are in the bottom 45% of the screen. Rows and buttons are at least 120px on the stage (about 3 in. on a 55" screen). |
| H3 | **Press feedback.** Every control needs a visible pressed state, with no hover (the XD failure). | **Kept and tightened.** Pressed rows tint and scale. There are still no `:hover` rules. |
| H4 | **One primary action per view.** The demo had a QR card plus a primary button, which is fine. The detail view had two equal buttons. | **Fixed.** In the detail view, the QR code is primary, and Back and Close share one quiet row. |
| H5 | **Motion with purpose.** The glow drift, dot wave, floating shapes, pulsing ring, and tick bars were all moving at once. | **Fixed.** Motion is limited to the type reveal, count-up, timeline sweep, photo entrance, and a slow Ken Burns. The explore button gets a gentle ring every few seconds, since 19 of 32 survey respondents didn't know the screens were touch screens. |
| H6 | **Spacing.** Gutters and vertical starts varied by scene type. | **Fixed.** One 80px gutter, one 16px grid, and every text scene starts on the same top line. |
| H7 | **Contrast.** Pale Meadow on Warm and Lake Calm shapes on white failed AA. | **Fixed.** Text is White on UVU Green (7.4:1) or UVU Green on White (7.4:1). Muted text is #4B5D50 on White (6.9:1). |
| H8 | **QR density.** Long Blackbaud form links make dense codes. | **Fixed.** The QR card is 320px on the stage (about 8 in.), and long links use the low-error-correction setting so the modules stay large. |

## Imagery (Alumni Web System, Image Style)

The rule: the uvu.edu image style. Plain photos with rounded corners and APFY shapes, or a raw full-bleed photo with a CSS UVU Green fade. Alumni pages need alumni-aged imagery (people at events, at work, and with families), not only students.

| # | Finding | Status |
|---|---|---|
| I1 | **Skewed young.** Almost every Alumni-screen photo was a student, as the web system's own audit warned. | **Fixed.** The Alumni screen now uses the July 2026 License Plate shoot (alumni tailgating in the canyon), the 2026 Alumni Awards ceremony, a podcast studio, and the November 2025 employee shoot for Career and Networking. |
| I2 | **Soft photos.** Full-screen scenes stretched 1080 × 1350 web crops to the 1920 px stage (1.4–1.9× upscale). | **Fixed.** Full-screen crops are cut fresh from the originals at 1440 × 2560 (CARE Hub from 8192 × 5464; campus from the April 2026 drone shoot). The Awards photo has no high-res original, so it moved to a framed scene, where 1600 × 1200 is sharp. |
| I3 | **Off-center subjects.** Crops relied on `object-position: center top`. | **Fixed.** Every photo is pre-cropped around a marked focal point (`tools/crop.py`): faces sit on the vertical center line, and full-screen subjects sit in the top 45%, clear of the text. |
| I4 | **Subjects under the text.** Vertical crops of group shots, like the tailgate and the license plate, pushed people under the fade or cut them off. | **Fixed.** Those are framed 4:3 photos with APFY shapes instead. Only photos whose subject sits high stay full screen. |
| I5 | **Brand marks in photos.** The Willy the Wolverine flight photos and the stadium field logo carry the Athletics-only mascot mark. The EverGREEN celebration set is from the finished campaign. | **Fixed.** Left out. The campus aerial's field logo falls in the solid green zone and isn't visible. |
| I6 | **Kyrsi's headshot** was a 960 px web crop. | **Fixed.** Square 800 × 800 crop from the 3888 × 5832 original, face centered. |
| I7 | **Leftovers.** 32 photos from earlier versions were still in the repo. | **Fixed.** Unused photos removed. `assets/img` is 4.4 MB. |

## Contrast (WCAG 2.2, Measured)

Text over photos was measured against the actual photo pixels under the text block (y 840–1260 on the 1920 px stage), using the brightest pixel, not the average.

| # | Finding | Before | After |
|---|---|---|---|
| C1 | **White headline over full-screen photos.** The fade only reached 41% opacity at the headline's top line, so bright fridge glass and sky showed through. | 2.0:1 | **6.7:1.** The fade is now solid behind the text and clears just above it, so faces keep a light 21% tint. |
| C2 | **Timeline years** dimmed to 40% opacity. | 2.6:1 (green) / 2.0:1 (white) | **5.8:1 / 4.85:1** at 80%. The active year gets a rule and a tint instead. |
| C3 | **Dock over a photo on a White screen.** The QR label, URL, and button kept White-screen colors (dark green) on the green fade, and the button vanished. | about 1.2:1 | **8.0:1.** The dock switches to white text and a white button whenever a photo is behind it, and button arrows now follow the text color. |
| C4 | Other text pairs. | | All pass: White on UVU Green 8.0:1, UVU Green on White 8.0:1, body Dark Green on White 13.8:1, muted text 6.4:1 (green) and 7.1:1 (white), button borders 4.9:1, stat rules 4.5:1 and 5.3:1. |

## Stats (Oct. 16)

Rule: every number on the screens comes from the **UVU 2024–2025 Annual Report** or the **EverGREEN Campaign Report**. Each scene and topic that uses a number names its page in a `_source` field.

| Was | Problem | Now | Source |
|---|---|---|---|
| 120,000+ alumni | From the web page, rounded | 124,818 alumni since 1941; 74% live in Utah 10 years later | EverGREEN p. 47; Annual Report p. 24 |
| Diploma-name years (1945, 1967, 1987, 1993) | Not in either report | Timeline: 1941 opens, 2008 university, 2018 largest in Utah, 2025 record 12,940 graduates | EverGREEN pp. 11, 57; Annual Report p. 4 |
| 250 people a week; 10,000 lbs of produce | From the 2024 signage | 35,300 meals; 53,000+ lbs of food for 9,000+ people; 13% higher retention | Annual Report p. 19; EverGREEN p. 23 |
| 87% of graduates stay in Utah | From the Give web page | 6,053 students supported by donor-funded scholarships ($22,550,126) | EverGREEN pp. 13, 29 |
| 439 funds | From Find a Fund | 344 endowed funds, 254 of them scholarships | EverGREEN p. 45 |
| 115 merit scholarships a year | From Ways to Give | 359 full-tuition presidential scholarships (fall 2024) | Annual Report p. 69 |
| (new) | | 14,166 donors, 33,538 gifts, 10,491 first-time donors | EverGREEN p. 13 |
| (new) | | 41% first-generation | Annual Report p. 7 |
| (new) | | 326 student-athletes, 94% graduation rate, 3.52 GPA | EverGREEN p. 39 |
| Jazz $17 and Mammoth $59; $35 plate fee | Prices not in the reports | Removed; the QR codes link to the current offers | |
| Jacob Egan quote | Permission unclear, not in the reports | Henry Wolthuis ’25, from the EverGREEN report | EverGREEN p. 55 |

The EverGREEN report is the campaign's final record, so its totals are used as UVU facts (donors, scholarships, endowed funds) without naming the campaign on screen.

## Open Items

- Confirm the history dates on the Alumni screen with UVU Archives.
- Add a donor recognition list (the `names` scene type is ready) once IA approves names and anonymity rules.
- Ask whether a Stratum web font kit is available (B9).
- The 2026 Alumni Awards photos exist only as web crops (1200 × 900). Ask UVU Photo for the originals.
- When adding a photo, crop it with `tools/crop.py` and run `tools/contrast.py`. Anything under 4.5:1 needs a different crop or a framed scene.
