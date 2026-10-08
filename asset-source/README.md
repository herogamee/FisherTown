# FisherTown artwork and build pipeline — v0.4

## Checked-in originals

- `public/assets/generated/bg_thailand_sunset.png` — original generated 2.8MB Thailand sunset background.
- `public/assets/fish/<species-id>.svg` — ten individual fish naturalist studies, one per accepted species ID. Texture detail and fin rays were refined for v0.4, but these remain **non-final anatomical illustrations**.

## Generated automatically

The commands `npm run dev` and `npm run build` run `scripts/optimize-art.mjs` first. It reads the original PNG and generates `public/assets/generated/bg_thailand_sunset.webp` via Sharp at 1280×720 quality 83. Runtime loads WebP instead of the 2.8MB original. Production dist removes the redundant original source PNG, never the Git copy.

The compiled species textures are 560×280, with morphology fallback if any texture fails to load. This pipeline never relabels a generic fish as another species.

## Obsolete instructions

The earlier proposed base64 WebP source chunks were never committed; do not create or depend on `asset-source/generated/*`. For compatibility, running `node scripts/materialize-assets.mjs` now invokes the new optimizer instead of failing due to missing chunks.

## Next steps for genuinely photoreal species sprites

For each `scientific-id`, record a reference sheet, rights/license, distinguishing anatomy (mouth, dorsal/anal fins, markings), transparent full-side gameplay WebP and large landing portrait. Replacements should be independently reviewed and should **not** copy restricted reference photos.

See `docs/05-ART-DIRECTION.md` and `docs/11-V0.4-RELEASE-NOTES.md`.
