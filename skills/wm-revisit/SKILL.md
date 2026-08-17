---
name: wm-revisit
description: "Check long-horizon and loop-closure consistency. Without camera poses, use first/mid/last and worst-window frame similarity and say clearly this is not geometric revisit."
whenToUse: "Use when the user asks about revisit, loop closure, going back, long-horizon drift, or why a return trip does not look like the start."
---

# Revisit and long-horizon consistency

Pixel similarity is a proxy. Pose-aligned revisit is a different measurement.

## Procedure

1. `wm_discover` the run. Confirm pred (and gt if present).
2. `wm_rollout_diff` pred vs GT over the full available strip.
3. Read the diagnosis:
   - second-half SSIM drop → late-horizon collapse
   - min far below mean → a flash or a single bad chunk
   - low mean everywhere → identity / texture drift
4. If the user cares about *return*:
   - With poses or a revisit JSON: use those pair indices; do not invent them.
   - Without poses: compare first vs last pred frames (and first vs last GT) with `wm_rollout_diff`. Label the number **frame-similarity proxy, not geometric revisit**.
5. Also glance at a mid-window. A good loop with a melted middle is still a failure.
6. If DSH Vision Toolkit is present, run `vision_glance` or `vision_pixel_diff` on the first, mid, last, and worst windows. Keep the SSIM number from `wm_rollout_diff`; use toolkit tools only for what the pixels show.

## Pitfalls

- Calling a first-last SSIM a loop-closure score.
- Ignoring chunk boundaries (flicker there is not the same as forgetting the room).
- Using a text caption of the last frame as evidence of spatial memory.

## Verification

- The answer states whether poses were available.
- If poses were missing, the phrase "not geometric revisit" appears.
- Worst-window frames from `wm_rollout_diff` are cited.
