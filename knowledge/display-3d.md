---
id: display-3d
title: 3D display world models
tags: 3d, display, geometry, gaussian, occupancy, mesh
summary: Build a scene you can occupy — mesh, Gaussian, occupancy, 4D. Spatial consistency lives in the representation; the stick and the next state are the second exam.
---

# 3D display

This route builds a world you can *move through*, not a movie you watch. Awesome-WM files it under 3D vision priors and “3D mesh space”: HunyuanWorld, Matrix-3D, WorldLabs Marble / RTFM, WorldGen, occupancy / BEV stacks in driving.

## What it is for

- Explorable / immersive scenes from words or pixels.
- Geometry that stays put when the camera turns (the point of a 3D prior).
- Driving and city stacks that live in occupancy, LiDAR, or lane topology rather than RGB.

## Field tropes

- **Understanding the world vs predicting the future.** A pretty reconstruction can be a reconstructor. A world model still has to roll the next state under an action.
- **Spatial consistency is bought, not painted.** Mesh / Gaussian / occupancy make loop-closure a geometry question. Pixel SSIM on a rendered view is a proxy — say so (`revisit-eval`).
- **Fly-through ≠ joystick.** A traversable scene that ignores control is a display. Score the action window (`action-following`) or the occupancy next-step, not the trailer.
- **Hybrids exist.** Geometry Forcing and “unified video + 3D” papers graft a 3D prior onto a pixel model. Name both routes; do not collapse them into “we added 3D.”

## How to measure here

- Prefer pose, depth, occupancy IoU, or a rendered novel view with a known camera.
- `wm_inspect` the rendered strip after `wm_rollout_diff` if you only have RGB dumps.
- A melted texture with a stable mesh is a renderer / appearance bug. A sliding mesh with pretty RGB is a geometry bug.

## Next

`wm-routes` to place the paper. `revisit-eval` if they sold a loop. `action-following` if they sold interaction. `pixel-wm` if the backbone is still a video generator with a 3D regularizer.
