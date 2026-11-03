// Braun: DRAFT look (R6 plumbing only; the design is a later task). Registered in jam-cards.js as an empty pack
// (src/looks/braun.js) with its font, Archivo (variable 400-700, fonts/archivo-var-latin.woff2). Until the design lands
// it is Poster with the Archivo stack, so the harness can prove that the pack's font loads and its sheet is adopted.
// `draft: true`: a preview/looks.css block (?look=braun) but no theme file in jam-theme yet.
import poster from "./poster.mjs";

const ARCHIVO = '"Archivo", "Helvetica Neue", Arial, sans-serif';
export default {
  id: "braun",
  draft: true,
  tokens: {...poster.tokens, "jam-display": ARCHIVO, "jam-body": ARCHIVO, "jam-look": "braun"},
  modes: poster.modes,
};
