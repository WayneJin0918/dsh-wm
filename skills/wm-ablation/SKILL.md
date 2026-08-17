---
name: wm-ablation
description: "Compare world-model configs only on shared scene/protocol/seed pairs. Report paired n and failure rate before any mean difference."
whenToUse: "Use when the user asks which memory, cache, or sampling config won, wants an ablation table, or is about to change a baseline after one lucky seed."
---

# Fair ablation

A mean without a paired set is not a result.

## Procedure

1. Discover every run the user named. List `name`, metrics path, and warnings.
2. Build the comparison key as `(scene, protocol, seed)` or the closest fields present in each metrics JSON. Drop rows that do not share a key with the baseline.
3. Report, in this order:
   - paired n
   - failure rate per config (and how `failure` was defined)
   - mean difference on each metric, only over the paired surviving rows
4. Do not average a failed run as zero unless the user explicitly wants an intent-to-treat number. Say which choice you used.
5. If n < 3, say the comparison is underpowered. Prefer another seed over a new idea.

## Pitfalls

- Mixing scenes (Sunset vs Mangrove) in one mean.
- Declaring a winner from a single seed.
- Changing two knobs (memory and LR) and attributing the delta to one of them.

## Verification

- Paired n is stated.
- Failure rate is stated before the mean delta.
- Every compared run was discovered; missing metrics are listed, not silently skipped.
