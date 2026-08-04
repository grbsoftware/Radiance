# Radiance

Parametric color palette generator. Define anchor colors, bridges auto-calculate.

## How it works

- **Anchor colors** (tap to edit): 2 to 5 of them
- **Bridge colors** (auto-computed): the midpoint between each pair of anchors
- `+` and `-` add or remove an anchor, keeping the ones you already picked
- Bottom bar shows all hex codes for easy copy

### Bridges are computed in OKLab, not HSL

A bridge is only a bridge if it *looks* halfway between its anchors, and HSL
cannot promise that — its "lightness" is not perceived lightness.

Averaging green (`#00FF00`) and blue (`#0000FF`) in HSL gives cyan (`#00FFFF`),
which is **lighter than both colors it sits between**. It doesn't bridge, it
spikes. Measured in perceptual lightness the anchors are 0.866 and 0.452, so the
midpoint should read 0.659 — HSL puts it at 0.905, off by 0.246.

OKLab is built so equal numeric steps look like equal steps. The same pair now
midpoints to `#00AABF` at 0.676, off by 0.017 — and the residual is gamut
clipping, not the interpolation.

The color picker still edits in HSL. HSL is a fine thing to *type* in; it is
just not a thing to *average* in.

## Install as app

1. Visit the site in Safari (iOS) or Chrome (Android)
2. Tap Share → "Add to Home Screen"
3. Works offline after first load

## Host it yourself

Push to GitHub, enable GitHub Pages in Settings → Pages → Source: main branch.

Your app will be at `https://yourusername.github.io/radiance`

## License

MIT - do whatever you want with it
