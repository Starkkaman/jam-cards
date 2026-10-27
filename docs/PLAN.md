# Plan: Jam v0.2 (savvy-flow, 2026-10-26)

Design: docs/DESIGN.md. Repos: this one (cards) + ../jam-theme (theme). Workers never push and never write to Home Assistant.
Read-only HA access (if the `mcp__home-assistant__*` tools are available): `ha_get_state`, `ha_config_get_dashboard`,
`ha_search` only — for fixtures/inventory. Any write tool is forbidden for workers.

| # | Task | Tier | After | Status |
|---|---|---|---|---|
| 1 | Core v0.2: edge system + restyle existing 6 cards | careful | — | done f26264a, 7f5fcd7 |
| 2 | Theme polish (jam-theme) | medium | — | done (in ../jam-theme) |
| 3 | jam-button, jam-gauge, jam-list | medium | 1 | done ee77e37 |
| 4 | jam-light, jam-popup | careful | 1 | done 76bd0f7 |
| 5 | jam-graph, jam-weather | careful | 1 | done 379573d, da5c961 |
| 6 | jam-remote, jam-media v2 | medium | 1 | done d5507b4, fc915a2 |
| 7 | Dashboard clones (configs + preview) | careful | 3,4,5,6 | in progress (not in this repo) |
| 8 | Release prep: full checks, README, filemap, version 0.2.0, commit | light | 7 | done (this commit, Jam Cards 0.2.0) |

Card-fix round: done d36c37a, 62c1a4b (bundle regen 08776ed).

Common verification for card tasks: `pw-node preview/shoot.js` exits 0, new cards appear in `preview/index.html`
(dark + light, 390 + 1280 px screenshots in preview/shots/), every control's service call is asserted in shoot.js,
no page errors, existing TV-dashboard configs keep working (backward compatible options).
