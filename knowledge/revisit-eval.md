---
id: revisit-eval
title: Revisit versus frame-similarity proxy
tags: eval, loop, pose, consistency
summary: Pose-aligned revisit is a geometric measurement. First-vs-last SSIM is a proxy. Say which one you used.
---

# Revisit evaluation

A loop-closure claim needs either camera poses or an explicit proxy label.

## Geometric revisit

If you have camera / pose traces: find return pairs with a gap, a translation/rotation tolerance scaled to the path, and a cap on how many pairs you keep. Score those index pairs only. Do not average the whole strip and call it revisit.

## Proxy (no poses)

`wm_rollout_diff` on first vs last pred (and first vs last GT). Write **frame-similarity proxy, not geometric revisit** in the report. Also check a mid window — a pretty loop with a melted middle is still a failure.

## Related numbers

- **LVC / long-video consistency** — identity over time, not necessarily a return.
- **Flicker** — adjacent-frame instability, often a chunk boundary, not forgetting the room.
- **Action accuracy** — did the control happen; orthogonal to coming home.

Use skill `wm-revisit`. After the numbers exist, `wm_inspect` the first, mid, last, and worst windows.
