---
id: memory-types
title: Four memory granularities
tags: memory, cache, boundary, sparse
summary: Boundary, tail, sparse, and compressed memory answer “what from the past does the next chunk read?”
---

# Memory types

Pick one recipe and keep it at train and infer. Do not randomly stitch.

| Kind | Keep | Good at | Fails at |
| --- | --- | --- | --- |
| **Boundary** | Last frame / last few latents of the previous chunk | Chunk-edge continuity | Forgets earlier layout |
| **Tail** | A short contiguous suffix | Motion and camera continuation | Long-horizon identity |
| **Sparse** | Last frame plus uniform or keyed historical frames | Scene identity over a long trip | Can stutter if keys are bad |
| **Compressed** | Long history squeezed (temporal pack, FramePack, spatial memory) | Long memory under a token budget | Quality of the compressor |

A stable start is **tail** (local continuity) or **sparse** (global consistency). Compressed memory is a later upgrade: it inherits the compressor’s bugs.

## How to test

Do not change the backbone and the memory recipe in the same run. Use `wm-ablation` on shared scene/protocol/seed. `wm_rollout_diff` should report whether the drop is at chunk boundaries (boundary/tail) or at return (sparse/compressed).
