---
id: kv-memory
title: Teacher-forcing KV memory
tags: kv, attention, cache, diffusion
summary: History becomes attention-level KV the current chunk can read. Do not copy LLM KV-cache semantics onto every diffusion step.
---

# KV memory

Chunk-wise AR puts history *beside* the input. KV memory puts history *inside* attention: the current query reads past keys/values.

## Training

Teacher-force GT history into a memory bank. Noise and predict only the target chunk. History is not reconstructed; it is readable context. The signal stays clean: “use the past to help the present.”

## Inference

A finished chunk is written into the bank. The next chunk reads it. A sliding window is the default:

- Recent chunks: high weight, short-term continuity.
- Older chunks: compress or sparsify, keep identity / layout.
- Over budget: drop, merge, or downsample — state the rule.

## Do not cargo-cult LLM KV cache

A diffusion step recomputes network state. KV depends on timestep and hidden state.

- Inside one denoising step, the target may read history KV. That is the v1 to validate.
- Keeping memory *across chunks* is fine; reusing the same KV *across all denoising steps* is an acceleration approximation and needs its own quality check.

## Management recipes

- **Keep-last** — one previous chunk. Baseline.
- **Sliding window** — last K chunks.
- **Compressed KV** — shrink older chunks.
- **Importance** — keep tokens by attention, motion, or FOV overlap.

Richer memory can help consistency and can also replay stale tokens into the current frame.

## When to use

Only after `chunk-ar` is a stable baseline. Otherwise you cannot tell whether a win came from KV routing or from a better context construction.
