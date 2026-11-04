/* Look pack: Girard (decided brief docs/looks/GIRARD.md, 2026-11-03). Playful modernism after Alexander Girard (Herman Miller
   textiles, La Fonda del Sol, the Miller House; 1950s-60s): folk warmth on a modernist grid. The theme ("Jam Girard",
   tokens/looks/girard.mjs) sets the palette (cream-white page, white faces, saturated flat fills), Fraunces (soft, wonky) for
   names and numbers, Work Sans for the rest, square cards with pill keys / chips and the gentle motion; this pack draws:
   - framed textiles: every card / hero / jam-button / sheet face carries a 6px woven border inside its edge: a band in the
     room colour (an inset box-shadow) with the room's pattern in a partner colour on top (a ::after with four mask strips:
     top / bottom 12x6 tiles, left / right the same tile turned). One pattern per room: living diamonds, kitchen zigzag,
     master dots, marissa sawtooth, music stripes, nerd checks;
   - motifs (flat SVG masks in the room colour): sun (living), diamonds (kitchen), sleeping eye (master), heart (marissa),
     bird (music), eye (nerd); used as the jam-button icon disc (when no icon is set), before jam-light's level (filled
     with the light's colour when on), before room headings and in the idle art; the screensaver places sun, heart, eye
     and bird; the empty art is the Poster bars as pills in the textile colours;
   - keys, chips, tabs and scenes are pills (keys / scenes radius 28px: rounded tiles when tall): off = the room colour
     mixed 18% into the face, on = the full fill;
   - text on a fill: --acc-fg is worked out from the fill itself (ink on light fills, white on cobalt / magenta), so a
     jam-popup's inherited accent gets the right text colour too;
   - the power corner is a Girard sun (a disc with eight rays): off = a muted sun, on = the room / light colour; it turns
     15 degrees once on each tap (a 200 ms transition, not an animation loop);
   - jam-light on: the face tinted with the light colour (a flat 20% mix), the motif filled with it, a pill brightness bar;
   - kiosk: a big Fraunces clock, a patterned band along the top, the dock blocks as small framed textiles; screensaver:
     the page ground, the clock in Fraunces and four motifs in the layout's places.
   Shared code: none (CSS over the stable hooks + motifs only).
   Fonts: Fraunces (variable opsz 9-144 / wght 400-800, the SOFT 100 / WONK 1 instance) and Work Sans (variable 400-600),
   SIL OFL 1.1, latin subsets from Google Fonts, from <asset base>fonts/. */
