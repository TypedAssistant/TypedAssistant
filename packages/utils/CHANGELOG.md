# @typed-assistant/utils

## 0.0.21

### Patch Changes

- Fix security, reliability, and performance issues

  - Fix XSS: pass `escapeXML: true` to ansi-to-html `Convert` constructor
  - Fix regex injection: escape `entryFile` metacharacters before `RegExp`
  - Fix crash: wrap `.gitignore` read in try/catch with fallback warning
  - Fix error handling: normalize caught values to `Error` in `withErrorHandling` and `generateTypes`
  - Fix preinstall: wrap in async IIFE so `Promise.all` is properly awaited
  - Fix performance: replace listeners array with `Set` in `entityStore`
  - Fix WebSocket: add exponential backoff (1s→30s cap) on reconnect
  - Fix TS: import `JSX` type from react in `AppSection`

## 0.0.20

### Patch Changes

- Use provenance flag to publish to npm.
- Updated dependencies
  - @typed-assistant/logger@0.0.23

## 0.0.19

### Patch Changes

- Updated dependencies
  - @typed-assistant/logger@0.0.22
