---
id: wm-routes
title: Three world-model routes
tags: routes, 3d, pixel, latent, taxonomy
summary: Name the route first — 3D display, pixel / video-gen WM, or latent prediction. The same word “world model” is three research games.
---

# Three routes

The field reused one label because it sounds good. [Awesome World Models](https://github.com/knightnemo/Awesome-World-Models) maps the split: 3D priors, 2D / pixel video, and latent-space models. Open the matching card before you design memory or an eval.

| Route | What it predicts | What “good” looks like | First card |
| --- | --- | --- | --- |
| **3D display** | Geometry you can fly / occupy (mesh, Gaussian, occupancy, 4D) | Spatial consistency, explorable scene | `display-3d` |
| **Pixel WM** (video gen) | The next pixels, often action-conditioned | Interactive strip that still obeys the stick | `pixel-wm` |
| **Latent prediction** | The next compact state (RSSM, JEPA, DINO features) | Planning / control in the dream | `latent-wm` |

## How people talk past each other

- “Is Sora a world simulator?” is a **pixel** question. A fly-through that never takes an action is **3D display**. A Dreamer rollout you cannot decode is **latent**.
- LeCun-line: do not spend the loss on every pixel. Video-gen line: pixels *are* the world, video is the new language.
- Ha & Schmidhuber (2018) and Yann’s path-to-AMI talk are the two origin posters. Everything after is a remix of those two bets.

## Pick a route before a backbone

A return-trip failure is `revisit-eval` on a pixel strip, a pose/occupancy check on a 3D scene, and a latent-state mismatch on JEPA/Dreamer. Mixing those three numbers is how a chat invents a new U-Net.

## Next

`display-3d` · `pixel-wm` · `latent-wm` · then the technique cards (`chunk-ar`, `action-following`, `revisit-eval`).
