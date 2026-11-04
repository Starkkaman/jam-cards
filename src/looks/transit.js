/* Look pack: Transit (after Massimo Vignelli + Unimark, the NYC subway signage 1970 and map 1972; decided brief
   docs/looks/TRANSIT.md). The theme ("Jam Transit", tokens/looks/transit.mjs) sets the palette (black signs with white
   text in both modes, MTA route colours for the room hues, the service-change yellow for alerts), Arimo in mixed case, the
   square shapes and the "pull in" motion; this pack draws what tokens cannot:
   - the sign rule: every card face carries a double rule at its top (4px rule, 3px gap, 1px rule) in the page's text
     colour over the page's ground (black on white in light mode, white on black in dark), so it reads like a platform sign;
   - route bullets: a round 24px bullet in the card's route colour (its accent) with the first letter of its name
     (motif decorate marks the name with data-tr = the letter and --tr-bf = black or white, whichever reads on that route),
     drawn by ::before; off / unavailable = a hollow grey ring; jam-button's icon square becomes the bullet; the
     alerts card and alert states carry the yellow service-change diamond;
   - the power corner as a small round bullet top-right (white ring, filled when on);
   - jam-light: the card stays the black sign when on; the light's colour shows as a thin brightness bar; group members =
     a row of small bullets; no washes, no label plates;
   - keys: dark grey plates with white text; the active key / tab / choice is a white plate with black text (the mockup's
     selected nav item); route colours stay in bullets and rules;
   - text that sits on the page (jam-heading, the kiosk home) in HA's page text colour (primary-text-color);
   - kiosk: the clock line set like the mockup's "Good evening." greeting, dock blocks as black signs with route bullets;
     the screensaver = an arrivals board (the time big in white on black, now playing as a row with a bullet);
   - motifs: empty = a route line with stations, idleArt = map strokes (parallel route lines), flash = none,
     powerGlyph = a 2px stroke, screensaver = a route line along the bottom.
   Font: Arimo (SIL OFL 1.1, latin subset from Google Fonts, variable 400-700) from <asset base>fonts/. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  /* Route colours of the art tokens (theme): 1 red, 2 orange, 3 yellow, 4 lime, 5 green, 6 blue, 7 purple, 8 grey. */
  const ROUTE = i => `var(--jam-art-${i})`;
  /* Letter colour on a route bullet per accent name: white only where it reaches 4.5:1 (blue, purple), else black. */
  const WHITE_ON = new Set(["blue", "pink", "violet"]);
  const accentOf = card => {
    const c = (card && card._config) || {};
    if (typeof card._accent === "function") { try { const a = card._accent(); if (a) return a; } catch (e) { /* no accent */ } }
    return accentName(c.accent) || "ochre";
  };
  /* First letter or digit of a name (uppercase), "" when there is none. */
  const initial = t => { const m = /[\p{L}\p{N}]/u.exec(String(t || "")); return m ? m[0].toLocaleUpperCase() : ""; };
  const mark = (node, text, acc) => {
    if (!node) return;
    const l = initial(text);
    if (!l) { node.removeAttribute("data-tr"); return; }
    if (node.getAttribute("data-tr") !== l) node.setAttribute("data-tr", l);
    const fg = WHITE_ON.has(accentName(acc) || acc) ? "#fff" : "#000";
    if (node.style.getPropertyValue("--tr-bf") !== fg) node.style.setProperty("--tr-bf", fg);
  };
  /* decorate: route letters for the bullets (attributes + one custom property; the pack CSS draws them). */
  function transitDecorate(body, card) {
    if (!body || !card) return;
    const acc = accentOf(card), q = s => body.querySelector(s);
    switch (card.localName) {
      case "jam-light": { const n = q(".lc .nm"); mark(n, n && n.textContent, acc); break; }
      case "jam-button": { const sq = q(".sq"), lb = q(".lbl"); if (sq && !sq.firstElementChild) mark(sq, lb ? lb.textContent : card._config.name, acc); else if (sq) mark(sq, "", acc); break; }
      case "jam-heading": { const n = q("h2.disp"); mark(n, n && n.textContent, acc); break; }
      case "jam-tile": { const n = q(".name"); mark(n, n && n.textContent, acc); break; }
      case "jam-alerts": { const n = q(".ttl"); if (n) { n.setAttribute("data-tr", "!"); n.style.setProperty("--tr-bf", "#000"); } break; }
      case "jam-panel": case "jam-list": case "jam-fan": { const n = q(".ttl, h3.disp"); mark(n, n && n.textContent, acc); break; }
      case "jam-kiosk": {
        const dock = (card._config && card._config.dock) || [];
        body.querySelectorAll(".blk").forEach((b, i) => {
          const cfg = dock[i] || {}, none = String(cfg.accent || "").toLowerCase() === "none";
          mark(b.querySelector(".nm"), cfg.name, none ? "none" : accentName(cfg.accent) || accentOf(card));
        });
        break;
      }
      default: break;
    }
  }
  /* empty: a route line with three stations (Golden Arm placeholder), seeded route colour. */
  function transitLine(key) {
    const s = typeof key === "number" ? key >>> 0 : seed(key), box = el("div", "arm trline");
    box.setAttribute("aria-hidden", "true");
    box.style.setProperty("--tr-c", ROUTE(1 + (s % 7)));
    for (let i = 0; i < 3; i++) box.append(el("i"));
    return box;
  }
  /* idleArt: map strokes, three to five parallel route lines (thick, square ends) bending 45 degrees once, seeded. */
  function transitMap(sd) {
    const r = rng((sd >>> 0) ^ 0x5bd1e995), box = el("div", "abs trmap");
    box.setAttribute("aria-hidden", "true");
    const svg = svgEl("svg", {viewBox: "0 0 100 100", preserveAspectRatio: "xMidYMid slice"});
    const n = 3 + Math.floor(r() * 3), bend = 30 + r() * 40, used = new Set();
    for (let i = 0; i < n; i++) {
      let c; do c = 1 + Math.floor(r() * 7); while (used.has(c) && used.size < 7);
      used.add(c);
      const y = 22 + i * 11, x = bend + i * 6;
      svg.append(svgEl("path", {d: `M-5 ${y} H${x} L${x + 40} ${y + 40} V110`, fill: "none", stroke: ROUTE(c), "stroke-width": "7", "stroke-linecap": "butt", "stroke-linejoin": "miter"}));
    }
    const st = svgEl("circle", {cx: (bend - 12).toFixed(1), cy: "22", r: "4.2", class: "stn"});
    svg.append(st);
    box.append(svg);
    return box;
  }
  /* powerGlyph: a 2px stroke inside the round power bullet. */
  function transitPower() {
    const svg = svgEl("svg", {viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "2.4", "stroke-linecap": "butt"});
    for (const d of ["M12 4v8", "M7 7.6a7 7 0 1 0 10 0"]) svg.append(svgEl("path", {d}));
    return svg;
  }
  function transitFlash() { return svgEl("svg", {viewBox: "0 0 1 1", "aria-hidden": "true"}); }
  /* screensaver: four segments of one route line along the bottom edge (four nodes, like Poster's composition). */
  function transitBoard() {
    return [[0, 30, 2], [30, 25, 5], [55, 20, 6], [75, 25, 7]].map(([x, w, c]) => {
      const s = el("div", "sh tline"); s.setAttribute("aria-hidden", "true");
      s.style.left = x + "%"; s.style.width = w + "%"; s.style.background = ROUTE(c);
      return s;
    });
  }

  const CSS = `
/* ---------- sign rule: 4px rule, 3px gap, 1px rule in the page's text colour over the page's ground ---------- */
:host{--tr-rule:var(--primary-text-color,var(--fg));--tr-gap:var(--primary-background-color,var(--ink));--tr-pg:var(--primary-text-color,var(--fg));--tr-pgdim:var(--secondary-text-color,var(--dim))}
.pop,.ov{--tr-rule:var(--fg);--tr-gap:var(--slab)}
.paper[data-cut=card] > .face,.paper[data-cut=hero] > .face,.paper.btn > .face{border-top:4px solid var(--tr-rule);
  box-shadow:inset 0 3px 0 var(--tr-gap),inset 0 4px 0 var(--tr-rule)}
.jam-wash{display:none}
/* jam-light pop-up whites / presets are fills, not signs */
.wt > .face,.wp > .face{border-top:0;box-shadow:none}
.spiral{display:none}
:focus-visible{outline-color:var(--focus)}
/* ---------- type: numerals 400 tabular ---------- */
.num,.pct,.big,.cur,.time,.temp,.otemp,.hi,.lo,.clock,.tt,.vol .v,.vn,.bigbar b,.kbar b,.val{font-variant-numeric:tabular-nums}
.num:is(.v,.pt,.temp,.otemp,.tt,.time,.pct,.hi,.lo,.disp,.clock,.big,.cur),b.num,.pct{font-weight:400}
/* ---------- route bullets (data-tr = the letter, --tr-bf = its colour, --tr-bc = the route; default the accent) ---------- */
[data-tr]::before{content:attr(data-tr);flex:none;display:inline-grid;place-items:center;box-sizing:border-box;width:24px;height:24px;margin-right:10px;
  border-radius:50%;background:var(--tr-bc,var(--acc));color:var(--tr-bf,#000);font:700 14px/1 var(--body);letter-spacing:0;text-transform:none;vertical-align:middle}
.lc .nm[data-tr]::before{margin-right:4px}
/* off / unavailable: a hollow grey ring */
.lc:not(.on) .nm[data-tr]::before,.kf.unavail [data-tr]::before{background:none;box-shadow:inset 0 0 0 2px var(--jam-art-8);color:var(--jam-art-8)}
/* ---------- tone marks and stripes: round marks; no left stripe (the sign rule is the only edge), an alert tone turns the
   bullet into the yellow service-change diamond ---------- */
.tmk{border-radius:50%}
.stripe{border-left:var(--bord,0px none)}
.stripe.s-alert [data-tr]::before,.tmk.t-alert{--tr-bc:var(--red);--tr-bf:var(--on-fg);border-radius:0;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
/* ---------- keys: dark plates, white text; active = white plate, black text ---------- */
.key > .face{background:var(--slab2);color:var(--fg)}
.key.on > .face,.ikey.main > .face{background:var(--fg);color:var(--slab)}
.key.alert > .face{background:var(--red);color:var(--on-fg)}
.key:disabled > .face{color:var(--dim)}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:var(--slab2);color:var(--dim)}
.tab.on{background:var(--fg);color:var(--slab);box-shadow:inset 0 0 0 2px var(--tr-pg)}
.tab.on::after{background:var(--slab)}
.scene.on > .sf{background:var(--fg);color:var(--slab);box-shadow:inset 0 0 0 2px var(--tr-pg)}
/* outlined keys (jam-remote / jam-tv) are plain plates; the volume rocker is three plates; the d-pad is white */
.ol > .face{background:var(--slab2)} .ol > .face::before{content:none} .ol.on > .face{background:var(--fg);color:var(--slab)}
.rock > .face{background:transparent}
.rock .key > .face{background:var(--slab2);color:var(--fg)}
.rock .key:focus-visible{outline-color:var(--focus)}
.pad .tri{background:var(--fg)}
.pad .ok > .face,.pad .ok:not(:disabled):hover > .face{background:var(--fg);color:var(--slab)}
.key.turnon > .face,.key.turnon.alert > .face{background:var(--fg);color:var(--slab)}
/* speaker kicker marks and weather / meta marks: round */
.kk i{border-radius:50%}
:host(jam-graph) .sq{border-radius:50%}
/* jam-tv's own power corner: the same round bullet (kiosk: 40px) */
:host(jam-tv) .pw{background:none;clip-path:none;color:var(--slab)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:9px;top:9px;width:26px;height:26px;border-radius:50%;box-sizing:border-box;background:var(--fg)}
:host(jam-tv) .pw.off{color:var(--fg)} :host(jam-tv) .pw.off::before{background:none;box-shadow:inset 0 0 0 2px var(--fg)}
:host(jam-tv) .pw svg{right:14px;top:14px;width:16px;height:16px;color:inherit}
:host(jam-tv) .kiosk .pw::before{right:14px;top:14px;width:44px;height:44px}
:host(jam-tv) .kiosk .pw svg{right:24px;top:24px;width:24px;height:24px}
.scene.jam-stamp > .sf::before{content:none}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}
/* ---------- strips: 4px, flat; track slab2, fill white (lights: the light's colour) ---------- */
.strip{inset:14px 0;background:var(--slab2)}
.fill{background:var(--fg)}
/* ---------- power corner -> a round bullet top-right: white ring, filled white when on (glyph black) ---------- */
.pw:not(.paper) .tri{inset:10px 10px auto auto;width:26px;height:26px;border-radius:50%;background:none;box-shadow:inset 0 0 0 2px var(--fg);clip-path:none}
.pw:not(.paper) svg{right:15px;top:15px;width:16px;height:16px;color:var(--fg)}
.pw[aria-pressed=true] .tri{background:var(--fg)}
.pw[aria-pressed=true] svg{color:var(--slab)}
.pw:disabled .tri{box-shadow:inset 0 0 0 2px var(--dim)} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-3px}
/* ---------- jam-light: the card stays the sign; light colour = thin bar; members = small bullets ---------- */
.lc.on > .face{background:var(--slab);color:var(--fg)}
.lc .sub,.lc.on .sub{color:var(--dim)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin:0;padding:0;background:none;color:inherit}
.lc .tap{padding-right:44px}
.lc .bs{left:14px;right:14px;bottom:12px;height:4px;background:var(--slab2)}
.lc .bs i{background:var(--lc)}
.lc .bands{top:auto;bottom:24px;right:14px;left:auto;width:auto;height:12px;gap:4px;padding:0;background:none}
.lc .bands i{flex:none;width:12px;height:12px;border-radius:50%}
.lc .bands i[style*="slab2"]{background:transparent!important;box-shadow:inset 0 0 0 2px var(--jam-art-8)}
:host(jam-alerts) .ttl[data-tr]{display:flex;align-items:center}
:host(jam-alerts) .ttl[data-tr]::before{--tr-bc:var(--red);border-radius:0;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);width:26px;height:26px}
:host(jam-list) .ttl[data-tr],:host(jam-panel) .ttl[data-tr],:host(jam-fan) h3[data-tr]{display:flex;align-items:center}
:host(jam-tile) .name[data-tr]{display:flex;align-items:center}
.meta span + span::before{border-radius:50%}
/* ---------- jam-button: sign face, the icon square becomes the route bullet ---------- */
.kf.on{background:var(--slab);color:var(--fg)}
.kf.on .st,.on .st{color:var(--dim)}
.kf .sq{border-radius:50%;clip-path:none;background:var(--acc);color:var(--tr-bf,var(--acc-fg))}
.on .sq{background:var(--acc);color:var(--tr-bf,var(--acc-fg))}
.sq[data-tr]::before{margin:0;width:auto;height:auto;background:none}
/* ---------- jam-weather: today = a white plate with black text and glyphs ---------- */
.col.today > .face{background:var(--fg);color:var(--slab);--g-sun:var(--slab);--g-paper:var(--slab);--g-rain:var(--slab);--g-bolt:var(--slab);--g-bg:var(--fg)}
.col.today .label,.col.today .lo{color:var(--slab)}
.col.today .span::before,.col.today .bar{background:var(--slab)}
/* ---------- jam-speaker K1 (kiosk): the side panel is the sign, not the sampled art colour; keys are plates ---------- */
.side{--kbg:var(--slab)!important;--kfg:var(--fg)!important;--ktr:var(--slab2)!important;background:var(--slab);color:var(--fg)}
.kt .ikey > .face,.kv .key > .face{background:var(--slab2);color:var(--fg)}
.kt .ikey.main > .face{background:var(--fg);color:var(--slab)}
.kt .ikey:disabled > .face,.kv .key:disabled > .face{background:var(--slab2);color:var(--dim)}
.kbk .ikey > .face{border-width:2px}
.kbk .fav.on > .face{color:#fff}
/* ---------- media / posters: art on slab2, covers as they are ---------- */
.art > .face,.poster > .face{background:var(--slab2);color:var(--fg)}
.art img{filter:none;mix-blend-mode:normal}
.arm.trline.trline.trline{position:absolute;left:12%;right:12%;top:50%;bottom:auto;width:auto;max-width:none;height:8px;margin:-4px 0 0;padding:0;gap:0;
  display:flex;justify-content:space-between;align-items:center;background:var(--tr-c);transform:none}
.trline i{display:block;width:20px;height:20px;border-radius:50%;background:var(--slab2);box-shadow:inset 0 0 0 4px var(--fg)}
.mini .arm.trline.trline.trline,.np .th .arm.trline.trline.trline{height:4px;margin-top:-2px}
.mini .trline i,.np .th .trline i{width:10px;height:10px;box-shadow:inset 0 0 0 2px var(--fg)}
.trmap{background:var(--slab2)}
.trmap svg{display:block;width:100%;height:100%}
.trmap .stn{fill:var(--slab2);stroke:var(--fg);stroke-width:2.4}
/* ---------- motion: pull in ---------- */
@keyframes transit-pull{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes transit-press{to{transform:var(--press)}}
@keyframes transit-nudge{0%{transform:translateX(-4px)}50%{transform:translateX(3px)}to{transform:none}}
@keyframes transit-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes transit-fade{from{opacity:0}to{opacity:1}}
/* ---------- page text: jam-heading, kiosk home ---------- */
:host(jam-heading) .t{color:var(--tr-pg)}
:host(jam-heading) .t .label{color:var(--tr-pgdim)}
:host(jam-heading) h2.disp{display:flex;align-items:center}
:host(jam-heading) h2[data-tr]::before{width:36px;height:36px;font-size:20px;margin-right:12px}
:host(jam-heading) .rule{height:4px;background:var(--tr-pg);box-shadow:0 3px 0 var(--tr-gap),0 4px 0 var(--tr-pg);margin-bottom:4px}
/* ---------- kiosk ---------- */
:host(jam-kiosk) .host.light .k{--fg:var(--tr-pg);--dim:var(--tr-pgdim)}
:host(jam-kiosk) .clock{font-weight:500;letter-spacing:-.025em}
:host(jam-kiosk) .bar{height:4px;background:var(--tr-pg);box-shadow:0 3px 0 var(--tr-gap),0 4px 0 var(--tr-pg)}
:host(jam-kiosk) .blk,:host(jam-kiosk) .host.light .blk,:host(jam-kiosk) .host.light .blk.none{background:var(--slab);color:var(--jam-fg,#fff);--fg:var(--jam-fg,#fff);
  border-top:4px solid var(--tr-rule);box-shadow:inset 0 3px 0 var(--tr-gap),inset 0 4px 0 var(--tr-rule)}
:host(jam-kiosk) .blk .st,:host(jam-kiosk) .host.light .blk .st,:host(jam-kiosk) .host.light .blk.none .st{color:var(--jam-dim,#9d9d9d)}
:host(jam-kiosk) .blk .nm{display:flex;align-items:center}
:host(jam-kiosk) .blk .nm[data-tr]::before{--tr-bc:var(--bc,var(--acc));width:32px;height:32px;font-size:19px;margin-right:12px}
:host(jam-kiosk) .blk.none .nm[data-tr]::before{--tr-bc:var(--jam-art-8);color:#000}
/* ---------- screensaver: arrivals board ---------- */
.ov{background:var(--ink);--sfg:var(--ink-fg);--sdim:var(--ink-dim)}
.ov .time{font-weight:500;letter-spacing:-.025em}
.ov .np{background:var(--slab);color:var(--fg);border-top:4px solid var(--fg)}
.sh.bar,.sh.disc{display:none}
.ov .sh.tline{bottom:0;height:1.2vh}
.ov .np .kick::before{content:"M";display:inline-grid;vertical-align:middle;place-items:center;width:max(20px,2.8vh);height:max(20px,2.8vh);margin-right:1vh;border-radius:50%;
  background:var(--pink);color:#fff;font:700 max(11px,1.6vh)/1 var(--body);letter-spacing:0}
/* ---------- look cards (2026-11-03): severity in MTA terms: alert = the red (white text), warn = the service-change yellow ---------- */
:host(jam-arrivals){--ar-alert:#c8102e;--ar-warn:var(--red)}
:host(jam-arrivals) .alert .stt{color:#ff5a4f}
:host(jam-sticker) .sk.alert{--sk:#c8102e}
:host(jam-sticker) .sk.warn{--sk:var(--red)}
`;

  registerLook({
    id: "transit",
    name: "Transit",
    fonts: [{family: "Arimo", weight: "400 700", file: "arimo-var-latin.woff2"}],
    css: CSS,
    motifs: {decorate: transitDecorate, empty: transitLine, idleArt: transitMap, powerGlyph: transitPower, flash: transitFlash, screensaver: transitBoard},
  });
})();
