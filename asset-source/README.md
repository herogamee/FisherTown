# FisherTown Generated Art — v0.2

The v0.2 visual pass begins replacing the Fishing Lab placeholders with generated production-direction art.

Current decoded build assets:

- `bg_thailand_sunset.webp` — Thai golden-hour split-view fishing background.
- `fish_snakehead.webp` — realistic **Channa striata / ปลาช่อน** gameplay + Fishdex asset.
- `fish_silver_barb.webp` — realistic **Barbonymus gonionotus / ปลาตะเพียนขาว** gameplay + Fishdex asset.

The current GitHub automation path is text-only, so the binary WebP files are versioned as base64 chunks and decoded by `scripts/materialize-assets.mjs` before Vite runs.

Other species deliberately keep the morphology fallback until a species-specific image is reviewed. Do not recolor one fish image and call it another species.

Art direction remains governed by `docs/05-ART-DIRECTION.md`.
