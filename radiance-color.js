// radiance-color -- Radiance's colour engine.
//
// sRGB <-> OKLab / OKLCH, the gamut hull, bridge midpoints, ink and contrast.
// Radiance (github.com/grbsoftware/Radiance) owns this file and loads it as
// is; other projects carry a pinned copy. Change it HERE, never in a copy.
//
// Everything is pure: hex strings and plain numbers in, the same out, no DOM
// and no state. Load it with a <script> tag, paste it into a script, or
// require() it -- it defines one name, RadianceColor.
const RadianceColor = (() => {
    'use strict';

    // HSL to Hex
    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    // Parse hex to RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // RGB to hex
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    // --- OKLab -------------------------------------------------------
    // A bridge is only a bridge if it LOOKS halfway between its anchors,
    // and HSL cannot promise that. HSL's "L" is not perceived lightness:
    // averaging green (#00FF00) and blue (#0000FF) in HSL gives cyan
    // (#00FFFF), which is LIGHTER than both colors it sits between. It
    // does not bridge, it spikes. Measured in perceptual lightness the
    // anchors are 0.866 and 0.452, so the midpoint should read 0.659 --
    // HSL puts it at 0.905, off by 0.246.
    //
    // OKLab is built so that equal numeric steps look like equal steps.
    // The same pair midpoints to #00AABF at 0.675, which is where the eye
    // expects it. Same idea for the anchors themselves: evenly spaced HSL
    // hues range over 0.41 in perceived lightness (red 0.628, green 0.866,
    // blue 0.452), which is why a "smooth" ramp never looked smooth.
    //
    // hslToHex stays, for the initial evenly-spaced anchors. HSL is a fine
    // thing to SPECIFY a starting color in. It is just not a thing to
    // average in, and nothing averages in it any more.

    function srgbToLinear(c) {
        c /= 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function linearToSrgb(c) {
        const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        return Math.max(0, Math.min(255, v * 255));
    }

    function hexToOklab(hex) {
        const rgb = hexToRgb(hex);
        const r = srgbToLinear(rgb.r), g = srgbToLinear(rgb.g), b = srgbToLinear(rgb.b);

        const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
        const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
        const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

        const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);

        return {
            L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
        };
    }

    function oklabToLinear(lab) {
        const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
        const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
        const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

        const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;

        return [
            +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
        ];
    }

    // The tolerance is not slop, it is the accuracy of the transform. The
    // OKLab matrices are fitted approximations, so a colour that sits
    // exactly ON the sRGB hull round-trips to a channel a few ten-thousandths
    // the wrong side of zero.
    //
    // At 1e-4 that broke an assumption every bisection here depends on --
    // that the ray out from neutral is in gamut up to one boundary and out
    // after it. Measured along pure blue's ray (L 0.452, H 264.05): in gamut
    // at 85% of its chroma, OUT at 90%, 95% and 99% where linear red reads
    // -0.00063, and in again at 100% where it is exactly 0. A hole in the
    // middle, and a bisection walks straight into it -- maxChroma returned
    // 0.2674 for a colour whose chroma is 0.3132, a 15% underestimate, and
    // oklabToHex used the same pattern to desaturate bridges further than
    // the gamut actually required.
    //
    // 1e-3 clears the transform's own error. In linear light that is well
    // under a quarter of an 8-bit step, and the clamp at the end of
    // oklabToHex catches whatever rounds past the edge.
    const GAMUT_EPS = 1e-3;

    function inGamut(lab) {
        return oklabToLinear(lab).every(c => c >= -GAMUT_EPS && c <= 1 + GAMUT_EPS);
    }

    // OKLab is bigger than sRGB, so a midpoint can land somewhere the screen
    // cannot show. SOMETHING has to give, and the choice of what decides
    // whether the bridge still reads as a bridge.
    //
    // Clamping each channel at the end -- the obvious way, and what this did
    // -- gives away lightness and hue, the two properties the whole OKLab
    // change was made to protect. Measured over every bridge the presets
    // produce, 23 land outside sRGB and clamping moved them up to 3.6 deg in
    // hue and 0.014 in L. The green -> blue midpoint from the notes above
    // came out at L 0.676 against a target of 0.659; that residual was
    // blamed on "gamut clipping" and this is the clipping it meant.
    //
    // Reducing CHROMA instead gives away saturation, which is the one thing
    // a bridge does not promise. Same 23 colors: worst hue shift 0.9 deg,
    // worst L error 0.0009 -- fifteen times closer. Green -> blue now lands
    // at 0.659 exactly, so the residual is gone rather than explained.
    function oklabToHex(lab) {
        let out = lab;
        if (!inGamut(lab)) {
            let lo = 0, hi = 1;
            for (let i = 0; i < 24; i++) {
                const mid = (lo + hi) / 2;
                if (inGamut({ L: lab.L, a: lab.a * mid, b: lab.b * mid })) lo = mid;
                else hi = mid;
            }
            out = { L: lab.L, a: lab.a * lo, b: lab.b * lo };
        }
        // Still clamp: chroma reduction cannot rescue an L outside [0,1],
        // and rounding leaves channels a hair over.
        return rgbToHex(...oklabToLinear(out).map(c => linearToSrgb(Math.max(0, Math.min(1, c)))));
    }

    // --- Bridge policy ----------------------------------------------
    // Both midpoints below are in OKLab and both are perceptually honest.
    // They differ in what they treat as the thing being halved.
    //
    // BLEND averages a and b as coordinates: the true midpoint of the two
    // colors as POINTS. a and b are signed, so as the anchors' hues diverge
    // the two vectors point apart and partly cancel -- gold and navy are
    // both strongly colored and their blend is #7E7D70, a drab olive grey.
    // Nothing is out of gamut there; the saturation was destroyed by the
    // arithmetic. Across the shipped presets, 12 bridges lose more than half
    // their anchors' chroma this way.
    //
    // WHEEL averages lightness and chroma as scalars and walks hue around
    // the shorter arc: the midpoint of the two HUES. Chroma at the bridge is
    // the mean of the two chromas by construction, so it cannot collapse and
    // cannot exceed the colors it sits between. Gold -> navy becomes #009083.
    //
    // Neither is a better version of the other, which is the test a setting
    // has to pass to deserve existing. Blend answers "what color is halfway
    // between these two", wheel answers "what color is halfway around from
    // one to the other". Blend stays the default because it is what every
    // saved palette was built with.
    //
    // NOT OFFERED: pushing chroma out to the gamut hull. It was measured and
    // it is a trap -- the headroom is largest exactly where hue means least.
    // Two pale neutrals whose midpoint chroma is 0.002 have 89x of it, and
    // spending it turns a soft grey into #C3FF3B. At C near zero the hue is
    // arbitrary, so amplifying it invents a color rather than finding one.

    function midpointColor(hex1, hex2, mode = 'blend') {
        const c1 = hexToOklab(hex1);
        const c2 = hexToOklab(hex2);
        const L = (c1.L + c2.L) / 2;

        if (mode === 'blend') {
            return oklabToHex({ L, a: (c1.a + c2.a) / 2, b: (c1.b + c2.b) / 2 });
        }

        const k1 = Math.hypot(c1.a, c1.b), k2 = Math.hypot(c2.a, c2.b);
        let h1 = Math.atan2(c1.b, c1.a), h2 = Math.atan2(c2.b, c2.a);
        // A grey has no hue -- CSS Color 4 calls it powerless. atan2(0,0) is
        // 0, which is red, so averaging against it would drag every bridge
        // out of a neutral anchor toward pink. Borrow the other end's hue.
        if (k1 < 1e-6) h1 = h2;
        if (k2 < 1e-6) h2 = h1;
        const d = ((h2 - h1 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        const h = h1 + d / 2, c = (k1 + k2) / 2;
        return oklabToHex({ L, a: c * Math.cos(h), b: c * Math.sin(h) });
    }

    // --- Ink on a bar -------------------------------------------------
    // This used to weight the GAMMA-ENCODED channels 0.299/0.587/0.114 and
    // switch at 0.5. Two things wrong with that, and they compound: the NTSC
    // weights are for analogue luma, not for contrast, and the channels have
    // to be linearised before any weighting means anything.
    //
    // The switch point is not a matter of taste either. White beats black
    // exactly while 1.05/(L+0.05) > (L+0.05)/0.05, so the crossover is
    // sqrt(0.0525) - 0.05 = 0.1791 -- nowhere near the midpoint, because
    // contrast is a ratio and black has the shorter run to the floor.
    //
    // Measured over the 114 colors in the preset library, the old test put
    // the wrong ink on 14 of them. The worst was #FF00FF, which got white at
    // 3.14:1 where black scores 6.70:1. Worst case anywhere goes 3.14 -> 4.72,
    // so every hex code on screen now clears AA at normal size.
    const INK_CROSSOVER = Math.sqrt(0.0525) - 0.05;

    function relativeLuminance(hex) {
        const rgb = hexToRgb(hex);
        return 0.2126 * srgbToLinear(rgb.r)
             + 0.7152 * srgbToLinear(rgb.g)
             + 0.0722 * srgbToLinear(rgb.b);
    }

    function inkOn(hex) {
        return relativeLuminance(hex) > INK_CROSSOVER ? '#000' : '#fff';
    }


    const DEG = 180 / Math.PI;

    function hexToOklch(hex) {
        const { L, a, b } = hexToOklab(hex);
        const C = Math.hypot(a, b);
        // A neutral has no hue -- CSS Color 4 calls it powerless. Reported
        // as null rather than as atan2(0, 0), which is red and would put a
        // grey into the harmony maths as though it pointed somewhere.
        const H = C < 1e-6 ? null : ((Math.atan2(b, a) * DEG) % 360 + 360) % 360;
        return { L, C, H };
    }

    function oklchToHex({ L, C, H }) {
        const h = (H === null ? 0 : H) / DEG;
        return oklabToHex({ L, a: C * Math.cos(h), b: C * Math.sin(h) });
    }

    // The most chroma sRGB can actually show at this lightness and hue.
    // The hull is nothing like a circle -- yellow reaches far further out
    // than blue -- so "hold chroma constant across these hues" is only a
    // request that can be granted up to the SMALLEST hull among them.
    function maxChroma(L, H) {
        if (H === null) return 0;
        const h = H / DEG, cos = Math.cos(h), sin = Math.sin(h);
        let lo = 0, hi = 0.4;
        for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2;
            if (inGamut({ L, a: mid * cos, b: mid * sin })) lo = mid; else hi = mid;
        }
        return lo;
    }

    function contrast(hex1, hex2) {
        const a = relativeLuminance(hex1), b = relativeLuminance(hex2);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }

    // Perceptual distance, so "widest gap" means the gap that LOOKS widest.
    // Hue distance would call red->green and green->blue equal at 120
    // degrees each when the eye does not read them that way at all.
    function oklabDistance(hex1, hex2) {
        const c1 = hexToOklab(hex1);
        const c2 = hexToOklab(hex2);
        return Math.hypot(c1.L - c2.L, c1.a - c2.a, c1.b - c2.b);
    }

    // Signed shortest arc, so a palette walking one way round the wheel
    // reads as consistent rather than as alternating +350/-10.
    function hueDelta(from, to) {
        return ((to - from + 180) % 360 + 360) % 360 - 180;
    }

    return Object.freeze({
        hslToHex, hexToRgb, rgbToHex, srgbToLinear, linearToSrgb,
        hexToOklab, oklabToLinear, GAMUT_EPS, inGamut, oklabToHex,
        midpointColor, INK_CROSSOVER, relativeLuminance, inkOn, DEG,
        hexToOklch, oklchToHex, maxChroma, contrast, oklabDistance,
        hueDelta,
    });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = RadianceColor;
