/* Look pack: Braun (design brief docs/looks/BRAUN.md, decided 2026-11-03). After Dieter Rams: a warm-white appliance you
   operate. Quiet panels (hairline + soft elevation, the only look with a shadow), one orange signal for "active / act"
   (--ochre = the signal in this look's theme), toggles instead of power corners, LED dots instead of colour floods, no cut
   corners, smooth 160-220 ms ease-out motion. Colour, type, shape and motion tokens come from the theme "Jam Braun"
   (tokens/looks/braun.mjs); this pack only skins the stable class hooks and adds the Braun motifs:
   empty = a 5x4 dot grille, idleArt = a speaker-grille dot field with one orange dot, flash = none, powerGlyph = a thin
   1.75px stroke, screensaver = the AB-1 dial ring. Colour revision 2026-11-03 ("more colour"): lit lights = a flat tint of
   the light's colour over the panel (18% light, 24% dark via a style query on --jam-ink), ET66 yellow #e8b12a for the
   secondary accent keys (shuffle / favourite on, active tab / scene / choice, current source), olive #6f8f3a for on toggles
   and switch keys, room colour as a 4px rule on top of jam-heading and a 15% dock-block tint (pressed = solid), 12% accent /
   tint on the speaker / TV text bands (the K1 side panel stays the plain panel). The pack sheet is adopted only while the look is active, so nothing here
   needs a look selector. Font: Archivo (SIL OFL 1.1, latin subset from Google Fonts, variable wght axis; declared 300-700:
   300 = the kiosk clock). */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  /* empty: 5x4 dot grille (dims for idle: the dots are --dim / --line, no accent). */
  function braunGrille(key) {
    const box = el("div", "arm grille"); box.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 20; i++) box.append(el("i"));
    return box;
  }
  /* idleArt: concentric rows of dots (a T3 speaker grille) on the panel, one dot in the signal orange (picked by the seed). */
  function braunGrill(sd) {
    const r = rng((sd >>> 0) ^ 0x5bd1e995), box = el("div", "abs bgrill");
    box.setAttribute("aria-hidden", "true");
    const svg = svgEl("svg", {viewBox: "-50 -50 100 100", preserveAspectRatio: "xMidYMid slice"});
    const dots = [[0, 0]];
    for (let ring = 1; ring <= 7; ring++) {
      const rad = ring * 9, n = ring * 6, off = r() * Math.PI;
      for (let k = 0; k < n; k++) { const a = off + k * 2 * Math.PI / n; dots.push([rad * Math.cos(a), rad * Math.sin(a)]); }
    }
    const lit = 1 + Math.floor(r() * 18); // one of the inner two rings
    dots.forEach(([x, y], i) => svg.append(svgEl("circle", {cx: x.toFixed(2), cy: y.toFixed(2), r: "2.3", class: i === lit ? "sig" : ""})));
    box.append(svg);
    return box;
  }
  /* powerGlyph: thin 1.75px stroke (Braun toggles hide it; kept for any other use). */
  function braunPower() {
    const svg = svgEl("svg", {viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round"});
    for (const d of ["M12 3.5v8", "M6.6 7.2a7.5 7.5 0 1 0 10.8 0"]) svg.append(svgEl("path", {d}));
    return svg;
  }
  /* flash: no spiral; an empty, hidden box keeps the sheet code path. */
  function braunFlash() { const svg = svgEl("svg", {viewBox: "0 0 1 1", "aria-hidden": "true"}); return svg; }
  /* screensaver: the AB-1 dial ring (placed by the layout's .dk box). The three bar nodes stay (hidden by the pack CSS),
     so the composition keeps the Poster node count and order. */
  function braunDial() {
    return ["b1 bar", "b2 bar", "b3 bar", "dk ring"].map(k => { const s = el("div", "sh " + k); s.setAttribute("aria-hidden", "true"); return s; });
  }

  const CSS = `
/* ---------- surfaces: panels with a hairline and a soft elevation; inner panels 10px ---------- */
.paper[data-cut=card] > .face,.paper[data-cut=hero] > .face,.paper[data-cut=sheet] > .face{box-shadow:var(--jam-elev-1,none)}
.paper[data-cut=hero] > .face{border:1px solid var(--line)}
/* key-kind faces that are tiles, not keys */
.paper.btn[data-cut]{--rad:14px}
.paper.btn[data-cut] > .face{border:1px solid var(--line);box-shadow:var(--jam-elev-1,none)}
.paper.art[data-cut],.paper.tile[data-cut]{--rad:10px}
.unavail{color:var(--dim)}
/* ---------- type: big numerals 400, tabular ---------- */
.num,.pct,.big,.cur,.time,.temp,.otemp,.hi,.lo,.clock,.tt,.vol .v,.vn,.bigbar b,.kbar b{font-weight:400;font-variant-numeric:tabular-nums}
/* ---------- tone marks and stripes: LED dots, 2px rules ---------- */
.tmk{border-radius:50%}
.stripe{border-left-width:var(--stripe-w)}
/* ---------- focus: 2px signal ring, 2px offset, radius follows the element ---------- */
:focus-visible{outline-width:2px!important}
.chip:focus-visible,.scene:focus-visible,.tab:focus-visible,.pw:focus-visible,.tile:focus-visible{outline-offset:2px}
/* ---------- keys: pills, panel 2, ink text; the primary key / active choice = signal ---------- */
.key > .face{background:var(--slab2);color:var(--fg);border:1px solid transparent}
.key:not(:disabled):hover > .face{border-color:var(--line)}
.key.on > .face,.ikey.main > .face{background:var(--ochre);color:var(--on-fg)}
.key.alert > .face{background:var(--slab2);color:var(--alert-text);box-shadow:inset 0 0 0 1.5px var(--red)}
.key:disabled > .face{color:var(--dim)}
/* a switch key in a wrapped tile / list row keeps its own height (no stretched dome) */
.row .sw.paper,.row .sw.paper > .face{height:auto}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:var(--slab2);color:var(--dim)}
/* chips: pills (shape token none, radius 999px) */
button.chip::before{border-radius:999px}
/* tinted chips (alert / home / hot): panel chip with a 8px dot, never a hue flood */
.chip.red,.chip.home,.chip.hot{--chip-bg:var(--slab2);color:var(--fg);--dot:var(--teal);padding-left:22px!important;
  background-image:radial-gradient(circle at 11px 50%,var(--dot) 0 4px,transparent 4.5px)}
button.chip.red,button.chip.home,button.chip.hot{background-image:none}
button.chip.red::before,button.chip.home::before,button.chip.hot::before{background-image:radial-gradient(circle at 11px 50%,var(--dot) 0 4px,transparent 4.5px)}
.chip.red{--dot:var(--red);color:var(--alert-text)}
.chip.hot{--dot:var(--hot,var(--acc))}
.chips .chip.hot[data-tone=paper]{color:var(--fg)}
/* ---------- strips / sliders: 4px, rounded ends; track panel 2, fill signal; slider knob 18px panel + hairline ---------- */
.strip{inset:14px 0;border-radius:2px;background:var(--slab2)}
.vt .strip,.vt.thin .strip,.vol .vt .strip,.kv .vt .strip,.klist .spk .vt.thin .strip,.mu.full .spk .vt.thin .strip{inset:calc(50% - 2px) 0}
.fill{background:var(--ochre);border-radius:2px}
.track[role=slider] .fill::after,.vt[role=slider] .fill::after{content:"";position:absolute;right:-9px;top:50%;width:18px;height:18px;margin-top:-9px;
  border-radius:50%;background:var(--slab);border:1px solid var(--line);box-shadow:0 1px 3px rgba(0,0,0,.18);box-sizing:border-box}
.muted .fill{background:var(--dim)}
/* ---------- motifs ---------- */
.arm.grille.grille.grille{display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(4,1fr);gap:0;width:min(56%,150px);height:auto;aspect-ratio:5/4;
  place-items:center;padding:0;margin:0;position:absolute;left:50%;top:50%;right:auto;bottom:auto;max-width:none;transform:translate(-50%,-50%)}
.arm.grille i{display:block;width:44%;aspect-ratio:1;border-radius:50%;background:var(--dim);opacity:.55}
.bgrill{background:var(--slab)}
.bgrill svg{display:block;width:100%;height:100%}
.bgrill circle{fill:var(--line)}
.bgrill circle.sig{fill:var(--ochre)}
.jam-wash{display:none}
.spiral{display:none}
/* ---------- motion: smooth, never stepped; the pack's keyframes ---------- */
@keyframes braun-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes braun-press{to{transform:var(--press)}}
@keyframes braun-fade-out{from{opacity:1}to{opacity:0}}
@keyframes braun-fade-in{from{opacity:0}to{opacity:1}}
@keyframes braun-settle{from{transform:scale(.98)}to{transform:none}}
@keyframes braun-nudge{0%{transform:translateX(-4px)}50%{transform:translateX(3px)}to{transform:none}}
@keyframes braun-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}

/* ---------- power corner -> toggle switch (34x18 pill, top-right, same 46px hit area) ---------- */
.pw:not(.paper){background:none;clip-path:none;color:inherit}
.pw:not(.paper) .tri,.pw:not(.paper) > svg{display:none}
.pw:not(.paper)::before{content:"";position:absolute;right:12px;top:14px;width:34px;height:18px;box-sizing:border-box;border-radius:9px;
  background:var(--slab3);border:1px solid var(--line);transition:background-color 180ms ease-out,border-color 180ms ease-out}
.pw:not(.paper)::after{content:"";position:absolute;right:30px;top:16px;width:14px;height:14px;border-radius:50%;background:var(--ink-fg);
  box-shadow:0 1px 2px rgba(0,0,0,.3);transition:transform 180ms ease-out,background-color 180ms ease-out}
.pw[aria-pressed=true]:not(.paper)::before,.pw:not([aria-pressed]):not(.off):not(.paper)::before{background:#6f8f3a;border-color:#6f8f3a} /* ok / on = olive */
.pw[aria-pressed=true]:not(.paper)::after,.pw:not([aria-pressed]):not(.off):not(.paper)::after{transform:translateX(16px);background:var(--ink-fg)}
.pw:not(.paper):disabled::before,.pw:not(.paper):disabled::after{opacity:.45}
.pw:not(.paper):focus-visible{outline:none}
.pw:not(.paper):focus-visible::before{outline:2px solid var(--focus);outline-offset:2px}

/* ---------- jam-light: face stays panel; LED dot in the light's colour; brightness strip; member dots ---------- */
/* Offline (state grammar): the panel lifts out: no face, no elevation, a dashed hairline; dim text. */
.paper[data-cut] > .face.unavail{background:transparent;box-shadow:none;border:1.5px dashed var(--dim)}
.lc.on > .face{--b-tint:18%;background:color-mix(in srgb,var(--lc) var(--b-tint),var(--slab));color:var(--fg)}
@container style(--jam-ink: #1c1c1a){.lc.on > .face{--b-tint:24%}} /* dark mode (Braun dark ink); without style queries 18% */
.lc.on .sub{color:color-mix(in srgb,var(--fg) 72%,var(--dim))} /* dim text stays >= 4.5:1 on the tint */
/* the name flows around the toggle (and the member dots): only its first line is shortened */
.lc .tap{padding-right:14px}
.lc .top{display:block}
.lc .top::before{content:"";float:right;width:52px;height:26px}
.lc.on:has(.bands) .top::before{width:calc(52px + var(--bw,46px) * .875)}
.lc .nm{display:block;overflow-wrap:break-word}
.lc .nm ha-icon{display:inline-block;vertical-align:-3px;margin-right:6px}
.lc .sub{margin-top:5px}
.lc.on .nm::before{content:"";display:inline-block;width:8px;height:8px;margin:0 7px 2px 0;border-radius:50%;background:var(--lc);box-shadow:0 0 6px var(--lc);vertical-align:middle}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin:0;padding:0;background:none;color:inherit}
.lc .bs{left:14px;right:14px;bottom:10px;height:4px;border-radius:2px;background:var(--slab2)}
.lc .bs i{background:var(--lc);border-radius:2px}
.lc .bands{top:18px;bottom:auto;right:60px;width:auto;height:10px;gap:4px;padding:0;background:none}
.lc .bands.corner{top:18px}
.lc .bands i{flex:none;width:10px;height:10px;border-radius:50%}
.lc .bands i[style*="slab2"]{background:transparent!important;box-shadow:inset 0 0 0 1.5px var(--dim)}
/* light pop-up */
.bigbar{border-radius:10px;overflow:hidden}
.bigbar.hi b{color:var(--fg)}
.hb{border-radius:10px;overflow:hidden}
.mk{border-radius:5px;outline:2px solid var(--slab);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.wt > .face,.wp > .face{border-radius:10px;box-shadow:none}
.wp > .face{background:var(--plate)} /* under the preset preview (its name sits on the preview's dark band) */
.wt.on > .face{outline:2px solid var(--ochre);outline-offset:-2px}
.wp.on > .face::after{border:2px solid var(--ochre);border-radius:10px}
.wedit{border-radius:10px}
.nin{border:1px solid var(--line);border-radius:10px}
.kbar{border-radius:10px;overflow:hidden}
.kbar b{background:none}
.mem{border-top:1px solid var(--line)}
.mtrack .mb{top:9px;height:4px;border-radius:2px;overflow:hidden}

/* ---------- jam-button ---------- */
.kf.on{background:var(--slab);color:var(--fg)}
.on .st{color:var(--dim)}
.kf .sq{background:var(--slab2);color:var(--fg);border-radius:50%}
.kf.on .sq{background:var(--slab2);color:var(--fg)}
.kf.on .lbl::before{content:"";display:inline-block;width:8px;height:8px;margin:0 7px 2px 0;border-radius:50%;background:var(--acc);box-shadow:0 0 6px var(--acc);vertical-align:middle}

/* ---------- jam-tabs / jam-scenes / jam-choice / lists / panels ---------- */
.tab{border-radius:10px;background:var(--slab2);color:var(--dim)}
.tab::after{left:10px;right:10px;height:2px}
.tab.on{background:#e8b12a;color:var(--on-fg)}
.tab.on::after{background:var(--on-fg)}
.scene > .sf{border-radius:999px}
.scene.on > .sf{background:#e8b12a;color:var(--on-fg)}
.opt.on > .face,.mu .acts .key.sel > .face{background:#e8b12a;color:var(--on-fg)}
/* ok / on switch keys (list rows, tiles, speaker Join): olive, deep ink text (4.9:1; white is 3.7:1, --ink 4.1:1) */
.key.sw.on > .face,.key.tog.on > .face{background:#6f8f3a;color:#161616}
.scene.jam-stamp > .sf::before{content:none}
.opt.busy > .face{border-color:var(--ochre)}
.row + .row{border-top-width:1px}
.row{border-top-width:1px}
.acc{height:2px}
.h > .rule{order:-1;height:4px;border-radius:2px} /* jam-heading: the room colour as a 4px rule on top */
.cnt{background:var(--slab2);color:var(--alert-text);box-shadow:inset 0 0 0 1.5px var(--red)}
.meta span + span::before{border-radius:50%}

/* ---------- jam-weather ---------- */
.col.today > .face{background:var(--slab2);color:var(--fg);box-shadow:inset 0 0 0 2px var(--ochre);--g-sun:var(--ochre);--g-paper:var(--paper-fg);--g-rain:var(--teal);--g-bolt:var(--red);--g-bg:var(--slab2)}
.col.today .label,.col.today .lo{color:var(--dim)}
.col.today .span::before{background:var(--line)}
.span > .bar{border-radius:4px;background:var(--dim)}
.col.today .span > .bar{background:var(--ochre)}
.span::before{left:3.5px;width:1px}

/* ---------- jam-graph ---------- */
.sq{border-radius:50%}
.ln{stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.tip{border:1px solid var(--line);border-radius:10px;box-shadow:var(--jam-elev-1,none)}

/* ---------- jam-media ---------- */
.art > .face{background:var(--slab2)}
.art.paused > .face{background:var(--slab2)}
.art img{filter:none;mix-blend-mode:normal}

/* ---------- jam-tv ---------- */
.poster > .face{background:var(--slab2);color:var(--fg)}
.poster .prog{height:4px}
.poster .prog i{background:var(--ochre);border-radius:0 2px 2px 0}
.tile > .face{background:var(--slab2);color:var(--fg)}
.key.tile .nm::before{content:"";display:inline-block;width:8px;height:8px;margin:0 7px 2px 0;border-radius:50%;background:var(--app,var(--dim));vertical-align:middle}
.tile.cur{outline:none}
.tile.cur > .face{background:#e8b12a;color:var(--on-fg)}
.key.tile.cur .nm::before{box-shadow:0 0 0 1.5px var(--on-fg)}
.tile.home > .face{background:var(--slab3);color:var(--fg)}
.tile .now{border-radius:999px;padding:4px 7px}

/* ---------- jam-remote: d-pad keys, rocker, outlined keys ---------- */
.pad .ok > .face{background:var(--ochre);color:var(--on-fg)}
.pad .ok:not(:disabled):hover > .face{background:var(--ochre)}
.pad .tri{background:var(--fg)}
.ol > .face{background:var(--slab2)}
.ol > .face::before{content:none}
.ol.on > .face{background:var(--ochre);color:var(--on-fg)}
.rock > .face{background:transparent;border-radius:999px;overflow:hidden;gap:2px}
.rock .key > .face{background:var(--slab2);color:var(--fg);border-radius:0}
.rock .key:disabled > .face{background:var(--slab2);color:var(--dim)}
.rock .key:focus-visible{outline-color:var(--focus);outline-offset:-3px}
.sec .gh .pw.on > .face{background:var(--ochre);color:var(--on-fg)}

/* ---------- jam-speaker + Music Assistant panel ---------- */
.poster > .face{background:var(--slab2)}
.poster:not(.off) .band{background:color-mix(in srgb,var(--acc) 12%,var(--slab))}
.kk i{border-radius:50%}
.bk .shuf.on > .face,.bk .fav.on > .face,.dock .ikey.fav.on > .face{background:#e8b12a;color:var(--on-fg)} /* ET66 yellow: secondary accent keys */
.pg{height:4px;background:var(--ochre);border-radius:0 2px 2px 0}
.row{border-radius:10px}
.row .play > .face{background:var(--slab3)}
.mu .tabs{border-bottom:1px solid var(--line)}
.mu .tabs button.on::before{height:2px;background:var(--ochre)}
.pin::before{inset:5px;border-radius:50%;clip-path:none}
.pin.on::before{background:var(--ochre)}
.pin.on{color:var(--on-fg)}
.dock{border-radius:10px}
.dock .ikey.main > .face{background:var(--ochre);color:var(--on-fg)}
.sbar input{border:1px solid var(--line);border-radius:10px}
.spk{border-top-width:1px}
/* K1 (kiosk speaker): the side panel stays a quiet panel, not the sampled art colour */
.side{--kbg:var(--slab)!important;--kfg:var(--fg)!important;--ktr:var(--slab2)!important;background:var(--slab);color:var(--fg)} /* plain panel: a 12% tint of dark art reads grey */
.kart{background:var(--slab2)}
.kbk .ikey > .face{border:1px solid var(--line);background:var(--slab2);color:var(--fg)}
.kbk .shuf.on > .face,.kbk .fav.on > .face{background:#e8b12a;color:var(--on-fg);border-color:#e8b12a}
.kt .ikey > .face{background:var(--slab2);color:var(--fg)}
.kt .ikey.main > .face{background:var(--ochre);color:var(--on-fg)}
.kt .ikey:disabled > .face{background:var(--slab2);color:var(--dim)}
.kv .key > .face{background:var(--slab2);color:var(--fg)}
.kv .key:disabled > .face{background:var(--slab2);color:var(--dim)}
.kv .vt .strip{inset:auto 0 12px 0;height:4px;background:var(--slab2)}
.kv .vn{top:4px;transform:none}
.kv .vt .fill{background:var(--ochre)}
.kv .vn,.kv .vn.hi{color:var(--fg)}
.kprog .bar{height:4px;border-radius:2px;background:var(--slab2)}
.kprog .bar i{background:var(--ochre);border-radius:2px}
.khead .kk i{outline:none}
.kspk{background:var(--slab)}

/* ---------- sheets (openSheet, jam-popup) ---------- */
.veil{opacity:.5}
.t .label{color:var(--dim)}
.pop.opening .wipe{animation-name:var(--jam-kf-sheet,braun-rise)}

/* ---------- jam-kiosk: panel dock blocks with a room dot; pressed inverts; clock 300 with the colon in signal ---------- */
.k .bar{height:2px}
.blk{background:color-mix(in srgb,var(--bc,var(--acc)) 15%,var(--slab));color:var(--fg);border:1px solid var(--line);border-radius:14px;box-shadow:var(--jam-elev-1,none)}
.blk.none{background:var(--slab)}
.blk .nm::before{content:"";display:inline-block;width:12px;height:12px;margin:0 12px 4px 0;border-radius:50%;background:var(--bc,var(--acc));vertical-align:middle}
.blk.none .nm::before{content:none}
.blk .st,.host.light .blk.none .st{color:var(--dim)}
.blk:active,.blk.stamp{background:var(--bc,var(--acc));color:var(--bf,var(--on-fg));border-color:var(--bc,var(--acc))}
.blk:active .st,.blk.stamp .st{color:var(--bf,var(--on-fg))}
.blk:active .nm::before,.blk.stamp .nm::before{background:var(--bf,var(--on-fg))}
.blk.none:active,.blk.none.stamp{background:var(--fg);color:var(--slab);border-color:var(--fg)}
.blk.none:active .st,.blk.none.stamp .st{color:var(--slab)}
.blk:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.k .dock{gap:10px}
.clock{font-weight:300}
.colon{color:color-mix(in srgb,var(--ochre) 75%,var(--fg))} /* the signal, deep enough for 3:1 as large text on the page */
.lk{--lk-bg:var(--slab);--lk-gl:var(--fg)}
.host.light .lk:not(.alert):not(.off){--lk-gl:var(--fg)}
.lk .disc{border:1px solid var(--line);box-shadow:var(--jam-elev-1,none)}
.lk.alert .disc{border-color:var(--red)}
.lk.off .disc{border:1.5px solid var(--dim);box-shadow:none}

/* ---------- jam-screensaver: AB-1 clock on a panel page ---------- */
.ov{background:var(--slab);--sfg:var(--fg);--sdim:var(--dim)}
.ov .img{background:var(--slab)}
.ov .time{font-weight:300}
.ov .kick{color:var(--dim)}
.ov .temp{color:var(--sfg)}
.ov .word{font-weight:400}
.sh.bar{display:none}
.sh.ring{background:none;border-radius:50%;box-shadow:inset 0 0 0 2px var(--line);clip-path:none}
.sh.ring::after{content:"";position:absolute;left:50%;top:7%;width:3%;min-width:8px;aspect-ratio:1;border-radius:50%;background:var(--ochre);transform:translateX(-50%)}
.tchip{background:var(--slab);color:var(--fg);border:1px solid var(--line);border-radius:14px;box-shadow:var(--jam-elev-1,none)}
.tchip small{color:var(--dim)}
.np .th{background:var(--slab2);border-radius:10px}
.sdock .np{background:var(--slab);border:1px solid var(--line);border-radius:14px;box-shadow:var(--jam-elev-1,none)}

/* ---------- failed action strip ---------- */
.jam-err{border-radius:10px;box-shadow:var(--jam-elev-1,none);border-left-width:var(--stripe-w)}
`;

  registerLook({
    id: "braun",
    name: "Braun",
    fonts: [{family: "Archivo", weight: "300 700", file: "archivo-var-latin.woff2"}],
    css: CSS,
    motifs: {empty: braunGrille, idleArt: braunGrill, powerGlyph: braunPower, flash: braunFlash, screensaver: braunDial},
  });
})();
