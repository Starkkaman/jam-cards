/* Look pack: Glass (decided brief docs/looks/GLASS.md, 2026-11-03). Liquid glass + bento (Apple 2025, Linear / Vercel
   bento grids, Arc): frosted panes floating over a soft colour field, calm and tactile. The theme ("Jam Glass",
   tokens/looks/glass.mjs) sets the palette (dark primary), the colour field as HA's lovelace-background, the bento radii
   (28px cards, 18px keys, pills), Figtree in mixed case, the spring motion and jam-fx: 1; this pack draws:
   - panes: every card / hero / jam-button face is a pane: a solid #182036 / #fbfcff face with a 1px edge, or under fx a
     frosted pane (the theme's glass fill, `--jam-shadow`: white .08 / .62, backdrop blur 24px saturate 1.4, jam-elev-1 =
     the inner light edge + a soft drop shadow) and a 2px lift on hover;
   - big numbers in Figtree 300 (clocks, temperatures, values), names 600, labels 500 in sentence case;
   - jam-light on: the pane glows from inside with the light's colour (a soft radial tint under fx; a tinted solid without),
     brightness = a thick rounded track with a round knob (glossy under fx); every strip is a thick rounded track, sliders
     carry the knob;
   - keys are rounded panes (18px), active keys / tabs / scenes take the room colour with ink text; chips, tabs, the
     power button and the tone marks are pills / dots;
   - kiosk: the big thin clock floats on its own colour field (dimmer with fx off, the kiosks' setting), the dock tiles
     are panes tinted with their colour; screensaver: the colour field (brighter under fx), the clock in Figtree 300, the
     layout's shapes as glass pills and an orb, now playing on a pane;
   - motifs: empty (rounded bars), idleArt (three soft orbs), flash (none).
   Effects (data-fx: the theme's jam-fx: 1; a card's `fx: false`, e.g. the kiosks, turns them off): translucency, blur,
   the light glow, glossy knobs, the hover lift, the brighter colour field. Reduced motion: no lift, no press, no entrance.
   Font: Figtree (variable 300-700, SIL OFL 1.1, latin subset from Google Fonts) from <asset base>fonts/. */
