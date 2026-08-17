# Changelog

## 0.2.0 — 2026-08-17

Broader research toolkit, not only run scoring.

- Tools: `wm_knowledge`, `wm_diagnose`, `wm_inspect`.
- Skills: `wm-knowledge`, `wm-rsi`.
- Built-in cards: three routes (`wm-routes`, `display-3d`, `pixel-wm`, `latent-wm`), chunk-AR, memory types, KV memory, exposure bias, revisit, ablation, action following, cache eviction, RSI-in-Harness, diagnosis map.
- Built-in look-at-frames: `wm_inspect` writes a contact sheet, a luma sketch, and a color/contrast look. Seeing a strip does not require another plugin.
- README / 中文页按三条工作流并列：知识、RSI、测量（含看图）。
- README lead is affirmative (what the toolkit is). Vision Toolkit stays in Acknowledgements only. Route cards follow [Awesome World Models](https://github.com/knightnemo/Awesome-World-Models).
- Publish copy polished as a playable DSH toolkit: 30-second sunset playground, three-route map, bilingual prompts you would actually ask.

## 0.1.0 — 2026-08-17

Initial private release.

- Official DeepSeek Harness bundle (`dsh.bundle` + `cordis.patch.yml`), no `prepare` script.
- Tools: `wm_discover`, `wm_summarize`, `wm_rollout_diff`.
- Skills: `wm-run-triage`, `wm-ablation`, `wm-revisit`.
- Optional `wm.yaml` layout contract; heuristics when the file is missing.
- Pure-JS PNG codec and luminance SSIM / MSE. Optional `ffmpeg` for JPEG and video.
- Offline `fixtures/sunset` demo and `node cli.js` for runs without Harness.
- Bilingual README following the DSH plugin publishing layout used by [dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit).
- Acknowledgements for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) and [DSH Vision Toolkit](https://github.com/Anionex/dsh-vision-toolkit). Homepage reference: [agent-vision.anionex.me](https://agent-vision.anionex.me).
