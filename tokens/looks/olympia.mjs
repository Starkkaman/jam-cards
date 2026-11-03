// Olympia: DRAFT look (R6 plumbing only; the design is a later task). Registered in jam-cards.js as an empty pack
// (src/looks/olympia.js) with its font, Albert Sans (variable 300-600, fonts/albert-sans-var-latin.woff2). Until the design
// lands it is Poster with the Albert Sans stack, so the harness can prove that the pack's font loads and its sheet is
// adopted. `draft: true`: a preview/looks.css block (?look=olympia) but no theme file in jam-theme yet.
import poster from "./poster.mjs";

const ALBERT = '"Albert Sans", "Helvetica Neue", Arial, sans-serif';
export default {
  id: "olympia",
  draft: true,
  tokens: {...poster.tokens, "jam-display": ALBERT, "jam-body": ALBERT, "jam-look": "olympia"},
  modes: poster.modes,
};
