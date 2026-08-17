---
id: action-following
title: Action-conditioned following
tags: action, control, eval
summary: A pretty video that ignores the control is not a world model win. Score action windows, not a single still.
---

# Action following

Interactive world models are judged on whether the next frames obey the event / camera / embodiment action, not only on texture.

## How to look

- Diff pred vs GT on the *action window*, not the whole clip mean.
- If metrics expose `action_acc` / follow rate, `wm_summarize` will surface it. A soft number is a different hypothesis from late-horizon blur.
- Captioning the last frame cannot prove a turn, a pickup, or a camera yaw.

## Common confusions

- High SSIM + low action acc → the model is copying appearance and dropping control.
- Low SSIM + high action acc → identity drift with a correct motion sketch; memory or texture, not the controller.
- Flicker at chunk edges after an action → boundary memory, not “the policy is wrong.”

`wm_inspect` the action window after `wm_rollout_diff` has named the frames.
