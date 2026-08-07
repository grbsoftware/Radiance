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

## PARKED — the ring arrangement, rings 3 and 4

Gary, 2026-08-06, looking at it on black: "first 2 rings are correct then 3 and
4 are broken." Explicitly parked to finish the shape first — do not start this
without picking the drop shape up again afterwards.

**The angles are exact — measured, not assumed.** Every subdivided floret sits
midway between its two parents to within 0.000 degrees, all 18 of them. An
earlier version of this note blamed the half-step offset (`k === 0 ? 0 : 0.5`)
and was WRONG; half of each ring's own step is precisely the parent midpoint
every time. Do not go there again.

It is a SIZE problem:

    ring  florets  length     rb    slot   width    gap
      0        3    36.00  11.27    40.4    22.5   17.8
      1        3    51.12  16.00    94.0    32.0   62.0
      2        6    51.12  16.00    84.7    32.0   52.7
      3       12    51.12  16.00    61.2    32.0   29.2

Rings 1-3 are identical in size while their angular slot shrinks from 94 to 61,
so ring 1 is two-thirds air and ring 3 is packed. Ring 0 is separately the odd
one out at length 36, because `innerEdge` subtracts the 0.42 overlap for
`k >= 1` only — which lengthens every ring EXCEPT the first.

Gary guessed ring 0's smaller bulbs were throwing off the outer rings. Ring 0
really is anomalous, but it cannot propagate: every ring's geometry comes from
`k`, `band` and `r0` alone.

The root cause is structural. **The floret count doubles each ring (3, 3, 6,
12) while the radius grows linearly**, so circumference cannot keep pace and
crowding outward is guaranteed at constant drop size. Two ways out, and it is
Gary's call which:

- **Drops fill their own slot.** The angular cap already in `dropPath` does
  exactly this and currently never binds — the length cap wins on all four
  rings. Small change, keeps gaps even, but makes drop size vary per ring and
  ring 1 the fattest, which is backwards for a flower.
- **Radii grow with the count**, geometric rather than linear bands. Keeps drop
  size even and is the more sunflower-like answer, but rings 0 and 1 share a
  count so they would need to share a radius — that needs thought.

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
