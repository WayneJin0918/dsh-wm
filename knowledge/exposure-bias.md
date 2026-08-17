---
id: exposure-bias
title: Exposure bias and scheduled sampling
tags: training, inference, drift, memory
summary: Train context is GT; infer context is the model’s own last chunk. Error enters memory and compounds. That is late-horizon collapse, not “the decoder forgot how to draw.”
---

# Exposure bias

Chunk-AR and KV-memory both teacher-force history at train time. At infer time the history is generated. If a bad chunk is written into memory, later chunks condition on a lie.

## What it looks like in DSH-WM

`wm_rollout_diff` first-half SSIM high, second-half collapse, worst frames after the first memory write. `wm_summarize` may still show a healthy train loss — the loss never saw its own garbage context.

## What to try before a new backbone

1. Log whether infer memory is GT or pred (it must be pred).
2. Scheduled sampling: a fraction of train context comes from reconstruction / teacher-forced rollout, not raw GT.
3. Do not increase memory size first — a larger bank of bad tokens drifts faster.
4. Gate the change with `wm-ablation` on the same scene/protocol/seed, and with `wm-rsi` if you are only changing a recipe or a skill.

## Not the same bug

- Single-frame flash → chunk boundary / VAE / decode glitch (`memory-types` boundary).
- Action not followed → conditioning, not memory (`action-following`).
- Return trip fails with a good mid-rollout → identity memory (`revisit-eval`).
