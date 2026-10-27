/* Jam Cards: Saul Bass styled Lovelace cards (same look as the JamBoard / Crew Hub card).
   Rules: flat colour, no gradients, no blur, no rounded corners; heavy uppercase display type; hard cuts.
   No build step, no dependencies. Entity names/states are rendered with textContent only.

   Cards: jam-heading, jam-hero, jam-tile, jam-choice, jam-slider, jam-media, jam-button, jam-gauge, jam-list,
   jam-light, jam-popup, jam-graph, jam-weather, jam-remote.
   Colours come from the JamBoard theme (--jam-* variables, one set per light/dark mode); without the theme the
   cards fall back to the dark "ink" palette. Design rules: docs/DESIGN.md.
   Shared helpers (edge system, paper blocks, actions) are exported on window.JamCards for cards added later. */
(() => {
const VERSION = "0.2.0";
