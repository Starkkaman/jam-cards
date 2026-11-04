/* Look pack: Brutal (decided brief docs/looks/BRUTAL.md, 2026-11-03). Neo-brutalism (Gumroad, the Figma community): loud,
   honest, tactile, very legible. The theme ("Jam Brutal", tokens/looks/brutal.mjs) sets the palette (paper page, white
   cards, black lines; six flat room fills with black text), Bricolage Grotesque 800 mixed case, the 10px / 999px radii (no
   cut corners), the press transform (4px down) and the snappy motion; this pack draws:
   - slabs: every card, hero, sheet, poster and key face gets a 3px border in the line colour (drawn as an inset outline,
     so no layout moves) and a HARD offset shadow (6px 6px 0; chip-size keys and pills 4px / 2px); dark mode = the same
     with #f5f5f5 lines;
   - the press: a key goes down 4px (theme token) and its shadow shrinks to 2px, so the shadow's far edge stays put;
   - on = the face filled flat with the room colour, black text; alerts = the red fill with black text;
   - power = a chunky pill switch with a black border (the knob slides right and the track fills with the room colour);
   - jam-light on: the card filled with the light's colour snapped to the nearest room fill (the `decorate` look hook
     marks the card; flat fills keep black text readable), a small bordered swatch shows the real colour; brightness = a
     fat bordered bar;
   - kiosk: a huge 800 clock, dock blocks as bordered coloured slabs with shadows, the lock a bordered circle;
   - screensaver: the page ground, the huge clock, Poster's three bars and disc as bordered fill slabs with hard shadows;
   - motifs: empty = bordered bars, idleArt = stacked slabs, powerGlyph = a heavy stroke, flash = none.
   Motion: 120 ms snaps (jam-dur .6, the pack's keyframes: a drop onto the shadow for entrances / sheets, press-and-release
   stamps); reduced motion = none (universal rule). Font: Bricolage Grotesque (SIL OFL 1.1, latin subset from Google
   Fonts, variable: weight 200-800 and optical size 12-96, so big numbers use the display cuts) from <asset base>fonts/. */
