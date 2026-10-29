# Photosensitive safety

Broadcast and accessibility guidelines (for example ITU-R BT.1702 and WCAG's three-flashes rule) limit flashing that can trigger seizures. Treat these as hard limits for any moving work, generated or designed.

## Hard limits

- No more than three strong brightness flashes in any one-second period over a large part of the screen (about a quarter or more). Saturated red flashes are especially risky
- No fast scrolling, vibrating, or flickering high-contrast regular patterns (black and white stripes, checkerboards) across the whole screen

## Keeping strong motion within the limits

- **Trails instead of hard clears**: paint a translucent background over the previous frame instead of clearing it. Motion leaves a fading trail, which softens the change seen by the eye
- **Local motion**: move particles or parts of the frame fast, not the whole view. Shaking or spinning the entire camera also causes motion sickness
- **Smooth values**: drive changes with noise or interpolation, not per-frame random jumps, which flicker
- **Control luminance peaks**: avoid large areas of pure saturated bright color. Use gradients and additive glow to suggest brightness without full-frame jumps
- **Temporal blending** as a last resort: blending each frame with the previous one (for example 50/50) damps flicker above a few hertz, at the cost of motion blur

## Checking

Run the flash screening on every moving output, and look at the moments it flags frame by frame. For broadcast or contractual compliance, use a dedicated analyzer.
