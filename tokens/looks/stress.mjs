// Stress look: a harness-only look (no theme file, never shipped). It pushes the type tokens the way Braun / Olympia
// will (mixed case, a wide grotesque instead of Londrina, display scale .85, looser leading) on the Poster palette, so
// preview/shoot.js can prove that text still fits: `?look=stress` in the preview (preview/looks.css block
// :root[data-look="stress"]). The Archivo stack falls back to a system sans (DejaVu Sans in the container, wider than
// Archivo), which makes it a harder test than the real Braun font.
import poster from "./poster.mjs";

const ARCHIVO = '"Archivo", "Helvetica Neue", Arial, sans-serif';
export default {
  id: "stress",
  harness: true, // tools/themes.mjs writes no theme for it
  tokens: {
    "jam-display": ARCHIVO,
    "jam-body": ARCHIVO,
    "jam-display-weight": "700", "jam-display-case": "none", "jam-display-lead": "1.12", "jam-display-scale": ".85",
    "jam-label-weight": "600", "jam-label-case": "none", "jam-label-track-scale": ".4",
    "jam-key-weight": "600", "jam-key-case": "none", "jam-key-track-scale": ".4",
    "jam-look": "stress",
  },
  modes: poster.modes,
};
