# Footroll apps

A web-first, offline-capable 2D practice simulator. TypeScript + React + SVG, packaged with Electron for desktop and Capacitor for iOS. All application code lives here; the board-game rulebook remains the reference outside this directory.

## Run

Requires Node.js 22.12+ and npm. From this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. No account, server, or API key is required. Pass the device between two players. Saves stay in the current browser/app on this device.

```sh
npm test                 # Rules, invariants, deterministic outcomes, save validation
npm run typecheck
npm run build            # Static web app in simulator/dist, including offline cache
npm run format:check
npm run desktop          # Build web assets and launch Electron
npm run desktop:package  # Produce an unpacked desktop application
```

For a production web preview, run `npm run preview -w @footroll/simulator`. Deploy `simulator/dist` to a static HTTPS host. Offline support applies to production builds after the first successful online visit; development mode does not install a service worker. A downloaded PWA update takes effect on the next page reload; matches are saved independently of the app cache. Browser/app storage is separate and clearing it deletes the saved match.

An unsigned Apple Silicon app bundle was built at `desktop/release/mac-arm64/Footroll.app`. To reuse the installed Electron runtime when packaging locally without a download:

```sh
npm run package -w @footroll/desktop -- --config.electronDist=../node_modules/electron/dist --config.mac.identity=null
```

This is a local development build; it is not signed/notarized for distribution.

## iPhone

The generated Swift Package Manager project is included at `simulator/ios/App/App.xcodeproj`.

```sh
npm run ios:sync          # Build shared app and update the native project
npm run ios:open          # Open Xcode
```

Install full Xcode, select its developer directory, and choose an iOS simulator or configure your signing team for a physical device. This checkout was generated and synced successfully, but was not built for iOS: the development machine currently only has Apple Command Line Tools selected. CocoaPods is not required for this SPM project. App ID `com.footroll.simulator` is a development placeholder; choose your final identifier before distribution.

Capacitor 7.6.9's `cap add ios --packagemanager SPM` has a casing bug in its CLI argument handler. The initial project was generated using that installed CLI's `loadConfig`/`addCommand` with its SPM template selected explicitly. Normal `cap sync ios` and `cap open ios` work with the included project; there is no patched dependency.

Android is a future packaging task: add the matching `@capacitor/android` package and generate its project. The shared app has no iOS-only dependencies. Native store signing, release icons/splash screens, and distribution are separate follow-ups.

## Architecture

- `packages/engine`: Plain TypeScript match state, validation, commands and deterministic seeded dice. No React, DOM, Electron, or Node imports.
- `simulator/src`: React interface, SVG board, responsive styles, and a replaceable storage adapter.
- `simulator/ios`: Capacitor native iOS shell using Swift Package Manager.
- `desktop`: Sandboxed Electron shell loading the same built web assets. Node integration is disabled, window creation/navigation is blocked, and permission requests are denied.
- `tools/create-icons.py`: Reproducible web app icons using only Python's standard library.

Commands pass through `applyCommand(state, command)` and return new state without mutating the original. Dice state is part of each match, making identical state/command inputs reproducible. This provides a foundation for a future authoritative server: authenticate the player, validate turn ownership, apply commands on the server, and broadcast results. Network protocol, authentication, sequence numbers, reconnects, and persisted replay commands are not implemented. The local undo feature is deliberately limited to the current session.

## Practice v1 rules

This is a playable iteration scaffold, **not a complete implementation of Footroll Advanced or the unpublished Simplified edition**. The in-app help identifies the same limitations.

Implemented from the rulebook:

- 100 × 64 yard grid; horizontal + vertical (Manhattan) distances.
- Movement allowance = velocity ÷ 10; no occupied destinations.
- Pass action score = rounded D100 × passing skill ÷ 100, compared against distance.
- A successful pass receiver cannot move again that turn.

Provisional practice choices:

- Default clubs are FC Barcelona 2014–2015 (home) and Real Madrid 2015–2016 (away), using the regulars and ratings from `../teams/`. Fixed 4–3–3 formations and inferred positional roles; home always starts.
- Teams alternate; one action per team, then each player may move once.
- Successful passes transfer the ball immediately. Failed passes give possession to the opponent nearest the receiver; no scatter roll.
- Shooting difficulty follows Annex B: take the larger of normalized Euclidean distance and the nonlinear goal-aperture component, scale it to 1–100, and use the printed integer value. Compare against rounded D100 × shooting skill ÷ 100. Failed shots go to the opposing goalkeeper.
- Blocking uses the surrounding eight cells. Passes require Feint vs Tackle;
  forward movement requires Dribble vs Tackle with the ball or Slip vs Mark
  without it. Backward and sideways attacker movement remains free.
- Failed passes/shots start the opponent's action phase. Goals reset formations; first to three wins.

Not implemented: Offside, fouls/cards, injuries, goalkeeper reactions, shot effects, set pieces, lineup editing, AI, or online multiplayer.

## Suggested next iteration

Agree on the precise rule subset, then replace practice turn sequencing with the rulebook's attacking/defending action and movement phases. Add individual rule scenarios as engine tests while keeping the UI and packaging independent.

## Team data and interface

`packages/engine/src/teams.json` contains all 36 players and all 29 ratings from the two repository team PDFs. The first 11 columns are starters; the final seven are reserves (data only, substitutions are not implemented). Printed ratings are multiplied by 10. The practice engine maps Pace → velocity, Short pass → pass, Shoot → shoot, and Tackle → tackle. Other skills remain available in the imported data for later rule work.

`tools/import-teams.py` reproduces the import with pdfplumber. Player header names and numbers were checked against rendered PDF pages. The source's spelling and numbering are preserved, including Barcelona's duplicate number 20 and Busquets's number 28. Stable player IDs use lineup slots, independently of shirt numbers. Existing saved matches migrate the placeholders to these squads without losing positions, score, or possession; earlier event text remains historical.

Club crest assets were extracted directly from the PDF image objects. The interface consists of a top score bar, central pitch, and one selected-player card for each club. On phones the two cards sit beneath the pitch. Select players on the pitch or use the arrows on their card. There is no visible match log or bottom roster; the latest action result appears briefly as the current status, until the next selection or action.

The player cards now show all 29 imported ratings. Pointer selection resolves the nearest player rather than overlapping token hit boxes, and movement follows the explicitly selected team. Actions are previewed before resolution: choose Pass/Shoot/Tackle, choose a pass receiver when required, inspect difficulty, then press Roll dice. The lower readout shows D100, calculated score, and success/failure. Regression tests cover adjacent-player selection and action previews.
