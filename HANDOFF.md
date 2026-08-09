# Handoff — 2026-08-07

Read `RESEARCH.md` first for the measurements and the papers. This file is
state: what exists, what is undecided, and what has already been ruled out.

## Where the code is

**`main`, merged and pushed.** GitHub Pages deploys from `main`, so everything
below is live. `sw.js` is at `radiance-v6` — **bump it on every release** or an
installed copy serves its cached `index.html` forever.

Two notes on this file itself, both worth more than the facts they correct:

- It sat for a whole session claiming the work was unpushed on a branch. The
  merge commit is `6259544`.
- `0755a55`'s message says the banded-vs-scales change was "written up in
  HANDOFF". It was not — the commit touched `README.md` and `index.html` only.
  **A commit message asserting a note exists is not the note.** Both facts are
  written down properly now, below.

Built 2026-08-06, all verified in-browser:

1. **Picker no longer closes mid-drag.** `render()` reuses bars when the
   anchor/bridge shape is unchanged. This was the original bug.
2. **Gamut bisection fix.** At 1e-4 the in-gamut set along a ray is not
   contiguous; pure blue read out-of-gamut at 90–99% of its own chroma.
   `GAMUT_EPS` is now 1e-3. Every shipped bridge is byte-identical after.
3. **Service worker does not register on localhost.** It is cache-first on a
   fixed name and was serving stale files silently — cost four reloads before
   it was spotted.
4. **Desktop layout.** Above 900px bars become columns and the panel is a rail
   the palette makes room for (1280 -> 920).
5. **Measured view.** A `Measure` toggle, ground switch, per-colour verdict.
   Honest per metric: contrast at any size, closest pair as a RANKING not a
   threshold, preference not reported at all.
6. **OKLCH editor.** Three tracks, pointer capture, variable scrub ratio
   (45.1 deg / 16.2 / 5.7 for the same 40px drag at 0 / 120 / 400px away).
   Anchors are keyboard-reachable for the first time.
7. **The comb.** 37 hexagonal cells, hue around and chroma outward. Each ring
   is a fraction of that hue's OWN ceiling — 37 distinct fills, no duplicates.
8. **The sunflower** (`Show` toggle). Recursive midpoints of a CLOSED anchor
   ring: n, n, 2n, 4n outward, so 3 anchors give 24 florets.

## The drop shape — FITTED TO GARY'S REFERENCE, awaiting his eye

Gary supplied a reference droplet and asked for the path to come from the
image. It does, by measurement rather than autotrace — a traced path is fixed
coordinates and every ring needs a different size, so the shape has to stay
parametric. What the trace gave, off the 1024px image:

    drop runs y 100 -> 930          length 830
    widest 520 at y ~695            bulb radius 260, centre y 670
    bulb / length                   0.313      (code had 0.42)
    tip -> bulb centre 570          flanks at asin(260/570) = 27.1 deg
    tip rounds at radius ~22        nib = 0.085 of the bulb

The check that made it a fit rather than a guess: 27.1 deg predicts a width of
**102** a hundred pixels below the tip, and the image reads **~100**. So the
flanks really are STRAIGHT tangents — the old code had that part right and the
whole difference was the missing nib plus the too-fat bulb.

`dropPath` is now **two circles and their external tangents** (bulb inward, nib
at the tip), `cos g = (rb - rn) / D`, which reduces to the old
tangent-from-a-point case at `rn = 0`. Constants are named `DROP_BULB` and
`DROP_NIB` at the top of the function.

Settled, do not re-litigate:

- Bulb **inward**, point **outward**. (First attempt had it the other way.)
- Rings **overlap** so each ring's bulbs sit between the tips of the ring
  inside it — "almost like scales except there are gaps in between".
- Sides are straight tangents. An earlier version bowed both sides toward the
  axis; bowed far enough they meet and the shape closes into a **crescent**.
  That was the "claw" look in the first screenshot. Two circles and their
  tangents cannot do that, which is the reason for this construction.
- A sharp tip reads as a **leaf**, not a drop. The nib is what fixes it and it
  was the larger of the two errors — 0.42 -> 0.313 alone would not have done it.
- **The two arcs take opposite `large-arc` flags, and both sweeps are 0.**
  Because `rn < rb` the tangents converge toward the nib, so they wrap less
  than half of it and more than half of the bulb: nib minor, bulb major. See
  the trap below for the sweep.
- Bulb size solves `rb <= sin(halfSpan) * (innerEdge + rb)`. Measuring the
  angular slot at the ring's inner edge instead starves the inner rings. In
  practice the length cap binds on every ring, so all four rings carry the same
  proportions.
- The ring **overlap** is also 0.42 (`band * 0.42` in `renderSunflower`) and is
  a DIFFERENT number that happened to match. It was not changed.

### Trap — an SVG arc has no centre; the FLAGS pick one

`A rx,ry rot large sweep x,y` gives two endpoints and a radius, which admits
**two candidate centres** either side of the chord. The flags choose. So a
sweep flag is not a property of the shape, it is a property of the shape *plus
the direction you happen to be walking it*.

