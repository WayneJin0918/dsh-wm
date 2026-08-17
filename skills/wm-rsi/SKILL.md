---
name: wm-rsi
description: "Play an RSI loop on the WM research process: one claim, one card, one measurement, one skill or wm.yaml change, gated on fixtures/sunset and a paired scene."
whenToUse: "Use when the user wants the harness itself to tighten how we debug world models — the eval, the memory note, the skill, or the next experiment — and keep a replayable gate."
---

# RSI for world-model problems in Harness

Harness already records everything the model saw (system prompt, tools, injections) and can fork, replay, and — in Creator mode — inspect the live plugin tree. That is the RSI substrate. DSH-WM aims it at world-model *research process*, not at unsupervised weight mutation.

## What RSI is allowed to change

- Skills and routing (`whenToUse`, triage order).
- `wm.yaml` and the definition of failure / revisit pairs.
- Which knowledge card is required before a claim.
- Which `wm_inspect` indices (first / mid / last / worst) the next session must open.

## What RSI is not

- A license to rewrite the U-Net or the Harness kernel from chat.
- Training-job submission. If the user opens a train script, that is a different, explicit task.
- Skipping `ablation-protocol`.

## Procedure

1. **Falsifiable claim.** One sentence. Example: “sparse memory beats FIFO on this scene, same seed, on revisit proxy.”
2. **`wm_knowledge`** `rsi-harness` plus the technique card (`memory-types`, `cache-eviction`, `exposure-bias`, …).
3. **Measure the current world.** `wm_discover` → `wm_summarize` and/or `wm_rollout_diff`. `wm_inspect` the worst frames.
4. **Inspect the harness.** In Creator / trajectory view: what skill ran, what tool args, what was injected. Do not guess.
5. **One delta.** A skill paragraph, a `wm.yaml` field, or a note the next session must load. Say the rollback.
6. **Gate.**
   - `fixtures/sunset` must still diagnose late-horizon collapse (regression).
   - User scene: paired n and failure rate (`wm-ablation`) before calling a winner.
7. **Solidify or roll back.** Keep the session. Fork rather than overwrite a dirty trajectory. Write the outcome in the changelog of the skill or in the user’s notes.

## Pitfalls

- Evolving three knobs and attributing the win to memory.
- Using a caption as the gate.
- “Creator wrote a plugin, ship it” without the sunset fixture and a paired scene.

## Verification

- The claim is written down.
- A knowledge `id` was opened.
- Before/after numbers come from `wm_rollout_diff` or summarized metrics, not vibes.
- Rollback path is stated.
