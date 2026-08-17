---
id: pixel-wm
title: Pixel / video-gen world models
tags: pixel, video, sora, cosmos, genie, interactive
summary: Predict the next pixels — Sora, GameNGen, Cosmos, Genie, Matrix-Game. A pretty clip is the lobby; the stick and the return trip are the boss fight.
---

# Pixel world models

2D-prior / video-gen route: the observation *is* the frame. Awesome-WM splits “video generation models as world simulators” from the later “craft a T2V model into an interactive WM” papers (Vid2World, AVID, IRASim).

Landmarks people actually mean: Sora’s “video generation models as world simulators,” GameNGen / DIAMOND / Oasis / Matrix-Game (pixel game engines), Genie 3, Cosmos, Self-Forcing / Diffusion Forcing, WorldMem.

## Field tropes

- **Is Sora a world simulator?** The survey title is the meme. Photorealism is not physics and not a policy. PhyWorld / VideoVerse ask how far T2V still is from a WM.
- **Video as the new language** — pixels as the interface for decision-making. That claim still needs an action window (`action-following`).
- **Pretty video, wrong stick.** High SSIM + ignored yaw / button is the default failure. Score the action slice, not the trailer still.
- **Self-forcing / exposure bias.** Train on GT context, infer on own frames — late-horizon melt (`exposure-bias`, `chunk-ar`).
- **LeCun heckle.** “Do not predict every pixel.” Pixel people answer: the decoder *is* the product (interactive game, driving video, Cosmos transfer).

## How to measure here

- `wm_rollout_diff` on pred vs GT; then `wm_inspect` first / mid / last and the worst indices.
- Late-horizon drop, single-frame flash, and overall blur are different diagnoses.
- Revisit without poses is a **frame-similarity proxy** (`wm-revisit`).
- Interactive claims need the action window, not a mean over the whole clip.

## Next

`wm-routes` if the paper might actually be 3D or latent. `chunk-ar` / `memory-types` for long strips. `action-following` for control. `latent-wm` if they already encode and only decode for the demo.
