---
name: wm-run-triage
description: "Walk a world-model run like a playground level: discover the layout, summarize the log, diff pred vs GT, then look at the worst frames with wm_inspect."
whenToUse: "Use when the user points at a run, fixtures/sunset, a train log, or eval output and wants to play through what failed, whether it finished, or what to look at next."
---

# World-model run triage

Do not conclude from a filename or a single log line. Tools first, then a claim.

## Procedure

1. Call `wm_discover` on the path the user named. Record `layout`, `pred`, `gt`, `log`, `metrics`, and every warning.
2. If `layout` is `unknown` or pred/gt are missing, stop and ask the user to add a `wm.yaml` (or confirm paths). Do not invent directories.
3. Call `wm_summarize` on the same path. Report last step, last loss, NaN/early-stop, and the three hypotheses verbatim.
4. If pred and gt both exist, call `wm_rollout_diff`. Treat late-horizon drop, single-frame flash, and overall blur as different failures.
5. Call `wm_inspect` on the run (or on the worst-frame paths from the diff). Use `indices` for those frames, or `first,mid,last`. Read the contact sheet, the luma sketch, and the look line before you describe what the pixels show.
6. Answer with: what the run is, what the numbers say, which hypothesis is cheapest to test next. Do not propose a new architecture in this pass.

## Pitfalls

- Grepping the repo instead of calling `wm_discover`.
- Comparing two runs that do not share scene / protocol / seed (that is `wm-ablation`).
- Treating a caption or a still as evidence of dynamics.
- Describing a frame you have not passed through `wm_inspect`.

## Verification

- Layout was produced by `wm_discover`.
- Hypotheses came from `wm_summarize`.
- Any visual claim cites `wm_rollout_diff` mean/min SSIM, the diagnosis line, and a `wm_inspect` tile (index + look or sketch).
