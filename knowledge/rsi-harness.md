---
id: rsi-harness
title: RSI on world-model problems inside DeepSeek Harness
tags: rsi, harness, creator, trajectory, skills
summary: Use DSH trajectories, forks, Creator mode, and this bundle’s fixtures to improve the research loop — skills, prompts, eval recipes — not to fantasize a self-rewriting backbone.
---

# RSI with Harness

DeepSeek Harness is already an RSI-friendly runtime: append-only session logs, fork/replay, Creator mode (inspect the live plugin tree, try plugins in memory), and skills you can edit without forking `deepseek-ai/deepseek-harness`.

DSH-WM uses that surface on **world-model research problems**. The optimization target is the *harness layer* around the model.

## What you may evolve

- Skills and their `whenToUse` (triage order, ablation rules).
- Eval recipes (`wm.yaml`, which frames count as revisit, failure definition).
- Hypotheses the summarizer is allowed to emit.
- Which Vision Toolkit tool is called on which worst frame.

## What you may not silently evolve

- Training code and checkpoints, unless the user explicitly opened that repo and a job.
- A new memory architecture invented only from a caption.
- The Harness kernel. Propose a plugin or a skill patch; do not patch Cordis.

## Loop

1. **Name a falsifiable claim.** Example: “sparse memory beats FIFO on Sunset revisit, same seed.”
2. **`wm_knowledge`** the technique (`memory-types`, `cache-eviction`, `revisit-eval`, …).
3. **Measure.** `wm_discover` → `wm_summarize` / `wm_rollout_diff` (and Vision Toolkit on worst frames if installed).
4. **Propose one change** to a skill, a `wm.yaml`, or a note in the session. In Creator mode, inspect the current plugin tree first.
5. **Gate.** Re-run `fixtures/sunset` (must still report late-horizon drop) plus the user’s paired scene. Use `ablation-protocol`.
6. **Solidify or roll back.** Keep the trajectory. Fork the session if the change is dirty. Prefer `dsh` replay over “I think it helped.”

## Why this is the right RSI grain

Harness records everything the model saw. World-model papers die on irreproducible eval, not on missing a novel attention kernel. RSI that improves *how the agent measures and remembers a failure* compounds; RSI that rewrites the U-Net from a chat does not.

See skill `wm-rsi`.
