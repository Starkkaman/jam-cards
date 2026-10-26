# Jam Cards (+ sibling ../jam-theme)
Saul Bass styled Lovelace card suite + JamBoard HA theme, built by the Home Assistant session (2026-10-26) on the user's
request, after the JamBoard/Crew Hub card look (crew-hub/card/crew-hub-card.js CSS tokens).
- Repos: github-jamcards:Starkkaman/jam-cards (deploy key ~/.ssh/github_jamcards_ed25519),
  github-jamtheme:Starkkaman/jam-theme (~/.ssh/github_jamtheme_ed25519). HACS: cards = Dashboard/plugin, theme = Theme.
- No build step: jam-cards.js is the shipped file. Preview + checks: `pw-node preview/shoot.js` (exit 0 = pass).
- Rules: flat colour, no gradients/blur/rounded corners, display type uppercase; textContent only for entity data.
- Theme vars --jam-* drive the cards per mode; keep jam-cards.js fallbacks equal to the dark palette.
