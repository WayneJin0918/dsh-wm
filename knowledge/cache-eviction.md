---
id: cache-eviction
title: Cache and eviction recipes
tags: cache, kv, fifo, budget
summary: When the memory bank exceeds budget, the eviction rule is a scientific claim. FIFO is a baseline, not a default truth.
---

# Cache eviction

State the budget (tokens, frames, GiB) and the eviction rule before comparing quality.

| Recipe | Drop | Typical failure |
| --- | --- | --- |
| Token FIFO | Oldest tokens | Forgets the start of a return trip |
| Keep-last chunk | Everything but the previous chunk | Loop / identity |
| Sparse replay | Mid-history except keys | Misses the object that was not keyed |
| Importance / attention | Low-score tokens | Can drop static layout if scores chase motion |
| Compress-then-keep | Nothing, but lossy | Compressor artifacts look like drift |

## How to RSI this in Harness

Do not swap three eviction rules and a LR in one night. Use `wm-rsi`: one rule, one fixture or paired scene, `wm_rollout_diff` + `ablation-protocol`, then solidify or roll back the *recipe note* (skill / prompt / eval), not the checkpoint, unless the user is actually launching training.
