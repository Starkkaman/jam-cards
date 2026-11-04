/* Look pack: Olympia (after Otl Aicher's Munich 1972 design; decided brief docs/looks/OLYMPIA.md). The theme
   ("Jam Olympia", tokens/looks/olympia.mjs) sets the palette, the square shapes (every shape token none, a 1px hairline
   border), lowercase Albert Sans and the calm motion; this pack draws what tokens cannot:
   - a 4px top stripe on every card face in its room / tone colour (the Poster left tone stripe becomes this top stripe;
     jam-light: the light's colour when on, silver when off), 6px square strips;
   - lowercase everywhere (units, sentence lines and words like tv / hdmi too; form fields keep what the user types);
   - the power corner as a 32px square button top-right with a 1.75px stroke glyph: on = filled with the light / accent
     colour, off = face 2;
   - jam-light on = a white (light) / card (dark) face: the light's colour shows as the stripe, the brightness bar fill and
     the big number (when it reaches 4.5:1 on the face, --lc-num from jam-light, else ink); group members = thin vertical
     bars at the right edge with 1px face-coloured gaps; no label plates;
   - big numbers and the kiosk / screensaver clocks in weight 300; kiosk dock names 300;
   - a 2px blue square focus ring; no stamps or washes (motion tokens), a calm fade / slide entrance;
   - motifs: empty = vertical spectrum bars, idleArt = horizontal spectrum bands ("programme sheet"), powerGlyph = thin
     stroke, screensaver = a spectrum band along the bottom edge (the now-playing block is a face panel with a blue top
     stripe).
   Font: Albert Sans (SIL OFL 1.1, latin subset from Google Fonts, variable 300-600) from <asset base>fonts/.
   Spectrum colours come from the theme's idle-art tokens (jam-art-1..6: blue, light blue, green, yellow, orange, silver). */
