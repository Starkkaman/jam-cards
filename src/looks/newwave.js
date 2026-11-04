/* Look pack: New Wave (decided brief docs/looks/NEWWAVE.md, 2026-11-03). After April Greiman's Design Quarterly #133
   (1986) with a touch of Memphis: a desk of translucent tinted sheets, geometric confetti, early-Mac pixel type for numbers
   and labels, a sticker yellow for alerts. The theme ("Jam New Wave", tokens/looks/newwave.mjs) sets the palette, the 2px
   radius on every plane (no cut corners), Archivo 700 headings, Silkscreen numerals (jam-num-font), the motion and
   jam-fx: 1; this pack draws:
   - planes: every card face is a plane tinted by its room (the accent mixed into the plane, a pastel pair: peach ->
     yellow, mint <-> aqua, lavender <-> blue, pink -> lilac), with a 1px edge; keys are white / lavender planes, an active
     key / tab / scene is an ink block with a hard offset shadow in the room colour (the mockup's nav and buttons);
   - Silkscreen pixel caps for the small labels and the big numerals (the numerals come from the theme); strips are pixel
     segment bars;
   - jam-light on: the plane tinted with the light's colour (light colour -> a lighter mix), text in ink, the % in pixels;
   - confetti: one seeded shape per card (triangle, squiggle, ring, dot grid) under a corner of its plane, peeking out
     (and showing through the translucent plane under fx); seeded by the card's data-jam-seed (core, from its entity);
   - stickers: alerts / "needs you" (alert chips and keys, the jam-alerts rows, the failed-action strip is the terminal)
     in the sticker yellow, ok in mint; the screensaver's now-playing block is a mint sticker (yellow = needs you only);
   - the bands (jam-tv / jam-speaker text, music dock, error strip) are the terminal (jam-band tokens);
   - kiosk: a big pixel clock, dock blocks as tinted planes (no tilt, no confetti); screensaver: the pixel clock on the page
     ground with confetti (the four layout shapes) and, under fx, a soft light field that drifts with the time of day
     (--jam-ss-day from jam-screensaver, a one-shot 55 s transform transition per minute; no infinite animation).
   Effects (data-fx, the theme's jam-fx: 1; a card's `fx: false` turns them off, the kiosks' setting): translucent
   gradient planes, the soft plane shadow (jam-elev-1), the ±0.6° plane rotation (not on kiosk cards or in sheets), the
   tilt on press, backdrop blur on sheets, the turned now-playing sticker and the drifting screensaver light. With fx
   off (or reduced motion) the planes are flat, opaque and straight. Fonts: Archivo (variable 300-700, shared with Braun)
   and Silkscreen 400 / 700 (SIL OFL 1.1, latin subsets from Google Fonts) from <asset base>fonts/. */
