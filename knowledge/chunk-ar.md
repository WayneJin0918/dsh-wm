---
id: chunk-ar
title: Chunk-wise AR context learning
tags: memory, long-horizon, training, inference
summary: Split a long video into short chunks; each chunk writes memory that the next chunk reads. Start here before KV-level memory.
---

# Chunk-wise AR

Long generation is a sequence of short conditional generations. Do not ask the model to denoise a one-minute clip in one shot.

## Training

Teacher-force a GT history chunk as context and predict the current chunk.

- History chunk: context / memory only. Do not put the main generation loss on it.
- Target chunk: noised, predicted.
- Pair both from the same trajectory so motion, scene, and camera continue.

Keep the context recipe identical at train and infer (tail frames stay tail frames; sparse replay stays sparse replay).

## Inference

1. Generate chunk 0 from first frame / prompt / action.
2. Extract memory from that chunk.
3. Generate chunk 1 conditioned on the memory.
4. Update the memory bank and repeat.

The hard part is a stable memory update, not “more chunks”. Too little memory forgets the room; too much memory burns VRAM and pollutes current dynamics.

## When this is the diagnosis

Late-horizon SSIM collapse with a clean first chunk usually means the memory written at the boundary is too weak or too noisy — not that the backbone cannot draw a frame.

## Next

See `memory-types` for what to keep, `exposure-bias` for train/infer gap, `kv-memory` only after this baseline is stable.
