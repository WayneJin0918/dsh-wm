# DSH-WM

[![MIT](https://img.shields.io/badge/license-MIT-0B7285?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-Web%20%2B%20Headless%20%2B%20wm-5B4CF0?style=flat-square)](cordis.patch.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-0B7285?style=flat-square)](package.json)

**A playable world-model toolkit for DeepSeek Harness — look at a strip, name the route, score the run, and iterate the research loop.**

Point the agent at a rollout (or just `fixtures/sunset`) and ask: did the second half melt, is Sora even a world simulator, and which memory recipe is allowed to win.

🚀 One command to install | Play sunset with no GPU | Built-in WM map | RSI on skills and evals

🌐 **English** | [中文](README.zh.md)

World-model work inside DeepSeek Harness is more fun when the agent can *see* the strip, *name* the lineage, and *measure* the claim. DSH-WM is the profile bundle for that: contact-sheet inspect, a compare page (side-by-side / swipe / diff heat + action HUD), three-route knowledge (3D display / pixel video-gen / latent prediction), run scoring, and an RSI loop on skills and `wm.yaml`.

```sh
dsh plugin --profile wm add github:WayneJin0918/dsh-wm
dsh --profile wm
```

Then try: *Triage `fixtures/sunset`. Look at first, mid, last. Is this late-horizon?*

DeepSeek’s product mainline can skip world models. Harness is still the research OS — this plugin is the WM lab on top of it.

**Runtime:** [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)

<details>
<summary>Table of contents</summary>

- [Play it in 30 seconds](#play-it-in-30-seconds)
- [Highlights](#highlights)
- [Three routes](#three-routes)
- [Who it is for](#who-it-is-for)
- [Quick start: three steps](#quick-start-three-steps)
- [Common workflows](#common-workflows)
- [Toolbox](#toolbox)
- [RSI with Harness](#rsi-with-harness)
- [Acknowledgements](#acknowledgements)

</details>

## Play it in 30 seconds

`fixtures/sunset` is an 8-frame toy strip. Early pred frames stay warm and close to GT; the second half is wiped to cool blue so late-horizon collapse is obvious. No checkpoint, cluster, or GPU.

```sh
node cli.js inspect fixtures/sunset --indices first,mid,last
node cli.js view fixtures/sunset
node cli.js diff --pred fixtures/sunset/pred --gt fixtures/sunset/gt
node cli.js diagnose "is Sora a world simulator"
node cli.js knowledge --id wm-routes
```

`wm_inspect` prints a luma sketch you can read in a terminal:

```text
pred #0  luma=148.7  low contrast, warm / orange
    ****************
    **##************
pred #7  luma=62    near-uniform, cool / blue
    ::::::::::::::::
gt   #7  luma=160.4  low contrast, warm / orange
    ***#############
```

`wm_rollout_diff` on the same strip reports a second-half SSIM drop and names frames 4–6 as the worst window. `wm_view` writes a local compare page if you want to scrub pred vs GT. Look, score, then open a card.

## Highlights

- **Install and play.** Official DSH bundle, pure JavaScript, no `prepare` / `allowBuilds`. Sunset works from `node cli.js` before you even open Harness.
- **Look at the frames in-repo.** `wm_inspect` samples first / mid / last (or named indices), writes a contact sheet, and returns a luma sketch plus a color/contrast look.
- **Compare the page yourself.** `wm_view` writes a self-contained HTML page: side-by-side, swipe overlay, abs-diff heatmap, SSIM timeline, and an action HUD when `actions.json` is present.
- **Name the route first.** 3D display, pixel / video-gen WM, and latent prediction are three exams. `wm-routes` then `display-3d` / `pixel-wm` / `latent-wm`.
- **A run is a directory.** Optional `wm.yaml` declares pred / gt / log / metrics / actions. No manifest → heuristics. Cannot tell → candidates and warnings, never invented paths.
- **Measure when you have a run.** `wm_discover` → `wm_summarize` → `wm_rollout_diff` → `wm_inspect` → `wm_view` for layout, logs, numbers, a look, and a page you can scrub.
- **Built-in WM knowledge.** Technique cards for chunk-AR, memory, KV, exposure bias, revisit, ablation, action following, cache eviction, and RSI-in-Harness. `wm_knowledge` / `wm_diagnose` before a new architecture.
- **RSI on the harness layer.** Skill `wm-rsi` uses DSH trajectory, fork, Creator, and sunset to evolve skills, `wm.yaml`, and eval notes.
- **Skills that keep the game honest.** Triage, knowledge, RSI, fair ablation, revisit.
- **No GPU required to start.** Rollout scores are luminance SSIM + MSE in pure JS. Videos need `ffmpeg`; PNG/PPM folders do not.

## Three routes

The word “world model” is three research games. Cards follow the map in [Awesome World Models](https://github.com/knightnemo/Awesome-World-Models). Open `wm-routes` before you design a backbone.

| Route | Card | What it predicts | What “good” looks like | Field tropes |
| --- | --- | --- | --- | --- |
| **3D display** | `display-3d` | Geometry you can fly / occupy (mesh, Gaussian, occupancy, 4D) | Spatial consistency, explorable scene | Consistency is bought, not painted; a fly-through is a display until the stick does something |
| **Pixel / video-gen WM** | `pixel-wm` | The next pixels, often action-conditioned | An interactive strip that still obeys the stick | “Is Sora a world simulator?”; pretty clip, wrong joystick; Self-Forcing / late melt |
| **Latent prediction** | `latent-wm` | The next compact state (RSSM, JEPA, DINO) | Planning / control in the dream | Do not pay the loss on every pixel; a decoded video is a projector |

A forgotten room is `revisit-eval` on a pixel strip, a pose / occupancy check on a 3D scene, and a latent-state mismatch on JEPA / Dreamer. Name the route, then measure.

```sh
node cli.js knowledge --id display-3d
node cli.js knowledge --id pixel-wm
node cli.js knowledge --id latent-wm
node cli.js diagnose "Gaussian explorable 3D"
node cli.js diagnose "JEPA latent Dreamer"
```

## Who it is for

| You want to… | DSH-WM gives you |
| --- | --- |
| **Play a rollout without a cluster** | Sunset + `wm_inspect` / `wm_rollout_diff` on a laptop |
| **See what a run directory actually contains** | `wm_discover` — layout, paths, frame counts, warnings |
| **Turn a log tail into a next test** | `wm_summarize` — last loss / NaN / early-stop plus three hypotheses |
| **Put a number on “looks worse”** | `wm_rollout_diff` — mean/min SSIM, curve, worst frames, diagnosis |
| **Look at those worst frames** | `wm_inspect` — contact sheet, luma sketches, per-tile look |
| **Scrub pred vs GT and the stick** | `wm_view` — side-by-side / swipe / heat, action arrow, followed / dropped |
| **Place a paper on the map** | `wm-routes` → `display-3d` / `pixel-wm` / `latent-wm` |
| **Keep an ablation honest** | `wm-ablation` — paired `(scene, protocol, seed)` and failure rate first |
| **Talk about coming home** | `wm-revisit` — geometric vs frame-similarity proxy |
| **Tighten how the agent debugs WM** | `wm-rsi` — one claim, one card, one measurement, one skill / `wm.yaml` delta |

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

From a local checkout (path install does not need GitHub access):

```sh
dsh plugin --profile wm add /path/to/dsh-wm
```

The package is pure JS. Git installs do not need pnpm `allowBuilds`. Pin a commit if you want a frozen default: `github:WayneJin0918/dsh-wm#<sha>`.

### 2. Restart and check it

```sh
dsh --profile wm --dump-config    # look for "# == dsh-wm"
dsh --profile wm
```

Restart a running Web profile after adding the bundle, then start a new session so the skill catalog reloads.

### 3. Ask something you would actually say

```text
Triage fixtures/sunset. What failed, and is it late-horizon?
Look at first, mid, last — what do the pixels do in the second half?
Is Sora a world simulator, or a pixel WM that still has to pass the stick?
The return trip forgot the room — which memory recipe is even allowed?
These two runs claim a memory win — are they paired on scene/protocol/seed?
Use Harness RSI to tighten the revisit skill; keep sunset as the gate.
```

## Common workflows

| Task | Recommended workflow |
| --- | --- |
| First five minutes / no GPU | `inspect` sunset → `diff` → `diagnose` a question you care about |
| A training or eval run looks wrong | `wm-run-triage` → discover → summarize → diff → inspect → view |
| Which WM route is this paper? | `wm-routes` → `display-3d` / `pixel-wm` / `latent-wm` |
| “What kind of memory should we use?” | `wm-knowledge` → `chunk-ar` / `memory-types` / `kv-memory` → then measure |
| Late-horizon melt, train loss fine | `wm_diagnose` → `exposure-bias` → scheduled sampling |
| Which cache / memory config won? | `wm-ablation` → paired n and failure rate → mean delta |
| Did the camera come back? | `wm-revisit` → full-strip diff → first/last only if no poses |
| Improve the *research loop* itself | `wm-rsi` → Creator / trajectory → one skill or `wm.yaml` change → sunset gate |
| Offline CI / no API key | `node cli.js knowledge`, `diagnose`, `discover`, `diff`, `inspect`, `view` |

## Toolbox

Three families you can compose in one session:

| Family | Tools | Job |
| --- | --- | --- |
| **Measure** | `wm_discover`, `wm_summarize`, `wm_rollout_diff`, `wm_inspect`, `wm_view` | Layout, logs, pred vs GT numbers, look, compare page |
| **Know** | `wm_knowledge`, `wm_diagnose` | Route + technique cards, symptom → next step |
| **Iterate** | skills `wm-run-triage`, `wm-knowledge`, `wm-rsi`, `wm-ablation`, `wm-revisit` | Honest eval and harness-layer RSI |

| Tool | Best question to ask | Main result |
| --- | --- | --- |
| `wm_discover` | “What is in this run directory?” | layout, pred/gt/log/metrics, frame counts, warnings |
| `wm_summarize` | “Did training actually finish, and what should I test?” | last loss / NaN / early-stop, metric keys, 3 hypotheses |
| `wm_rollout_diff` | “Where does pred drift from GT?” | mean/min SSIM, curve, worst 3 frames, diagnosis |
| `wm_inspect` | “What do first / mid / last / the worst frames look like?” | contact sheet, luma sketch, color/contrast look |
| `wm_view` | “Let me scrub pred vs GT and see whether the action was followed.” | HTML page + pred / gt / heat sheet |
| `wm_knowledge` | “Which route / what is chunk-AR / KV / RSI?” | catalog or a full technique card |
| `wm_diagnose` | “It forgets when we come back — now what?” | card ids + next tool / skill |

Rollout scores are **luminance SSIM + MSE**. `wm_inspect` is the built-in way to look at the strip; `wm_view` is the page you scrub.

### Knowledge cards

**Routes:** `wm-routes` · `display-3d` · `pixel-wm` · `latent-wm`

**Technique:** `chunk-ar` · `memory-types` · `kv-memory` · `exposure-bias` · `revisit-eval` · `ablation-protocol` · `action-following` · `cache-eviction` · `rsi-harness` · `diagnosis-map`

```sh
node cli.js knowledge
node cli.js knowledge --id wm-routes
node cli.js knowledge kv memory
node cli.js knowledge --id rsi-harness
node cli.js diagnose "is Sora a world simulator"
node cli.js diagnose "late collapse after the first chunk"
```

### Skills

- **wm-run-triage** — walk a run: discover → summarize → diff → inspect → view, then name the failure
- **wm-knowledge** — open a route or technique card before designing
- **wm-rsi** — one claim, one card, one measurement, one skill / `wm.yaml` change, sunset gate
- **wm-ablation** — paired scene / protocol / seed before any mean
- **wm-revisit** — geometric loop vs frame-similarity proxy

## RSI with Harness

DeepSeek Harness already gives you append-only trajectories, fork/replay, and Creator mode (inspect the live plugin tree). DSH-WM points that at world-model *process*:

1. Write a falsifiable claim.
2. Open `wm_knowledge` (`rsi-harness` + the technique, after `wm-routes` if the lineage is unclear).
3. Measure (`wm_summarize` / `wm_rollout_diff`) and look (`wm_inspect` / `wm_view`).
4. Change **one** skill, `wm.yaml` field, or eval note.
5. Gate on `fixtures/sunset` (must still report late-horizon drop) and a paired user scene.
6. Solidify or roll back; keep the session.

The repeatable core is numbers plus cards.

## `wm.yaml`

```yaml
name: sunset-revisit
pred: outputs/pred          # frame directory or mp4
gt: outputs/gt
log: logs/train.log
metrics: metrics.json       # any JSON; keys are summarized, not schema-validated
actions: actions.json       # optional per-frame control track for wm_view
```

Without the file, the plugin looks for `pred|preds|recon`, `gt|target|ref`, `train.log` / `logs/*.log`, `metrics.json` / `*eval*.json`, and `actions.json`.

## How it works

```mermaid
flowchart LR
  play[Ask or point at a run] --> know[wm_knowledge / wm_diagnose]
  know --> measure[wm_discover / summarize / diff / inspect / view]
  measure --> rsi[wm-rsi on skills and wm.yaml]
  rsi --> gate[sunset fixture plus paired scene]
```

Three layers, one session:

1. **Knowledge** — name the route, then open a technique card.
2. **Measure** — filesystem tools plus `wm_inspect` and `wm_view`.
3. **RSI** — evolve the research loop and pass the sunset gate.

## Offline fixture

`fixtures/sunset` is the built-in playground. Pred frames 0–3 stay close to GT; 4–7 are wiped so second-half SSIM drops.

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
| Git install 404s or asks for credentials | Confirm the repo is public at `github:WayneJin0918/dsh-wm`, or install from a local path |
| `pred not found` | Add a `wm.yaml` or pass explicit `--pred` / `--gt` to `wm_rollout_diff` |
| Video / JPEG rejected | Install `ffmpeg`, or extract PNG frames first |
| Agent concludes without tools | Load `wm-run-triage` or `wm-knowledge` first; no layout / no card, no verdict |
| Agent invents a KV design from chat | `wm_knowledge --id kv-memory` then `wm-rsi`; open the card first |
| First-last SSIM treated as loop closure | Load `wm-revisit`; without poses that number is a proxy only |
| “RSI” started rewriting training code | Pause. `wm-rsi` changes skills / `wm.yaml` / eval notes unless the user opened a train job |

## Development

```sh
npm test
npm run check
```

- See [CHANGELOG.md](CHANGELOG.md) for releases.
- Use GitHub Issues on this repository for bugs and focused requests.

## Acknowledgements

DSH-WM stands on these upstream projects. Thank you to their authors and the maps they made reusable.

- **[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** (`dsh`) — the official runtime this bundle installs into. Docs: [deepseek.com/harness](https://deepseek.com/harness/en/).
- **[DSH Vision Toolkit](https://github.com/Anionex/dsh-vision-toolkit)** by [Anionex](https://anionex.me/), with [agent-vision-toolkit](https://github.com/Anionex/agent-vision-toolkit) — thanks for the open plugin and the [homepage](https://agent-vision.anionex.me) this README learned from.
- **[Awesome World Models](https://github.com/knightnemo/Awesome-World-Models)** — the map of 3D / pixel / latent lineages the built-in route cards follow.

## License

[MIT](LICENSE)
