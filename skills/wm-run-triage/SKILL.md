---
name: wm-run-triage
description: "Triage a world-model run: discover layout, summarize logs/metrics, diff pred vs GT, then optionally open a knowledge card or Vision Toolkit on the worst frames."
whenToUse: "Use when the user points at a run directory, train log, or eval output and asks what went wrong, whether the run finished, or what to look at next."
---

# World-model run triage

Do not conclude from a filename or a single log line. Tools first, then a claim.

## Procedure

1. Call `wm_discover` on the path the user named. Record `layout`, `pred`, `gt`, `log`, `metrics`, and every warning.
2. If `layout` is `unknown` or pred/gt are missing, stop and ask the user to add a `wm.yaml` (or confirm paths). Do not invent directories.
3. Call `wm_summarize` on the same path. Report last step, last loss, NaN/early-stop, and the three hypotheses verbatim.
4. If pred and gt both exist, call `wm_rollout_diff`. Treat late-horizon drop, single-frame flash, and overall blur as different failures.
5. If DSH Vision Toolkit is installed, pass the worst-frame paths to `vision_glance` or `vision_pixel_diff` (and `vision_crop` if a region must be isolated). Do not reimplement those tools. If the toolkit is absent, say so and stay with the SSIM card.
6. Answer with: what the run is, what the numbers say, which hypothesis is cheapest to test next. Do not propose a new architecture in this pass.

## Pitfalls

- Grepping the repo instead of calling `wm_discover`.
- Comparing two runs that do not share scene / protocol / seed (that is `wm-ablation`).
- Treating a caption or a still as evidence of dynamics.
- Reimplementing crop / glance / pixel heatmap when `vision_*` tools are already in the catalog.

## Verification

- Layout was produced by `wm_discover`.
- Hypotheses came from `wm_summarize`.
- Any visual claim cites `wm_rollout_diff` mean/min SSIM and the diagnosis line.
- If Vision Toolkit ran, cite the `vision_*` tool and the frame path it saw.
