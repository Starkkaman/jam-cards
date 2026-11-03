/* Look pack: Olympia (R6 placeholder). Registered so the plumbing is real: the theme's --jam-look: olympia adopts this
   pack, and its font (Albert Sans, SIL OFL 1.1, latin subset from Google Fonts, variable 300-600) is declared as a URL
   @font-face on <asset base>fonts/ (HACS dist/fonts/). The visual design (css, motifs, its own palette and type tokens) is
   a later task; until then the pack is empty and the look draws Poster with Albert Sans. */
registerLook({
  id: "olympia",
  name: "Olympia",
  fonts: [{family: "Albert Sans", weight: "300 600", file: "albert-sans-var-latin.woff2"}],
  css: "",
  motifs: {},
});
