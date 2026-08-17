---
id: diagnosis-map
title: Symptom to technique map
tags: diagnosis, rsi, eval
summary: Map a visual or log symptom to a knowledge card and a next tool. Do not jump to a new backbone.
---

# Symptom map

| You see | First card | First tool / skill |
| --- | --- | --- |
| First chunk fine, later chunks melt | `exposure-bias`, `chunk-ar` | `wm_rollout_diff` then `wm-rsi` |
| Flash / flicker at regular intervals | `memory-types` (boundary) | `wm_rollout_diff` then `wm_inspect` on the flash indices |
| Return trip forgets the room | `revisit-eval`, `cache-eviction` | `wm-revisit` |
| Pretty video, wrong control | `action-following` | action-window `wm_rollout_diff` |
| Train loss healthy, infer looks drunk | `exposure-bias` | compare GT-context vs pred-context if you can |
| “Our memory wins” from one seed | `ablation-protocol` | `wm-ablation` |
| Agent invents a new KV design in chat | `rsi-harness`, `kv-memory` | `wm_knowledge` then `wm-rsi` |
| Need to *see* the worst frame | (none here) | `wm_inspect` on those indices |

Always `wm_discover` before any of the above if the path is a run directory.
