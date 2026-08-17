---
id: ablation-protocol
title: Fair ablation protocol
tags: eval, ablation, seed, statistics
summary: Compare only shared (scene, protocol, seed). Report paired n and failure rate before any mean delta.
---

# Fair ablation

A mean without a paired set is not a result.

1. Discover every named run.
2. Key = `(scene, protocol, seed)` or the closest fields in metrics JSON.
3. Drop rows that do not share a key with the baseline.
4. Report, in order: paired n → failure rate (and the definition of failure) → mean difference on surviving pairs.
5. Do not average a failed run as zero unless the user asked for intent-to-treat. Say which choice you used.
6. If n < 3, say the comparison is underpowered. Prefer another seed over a new idea.
7. One knob per comparison. Memory recipe and LR in the same delta cannot be attributed.

This is the discipline behind skill `wm-ablation`. RSI (`wm-rsi`) may change a skill or an eval recipe; it may not skip this table.
