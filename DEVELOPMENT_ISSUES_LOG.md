# Development Issues Log

This document tracks issues faced during development, what was observed, actions taken, and current status.

> For day-to-day progress updates, see `DEVELOPMENT_LOG.md`.

## How To Use This Log

- Add a new entry whenever a blocker, regression, or notable verification failure occurs.
- Keep entries concise and evidence-based (error text, command output, or runtime symptom).
- Update status when resolved and include the exact fix applied.
- Link impacted files, checklist items, and follow-up work.

---

## Issue 001 - Tauri build blocked by missing Windows icon

### Summary

Tauri backend verification is blocked by:

`icons/icon.ico not found; required for generating a Windows Resource file during tauri-build`

### First Seen

- Phase: Verification of Phase 1 checklist
- Area: `src-tauri` build pipeline (`cargo check`)
- Platform: Windows

### Context

- Rust toolchain is installed and detected:
  - `cargo 1.94.1`
  - `rustc 1.94.1`
- Frontend build is healthy:
  - `npm run build` passes (`tsc && vite build`)

### Evidence

From `cargo check`:

- `error: failed to run custom build command for task_tracker`
- ``icons/icon.ico` not found; required for generating a Windows Resource file during tauri-build`
- exit code: `101`

### Impact

- Desktop app cannot be launched through the current Tauri build path.
- Runtime re-verification for these Phase 1 checks is blocked:
  1. Force to Settings page when DB is missing
  2. Invalid DB credential error handling
  3. Valid DB credentials save + redirect to Dashboard
  4. Day/Night mode runtime toggle verification

### Steps Taken So Far

1. Verified Rust installation and versions.
2. Re-ran backend compile (`cargo check`) to reproduce.
3. Re-ran frontend build (`npm run build`) to isolate failure to Tauri/backend resource generation.
4. Updated checklist statuses in `CURSOR_PLAN.md` to reflect blocked runtime verification accurately.

### Fix Applied

1. Created the missing Windows icon resource at `src-tauri/icons/icon.ico`.
2. Re-ran backend compile verification:
   - `cargo check` (from `src-tauri`) -> **Pass**

### Verification After Fix

- `cargo check` completes successfully for `task_tracker`.
- The prior error about missing `icons/icon.ico` is no longer present.
- One non-blocking warning remains (`unused import: Manager` in `src-tauri/src/tray.rs`).

### Current Status

- Status: **Resolved**
- Owner: Development
- Next action: Run `npm run tauri dev` and complete pending Phase 1 runtime behavior checks.

---

## Issue 002 - Dark mode text/background mismatch
### Summary
In dark mode, UI text changed to light color but the page background remained white, creating low contrast and incorrect theme rendering.

### First Seen
- Phase: Verification of Phase 1 checklist
- Area: Theme toggle runtime behavior (`src/components/layout/AppLayout.tsx` + global CSS in `src/index.css`)
- Platform: Windows (Tauri desktop runtime)

### Context
- Theme state toggle is implemented via Zustand and applied in `AppLayout` by setting:
  - `document.documentElement.classList.toggle("dark", ...)`
  - `document.documentElement.style.colorScheme = theme`
- Container-level classes switched correctly, but global page background lacked explicit dark-mode body styling.

### Evidence
- Runtime symptom: Dark mode text became white while page background stayed white.
- Prior CSS state: `body` had no explicit theme-specific background/text color rules tied to `html.dark`.

### Impact
- Dark mode was visually inconsistent and could reduce readability.
- Phase 1 checklist step 4 verification required a regression fix before being considered complete.

### Steps Taken So Far
1. Reproduced and traced theme application path in `AppLayout` and `index.css`.
2. Confirmed toggle logic executes and updates `html` class/color-scheme correctly.
3. Identified missing global background/text rules for the page body in dark mode.

### Fix Applied / Proposed Fix
Applied fix:
1. Updated `src/index.css` to enforce full-page theming:
   - Added `html, body, #root { min-height: 100%; }`
   - Added default light-mode `body` background/text colors
   - Added `html.dark body` background/text colors for dark mode
   - Added background/text transition for smooth toggling

### Verification After Fix
- `npm run build` -> **Pass**
- `npm run tauri dev` -> **Pass** (desktop app launches and runs)
- Runtime check: Dark mode now switches both text and page background immediately without page reload.

### Current Status
- Status: **Resolved**
- Owner: Development
- Next action: Continue Phase 1/2 checklist execution; keep an eye on any additional theme regressions during future UI work.

---

## Issue 003 - App Not Responding during Phase 1 step 3 verification
### Summary
While verifying Phase 1 step 3 (valid DB credentials flow), the desktop app became unresponsive after launch.