(() => {
  /* The six room fills (token names) with their hue in degrees; a light's colour snaps to the nearest by hue. Red stays
     for alerts, so a red light snaps to orange / pink. A near-white light (saturation < .16) snaps to yellow (warm) or
     cyan (cool). */
  const FILLS = [["ochre", 48], ["teal", 74], ["blue", 182], ["violet", 253], ["pink", 317], ["green", 29]];
  function hueSat([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s];
  }
  function snapFill(rgb) {
    const [h, s] = hueSat(rgb);
    if (s < .16) return rgb[2] > rgb[0] ? "blue" : "ochre";
    let best = FILLS[0][0], bd = 999;
    for (const [n, fh] of FILLS) { const d = Math.min(Math.abs(h - fh), 360 - Math.abs(h - fh)); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  /* Render hook: every jam-light face with a real colour (--lc = rgb(...)) gets --bru-fill = its snapped room fill. */
  function bruDecorate(body) {
    if (!body) return;
    for (const lc of body.querySelectorAll(".lc")) {
      const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(lc.style.getPropertyValue("--lc"));
      const v = m ? `var(--${snapFill([+m[1], +m[2], +m[3]])})` : "";
      if (lc.style.getPropertyValue("--bru-fill") !== v) { if (v) lc.style.setProperty("--bru-fill", v); else lc.style.removeProperty("--bru-fill"); }
    }
  }

  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  /* empty: Poster's seeded bars, each a bordered slab in a room fill. */
  function bruBars(key) {
    const box = this.poster(key), s = typeof key === "number" ? key >>> 0 : seed(key);
    [...box.children].forEach((b, i) => { b.style.background = `var(--jam-art-${1 + (s + i) % 6})`; });
    box.classList.add("bru-arm");
    return box;
  }
  /* idleArt: three stacked slabs (seeded sizes and fills) with borders and hard shadows, on the paper. */
  function bruIdle(sd) {
    const r = rng((sd >>> 0) ^ 0x2545f491), box = el("div", "abs bru-idle");
    box.setAttribute("aria-hidden", "true");
    const used = new Set();
    for (let k = 0; k < 3; k++) {
      let c; do c = 1 + Math.floor(r() * 6); while (used.has(c));
      used.add(c);
      const i = el("i"), st = i.style, w = 34 + r() * 26, h = 22 + r() * 22;
      st.left = (8 + k * 18 + r() * 8).toFixed(1) + "%"; st.top = (10 + k * 20 + r() * 6).toFixed(1) + "%";
      st.width = w.toFixed(1) + "%"; st.height = h.toFixed(1) + "%"; st.background = `var(--jam-art-${c})`;
      if (k === 1 && r() > .5) st.borderRadius = "50%";
      box.append(i);
    }
    return box;
  }
  /* powerGlyph: the Poster sign with a heavy 3px round stroke. */
  function bruPower() {
    const svg = this.poster();
    svg.setAttribute("stroke-width", "3"); svg.setAttribute("stroke-linecap", "round");
    return svg;
  }
  function bruFlash() { return svgEl("svg", {viewBox: "0 0 1 1", "aria-hidden": "true"}); }

  const CSS = `
/* ---------- slab variables: the line (border + shadow colour), border width, shadow sizes ---------- */
.host,.pop,.ov{--bru-b:3px;--bru-k:var(--line);--bru-sh:6px 6px 0 var(--bru-k);--bru-sh-s:4px 4px 0 var(--bru-k);--bru-sh-down:2px 2px 0 var(--bru-k)}
/* ---------- slabs: card / hero / sheet / poster faces ---------- */
.paper[data-cut=card] > .face,.paper[data-cut=hero] > .face,.paper[data-cut=sheet] > .face,.paper[data-cut=poster] > .face{
  outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));box-shadow:var(--bru-sh)}
/* inner panels (cards drawn inside a card face, e.g. tiles, columns): border, smaller shadow */
.face .paper[data-cut=card] > .face,.face .paper[data-cut=poster] > .face{box-shadow:var(--bru-sh-s)}
/* jam-button tiles (key-kind papers that are cards) */
.paper.btn > .face{outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));box-shadow:var(--bru-sh)}
/* chip-kind panels that are not keys (weather columns): bordered, flat */
.paper[data-cut=chip]:not(.key) > .face{outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));border-radius:10px}
/* tone stripes: the colour between the slab border and a 3px inner line */
.face.stripe{box-shadow:inset 3px 0 0 var(--bru-k),var(--bru-sh)}
.face .face.stripe{box-shadow:inset 3px 0 0 var(--bru-k),var(--bru-sh-s)}
/* ---------- keys: white slabs (slab2 = paper off keys) with a border and a hard shadow; down on press ---------- */
.key > .face{background:var(--slab);color:var(--fg);border:0;outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));box-shadow:var(--bru-sh)}
.key[data-cut=chip] > .face{box-shadow:var(--bru-sh-s)}
.key[data-cut=chip]{--press-from:translate(2px,2px);--press:translate(2px,2px)}
/* a switch key in a wrapped tile / list row keeps its own height (no stretched pill) */
.row .sw.paper,.row .sw.paper > .face{height:auto}
.key:not(:disabled):hover > .face{background:var(--slab2)}
.key.on > .face,.ikey.main > .face{background:var(--acc);color:var(--on-fg)}
.key.alert > .face{background:var(--red);color:var(--on-fg)}
.key:disabled > .face{color:var(--dim);box-shadow:none}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:var(--slab2);color:var(--dim)}
.press:active > .face,.pressing > .face{box-shadow:var(--bru-sh-down)!important}
.press:has(.press:active) > .face{box-shadow:var(--bru-sh)!important}
/* ---------- chips / pills: 2px bordered pills ---------- */
.chip{outline:2px solid var(--bru-k);outline-offset:-2px}
button.chip{outline:0}
button.chip::before{outline:2px solid var(--bru-k);outline-offset:-2px;box-shadow:2px 2px 0 var(--bru-k)}
.chip.red{--chip-bg:var(--red);color:var(--on-fg)}
.chip.home{--chip-bg:var(--teal);color:var(--on-fg)}
.chip.hot{--chip-bg:var(--ochre);color:var(--on-fg)}
.cnt{background:var(--red);color:var(--on-fg);outline:2px solid var(--bru-k);outline-offset:-2px;border-radius:999px}
.chip:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
/* ---------- type: big numerals tabular ---------- */
.num,.pct,.big,.cur,.time,.temp,.otemp,.hi,.lo,.clock,.tt,.vn,.v{font-variant-numeric:tabular-nums}
/* ---------- tone marks: bordered squares; stripes ---------- */
.tmk{width:10px;height:10px;outline:2px solid var(--bru-k);outline-offset:-2px;border-radius:2px}
/* ---------- strips / sliders: fat bordered bars, black fill knob ---------- */
.track{height:36px}
.strip{inset:6px 0;background:var(--slab2);border-radius:999px;outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));overflow:hidden}
.fill{background:var(--acc);border-right:var(--bru-b) solid var(--bru-k)}
.fill[style*="width: 0"],.fill[style*="width:0"]{border-right:0}
.track:focus-visible{outline-offset:3px}
/* ---------- power corner -> chunky pill switch (40x24, 3px border; knob slides right, track fills with the room) ---------- */
.pw:not(.paper){background:none;clip-path:none;color:inherit}
.pw:not(.paper) .tri,.pw:not(.paper) > svg{display:none}
.pw:not(.paper)::before{content:"";position:absolute;right:8px;top:11px;width:40px;height:24px;box-sizing:border-box;border-radius:999px;
  background:var(--slab2);border:var(--bru-b) solid var(--bru-k);box-shadow:2px 2px 0 var(--bru-k)}
.pw:not(.paper)::after{content:"";position:absolute;right:27px;top:15px;width:16px;height:16px;box-sizing:border-box;border-radius:50%;
  background:var(--bru-k);transition:transform calc(120ms * var(--jam-motion,1)) cubic-bezier(.2,.9,.3,1)}
.pw[aria-pressed=true]:not(.paper)::before{background:var(--bru-on,var(--acc))}
.pw[aria-pressed=true]:not(.paper)::after{transform:translateX(15px);background:var(--slab);border:var(--bru-b) solid var(--bru-k)}
.pw:not(.paper):disabled::before{background:var(--slab2);border-style:dashed;box-shadow:none}
.pw:not(.paper):disabled::after{background:var(--dim)}
.pw:not(.paper):focus-visible{outline:none}
.pw:not(.paper):focus-visible::before{outline:3px solid var(--focus);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.pw:not(.paper)::after{transition:none}}
/* ---------- jam-light: on = the snapped room fill (real colour in the swatch), black text, fat brightness bar ---------- */
.host > .paper.lc.on > .face{background:var(--bru-fill,var(--acc));color:var(--on-fg);--bru-on:var(--slab)}
.lc.on .sub,.lc.on .pct,.lc.on .nm{color:var(--on-fg)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:var(--on-fg)}
.lc.on .sub::before{content:"";display:inline-block;width:12px;height:12px;margin:0 6px 0 0;vertical-align:-2px;background:var(--lc);
  border:2px solid var(--on-fg);border-radius:3px;box-sizing:border-box}
.lc .bs{left:14px;right:60px;bottom:12px;height:14px;border-radius:999px;background:var(--slab);border:var(--bru-b) solid var(--bru-k);overflow:hidden;box-sizing:border-box}
.lc.on .bs{border-color:var(--on-fg);background:var(--slab)}
.lc .bs i{background:var(--on-fg);clip-path:none}
.lc .tap{padding-bottom:34px}
.lc .bands{top:48px;bottom:34px;right:12px;width:34px;gap:3px;padding:0;background:none}
.lc .bands i{border:2px solid var(--on-fg);border-radius:4px}
/* ---------- jam-button: tile slab; on = the room fill ---------- */
.host > .paper.btn > .kf.on{background:var(--acc);color:var(--on-fg)}
.kf.on .st,.kf.on .lbl{color:var(--on-fg)}
.kf .sq{background:var(--slab2);color:var(--fg);outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));border-radius:8px}
.kf.on .sq{background:var(--slab);color:var(--fg)}
/* ---------- jam-tabs / jam-scenes / jam-choice ---------- */
.tab{background:var(--slab);color:var(--fg);outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));border-radius:10px;box-shadow:var(--bru-sh-s)}
.tab.on{background:var(--acc);color:var(--on-fg)}
.tab::after{left:3px;right:3px;bottom:3px;height:5px}
.tab.on::after{display:none}
.scene > .sf{background:var(--slab);color:var(--fg);outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));border-radius:10px;box-shadow:var(--bru-sh)}
.scene.on > .sf{background:var(--acc);color:var(--on-fg)}
.scene:active > .sf{transform:translate(4px,4px);box-shadow:var(--bru-sh-down)}
.scene.jam-stamp > .sf::before{content:none}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}
.jam-wash{display:none}
.spiral{display:none}
/* ---------- jam-heading: the room colour as a fat bordered bar ---------- */
.h > .rule{outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));border-radius:999px;height:12px}
/* ---------- keys that are tiles (jam-tv sources, option tiles): 10px, not pills ---------- */
.key.tile > .face,.key.opt > .face{border-radius:10px}
/* ---------- jam-gauge: bordered wedges, the rest of the disc paper ---------- */
:host(jam-gauge) svg path{stroke:var(--bru-k);stroke-width:3;stroke-linejoin:round}
:host(jam-gauge) svg path[style*="--line"]{fill:var(--slab2)!important}
:host(jam-gauge) svg circle{stroke:var(--bru-k);stroke-width:3}
/* ---------- jam-graph: fat lines ---------- */
.ln{stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
.ax{font-size:.64rem} /* axis numbers fit the Poster gutter (Bricolage is wider than Jost) */
/* ---------- media / tv / speaker art ---------- */
.art img{filter:none;mix-blend-mode:normal}
.art > .face,.art.paused > .face{background:var(--slab2)}
.poster .prog{height:8px}
/* ---------- jam-light pop-up: bordered bars, editors and presets ---------- */
.bigbar,.hb,.kbar,.wedit{border-radius:10px;outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));overflow:hidden}
.bigbar i,.kbar i{clip-path:none;border-right:var(--bru-b) solid var(--bru-k)}
.mk{outline:2px solid var(--slab);border-radius:3px}
.wt > .face,.wp > .face{border-radius:10px}
.wp > .face{background:var(--plate)} /* under the preset preview: its name sits on the preview's dark band */
.wt.on > .face,.wp.on > .face{transform:translate(4px,4px);box-shadow:var(--bru-sh-down)} /* the picked preset stays down */
.nin{border:var(--bru-b) solid var(--bru-k);border-radius:10px}
.mtrack .mb{border-radius:999px;outline:2px solid var(--bru-k);outline-offset:-2px;overflow:hidden}
/* ---------- jam-remote: d-pad, rocker, outlined keys ---------- */
.pad .ok > .face{background:var(--acc);color:var(--on-fg)}
.rock > .face{background:none;gap:8px;outline:0;box-shadow:none}
.rock .key:focus-visible{outline-color:var(--focus)}
.ol > .face{background:var(--slab)} .ol > .face::before{content:none} .ol.on > .face{background:var(--acc);color:var(--on-fg)}
/* ---------- the failed-action strip: an ink slab with a red border ---------- */
.jam-err{border-left:0;outline:var(--bru-b) solid var(--red);outline-offset:calc(-1 * var(--bru-b));border-radius:10px;box-shadow:var(--bru-sh-s)}
/* ---------- sheets ---------- */
.veil{opacity:.55}
.t .label{color:var(--dim)}
/* ---------- jam-kiosk: huge 800 clock, dock blocks = bordered fill slabs with shadows, the lock a bordered circle ---------- */
:host(jam-kiosk) .clock{font-weight:800;letter-spacing:-.035em;font-size:calc(clamp(96px,min(19cqw,31cqh),200px) * 1.1)} /* huge */
:host(jam-kiosk) .k .bar{height:12px;border-radius:999px;outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b))}
:host(jam-kiosk) .dock{gap:16px;padding:0 16px 16px}
:host(jam-kiosk) .blk{background:var(--bc,var(--acc));color:var(--on-fg);border-radius:10px;outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));box-shadow:var(--bru-sh)}
:host(jam-kiosk) .blk .st{color:var(--on-fg)}
:host(jam-kiosk) .blk.none,:host(jam-kiosk) .host.light .blk.none{--bc:var(--slab);background:var(--slab);color:var(--fg)}
:host(jam-kiosk) .blk.none .st,:host(jam-kiosk) .host.light .blk.none .st{color:var(--dim)}
:host(jam-kiosk) .blk:active,:host(jam-kiosk) .blk.stamp{transform:translate(4px,4px);box-shadow:var(--bru-sh-down)}
:host(jam-kiosk) .blk:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
:host(jam-kiosk) .lk{--lk-bg:var(--slab);--lk-gl:var(--fg)}
:host(jam-kiosk) .host.light .lk:not(.alert):not(.off){--lk-gl:var(--fg)}
:host(jam-kiosk) .lk .disc{border:var(--bru-b) solid var(--bru-k);box-shadow:var(--bru-sh)}
:host(jam-kiosk) .lk.alert{--lk-bg:var(--red);--lk-gl:var(--on-fg)}
:host(jam-kiosk) .lk.off .disc{border:var(--bru-b) dashed var(--dim);box-shadow:none}
/* ---------- motion: snappy, never stepped ---------- */
@keyframes bru-drop{from{transform:translate(-6px,-6px);opacity:0}to{transform:none;opacity:1}}
@keyframes bru-rise{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes bru-stamp{0%{transform:none}40%{transform:translate(4px,4px)}to{transform:none}}
@keyframes bru-shake{0%{transform:translateX(-6px)}33%{transform:translateX(5px)}66%{transform:translateX(-3px)}to{transform:none}}
@keyframes bru-pop{from{transform:scale(.97);opacity:0}to{transform:none;opacity:1}}
/* ---------- jam-screensaver: the page ground, the huge clock, bars + disc as bordered fill slabs ---------- */
.ov{background:var(--primary-background-color,var(--slab2));--sfg:var(--fg);--sdim:var(--dim)}
.ov .img{background:var(--primary-background-color,var(--slab2))}
.ov .time{font-weight:800;letter-spacing:-.035em}
.ov .kick{color:var(--fg)}
.ov .temp{color:var(--sfg)}
.ov .sh{clip-path:none!important;border:var(--bru-b) solid var(--bru-k);box-shadow:var(--bru-sh);box-sizing:border-box}
.ov .sh.bar{border-radius:10px}
.ov .sh.disc{border-radius:50%}
.ov .sh.b2{background:var(--jam-art-2)} .ov .sh.b3{background:var(--jam-art-3)} .ov .sh.dk{background:var(--jam-art-5)}
.l0 .sh.b3,.l2 .sh.b3,.l3 .sh.b3,.l4 .sh.b3{display:none} /* b3 is placed only in l1 / l5 (else a 0x0 box would show its border) */
.tchip{background:var(--slab);color:var(--fg);clip-path:none;border:var(--bru-b) solid var(--bru-k);border-radius:10px;box-shadow:var(--bru-sh)}
.tchip small{color:var(--dim)}
.ov .np{background:var(--slab);border:var(--bru-b) solid var(--bru-k);border-radius:10px;box-shadow:var(--bru-sh)}
.ov .sdock .np{clip-path:none}
/* ---------- motifs ---------- */
.bru-arm span{outline:var(--bru-b) solid var(--bru-k);outline-offset:calc(-1 * var(--bru-b));border-radius:4px}
.bru-idle{background:var(--slab2);overflow:hidden}
.bru-idle i{position:absolute;border:var(--bru-b) solid var(--line);border-radius:10px;box-shadow:6px 6px 0 var(--line);box-sizing:border-box}
`;

  registerLook({
    id: "brutal",
    name: "Brutal",
    fonts: [{family: "Bricolage Grotesque", weight: "200 800", file: "bricolage-grotesque-var-latin.woff2"}],
    css: CSS,
    motifs: {empty: bruBars, idleArt: bruIdle, powerGlyph: bruPower, flash: bruFlash, decorate: bruDecorate},
  });
})();
