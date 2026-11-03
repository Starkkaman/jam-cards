/* Look pack: Braun (R6 placeholder). Registered so the plumbing is real: the theme's --jam-look: braun adopts this pack,
   and its font (Archivo, SIL OFL 1.1, latin subset from Google Fonts, variable 400-700) is declared as a URL @font-face on
   <asset base>fonts/ (HACS dist/fonts/). The visual design (css, motifs, its own palette and type tokens) is a later task;
   until then the pack is empty and the look draws Poster with Archivo. */
registerLook({
  id: "braun",
  name: "Braun",
  fonts: [{family: "Archivo", weight: "400 700", file: "archivo-var-latin.woff2"}],
  css: "",
  motifs: {},
});
