# Changelog

## 0.1.0 — 2026-08-17

Initial private release.

- Official DeepSeek Harness bundle (`dsh.bundle` + `cordis.patch.yml`), no `prepare` script.
- Tools: `wm_discover`, `wm_summarize`, `wm_rollout_diff`.
- Skills: `wm-run-triage`, `wm-ablation`, `wm-revisit`.
- Optional `wm.yaml` layout contract; heuristics when the file is missing.
- Pure-JS PNG codec and luminance SSIM / MSE. Optional `ffmpeg` for JPEG and video.
- Offline `fixtures/sunset` demo and `node cli.js` for runs without Harness.
- Bilingual README following the DSH plugin publishing layout used by [dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit).
- Acknowledgements for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) and [DSH Vision Toolkit](https://github.com/Anionex/dsh-vision-toolkit); compose `vision_glance` / `vision_pixel_diff` / `vision_crop` instead of shipping a second vision stack. Homepage reference: [agent-vision.anionex.me](https://agent-vision.anionex.me).
