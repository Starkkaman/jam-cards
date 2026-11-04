// jam-looks (look picker): the themes come from preview/themes.js on the fake hass (hass.themes.themes), the current pick
// is the page's look (hass.selectedTheme). On the shared preview page it shows only the JamBoard tile + system default:
// the other looks' swatches use their own fonts (Archivo, Albert Sans), and the Poster page must not fetch those
// (96-packs). The full picker renders in 96-packs (under each look, live switch) and preview/views.js (every look, both modes).
{
jamPreview.add({
  sections: [
    ["", [{type: "custom:jam-looks", title: "Look", looks: ["JamBoard"]}]],
  ],
});
}
