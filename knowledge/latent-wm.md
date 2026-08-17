---
id: latent-wm
title: Latent prediction world models
tags: latent, jepa, dreamer, rssm, planning
summary: Predict the next compact state — Ha/Schmidhuber, Dreamer, JEPA, DINO-WM. Plan in the dream; a decoded video is a projector, not the score.
---

# Latent prediction

Awesome-WM: “for planning and policy evaluation, learning in latent space is enough — and is believed to work better.” Two origin posters: Ha & Schmidhuber *World Models* (V / M / C, dream in a compact code) and LeCun’s JEPA path (predict the representation, not the pixels).

Landmarks: Dreamer v1–v3 (RSSM + latent imagination), I-JEPA / V-JEPA / V-JEPA 2, DINO-WM / DINO-Foresight (frozen visual features + a predictor a planner can use).

## Field tropes

- **Do not predict every pixel.** The loss sits on z. A pretty decode is optional UX. “Reconstruction or semantics?” is the useful question for a latent — a code that rebuilds RGB can still be useless for control.
- **Dream to control.** Dreamer-line: roll imagined latents, train the policy in the dream. The gate is return / success / collision, not SSIM on a dumped video.
- **You cannot see the dream unless you decode.** `wm_inspect` on a decoded strip is a projector. Cite the latent metric (or the task) as the claim; label RGB as a look.
- **JEPA vs RSSM.** JEPA co-trains encoder + predictor in embedding space (often no decoder). RSSM keeps a generative latent dynamics model. Do not call every compact predictor “JEPA.”
- **Othello / maze “world model inside the net”** is a *probe* that a policy contains a map. It is not a pixel WM and not a 3D display.

## How to measure here

- Prefer task / planning numbers, latent prediction error, or a paired policy eval (`wm-ablation`).
- If they dumped decoded frames, `wm_rollout_diff` + `wm_inspect` are looks, then say **decoded proxy**.
- Train-loss-down, dream-drunk is still `exposure-bias` — the context at infer is the model’s own z.

## Next

`wm-routes` to place the paper. `action-following` if they also claim a decoded interactive video. `pixel-wm` if the main loss is still RGB. `display-3d` if the latent is occupancy / a 3D code.