(() => {
  const svgUrl = (vb, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'>${body}</svg>`)}")`;
  /* Motifs (24x24, black = drawn; the colour is the background under the mask). */
  const RAYS = Array.from({length: 8}, (_, i) => `<path d='M12 0.6 14.2 5.2H9.8Z' transform='rotate(${i * 45} 12 12)'/>`).join("");
  const MOTIF = {
    sun: svgUrl("0 0 24 24", `${RAYS}<circle cx='12' cy='12' r='5.6'/>`),
    heart: svgUrl("0 0 24 24", "<path d='M12 21.5C5 16.3 1.6 12.6 1.6 8.3 1.6 5.2 4 2.8 7 2.8c2.1 0 3.9 1.2 5 3 1.1-1.8 2.9-3 5-3 3 0 5.4 2.4 5.4 5.5 0 4.3-3.4 8-10.4 13.2Z'/>"),
    eye: svgUrl("0 0 24 24", "<path fill-rule='evenodd' d='M.8 12C4 6.2 7.8 4 12 4s8 2.2 11.2 8C20 17.8 16.2 20 12 20S4 17.8.8 12Zm11.2 5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z'/><circle cx='12' cy='12' r='2.6'/>"),
    sleep: svgUrl("0 0 24 24", "<path d='M1.5 9.5C5 14.8 8.4 16.6 12 16.6s7-1.8 10.5-7.1l1.4 1C20.3 16.5 16.4 19 12 19S3.7 16.5.1 10.5Z'/><path d='m5.6 15.2-1.9 3.4 1.6.9 1.9-3.4Zm4.6 2-.6 3.8 1.8.3.6-3.8Zm4 .3.6 3.8 1.8-.3-.6-3.8Zm4.2-2.3 1.9 3.4 1.6-.9-1.9-3.4Z'/>"),
    bird: svgUrl("0 0 24 24", "<path fill-rule='evenodd' d='M2 7.6 7.4 11c.9-3.6 3.9-6 7.4-6 2.1 0 3.6 1 4.5 2.4L23.6 8l-4 1.6c.1 5.7-4.4 10-10.2 10H3.8l3.4-3.2C5.5 15.4 4.4 13.8 4 12Zm14.3 1.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z'/>"),
    diamonds: svgUrl("0 0 24 24", "<path d='M12 .5 17 6l-5 5.5L7 6Zm-6 7L11 13l-5 5.5L1 13Zm12 0L23 13l-5 5.5L13 13Zm-6 7 5 5 -5 4.5-5-4.5Z'/>"),
  };
  /* Border patterns: a 12x6 tile for the top / bottom strips and the same tile turned for the sides (6x12). */
  const PAT = {
    diamonds: "<path d='M3 0 6 3 3 6 0 3Zm6 0 3 3-3 3-3-3Z'/>",
    zigzag: "<path d='M0 5.2 3 .8l3 4.4 3-4.4 3 4.4' fill='none' stroke='#000' stroke-width='1.9'/>",
    dots: "<circle cx='3' cy='3' r='1.7'/><circle cx='9' cy='3' r='1.7'/>",
    saw: "<path d='M0 6 3 1.2 6 6Zm6 0 3-4.8 3 4.8Z'/>",
    stripes: "<path d='M0 6 3 0h2.4L2.4 6Zm6 0 3-6h2.4L8.4 6Z'/>",
    checks: "<path d='M0 0h3v3H0Zm3 3h3v3H3Zm3-3h3v3H6Zm3 3h3v3H9Z'/>",
  };
  const patH = p => svgUrl("0 0 12 6", PAT[p]);
  const patV = p => svgUrl("0 0 6 12", `<g transform='translate(6 0) rotate(90)'>${PAT[p]}</g>`);
  /* Rooms by accent token: pattern, the pattern's partner colour, motif. ochre (living) is the default accent. */
  const ROOMS = {
    ochre: ["diamonds", "pink", "sun"], teal: ["zigzag", "ochre", "diamonds"], blue: ["dots", "teal", "sleep"],
    pink: ["saw", "violet", "heart"], violet: ["stripes", "pink", "bird"], green: ["checks", "teal", "eye"],
    red: ["diamonds", "teal", "eye"], paper: ["zigzag", "ochre", "sun"], ink: ["dots", "teal", "sun"],
  };
  const roomVars = ([p, k2, m]) => `--gi-ph:${patH(p)};--gi-pv:${patV(p)};--gi-k2:var(--${k2});--gi-mo:${MOTIF[m]}`;
  const ROOM_CSS = Object.entries(ROOMS).map(([a, r]) =>
    `${a === "ochre" ? ".host,.pop,.ov," : ""}[style*="--acc: var(--${a})"]{${roomVars(r)}}\n[style*="--bc: var(--${a})"]{--gi-bph:${patH(r[0])};--gi-bpv:${patV(r[0])};--gi-bk2:var(--${r[1]});--gi-bmo:${MOTIF[r[2]]}}`).join("\n");
  /* Text colour on a fill: ink (#2a1a12) where the fill is light, white where it is dark (cobalt, magenta, ink). The
     switch is a rough gamma-space luminance at 100 / 255 (vermilion 113 -> ink 4.6:1, magenta 90 / cobalt 93 -> white). */
  const STEP = "clamp(0, (100 - (.2126 * r + .7152 * g + .0722 * b)) * 1000, 1)";
  const fgOn = v => `rgb(from ${v} calc(42 + 213 * ${STEP}) calc(26 + 229 * ${STEP}) calc(18 + 237 * ${STEP}))`;
  /* The 6px frame: four mask strips over a ::after filled with the partner colour; the band itself is an inset shadow. */
  const FRAME_MASK = p => `var(--gi-${p}ph) left top/12px 6px repeat-x,var(--gi-${p}ph) left bottom/12px 6px repeat-x,var(--gi-${p}pv) left top/6px 12px repeat-y,var(--gi-${p}pv) right top/6px 12px repeat-y`;
  const FRAMED = ".host > .paper[data-cut=card]:not(.kiosk) > .face,.host > .paper[data-cut=hero] > .face,.host > .paper.btn > .face,.paper[data-cut=sheet] > .face";

  const CSS = `
/* ---------- rooms: pattern, partner colour, motif; the accent's own text colour ---------- */
${ROOM_CSS}
.host,.pop,[style*="--acc:"]{--gi-tint:color-mix(in oklch,var(--acc) 18%,var(--slab));--acc-fg:${fgOn("var(--acc)")}!important}
/* ---------- framed textiles ---------- */
${FRAMED}{box-shadow:inset 0 0 0 6px var(--gi-band,var(--acc))}
/* the left tone stripe of a framed face becomes the band: an alert tone turns the band red, the others keep the room */
:is(${FRAMED}).stripe{border-left:0}
:is(${FRAMED}).s-alert{--gi-band:var(--red);--gi-k2:var(--teal)}
:is(${FRAMED})::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:var(--gi-k2);
  -webkit-mask:${FRAME_MASK("")};mask:${FRAME_MASK("")}}
/* text clear of the frame on jam-button faces (their own padding is 10px) */
.host > .paper.btn > .kf{--p-t:13px;--p-r:14px;--p-b:13px;--p-l:14px}
/* a lit face of its accent (jam-button on): the band is a deeper shade of the accent so the frame still reads */
.host > .paper.btn > .kf.on{box-shadow:inset 0 0 0 6px color-mix(in oklch,var(--acc) 72%,var(--ink))}
/* ---------- type ---------- */
.num,.pct,.big,.cur,.time,.temp,.otemp,.hi,.lo,.clock,.tt,.vn,.v,.val{font-variant-numeric:lining-nums tabular-nums}
.disp,.nm,.clock,.time{font-optical-sizing:auto}
/* ---------- tone marks: little diamonds ---------- */
.tmk{width:10px;height:10px;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
/* ---------- keys: pills, tinted with the room off, the full fill on ---------- */
.key > .face{background:var(--gi-tint);color:var(--fg);border-color:transparent;border-radius:28px}
.key:not(:disabled):hover > .face{border-color:var(--acc)}
.key.on > .face{background:var(--acc);color:var(--acc-fg)}
.key.alert > .face{background:var(--red);color:${fgOn("var(--red)")}}
.key:disabled > .face{background:var(--slab2);color:var(--dim)}
.key:focus-visible{outline-offset:3px}
.chip{--chip-bg:var(--gi-tint)}
.chip.red{--chip-bg:var(--red);color:${fgOn("var(--red)")}}
.tab{border-radius:999px;background:color-mix(in oklch,var(--c,var(--acc)) 18%,var(--slab))}
.tab.on{background:var(--c,var(--acc));color:${fgOn("var(--c,var(--acc))")}}
.tab::after{display:none}
.tab:focus-visible{outline-offset:-3px}
.scene > .sf{border-radius:28px;background:var(--gi-tint)}
.scene.on > .sf{background:var(--acc);color:var(--acc-fg)}
.scene.jam-stamp > .sf::before{content:none}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}
.jam-wash{display:none}
/* outlined keys (jam-remote / jam-tv) are plain pills; the d-pad OK disc is the fill */
.ol > .face{background:var(--gi-tint)} .ol > .face::before{content:none} .ol.on > .face{background:var(--acc);color:var(--acc-fg)}
.rock > .face{background:transparent;border-radius:999px}
.rock .key > .face{color:${fgOn("var(--rk,var(--acc))")}}
.kv .vn{font-size:22px} /* K1 volume number: Fraunces at the kiosk floor */
.pad .ok > .face{background:var(--acc);color:var(--acc-fg)}
/* ---------- strips: rounded tracks, a sun-yellow knob on sliders ---------- */
.strip{inset:10px 0;border-radius:999px;background:var(--slab2);overflow:hidden}
.fill{border-radius:999px}
.track[role=slider] .fill::after,.vt[role=slider] .fill::after{content:"";position:absolute;right:-1px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;
  background:var(--slab);box-shadow:inset 0 0 0 4px var(--acc)}
.track[role=slider] .strip{overflow:visible}
/* ---------- power: the Girard sun top-right; turns 15deg on each tap ---------- */
.pw:not(.paper) .tri{inset:9px 9px auto auto;width:32px;height:32px;clip-path:none;background:var(--dim);
  -webkit-mask:${MOTIF.sun} center/contain no-repeat;mask:${MOTIF.sun} center/contain no-repeat;
  transition:rotate calc(200ms * var(--dur)) cubic-bezier(.3,.7,.35,1)}
.pw:not(.paper) svg{right:17px;top:17px;width:16px;height:16px;color:var(--slab);stroke-width:3}
.pw[aria-pressed=true] .tri{background:var(--gi-pw,var(--acc));rotate:15deg}
.pw[aria-pressed=true] svg{color:var(--gi-pwf,var(--acc-fg))}
.pw:disabled .tri{background:var(--line)} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-4px}
.pw{z-index:4}
:host(jam-tv) .pw{background:none;clip-path:none;color:var(--acc-fg)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:6px;top:6px;width:36px;height:36px;background:var(--acc);
  -webkit-mask:${MOTIF.sun} center/contain no-repeat;mask:${MOTIF.sun} center/contain no-repeat;rotate:15deg;transition:rotate calc(200ms * var(--dur)) cubic-bezier(.3,.7,.35,1)}
:host(jam-tv) .pw.off{color:var(--slab)} :host(jam-tv) .pw.off::before{background:var(--dim);rotate:0deg}
:host(jam-tv) .pw svg{right:16px;top:16px;width:16px;height:16px}
:host(jam-tv) .kiosk .pw::before{right:10px;top:10px;width:52px;height:52px}
:host(jam-tv) .kiosk .pw svg{right:24px;top:24px;width:24px;height:24px}
@media (prefers-reduced-motion:reduce){.pw .tri,:host(jam-tv) .pw::before{transition:none}}
/* ---------- jam-light: on = the face tinted with the light colour, the motif filled with it ---------- */
.host > .paper.lc.on > .face{background:color-mix(in srgb,var(--lc) 20%,var(--slab));color:var(--fg);--gi-pw:var(--lc);--gi-pwf:${fgOn("var(--lc)")}}
.lc.on .sub{color:var(--dim)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:inherit}
.lc .pct::before{content:"";display:inline-block;width:.8em;height:.8em;margin-right:.22em;vertical-align:-.04em;background:var(--acc);-webkit-mask:var(--gi-mo) center/contain no-repeat;mask:var(--gi-mo) center/contain no-repeat}
.lc.on .pct::before{background:var(--lc)}
.lc.dead .pct::before{background:var(--line)}
.lc.on .tap{padding-bottom:30px}
.lc .bs{left:16px;right:16px;bottom:14px;height:8px;border-radius:999px;background:var(--slab2);overflow:hidden}
.lc .bs i{background:var(--lc);border-radius:999px;clip-path:none}
.lc .bands{top:auto;bottom:30px;right:16px;left:auto;width:auto;height:12px;gap:4px;padding:0;background:none}
.lc .bands i{flex:none;width:12px;height:12px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--fg)}
/* light pop-up presets keep their plates */
.wp b{background:var(--plate);color:var(--plate-fg);padding:3px 6px 4px;right:auto;max-width:calc(100% - 16px)}
/* ---------- jam-button: the icon square becomes a disc; without an icon it shows the room motif ---------- */
.sq{border-radius:50%;clip-path:none}
.sq:empty{background:none}
.sq:empty::before{content:"";width:100%;height:100%;background:var(--acc);-webkit-mask:var(--gi-mo) center/contain no-repeat;mask:var(--gi-mo) center/contain no-repeat}
.on .sq:empty::before{background:var(--acc-fg)}
/* ---------- jam-heading: the room motif before the title, the rule a woven band ---------- */
:host(jam-heading) h2.disp{display:flex;align-items:center;gap:.3em}
:host(jam-heading) h2.disp::before{content:"";flex:none;width:.9em;height:.9em;background:var(--acc);-webkit-mask:var(--gi-mo) center/contain no-repeat;mask:var(--gi-mo) center/contain no-repeat}
.rule{position:relative;background:var(--acc)}
.rule::after{content:"";position:absolute;inset:0;background:var(--gi-k2);-webkit-mask:var(--gi-ph) left top/12px 6px repeat-x;mask:var(--gi-ph) left top/12px 6px repeat-x}
/* ---------- media / tv / speaker art: covers as they are ---------- */
.art img{filter:none;mix-blend-mode:normal}
/* ---------- the empty art: the Poster bars as pills in the textile colours ---------- */
.arm.gi-arm span{border-radius:999px}
/* jam-popup kicker: muted text (the accent fills are not text colours) */
.t .label{color:var(--dim)}
/* ---------- the failed-action strip ---------- */
.jam-err{border-left:var(--stripe-w) solid var(--red)}
/* ---------- jam-kiosk: Fraunces clock, a woven band along the top, dock blocks as small framed textiles ---------- */
:host(jam-kiosk) .k .bar{height:12px;background:var(--acc)}
:host(jam-kiosk) .k .bar::after{content:"";position:absolute;inset:0;background:var(--gi-k2);-webkit-mask:var(--gi-ph) left center/24px 12px repeat-x;mask:var(--gi-ph) left center/24px 12px repeat-x}
:host(jam-kiosk) .clock{font-weight:500;letter-spacing:-.02em}
:host(jam-kiosk) .host{--gi-bph:var(--gi-ph);--gi-bpv:var(--gi-pv);--gi-bk2:var(--gi-k2)}
:host(jam-kiosk) .blk{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 6px var(--bc,var(--acc))}
:host(jam-kiosk) .blk::after{content:"";position:absolute;inset:0;pointer-events:none;background:var(--gi-bk2);-webkit-mask:${FRAME_MASK("b")};mask:${FRAME_MASK("b")}}
:host(jam-kiosk) .host .blk.none{--bc:var(--line)}
:host(jam-kiosk) .blk .st,:host(jam-kiosk) .host.light .blk .st,:host(jam-kiosk) .host.light .blk.none .st{color:var(--dim)}
:host(jam-kiosk) .host.light .blk,:host(jam-kiosk) .host.light .blk.none{background:var(--slab);color:var(--fg)}
:host(jam-kiosk) .blk:active,:host(jam-kiosk) .blk.stamp{background:color-mix(in srgb,var(--bc,var(--acc)) 22%,var(--slab))}
:host(jam-kiosk) .blk:focus-visible{outline:3px solid var(--focus);outline-offset:-9px}
:host(jam-kiosk) .lk .disc{border-radius:50%}
/* ---------- motion: gentle, 200 ms ---------- */
@keyframes gi-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes gi-press{to{transform:var(--press)}}
@keyframes gi-pop{0%{transform:scale(1)}45%{transform:scale(1.04)}to{transform:none}}
@keyframes gi-nudge{0%{transform:translateX(-4px)}50%{transform:translateX(3px)}to{transform:none}}
@keyframes gi-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes gi-fade{from{opacity:0}to{opacity:1}}
/* ---------- jam-screensaver: the page ground, a Fraunces clock, four motifs in the layout's places ---------- */
.ov{background:var(--primary-background-color,var(--slab));--sfg:var(--fg);--sdim:var(--dim)}
.ov .img{background:var(--primary-background-color,var(--slab))}
.ov .kick{color:var(--fg)}
.ov .temp{color:var(--sfg)} /* the accent fills are not text-safe on the cream page */
.ov .time,.ov .tchip .tt{font-weight:500}
.ov .sh.gim{background:var(--gi-c);-webkit-mask:var(--gi-m) center/contain no-repeat;mask:var(--gi-m) center/contain no-repeat;clip-path:none;border-radius:0}
.ov .sh.gim.b1{width:18vh!important;height:18vh!important} .ov .sh.gim.b2{width:13vh!important;height:13vh!important}
.ov .sh.gim.b3{width:12vh!important;height:12vh!important} .ov .sh.gim.dk{width:22vh!important;height:22vh!important}
.ov .sh.gim{margin:4vh 3vw}
.l0 .sh.gim.b3,.l2 .sh.gim.b3,.l3 .sh.gim.b3,.l4 .sh.gim.b3{display:none}
/* l1 stacks its three bars 11vh apart: smaller motifs there, stepped to the right */
.l1 .sh.gim.b1,.l1 .sh.gim.b2,.l1 .sh.gim.b3{width:9vh!important;height:9vh!important;margin-top:1vh}
.l1 .sh.gim.b2{margin-left:calc(3vw + 7vh)} .l1 .sh.gim.b3{margin-left:calc(3vw + 14vh)}
.tchip{background:var(--acc);color:var(--acc-fg);clip-path:none;border-radius:999px}
.tchip small{color:inherit}
`;

  /* empty: the Poster bars as rounded pills in the textile colours (seeded). */
  function giArm(key) {
    const box = this.poster(key), s = typeof key === "number" ? key >>> 0 : seed(key);
    [...box.children].forEach((b, i) => { b.style.background = `var(--jam-art-${[1, 3, 4, 2, 6, 5][(s + i) % 6]})`; });
    box.classList.add("gi-arm");
    return box;
  }
  /* idleArt: a textile swatch: a fill, one big motif in a partner colour, a woven band along the bottom (seeded). */
  const IDLE = [["sun", 3, 1], ["heart", 7, 2], ["eye", 6, 3], ["bird", 4, 7], ["diamonds", 1, 3], ["sun", 2, 3], ["bird", 3, 6], ["heart", 1, 7]];
  const BANDS = ["diamonds", "zigzag", "dots", "saw", "stripes", "checks"];
  function giIdle(sd) {
    const r = rng((sd >>> 0) ^ 0x5bd1e995), [m, bg, fg] = IDLE[Math.floor(r() * IDLE.length)], band = BANDS[Math.floor(r() * BANDS.length)];
    const box = el("div", "abs giidle");
    box.setAttribute("aria-hidden", "true");
    box.style.background = `var(--jam-art-${bg})`;
    const mo = el("i", "gm"); mo.style.background = `var(--jam-art-${fg})`; mo.style.setProperty("--gi-m", MOTIF[m]);
    const bd = el("i", "gb"); bd.style.background = `var(--jam-art-${fg})`; bd.style.setProperty("--gi-m", patH(band));
    box.append(mo, bd);
    return box;
  }
  /* screensaver: sun, heart, eye and bird in the b1 / b2 / b3 / dk places (Poster's node count and order). */
  function giScreensaver() {
    return [["b1 bar", "sun", 3], ["b2 bar", "heart", 1], ["b3 bar", "eye", 6], ["dk disc", "bird", 2]].map(([k, m, c]) => {
      const s = el("div", "sh gim " + k); s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--gi-m", MOTIF[m]); s.style.setProperty("--gi-c", `var(--jam-art-${c})`);
      return s;
    });
  }
  function giFlash() { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 1 1"); s.setAttribute("aria-hidden", "true"); return s; }

  registerLook({
    id: "girard",
    name: "Girard",
    fonts: [
      {family: "Fraunces", weight: "400 800", file: "fraunces-soft-wonk-var-latin.woff2"},
      {family: "Work Sans", weight: "400 600", file: "work-sans-var-latin.woff2"},
    ],
    css: CSS + `
.giidle{overflow:hidden}
.giidle .gm{position:absolute;left:18%;top:12%;width:64%;height:64%;-webkit-mask:var(--gi-m) center/contain no-repeat;mask:var(--gi-m) center/contain no-repeat}
.giidle .gb{position:absolute;left:0;right:0;bottom:6%;height:9%;-webkit-mask:var(--gi-m) left center/auto 100% repeat-x;mask:var(--gi-m) left center/auto 100% repeat-x}
`,
    motifs: {empty: giArm, idleArt: giIdle, flash: giFlash, screensaver: giScreensaver},
  });
})();
