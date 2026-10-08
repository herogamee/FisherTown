# FisherTown v0.3.1 — Recovery, portrait input, and art

Date: 2026-10-08

## Recovery audit

The previous v0.3 visual commit removed more than 400 lines from `src/game/FishingScene.ts`, introduced literal backslash-n in TypeScript, and replaced a species-aware fish fallback with an incomplete placeholder. This caused CI/Pages failure. Restore the full v0.2 scene state machine, retain the committed generated sunset background and keep functional bite → hook → fight → catch → release.

The first recovery commit recovered FishingScene; the second recovered FishActor. CI of the combined hotfix passed at commit `74268a45`.

## Responsive input

The main simulation uses a stable 1280×720 Phaser world. Landscape retains the original canvas HUD and touch controls. Portrait **does not rotate the screen**: it shows the river view at the top and allocates remaining viewport height to native HTML controls. When space is tight, the controls scroll independently so no buttons become permanently inaccessible.

Native buttons communicate with FishingScene through `fishertown:control`; scene publishes `fishertown:state` for status, tension, charge, catches, bait and enabled actions. All inputs share one source of gameplay truth (no duplicated game state or timing logic).

Mouse, touch, pen and keyboard hold support is wired for cast/reel with release on pointercancel, capture loss and window blur.

## Art pipeline

- Background: `public/assets/generated/bg_thailand_sunset.png` (checked-in generated landscape).
- Fish: `public/assets/fish/<species-id>.svg`, ten one-per-species *hand-authored naturalist studies*, transparent and lightweight, rendered through Phaser's SVG loader.
- Missing textures fall back to the original morphology-aware draw function.
- The landing card shows the actual species illustration and records.

Important: these SVGs are **not equivalent to photorealistic final sprites**, and must still be reviewed for scientific accuracy. Next pass: license-verified or original/generated high-resolution raster art with independently checked body/head/fin reference, then optimized WebP/AVIF for each species. Do not repurpose one fish by recoloring.

## Verification gates

1. `npm run validate`: asserts the scene was not truncated, ten species assets exist, background is checked in, mobile control IDs/events exist, manifest allows portrait.
2. `npm run build`: TypeScript and Vite production output.
3. GitHub Actions: CI build + Pages build + deployment should both succeed before marking a production release.
4. Manual on Chrome/Firefox desktop landscape: cast → wait → HOOK → hold reel → landing → release, test fullscreen and Escape.
5. Manual on iPhone Safari and Android Chrome in portrait: controls visible and scrollable, hold/release input, bait switching, meter updates and native/fallback fullscreen button.
6. Manual in both orientations: rotate during idle/fight, revisit after refresh, Fishdex/local save intact, no old cached service worker.

Known limitations: the *simulation itself* is still 16:9 shown above the portrait control dock, not a native portrait-reframed water camera. Artwork remains interim naturalistic vectors; additional scientific image review, character overhaul, audio, and aquarium UI are future work.
