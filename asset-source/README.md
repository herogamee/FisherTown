# FisherTown art inventory — v0.3.1

## Present in Git

- `public/assets/generated/bg_thailand_sunset.png` — generated naturalistic sunset fishing background, loaded by `FishingScene.preload`.
- `public/assets/fish/*.svg` — ten *original hand-authored naturalist vector study* fish illustrations, one species ID per SVG. These are gameplay/landing illustrations, **not biologically approved final photography**. Replace through species reference/licensing review.

## Not yet present

- The earlier proposed WebP files `fish_snakehead.webp`, `fish_silver_barb.webp` and `bg_thailand_sunset.webp` are **not checked in**. The legacy `scripts/materialize-assets.mjs` requires absent base64 chunk folders and must **not** be part of the build pipeline.
- Future generated/photo-grade images should be optimized for mobile, transparent where appropriate, verified for species accuracy and licensed for commercial use.

Never label one recolored generic fish as another real species. Keep the scientific species ID as the asset key.

See `docs/05-ART-DIRECTION.md`.