The new drop runs lower -> upper round the bulb where the old sharp-tipped
version ran upper -> lower. Carrying its `sweep=1` across selected the far
centre, at y -29.05 instead of -19.25, which bulged the bulb toward the tip and
crossed the flanks. Gary spotted it on sight; nothing in the code complained.

**How to catch it without eyes,** which is the part worth keeping — the checks
that a self-crossing drop fails and a correct one passes, all cheap:

- `getBBox()` must equal `[-rb, rb] x [-tipR, -innerEdge]` for the ring-0
  floret, which points straight up. A wrong centre overshoots the tip.
- `isPointInFill` at five probes: bulb centre and mid-axis INSIDE; just past
  the tip, beside the taper, and past the bulb OUTSIDE.
- Sample `getPointAtLength` round every path: none may exceed its own `tipR`
  or fall inside its own `innerEdge`. Measured 0.00 and -0.02 after the fix.

Screenshots are unavailable here (see below), so these are not a convenience —
they are the only way to see the shape at all.

## RESOLVED — the ring arrangement (`ce96671`)

Gary, 2026-08-06, looking at it on black: "first 2 rings are correct then 3 and
4 are broken." Fixed.

**The angles were never wrong — measured, not assumed.** Every subdivided
floret sits midway between its two parents to within 0.000 degrees, all 18 of
them. An earlier version of this note blamed the half-step offset
(`k === 0 ? 0 : 0.5`) and was WRONG. Do not go there again.

It was a SIZE fault. Even radial bands gave rings 1-3 byte-identical florets
while their angular slot shrank from 94 to 61 degrees, so ring 1 was
two-thirds air and ring 3 was packed.

