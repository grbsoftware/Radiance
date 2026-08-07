# Handoff — 2026-08-06

Read `RESEARCH.md` first for the measurements and the papers. This file is
state: what exists, what is undecided, and what has already been ruled out.

## Where the code is

Branch **`picker-and-gamut-fixes`**. `main` is UNTOUCHED and nothing is pushed.
GitHub Pages deploys from `main`, so merging is the act of shipping. `sw.js` is
already bumped to `radiance-v5`, so installed copies will take the update.

Built today, all verified in-browser:

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

## The one thing still open in the code

**The sunflower drop shape is not right yet.** Gary: "pretty but not exactly
the right shape, but it's still beautiful." UNCOMMITTED at time of writing if
the commit below did not land — check `git status`.

Settled so far, do not re-litigate:

- Bulb **inward**, point **outward**. (First attempt had it the other way.)
- Rings **overlap** so each ring's bulbs sit between the tips of the ring
  inside it — "almost like scales except there are gaps in between".
- Sides are straight tangents from tip to bulb. An earlier version bowed both
  sides toward the axis; bowed far enough they meet and the shape closes into
  a **crescent**. That was the "claw" look in the first screenshot.
- Bulb radius is currently **0.42** of the drop's length. Gary's reference
  image is nearer **0.33** — longer taper, less balloon. That is the first
  knob to try.
- Bulb size solves `rb <= sin(halfSpan) * (innerEdge + rb)`. Measuring the
  angular slot at the ring's inner edge instead starves the inner rings.

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
- **`Show` as a real third section** with a gallery of forms, plus a first-run
  explainer for why Make and Measure both exist. Land straight in the palette
  on return visits.
- **Re-derive discriminability thresholds in OKLab** so closest-pair can
  become a real threshold. The published numbers are CIELAB and must not be
  quoted across.
- **Name Difference** axis — beat Perceptual Distance in the Colorgorical
  study. Needs a colour-naming dataset; XKCD's survey is the usual free one.
- **Gary's colour theory book** for the school. He is checking rights. The
  history in it came from an LLM and should be checked claim by claim — the
  "orange" one held up (fruit 13th c., colour sense c. 1502, *geolurēad*
  before) except for "until recently". He saw it in a Worcester museum display.
- The GitHub repo DESCRIPTION still says "smooth HSL-interpolated bridges".
  Gary's to change; it is a repo setting.
