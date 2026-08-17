# DSH-WM

[![MIT](https://img.shields.io/badge/license-MIT-0B7285?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-Web%20%2B%20Headless%20%2B%20wm-5B4CF0?style=flat-square)](cordis.patch.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-0B7285?style=flat-square)](package.json)

**A world-model research toolkit for DeepSeek Harness: measure runs, look up built-in technique knowledge, and run RSI on the research loop.**

Ask why a return trip forgot the room, whether sparse memory beats FIFO on a paired seed, or how Creator mode should iterate a skill — and get a card, a measurement, and a rollback.

🚀 One command to install | Built-in WM knowledge | RSI on skills and evals

🌐 **English** | [中文](README.zh.md)

If you train or evaluate world models (video / action-conditioned generation, memory, revisit) inside DeepSeek Harness, the usual pain is the same: a rollout has no layout, two runs do not share a seed, and “looks close” has no number.

This profile bundle ships technique cards, symptom → next-step diagnosis, run measurement, and an RSI loop that uses Harness trajectories, Creator, and fixtures to tighten how you debug world models.

```sh
dsh plugin --profile wm add github:WayneJin0918/dsh-wm
dsh --profile wm
```

**Runtime:** [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)

<details>
<summary>Table of contents</summary>

- [Highlights](#highlights)
- [Who it is for](#who-it-is-for)
- [Quick start: three steps](#quick-start-three-steps)
- [Common workflows](#common-workflows)
- [Toolbox](#toolbox)
- [RSI with Harness](#rsi-with-harness)
- [Acknowledgements](#acknowledgements)

</details>

## Highlights

- **One command to install.** Official bundle format, pure JavaScript, no `prepare` / `allowBuilds`.
- **A run is a directory, not a vibe.** Optional `wm.yaml` declares pred / gt / log / metrics. No manifest → heuristics. Cannot tell → candidates and warnings, never invented paths.
- **Measure a run when you have one.** `wm_discover` → `wm_summarize` → `wm_rollout_diff` for layout, logs, and pred/GT numbers.
- **Look at the frames in-repo.** `wm_inspect` samples first / mid / last (or named indices), writes a contact sheet, and returns a luma sketch plus a color/contrast look.
- **Built-in WM knowledge.** Three routes first (3D display, pixel / video-gen WM, latent prediction), then chunk-AR, memory types, KV memory, exposure bias, revisit vs proxy, ablation, action following, cache eviction, and RSI-in-Harness. `wm_knowledge` / `wm_diagnose` before a new architecture.
- **RSI on the harness layer.** Skill `wm-rsi` uses DSH trajectory, fork, Creator, and `fixtures/sunset` to evolve skills, `wm.yaml`, and eval recipes — not to silently rewrite the backbone.
- **Skills that keep the agent honest.** Triage, knowledge, RSI, fair ablation, revisit.
- **Works without Harness.** The same tools run as `node cli.js` for CI and offline demos — including `knowledge` and `diagnose`.
- **No GPU required to start.** Rollout scores are luminance SSIM + MSE in pure JS. Videos need `ffmpeg`; PNG/PPM frame folders do not.

## Who it is for

| The problem | What DSH-WM delivers |
| --- | --- |
| **The agent cannot see what a run contains** | `wm_discover` returns layout, paths, frame counts, and warnings |
| **A log tail is not a conclusion** | `wm_summarize` reports last step / loss / NaN / early-stop plus three testable hypotheses |
| **“Looks worse” is not a metric** | `wm_rollout_diff` returns mean/min SSIM, a curve, worst frames, and a one-line diagnosis |
| **The agent needs to look at those frames** | `wm_inspect` returns a contact sheet, luma sketches, and a per-tile look |
| **Ablations mix scenes and seeds** | `wm-ablation` requires paired `(scene, protocol, seed)` and failure rate before any mean |
| **First-vs-last SSIM is sold as loop closure** | `wm-revisit` labels that number a frame-similarity proxy, not geometric revisit |
| **The agent invents a KV design from a caption** | `wm_knowledge` / `wm_diagnose` open `kv-memory` and `chunk-ar`; no card, no architecture |
| **Sora, a Gaussian scene, and Dreamer get one recipe** | `wm-routes` then `pixel-wm` / `display-3d` / `latent-wm` — name the route before the backbone |
| **We want the harness to improve how we debug WM** | `wm-rsi`: one claim, one card, one measurement, one skill/`wm.yaml` delta, sunset + paired gate |

## Quick start: three steps

### 1. Install

Into a dedicated research profile:

```sh
dsh plugin --profile wm add github:WayneJin0918/dsh-wm
```

Web or Headless also work:

```sh
dsh plugin --profile web add github:WayneJin0918/dsh-wm
dsh plugin --profile headless add github:WayneJin0918/dsh-wm
```

From a local checkout (this repository is private; a path install does not need GitHub access):

```sh
dsh plugin --profile wm add /path/to/dsh-wm
```

The package is pure JS. Git installs do not need pnpm `allowBuilds`. Pin a commit if you do not want a moving default branch: `github:WayneJin0918/dsh-wm#<sha>`.

### 2. Restart and check it

```sh
dsh --profile wm --dump-config    # look for "# == dsh-wm"
dsh --profile wm
```

Restart a running Web profile after adding the bundle, then start a new session so the skill catalog reloads.

Without Harness:

```sh
node cli.js knowledge --id rsi-harness
node cli.js diagnose "return trip forgot the room"
node cli.js discover fixtures/sunset
node cli.js summarize fixtures/sunset
node cli.js diff --pred fixtures/sunset/pred --gt fixtures/sunset/gt
node cli.js inspect fixtures/sunset --indices first,mid,last
```

### 3. Ask a research question, not only “diff these folders”

Put a `wm.yaml` in the run root (or rely on heuristics), then ask:

```text
Triage fixtures/sunset. What failed, and is it late-horizon?
The return trip forgot the room — which memory recipe is even allowed?
Use Harness RSI to tighten the revisit skill; keep sunset as a regression gate.
These two runs claim a memory win — are they paired on scene/protocol/seed?
```

## Common workflows

| Task | Recommended workflow |
| --- | --- |
| A training or eval run looks wrong | `wm-run-triage` → discover → summarize → diff → inspect |
| “What kind of memory should we use?” | `wm-knowledge` → `chunk-ar` / `memory-types` / `kv-memory` → then measure |
| Which WM route is this paper? | `wm-routes` → `display-3d` / `pixel-wm` / `latent-wm` |
| Late-horizon melt, train loss fine | `wm_diagnose` → `exposure-bias` → scheduled sampling, not a new U-Net |
| Which cache / memory config won? | `wm-ablation` → paired n and failure rate → mean delta |
| Did the camera come back? | `wm-revisit` → full-strip diff → first/last only if no poses |
| Improve the *research loop* itself | `wm-rsi` → Creator / trajectory → one skill or `wm.yaml` change → sunset gate |
| Look at first / mid / last or the worst windows | `wm_inspect` on the run or the frame paths |
| Offline CI / no API key | `node cli.js knowledge`, `diagnose`, `discover`, `diff`, `inspect` |

## Toolbox

Three families:

| Family | Tools | Job |
| --- | --- | --- |
| **Measure** | `wm_discover`, `wm_summarize`, `wm_rollout_diff`, `wm_inspect` | Layout, logs, pred vs GT numbers, look at frames |
| **Know** | `wm_knowledge`, `wm_diagnose` | Technique cards and symptom → next step |
| **Iterate** | skills `wm-rsi`, `wm-knowledge`, `wm-ablation`, `wm-revisit` | Harness-layer RSI and honest eval |

| Tool | Best question to ask | Main result |
| --- | --- | --- |
| `wm_discover` | “What is in this run directory?” | layout, pred/gt/log/metrics, frame counts, warnings |
| `wm_summarize` | “Did training actually finish, and what should I test?” | last loss / NaN / early-stop, metric keys, 3 hypotheses |
| `wm_rollout_diff` | “Where does pred drift from GT?” | mean/min SSIM, curve, worst 3 frames, diagnosis |
| `wm_inspect` | “What do first / mid / last / the worst frames look like?” | contact sheet, luma sketch, color/contrast look |
| `wm_knowledge` | “What is chunk-AR / KV memory / RSI in Harness?” | catalog or a full technique card |
| `wm_diagnose` | “It forgets when we come back — now what?” | card ids + next tool / skill |

Rollout scores are **luminance SSIM + MSE**. `wm_inspect` is the built-in way to look at the strip.

### Knowledge cards

`wm-routes` · `display-3d` · `pixel-wm` · `latent-wm` · `chunk-ar` · `memory-types` · `kv-memory` · `exposure-bias` · `revisit-eval` · `ablation-protocol` · `action-following` · `cache-eviction` · `rsi-harness` · `diagnosis-map`

```sh
node cli.js knowledge
node cli.js knowledge --id wm-routes
node cli.js knowledge kv memory
node cli.js knowledge --id rsi-harness
node cli.js diagnose "is Sora a world simulator"
node cli.js diagnose "late collapse after the first chunk"
```

### Skills

- **wm-run-triage** — measure a run, then open a knowledge card if the failure needs a name
- **wm-knowledge** — open a card before designing
- **wm-rsi** — Harness trajectory / Creator / fixture gate on the research loop
- **wm-ablation** — paired scene/protocol/seed
- **wm-revisit** — geometric vs proxy

## RSI with Harness

DeepSeek Harness already gives you append-only trajectories, fork/replay, and Creator mode (inspect the live plugin tree). DSH-WM points that at world-model *process*:

1. Write a falsifiable claim.
2. Open `wm_knowledge` (`rsi-harness` + the technique).
3. Measure (`wm_summarize` / `wm_rollout_diff`).
4. Change **one** skill, `wm.yaml` field, or eval note — not the U-Net.
5. Gate on `fixtures/sunset` (must still report late-horizon drop) and a paired user scene.
6. Solidify or roll back; keep the session.

The deterministic core is numbers plus cards. The skill forbids unsupervised architecture RSI.

## `wm.yaml`

```yaml
name: sunset-revisit
pred: outputs/pred          # frame directory or mp4
gt: outputs/gt
log: logs/train.log
metrics: metrics.json       # any JSON; keys are summarized, not schema-validated
```

Without the file, the plugin looks for `pred|preds|recon`, `gt|target|ref`, `train.log` / `logs/*.log`, and `metrics.json` / `*eval*.json`.

## How it works

```mermaid
flowchart LR
  ask[Research question] --> know[wm_knowledge / wm_diagnose]
  know --> measure[wm_discover / summarize / diff / inspect]
  measure --> rsi[wm-rsi on skills and wm.yaml]
  rsi --> gate[sunset fixture plus paired scene]
```

This project has three layers:

1. **Knowledge** — technique cards the agent must open before designing.
2. **Measure** — filesystem tools plus `wm_inspect` (no GPU, no training submit).
3. **RSI** — skills that may change the research loop (not the U-Net) and must pass a fixture gate.

## Offline fixture

`fixtures/sunset` is an 8-frame synthetic strip. Pred frames 0–3 stay close to GT; 4–7 are wiped so second-half SSIM drops. No checkpoint, cluster, or GPU.

```sh
npm test
npm run check
node scripts/generate-fixtures.js    # regenerate after changing the painter
```

## Configuration and limits

### Requirements

- DeepSeek Harness `0.1.0-rc.6` or compatible, with `pnpm` on PATH for `dsh plugin`.
- Node.js 18+.
- Optional `ffmpeg` for JPEG or video inputs. PNG/PPM frame directories work offline.

### Install, upgrade, disable, and uninstall

```sh
dsh plugin --profile wm update github:WayneJin0918/dsh-wm
dsh plugin --profile wm remove dsh-wm
```

To disable the bundle temporarily, set this in the profile patch:

```yaml
- id: dsh-wm
  disabled: true
```

Restart the profile after enabling or upgrading.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `--dump-config` has no `# == dsh-wm` layer | Re-run `dsh plugin --profile wm add` from the checkout or `github:WayneJin0918/dsh-wm`; confirm `pnpm` is on PATH |
| Git install fails on a private repo | Use a local path, or a machine whose `gh` / git credentials can read `WayneJin0918/dsh-wm` |
| `pred not found` | Add a `wm.yaml` or pass explicit `--pred` / `--gt` to `wm_rollout_diff` |
| Video / JPEG rejected | Install `ffmpeg`, or extract PNG frames first |
| Agent concludes without tools | Load `wm-run-triage` or `wm-knowledge` first; no layout / no card, no verdict |
| Agent invents a KV design from chat | `wm_knowledge --id kv-memory` then `wm-rsi`; do not skip the card |
| First-last SSIM treated as loop closure | Load `wm-revisit`; without poses that number is a proxy only |
| “RSI” started rewriting training code | Stop. `wm-rsi` only changes skills / `wm.yaml` / eval notes unless the user opened a train job |

## Development

```sh
npm test
npm run check
```

- See [CHANGELOG.md](CHANGELOG.md) for releases.
- Use GitHub Issues on this private repository for bugs and focused requests.

## Acknowledgements

DSH-WM stands on these upstream projects. Thank you to their authors and the maps they made reusable.

- **[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** (`dsh`) — the official runtime this bundle installs into. Docs: [deepseek.com/harness](https://deepseek.com/harness/en/).
- **[DSH Vision Toolkit](https://github.com/Anionex/dsh-vision-toolkit)** by [Anionex](https://anionex.me/), with [agent-vision-toolkit](https://github.com/Anionex/agent-vision-toolkit) — thanks for the open plugin and the [homepage](https://agent-vision.anionex.me) this README learned from.
- **[Awesome World Models](https://github.com/knightnemo/Awesome-World-Models)** — the map of 3D / pixel / latent lineages the built-in route cards follow.

## License

[MIT](LICENSE)
