# Stock footage submission

Requirements change. Read the platform's current technical requirements before answering questions about them, and treat the points below as things to check, not fixed numbers.

## Duration

- Platforms set a minimum clip length (often a few seconds). Build it into the work: register the composition at or above the minimum rather than stretching it at export time
- For short animations such as transitions, keep the short version and add a padded version at the minimum length (see `remotion:duration-variants` for one way)

## File size

- Upload limits apply per file. High-bit-depth ProRes with alpha grows fast
- Size grows roughly in proportion to duration. When a file exceeds the limit, compute the longest duration that fits: `limit ÷ (size ÷ seconds)`. If that is still above the minimum duration, shorten the composition within that range instead of dropping the clip
- Shortening a loop also shortens its period and makes the motion faster. If the speed must stay the same, check that trimming does not break the loop before deciding

## What to submit

- Submit the normal export: MP4 for clips with a background, the transparent MOV for overlays. Avoid a separate "stock-only" export path that can drift from what was reviewed
- Verify every file with the spec check before uploading
