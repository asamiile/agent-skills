# AGENTS.md

Template for a repository of generative artworks produced with AI agents. Replace `{...}` and delete what does not apply.

## Workflow

Run the `generative-art:autonomous-artwork-loop` skill (one work, or continuously). Each work goes through brief → implementation → preview → critique (at most two revisions) → documentation → commit → archive.

## Files

- `WORKS.md`: catalog of every work. Agents append
- `FEEDBACK.md`: the user's ratings and comments. **Agents never write the `Rating` or `Comment` fields**
- `sketch/{work_name}/`: code, `README.md`, previews (`{work_name}_p1.png`, ...). Frames and videos are not committed
- `lib/`: shared helpers (sizes, preview saving, rendering, post-processing)

## Constraints

- Tool: {py5 / p5.js / TouchDesigner / ...}. Use the template in {path}
- Resolution: preview {width × height}, output {width × height}
- Animation: {fps}, {min-max} seconds
- No fixed random seeds; every run should differ
- Sketches save their preview and exit on their own. Run them with a timeout
- Stay within flashing limits for moving works
- Palettes: 3-5 colors, no full-spectrum rainbow by default

## Git

- Work on `feature/works-YYYYMMDD`. Never push to `main` directly
- Stage only `sketch/{work_name}/`, `WORKS.md`, `FEEDBACK.md`
- After the commit, move videos to {remote} (see the offload command in `README.md`)
