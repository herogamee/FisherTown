// Compatibility entry point for old FisherTown setup instructions.
// Generated-art base64 source chunks were never committed. v0.4 uses the
// original source PNG and Sharp instead.
console.warn('[FisherTown] materialize-assets is deprecated; using optimize-art.');
await import('./optimize-art.mjs');