(() => {
  /* Confetti shapes (24x24 masks; the colour comes from the background under the mask). */
  const mask = body => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${body}</svg>`)}")`;
  const SHAPES = {
    tri: mask("<path d='M12 2 23 22H1Z'/>"),
    squig: mask("<path d='M1.6 12c2.9-7.6 4.9-7.6 7.1 0s4.3 7.6 7 0 4.9-7.6 6.7 0' fill='none' stroke='#000' stroke-width='3.2' stroke-linecap='round'/>"),
    ring: mask("<circle cx='12' cy='12' r='9.3' fill='none' stroke='#000' stroke-width='3.2'/>"),
    dots: mask([3, 12, 21].flatMap(y => [3, 12, 21].map(x => `<circle cx='${x}' cy='${y}' r='2.3'/>`)).join("")),
  };
  const ORDER = ["tri", "squig", "ring", "dots"];
  /* Silkscreen's latin subset without the degree sign (its 3x3 pixel ring reads as an asterisk at label sizes): ° falls
     back to the stack's monospace face. */
  const PIXEL_RANGE = "U+0000-00AF, U+00B1-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212";
  /* Place per seed: the side the shape peeks out from under its plane and its height (a 26px box, 13px outside the edge,
     so it stays inside a 16px page margin and the inner half under the face padding). */
  const SPOTS = [["right:-13px", "top:12px"], ["left:-13px", "bottom:14px"], ["right:-13px", "bottom:16px"], ["left:-13px", "top:calc(50% - 13px)"],
    ["right:-13px", "top:calc(50% - 13px)"], ["left:-13px", "top:14px"]];
  const ROT = [-.6, .4, -.3, .6];
  /* Per seed (0..11): shape (seed % 4), spot (seed % 6), the shape's turn (<= 10deg) and the plane's tilt under fx. */
  const SEEDS = Array.from({length: 12}, (_, s) => {
    const [x, y] = SPOTS[s % 6], sh = ORDER[s % 4];
    return `:host([data-jam-seed="${s}"]) .host{--nw-rot:${ROT[(s * 7 + 1) % 4]}deg}
:host([data-jam-seed="${s}"]) .host > .paper[data-cut=card]:not(.kiosk)::before{${x};${y};-webkit-mask-image:${SHAPES[sh]};mask-image:${SHAPES[sh]};transform:rotate(${(s * 7) % 21 - 10}deg)}`;
  }).join("\n");
  /* Room pairs: the accent's partner hue for the plane gradient and the confetti (default: peach -> pink; audit 2026-11-03:
     the sticker yellow is kept for "needs you" only). */
  const PAIRS = [["teal", "green"], ["green", "teal"], ["blue", "violet"], ["pink", "violet"], ["violet", "blue"], ["red", "pink"], ["ink", "violet"], ["paper", "violet"]]
    .map(([a, b]) => `[style*="--acc: var(--${a})"]{--nw-t2:var(--${b})}`).join(" ");

  const CSS = `
/* ---------- plane variables ---------- */
.host{--nw-t2:var(--pink);--nw-plane:color-mix(in srgb,var(--slab) 58%,transparent);--nw-rot:0deg}
${PAIRS}
/* ---------- planes: card / hero faces tinted by the room; flat and opaque without fx ---------- */
.host > .paper[data-cut=card] > .face,.host > .paper[data-cut=hero] > .face,.host > .paper.btn > .face{
  background:color-mix(in oklch,var(--acc) 22%,var(--slab));color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
:host([data-fx]) .host > .paper[data-cut=card] > .face,:host([data-fx]) .host > .paper[data-cut=hero] > .face,:host([data-fx]) .host > .paper.btn > .face{
  background:linear-gradient(140deg,color-mix(in oklch,var(--acc) 30%,var(--nw-plane)),color-mix(in oklch,var(--nw-t2) 22%,var(--nw-plane)));
  box-shadow:var(--jam-elev-1,none)}
/* An offline jam-dial is the plain plane: no room tint, no lit gradient. */
.host > .paper.dl.dead[data-cut] > .face,:host([data-fx]) .host > .paper.dl.dead[data-cut] > .face{background:var(--slab)}
/* Tilt: ±0.6° per plane under fx (the face turns, not the paper, so the confetti stays under every plane; not kiosk cards,
   not in sheets, not with reduced motion). */
:host([data-fx]) .host > .paper[data-cut=card]:not(.kiosk) > .face,:host([data-fx]) .host > .paper[data-cut=hero] > .face,
:host([data-fx]) .host > .paper.btn > .face{transform:rotate(var(--nw-rot))}
:host-context(.pop) .host > .paper > .face{transform:none!important}
/* Confetti: one seeded shape (triangle, squiggle, ring, dot grid) peeking out from under the plane. .host is the card's
   stacking context (the paper is not), so z-index -1 puts the shape under the card's own face: it shows in the gap or
   margin beside the card (and through the translucent plane under fx), never over the card's content. */
.host{isolation:isolate}
.host > .paper[data-cut=card]:not(.kiosk)::before{content:"";position:absolute;z-index:-1;width:26px;height:26px;pointer-events:none;
  background:color-mix(in oklch,var(--nw-t2) 70%,var(--acc));
  -webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}
:host-context(.pop) .host > .paper::before{display:none}
${SEEDS}
/* Offline (state grammar, audit 2026-11-03): a 45deg pixel hatch of the plane (6px / 2px), dim text, no tint, no tilt. */
.host > .paper[data-cut] > .face.unavail,:host([data-fx]) .host > .paper[data-cut] > .face.unavail{
  background:repeating-linear-gradient(45deg,var(--slab) 0 6px,var(--slab2) 6px 8px);color:var(--dim);border:0;box-shadow:inset 0 0 0 1px var(--dim);transform:none}
.tmk.t-offline{--tc:var(--slab);box-shadow:inset 0 0 0 2px var(--dim)}
/* ---------- type: pixel caps for labels, pixel numerals (theme), Archivo headings ---------- */
.label,.kick,.sub,.st,:host(jam-tile) .name,.lb,.kk,.grp,.here,.ns,.cap,.now,.lg button,.small,.lk .lbl,.per,.unit,.tmk + span{font-family:"Silkscreen","Courier New",monospace;font-weight:400}
/* words in a numeral slot (a gauge's "Unavailable") stay in the display face */
.big.un{font-family:var(--display)}
.num,.pct,.big,.cur,.time,.temp,.otemp,.hi,.lo,.clock,.tt,.vn,.v{font-variant-numeric:tabular-nums}
/* ---------- keys: white planes with an edge; active = an ink block with a hard shadow in the room colour ---------- */
.key > .face{background:var(--slab);color:var(--fg);border:0;box-shadow:inset 0 0 0 1px var(--line)}
.key:not(:disabled):hover > .face{box-shadow:inset 0 0 0 2px var(--fg)}
.key.on > .face,.ikey.main > .face{background:var(--fg);color:var(--slab);box-shadow:3px 3px 0 var(--acc)}
.key.alert > .face{background:var(--jam-art-6);color:var(--on-fg);box-shadow:3px 3px 0 var(--red)}
/* Power keys (remote / TV) are an action, not an alert: an ink block with a red offset (audit: yellow means "needs you"). */
:host(jam-remote) .key.alert > .face,:host(jam-tv) .key.alert > .face{background:var(--fg);color:var(--slab);box-shadow:3px 3px 0 var(--red)}
.key:disabled > .face{color:var(--dim)}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:var(--slab2);color:var(--dim);box-shadow:none}
button.chip::before{box-shadow:inset 0 0 0 1px var(--line)}
.chip{--chip-bg:var(--slab)}
/* stickers: alert / home / hot chips in the sticker yellow (alert) and mint (ok), ink text */
.chip.red{--chip-bg:var(--jam-art-6);color:var(--on-fg)}
.chip.home{--chip-bg:var(--jam-art-8);color:var(--on-fg)}
.chip.hot{--chip-bg:var(--jam-art-6);color:var(--on-fg)}
.cnt{background:var(--jam-art-6);color:var(--on-fg)}
/* ---------- strips: pixel segment bars ---------- */
.strip{inset:10px 0;background:var(--slab2)}
.fill{-webkit-mask:repeating-linear-gradient(90deg,#000 0 6px,transparent 6px 8px);mask:repeating-linear-gradient(90deg,#000 0 6px,transparent 6px 8px)}
.track[role=slider] .fill::after,.vt[role=slider] .fill::after{content:"";position:absolute;right:0;top:-4px;bottom:-4px;width:6px;background:var(--fg)}
/* ---------- tone marks: square pixels; stripes ---------- */
.tmk{width:8px;height:8px}
/* ---------- power: a 30px square top-right; on = ink block with the room-colour shadow ---------- */
.pw .tri{inset:8px 8px auto auto;width:30px;height:30px;background:var(--slab);box-shadow:inset 0 0 0 1.5px var(--fg)}
.pw svg{right:15px;top:15px;width:16px;height:16px;color:var(--fg)}
.pw[aria-pressed=true] .tri{background:var(--fg);box-shadow:3px 3px 0 var(--nw-pw,var(--acc))}
.pw[aria-pressed=true] svg{color:var(--slab)}
.pw:disabled .tri{background:var(--slab2);box-shadow:none} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-6px}
:host(jam-tv) .pw{background:none;color:var(--slab)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:8px;top:8px;width:30px;height:30px;background:var(--fg);box-shadow:3px 3px 0 var(--acc)}
:host(jam-tv) .pw.off{color:var(--fg)} :host(jam-tv) .pw.off::before{background:var(--slab);box-shadow:inset 0 0 0 1.5px var(--fg)}
:host(jam-tv) .pw svg{right:15px;top:15px;width:16px;height:16px}
:host(jam-tv) .kiosk .pw::before{right:12px;top:12px;width:48px;height:48px}
:host(jam-tv) .kiosk .pw svg{right:24px;top:24px;width:24px;height:24px}
/* ---------- jam-light: a lit light is a bright plane in its own colour (mixed into the page white, in both modes: a lit
   sheet on the desk), ink text, the % in pixels; off = the room plane ---------- */
.host > .paper.lc.on > .face{background:color-mix(in srgb,var(--lc) 48%,var(--ink-fg));color:var(--on-fg);--nw-pw:var(--lc)}
/* (specificity above the room plane rules) */
:host([data-fx]) .host > .paper.lc.on > .face{background:linear-gradient(150deg,color-mix(in srgb,var(--lc) 48%,var(--ink-fg)),color-mix(in srgb,var(--lc) 16%,var(--ink-fg)))}
.lc.on .sub,.lc.on .pct,.lc.on .nm{color:var(--on-fg)}
/* The "%" (and Off / Offline) in Archivo: Silkscreen's % at this size reads as a "z" (audit 2026-11-03). */
.pct small{font-family:var(--display);font-weight:700;font-size:max(13px,.62em)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:var(--on-fg)}
.lc.on .pw .tri{background:var(--ink-fg);box-shadow:inset 0 0 0 1.5px var(--on-fg)} .lc.on .pw svg{color:var(--on-fg)}
.lc.on .pw[aria-pressed=true] .tri{background:var(--on-fg);box-shadow:3px 3px 0 var(--lc)} .lc.on .pw[aria-pressed=true] svg{color:var(--ink-fg)}
.lc.on .bs{background:color-mix(in srgb,var(--on-fg) 14%,transparent)}
.lc .bs{left:14px;right:14px;bottom:10px;height:8px;background:var(--slab2)}
.lc .bs i{background:var(--lc);-webkit-mask:repeating-linear-gradient(90deg,#000 0 6px,transparent 6px 8px);mask:repeating-linear-gradient(90deg,#000 0 6px,transparent 6px 8px)}
.lc .bands{top:48px;bottom:22px;right:8px;width:30px;gap:2px;padding:0;background:none}
.lc .bands i{box-shadow:inset 0 0 0 1px var(--on-fg)}
.lc.on .tap{padding-right:48px}
/* light pop-up presets keep their plates */
.wp b{background:var(--plate);color:var(--plate-fg);padding:3px 6px 4px;right:auto;max-width:calc(100% - 16px)}
/* ---------- jam-button: plane tile; on = ink block ---------- */
.host > .paper.btn > .kf.on,:host([data-fx]) .host > .paper.btn > .kf.on{background:var(--fg);color:var(--slab);box-shadow:3px 3px 0 var(--acc)}
/* (the fx plane rule above is (0,6,0): the lit key must outrank it, else its label is ink on the plane) */
.kf.on .st{color:var(--slab)}
.kf .sq{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--fg)}
.kf.on .sq{background:var(--acc);color:var(--on-fg);box-shadow:none}
.kf.on .pw .tri{background:var(--slab);box-shadow:none} .kf.on .pw svg{color:var(--fg)}
.kf.on .pw[aria-pressed=true] .tri{background:var(--slab);box-shadow:3px 3px 0 var(--acc)}
/* ---------- jam-tabs / jam-scenes ---------- */
.tab{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
.tab.on{background:var(--fg);color:var(--slab);box-shadow:3px 3px 0 var(--acc)}
.tab.on::after{background:var(--acc)}
.scene > .sf{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
.scene.on > .sf{background:var(--fg);color:var(--slab);box-shadow:3px 3px 0 var(--acc)}
.scene.jam-stamp > .sf::before{content:none}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}
.jam-wash{display:none}
/* ---------- media / tv / speaker art: covers as they are; empty art on a lavender plane ---------- */
.art img{filter:none;mix-blend-mode:normal}
:host(jam-media) .art > .face,:host(jam-tv) .poster > .face,:host(jam-speaker) .poster > .face{background:var(--slab2);color:var(--fg)}
:host(jam-media) .art.paused > .face{background:var(--slab3)}
/* volume rocker: its violet keys with plane gaps; outlined keys (jam-remote / jam-tv) are plain plane keys */
.rock > .face{background:none;gap:4px}
.rock .key:focus-visible{outline-color:var(--focus)}
.ol > .face{background:var(--slab)} .ol > .face::before{content:none} .ol.on > .face{background:var(--fg);color:var(--slab)}
.pad .ok > .face{background:var(--fg);color:var(--slab)}
/* ---------- the terminal: failed-action strip ---------- */
.jam-err{border-left:var(--stripe-w) solid var(--red);box-shadow:4px 4px 0 var(--jam-art-6)}
/* ---------- sheets: a translucent, blurred plane under fx ---------- */
:host([data-fx]) .pop .sheet > .face,.pop[data-fx] .sheet > .face{background:color-mix(in srgb,var(--slab) 80%,transparent);
  -webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:var(--jam-elev-1,none)}
.veil{opacity:.45}
.t .label{color:var(--dim)}
/* ---------- jam-kiosk: pixel clock, dock blocks = tinted planes (no tilt) ---------- */
:host(jam-kiosk) .k .bar{height:6px;background:var(--acc);-webkit-mask:repeating-linear-gradient(90deg,#000 0 10px,transparent 10px 14px);mask:repeating-linear-gradient(90deg,#000 0 10px,transparent 10px 14px)}
:host(jam-kiosk) .clock{font-weight:400;font-size:calc(clamp(96px,min(19cqw,31cqh),200px) * .8)} /* the big pixel clock */
.kv .vn{font-size:20px} /* K1 volume number: Silkscreen at the kiosk floor */
:host(jam-kiosk) .blk{background:color-mix(in oklch,var(--bc,var(--acc)) 30%,var(--slab));color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
:host([data-fx]) .blk{background:linear-gradient(140deg,color-mix(in oklch,var(--bc,var(--acc)) 38%,var(--nw-plane)),color-mix(in oklch,var(--bc,var(--acc)) 14%,var(--nw-plane)));box-shadow:var(--jam-elev-1,none)}
:host(jam-kiosk) .host .blk.none{--bc:var(--violet)}
:host(jam-kiosk) .blk .st,:host(jam-kiosk) .host.light .blk.none .st{color:var(--fg)}
:host(jam-kiosk) .blk:active,:host(jam-kiosk) .blk.stamp{background:var(--fg);color:var(--slab)}
:host(jam-kiosk) .blk:active .st,:host(jam-kiosk) .blk.stamp .st{color:var(--slab)}
:host(jam-kiosk) .blk:focus-visible{outline:3px solid var(--focus);outline-offset:-7px}
/* The lock: locked = a quiet plane with an ink ring (core --lk-ring); unlocked = the sticker (yellow, ink edge, red offset). */
:host(jam-kiosk) .lk{--lk-bg:var(--slab);--lk-gl:var(--fg)}
:host(jam-kiosk) .lk .disc{border-radius:2px}
:host(jam-kiosk) .lk.alert{--lk-bg:var(--jam-art-6);--lk-gl:var(--on-fg)}
:host(jam-kiosk) .lk.alert .disc{box-shadow:inset 0 0 0 4px var(--on-fg),8px 8px 0 var(--red)}
/* ---------- motion ---------- */
@keyframes nw-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes nw-sheet{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes nw-fade{from{opacity:0}to{opacity:1}}
@keyframes nw-pop{0%{transform:scale(1)}50%{transform:scale(1.04)}to{transform:none}}
/* stickers pop in 160 ms (the stamps: scenes, kiosk dock / lock, On now) */
.jam-stamp,.blk.stamp,.lk .disc.stamp{animation-duration:calc(160ms * var(--dur))}
/* Tilt on press (fx): the plane tips towards the finger. */
:host([data-fx]) .host,.pop[data-fx]{--press-from:rotate(var(--nw-rot,0deg)) perspective(700px) rotateX(6deg) rotateY(-7deg) scale(.98);--press:rotate(var(--nw-rot,0deg)) perspective(700px) rotateX(6deg) rotateY(-7deg) scale(.98)}
@media (prefers-reduced-motion:reduce){.host > .paper > .face{transform:none!important}
  :host([data-fx]) .host,.pop[data-fx]{--press-from:none;--press:none}}
/* ---------- jam-screensaver: the page ground, pixel clock, confetti; a drifting light field under fx ---------- */
.ov{background:var(--primary-background-color,var(--slab));--sfg:var(--fg);--sdim:var(--dim)}
.ov .img{background:var(--primary-background-color,var(--slab))}
.ov .kick{color:var(--fg)}
.ov .temp{color:var(--sfg)}
.ov .time,.ov .tchip .tt{font-weight:400}
.ov .sh.nwc{background:var(--nw-c);-webkit-mask:var(--nw-m) center/contain no-repeat;mask:var(--nw-m) center/contain no-repeat;clip-path:none}
.ov .sh.nwc.b1{width:16vh!important;height:16vh!important} .ov .sh.nwc.b2{width:11vh!important;height:6vh!important}
.ov .sh.nwc.b3{width:12vh!important;height:12vh!important} .ov .sh.nwc.dk{width:20vh!important;height:20vh!important}
.ov .sh.nwc{margin:4vh 3vw} /* off the screen edge (the layouts anchor their bars at 0) */
.l0 .sh.nwc.b3,.l2 .sh.nwc.b3,.l3 .sh.nwc.b3,.l4 .sh.nwc.b3{display:none} /* b3 is placed only in l1 / l5 */
.ov::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(42vmax 36vmax at 20% 15%,color-mix(in srgb,var(--jam-art-5) 22%,transparent),transparent 70%),
    radial-gradient(40vmax 34vmax at 85% 90%,color-mix(in srgb,var(--jam-art-1) 18%,transparent),transparent 70%)}
.ov[data-fx]::before{inset:-30vmax;
  background:radial-gradient(38vmax 34vmax at 50% 50%,color-mix(in srgb,var(--nw-sun) 58%,transparent),transparent 72%),
    radial-gradient(44vmax 38vmax at 80% 85%,color-mix(in srgb,var(--nw-sky) 34%,transparent),transparent 70%);
  --nw-d:var(--jam-ss-day,.5);
  --nw-sun:color-mix(in oklch,oklch(.86 .14 calc(40deg + var(--nw-d) * 360deg)) 60%,var(--slab));
  --nw-sky:color-mix(in oklch,oklch(.8 .11 calc(260deg + var(--nw-d) * 240deg)) 60%,var(--slab));
  transform:translate(calc((var(--nw-d) - .5) * 70vw),calc(cos(var(--nw-d) * 360deg) * 18vh));transition:transform 55s linear}
.ov .poster,.ov .slides{z-index:1}
/* now playing = a sticker: the yellow backing grows around the block as a box-shadow spread (the block keeps Poster's box
   for the fit checks), with a hard offset in the text colour; under fx it is turned by 2deg and the offset softens. */
.ov .np{position:relative;background:var(--jam-art-8);box-shadow:0 0 0 14px var(--jam-art-8),9px 9px 0 14px var(--fg)}
.ov[data-fx] .np{transform:rotate(-2deg);box-shadow:0 0 0 14px var(--jam-art-8),12px 14px 0 14px color-mix(in srgb,var(--fg) 30%,transparent)}
.ov .np .nb,.ov .np .ns,.ov .np .kick{color:var(--on-fg)}
.ov .sdock .np{background:none;clip-path:none}
.ov .time small,.ov .tchip small{font-size:max(18px,.14em)}
.tchip{background:var(--fg);color:var(--slab);clip-path:none;box-shadow:4px 4px 0 var(--acc)}
.tchip small{color:var(--slab)}
@media (prefers-reduced-motion:reduce){.ov[data-fx]::before{transition:none}}
`;

  /* Screensaver motif: four confetti shapes (triangle, ring, dot grid, squiggle) in the layout's b1 / b2 / b3 / dk boxes
     (Poster's node count and order, so the layouts place them), coloured from the confetti palette. */
  function nwConfetti() {
    return [["b1 bar", "tri", 1], ["b2 bar", "squig", 5], ["b3 bar", "dots", 2], ["dk disc", "ring", 4]].map(([k, sh, c]) => {
      const s = el("div", "sh nwc " + k); s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--nw-m", SHAPES[sh]); s.style.setProperty("--nw-c", `var(--jam-art-${c})`);
      return s;
    });
  }
  /* Golden Arm placeholder: the seeded bars as pixel stacks in the confetti colours. */
  function nwBars(key) {
    const box = this.poster(key), s = typeof key === "number" ? key >>> 0 : seed(key);
    [...box.children].forEach((b, i) => { b.style.background = `var(--jam-art-${[1, 2, 3, 4, 5][(s + i) % 5]})`; });
    box.classList.add("nwbars");
    return box;
  }
  /* Idle art: a confetti still life on a pale plane (seeded: three shapes, sizes, places, colours). */
  function nwIdle(sd) {
    const r = rng((sd >>> 0) ^ 0x5bd1e995), box = el("div", "abs nwidle");
    box.setAttribute("aria-hidden", "true");
    const used = new Set();
    for (let k = 0; k < 4; k++) {
      let sh; do sh = ORDER[Math.floor(r() * 4)]; while (used.has(sh) && used.size < 4);
      used.add(sh);
      const i = el("i"), st = i.style, size = 28 + r() * 34;
      st.left = (6 + r() * (88 - size * .6)).toFixed(1) + "%"; st.top = (6 + r() * (88 - size * .6)).toFixed(1) + "%";
      st.width = size.toFixed(1) + "%"; st.height = (sh === "squig" ? size * .45 : size).toFixed(1) + "%";
      st.setProperty("--nw-m", SHAPES[sh]); st.background = `var(--jam-art-${1 + Math.floor(r() * 5)})`;
      st.transform = `rotate(${Math.round(r() * 60 - 30)}deg)`;
      box.append(i);
    }
    return box;
  }
  /* Power glyph: the Poster sign, a 2.5px square stroke (pixel weight). */
  function nwPower() {
    const svg = this.poster();
    svg.setAttribute("stroke-width", "2.5"); svg.setAttribute("stroke-linecap", "square");
    return svg;
  }

  registerLook({
    id: "newwave",
    name: "New Wave",
    fonts: [
      {family: "Archivo", weight: "300 700", file: "archivo-var-latin.woff2"},
      {family: "Silkscreen", weight: "400", file: "silkscreen-400-latin.woff2", range: PIXEL_RANGE},
      {family: "Silkscreen", weight: "700", file: "silkscreen-700-latin.woff2", range: PIXEL_RANGE},
    ],
    css: CSS + `
.nwidle{background:var(--slab2);overflow:hidden}
.nwidle i{position:absolute;-webkit-mask:var(--nw-m) center/contain no-repeat;mask:var(--nw-m) center/contain no-repeat}
`,
    motifs: {empty: nwBars, idleArt: nwIdle, powerGlyph: nwPower, flash() { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 1 1"); s.setAttribute("aria-hidden", "true"); return s; }, screensaver: nwConfetti},
  });
})();