const OLY_SPECTRUM = [1, 2, 3, 4, 5].map(i => `var(--jam-art-${i})`); // blue, light blue, green, yellow, orange
const OLY_SILVER = "var(--jam-art-6,var(--line))";
const OLY_CSS = `
*:not(input):not(textarea){text-transform:lowercase!important}
:focus-visible,.lc:has(.tap:focus-visible){outline-width:2px!important}
.jam-wash{display:none}
/* Top stripe: card faces carry a 4px stripe in --oly-top (the accent unless a tone or the card sets it). The Poster left
   tone stripe (.stripe .s-*) becomes the top stripe; the left edge keeps the hairline. */
.paper[data-cut=card] > .face{border-top:var(--rule-h) solid var(--oly-top,var(--acc))}
/* jam-button keys are cards too: hairline + top stripe. */
.paper[data-cut=key] > .kf{border:var(--jam-border,0px none);border-top:var(--rule-h) solid var(--oly-top,var(--acc))}
.stripe{border-left:var(--bord,0px none);--oly-top:${OLY_SILVER}}
.stripe.s-on{--oly-top:var(--acc)} .stripe.s-alert{--oly-top:var(--red)} .stripe.s-calm{--oly-top:var(--teal)}
/* Trouble has a form, not only a hue (audit 2026-11-03, review 2026-11-04): a 45deg alert / face hatch round every alert
   fill (the alert is its own vermilion, distinct from the yellow living and the orange lamps); text stays on a solid
   plate inside the hatch, so contrast holds.
   Top stripes: the hatch drawn over the stripe (the border stays, transparent, for the box). */
.host,.ov,.pop{--oly-hatch:repeating-linear-gradient(45deg,var(--red) 0 6px,var(--slab) 6px 11px)}
.paper[data-cut] > .face.stripe.s-alert,.paper[data-cut] > .face.unavail{border-top-color:transparent;background-image:var(--oly-hatch);background-size:100% var(--rule-h);
  background-repeat:no-repeat;background-origin:border-box;background-clip:border-box}
button.chip.red::before,.chip.red:not(button),.cnt{border:4px solid transparent;
  background:linear-gradient(var(--red),var(--red)) padding-box,var(--oly-hatch) border-box}
:host(jam-kiosk) .lk.alert .disc{border:8px solid transparent;background:linear-gradient(var(--red),var(--red)) padding-box,var(--oly-hatch) border-box}
/* the opt-in attention surfaces and alert dock blocks carry the hatch too */
:host(jam-kiosk) .att,:host(jam-kiosk) .k.dfill .blk.alert,:host(jam-house) .att,.ov .al.loud{border:6px solid transparent;
  background:linear-gradient(var(--red),var(--red)) padding-box,var(--oly-hatch) border-box}
.key.alert > .face{border:4px solid transparent;background:linear-gradient(var(--red),var(--red)) padding-box,var(--oly-hatch) border-box}
.tmk.t-alert{background:var(--oly-hatch)}
/* Offline (state grammar): the face stays, the top stripe is the hatch, the text dim; not "off" (silver stripe). */
.paper[data-cut] > .face.unavail{background-color:var(--slab);border-style:solid;border-color:transparent;border-width:var(--rule-h) 0 0;
  box-shadow:inset 0 0 0 1px var(--line);color:var(--dim)}
.tmk.t-offline{--tc:var(--slab);box-shadow:inset 0 0 0 1px var(--dim);background-image:var(--oly-hatch)}
/* Strips: 6px, square, face-2 track. */
.strip{inset:13px 0}
:host(jam-scenes) .scene{min-height:44px} /* Albert Sans' shorter line box would leave the key at 43px */
button.chip{min-width:44px} /* its 44px hit area (::after) stays inside a narrow chip */
/* Power: a 32px square top-right (8px in), thin glyph centred; on = filled (accent / light colour), off = face 2. */
.pw .tri{inset:8px 8px auto auto;width:32px;height:32px;background:var(--slab2)}
.pw svg{right:15px;top:15px;width:18px;height:18px;color:var(--fg)}
.pw[aria-pressed=true] .tri{background:var(--oly-pw,var(--acc))}
.pw[aria-pressed=true] svg{color:var(--oly-pw-fg,var(--acc-fg))}
.pw:disabled .tri{background:var(--slab2)} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-8px}
/* jam-light: white face when on, the light's colour in the stripe, bar and (if readable) the number. */
.lc > .face{--oly-top:${OLY_SILVER}}
.lc.on > .face{background:var(--slab);color:var(--fg);--oly-top:var(--lc);--oly-pw:var(--lc);--oly-pw-fg:var(--lc-fg)}
.lc.on .sub{color:var(--dim)}
.lc.on .pct{color:var(--lc-num,var(--fg))}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:var(--lc-num,var(--fg))}
.lc .bs{height:6px;background:var(--slab2)}
.lc .bs i{background:var(--lc)}
.lc .bands{top:48px;bottom:6px;right:0;width:40px;gap:1px;padding:0 0 0 1px;background:var(--slab)}
.lc.on .tap{padding-right:52px}
/* Big numbers: weight 300 (values, temperatures, clocks, percentages); small numeric labels keep their weight. */
.num:is(.v,.pt,.temp,.otemp,.tt,.time,.pct,.hi,.lo,.disp,.clock,.big,.cur),b.num{font-weight:300}
/* jam-button: on = white face + stripe + filled power square (like jam-light). */
.kf.on{background:var(--slab);color:var(--fg)}
.kf.on .st{color:var(--dim)}
.on .sq{background:var(--acc);color:var(--acc-fg)}
/* Empty art (Golden Arm placeholder) sits on face 2: the bars are the spectrum. */
:host(jam-media) .art > .face,:host(jam-tv) .poster > .face,:host(jam-speaker) .poster > .face{background:var(--slab2);color:var(--fg)}
:host(jam-speaker) .kart{background:var(--slab2)}
:host(jam-media) .art.paused > .face{background:var(--slab3)}
:host(jam-media) .art img{filter:none;mix-blend-mode:normal} /* covers as they are (Poster's duotone is Poster's) */
/* jam-light pop-up: the whites / presets are fills, not cards (no top stripe); preset names sit on a navy label plate. */
.wt > .face,.wp > .face{border-top:var(--bord,0px none)}
.wp b{left:8px;right:auto;max-width:calc(100% - 16px);padding:3px 6px 4px;background:var(--plate);color:var(--plate-fg)}
/* Volume rocker: face-coloured gaps; outlined keys (jam-remote / jam-tv) are plain face-2 keys; jam-remote groups carry
   their stripe on top. */
.rock > .face{background:var(--slab);gap:2px}
.ol > .face{background:var(--slab2)} .ol > .face::before{content:none} .ol.on > .face{background:var(--acc)}
:host(jam-remote) .sec > .face{border-left:var(--bord,0px none);border-top:var(--rule-h) solid var(--acc)}
/* Failed-action strip: a white / card panel with a hairline and the orange stripe. */
.jam-err{border:1px solid var(--line);border-left:var(--stripe-w) solid var(--red)}
/* jam-tv's own power corner: the same 32px square (kiosk: 52px). */
:host(jam-tv) .pw{background:none;color:var(--acc-fg)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:6px;top:6px;width:32px;height:32px;background:var(--acc)}
:host(jam-tv) .pw.off{color:var(--fg)} :host(jam-tv) .pw.off::before{background:var(--slab2)}
:host(jam-tv) .pw svg{right:13px;top:13px;width:18px;height:18px}
:host(jam-tv) .kiosk .pw::before{right:10px;top:10px;width:52px;height:52px}
:host(jam-tv) .kiosk .pw svg{right:23px;top:23px;width:26px;height:26px}
/* jam-kiosk: thin clock, dock blocks are full spectrum fields (blocks without an accent take yellow / light blue), names in
   weight 300; the lock is a square. */
:host(jam-kiosk) .clock{font-weight:300}
:host(jam-kiosk) .blk .nm{font-weight:300}
:host(jam-kiosk) .host .blk.none{--bc:var(--jam-art-4);--bf:var(--on-fg)}
:host(jam-kiosk) .host .blk.none:nth-child(even){--bc:var(--jam-art-2)}
:host(jam-kiosk) .host .blk.none .st{color:var(--on-fg)}
:host(jam-kiosk) .host .k.dfill .blk.none.out .st{color:var(--dim)} /* dock_state: fill: an outlined "none" block is on the page, not on its fill (navy on navy was 1:1 in dark) */
:host(jam-kiosk) .lk .disc{border-radius:0}
/* locked = quiet: a 2px ring in the text colour on no fill (core --lk-bg transparent) */
:host(jam-kiosk) .lk .disc{box-shadow:inset 0 0 0 2px var(--lk-ring)}
@keyframes jam-oly-enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes jam-oly-sheet{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes jam-oly-fade{from{opacity:0}to{opacity:1}}
/* Screensaver: a spectrum band along the bottom edge; thin clock; the now-playing block is a face panel, blue stripe. */
.ov .oband{bottom:0;height:2.6vh}
.ov .time,.ov .tchip .tt{font-weight:300}
.ov .np{padding:2vh 3vh 2vh 2vh;background:var(--slab);color:var(--fg);border-top:var(--rule-h) solid var(--blue)}
/* Kickers in a room accent fail 4.5:1 on the navy ground / white sheet: ink text, the accent stays on rules. */
.ov .kick{color:var(--ink-fg)}
:host(jam-popup) .t .label{color:var(--fg)}
.ov .np .nb{color:var(--fg)} .ov .np .ns,.ov .np .kick{color:var(--dim)}
.ov .sdock .np{background:var(--slab);border-top:var(--rule-h) solid var(--blue)}
/* Look cards made for Olympia (jam-pictogram, jam-programme, jam-results): thin room / sheet titles like the mockup; a
   results square's top stripe is its own colour (face 2 when unavailable), so the square reads as one flat field. */
:host(jam-pictogram) .nm,:host(jam-programme) .ti{font-weight:300}
:host(jam-results) .rsq > .face{--oly-top:var(--sc,var(--slab2))}
`;
/* Golden Arm placeholder, Olympia: the same seeded bars, each in a spectrum colour. */
function olyBars(key) {
  const box = this.poster(key), s = typeof key === "number" ? key >>> 0 : seed(key);
  [...box.children].forEach((b, i) => { b.style.background = OLY_SPECTRUM[(s + i) % OLY_SPECTRUM.length]; });
  return box;
}
/* Idle art, Olympia: horizontal spectrum bands of varying height filling the box (a programme sheet), seeded. */
function olyBands(sd) {
  const r = rng((sd >>> 0) ^ 0x5bd1e995), box = el("div", "abs"), pool = [...OLY_SPECTRUM, OLY_SILVER];
  box.setAttribute("aria-hidden", "true");
  const n = 4 + Math.floor(r() * 3), w = Array.from({length: n}, () => .4 + r()), sum = w.reduce((a, b) => a + b, 0);
  let top = 0, last = -1;
  w.forEach(v => {
    let k; do k = Math.floor(r() * pool.length); while (k === last);
    last = k;
    const b = el("i"), st = b.style, h = v / sum * 100;
    st.left = "0"; st.width = "100%"; st.top = top.toFixed(2) + "%"; st.height = (h + .5).toFixed(2) + "%"; st.background = pool[k];
    top += h; box.append(b);
  });
  return box;
}
registerLook({
  id: "olympia",
  name: "Olympia",
  fonts: [{family: "Albert Sans", weight: "300 600", file: "albert-sans-var-latin.woff2"}],
  css: OLY_CSS,
  motifs: {
    empty: olyBars,
    idleArt: olyBands,
    powerGlyph() {
      const svg = this.poster();
      svg.setAttribute("stroke-width", "1.75"); svg.setAttribute("stroke-linecap", "square");
      return svg;
    },
    /* Four flat segments of one spectrum band along the bottom edge (four nodes, like Poster's composition). */
    screensaver() {
      return [[0, 34, 1], [34, 22, 3], [56, 18, 4], [74, 26, 5]].map(([x, w, c]) => {
        const s = el("div", "sh oband"); s.setAttribute("aria-hidden", "true");
        s.style.left = x + "%"; s.style.width = w + "%"; s.style.background = `var(--jam-art-${c})`;
        return s;
      });
    },
  },
});
