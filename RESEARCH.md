# What we measured, and what the literature says

Working notes for the measured view ("Measure" alongside "Make"). Everything
here is either a number we produced or a citation we checked. Where the two
disagree with received colour theory, they agree with each other.

## What we measured

Two samples: the 42 shipped presets, and the 992 palettes in
`Experience-Monks/nice-color-palettes` (the top palettes on ColourLovers,
fetched at runtime, not vendored).

Correlation with minimum contrast against the better of white/black:

| | 42 presets | 992 palettes |
|---|---|---|
| lightness range | **-0.75** | **-0.84** |
| chroma (mean hull use) | +0.13 | -0.04 |
| harmony (degrees off canonical) | -0.01 | -0.05 |
| harmony (evenness) | -0.01 | — |

**Harmony and chroma predict nothing.** Both are noise at n=992. The only
thing that moves contrast is lightness range, and that is a mechanism rather
than a discovery: a palette spanning light to dark must put something near
the middle, and mid-lightness is where contrast against both grounds is worst.

Two hypotheses were tested and **failed**, recorded so they are not retried:

1. *Chroma restraint predicts usability.* Fitted from three hand-picked
   palettes, died at n=42. Passing palettes average HIGHER hull use than
   failing ones (0.84 vs 0.77).
2. *Ramps and categorical sets are two distinct populations.* Predicted
   lightness range and hue spread would correlate negatively. Measured +0.24,
   and the lightness-range distribution is unimodal (63/226/408/258/37).

### The metric was malformed

"Minimum contrast across the palette" punishes a ramp for being a ramp.
Restated as the Sjonis rule — one accent at 4.5:1, the rest as blocks at 3:1:

- 992/992 palettes have a usable accent
- 349/992 (35%) have every colour clearing 3:1

Our own 42 do better than the borrowed list: 55% vs 35%.

## What the literature says

**Schloss & Palmer (2011)**, *Attention, Perception, & Psychophysics.*
Harmony and pair preference both increase with hue **similarity**. No evidence
for harmony of contrast in hue — explicitly contradicting Chevreul (1839),
which is where the complementary-colour doctrine comes from. Preference tracks
lightness contrast and component-colour preference more than harmony.
Preference for harmony *decreases* with artistic training.

**Colorgorical** (Gramazio, Laidlaw & Schloss), *IEEE TVCG* 23(1), 2017.
The important result: **discriminability and preference are directly opposed.**
Measured in 137 participants —

| | preference rating | discrimination |
|---|---|---|
| Perceptual Distance | r = -0.897, -0.751 | improves |
| Name Difference | r = -0.969, -0.57, -0.891 | improves (strongest predictor) |
| Pair Preference | r = +0.971, +0.57, +0.796 | gets worse |

So there is no single "good palette" score. There are two axes and they pull
against each other. That is the thing to expose — and no free tool does.

Also from the paper:

- **Name Difference beats Perceptual Distance** as a discriminability
  predictor. Colours people *name* differently are more distinguishable than
  ΔE says. Needs a colour-naming dataset; the XKCD colour survey is the usual
  free one. We have no equivalent of this axis.
- **Name Uniqueness is behaviourally null** — not significant for error, RT
  or preference (p >= 0.207). Three scoring functions, not four.
- **Score the worst pair, not the mean** — "a palette is only as discriminable
  or preferable as its lowest pair."
- Generate 10 candidates, return the one with the best minimum pair preference.

## What does NOT port

- **Their constants are CIELAB. Radiance is OKLab.** Noticeable difference at
  ΔL 22.747 / Δa 31.427 / Δb 44.757; the disliked dark yellow-green region at
  L ∈ [35,75], H ∈ [85°,114°]; sampling limited to L ∈ [25,85]. These need
  re-deriving in OKLab. Quoting them across would be exactly the folklore
  mistake that the RYB harmony angles are.
- **Their pair-wise preference model breaks down above 3 colours.** The paper
  says so: 5-colour results went non-significant, and they call for
  higher-order combination scores. **Radiance generates up to 9.**

Hence the measured view should be honest per metric about its own reach:

| | valid at 9 colours? |
|---|---|
| contrast against a ground | yes — per-colour physics |
| discriminability / noticeable difference | yes — pairwise |
| preference prediction | **no** — validated to 3 |

At 9 colours it can say "these two are too close to tell apart" and "this one
cannot carry text on white" with confidence, and should stay quiet about
whether you will like it.

## Weaker sourcing, flagged

**APCA** is not in the same category as the two papers above. WCAG 2's contrast
maths is widely criticised — particularly that it cannot give sound guidance
near black, which matters because this app's ground is `#000` and `inkOn` is
derived from WCAG 2 luminance. But APCA was pulled from the WCAG 3 working
draft in July 2023 with the algorithm still undetermined, and much of the
criticism is on its own advocacy site. Treat as a live standards argument, not
a finding. Our on-white numbers are more trustworthy than our on-black ones.

## Preset provenance

The 42 shipped presets were **written for this repo**, not copied. Checked
against all 992 ColourLovers palettes: zero exact matches, and only 3 of our
114 distinct colours (`#FF6B6B`, `#4ECDC4`, `#FFFF00`) appear anywhere in
theirs. Nothing to attribute.

If we ever ship the 992: the repo is MIT, but its README says the data is "the
top color palettes on ColourLovers.com" — that MIT is the repo author's
relicensing of scraped data, not ColourLovers' own terms. Credit both, and do
not lean on it commercially.

## Open

- Re-derive the discriminability thresholds in OKLab.
- Name Difference needs a naming dataset before it can exist here.
- The 992 are all "nice palette" specimens, so the range is restricted; the
  correlations could shift on a broader sample.
