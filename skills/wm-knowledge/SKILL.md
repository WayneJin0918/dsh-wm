---
name: wm-knowledge
description: "Look up built-in world-model technique cards before proposing an architecture, memory recipe, or eval protocol. Covers the three routes (3D display, pixel / video-gen WM, latent prediction), chunk-AR, KV memory, eviction, exposure bias, revisit, ablation, and RSI-in-Harness."
whenToUse: "Use when the user asks which WM lineage they are in (3D vs pixel vs latent), how to design memory, KV cache, long-horizon training, revisit metrics, or what a failure mode means. Prefer this over inventing a new backbone from a chat."
---

# Built-in world-model knowledge

This bundle ships technique cards. Read them before you design.

## Procedure

1. Call `wm_knowledge` with the user's words (or no query to list the catalog).
2. If several cards match, open the top one by `id` (`wm_knowledge` with `id`).
3. Map the symptom with card `diagnosis-map` when the user only has a feeling (“it forgets when we come back”).
4. Only then measure: `wm_discover` / `wm_summarize` / `wm_rollout_diff` if a run path exists.
5. Architecture advice must cite a card id. “I think we should add KV” without `kv-memory` is not allowed.

## Catalog (always current via the tool)

`wm-routes`, `display-3d`, `pixel-wm`, `latent-wm`, `chunk-ar`, `memory-types`, `kv-memory`, `exposure-bias`, `revisit-eval`, `ablation-protocol`, `action-following`, `cache-eviction`, `rsi-harness`, `diagnosis-map`.

Name the route (`wm-routes`) before a backbone. 3D display, pixel / video-gen, and latent prediction are different exams.

## Pitfalls

- Quoting a paper from memory instead of opening the card and then the run.
- Jumping to `kv-memory` before `chunk-ar` is a working baseline.
- Treating this skill as a substitute for `wm-rsi` (knowledge is the prior; RSI is the loop).