Three things want incompatible radii and only two are available at once: equal
florets, equal gaps (needs `rc ~ n`), and rings that lap over each other (needs
the radial step under a drop's length, which `rc ~ n` doubles every ring).
`sunflowerLayout` starts at `rc ~ n**0.4` and travels 35% toward the even-gap
ideal. Rings 0 and 1 always carry the same count (the sequence is n, n, 2n,
4n), so even gaps would put them at one radius; ring 0 nests inside with a
further 15% nudge. **The floret is sized from the TIGHTEST ring**, which is
what makes one shared size safe. Measured: bulb 16.63 on every ring, gaps
51/70/59/45, laps 32.5/29.3/14.7.

### The anchor cap is 7, and the picture CHANGES above 5 (`0755a55`)

Gary: "3 5 7". `MAX_ANCHORS` replaced the 5 that was hardcoded in three places.
The angular design is anchor-count invariant — gaps are 51/70/59/45 at every
count — but the floret shrinks as 1/n (bulb 16.63 at 3, 11.04 at 5, 8.26 at 7)
while ring radii stay pinned to 152. So laps run +32/+29/+15 at 3 anchors and
+2.5/-1.3/-18.1 at 7: **past 5 anchors the sunflower is concentric BANDS, not
lapping scales.** Kept on purpose — Gary's own screenshots at 4 and 5 are the
banded look and he likes it. The alternative, tying ring radii to floret size,
would shrink the whole flower in its frame as the count rises.

**So the "scales" language in `dropPath` is only true at 3 and 4 anchors.**

## DONE 2026-08-07 — Make and Show are PAGES, and the bar stopped crushing

**CONFIRMED by Gary 2026-08-06:** "we will still use the columns for one page
and this for another." Built. `Make | Show` is a segmented control, exactly one
lit, and **Measure is a lens offered only on Make** — which is what closed the
false state the two independent toggles allowed (Measure lit and
`body.measuring` set while `.palette`, its only subject, was `display:none`).

`measuring` is REMEMBERED across a trip to Show rather than cleared, so the
lens is still on when you come back. `page` is deliberately NOT persisted: a
return visit lands in the palette, which is the thing the app is for. Show is
somewhere you go.

Walked all ten transitions in the browser: `showing` and `measuring` never
co-occur, the ground button appears exactly when something has a ground
(Show always, Make only while measuring), and ± re-renders the sunflower live
(3 anchors -> 24 florets, 4 -> 32).

### The bar was crushing its own controls, and had been all along

**Flexbox spreads a shortfall across EVERY sibling, and `width:44px` does not
stop it** — the default `flex-shrink:1` still applies. At 375px the 44px
circles were rendering **14px** wide, and once the page nav was added it
collapsed to 2px and slid to x = -8, off the left edge, with the document
overflowing horizontally. This predates the nav: five controls already did not
fit a phone, and the symptom is deformation rather than overflow, so nothing
ever looked broken enough to chase.

Fix is `flex: none` on every child plus `flex-wrap`, so the bar takes a second
row instead of deforming. The three palette-size controls are wrapped in
`.count-group` because a row break between the count and the `+` turns a
stepper into two unrelated buttons. A `max-width:480px` query buys back enough
width that the resting state (nav, stepper, presets) still fits one row of a
375px phone; turning Measure on takes a second row, at 121px of bar.

Also: the stage now makes room for the rail above 900px
(`body:has(.presets-panel.open)`), which only `.palette` did — the sunflower
was sitting under the panel. Measured 1280 -> 920, outer tip at 772 against a
panel edge at 920.

## Verification gotchas in this setup

- **Screenshots do not work** — the browser pane is not compositing. Pull the
  SVG out with `javascript_tool` and send it as a file instead.
- **CSS transitions never advance** for the same reason. A transitioned
  property reads frozen at its start value and looks like a broken cascade.
  Add `*{transition:none !important}` and call `.getAnimations().forEach(a =>
  a.finish())` before measuring. This cost a long detour on the rail.
- **`setPointerCapture` will not engage for synthetic events.** Stub only
  `hasPointerCapture` to exercise a real drag handler. Gary confirmed the real
  mouse works.
- **`IntersectionObserver` never fires. Not once** — zero callbacks, not even
  the initial one every observer gets on `observe()`. Anything built on it is
  unverifiable here, which is why the Read page's chip tracking is a scroll
  handler instead. Do not read a silent observer as a working one.
- **`scroll-behavior: smooth` never advances**, same cause as the frozen
  transitions: no frames. `scrollIntoView()` and an assigned `scrollTop` both
  appear to do nothing on an element that sets it. Set
  `el.style.scrollBehavior = 'auto'` before measuring any scroll, and put it
  back after. This looked exactly like a broken click handler for two rounds.
- **The console buffer survives a reload.** Errors from a version you have
  already fixed keep coming back, which reads as "the fix did not take".
  Confirm against the served source (`documentElement.innerHTML.includes(...)`)
  rather than trusting the log.
- **Cross-check a "which element is in view" result with
  `document.elementFromPoint()`.** It is independent of whatever geometry the
  code under test is doing, so agreement between the two is real evidence and
  not the same calculation run twice.
- PowerShell here-strings break on embedded double quotes. Write the commit
  message to a file and use `git commit -F`.

## Decisions made, with reasons

- **Make / Measure**, not "simple vs science" and not "math vs research".
  Both sides are both; the split is which question is being answered.
- The measured view is a **lens over the same palette**, not a second builder.
  Two separate sections is the failure mode — people never visit the strict one.
- **Voice matters**: "vanishes on white", not "fails 3:1". Gary confirmed the
  default rainbow reading badly on white is fine — "that is worth knowing".
- Everything is free. It is a toy. Nothing should nag.
- The comb/sunflower use of the gamut hull is a LAYOUT use, distinct from the
  bridge policy the README rejects. There the algorithm invents a colour; here
  the user picks one.

## Provenance — settled

The 42 presets were **written for this repo**, not copied. Verified against all
992 palettes in `Experience-Monks/nice-color-palettes`: zero exact matches,
only 3 of 114 colours shared (`#FF6B6B`, `#4ECDC4`, `#FFFF00`, all ubiquitous).
Nothing to attribute. If those 992 are ever shipped: repo is MIT but the data
is scraped from ColourLovers, so credit both and do not lean on it commercially.

## Open, not started

- **MJ export** — Gary parked it deliberately. Clouds and splatter. The point
  is colour WITHOUT composition: the current palette image is five hard bands
  and Midjourney reads that as structure. Mid-frequency, isotropic, no hard
  edges, square, no border. Not too fine or it averages to mud at the ~224px
  the encoder sees.
- **A gallery of forms on Show.** The sunflower is one form; the comb is
  another and is currently locked inside the picker. Still open.
- **A first-run explainer** for why Make and Measure both exist. Still open.
- **Re-derive discriminability thresholds in OKLab** so closest-pair can
  become a real threshold. The published numbers are CIELAB and must not be
  quoted across.
- **Name Difference** axis — beat Perceptual Distance in the Colorgorical
  study. Needs a colour-naming dataset; XKCD's survey is the usual free one.
- **Gary's colour theory book** for the school. He is checking rights. The
  history in it came from an LLM and should be checked claim by claim — the
  "orange" one held up (fruit 13th c., colour sense c. 1502, *geolurēad*
  before) except for "until recently". He saw it in a Worcester museum display.
- ~~The GitHub repo DESCRIPTION still says "smooth HSL-interpolated bridges".~~
  **DONE — Gary fixed it.** Verified 2026-08-06 via `gh api repos/grbsoftware/
  Radiance --jq .description`; it now says "interpolated in OKLab rather than
  HSL", which matches the code.

  Worth keeping for the reason it lingered: this line sat here as an open item
  for three sessions and I repeated it to Gary as still-broken without looking,
  because a handoff note is cheaper to read than a fact is to check. Same shape
  as the halo/vellum hunt and the Pages-cache misdiagnosis. **A checkable claim
  in this file is a hypothesis with an expiry date** — check it before
  repeating it, especially the ones parked as "Gary's to do", since those are
  exactly the ones that get done outside the transcript and never come back to
  update the note.
