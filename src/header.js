/* Jam Cards: Saul Bass styled Lovelace cards (same look as the JamBoard / Crew Hub card).
   Rules (v0.3 "Poster"): flat colour, no gradients/blur/shadows/rounded corners; straight edges with one cut corner;
   one accent colour per card; heavy uppercase display type; hard cuts.
   No build step, no dependencies. Entity names/states are rendered with textContent only.

   Cards (23): jam-heading, jam-hero, jam-tile, jam-choice, jam-slider, jam-media, jam-button, jam-gauge, jam-list,
   jam-light, jam-popup, jam-graph, jam-weather, jam-remote, jam-tv, jam-fan, jam-house, jam-tabs, jam-scenes,
   jam-screensaver, jam-panel, jam-alerts, jam-speaker.
   Colours come from the JamBoard theme (--jam-* variables, one set per light/dark mode); without the theme the
   cards fall back to the dark "ink" palette. Design rules: docs/DESIGN.md.
   Shared helpers (colour/accent system, edge system, cut blocks, actions) are exported on window.JamCards for cards added later. */
(() => {
const VERSION = "0.4.0";