### First Seen
- Phase: Verification Checklist -> Phase 1, step 3
- Area: Tauri desktop runtime (`task_tracker.exe`) during Settings credential flow
- Platform: Windows

### Context
- App was launched via `npm run tauri dev` for live credential verification.
- Dev pipeline completed successfully and started the desktop executable:
  - `Running target\debug\task_tracker.exe`

### Evidence
- From process inspection:
  - `tasklist /FI "IMAGENAME eq task_tracker.exe" /V` reports `Status: Not Responding`
  - PID: `16020`
  - Window title: `Task Tracker`
- From PowerShell process check:
  - `Get-Process -Id 16020` -> `Responding: False`
  - `CPU: 0.15625`, `WS: 28958720`
- From process metadata:
  - `ProcessId: 16020`
  - `ParentProcessId: 25908`
  - `CommandLine: "target\\debug\\task_tracker.exe"`

### Impact
- Phase 1 step 3 cannot be marked successful yet because end-to-end input/redirect validation is interrupted by runtime unresponsiveness.
- User-driven credential verification session is blocked until app responsiveness is restored.

### Steps Taken So Far
1. Launched app using `npm run tauri dev`.
2. Confirmed dev server and Rust launch completed.
3. Captured terminal output and runtime process status.
4. Confirmed `task_tracker.exe` is running but flagged as not responding.

### Fix Applied / Proposed Fix
- No code fix applied yet (issue is currently under investigation).
- Proposed next checks:
  1. Reproduce with fresh launch and capture whether freeze occurs before or after clicking "Connect and save".
  2. Add temporary runtime logging around `testMysqlConnection`, `saveMysqlCredentials`, and `refreshBootstrap` in `Settings.tsx` to isolate blocking point.
  3. Validate whether SQL/store plugin calls are hanging on the UI thread.

### Verification After Fix
- Pending (no fix applied yet).

### Current Status
- Status: **Open**
- Owner: Development
- Next action: Diagnose freeze trigger and restore responsiveness, then re-run Phase 1 step 3.

---

## Issue 004 - Stronghold initialization permission denied
### Summary
Tauri Stronghold initialization fails from the UI due to missing permissions, and adding `stronghold:default` caused a backend panic when writing the salt file.

### First Seen
- Phase: Phase 2 secure settings verification
- Area: `src-tauri` capability configuration and Stronghold runtime initialization
- Platform: Windows

### Context
- Initial UI error: `stronghold.initialize not allowed. Permissions associated with this command: stronghold:allow-initialize, stronghold:default`
- Added `stronghold:default` to `src-tauri/capabilities/default.json` per documentation guidance
- Follow-up runtime failure occurred inside the Stronghold crate during salt generation

### Evidence
- UI error text from frontend runtime
- Backend panic:
  - `thread 'tokio-rt-worker' (7624) panicked at C:\Users\username\.cargo\registry\src\index.crates.io-1949cf8b5b557f\tauri-plugin-stronghold-2.3.1\src\kdf.rs:37:41`
  - `Failed to write salt for Stronghold: Os { code: 5, kind: PermissionDenied, message: "Access is denied." }`

### Impact
- Secure credential storage cannot be initialized or tested in the current app runtime.
- Phase 2 verification is blocked until Stronghold permissions and file access are resolved.
- The app may fail to save encrypted credentials even if the plugin is configured.

### Steps Taken So Far
1. Reproduced the UI permission error during Stronghold initialization.
2. Added `stronghold:default` to `src-tauri/capabilities/default.json` to satisfy reported command permissions.
3. Re-launched the app and observed the new Stronghold panic on salt write.
4. Confirmed the failure occurs before encrypted credential storage can be used.

### Fix Applied / Proposed Fix
- No fix applied yet.
- Proposed next actions:
  1. Verify the Stronghold storage directory and file permissions for the Tauri app on Windows.
  2. Ensure the app data path is writable by the Tauri runtime and not blocked by OS permissions or antivirus.
  3. Check whether Stronghold requires a specific capability beyond `stronghold:default` and `stronghold:allow-initialize`.
  4. If necessary, adjust the vault path or initialize Stronghold in a directory with explicit write permissions.

### Verification After Fix
- Pending resolution.

### Current Status
- Status: **Open**
- Owner: Development
- Next action: Investigate Stronghold salt file permissions and capability requirements on Windows.

---

## Entry Template

Use this template for future issues:

```md
## Issue XXX - <Short title>
### Summary
### First Seen
### Context
### Evidence
### Impact
### Steps Taken So Far
### Fix Applied / Proposed Fix
### Verification After Fix
### Current Status
```
