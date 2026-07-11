# @typed-assistant/builder

## 0.0.94

### Patch Changes

- Improve app subprocess exit detection and diagnostics

## 0.0.93

### Patch Changes

- More process lifecycle and webserver fixes

  - Skip the app restart when `bun install` fails after a pull, and retry the install on the next poll instead of restarting against stale node_modules
  - Queue a restart requested while another restart is in flight instead of silently dropping it
  - Fix `/force-sync-with-github` throwing instead of reporting failure (Bun `# @typed-assistant/builder throws on non-zero exit without `.nothrow()`), and fail clearly when `GITHUB_BRANCH` is unset
  - Remove the unfinished `/webhook` endpoint
  - Reset process watchdog counters after firing so failed recoveries get a fresh window instead of refiring every 10 seconds, and stop watchdog errors becoming unhandled rejections
  - Force exit if shutdown cleanup hangs for more than 15 seconds, and ignore duplicate SIGINT/SIGTERM
  - Flush the text decoder when app output streams end so partial multi-byte characters aren't lost

## 0.0.92

### Patch Changes

- Fix subprocess lifecycle issues

  - Fix restarts getting permanently stuck if a rebuild failed mid-restart
  - Fix intentional app restarts being treated as fatal errors by the webserver's output streaming, which leaked servers/watchers and double-spawned app processes
  - Fix orphaned app subprocess when the addon received SIGTERM/SIGINT
  - Fix potential deadlock by draining stdout and stderr concurrently (stderr also now streams to the web UI live)
  - Escalate to SIGKILL if a subprocess ignores SIGTERM for 10 seconds
  - Skip ANSI-only output chunks instead of treating them as a fatal error

## 0.0.91

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

## 0.0.90

### Patch Changes

- Use provenance flag to publish to npm.

## 0.0.89

### Patch Changes

- More robust restarting of app when process error occurs.

## 0.0.88

### Patch Changes

- Fire onProcessError when empty stream is detected in web server.

## 0.0.87

### Patch Changes

- Apply search filters before paginating logs so filtered results span all pages.
- Hide the Next pagination button entirely when no additional log pages are available.

## 0.0.86

### Patch Changes

- Update react, react-dom and ink to latest versions.

## 0.0.85

### Patch Changes

- Restart app when empty string bug is detected.

## 0.0.84

### Patch Changes

- Improve logging for random crashes.

## 0.0.83

### Patch Changes

- Undo last fix.

## 0.0.82

### Patch Changes

- Restart app when an empty string is returned from the process.

## 0.0.81

### Patch Changes

- Pin Elysia to 1.1.x.

## 0.0.79

### Patch Changes

- Fix for log

## 0.0.78

### Patch Changes

- Limit log.txt size to 3MB.

## 0.0.77

### Patch Changes

- Optimise retrieval of logs.

## 0.0.76

### Patch Changes

- Add a filter for logs.

## 0.0.75

### Patch Changes

- Prevent git pull from throwing.
