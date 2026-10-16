# YLAC Signage Audit · Oct. 15, 2026

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

## Open Items

- Confirm the history dates on the Alumni screen with UVU Archives.
- Confirm that Jacob Egan's quote can still be used, and refresh the 2024 Food Pantry numbers.
- Add a donor recognition list (the `names` scene type is ready) once IA approves names and anonymity rules.
- Ask whether a Stratum web font kit is available (B9).
- Request vertical 2160 × 3840 photos from UVU Photo. Current heroes are 1080 × 1350 and soften on 4K.
