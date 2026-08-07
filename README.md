# Radiance

Parametric color palette generator. Define anchor colors, bridges auto-calculate.

## How it works

- **Anchor colors** (tap to edit): 2 to 7 of them
- **Bridge colors** (auto-computed): the midpoint between each pair of anchors
- `+` and `-` add or remove an anchor, keeping the ones you already picked
- **Bridges: Blend or Wheel** (in ☰) — two ways to be halfway
- Bottom bar shows all hex codes for easy copy

**Make** and **Show** are the two pages. Make is the palette as columns you can
edit; Show is the same palette as a sunflower. **Measure** is a lens over Make,
not a third page — it reports what each colour does on white or black, and it
says only what it can support (contrast as physics, the closest pair as a
ranking rather than a threshold, and preference not at all).

### Bridges are computed in OKLab, not HSL

A bridge is only a bridge if it *looks* halfway between its anchors, and HSL
cannot promise that — its "lightness" is not perceived lightness.

Averaging green (`#00FF00`) and blue (`#0000FF`) in HSL gives cyan (`#00FFFF`),
which is **lighter than both colors it sits between**. It doesn't bridge, it
spikes. Measured in perceptual lightness the anchors are 0.866 and 0.452, so the
midpoint should read 0.659 — HSL puts it at 0.905, off by 0.246.

OKLab is built so equal numeric steps look like equal steps. The same pair now
midpoints to `#00A5B4` at 0.659 — exactly where the eye expects it.

The color picker still edits in HSL. HSL is a fine thing to *type* in; it is
just not a thing to *average* in.

### Out-of-gamut midpoints give up saturation, not lightness

OKLab is bigger than sRGB, so a midpoint can land somewhere the screen can't
show. Clamping each channel — the obvious fix — throws away lightness and hue,
the two things the OKLab change was made to protect. Over every bridge in the
preset library, 23 land outside sRGB and clamping moved them up to **3.6° in hue
and 0.014 in lightness**.

Reducing *chroma* until the color fits gives up saturation instead, which is the
one thing a bridge never promised. Same 23 colors: worst hue shift **0.9°**,
worst lightness error **0.0009**.

### Blend vs Wheel

Both are OKLab and both are honest. They disagree about what is being halved.

| | what it means | gold → navy |
|---|---|---|
| **Blend** (default) | the color halfway between the two, as points in color space | `#7E7D70` |
| **Wheel** | halfway around the color wheel, holding the average saturation | `#009083` |

Blend averages signed coordinates, so as two anchors' hues diverge their vectors
partly cancel and the bridge drifts toward grey — 12 of the preset bridges lose
more than half their anchors' chroma that way. Wheel averages lightness and
chroma as numbers and walks hue the short way round, so it cannot collapse, and
cannot come out more saturated than the colors it sits between.

Where the two anchors are close in hue, or where sRGB has no room left, the two
settings produce the same color.

**Not offered: pushing saturation to the edge of the gamut.** It was measured
and it's a trap — the headroom is largest exactly where hue means least. Two
pale neutrals with a midpoint chroma of 0.002 have 89× of it, and spending it
turns a soft grey into `#C3FF3B`.

### Hex codes are legible on every bar

The label ink switches on WCAG relative luminance at the real crossover,
`sqrt(0.0525) - 0.05 = 0.1791` — not at the midpoint, because contrast is a
ratio and black has the shorter run to the floor. The old NTSC-luma-at-0.5 test
put the wrong ink on **14 of the 114 preset colors**; the worst, `#FF00FF`, got
white at 3.14:1 where black scores 6.70:1.

## Install as app

1. Visit the site in Safari (iOS) or Chrome (Android)
2. Tap Share → "Add to Home Screen"
3. Works offline after first load

## Host it yourself

Push to GitHub, enable GitHub Pages in Settings → Pages → Source: main branch.

Your app will be at `https://yourusername.github.io/radiance`

## License

MIT - do whatever you want with it