(() => {
  /* A frosted pane under fx (glass fill + blur + edge / shadow), and the solid pane without. */
  const FROST = "background:var(--shadow);-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4);box-shadow:var(--jam-elev-1,none)";
  const SOLID = "background:var(--slab);box-shadow:inset 0 0 0 1px var(--line)";
  /* The glossy knob (fx): a white disc with a highlight on its upper left. */
  const GLOSS = "radial-gradient(circle at 34% 28%,#fff 0 18%,rgba(255,255,255,.55) 42%,rgba(255,255,255,0) 70%),linear-gradient(160deg,#fff,#dfe5f2)";
  /* The colour field: three soft blobs (field colours art-1..3) over the ground; alpha x (1 + fx) / 2, so fx off is half
     as bright (--gl-fx is 1 under data-fx, else 0). */
  const fieldBg = (a, b, c) =>
    `radial-gradient(70vmax 55vmax at 8% 4%,color-mix(in srgb,var(--jam-art-1) calc(${a}% * (1 + var(--gl-fx,0)) / 2),transparent),transparent 62%),` +
    `radial-gradient(60vmax 52vmax at 96% 34%,color-mix(in srgb,var(--jam-art-2) calc(${b}% * (1 + var(--gl-fx,0)) / 2),transparent),transparent 62%),` +
    `radial-gradient(64vmax 46vmax at 42% 104%,color-mix(in srgb,var(--jam-art-3) calc(${c}% * (1 + var(--gl-fx,0)) / 2),transparent),transparent 64%)`;

  const CSS = `
/* ---------- panes: card / hero / jam-button faces; frosted under fx ---------- */
:host([data-fx]) .host,.pop[data-fx],.ov[data-fx]{--gl-fx:1}
.host > .paper[data-cut=card] > .face,.host > .paper[data-cut=hero] > .face,.host > .paper.btn > .face{${SOLID};color:var(--fg)}
:host([data-fx]) .host > .paper[data-cut=card] > .face,:host([data-fx]) .host > .paper[data-cut=hero] > .face,:host([data-fx]) .host > .paper.btn > .face{${FROST};
  transition:transform calc(260ms * var(--jam-motion,1)) var(--jam-ease-2),box-shadow calc(260ms * var(--jam-motion,1)) var(--jam-ease-2)}
/* subtle lift on hover (fx, pointer devices; not while pressed) */
@media (hover:hover){:host([data-fx]) .host > .paper.press:not(:active):not(.pressing):hover > .face{transform:translateY(-2px)}}
/* cards inside a sheet: plain solid panes one step up (the sheet is the frosted layer) */
:host-context(.pop) .host > .paper > .face{background:var(--slab);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:inset 0 0 0 1px var(--line);transform:none!important}
/* ---------- type: light, large numbers; names 600; sentence-case labels ---------- */
.time,.temp,.otemp,.big,.cur,.clock,.tt,.pct{font-weight:300;font-variant-numeric:tabular-nums}
.v,.vn,.hi,.lo{font-weight:400;font-variant-numeric:tabular-nums}
.big.un{font-weight:var(--disp-w)}
/* very large numbers (the brief): 40-48px in Figtree 300 where a card shows one value */
.lc .pct{font-size:40px;line-height:1}
:host(jam-slider) .v{font-size:40px;font-weight:300;line-height:1}
:host(jam-house) .temp{font-size:46px} :host(jam-house) .otemp{font-size:32px}
:host(jam-gauge) .big:not(.un){font-size:46px}
:host(jam-graph) .cur{font-size:48px}
:host(jam-tile) .val{font-weight:400;font-size:24px}
.num{font-variant-numeric:tabular-nums}
/* ---------- keys: rounded panes; on = the room colour with ink text ---------- */
.key > .face{background:var(--slab2);color:var(--fg);border:0;box-shadow:inset 0 0 0 1px var(--line)}
.key:not(:disabled):hover > .face{box-shadow:inset 0 0 0 1.5px var(--dim)}
.key.on > .face,.ikey.main > .face{background:var(--acc);color:var(--acc-fg);box-shadow:none}
:host([data-fx]) .key.on > .face,.pop[data-fx] .key.on > .face{box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 20px -10px var(--acc)}
.key.alert > .face{background:var(--red);color:var(--on-fg);box-shadow:none}
/* a key in a wrapping row (jam-tile, jam-list) keeps its own height: Poster's height:100% stretches a wrapped key to the
   row, which in a rounded tile reads as a tall blob spilling out of its card */
.row > .key,.row > .paper.key{height:auto;align-self:center}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:var(--slab3);color:var(--dim);box-shadow:none}
button.chip::before{box-shadow:inset 0 0 0 1px var(--line)}
.chip.red::before,.chip.on::before{box-shadow:none}
/* ---------- strips: thick rounded tracks; sliders carry a round knob ---------- */
.strip{inset:4px 0;background:var(--slab2);border-radius:999px;overflow:hidden}
.fill{border-radius:999px}
.track[role=slider] .strip,.vt[role=slider] .strip{overflow:visible}
.track[role=slider] .fill,.vt[role=slider] .fill{min-width:24px}
.track[role=slider] .fill::after,.vt[role=slider] .fill::after{content:"";position:absolute;right:-2px;top:50%;width:28px;height:28px;margin-top:-14px;border-radius:50%;
  background:#fff;box-shadow:0 0 0 1px rgba(15,20,36,.18),0 3px 8px rgba(0,0,0,.28)}
:host([data-fx]) .track[role=slider] .fill::after,:host([data-fx]) .vt[role=slider] .fill::after,.pop[data-fx] .track[role=slider] .fill::after{background:${GLOSS}}
/* ---------- marks: dots, pills ---------- */
.tmk{width:9px;height:9px;border-radius:50%}
.lg .sq{border-radius:50%}
.lg .v{font-weight:inherit}
:host(jam-graph) svg rect{rx:3px}
/* weather glyphs: clouds / moon in a mid tone (Poster's --paper is the near-white pane in light mode) */
:host(jam-weather) .host{--g-paper:var(--dim)}
.rule{border-radius:999px}
.arm span{border-radius:999px}
.tab,.scene > .sf,.kf .sq{border-radius:999px}
.scene > .sf{border-radius:18px}
.kf .sq{border-radius:14px}
.jam-err{border-radius:16px;border-left:0;box-shadow:inset 3px 0 0 var(--red)}
/* tone: a dot before the first line instead of Poster's left stripe (a stripe turns into a crescent on a 28px corner) */
.face.stripe{border-left:0;--p-l:30px}
.face.stripe::after,:host(jam-remote) .sec > .face::after{content:"";position:absolute;left:15px;top:19px;width:8px;height:8px;border-radius:50%;background:var(--tc,var(--line));pointer-events:none}
.face.s-on{--tc:var(--acc)} .face.s-alert{--tc:var(--red)} .face.s-calm{--tc:var(--teal)}
:host(jam-remote) .sec > .face{border-left:0;--p-l:30px;--tc:var(--acc)}
/* unavailable: an empty pane with a dashed edge (offline); off stays a quiet pane */
.face.unavail,.lc.dead > .face,.kf.unavail{background:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;
  box-shadow:none!important;border:1.5px dashed color-mix(in oklab,var(--dim) 55%,var(--line))!important}
.face.unavail::after{background:transparent;box-shadow:inset 0 0 0 1.5px var(--dim)}
/* ---------- power: a 36px round button top-right; on = the room colour ---------- */
.pw .tri{inset:10px 10px auto auto;width:36px;height:36px;border-radius:50%;background:var(--slab2);box-shadow:inset 0 0 0 1px var(--line)}
.pw svg{right:19px;top:19px;width:18px;height:18px;color:var(--fg)}
.pw[aria-pressed=true] .tri{background:var(--nw-pw,var(--acc));box-shadow:none}
.pw[aria-pressed=true] svg{color:var(--on-fg)}
.pw:disabled .tri{background:var(--slab2);box-shadow:none} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-8px}
:host(jam-tv) .pw{background:none;color:var(--on-fg)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:10px;top:10px;width:36px;height:36px;border-radius:50%;background:var(--acc)}
:host(jam-tv) .pw.off{color:var(--fg)} :host(jam-tv) .pw.off::before{background:var(--slab2);box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-tv) .pw svg{right:19px;top:19px;width:18px;height:18px}
:host(jam-tv) .kiosk .pw::before{right:14px;top:14px;width:52px;height:52px}
:host(jam-tv) .kiosk .pw svg{right:27px;top:27px;width:26px;height:26px}
/* ---------- lit = the pane lights up in its colour (jam-light on: the light's colour; jam-button on: the room colour).
   The colour is re-lit in OKLCH: lightness clamped to a bright band and chroma capped, so a warm white never mixes with
   the blue-grey pane into khaki. No fx: one bright tint (L .84); fx: a radial glow from a near-white core (L .95) through
   the tint to a deeper rim (L .76) and a soft halo of the colour. Text on a lit pane is ink. ---------- */
.host > .paper.lc.on > .face{--gl-c:var(--lc)}
.host > .paper.btn > .kf.on{--gl-c:var(--acc)}
.host > .paper.lc.on > .face,.host > .paper.btn > .kf.on{--gl-1:oklch(from var(--gl-c) .95 clamp(0,c,.05) h);--gl-2:oklch(from var(--gl-c) .84 clamp(0,c,.12) h);
  --gl-3:oklch(from var(--gl-c) .76 clamp(0,c,.14) h);--gl-halo:oklch(from var(--gl-c) .8 clamp(0,c,.16) h / .55);
  background:var(--gl-2);color:var(--on-fg);box-shadow:inset 0 0 0 1px var(--gl-3)}
:host([data-fx]) .host > .paper.lc.on > .face,:host([data-fx]) .host > .paper.btn > .kf.on{
  background:radial-gradient(130% 120% at 18% 0%,var(--gl-1),var(--gl-2) 48%,var(--gl-3));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.65),0 16px 44px -16px var(--gl-halo)}
.lc.on .sub,.lc.on .pct,.lc.on .nm{color:var(--on-fg)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:var(--on-fg)}
.lc.on .pw[aria-pressed=true] .tri,.kf.on .pw[aria-pressed=true] .tri{background:var(--on-fg);box-shadow:none}
.lc.on .pw[aria-pressed=true] svg,.kf.on .pw[aria-pressed=true] svg{color:var(--gl-2)}
.lc .bs{left:16px;right:16px;bottom:14px;height:14px;border-radius:999px;background:var(--slab2);overflow:visible}
.lc.on .bs{background:color-mix(in oklab,var(--on-fg) 18%,var(--gl-2))}
.lc .bs i{min-width:14px;border-radius:999px;background:var(--on-fg)}
.lc .bs i::after{content:"";position:absolute;right:-3px;top:50%;width:20px;height:20px;margin-top:-10px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(15,20,36,.2),0 2px 6px rgba(0,0,0,.3)}
:host([data-fx]) .lc .bs i::after{background:${GLOSS}}
.lc .bands{top:56px;bottom:36px;right:14px;width:22px;gap:3px;padding:0;background:none}
.lc .bands i{border-radius:999px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--on-fg) 35%,transparent)}
.lc.on .tap{padding-right:52px}
/* light pop-up: the big brightness bar, the hue strip and the member tracks as rounded tracks, the hue marker a pill */
.bigbar,.hb{border-radius:22px;overflow:hidden}
.bigbar i{border-radius:0}
.mk{border-radius:999px;outline:0;box-shadow:0 0 0 3px var(--ink)}
.mtrack .mb,.mtrack .mb i{border-radius:999px}
.sws .sw > .face{border-radius:999px}
.wp b{background:var(--plate);color:var(--plate-fg);padding:3px 8px 4px;border-radius:999px;right:auto;max-width:calc(100% - 16px)}
/* ---------- jam-button: pane tile; on = lit (above); big = a larger bento tile ---------- */
.kf.on .st{color:var(--on-fg)}
.kf .sq{background:var(--slab2);color:var(--fg)}
.kf.on .sq{background:color-mix(in oklab,var(--on-fg) 12%,var(--gl-2));color:var(--on-fg)}
.kf.on .pw .tri{background:color-mix(in oklab,var(--on-fg) 12%,var(--gl-2));box-shadow:none} .kf.on .pw svg{color:var(--on-fg)}
.paper.btn.big,.paper.kiosk{--rad:36px}
/* ---------- jam-tabs / jam-scenes ---------- */
.tab{background:var(--slab2);color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
.tab.on{background:var(--c,var(--acc));color:var(--acc-fg);box-shadow:none}
.tab::after{left:14px;right:auto;top:50%;bottom:auto;width:8px;height:8px;margin-top:-4px;border-radius:50%}
.tab.on::after{display:none}
.scene > .sf{background:var(--slab2);color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
.scene.on > .sf{background:var(--acc);color:var(--acc-fg);box-shadow:none}
.scene.jam-stamp > .sf::before{content:none}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}
.jam-wash{display:none}
/* ---------- media / tv / speaker art: rounded covers ---------- */
.art img{filter:none;mix-blend-mode:normal}
:host(jam-media) .art > .face,:host(jam-tv) .poster > .face,:host(jam-speaker) .poster > .face{background:var(--slab2);color:var(--fg);overflow:hidden}
.ol > .face{background:var(--slab2)} .ol > .face::before{content:none} .ol.on > .face{background:var(--acc);color:var(--acc-fg)}
.rock > .face{background:none;gap:4px}
/* empty art (Golden Arm bars) on the slab2 cover pane: the room colour, rounded */
.poster .arm span,.art .arm span,.kart .arm span{background:var(--acc)}
.poster.off .arm span,.kart.off .arm span{background:var(--slab3)}
.pad .ok > .face{background:var(--acc);color:var(--acc-fg)}
/* ---------- sheets: a frosted pane under fx ---------- */
:host([data-fx]) .pop .sheet > .face,.pop[data-fx] .sheet > .face{background:color-mix(in srgb,var(--slab) 93%,transparent);
  -webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4);box-shadow:var(--jam-elev-1,none)}
/* bento: an odd-count multi-column kiosk sheet leads with one wide tile */
.pop.full .body > :first-child:nth-last-child(2n+1):not(:only-child){grid-column:1 / -1}
.t .label{color:var(--dim)} /* sheet kickers: dim text (an accent kicker is not text-safe on a light pane) */
.pop[data-fx] .veil{-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
/* ---------- jam-kiosk: the big thin clock floating on the colour field; dock tiles = panes tinted with their colour ---------- */
:host(jam-kiosk) .k{isolation:isolate;background:var(--primary-background-color,var(--ink))}
:host(jam-kiosk) .k::before{content:"";position:absolute;inset:-40px;z-index:-1;pointer-events:none;background:${fieldBg(16, 18, 12)}}
:host(jam-kiosk) .k .bar{width:56px;height:6px;border-radius:999px;right:auto}
:host(jam-kiosk) .clock{font-weight:300;letter-spacing:-.03em}
:host(jam-kiosk) .dock{gap:12px}
/* Dock tiles: a pane tinted with the block's colour (a "none" block: a neutral pane); with data-state (jam-kiosk:
   on / off / action) on = the solid room colour with ink text (and a glow of it under fx), off = a neutral pane, action =
   an outlined tile. */
:host(jam-kiosk) .blk{border-radius:28px;background:color-mix(in oklab,var(--bc,var(--acc)) 24%,var(--slab));color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-kiosk) .blk.none{--bc:var(--slab2);background:var(--slab)}
:host(jam-kiosk[data-fx]) .blk{background:color-mix(in srgb,var(--bc,var(--acc)) 22%,var(--shadow));box-shadow:var(--jam-elev-1,none)}
:host(jam-kiosk[data-fx]) .blk.none{background:var(--shadow)}
:host(jam-kiosk) .blk .st,:host(jam-kiosk) .host.light .blk.none .st,:host(jam-kiosk) .blk.none .st{color:var(--dim)}
:host(jam-kiosk) .host .blk[data-state=off]{background:var(--slab);color:var(--fg)}
:host(jam-kiosk[data-fx]) .host .blk[data-state=off]{background:var(--shadow)}
:host(jam-kiosk) .host .blk[data-state=on]{background:var(--bc,var(--acc));color:var(--on-fg);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--on-fg) 14%,var(--bc,var(--acc)))}
:host(jam-kiosk[data-fx]) .host .blk[data-state=on]{background:var(--bc,var(--acc));box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
:host(jam-kiosk) .host .blk[data-state=on] .st{color:var(--on-fg)}
:host(jam-kiosk) .host .blk[data-state=action],:host(jam-kiosk[data-fx]) .host .blk[data-state=action]{background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none;
  box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--fg) 55%,transparent);color:var(--fg)}
/* The room field: one disc per dock block rising behind its tile, in the block's colour; bright while the block is on,
   dim when off; it changes only with the block's data-state (no motion). Flat discs without fx (the kiosks' setting), a
   soft blob under fx (the kiosk tiles skip the backdrop blur there, so the blob shows through them and the tile is no
   stacking context that would put the blob over its pane). At most 26-30% of the colour, so dim text over it stays
   >= 4.5:1. */
/* drawn as the spread of the box-shadow of a 2px round dot (a spread grows its corner radius with it, so it stays a circle): a shadow is ink overflow, so the disc never makes the tile or the
   dock scroll (the fit checks measure scroll sizes) */
:host(jam-kiosk) .blk::before{content:"";position:absolute;left:50%;top:30%;width:2px;height:2px;margin-left:-1px;border-radius:1px;z-index:-1;pointer-events:none;
  --gl-dc:color-mix(in oklab,var(--bc,var(--acc)) 9%,var(--primary-background-color,var(--ink)));box-shadow:0 -40px 0 min(130px,15cqw) var(--gl-dc)}
:host(jam-kiosk) .blk.none::before,:host(jam-kiosk) .blk[data-state=action]::before{display:none}
:host(jam-kiosk) .host .blk[data-state=on]::before{--gl-dc:color-mix(in oklab,var(--bc,var(--acc)) 26%,var(--primary-background-color,var(--ink)))}
:host(jam-kiosk[data-fx]) .blk::before{--gl-dc:color-mix(in srgb,var(--bc,var(--acc)) 12%,transparent);box-shadow:0 -40px 120px min(90px,11cqw) var(--gl-dc)}
:host(jam-kiosk[data-fx]) .host .blk[data-state=on]::before{--gl-dc:color-mix(in srgb,var(--bc,var(--acc)) 34%,transparent)}
:host(jam-kiosk) .blk:active,:host(jam-kiosk) .blk.stamp{background:var(--bc,var(--acc));color:var(--on-fg)}
:host(jam-kiosk) .blk:active .st,:host(jam-kiosk) .blk.stamp .st{color:var(--on-fg)}
:host(jam-kiosk) .blk:focus-visible{outline:3px solid var(--focus);outline-offset:-7px}
:host(jam-kiosk) .lk{--lk-bg:var(--slab2);--lk-gl:var(--fg)}
:host(jam-kiosk) .host.light .lk:not(.alert):not(.off){--lk-gl:var(--fg)}
:host(jam-kiosk) .lk .disc{box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-kiosk) .lk.alert{--lk-bg:var(--red);--lk-gl:var(--on-fg)}
/* ---------- motion: spring, one-shot ---------- */
@keyframes gl-enter{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
@keyframes gl-sheet{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}
@keyframes gl-fade{from{opacity:0}to{opacity:1}}
@keyframes gl-pop{0%{transform:scale(1)}45%{transform:scale(1.04)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.host > .paper > .face{transform:none!important;transition:none!important}}
/* ---------- jam-screensaver: the colour field, the thin clock, glass pills and an orb, now playing on a pane ---------- */
.ov{background:var(--primary-background-color,var(--ink));--sfg:var(--fg);--sdim:var(--dim)}
.ov::before{content:"";position:absolute;inset:0;pointer-events:none;background:${fieldBg(40, 42, 28)}}
.ov .img{background:var(--primary-background-color,var(--ink))}
.ov .kick{color:var(--sdim)}
.ov .temp{color:var(--sfg)}
.ov .time{letter-spacing:-.03em}
/* the layout's bars are left out (pills at the screen edge read as empty fields); its disc is a flat orb of the room
   colour, under fx lit from its centre with a soft halo (no specular highlight) */
.ov .sh.bar{display:none}
.ov .sh.dk{clip-path:none;border-radius:50%;background:color-mix(in oklab,var(--acc) 72%,var(--primary-background-color,var(--ink)))}
.ov[data-fx] .sh.dk{background:radial-gradient(circle,oklch(from var(--acc) .9 clamp(0,c,.09) h),oklch(from var(--acc) .8 clamp(0,c,.15) h) 70%);
  box-shadow:0 0 120px 10px oklch(from var(--acc) .8 clamp(0,c,.16) h / .45)}
.ov .poster,.ov .slides{z-index:1}
.ov .sdock .np{background:var(--slab);clip-path:none;border-radius:28px;box-shadow:inset 0 0 0 1px var(--line)}
.ov[data-fx] .sdock .np{${FROST}}
.ov .np .th{border-radius:18px}
.tchip{border-radius:24px}
`;

  /* Idle art: three soft orbs in the field colours on a slab2 pane (seeded places and sizes); blurred under fx. */
  function glIdle(sd) {
    const r = rng((sd >>> 0) ^ 0x2f6b9d1), box = el("div", "abs glidle");
    box.setAttribute("aria-hidden", "true");
    for (let k = 0; k < 3; k++) {
      const i = el("i"), st = i.style, size = 42 + r() * 34;
      st.left = (r() * (100 - size * .7)).toFixed(1) + "%"; st.top = (r() * (100 - size * .7)).toFixed(1) + "%";
      st.width = st.height = size.toFixed(1) + "%";
      st.background = `var(--jam-art-${1 + ((k + Math.floor(r() * 3)) % 3)})`;
      box.append(i);
    }
    return box;
  }

  registerLook({
    id: "glass",
    name: "Glass",
    fonts: [{family: "Figtree", weight: "300 700", file: "figtree-var-latin.woff2"}],
    css: CSS + `
.glidle{background:var(--slab2);overflow:hidden}
.glidle i{position:absolute;border-radius:50%;opacity:.55}
:host([data-fx]) .glidle i{filter:blur(18px);opacity:.8}
`,
    motifs: {idleArt: glIdle, flash() { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 1 1"); s.setAttribute("aria-hidden", "true"); return s; }},
  });
})();
