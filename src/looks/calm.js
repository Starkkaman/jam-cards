/* Look pack: Calm ("Jam Calm", 2026-11-06). The calm-instrument look of Jam Design pass 6 + 7 (jam-design
   mockups/pass7/home-assistant.html on top of mockups/pass6/home-assistant.html; HANDOFF.md, Isaac: "This design looks much
   better!" and "Try to replicate their cards as faithfully as you can"). Callsheet paper and navy, Jost words + IBM Plex
   Mono labels and numbers, flat panels with hairline edges and soft corners, no shadows or glow, one orange per screen (the
   thing to do now: Pause where something plays, Lock by day), red = alert, state = colour + shape + word.
   Unlike the other packs (a skin over the cards' DOM), Calm draws the cards it knows in the mockup's own layouts through the
   whole-card look hook `render` (core): jam-light (name row + rocker or small switch + vertical fader), jam-tile /
   jam-button on switches (name row + POWER + small switch), jam-fan (the purifier: grille, seven-segment readout, small
   switch, speed keys), jam-scenes (pills), jam-house (the house strip), jam-heading (room head), jam-tv (TV card + TV /
   Source pop-up + the round 5 remote pop-up), jam-speaker (grille face + fader + speaker pop-up with group or split),
   jam-media compact (the PC row) and jam-kiosk (clock, door, three keys; full-screen sheets that never scroll). Any other
   card renders as usual under the pack CSS. Every other look renders exactly as before (Poster's render hook is false).
   Tokens: tokens/looks/calm.mjs (theme "Jam Calm"). Fonts: Jost (bundled, plus a URL face for weight 300: the kiosk clock
   and big temperatures) and IBM Plex Mono 400 / 500 / 600 (IBM's own Latin1 woff2 files, unmodified, SIL OFL 1.1 with the
   Reserved Font Name "Plex": dist/fonts/OFL-IBMPlexMono.txt).
   Faders (Isaac: "the faders ... have been needing serious work"): a flat groove with a hairline, the fill in the lamp's
   own colour (cream for volume), a flat cap with a 1.5px ink rim; the number shows on the cap while dragging (always on
   kiosks). Drag anywhere on the track (the cap jumps to the finger), arrow keys / Page keys / Home / End; the value shows at
   once, the entity follows at most every 300 ms while dragging and once more on release (no flood of calls); a card does
   not redraw under a drag (its state update waits for the release). */
(() => {
  const MONO = '"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace';
  /* Calm's own class names carry a "c-" prefix in the DOM and the CSS (the cards' own sheets stay adopted next to the pack,
     and their .k / .dock / .lc / .src ... must never reach a Calm node). C("a b") -> "c-a c-b"; ce = el with C. */
  const CM_NAMES = new Set("afc akeys al alert an aname appl asub away bh big blk cc cg chev chips3 clk clt cm cmb cmp conf cp cw d dash dis dock dpad dr dw dz echo engr f fl gh gr grille hf hs hue ic ind inp irlens k k2 k3 kalloff kcol kdoor kdt kh khome kio klock kmed kp2 kplace kspk kt ktop ktv l lab lc led lg lit lr lst mc mem mini msub mtitle nm note np o ofl ofx og okk on open or pb pcrow pd-off pd-on pn ppl prog pt ptag pwg pwr quiet r rc red rem remote rg rh rk rk3 rk4 rkey ro rock-off rock-on round rt s sc scn seam seg7 sg sm solo sq src srt static sum sumh swin swrow tab tg tp tx u vf vrow vsteps w warn wd wh wide xl yc".split(" "));
  const C = s => String(s).split(/\s+/).filter(Boolean).map(n => (CM_NAMES.has(n) ? "c-" + n : n)).join(" ");
  const ce = (tag, cls, text) => el(tag, cls ? C(cls) : cls, text);
  const cmark = m => String(m).replace(/class="([^"]+)"/g, (x, k) => `class="${C(k)}"`);
  /* ---------- glyphs (the mockup's own drawings; static markup only, never entity data) ---------- */
  const IC = {pwr: '<path d="M8 2v6M4.5 4.5a5 5 0 1 0 7 0"/>',
    prev: '<path class="f" d="M3 2h2v12H3zM14 2v12L6 8z"/>', play: '<path class="f" d="M4 2l10 6-10 6z"/>', pause: '<path class="f" d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z"/>',
    next: '<path class="f" d="M11 2h2v12h-2zM2 2v12l8-6z"/>', rew: '<path class="f" d="M8 3v10L1 8zM15 3v10L8 8z"/>', ff: '<path class="f" d="M8 3v10l7-5zM1 3v10l7-5z"/>',
    home: '<path d="M2 8l6-5 6 5M4 7v6h8V7"/>', spk: '<rect x="3" y="1.5" width="10" height="13" rx="2"/><circle cx="8" cy="9.5" r="2.5"/><path d="M8 4.5h.01"/>',
    remote: '<rect x="5" y="1.5" width="6" height="13" rx="2"/><path d="M8 4.5h.01M8 8h.01"/>',
    grid: '<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
    minus: '<path d="M3 8h10"/>', plus: '<path d="M3 8h10M8 3v10"/>', mute: '<path d="M2 6h3l4-3v10l-4-3H2zM11 6l4 4M15 6l-4 4"/>',
    back: '<path d="M6 4L2 8l4 4M2 8h9a3 3 0 0 1 0 6"/>', menu: '<path d="M3 4h10M3 8h10M3 12h10"/>',
    set: '<circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>',
    moon: '<path d="M13 10.5A6 6 0 0 1 5.5 3a6 6 0 1 0 7.5 7.5z"/>', lock: '<rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>',
    kb: '<rect x="1.5" y="4" width="13" height="8" rx="1.5"/><path d="M4 7h.01M6.5 7h.01M9 7h.01M11.5 7h.01M5 9.5h6"/>',
    up: '<path class="f" d="M8 3l6 8H2z"/>', down: '<path class="f" d="M8 13L2 5h12z"/>', left: '<path class="f" d="M3 8l8-6v12z"/>', right: '<path class="f" d="M13 8L5 2v12z"/>',
    lib: '<path d="M2.5 2.5v11M5.5 2.5v11M8.5 3l3.5 10.5"/>'};
  const OG = {tree: '<path d="M15 4l7 9h-4l5 7H7l5-7H8z"/><path d="M15 20v6"/>',
    fan: '<circle cx="15" cy="13" r="2"/><path d="M15 11c0-4 1.5-6.5 4-6.5s2.5 4-4 6.5zM17 13c4 0 6.5 1.5 6.5 4s-4 2.5-6.5-4zM15 15c0 4-1.5 6.5-4 6.5s-2.5-4 4-6.5zM13 13c-4 0-6.5-1.5-6.5-4s4-2.5 6.5 4z"/><path d="M15 21v5M11 26h19"/>',
    tv: '<rect x="3" y="6" width="24" height="15" rx="2"/><path d="M11 25h8M15 21v4"/>', spk: '<rect x="8" y="3" width="14" height="24" rx="3"/><circle cx="15" cy="17" r="4.5"/><path d="M15 8h.01"/>',
    pc: '<rect x="4" y="5" width="22" height="14" rx="2"/><path d="M10 25h10M15 19v6"/>', air: '<rect x="7" y="3" width="16" height="24" rx="3"/><path d="M11 8h8M11 11h8M11 14h8"/><circle cx="15" cy="21" r="2.5"/>',
    off: '<path d="M15 4v9"/><path d="M9.3 8.2a9 9 0 1 0 11.4 0"/>', plug: '<path d="M11 4v6M19 4v6M8 10h14v5a7 7 0 0 1-14 0zM15 22v5"/>',
    drop: '<path d="M15 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z"/>', auto: '<circle cx="15" cy="15" r="10"/><path d="M15 9v6l4 3"/>'};
  OG.fan = OG.fan.replace("M11 26h19", "M11 26h8");
  const LGL = {floor: '<path class="s" d="M10 4h10l3 9H7z"/><path class="o" d="M15 13v13M10 26h10"/>',
    table: '<path class="s" d="M9 6h12l3 9H6z"/><path class="o" d="M13 15h4v7h-4zM9 25h12"/>',
    strip: '<rect class="s" x="3" y="12" width="24" height="7" rx="3.5"/><path class="o" d="M7 22v3M23 22v3"/>',
    pendant: '<path class="o" d="M15 2v8"/><path class="s" d="M6 20a9 9 0 0 1 18 0z"/><path class="o" d="M12 23h6"/>',
    bulb: '<path class="s" d="M15 4a7 7 0 0 1 4 12.7V19h-8v-2.3A7 7 0 0 1 15 4z"/><path class="o" d="M11.5 22h7M12.5 25h5"/>',
    string: '<path class="o" d="M2 8c6 6 20 6 26 0"/><circle class="s" cx="7" cy="14" r="3"/><circle class="s" cx="15" cy="16" r="3"/><circle class="s" cx="23" cy="14" r="3"/>',
    lantern: '<path class="o" d="M4 6h6v18H4zM10 10h3"/><rect class="s" x="13" y="7" width="11" height="15" rx="2"/><path class="o" d="M18.5 4v3"/>'};
  const svg = (inner, cls, vb) => { const s = ce("span");
    s.innerHTML = `<svg class="${C("cg" + (cls ? " " + cls : ""))}" viewBox="0 0 ${vb || 16} ${vb || 16}" aria-hidden="true" focusable="false">${cmark(inner)}</svg>`; return s.firstChild; }; // static markup
  const ic = (name, cls) => svg(IC[name] || "", "ic" + (cls ? " " + cls : ""), 16);
  const og = (name, cls) => svg(OG[name] || OG.plug, "og" + (cls ? " " + cls : ""), 30);
  const lamp = (kind, on, color) => { const g = svg(LGL[kind] || LGL.table, "lg" + (on ? " on" : ""), 30); if (color) g.style.setProperty("--lc", color); return g; };

  /* ---------- colour helpers ---------- */
  const hex = c => "#" + c.slice(0, 3).map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  function oklab(c) {
    const [r, g, b] = c.map(lin);
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b),
      s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
  }
  const okd = (x, y) => { const A = oklab(x), B = oklab(y); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  const ORANGES = [[236, 124, 34], [240, 138, 44]], CREAM = [243, 230, 200];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  /* A lamp colour as drawn (mockup "guard"): pulled towards cream until it stands >= .15 (OKLab) from the control orange,
     so a lamp never reads as "the one thing to do". Whites (colour temperature) use the mockup's white swatches. */
  const WHITES = [[2200, [244, 202, 138]], [2700, [244, 216, 164]], [3500, [242, 228, 198]], [4000, [239, 235, 225]], [5000, [219, 230, 249]]];
  function whiteOf(k) {
    k = Number(k) || 2700;
    if (k <= WHITES[0][0]) return WHITES[0][1];
    for (let i = 1; i < WHITES.length; i++) if (k <= WHITES[i][0]) { const [k0, a] = WHITES[i - 1], [k1, b] = WHITES[i]; return mix(a, b, (k - k0) / (k1 - k0)); }
    return WHITES[WHITES.length - 1][1];
  }
  function guard(c) {
    let x = c;
    for (let t = 0; t <= 1.0001; t += .05) { x = mix(c, CREAM, t); if (Math.min(...ORANGES.map(o => okd(x, o))) >= .15) break; }
    return x;
  }
  /* The lamp's drawn colour [r,g,b] for a light state (null = cream: on without a colour). */
  function lampRgb(s) {
    const a = (s && s.attributes) || {};
    if (a.color_mode === "color_temp" && a.color_temp_kelvin) return whiteOf(a.color_temp_kelvin);
    const f = fullRgb(lightRgb(s));
    if (!f) return a.color_temp_kelvin ? whiteOf(a.color_temp_kelvin) : null;
    return guard(f);
  }
  /* Night (dark mode) from the card face: the theme's dark mode is a dark panel. */
  function isNight(node) {
    try { const c = parseRgb(getComputedStyle(node).getPropertyValue("--jam-slab").trim()); return !!c && luminance(c) < .3; } catch (e) { return false; }
  }
  const cssRgb = c => (c ? rgbCss(c) : "var(--ccream)");

  /* ---------- words ---------- */
  const lc = s => String(s || "").toLowerCase();
  function clock(d, h) {
    const f = typeof jamWxTime === "function" ? jamWxTime(h) : {h12: true};
    const hh = d.getHours(), mm = String(d.getMinutes()).padStart(2, "0");
    return f.h12 ? `${hh % 12 || 12}:${mm} ${hh < 12 ? "am" : "pm"}` : `${String(hh).padStart(2, "0")}:${mm}`;
  }
  /* "since 9:12 am" / "since yesterday" / "since Monday" for an entity's last change. */
  function since(s, h) {
    const t = s && Date.parse(s.last_changed || "");
    if (!t) return "";
    const d = new Date(t), now = new Date(), day = 864e5, d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (t >= d0) return clock(d, h);
    if (t >= d0 - day) return "yesterday";
    if (t >= d0 - 6 * day) { try { return d.toLocaleDateString((h && h.language) || undefined, {weekday: "long"}); } catch (e) { return d.toDateString(); } }
    try { return d.toLocaleDateString((h && h.language) || undefined, {month: "short", day: "numeric"}); } catch (e) { return d.toDateString(); }
  }
  const dead = s => !s || UNAVAILABLE.has(s.state);
  /* Night for the door rule (round 5, conflict 12): sun.sun below the horizon, else 19:00-07:00. */
  function dark(h) {
    const sun = stateObj(h, "sun.sun");
    if (sun && !dead(sun)) return sun.state === "below_horizon";
    const hr = new Date().getHours(); return hr >= 19 || hr < 7;
  }
  function area(h, id) {
    const e = h && h.entities && h.entities[id];
    let a = e && e.area_id;
    if (!a && e && e.device_id && h.devices && h.devices[e.device_id]) a = h.devices[e.device_id].area_id;
    return a && h.areas && h.areas[a] ? h.areas[a].name : "";
  }

  /* ---------- parts ---------- */
  /* Flat key (.k): label + optional glyph (left); cls: "or" (the one action), "red" (alert), "wide", "big", "ic" (glyph only). */
  function key(label, glyph, run, o = {}) {
    const b = ce("button", "k" + (o.cls ? " " + o.cls : ""));
    b.type = "button";
    if (glyph) b.append(ic(glyph));
    if (label) b.append(ce("span", "kl", label));
    if (o.aria || !label) b.setAttribute("aria-label", o.aria || label || glyph);
    if (o.pressed != null) b.setAttribute("aria-pressed", String(!!o.pressed));
    if (o.key) b.dataset.key = o.key;
    if (o.disabled) b.disabled = true;
    if (run) b.addEventListener("click", e => { e.stopPropagation(); run(e); });
    return b;
  }
  /* The name row of every card: symbol, name, state word, › (a button when it opens something). */
  function nameRow({glyph, name, word, wordCls, open, label}) {
    const r = ce(open ? "button" : "div", "pn" + (open ? "" : " static"));
    if (open) { r.type = "button"; r.setAttribute("aria-label", label || name); r.addEventListener("click", e => { e.stopPropagation(); open(); }); }
    const t = ce("span", "pt");
    t.append(ce("span", "nm", name));
    if (word) t.append(ce("span", "wd" + (wordCls ? " " + wordCls : ""), word));
    r.append(glyph || ce("span"), t);
    const ch = ce("span", "chev", open ? "›" : ""); ch.setAttribute("aria-hidden", "true"); r.append(ch);
    return r;
  }
  const lab = (t, cls) => ce("span", "lab" + (cls ? " " + cls : ""), t);
  function blk(label, ...kids) { const b = ce("div", "blk"); if (label) b.append(typeof label === "string" ? lab(label) : label); b.append(...kids.filter(Boolean)); return b; }
  function ind(shape, on, color) { const i = ce("i", "ind " + shape + (on ? " on" : "")); i.setAttribute("aria-hidden", "true"); if (color) i.style.setProperty("--c", color); return i; }

  /* Seven-segment readout (the purifier and dehumidifier only), the mockup's own drawing. */
  const SEGS = {0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g", " ": ""};
  function seg7(str, label) {
    const dw = 12, dh = 22, g = 4, t = 2.8, q = .7;
    const hs = (x, y, L) => `${x},${y} ${x + t / 2},${y - t / 2} ${x + L - t / 2},${y - t / 2} ${x + L},${y} ${x + L - t / 2},${y + t / 2} ${x + t / 2},${y + t / 2}`;
    const vs = (x, y, L) => `${x},${y} ${x + t / 2},${y + t / 2} ${x + t / 2},${y + L - t / 2} ${x},${y + L} ${x - t / 2},${y + L - t / 2} ${x - t / 2},${y + t / 2}`;
    let x = 2, out = "";
    for (const ch of String(str)) {
      const on = SEGS[ch] || "", P = {a: hs(x + q, 2 + t / 2, dw - 2 * q), g: hs(x + q, 2 + dh / 2, dw - 2 * q), d: hs(x + q, 2 + dh - t / 2, dw - 2 * q),
        f: vs(x + t / 2, 2 + q, dh / 2 - 2 * q), b: vs(x + dw - t / 2, 2 + q, dh / 2 - 2 * q), e: vs(x + t / 2, 2 + dh / 2 + q, dh / 2 - 2 * q), c: vs(x + dw - t / 2, 2 + dh / 2 + q, dh / 2 - 2 * q)};
      for (const k in P) out += `<polygon class="sg${on.includes(k) ? " on" : ""}" points="${P[k]}"/>`;
      x += dw + g;
    }
    const s = ce("span", "seg7"); s.setAttribute("role", "img"); s.setAttribute("aria-label", label || String(str).trim() || "blank");
    s.innerHTML = `<svg viewBox="0 0 ${x} 26" aria-hidden="true"><g transform="skewX(-6)">${cmark(out)}</g></svg>`; // digits / dashes only
    return s;
  }
  function grille(on) { const g = ce("span", "gr"); g.setAttribute("aria-hidden", "true"); for (let i = 0; i < 16; i++) g.append(ce("i", on && i === 5 ? "on" : "")); return g; }
  /* Lit power symbol (status: green-ink while on, dim while off). */
  function pwrGlyph(on, size) { const g = ic("pwr", "pwg" + (on ? " on" : "")); if (size) g.style.width = g.style.height = size + "px"; return g; }

  /* ---------- the fader (vertical: a light's brightness; horizontal: volume, pop-up brightness) ----------
     o: {card, orient "v" | "h", value 0..100, lit (fill shown), color (fill css), cls ("big" | "sm" | "quiet"), label,
         min (0), step (5 keys), live(v) (called at most every 300 ms while dragging), commit(v) (on release / keys),
         disabled}. The card's _cmDrag flag holds its redraws while the pointer is down. */
  function fader(o) {
    const v0 = Math.max(0, Math.min(100, Math.round(Number(o.value) || 0)));
    const f = ce("div", (o.orient === "v" ? "vf" : "hf") + (o.cls ? " " + o.cls : "") + (o.lit ? " lit" : ""));
    const fl = ce("i", "fl"), cp = ce("i", "cp"), b = ce("b", "num");
    cp.append(b); f.append(fl, cp);
    if (o.color) f.style.setProperty("--lc", o.color);
    if (o.disabled) { f.classList.add(C("dis")); f.setAttribute("aria-disabled", "true"); f.setAttribute("role", "slider"); f.setAttribute("aria-label", o.label || "Level"); return f; }
    f.tabIndex = 0; f.setAttribute("role", "slider"); f.setAttribute("aria-label", o.label || "Level");
    f.setAttribute("aria-valuemin", String(o.min || 0)); f.setAttribute("aria-valuemax", "100");
    if (o.orient === "v") f.setAttribute("aria-orientation", "vertical");
    let cur = v0, sent = v0, timer = null, last = 0;
    const show = v => {
      cur = Math.max(o.min || 0, Math.min(100, Math.round(v)));
      f.style.setProperty("--vn", String(cur / 100));
      f.setAttribute("aria-valuenow", String(cur)); f.setAttribute("aria-valuetext", o.text ? o.text(cur) : cur + "%");
      b.textContent = o.capText ? o.capText(cur) : cur ? String(cur) : "Off";
      f.classList.toggle(C("lit"), !!o.alwaysLit || cur > 0);
      if (o.onShow) o.onShow(cur);
    };
    show(v0);
    const at = e => { const r = f.getBoundingClientRect(); return o.orient === "v" ? (1 - (e.clientY - r.top) / r.height) * 100 : (e.clientX - r.left) / r.width * 100; };
    const flush = () => { clearTimeout(timer); timer = null; if (cur !== sent) { sent = cur; last = Date.now(); if (o.live) o.live(cur); } };
    const throttle = () => {
      if (!o.live) return;
      const wait = 300 - (Date.now() - last);
      if (wait <= 0) flush(); else if (!timer) timer = setTimeout(flush, wait);
    };
    const end = () => {
      if (!f.dataset.drag) return;
      delete f.dataset.drag; clearTimeout(timer); timer = null;
      if (cur !== sent || !o.live) { sent = cur; if (o.commit) o.commit(cur); }
      if (o.card) { o.card._cmDrag = false; if (o.card._cmPending) { o.card._cmPending = false; Promise.resolve().then(() => cmRedraw(o.card)); } }
    };
    f.addEventListener("pointerdown", e => {
      if (e.button) return;
      e.stopPropagation(); e.preventDefault();
      try { f.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      f.dataset.drag = "1"; if (o.card) o.card._cmDrag = true;
      try { f.focus({preventScroll: true}); } catch (err) { /* ignore */ }
      show(at(e)); throttle();
    });
    f.addEventListener("pointermove", e => { if (!f.dataset.drag) return; show(at(e)); throttle(); });
    f.addEventListener("pointerup", e => { if (f.dataset.drag) show(at(e)); end(); });
    f.addEventListener("pointercancel", end);
    f.addEventListener("lostpointercapture", end);
    f.addEventListener("click", e => e.stopPropagation());
    let kt = null;
    f.addEventListener("keydown", e => {
      const st = o.step || 5, d = {ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st, PageUp: 10, PageDown: -10}[e.key];
      let v = null;
      if (d) v = cur + d; else if (e.key === "Home") v = o.min || 0; else if (e.key === "End") v = 100;
      if (v === null) return;
      e.preventDefault(); e.stopPropagation();
      show(v);
      // keys: the value shows at once; the call goes 250 ms after the last press (one call per burst)
      clearTimeout(kt); kt = setTimeout(() => { if (cur !== sent) { sent = cur; (o.commit || o.live)(cur); } }, 250);
    });
    return f;
  }
  /* A card's state update while its fader is held waits for the release (cmRedraw then draws the latest state). */
  function cmRedraw(card) { if (!card || !card.isConnected || !card._config || !card._hass) return; card._sig = null; card._render(false); }

  /* The rocker (branch paddle-off, Isaac: "I prefer the binary on off symbols to the words", "It should just look like it's
     rocking between on and off"): one object, ON = the I half pressed in, OFF = the O half pressed in; pressed = the flatter
     tone, raised = the other with a thin shading edge at the pivot; the lamp's colour as a thin band on the pressed I half. */
  function rocker(card, host, {name, on, offline, color, onToggle}) {
    const cs = getComputedStyle(host), rgbOf = n => parseRgb(cs.getPropertyValue(n).trim()) || resolveRgb(host, `var(${n})`);
    const slab = rgbOf("--slab"), fg = rgbOf("--fg"), day = !!slab && luminance(slab) > .35;
    const r = ce("button", "rk"); r.type = "button"; r.dataset.key = "power"; r.dataset.pd = day ? "day" : "night";
    if (slab && fg) {
      let t = .3, lift = mix(slab, fg, t);
      while (contrastRatio(lift, slab) < 3.2 && t < .85) { t += .05; lift = mix(slab, fg, t); }
      const up = day ? slab : lift, inn = day ? lift : slab;
      r.style.setProperty("--pd-up", rgbCss(up)); r.style.setProperty("--pd-in", rgbCss(inn));
      r.style.setProperty("--pd-edge", rgbCss(mix(up, inn, .5))); r.style.setProperty("--pd-rim", rgbCss(lift));
    }
    if (color) r.style.setProperty("--lc", color);
    const NS = "http://www.w3.org/2000/svg", sym = (tag, at) => { const s = document.createElementNS(NS, "svg"), e = document.createElementNS(NS, tag);
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
      for (const k in at) e.setAttribute(k, at[k]); s.append(e); return s; };
    const a = ce("i", "pd-on"), b = ce("i", "pd-off");
    a.append(sym("line", {x1: 12, y1: 2, x2: 12, y2: 22})); b.append(sym("circle", {cx: 12, cy: 12, r: 9}));
    r.append(a, b);
    if (offline) { r.disabled = true; r.setAttribute("aria-label", `${name} power, Offline`); r.title = "Offline"; }
    else { r.setAttribute("aria-pressed", String(!!on)); r.setAttribute("aria-label", `${name} power, ${on ? "On" : "Off"}`); r.title = on ? "On" : "Off"; }
    r.addEventListener("pointerdown", e => e.stopPropagation());
    r.addEventListener("click", e => {
      e.stopPropagation(); if (r.disabled) return;
      const next = r.getAttribute("aria-pressed") !== "true";
      r.setAttribute("aria-pressed", String(next)); r.title = next ? "On" : "Off";
      if (motionOn()) oneShot(r, C(next ? "rock-on" : "rock-off"));
      onToggle(next);
    });
    return r;
  }

  /* ---------- pop-ups (openSheet with the Calm head: eyebrow, title, header keys, Close ×) ---------- */
  /* opts: {card, kicker, title, keys: [nodes], kiosk (centred two-column pop-up), wide (the kiosk remote), fill(body, api)}.
     The card keeps {api, fill} on _cmPop and refills it on each render while it is open. */
  function popup(card, o) {
    if (card._cmPop && card._cmPop.api.isOpen()) card._cmPop.api.close({silent: true});
    const api = openSheet({from: card, title: o.title, kicker: o.kicker, rule: false, flash: false, cls: C("cmp" + (o.kiosk ? " kio" : "") + (o.cls ? " " + o.cls : "")),
      headerActions: o.keys || [], onClose: () => { if (card._cmPop && card._cmPop.api === api) card._cmPop = null; if (o.onClose) o.onClose(); }});
    api.pop.toggleAttribute("data-n", isNight(api.root));
    const pop = {api, fill: o.fill, keys: o.keys, refresh: o.refresh};
    card._cmPop = pop;
    fillPop(card);
    return api;
  }
  function fillPop(card) {
    const p = card._cmPop;
    if (!p || !p.api.isOpen()) return;
    const body = p.api.body, scroll = body.scrollTop, act = deepActive(), k = act && act.dataset ? act.dataset.key : null;
    if (body.querySelector("[data-drag]")) return; // never under a finger
    body.textContent = "";
    if (p.refresh) p.refresh(p);
    p.fill(body, p.api);
    body.scrollTop = scroll;
    if (k) { const n = body.querySelector(`[data-key="${CSS.escape(k)}"]`); if (n) try { n.focus({preventScroll: true}); } catch (e) { /* ignore */ } }
  }

  /* =====================================================================================================================
     Cards
     ===================================================================================================================== */
  const R = {};

  /* ---------- jam-light: name row, then the rocker (or the small switch) beside a vertical fader ---------- */
  function lampKind(c, name, group) {
    if (c.glyph && LGL[c.glyph]) return c.glyph;
    const n = lc(name);
    if (/strip|wled|\bled\b|tv light/.test(n)) return "strip";
    if (/fairy|string/.test(n)) return "string";
    if (/ceiling|pendant|stove|sconce|boob/.test(n)) return "pendant";
    if (/car ?port|porch|garage|outside|lantern|patio/.test(n)) return "lantern";
    if (/bulb|closet|bedside/.test(n)) return "bulb";
    if (/floor|torch/.test(n) || group) return "floor";
    return "table";
  }
  function lightWord(card, s) {
    const c = card._config, ids = card._memberIds(s);
    if (dead(s)) return OFFLINE;
    const on = s.state === "on", kind = ids.length ? "Group" : c.preset_entity ? "WLED" : "";
    if (on && ids.length) {
      const k = ids.filter(id => { const m = stateObj(card._hass, id); return m && m.state === "on"; }).length;
      if (k > 0 && k < ids.length) return `${k} of ${ids.length} on`;
    }
    return (on ? "On" : "Off") + (kind ? " · " + kind : "");
  }
  R["jam-light"] = (card, b) => {
    const c = card._config, h = card._hass, s = stateObj(h, c.entity), name = card._name(), off = dead(s), on = !off && s.state === "on";
    const kio = c.size === "kiosk", pct = on ? lightPct(s) : 0, col = cssRgb(lampRgb(s));
    jamState(card, off ? "offline" : on ? "on" : "off");
    const root = ce("div", "cm cw lc" + (kio ? " kio" : "")); root.dataset.st = off ? "offline" : on ? "on" : "off";
    b.append(root);
    const kind = lampKind(c, name, card._memberIds(s).length > 0);
    root.append(nameRow({glyph: lamp(kind, on, col), name, word: lightWord(card, s), wordCls: off ? "al" : "",
      open: () => (off ? offlinePop(card, s, name, kind) : lightPop(card)), label: `${name}: ${off ? "offline, details" : "open light controls"}`}));
    if (off) {
      const note = ce("div", "ofx"); note.append(ce("span", "note", s ? `Can't be reached since ${since(s, h)}.` : "Not found in Home Assistant."));
      root.append(note); return true;
    }
    const pb = ce("div", "pb");
    const power = () => card._power();
    let ctl;
    if (c.switch === "toggle") {
      ctl = ce("div", "tg");
      const row = ce("div", "swrow"); row.append(lab("Power"), jamSwitch({on, label: `${name} power`, kind: "plug", accent: c.switch_accent, big: kio, onToggle: power}));
      ctl.append(row);
    } else ctl = rocker(card, b, {name, on, color: col, onToggle: power});
    pb.append(ctl);
    if (lightDims(s)) {
      pb.append(fader({card, orient: "v", value: pct, lit: on, color: col, label: `${name} brightness`, cls: kio ? "" : "quiet",
        live: v => card._setPct(c.entity, v), commit: v => card._setPct(c.entity, v)}));
    } else pb.classList.add(C("solo"));
    root.append(pb);
    if (card._cmPop) fillPop(card);
    return true;
  };
  function offlinePop(card, s, name, kind) {
    const h = card._hass, c = card._config;
    popup(card, {kicker: c.kicker || area(h, c.entity) || "Light", title: name, kiosk: c.size === "kiosk", fill: body => {
      const box = ce("div", "cw ofl");
      box.append(lamp(kind, false), ce("span", "mtitle", OFFLINE),
        ce("span", "note", `Can't be reached since ${since(s, h) || "a while"}. Check that its wall switch is on, then try again.`));
      const t = key("Try again", null, () => { jamCall(t, h, "homeassistant", "update_entity", {entity_id: c.entity}, "run"); }, {cls: "or big", key: "retry"});
      box.append(t); body.append(box);
    }});
  }
  /* Light pop-up: brightness, whites (5 by default, with their colours), colour (12 hues), your colours, group members,
     turn off in, automations (config `automations`). Kiosk: centred, two columns. */
  function lightPop(card) {
    const c = card._config, h = card._hass, name = card._name();
    card._loadColors();
    // the saved colours arrive from the user data a moment later: refill once they are in
    if (typeof LIGHT_COLORS_LOAD !== "undefined" && LIGHT_COLORS_LOAD) LIGHT_COLORS_LOAD.then(() => Promise.resolve().then(() => fillPop(card)));
    const pwr = ce("button", "pwr"); pwr.type = "button"; pwr.dataset.key = "power"; pwr.append(ic("pwr"));
    pwr.addEventListener("click", () => card._power());
    popup(card, {kicker: [card._memberIds(stateObj(h, c.entity)).length ? "Group" : c.preset_entity ? "WLED" : "", c.kicker || card._area()].filter(Boolean).join(" · ") || "Light",
      title: name, keys: [pwr], kiosk: c.size === "kiosk", refresh: () => {
        const s = stateObj(card._hass, c.entity), on = !!s && s.state === "on";
        pwr.setAttribute("aria-pressed", String(on)); pwr.setAttribute("aria-label", `${name} power, ${on ? "On" : "Off"}`);
      }, fill: body => lightPopBody(card, body)});
  }
  const HUES = ["#ff7a6b", "#ff9a5a", "#ffc95a", "#e6dc5a", "#9bdc5a", "#5ad68a", "#5ad6c8", "#5ab8ff", "#6a8cff", "#9b7bff", "#d17bff", "#ff7ab0"];
  const rgbHex = x => [1, 3, 5].map(i => parseInt(x.substr(i, 2), 16));
  function hueOf(rgb) {
    const [r, g, b] = rgb.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return [0, 0];
    let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh = Math.round(hh * 60); if (hh < 0) hh += 360;
    return [hh, Math.round(d / mx * 100)];
  }
  function lightPopBody(card, body) {
    const c = card._config, h = card._hass, s = stateObj(h, c.entity), kio = c.size === "kiosk";
    if (dead(s)) { body.append(ce("span", "note", OFFLINE)); return; }
    const a = s.attributes, on = s.state === "on", col = cssRgb(lampRgb(s)), modes = lightModes(s);
    const set = data => jamCall(card, card._hass, "light", "turn_on", {entity_id: c.entity, ...data});
    const parts = [];
    if (c.show_brightness !== false && lightDims(s)) parts.push(["L", blk("Brightness", fader({card, orient: "h", value: on ? lightPct(s) : 0, lit: on, color: col, cls: "big",
      label: "Brightness", live: v => card._setPct(c.entity, v), commit: v => card._setPct(c.entity, v)}))]);
    if (!c.preset_entity && (c.show_color_temp ?? modes.includes("color_temp"))) {
      const lo = Number(a.min_color_temp_kelvin) || 2000, hi = Number(a.max_color_temp_kelvin) || 6500;
      const list = Array.isArray(c.whites) && c.whites.length ? c.whites : [{name: "Cozy", kelvin: 2200}, {name: "Warm", kelvin: 2700}, {name: "Neutral", kelvin: 3500}, {name: "Clean", kelvin: 4000}, {name: "Daylight", kelvin: 5000}];
      const cur = on && a.color_mode === "color_temp" ? Number(a.color_temp_kelvin) : null;
      const wh = ce("div", "wh");
      for (const w of list) {
        const k = Math.max(lo, Math.min(hi, Number(w.kelvin) || 2700));
        const btn = key("", null, () => set({color_temp_kelvin: k}), {pressed: cur != null && Math.abs(cur - k) <= 60, key: "w" + k, aria: `${w.name} white, ${k} K`});
        const cc = ce("i", "cc"); cc.style.setProperty("--c", rgbCss(whiteOf(k)));
        btn.prepend(cc); btn.append(ce("span", "kl", w.name), ce("small", "num", `${k} K`));
        wh.append(btn);
      }
      parts.push(["L", blk("White", wh)]);
    }
    const ps = c.preset_entity && stateObj(h, c.preset_entity);
    if (ps && !dead({state: ps.state === "unknown" ? "x" : ps.state}) && Array.isArray(ps.attributes.options)) {
      // WLED presets: one key per option of the select (the one running presses in)
      const g = ce("div", "chips3");
      for (const o of ps.attributes.options) g.append(key(o, null, () => jamCall(card, card._hass, "select", "select_option", {entity_id: c.preset_entity, option: o}),
        {pressed: lc(ps.state) === lc(o), key: "p:" + o}));
      parts.push(["L", blk("Presets", g)]);
    }
    const hasColor = c.show_color ?? modes.some(m => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(m));
    if (hasColor) {
      const cur = on && !["color_temp", "white"].includes(a.color_mode) ? fullRgb(lightRgb(s)) : null;
      const row = ce("div", "hue");
      for (const x of HUES) {
        const rgb = rgbHex(x), [hh, ss] = hueOf(rgb), bt = ce("button");
        bt.type = "button"; bt.style.setProperty("--c", rgbCss(guard(rgb))); bt.dataset.key = "h" + x;
        bt.setAttribute("aria-label", "Colour " + x); bt.setAttribute("aria-pressed", String(!!cur && Math.abs(hueOf(cur)[0] - hh) <= 12));
        bt.addEventListener("click", () => set({hs_color: [hh, ss]}));
        row.append(bt);
      }
      parts.push(["R", blk("Colour", row)]);
      const yc = ce("div", "yc"), saved = (typeof LIGHT_COLORS !== "undefined" && LIGHT_COLORS) || [];
      saved.slice(-4).forEach((rgb, i) => {
        const sw = ce("i", "swin"); sw.style.setProperty("--c", rgbCss(guard(fullRgb(rgb) || rgb)));
        const k = key("", null, () => set({rgb_color: rgb.slice(0, 3)}), {aria: "Your colour " + (i + 1), key: "y" + i, pressed: !!cur && Math.hypot(...cur.map((v, j) => v - (fullRgb(rgb) || rgb)[j])) < 20});
        k.prepend(sw); yc.append(k);
      });
      const save = key("Save this", "plus", () => { const x = fullRgb(lightRgb(stateObj(card._hass, c.entity))); if (x) { card._saveColor(x); fillPop(card); } }, {key: "save", disabled: !cur});
      yc.append(save);
      parts.push(["R", blk("Your colours", yc)]);
    }
    const ids = card._memberIds(s);
    if (c.show_members !== false && ids.length) {
      const box = blk("In this group");
      for (const id of ids) {
        const m = stateObj(h, id), mOff = dead(m), mOn = !mOff && m.state === "on", mn = friendly(h, id).replace(new RegExp("^" + (friendly(h, c.entity) || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+", "i"), "");
        const row = ce("div", "mem");
        row.append(ce("span", "mn", mn));
        row.append(fader({card, orient: "h", value: mOn ? lightPct(m) : 0, lit: mOn, color: col, cls: "sm quiet", label: mn + " brightness", disabled: mOff,
          live: v => card._setPct(id, v), commit: v => card._setPct(id, v)}));
        const mini = rocker(card, body, {name: mn, on: mOn, offline: mOff, color: col, onToggle: () => jamCall(card, card._hass, "light", mOn ? "turn_off" : "turn_on", {entity_id: id})});
        mini.classList.add(C("mini"));
        row.append(mini);
        box.append(row);
      }
      parts.push(["R", box]);
    }
    const ts = card._timerScript();
    if (stateObj(h, ts)) {
      const k3 = ce("div", "k3");
      for (const [m, t] of [[15, "15 min"], [30, "30 min"], [60, "1 h"]]) k3.append(key(t, null, () => jamCall(card, card._hass, "script", "turn_on", {entity_id: ts, variables: {entity_id: c.entity, minutes: m}}), {key: "t" + m}));
      parts.push(["L", blk("Turn off in", k3)]);
    }
    const autos = (Array.isArray(c.automations) ? c.automations : []).map(x => (typeof x === "string" ? {entity: x} : x)).filter(x => x && /^automation\./.test(x.entity || ""));
    if (autos.length && !kio) {
      const lst = ce("div", "cw lst");
      for (const x of autos) {
        const st = stateObj(h, x.entity), aon = !!st && st.state === "on", aoff = dead(st);
        const lt = st && st.attributes.last_triggered ? Date.parse(st.attributes.last_triggered) : NaN;
        const word = aoff ? OFFLINE : !aon ? "Not running" : isFinite(lt) ? "Last ran " + (Date.now() - lt < 864e5 ? clock(new Date(lt), h) : since({last_changed: st.attributes.last_triggered}, h)) : "Running";
        const row = ce("div", "lr"), t = ce("span");
        t.append(ce("span", "nm", x.name || friendly(h, x.entity)), ce("span", "wd", word));
        row.append(t, jamSwitch({on: aon, offline: aoff, kind: "auto", accent: x.accent, label: `${x.name || friendly(h, x.entity)}`,
          onToggle: nv => jamCall(card, card._hass, "automation", nv ? "turn_on" : "turn_off", {entity_id: x.entity})}));
        lst.append(row);
      }
      parts.push(["R", blk("Automations", lst)]);
    }
    if (kio) {
      const two = ce("div", "kp2"), L = ce("div"), Rc = ce("div");
      for (const [side, n] of parts) (side === "L" ? L : Rc).append(n);
      two.append(L, Rc); body.append(two);
    } else for (const [, n] of parts) body.append(n);
  }

  /* ---------- switched devices (jam-tile / jam-button on an on / off entity): name row + POWER + the small switch ---------- */
  function devGlyph(c, id, name) {
    if (c.glyph && OG[c.glyph]) return c.glyph;
    const n = lc(name), d = String(id).split(".")[0];
    if (/tree|christmas|mood/.test(n)) return "tree";
    if (/fan|blanket/.test(n) || d === "fan") return "fan";
    if (/dehumid|humid/.test(n) || d === "humidifier") return "drop";
    if (/purif|air/.test(n)) return "air";
    if (d === "automation") return "auto";
    return "plug";
  }
  function switchCard(card, b, id, nameIn) {
    const c = card._config, h = card._hass, s = stateObj(h, id), name = nameIn || c.name || friendly(h, id), off = dead(s), on = !off && s.state === "on";
    const kio = c.size === "kiosk", kind = jamSwitchKind(id, c.kind), kw = {plug: "plug", climate: "climate", auto: "automation", set: "setting"}[kind];
    jamState(card, off ? "offline" : on ? "on" : "off");
    const root = ce("div", "cm cw lc sc" + (kio ? " kio" : "")); root.dataset.st = off ? "offline" : on ? "on" : "off";
    root.append(nameRow({glyph: og(devGlyph(c, id, name)), name, word: off ? OFFLINE : `${on ? "On" : "Off"} · ${kw}`, wordCls: off ? "al" : "",
      open: c.tap_action && c.tap_action.action !== "none" ? () => runAction(card, h, c.tap_action, id) : null}));
    const row = ce("div", "swrow");
    row.append(lab("Power"), jamSwitch({on, offline: off, kind, accent: c.accent, big: kio, label: `${name} power`,
      onToggle: () => jamCall(card, card._hass, "homeassistant", "toggle", {entity_id: id}, "toggle", `Couldn't switch ${name}`)}));
    root.append(row);
    b.append(root);
    return true;
  }
  const ONOFF = /^(switch|input_boolean|fan|automation|humidifier)\./;
  R["jam-tile"] = (card, b) => {
    const c = card._config, s = stateObj(card._hass, c.entity);
    if (!ONOFF.test(c.entity) || (c.control && c.control !== "toggle" && c.control !== "auto")) return false;
    if (s && !dead(s) && s.state !== "on" && s.state !== "off") return false;
    return switchCard(card, b, c.entity);
  };
  R["jam-button"] = (card, b) => {
    const c = card._config;
    if (c.entity && ONOFF.test(c.entity) && !(c.tap_action && !["toggle", "none"].includes(c.tap_action.action))) return switchCard(card, b, c.entity);
    if (!c.tap_action || c.tap_action.action !== "perform-action") return false;
    // An action card ("All lights off…"): a quiet label (how many of its lights are on) and one wide key; a confirmation
    // opens the Calm pop-up listing what is on.
    const h = card._hass, a = c.tap_action, ids = [].concat((a.target && a.target.entity_id) || c.entities || []);
    const lights = ids.filter(id => /^light\./.test(id)), nOn = lights.filter(id => { const s = stateObj(h, id); return s && s.state === "on"; }).length;
    const root = ce("div", "cm cw kalloff" + (c.size === "big" || c.size === "kiosk" ? " kio" : ""));
    root.append(lab(lights.length ? `${nOn} of ${lights.length} lights on` : c.label || ""));
    root.append(key(c.name + (a.confirmation ? "…" : ""), null, () => (a.confirmation ? confirmPop(card, {name: c.name}, a) : runAction(card, card._hass, a)), {cls: "big wide", key: "act"}));
    b.append(root);
    return true;
  };

  /* ---------- jam-fan (the air purifier): grille, readout + name + small switch, speed keys ---------- */
  R["jam-fan"] = (card, b) => {
    const c = card._config, h = card._hass, s = stateObj(h, c.entity), a = (s && s.attributes) || {}, off = dead(s), on = !off && s.state === "on";
    const kio = c.size === "kiosk", name = c.name || friendly(h, c.entity);
    jamState(card, off ? "offline" : on ? "on" : "off");
    const root = ce("div", "cm cw appl" + (kio ? " kio" : "")); root.dataset.st = off ? "offline" : on ? "on" : "off";
    const gr = ce("div", "grille"); gr.setAttribute("aria-hidden", "true"); root.append(gr);
    const face = ce("div", "afc");
    // Readout: the extra sensor's number (PM2.5), blank while off.
    const sid = x => (x && x.entity) || (typeof x === "string" ? x : null), xs = stateObj(h, sid(c.extra_sensor)), as = stateObj(h, sid(c.sensor));
    const num = xs && !dead(xs) && isFinite(Number(xs.state)) ? String(Math.round(Number(xs.state))) : null;
    const unit = (c.extra_sensor && c.extra_sensor.name) || ({pm25: "PM2.5", pm10: "PM10", pm1: "PM1", aqi: "AQI", carbon_dioxide: "CO₂"}[xs && xs.attributes.device_class]) || "";
    const ro = ce("div", "ro");
    const digits = on && num ? num.slice(-3).padStart(3, "0") : "   ";
    ro.append(seg7(digits, on && num ? `${unit} ${num}` : "Off"));
    if (unit) ro.append(ce("span", "u", unit));
    const nm = ce("div", "an"); nm.append(ce("span", "aname", name));
    const aw = as && !dead(as) ? String(aqWord(as.state) || fmtState(h, as)).toLowerCase() : "";
    nm.append(ce("span", "asub", off ? OFFLINE : on ? "Running" + (aw ? " · air " + aw : "") : "Off"));
    nm.addEventListener("click", () => moreInfo(card, c.entity));
    face.append(ro, nm, jamSwitch({on, offline: off, kind: "climate", accent: c.switch_accent, big: kio, label: `${name} power`,
      onToggle: nv => jamCall(card, card._hass, "fan", nv ? "turn_on" : "turn_off", {entity_id: c.entity})}));
    root.append(face);
    const speeds = card._speeds(a);
    if (speeds.length) {
      const pct = Number(a.percentage);
      let act = null;
      if (on && !a.preset_mode && pct > 0) act = speeds.reduce((m, v) => (Math.abs(v - pct) < Math.abs(m - pct) ? v : m), speeds[0]);
      const keys = ce("div", "akeys"); keys.setAttribute("role", "group"); keys.setAttribute("aria-label", "Fan speed");
      keys.style.setProperty("--n", speeds.length);
      for (const v of speeds) keys.append(key(`${v} %`, null, () => jamCall(card, card._hass, "fan", "set_percentage", {entity_id: c.entity, percentage: v}),
        {pressed: v === act, disabled: off, key: "sp" + v, aria: `Speed ${v} %`}));
      root.append(keys);
    }
    b.append(root);
    return true;
  };

  /* ---------- jam-scenes: pill keys (phone: a 4-up grid of rounded keys); the chosen one presses in ---------- */
  R["jam-scenes"] = (card, b) => {
    const c = card._config, h = card._hass, kio = c.size === "kiosk";
    const cur = c.current_entity ? stateObj(h, c.current_entity) : null, want = cur && !dead(cur) ? lc(String(cur.state).trim()) : null;
    let newest = null, newT = -Infinity;
    for (const sc of c.scenes) { const t = jamSceneTime(stateObj(h, sc.entity)); if (t > newT) { newT = t; newest = sc.entity; } }
    const curT = cur && cur.last_changed ? Date.parse(cur.last_changed) : NaN, bySel = !newest || (!!want && curT > newT);
    const row = ce("div", "cm scn" + (kio ? " kio" : "") + (c.layout === "grid" ? " grid" : ""));
    row.setAttribute("role", "group"); row.setAttribute("aria-label", "Scenes");
    for (const sc of c.scenes) {
      const name = friendly(h, sc.entity, sc.name), obj = String(sc.entity).split(".")[1].replace(/_/g, " ");
      const on = bySel ? !!want && (lc(String(name).trim()) === want || obj === want) : sc.entity === newest, s = stateObj(h, sc.entity);
      const k = key(name, null, () => jamCall(k, card._hass, sc.entity.split(".")[0], "turn_on", {...(sc.data || {}), entity_id: sc.entity}, "start"),
        {pressed: on, key: sc.entity, cls: !s || s.state === "unavailable" ? "dash" : ""});
      row.append(k);
    }
    b.append(row);
    return true;
  };

  /* ---------- jam-house: the house strip (inside, outside, the front door, who's home) ---------- */
  const TAGS = ["#3f6fb5", "#2a7a74", "#b8476f", "#7a5a9a", "#8a6a2a", "#4a6a7a"];
  function doorState(h, id) {
    const ls = stateObj(h, id);
    if (!ls || dead(ls)) return {sev: "off", word: OFFLINE};
    if (!lockAlert(ls)) return {sev: "ok", word: ls.state === "locked" ? "Locked" : fmtState(h, ls)};
    const people = Object.values(h.states).filter(x => /^person\./.test(x.entity_id));
    const anyone = !people.length || people.some(p => p.state === "home");
    const warn = !dark(h) && anyone && ls.state !== "jammed";
    return {sev: warn ? "warn" : "alert", word: (warn ? "▲ " : "") + (ls.state === "open" ? "Open" : ls.state === "jammed" ? "Jammed" : "Unlocked")};
  }
  function lockKey(card, id, d, cls) {
    const k = key("Lock", "lock", () => jamCall(k, card._hass, "lock", "lock", {entity_id: id}, "run", "Couldn't lock the door"), {cls: (d.sev === "warn" ? "or" : "red") + (cls ? " " + cls : ""), key: "lock"});
    return k;
  }
  R["jam-house"] = (card, b) => {
    const c = card._config, h = card._hass;
    const root = ce("div", "cm cw hs");
    const tp = ce("div", "tp"), L = ce("div"), Rt = ce("div", "rt");
    const ins = stateObj(h, c.inside_entity), hum = stateObj(h, c.humidity_entity || c.inside_humidity_entity);
    const n = x => (x && !dead(x) && isFinite(Number(x.state)) ? Math.round(Number(x.state)) : null);
    L.append(lab("Inside"));
    const big = ce("div", "big num", n(ins) == null ? "—" : n(ins) + "°");
    if (n(hum) != null) big.append(ce("small", "num", `${n(hum)} %`));
    asButton(big, () => moreInfo(card, c.inside_entity));
    L.append(big);
    const out = stateObj(h, c.outside_entity), wx = /^weather\./.test(c.outside_entity || "");
    const ot = out && !dead(out) ? (wx ? out.attributes.temperature : out.state) : null;
    Rt.append(lab("Outside"));
    const ob = ce("div", "big num", ot == null || !isFinite(Number(ot)) ? "—" : Math.round(Number(ot)) + "°");
    if (wx && out && !dead(out)) ob.append(ce("span", "w", " " + lc(conditionWord(out.state))));
    asButton(ob, () => moreInfo(card, c.outside_entity));
    Rt.append(ob);
    tp.append(L, Rt); root.append(tp);
    if (c.lock_entity) {
      const d = doorState(h, c.lock_entity), dr = ce("div", "dr");
      dr.append(ind("led", d.sev !== "off", d.sev === "ok" ? "var(--cok)" : d.sev === "warn" ? "var(--cwarn)" : d.sev === "alert" ? "var(--calert)" : null));
      const w = ce("span", "w", "Front door"), sw = ce("span", "dw " + d.sev, d.word);
      w.append(sw); dr.append(w);
      if (d.sev === "warn" || d.sev === "alert") dr.append(lockKey(card, c.lock_entity, d));
      dr.addEventListener("click", e => { if (!e.target.closest("button")) moreInfo(card, c.lock_entity); });
      root.append(dr);
    }
    const people = (c.people || []).map((x, i) => (typeof x === "string" ? {entity: x, color: TAGS[i % TAGS.length]} : {color: TAGS[i % TAGS.length], ...x}));
    if (people.length) {
      const ppl = ce("div", "ppl");
      for (const p of people) {
        const ps = stateObj(h, p.entity), home = !!ps && ps.state === "home", nm = String(p.name || friendly(h, p.entity)).trim().split(/\s+/)[0];
        const sp = ce("span", home ? "" : "away"), tag = ce("i", "ptag", (nm[0] || "?").toUpperCase());
        tag.style.setProperty("--c", p.color); tag.setAttribute("aria-hidden", "true");
        sp.append(tag, document.createTextNode(nm + (home ? "" : " · out")));
        ppl.append(sp);
      }
      root.append(ppl);
    }
    b.append(root);
    return true;
  };

  /* ---------- jam-heading: the room head ("Living room" + "73.6° · 62%") ---------- */
  R["jam-heading"] = (card, b) => {
    const c = card._config, h = card._hass;
    if (c.size === "small") { const g = ce("div", "cm gh"); g.append(lab(c.title)); b.append(g); return true; } // a group label over a hairline
    const r = ce("div", "cm rh");
    r.append(ce("span", "rt", c.title));
    const vals = (c.entities || []).map(id => { const s = stateObj(h, id); if (dead(s)) return null; const v = Number(s.state), u = s.attributes.unit_of_measurement || "";
      return isFinite(v) ? (u === "%" ? Math.round(v) : Math.round(v * 10) / 10) + (u === "°F" || u === "°C" ? "°" : u) : fmtState(h, s); }).filter(Boolean);
    if (vals.length) r.append(ce("span", "rc num", vals.join(" · ")));
    if (c.tap_action) { r.classList.add(C("tap")); bindActions(r, () => card._hass, {tap_action: {action: "none"}, ...c}); }
    b.append(r);
    return true;
  };

  /* ---------- jam-tv: name row, what's on, transport, volume, Remote / Source; pop-ups TV (with sources) and Remote ---------- */
  const SRC_BAND = {teal: "#2f8a83", red: "#b5476a", ochre: "#c49a3a", yellow: "#c49a3a", pink: "#d07fa6", blue: "#4a7be0", violet: "#7a5a9a", purple: "#7a5a9a", green: "#5f8f4a", kitchen: "#2f8a83", master: "#4a7be0", marissa: "#d07fa6", music: "#7a5a9a"};
  function tvNames(card) {
    const c = card._config, h = card._hass, full = String(c.name || friendly(h, c.media_player) || "TV"), parts = full.split(/\s+·\s+/);
    return {title: parts.length > 1 ? parts[0] : "TV", device: parts.length > 1 ? parts.slice(1).join(" · ") : full, room: c.room || area(h, c.media_player)};
  }
  function tvState(card) {
    const c = card._config, h = card._hass, s = stateObj(h, c.media_player), a = (s && s.attributes) || {};
    const off = !s || UNAVAILABLE.has(s.state) || s.state === "off" || s.state === "standby";
    const playing = !off && (["playing", "paused", "buffering"].includes(s.state) || !!a.media_title);
    const act = off ? null : card._activeSource(), app = off ? null : card._app(a) || (act && act.name) || null;
    let ends = "", frac = null;
    const dur = Number(a.media_duration);
    if (playing && dur > 0 && a.media_position != null) {
      let pos = Number(a.media_position) || 0; const at = Date.parse(a.media_position_updated_at || "");
      if (s.state === "playing" && at) pos += (Date.now() - at) / 1000;
      pos = Math.min(pos, dur); frac = pos / dur;
      ends = "ends " + clock(new Date(Date.now() + (dur - pos) * 1000), h).replace(/ (am|pm)$/, "");
    }
    return {s, a, off, playing, paused: !!s && s.state === "paused", act, app, ends, frac, unavailable: !s || UNAVAILABLE.has(s.state)};
  }
  function tvWord(card, t) {
    const {device} = tvNames(card);
    return (t.unavailable ? OFFLINE : t.off ? "Off" : t.playing ? (t.paused ? "Paused" : "Playing") : "On · idle") + (device && device !== "TV" ? " · " + device : "");
  }
  /* Transport: rewind / play-pause / forward (the remote's media keys when there is a remote, else prev / next track). */
  function tvTransport(card, t, orange) {
    const c = card._config, h = card._hass, rc = card._remoteCfg(), k3 = ce("div", "k3");
    const send = (k, svc) => () => {
      if (rc.actions && rc.actions[k]) runAction(card, card._hass, rc.actions[k], rc.entity);
      else if (rc.entity) jamCall(card, card._hass, "remote", "send_command", {entity_id: rc.entity, command: (rc.commands && rc.commands[k]) || JAM_REMOTE_CMDS[k]}, "send");
      else jamCall(card, card._hass, "media_player", svc, {entity_id: c.media_player});
    };
    const pl = !!t.s && t.s.state === "playing";
    k3.append(key("", "rew", send("rewind", "media_previous_track"), {aria: "Rewind", key: "rew"}),
      key(pl ? "Pause" : "Play", pl ? "pause" : "play", () => jamCall(card, card._hass, "media_player", "media_play_pause", {entity_id: c.media_player}), {cls: orange && pl ? "or" : "", key: "play_pause"}),
      key("", "ff", send("forward", "media_next_track"), {aria: "Forward", key: "ff"}));
    void h;
    return k3;
  }
  /* Volume: a fader when the player has an absolute level (volume_entity or a player with VOLUME_SET and no step actions),
     else the step keys (− / Mute / +; this house's stereo is IR: steps only). */
  function tvVolume(card, kio, big) {
    const c = card._config, h = card._hass, s = stateObj(h, c.media_player);
    const ve = c.volume_entity ? stateObj(h, c.volume_entity) : null, steps = c.volume_up_action || c.volume_down_action;
    const level = ve && !dead(ve) ? (ve.entity_id.startsWith("media_player.") ? Number(ve.attributes.volume_level) * 100 : Number(ve.state))
      : !steps && s && s.attributes.volume_level != null && (Number(s.attributes.supported_features) & 4) ? Number(s.attributes.volume_level) * 100 : null;
    if (level != null && isFinite(level)) {
      const target = ve ? ve.entity_id : c.media_player;
      const setV = v => (target.startsWith("media_player.") ? jamCall(card, card._hass, "media_player", "volume_set", {entity_id: target, volume_level: v / 100})
        : jamCall(card, card._hass, target.split(".")[0], "set_value", {entity_id: target, value: v}));
      return fader({card, orient: "h", value: level, lit: true, alwaysLit: true, cls: big ? "big" : kio ? "" : "quiet", label: "Volume", live: setV, commit: setV});
    }
    const items = [["vol_down", "minus", "Volume down", c.volume_down_action], ["mute", "mute", "Mute", c.mute_action], ["vol_up", "plus", "Volume up", c.volume_up_action]].filter(x => x[3]);
    if (!items.length) return null;
    const row = ce("div", "vsteps");
    for (const [id, g, label, act] of items) {
      const k = key(id === "mute" ? "Mute" : "", g, null, {aria: label, key: id});
      if (id === "mute") k.addEventListener("click", () => runAction(card, card._hass, act, c.media_player));
      else jamHoldRepeat(k, () => runAction(card, card._hass, act, c.media_player), card);
      row.append(k);
    }
    return row;
  }
  R["jam-tv"] = (card, b) => {
    const c = card._config, t = tvState(card), {title} = tvNames(card), kio = c.size === "kiosk";
    const root = ce("div", "cm" + (kio ? " kio ktv" : " cw mc")); root.dataset.st = t.off ? "off" : "on";
    b.append(root);
    if (kio) { tvKioskBody(card, root, t); if (card._cmPop) fillPop(card); return true; }
    root.append(nameRow({glyph: og("tv"), name: title, word: tvWord(card, t), open: () => tvPop(card), label: `${title}: open controls`}));
    if (t.off) {
      root.append(key(t.unavailable ? OFFLINE : "Turn on", "pwr", () => card._power(), {cls: "wide", key: "turn_on", disabled: t.unavailable}));
    } else {
      const what = ce("div", "what");
      if (t.playing) {
        what.append(ce("span", "mtitle", t.a.media_title || t.app || "Playing"), ce("span", "msub num", [t.app, t.ends].filter(Boolean).join(" · ")));
        root.append(what);
        if (t.frac != null) { const p = ce("div", "prog"), i = ce("i"); i.style.width = (t.frac * 100).toFixed(1) + "%"; p.append(i); p.setAttribute("aria-hidden", "true"); root.append(p); }
      } else {
        what.append(ce("span", "mtitle", (t.act && t.act.name) || t.app || "On"), ce("span", "msub", "Nothing playing"));
        root.append(what);
      }
      root.append(tvTransport(card, t, true));
      const v = tvVolume(card, false, false);
      if (v) { const vr = ce("div", "vrow"); vr.append(lab("Vol"), v); root.append(vr); }
    }
    // Remote and Source, also while the TV is off (the remote's power key turns it on).
    const k2 = ce("div", "k2");
    if (card._remoteCfg().entity) k2.append(key("Remote", "remote", () => remotePop(card), {key: "remote"}));
    if (card._sources.length || card._homeRun()) k2.append(key(c.source_label || "Source", "grid", () => tvPop(card), {key: "source"}));
    if (k2.children.length) root.append(k2);
    if (card._cmPop) fillPop(card);
    return true;
  };
  function tvSummary(card, t, big) {
    const box = ce("div", "cw mc sum"), top = ce("div", "sumh"), txt = ce("span");
    txt.append(lab(t.unavailable ? OFFLINE : t.off ? "Off" : t.playing ? (t.paused ? "Paused" : "Playing") : "On · idle"));
    const tt = ce("span", "mtitle" + (big ? " xl" : ""), t.off ? (t.unavailable ? "TV is offline" : "TV is off") : t.playing ? (t.a.media_title || t.app || "Playing") : (t.act && t.act.name) || t.app || "On");
    txt.append(tt);
    if (t.playing && (t.app || t.ends)) txt.append(ce("span", "msub num", [t.app, t.ends].filter(Boolean).join(" · ")));
    top.append(txt, pwrGlyph(!t.off, 20)); box.append(top);
    if (t.playing && t.frac != null) { const p = ce("div", "prog"), i = ce("i"); i.style.width = (t.frac * 100).toFixed(1) + "%"; p.append(i); p.setAttribute("aria-hidden", "true"); box.append(p); }
    return box;
  }
  function sourceGrid(card, t) {
    const g = ce("div", "src"), act = t.off ? null : t.act;
    for (const l of card._sources) {
      const cur = l === act, m = l.match && typeof l.match === "object" && !Array.isArray(l.match) ? l.match : {};
      const kind = [].concat(m.input || []).filter(Boolean).length ? "Input" : "App";
      const tile = ce("button", "srt"); tile.type = "button"; tile.dataset.key = "src:" + (l.name || "");
      tile.style.setProperty("--c", SRC_BAND[lc(l.color || l.accent)] || (/^#/.test(String(l.color || "")) ? l.color : "#8d8981"));
      tile.setAttribute("aria-pressed", String(cur));
      const band = ce("i", "tab"); band.setAttribute("aria-hidden", "true");
      tile.append(band, ce("span", "nm", l.name || ""), ce("span", "on", cur ? "On now" : kind));
      tile.setAttribute("aria-label", (l.name || "") + (cur ? ", on screen" : t.off ? ", wakes the TV" : ""));
      bindActions(tile, () => card._hass, {tap_action: l.tap_action || {action: "none"}, hold_action: l.hold_action}, l.entity);
      g.append(tile);
    }
    const home = card._homeRun();
    if (home) {
      const tile = ce("button", "srt"); tile.type = "button"; tile.dataset.key = "src:home"; tile.style.setProperty("--c", "#8d8981");
      const band = ce("i", "tab"); band.setAttribute("aria-hidden", "true");
      tile.append(band, ce("span", "nm", "Home screen"), ce("span", "on", "App")); tile.addEventListener("click", home);
      g.append(tile);
    }
    return g;
  }
  function tvPop(card) {
    const c = card._config, {title, device, room} = tvNames(card);
    popup(card, {kicker: [room, device].filter(Boolean).join(" · ") || "TV", title, kiosk: false, fill: body => {
      const t = tvState(card);
      body.append(tvSummary(card, t));
      if (t.off) body.append(key(t.unavailable ? OFFLINE : "Turn on", "pwr", () => card._power(), {cls: "or big wide", key: "turn_on", disabled: t.unavailable}));
      else body.append(tvTransport(card, t, true));
      const v = tvVolume(card, false, false);
      if (v) body.append(blk(c.volume_label || "Stereo volume", v));
      const k2 = ce("div", "k2");
      if (card._remoteCfg().entity) k2.append(key("Remote", "remote", () => remotePop(card), {key: "remote"}));
      k2.append(key(t.off ? "Turn on" : "Turn off", "pwr", () => card._power(), {key: "power", disabled: t.unavailable}));
      body.append(k2);
      if (card._sources.length || card._homeRun()) body.append(blk(c.source_label || "Source", sourceGrid(card, t)));
    }});
  }
  /* Kiosk TV sheet body (size: kiosk): left = summary, transport, volume, Remote + power; right = the source grid. */
  function tvKioskBody(card, root, t) {
    const c = card._config, med = ce("div", "kmed"), L = ce("div", "cw kcol"), Rc = ce("div", "cw kcol");
    L.append(tvSummary(card, t, true));
    if (t.off) L.append(key(t.unavailable ? OFFLINE : "Turn on", "pwr", () => card._power(), {cls: "wide", key: "turn_on", disabled: t.unavailable}));
    else L.append(tvTransport(card, t, true));
    const v = tvVolume(card, true, true);
    if (v) L.append(blk(c.volume_label || "Stereo volume", v));
    const k2 = ce("div", "k2");
    if (card._remoteCfg().entity) k2.append(key("Remote", "remote", () => remotePop(card, true), {key: "remote"}));
    k2.append(key(t.off ? "Turn on" : "Turn off", "pwr", () => card._power(), {key: "power", disabled: t.unavailable}));
    L.append(k2);
    if (card._sources.length || card._homeRun()) Rc.append(lab(c.source_label || "Source"), sourceGrid(card, t));
    med.append(L, Rc); root.append(med);
  }
  /* The remote (round 5, "I really like the remote": soft plastic, the red IR window flashes on each press). Keys run the
     TV remote's commands (jam-tv remote_card actions / commands win) and the stereo actions. Works while the TV is off. */
  function remoteBody(card) {
    const c = card._config, rc = card._remoteCfg(), st = c.stereo || null, t = tvState(card);
    const box = ce("div", "remote"), ir = ce("i", "irlens"); ir.setAttribute("aria-hidden", "true");
    const flash = () => { ir.classList.remove(C("tx")); void ir.offsetWidth; ir.classList.add(C("tx")); clearTimeout(ir._t); ir._t = setTimeout(() => ir.classList.remove(C("tx")), 120); };
    const run = k => () => {
      flash();
      if (k === "power") { card._power(); return; }
      if (rc.actions && rc.actions[k]) { runAction(card, card._hass, rc.actions[k], rc.entity); return; }
      if (!rc.entity) return;
      const cmd = (rc.commands && rc.commands[k]) || JAM_REMOTE_CMDS[k];
      if (cmd) jamCall(card, card._hass, "remote", "send_command", {entity_id: rc.entity, command: cmd}, "send");
    };
    const rkey = (k, glyph, label, o = {}) => {
      const b = ce("button", "rkey" + (o.cls ? " " + o.cls : "")); b.type = "button"; b.dataset.key = k;
      if (glyph) b.append(ic(glyph));
      if (o.text) b.append(ce("span", "", o.text));
      b.setAttribute("aria-label", label);
      if (o.on != null) b.dataset.on = String(!!o.on);
      if (o.repeat) jamHoldRepeat(b, o.fn || run(k), card); else b.addEventListener("click", o.fn || run(k));
      return b;
    };
    box.append(ir);
    const g1 = ce("div", "rg"); g1.append(ce("span", "engr", "TV"), rkey("power", "pwr", "TV power", {cls: "round", on: !t.off})); box.append(g1);
    const dp = ce("div", "dpad");
    for (const [k, g, cls] of [["up", "up", "u"], ["down", "down", "d"], ["left", "left", "l"], ["right", "right", "r"]]) {
      const z = ce("button", "dz " + cls); z.type = "button"; z.dataset.key = k; z.append(ic(g)); z.setAttribute("aria-label", k[0].toUpperCase() + k.slice(1));
      jamHoldRepeat(z, run(k), card); dp.append(z);
    }
    const ok = ce("button", "okk", "OK"); ok.type = "button"; ok.dataset.key = "ok"; ok.addEventListener("click", run("ok")); dp.append(ok);
    box.append(dp);
    const r4 = ce("div", "rk4");
    r4.append(rkey("back", "back", "Back", {text: "Back"}), rkey("home", "home", "Home", {text: "Home"}), rkey("menu", "menu", "Menu", {text: "Menu"}), rkey("settings", "set", "Setup", {text: "Setup"}));
    box.append(r4);
    const r3 = ce("div", "rk3"); r3.append(rkey("rewind", "rew", "Rewind"), rkey("play_pause", "play", "Play or pause"), rkey("forward", "ff", "Forward")); box.append(r3);
    if (st) {
      box.append(ce("div", "seam"));
      const g2 = ce("div", "rg"); g2.append(ce("span", "engr", st.title || "Stereo"));
      if (st.power_action) g2.append(rkey("stereo_power", "pwr", (st.title || "Stereo") + " power", {cls: "round", on: true, fn: () => { flash(); runAction(card, card._hass, st.power_action); }}));
      box.append(g2);
      const v3 = ce("div", "rk3");
      if (st.volume_down_action) v3.append(rkey("s_vol_down", "minus", "Volume down", {repeat: true, fn: () => { flash(); runAction(card, card._hass, st.volume_down_action); }}));
      if (st.mute_action) v3.append(rkey("s_mute", "mute", "Mute", {text: "Mute", fn: () => { flash(); runAction(card, card._hass, st.mute_action); }}));
      if (st.volume_up_action) v3.append(rkey("s_vol_up", "plus", "Volume up", {repeat: true, fn: () => { flash(); runAction(card, card._hass, st.volume_up_action); }}));
      if (v3.children.length) box.append(v3);
      const ins = (st.inputs || []).filter(Boolean).slice(0, 3);
      if (ins.length) {
        const ie = stateObj(card._hass, st.input_entity), curIn = ie && !dead(ie) ? lc(ie.state) : null;
        const r = ce("div", "rk3 inp");
        ins.forEach((x, i) => {
          const on = !!curIn && lc((x.match) || x.name) === curIn;
          const b = rkey("s_in" + i, null, x.name || `Input ${i + 1}`, {fn: () => { flash(); runAction(card, card._hass, x.tap_action); }});
          b.setAttribute("aria-pressed", String(on)); b.prepend(ind("sq", on)); b.append(ce("span", "", x.name || `Input ${i + 1}`));
          r.append(b);
        });
        box.append(r);
      }
    }
    return box;
  }
  function remotePop(card, kiosk) {
    const c = card._config, rc = card._remoteCfg(), {device} = tvNames(card), keys = [];
    if (rc.entity && !(rc.actions && rc.actions.keyboard)) keys.push(key("Keyboard", "kb", () => {
      if (card._kb && card._kb.isOpen()) return;
      card._kb = jamRemoteKeyboard(card._body || card, {entity: rc.entity, name: device, title: "Keyboard", hass: () => card._hass, onClose: () => { card._kb = null; }});
    }, {key: "keyboard"}));
    const api = popup(card, {kicker: `TV${device && device !== "TV" ? " · " + device : ""}`, title: c.remote_title || "Remote", keys, kiosk, cls: "rem", fill: body => body.append(remoteBody(card))});
    // kiosk: the remote beside its title, keys and a note (the mockup's 600px pop-up)
    if (kiosk) { const hd = api.face.querySelector(".head"); if (hd) hd.append(ce("span", "note", "The IR window at the top flashes red on each press.")); }
  }

  /* ---------- jam-speaker: name row, grille face + title, transport, volume fader; speaker pop-up ---------- */
  function spkState(card) {
    const c = card._config, h = card._hass, s = stateObj(h, c.entity), a = (s && s.attributes) || {};
    const off = dead(s), playing = !off && s.state === "playing", active = !off && ["playing", "paused", "buffering"].includes(s.state);
    return {s, a, off, playing, active, title: a.media_title || "", by: a.media_artist || ""};
  }
  function spkName(card) { const c = card._config; return c.name || friendly(card._hass, c.entity); }
  R["jam-speaker"] = (card, b) => {
    const c = card._config, p = spkState(card), name = spkName(card), kio = c.size === "kiosk";
    const root = ce("div", "cm" + (kio ? " kio kspk" : " cw mc")); root.dataset.st = p.active ? "on" : "off";
    b.append(root);
    if (kio) { spkKiosk(card, root, p); if (card._cmPop) fillPop(card); return true; }
    const word = p.off ? OFFLINE : p.playing ? "Playing" : p.active ? "Paused" : p.title ? "Idle · last played" : "Idle";
    root.append(nameRow({glyph: og("spk"), name: /speaker/i.test(name) ? name : name + " speaker", word, wordCls: p.off ? "al" : "", open: () => spkPop(card), label: `${name} speaker: open`}));
    root.append(spkNow(p, false));
    root.append(spkTransport(card, p, true));
    const vr = ce("div", "vrow"); vr.append(lab("Vol"), spkFader(card, p, "quiet")); root.append(vr);
    if (card._cmPop) fillPop(card);
    return true;
  };
  function spkNow(p, withLabel) {
    const np = ce("div", "np"), t = ce("span");
    if (withLabel) t.append(lab(p.off ? OFFLINE : p.playing ? "Playing" : p.active ? "Paused" : p.title ? "Idle · last played" : "Idle"));
    t.append(ce("span", "mtitle", p.title || (p.off ? OFFLINE : "Nothing played yet")), ce("span", "msub", p.by));
    np.append(grille(p.playing), t);
    return np;
  }
  function spkTransport(card, p, orange) {
    const id = card._config.entity, call = svc => () => jamCall(card, card._hass, "media_player", svc, {entity_id: id});
    const k3 = ce("div", "k3");
    k3.append(key("", "prev", call("media_previous_track"), {aria: "Previous track", key: "prev", disabled: p.off}),
      key(p.playing ? "Pause" : "Play", p.playing ? "pause" : "play", call("media_play_pause"), {cls: orange && p.playing ? "or" : orange === "always" ? "or" : "", key: "play_pause", disabled: p.off}),
      key("", "next", call("media_next_track"), {aria: "Next track", key: "next", disabled: p.off}));
    return k3;
  }
  function spkFader(card, p, cls, id) {
    const eid = id || card._config.entity, s = id ? stateObj(card._hass, id) : p.s;
    const v = Math.round((Number(s && s.attributes.volume_level) || 0) * 100);
    const setV = x => jamCall(card, card._hass, "media_player", "volume_set", {entity_id: eid, volume_level: x / 100});
    return fader({card, orient: "h", value: v, lit: true, alwaysLit: true, cls, label: friendly(card._hass, eid) + " volume", disabled: dead(s), live: setV, commit: setV});
  }
  function grpRows(card, list) {
    const c = card._config, h = card._hass, me = stateObj(h, c.entity), meOk = !dead(me) && jamCanGroup(me);
    const lst = ce("div", (list ? "cw " : "") + "lst");
    const mine = ce("div", "lr"), mt = ce("span"); mt.append(ce("span", "nm", spkName(card)), ce("span", "wd", "This speaker")); mine.append(mt, ce("span")); lst.append(mine);
    for (const x of card._speakers) {
      const o = stateObj(h, x.entity), ok = meOk && !dead(o) && jamCanGroup(o), joined = card._isJoined(x.entity);
      const row = ce("div", "lr"), t = ce("span");
      t.append(ce("span", "nm", x.name || friendly(h, x.entity)), ce("span", "wd", dead(o) ? OFFLINE : joined ? "Grouped" : "Separate"));
      row.append(t, jamSwitch({on: joined, offline: dead(o), disabled: !ok, kind: "set", big: c.size === "kiosk", label: `${x.name || friendly(h, x.entity)}: play together`,
        onToggle: nv => (nv ? jamCall(card, card._hass, "media_player", "join", {entity_id: c.entity, group_members: [x.entity]}) : jamCall(card, card._hass, "media_player", "unjoin", {entity_id: x.entity}))}));
      lst.append(row);
    }
    return lst;
  }
  function grpText(card) {
    const h = card._hass, g = card._speakers.filter(x => card._isJoined(x.entity)).map(x => x.name || friendly(h, x.entity));
    return g.length ? "Playing together with " + g.join(", ") + "." : "Playing on its own.";
  }
  function spkPop(card) {
    const c = card._config, keys = [];
    keys.push(key("Library", "lib", () => card._openPanel(), {key: "library"}));
    popup(card, {kicker: "Speaker", title: spkName(card), keys, fill: body => {
      const p = spkState(card);
      body.append(spkNow(p, true), spkTransport(card, p, "always"), blk("Volume", spkFader(card, p, "")));
      if (card._speakers.length) {
        const head = ce("div", "bh"); head.append(lab("Speakers"));
        head.append(key(card._cmGrp ? "Done" : "Group or split", "spk", () => { card._cmGrp = !card._cmGrp; fillPop(card); }, {key: "grp"}));
        body.append(blk(head, card._cmGrp ? grpRows(card, true) : ce("span", "note", grpText(card))));
      }
    }, onClose: () => { card._cmGrp = false; }});
  }
  /* Kiosk Music sheet body (size: kiosk): left = player (face, transport, big volume); right = speakers, group or split. */
  function spkKiosk(card, root, p) {
    const med = ce("div", "kmed"), L = ce("div", "cw kcol"), Rc = ce("div", "cw kcol");
    L.append(spkNow(p, true), spkTransport(card, p, true), blk("Volume", spkFader(card, p, "big")));
    if (card._speakers.length) Rc.append(lab("Speakers · group or split"), grpRows(card, false), ce("span", "note", grpText(card)));
    else Rc.append(lab("Library"), key("Browse", "lib", () => card._openPanel(), {key: "library"}));
    med.append(L, Rc); root.append(med);
  }

  /* ---------- jam-media compact (the PC row): name row + Sleep / Wake ---------- */
  R["jam-media"] = (card, b) => {
    const c = card._config;
    if (!c.compact && !(c.size === "kiosk" && c.title_entity)) return false;
    const h = card._hass, np = card._np(), ss = np.ss, st = ss ? lc(ss.state) : "", off = np.off;
    const awake = !off && (st === "on" || st === "playing" || st === "idle"), name = c.name ? (/pc$/i.test(c.name) ? c.name : c.name + " PC") : np.name;
    const vol = card._subParts(np).find(x => /vol/i.test(x));
    const word = off ? OFFLINE : awake ? (np.title && np.title !== "Idle" ? "Playing · " + np.title : "Awake · idle") : st === "asleep" ? "Asleep" : "Off";
    const root = ce("div", "cm cw pcrow" + (c.size === "kiosk" ? " kio" : "")); root.dataset.st = awake ? "on" : "off";
    root.append(nameRow({glyph: og("pc"), name, word, wordCls: off ? "al" : "", open: c.more ? () => card._moreKey("").click() : () => moreInfo(card, c.state_entity || c.title_entity), label: `${name}: open`}));
    const act = awake ? c.sleep_action : c.wake_action;
    if (act) root.append(key(awake ? "Sleep" : "Wake", "moon", () => runAction(card, card._hass, act), {key: awake ? "sleep" : "wake", disabled: off && !c.wake_action}));
    void vol;
    b.append(root);
    return true;
  };

  /* ---------- jam-kiosk: room, door, clock, date, one weather line, three keys; full-screen sheets that never scroll ---------- */
  const KG = {lights: "lamp", light: "lamp", tv: "tv", music: "spk", speaker: "spk", "all off": "off", alloff: "off", pc: "pc", air: "air"};
  R["jam-kiosk"] = (card, force) => {
    const c = card._config, h = card._hass, root = card.shadowRoot;
    let K = card._cm;
    if (force || !K || !K.root.isConnected || K.look !== card.dataset.look) {
      root.textContent = "";
      jamStyle(root, card.css(), card.dataset.look);
      card._body = ce("div", "host");
      const k = ce("div", "cm kio khome"); k.setAttribute("role", "presentation");
      card._body.append(k); root.append(card._body);
      K = card._cm = {root: k, look: card.dataset.look};
      card._k = k; card._lock = null; card._blocks = [];
      if (card._kh) k.style.setProperty("--kh", card._kh + "px");
    }
    const k = K.root, echo = (card._kh || innerHeight) < 680;
    k.classList.toggle(C("echo"), echo);
    k.toggleAttribute("data-n", isNight(card._body));
    k.textContent = "";
    // top: room + the door
    const top = ce("div", "ktop");
    top.append(ce("span", "kplace", c.title || c.name || area(h, c.lock_entity) || ""));
    if (c.lock_entity) {
      const d = doorState(h, c.lock_entity), led = ind("led", d.sev !== "off", d.sev === "ok" ? "var(--cok)" : d.sev === "warn" ? "var(--cwarn)" : "var(--calert)");
      const door = ce("button", "kdoor"); door.type = "button"; door.dataset.key = "door";
      const t = ce("span", "kdt"); t.append(ce("span", "nm", c.lock_name || "Front door"), ce("span", "wd " + d.sev, d.word));
      door.append(t, led); door.setAttribute("aria-label", `${c.lock_name || "Front door"}, ${d.word.replace("▲ ", "")}`);
      door.addEventListener("click", () => moreInfo(card, c.lock_entity));
      if (d.sev === "warn" || d.sev === "alert") { const kl = ce("div", "klock"); kl.append(door, lockKey(card, c.lock_entity, d)); top.append(kl); }
      else top.append(door);
    }
    // clock
    const now = new Date(), f = typeof jamWxTime === "function" ? jamWxTime(h) : {h12: true}, clk = ce("div", "clk"), t = ce("div", "clt num");
    const hh = now.getHours(), mm = String(now.getMinutes()).padStart(2, "0");
    t.append(document.createTextNode(f.h12 ? `${hh % 12 || 12}:${mm}` : `${String(hh).padStart(2, "0")}:${mm}`));
    if (f.h12) t.append(ce("small", "", hh < 12 ? "AM" : "PM"));
    clk.append(t, ce("div", "d", jamDateText(now, (h.locale && h.locale.language) || h.language)));
    const facts = [], num = id => { const s = stateObj(h, id); return s && !dead(s) && isFinite(Number(s.state)) ? Math.round(Number(s.state)) : null; };
    if (num(c.inside_entity) != null) facts.push(`${num(c.inside_entity)}° inside`);
    const wx = (c.now || []).find(x => x.type === "weather"), ws = wx && stateObj(h, wx.entity);
    if (ws && !dead(ws)) {
      const tt = wx.temperature_entity && num(wx.temperature_entity) != null ? num(wx.temperature_entity) : Math.round(Number(ws.attributes.temperature));
      facts.push(`${tt}° ${lc(conditionWord(ws.state))}`);
      const hi = K.hi; if (hi) facts.push(hi);
    }
    if (facts.length) clk.append(ce("div", "f", facts.join(" · ")));
    // dock
    const dock = ce("div", "dock"), blocks = c.dock.slice(0, 3);
    dock.style.setProperty("--n", blocks.length);
    const orangeTaken = !!(c.lock_entity && doorState(h, c.lock_entity).sev !== "ok");
    let orange = !orangeTaken;
    blocks.forEach(bk => {
      const kt = ce("div", "kt"), open = ce("button", "open"); open.type = "button";
      const g = KG[lc(bk.glyph || bk.name)] || (bk.state && bk.state.count_on ? "lamp" : "plug");
      let glyph;
      const st = bk.state || {};
      if (g === "lamp") { // the first lit lamp's own drawing (or the first lamp's), in its colour
        const ids = (st.count_on || []).filter(id => /^light\./.test(id)), lit = ids.map(id => stateObj(h, id)).find(s => s && s.state === "on");
        const ref = lit || stateObj(h, ids[0]);
        glyph = lamp(ref ? lampKind({}, friendly(h, ref.entity_id), Array.isArray(ref.attributes.entity_id)) : "table", !!lit, lit ? cssRgb(lampRgb(lit)) : null); }
      else glyph = og(g === "off" ? "off" : g);
      const txt = ce("span"), word = dockWord(card, bk) || "";
      txt.append(ce("span", "nm", bk.name), ce("span", "wd", word));
      open.append(glyph, txt);
      open.setAttribute("aria-label", bk.name + (word ? ", " + word : ""));
      open.addEventListener("click", () => cmKioskTap(card, bk));
      kt.append(open);
      const ms = st.entity && /^media_player\./.test(st.entity) ? stateObj(h, st.entity) : null;
      if (ms && ms.state === "playing") {
        kt.append(key("", "pause", () => jamCall(card, card._hass, "media_player", "media_pause", {entity_id: st.entity}), {cls: orange ? "or" : "", aria: `Pause ${bk.name.toLowerCase()}`, key: "pause:" + bk.name}));
        orange = false;
      }
      dock.append(kt);
    });
    const kh = ce("div", "kh"); kh.append(top, clk, dock);
    // The mockup measures from the screen edge (44 / 40px; Echo 34 / 28-30px): take off what HA's view already pads.
    const r = card.getBoundingClientRect(), side = echo ? 34 : 44, tb = echo ? 28 : 40, bt = echo ? 30 : 40;
    k.style.setProperty("--kpl", Math.max(12, side - r.left) + "px"); k.style.setProperty("--kpr", Math.max(12, side - (innerWidth - r.right)) + "px");
    k.style.setProperty("--kpt", Math.max(12, tb - r.top) + "px"); k.style.setProperty("--kpb", Math.max(12, bt - 16) + "px");
    k.append(kh);
    // the weather line's "high 70°" from the hourly forecast (subscribed once, quietly)
    if (wx && !K.sub) {
      K.sub = true;
      try {
        h.connection.subscribeMessage(ev => {
          // the card left Calm (or the page): stop listening
          if (card._cm !== K || !card.isConnected || card.dataset.look !== "calm") { if (K.unsub) { try { K.unsub(); } catch (e) { /* gone */ } K.unsub = null; } K.sub = false; return; }
          const fc = (ev && ev.forecast) || [], day = new Date().toDateString();
          let today = fc.filter(x => new Date(x.datetime).toDateString() === day);
          if (!today.length && fc.length) today = [fc[0]]; // a daily forecast that starts tomorrow: its first day
          if (!today.length) return;
          const night = dark(card._hass), v = night ? Math.min(...today.map(x => Number(x.templow ?? x.temperature))) : Math.max(...today.map(x => Number(x.temperature)));
          const nh = isFinite(v) ? `${night ? "low" : "high"} ${Math.round(v)}°` : null;
          if (nh !== K.hi) { K.hi = nh; cmRedraw(card); }
        }, {type: "weather/subscribe_forecast", forecast_type: "daily", entity_id: wx.entity}).then(u => { K.unsub = u; }, () => {});
      } catch (e) { /* no forecast */ }
    }
    if (card._jamSheet) card._jamSheet.hass(h);
    card._fit();
    return true;
  };
  /* The word under a dock key: lights "3 on" / "All off"; a TV "On · Nerv//OS" (the source on screen, from the block's jam-tv
     sources), its title while playing, "Off"; a speaker "Playing · Saturn" / "Idle". */
  function dockWord(card, bk) {
    const h = card._hass, st = bk.state || {};
    if (st.count_on) { const n = card._countOn(st); return n ? n + " on" : "All off"; }
    const s = st.entity && /^media_player\./.test(st.entity) ? stateObj(h, st.entity) : null;
    if (!s) return card._stateText(st);
    if (dead(s)) return OFFLINE;
    if (s.state === "off" || s.state === "standby") return "Off";
    const tvc = (bk.cards || []).find(x => x && x.type === "custom:jam-tv" && x.media_player === st.entity), T = customElements.get("jam-tv");
    if (["playing", "paused"].includes(s.state) && s.attributes.media_title) return (tvc ? (s.state === "paused" ? "Paused · " : "") : s.state === "playing" ? "Playing · " : "Paused · ") + s.attributes.media_title;
    if (tvc && T) {
      const o = Object.create(T.prototype); o._config = tvc; o._hass = h;
      const a = o._activeSource(); return a && a.name ? "On · " + a.name : "On";
    }
    return s.state === "idle" ? "Idle" : card._stateText(st);
  }
  /* A dock key: its sheet (full screen; `rows` on the block = cards per row: [1, 4, 2] = scenes / four lights / purifier +
     all off, the rows with lights or switches fill the height) or its action (a confirmation opens the Calm pop-up). */
  function cmKioskTap(card, bk) {
    const tap = card._tapOf(bk);
    if (tap === "action") {
      const a = bk.tap_action;
      if (a && a.confirmation) { confirmPop(card, bk, a); return; }
      runAction(card, card._hass, a); return;
    }
    if (tap !== "sheet") return;
    // rows: [1, 4, [3, 2]] = cards per row (a list = their widths); a row of lights / switches / players takes the height left.
    const cards = bk.cards || [], rows = Array.isArray(bk.rows) ? bk.rows.map(r => (Array.isArray(r) ? r.map(Number).filter(n => n > 0) : Array(Math.max(1, Number(r) || 1)).fill(1))) : null;
    let css = "";
    if (rows && rows.reduce((s, r) => s + r.length, 0) === cards.length) {
      const N = 60;
      let i = 0;
      const rowCss = [];
      rows.forEach((ws, r) => {
        const kinds = cards.slice(i, i + ws.length).map(x => String(x && x.type) + (x && x.size === "kiosk" ? ":k" : ""));
        rowCss.push(kinds.some(x => /jam-(light|tile)(:k)?$|jam-(tv|speaker):k$/.test(x)) ? "minmax(0,1fr)" : "auto");
        const sum = ws.reduce((a, b) => a + b, 0);
        let used = 0;
        ws.forEach((w, j) => { const span = j === ws.length - 1 ? N - used : Math.round(N * w / sum); used += span; css += `.body > :nth-child(${i + j + 1}){grid-column:span ${span};grid-row:${r + 1}}`; });
        i += ws.length;
      });
      css = `.body{grid-template-columns:repeat(${N},minmax(0,1fr));grid-template-rows:${rowCss.join(" ")};align-items:stretch}.body > *{min-height:0;height:100%}` + css;
    } else if (cards.some(x => x && x.size === "kiosk" && /jam-(tv|speaker)$/.test(String(x.type))))
      css = ".body{grid-template-rows:minmax(0,1fr);grid-auto-rows:auto;align-items:stretch}.body > :first-child{min-height:0}";
    jamCardSheet(card, {title: bk.title || bk.name, kicker: bk.kicker, cards, fullscreen: true, css});
    if (card._jamSheet) card._jamSheet.sheet.pop.toggleAttribute("data-n", isNight(card._jamSheet.sheet.root));
  }
  function confirmPop(card, bk, a) {
    const h = card._hass, ids = [].concat((a.target && a.target.entity_id) || (a.data && a.data.entity_id) || []);
    const lit = ids.map(id => stateObj(h, id)).filter(s => s && s.state === "on");
    popup(card, {kicker: bk.confirm_kicker || "The house", title: (bk.confirm_title || bk.name.replace(/\.*$/, "")) + "?", kiosk: true, cls: "conf", fill: (body, api) => {
      const box = ce("div", "cw conf");
      box.append(ce("span", "big", lit.length ? `${lit.length} light${lit.length > 1 ? "s are" : " is"} on: ${lit.map(s => s.attributes.friendly_name || s.entity_id).join(", ")}.` : "All lights are already off."));
      box.append(ce("span", "note", typeof a.confirmation === "object" && a.confirmation.text ? a.confirmation.text : "Plugs, the purifier and the speakers stay as they are."));
      const k2 = ce("div", "k2");
      k2.append(key("Cancel", null, () => api.close(), {cls: "big", key: "cancel"}), key("Turn them off", null, () => { runAction(card, card._hass, {...a, confirmation: false}); api.close(); }, {cls: "big", key: "confirm", disabled: !lit.length}));
      box.append(k2); body.append(box);
    }});
  }

  /* The whole-card hook: a card Calm knows is drawn here (true); any other card renders as usual (false). A card under a
     fader drag keeps its body until the release (then cmRedraw draws the latest state). */
  function calmRender(card, body) {
    const fn = R[card.localName];
    if (!fn) return false;
    if (card.localName === "jam-kiosk") return fn(card, body);
    if (card._cmDrag) { card._cmPending = true; return true; }
    body.textContent = "";
    body.toggleAttribute("data-n", isNight(body));
    try { return !!fn(card, body); } catch (e) { console.error("jam-cards calm:", card.localName, e); body.textContent = ""; return false; }
  }

  /* =====================================================================================================================
     CSS (the mockup's, with the theme tokens; every class lives in the card's own shadow root or a Calm sheet)
     ===================================================================================================================== */
  const CALM_CSS = `
:host,.pop{--cgd:var(--jam-ground,var(--ink));--cpl:var(--slab);--ckey:var(--slab2);--ckey2:var(--slab3);--cln:var(--line);--chair:var(--jam-hair,var(--line));
  --cink:var(--fg);--cdim:var(--dim);--cwal:var(--living);--ccream:#f3e6c8;--cor:var(--ochre);--cok:var(--jam-ok,#7bd651);--cokg:var(--green);
  --cwarn:var(--jam-warn,#f2c14e);--cwink:var(--jam-warn-text,var(--fg));--calert:var(--red);--calink:var(--alert-text);--cwin:var(--jam-win,var(--ink));
  --cwn:var(--jam-win-off,var(--slab2));--cwrim:var(--jam-win-rim,var(--line));--cgroove:var(--jam-groove,var(--slab2));--ccap:var(--jam-cap,var(--slab));
  --cseg:var(--jam-readout,var(--ink));--csegg:var(--jam-readout-off,var(--slab3));--cdot:var(--jam-dot,var(--line));--settle:cubic-bezier(.16,1,.3,1);
  --cmono:${MONO};-webkit-font-smoothing:antialiased}
.c-cm{font-family:var(--body);color:var(--cink);-webkit-tap-highlight-color:transparent}
.c-cm *,.pop.c-cmp .body *{box-sizing:border-box}
.c-cm button,.pop .body button{font-family:inherit;color:inherit}
.c-cm button:focus-visible,.pop button:focus-visible,.c-cm [role=slider]:focus-visible,.pop [role=slider]:focus-visible{outline:2px solid var(--cink);outline-offset:2px}
.c-lab{font:500 12px var(--cmono);letter-spacing:.16em;text-transform:uppercase;color:var(--cdim)}
.c-note{font-size:14px;color:var(--cdim)}
.num{font-variant-numeric:tabular-nums}
/* glyphs */
.c-cg{display:block;flex:none}
.c-ic{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.c-ic .c-f{fill:currentColor;stroke:none}
.c-og{width:30px;height:30px;fill:none;stroke:var(--cink);stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
[data-st=off] .c-og{stroke:var(--cdim)}
.c-lg{width:30px;height:30px}
.c-lg .c-o{fill:none;stroke:var(--cink);stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
.c-lg .c-s{fill:var(--cwn);stroke:var(--cink);stroke-width:1.5;stroke-linejoin:round;transition:fill calc(300ms * var(--jam-motion,1)) var(--settle)}
.c-lg.c-on .c-s{fill:var(--lc)}
.c-pwg{stroke:var(--cdim);stroke-width:2.2;transition:stroke calc(300ms * var(--jam-motion,1))}
.c-pwg.c-on{stroke:var(--cokg)}
/* indicator windows (status only: the door, the remote's inputs, a playing grille dot) */
.c-ind{position:relative;display:inline-block;flex:none;background:var(--cwn);box-shadow:inset 0 0 0 1px var(--cwrim);vertical-align:middle;font-style:normal}
.c-ind.c-on{background:var(--cwin)}
.c-ind::after{content:"";position:absolute;inset:1.5px;border-radius:inherit;background:var(--c,var(--ccream));opacity:0}
.c-ind.c-on::after{opacity:1}
.c-ind.c-led{width:10px;height:10px;border-radius:50%}.c-ind.c-sq{width:10px;height:10px;border-radius:2px}
/* keys: flat, a hairline; pressed = deeper paper + ink edge; .c-or = the one action; .c-red = alert */
.c-k{appearance:none;position:relative;border:1px solid var(--cln);cursor:pointer;border-radius:12px;background:var(--ckey);color:var(--cink);min-height:44px;padding:8px 14px;
  font:500 15px/1.15 var(--body);display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform 80ms;text-align:center;min-width:44px}
.c-k:active{transform:translateY(1px)}
.c-k[aria-pressed=true]{background:var(--ckey2);border-color:var(--cink)}
.c-k.c-or{background:var(--cor);border-color:var(--cor);color:#1a1206}
.c-k.c-red{background:var(--calert);border-color:var(--calert);color:#1c0804}
.c-k:disabled{cursor:default;color:var(--cdim)}
.c-k.c-dash{background:transparent;border-style:dashed;color:var(--cdim)}
.c-k .c-ic{width:16px;height:16px}
.c-k.c-wide{width:100%}.c-k.c-big{min-height:52px}
/* cards: a panel with a hairline and soft corners */
.c-cw{background:var(--cpl);border:1px solid var(--cln);border-radius:16px;min-width:0;position:relative}
.c-cmb,.host{height:100%}
/* the name row: symbol, name, state word, › */
.c-pn{appearance:none;border:0;background:none;padding:0;cursor:pointer;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:start;text-align:left;min-height:44px;width:100%;color:var(--cink)}
.c-pn.c-static{cursor:default}
.c-pn .c-pt{min-width:0}
.c-pn .c-nm{font:500 17px/1.15 var(--body);display:block;overflow-wrap:anywhere}
.c-pn .c-wd{font:500 12px var(--cmono);letter-spacing:.12em;text-transform:uppercase;color:var(--cdim);display:block;margin-top:4px}
.c-pn .c-wd.c-al{color:var(--calink)}
.c-pn .c-chev{font:400 20px/1 var(--body);color:var(--cdim);padding-top:1px}
[data-st=off] .c-pn .c-nm{color:var(--cdim)}
/* light card: name row over [rocker | fader] */
.c-lc{padding:12px;display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%}
.c-pb{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:10px;min-height:104px}
.c-pb.c-solo{grid-template-columns:1fr}
.c-lc[data-st=offline]{background:transparent;border:1.5px dashed var(--cdim)}
.c-ofx{display:grid;gap:10px;align-content:start;justify-items:start}
.c-tg{display:grid;align-content:end;border-radius:12px}
/* the rocker (paddle-off): one object; ON = the I half pressed, OFF = the O half pressed; a thin lamp-colour band on the pressed I half */
.c-rk{position:relative;box-sizing:border-box;display:grid;grid-template-rows:1fr 1fr;overflow:hidden;padding:0;min-height:96px;cursor:pointer;
  background:var(--pd-up,var(--cpl));border:1.5px solid var(--pd-rim,var(--cln));border-radius:12px;--pd-sym:18px;--pd-sw:4;--pd-ew:3px;--pd-band:5px;transform-origin:50% 50%}
.c-rk i{position:relative;display:flex;align-items:center;justify-content:center;font-style:normal;min-width:0;background:var(--pd-up,var(--cpl));color:var(--cink)}
.c-rk .c-pd-off{border-top:1px solid var(--pd-rim,var(--cln))}
.c-rk svg{display:block;flex:none;width:var(--pd-sym);height:var(--pd-sym);overflow:visible}
.c-rk svg *{fill:none;stroke:currentColor;stroke-width:var(--pd-sw);stroke-linecap:butt}
.c-rk[aria-pressed=true] .c-pd-on,.c-rk[aria-pressed=false] .c-pd-off{background:var(--pd-in,var(--ckey2))}
.c-rk[aria-pressed=true] .c-pd-off{box-shadow:inset 0 var(--pd-ew) 0 var(--pd-edge,var(--cln))}
.c-rk[aria-pressed=false] .c-pd-on{box-shadow:inset 0 calc(var(--pd-ew) * -1) 0 var(--pd-edge,var(--cln))}
.c-rk[aria-pressed=true] .c-pd-on{box-shadow:inset 0 var(--pd-band) 0 var(--lc,var(--ccream))}
.c-rk:disabled{cursor:default;background:transparent;border:1.5px dashed var(--cdim)}
.c-rk:disabled i{background:transparent;color:var(--cdim)}
@keyframes cm-rock-on{0%{transform:perspective(240px) rotateX(-9deg)}55%{transform:perspective(240px) rotateX(9deg)}100%{transform:none}}
@keyframes cm-rock-off{0%{transform:perspective(240px) rotateX(9deg)}55%{transform:perspective(240px) rotateX(-9deg)}100%{transform:none}}
.c-rk.c-rock-on{animation:cm-rock-on 150ms var(--settle)}.c-rk.c-rock-off{animation:cm-rock-off 150ms var(--settle)}
.c-rk.c-mini{width:52px;height:48px;min-height:0;border-radius:9px;--pd-sym:12px;--pd-sw:4;--pd-ew:2px;--pd-band:3px}
/* faders: a flat groove, the fill in the lamp's colour (cream for volume), a flat cap with an ink rim */
.c-vf{position:relative;border-radius:10px;background:var(--cgroove);border:1px solid var(--cln);cursor:ns-resize;touch-action:none;min-height:96px;--vn:0}
.c-vf::before,.c-hf::before{content:"";position:absolute;inset:-4px}
.c-vf .c-fl{position:absolute;left:3px;right:3px;bottom:3px;height:calc((100% - 6px) * var(--vn));border-radius:7px;background:var(--lc,var(--ccream));opacity:0;transition:opacity 200ms}
.c-vf.c-lit .c-fl{opacity:1}
.c-vf .c-cp{position:absolute;left:-1px;right:-1px;height:18px;bottom:calc((100% - 18px) * var(--vn));border-radius:6px;background:var(--ccap);border:1.5px solid var(--cink);display:grid;place-items:center;font-style:normal}
.c-vf .c-cp b{font:600 12px var(--cmono);color:#19202e;opacity:0}
.c-vf[data-drag] .c-cp b,.c-kio .c-vf .c-cp b{opacity:1}
.c-vf.c-dis{cursor:default;background:transparent;border:1.5px dashed var(--cln)}.c-vf.c-dis .c-cp,.c-vf.c-dis .c-fl{display:none}
.c-hf{position:relative;height:48px;border-radius:12px;background:var(--cgroove);border:1px solid var(--cln);cursor:ew-resize;touch-action:none;--vn:0;min-width:0}
.c-hf .c-fl{position:absolute;top:3px;bottom:3px;left:3px;width:calc((100% - 6px) * var(--vn));border-radius:9px;background:var(--lc,var(--ccream));opacity:0}
.c-hf.c-lit .c-fl{opacity:1}
.c-hf .c-cp{position:absolute;top:-1px;bottom:-1px;width:46px;left:calc((100% - 46px) * var(--vn));border-radius:10px;background:var(--ccap);border:1.5px solid var(--cink);display:grid;place-items:center;font-style:normal}
.c-hf .c-cp b{font:600 14px var(--cmono);color:#19202e}
.c-hf.c-quiet .c-cp b{opacity:0}.c-hf.c-quiet[data-drag] .c-cp b{opacity:1}
.c-hf.c-big{height:60px}.c-hf.c-big .c-cp{width:62px}.c-hf.c-big .c-cp b{font-size:17px}
.c-hf.c-sm{height:44px}.c-hf.c-sm .c-cp{width:44px}
.c-hf.c-dis{cursor:default;background:transparent;border:1.5px dashed var(--cln)}.c-hf.c-dis .c-cp,.c-hf.c-dis .c-fl{display:none}
.c-vrow{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}
.c-vsteps{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:8px}
.c-vsteps .c-k{padding:0}
/* the small switch in Calm (core .jsw): the house tokens */
.jsw:focus-visible{outline:2px solid var(--cink);outline-offset:3px}
.c-swrow{display:flex;justify-content:space-between;align-items:center;gap:10px;align-self:end;min-height:44px}
.c-sc{grid-template-rows:auto 1fr}
/* air purifier: a tiny appliance in the house paper */
.c-appl{padding:12px 14px 14px;display:grid;gap:12px}
.c-grille{height:16px;border-radius:4px;background:radial-gradient(circle,var(--cdot) 1.9px,transparent 2.4px) 0 0/9px 8px}
.c-appl .c-afc{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center}
.c-appl .c-ro{display:grid;gap:4px;justify-items:start}
.c-appl .c-u{font:500 12px var(--cmono);letter-spacing:.12em;color:var(--cdim)}
.c-appl .c-an{min-width:0;cursor:pointer}
.c-aname{font:500 17px var(--body);display:block}
.c-asub{font-size:14px;color:var(--cdim);display:block}
.c-seg7{display:inline-block;background:var(--cseg);border-radius:6px;padding:6px 8px}
.c-seg7 svg{display:block;height:24px;width:auto}
.c-seg7 .c-sg{fill:var(--csegg)}.c-seg7 .c-sg.c-on{fill:var(--ccream)}
.c-akeys{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:6px}
.c-akeys .c-k{font:500 14px var(--cmono);padding:8px 4px}
/* scenes: pills (a 4-up grid in a narrow column) */
.c-scn{display:flex;gap:8px;flex-wrap:wrap}
.c-scn .c-k{border-radius:999px;padding:8px 16px}
@container (max-width:420px){.c-scn{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.c-scn .c-k{border-radius:12px;padding:6px 4px;font-size:14px;line-height:1.1}}
:host{container-type:inline-size}
/* house strip */
.c-hs{padding:14px 16px;display:grid;gap:12px}
.c-hs .c-tp{display:flex;justify-content:space-between;gap:12px;align-items:flex-end}
.c-hs .c-big{font:300 40px/1 var(--body);letter-spacing:-.01em;color:var(--cink);cursor:pointer}
.c-hs .c-big small{font-size:18px;color:var(--cdim);margin-left:2px;letter-spacing:0}
.c-hs .c-rt{text-align:right}
.c-hs .c-rt .c-big{font-size:30px}
.c-hs .c-rt .c-big .c-w{font-size:18px;letter-spacing:0}
.c-hs .c-dr{display:flex;gap:10px;align-items:center;border-top:1px solid var(--chair);padding-top:12px;min-height:44px;cursor:pointer}
.c-hs .c-dr .c-w{flex:1;min-width:0;font:500 15px var(--body)}
.c-dw{font:500 12px var(--cmono);letter-spacing:.12em;text-transform:uppercase;color:var(--cdim);margin-left:6px}
.c-dw.c-warn{color:var(--cwink)}.c-dw.c-alert{color:var(--calink)}
.c-ppl{display:flex;gap:14px;flex-wrap:wrap;font-size:14px}
.c-ppl span{display:inline-flex;gap:6px;align-items:center}
.c-ptag{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:4px;background:var(--c);color:#fff;font:600 12px var(--cmono);font-style:normal}
.c-ppl .c-away{color:var(--cdim)}
.c-ppl .c-away .c-ptag{background:transparent;color:var(--cdim);box-shadow:inset 0 0 0 1.5px var(--cdim)}
/* room head */
.c-rh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:4px;padding:2px 2px 0}
.c-rh .c-rt{font:500 26px/1.1 var(--body)}
.c-rh .c-rc{font:500 13px var(--cmono);letter-spacing:.06em;color:var(--cdim)}
/* media cards */
.c-mc{padding:14px;display:grid;gap:12px;align-content:start}
.c-mtitle{font:500 21px/1.2 var(--body);display:block;overflow-wrap:anywhere}
.c-mtitle.c-xl{font-size:28px}
.c-msub{font:500 13px var(--cmono);letter-spacing:.06em;color:var(--cdim);display:block;margin-top:3px;overflow-wrap:anywhere}
.c-prog{height:3px;border-radius:2px;background:var(--chair);position:relative;overflow:hidden}
.c-prog i{position:absolute;inset:0 auto 0 0;background:var(--cink)}
.c-k3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.c-k2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.c-gr{width:64px;height:64px;border-radius:12px;background:var(--ckey);border:1px solid var(--cln);display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:10px;place-items:center;flex:none}
.c-gr i{width:7px;height:7px;border-radius:50%;background:var(--cdot)}
.c-gr i.c-on{background:var(--ccream);box-shadow:0 0 0 1.5px var(--cwin)}
.c-np{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}
.c-pcrow{padding:10px 12px 10px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
.c-sum{display:grid;gap:12px}
.c-sumh{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.c-sumh > span{display:grid;min-width:0}
/* lists */
.c-lst{display:grid}
.c-lr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 12px;min-height:60px}
.c-lr+.c-lr{border-top:1px solid var(--chair)}
.c-lr .c-nm{font:500 16px var(--body);display:block}
.c-lr .c-wd{font:500 12px var(--cmono);letter-spacing:.12em;text-transform:uppercase;color:var(--cdim);display:block;margin-top:2px}
.c-blk{display:grid;gap:8px}
.c-bh{display:flex;justify-content:space-between;align-items:center;gap:8px}
/* source tiles: the colour is a printed band; the one on screen presses in and says so */
.c-src{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.c-srt{appearance:none;cursor:pointer;border-radius:12px;background:var(--cpl);border:1px solid var(--cln);min-height:78px;padding:0 10px 9px;display:grid;align-content:space-between;justify-items:start;text-align:left;overflow:hidden;color:var(--cink)}
.c-srt .c-tab{display:block;height:6px;width:calc(100% + 20px);margin:0 -10px;background:var(--c)}
.c-srt .c-nm{font:500 15px/1.15 var(--body)}
.c-srt .c-on{font:500 12px var(--cmono);letter-spacing:.1em;text-transform:uppercase;color:var(--cdim)}
.c-srt[aria-pressed=true]{background:var(--ckey2);border-color:var(--cink)}
.c-srt[aria-pressed=true] .c-on{color:var(--cink)}
/* light pop-up parts */
.c-wh{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.c-wh .c-k{flex-direction:column;gap:6px;padding:0 0 8px;min-height:72px;font-size:13.5px;overflow:hidden;justify-content:flex-start;min-width:0}
.c-wh .c-k .c-cc{display:block;width:100%;height:20px;background:var(--c);border-bottom:1px solid var(--cln)}
.c-wh .c-k small{font:400 12px var(--cmono);color:var(--cdim)}
.c-hue{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));height:44px;border-radius:12px;overflow:hidden;border:1px solid var(--cln)}
.c-hue button{appearance:none;border:0;cursor:pointer;background:var(--c);position:relative;padding:0;min-width:0}
.c-hue button[aria-pressed=true]::after{content:"";position:absolute;left:50%;bottom:6px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#19202e;box-shadow:0 0 0 2px #fff}
.c-yc{display:flex;gap:8px;flex-wrap:wrap}
.c-chips3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.c-chips3 .c-k{padding:8px 6px;font-size:14px}
.c-swin{width:30px;height:16px;border-radius:4px;background:var(--c);border:1px solid var(--cln);display:block}
.c-mem{display:grid;grid-template-columns:minmax(0,92px) minmax(0,1fr) auto;gap:10px;align-items:center;font-size:15px}
.c-ofl{padding:16px;display:grid;gap:12px;justify-items:start;border-style:dashed;background:transparent}
.c-conf{padding:16px;display:grid;gap:14px}
.c-kalloff{display:grid;gap:10px;align-content:center;padding:16px;height:100%}
.c-gh{border-top:1px solid var(--cln);padding-top:10px;margin-top:4px}
.c-conf .c-big{font-size:17px}
/* the remote (round 5, kept exactly: soft plastic, the red IR window at the top) */
.c-remote{position:relative;width:264px;margin:10px auto 4px;border-radius:46px 46px 66px 66px;padding:34px 18px 24px;display:grid;gap:14px;
  background:linear-gradient(180deg,#ece9e3,#d3cfc8);box-shadow:inset 0 3px 2px #ffffffb3,inset 0 -6px 10px #00000026,0 14px 26px #00000040;color:#2a2926}
[data-n] .c-remote{background:linear-gradient(180deg,#43413d,#2d2b28);box-shadow:inset 0 3px 2px #ffffff1f,inset 0 -6px 10px #00000080,0 14px 26px #000000a0;color:#e4dfd5}
.c-remote .c-ind{--cwn:#dcd7cd;--cwin:#151413;--cwrim:#0000003d}
[data-n] .c-remote .c-ind{--cwn:#151413;--cwin:#151413}
.c-irlens{position:absolute;top:-5px;left:50%;width:44px;height:12px;margin-left:-22px;border-radius:8px 8px 4px 4px;background:#3a0d0a;box-shadow:inset 0 2px 2px #000,0 1px 0 #ffffff40;overflow:hidden}
.c-irlens::after{content:"";position:absolute;inset:2px 3px;border-radius:5px 5px 2px 2px;background:#ff3b2e;opacity:0;transition:opacity 220ms ease-out}
.c-irlens.c-tx::after{opacity:1;transition:none}
.c-engr{font:600 12px var(--cmono);letter-spacing:.2em;text-transform:uppercase;color:#00000094}
[data-n] .c-engr{color:#ffffff8a}
.c-rg{display:flex;justify-content:space-between;align-items:center}
.c-rkey{appearance:none;border:0;cursor:pointer;border-radius:12px;background:#33322f;color:#ece8df;box-shadow:inset 0 1px 0 #ffffff1f,0 2px 0 #000000a0;display:grid;place-items:center;gap:2px;
  min-height:48px;padding:6px 4px;font:600 12px var(--cmono);letter-spacing:.06em;text-transform:uppercase;transition:transform 80ms}
.pop .c-rkey,.c-cm .c-rkey{color:#ece8df}
[data-n] .c-rkey{background:#55534e}
.c-rkey:active{transform:translateY(2px)}
.c-rkey .c-ic{width:17px;height:17px}
.c-rkey.c-round{width:46px;height:46px;border-radius:50%;padding:0;min-height:0}
.c-rkey.c-round .c-ic{stroke:#8f8b82;transition:stroke 300ms}
.c-rkey.c-round[data-on=true] .c-ic{stroke:var(--cok)}
.c-rkey[aria-pressed=true]{transform:translateY(2px);box-shadow:inset 0 1px 3px #000}
.c-rk4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
.c-rk3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.c-rk3.c-inp .c-rkey{justify-items:start;padding:8px 9px 7px;text-transform:none;letter-spacing:0;font:500 13px var(--body)}
.c-dpad{position:relative;width:184px;height:184px;margin:0 auto;border-radius:50%;background:#33322f;box-shadow:inset 0 1px 0 #ffffff1f,0 3px 0 #000000a0}
[data-n] .c-dpad{background:#55534e}
.c-dz{appearance:none;border:0;cursor:pointer;position:absolute;width:56px;height:56px;background:transparent;display:grid;place-items:center;color:#ece8df;border-radius:50%;padding:0}
.pop .c-dz,.c-cm .c-dz{color:#ece8df}
.c-dz .c-ic{width:16px;height:16px}
.c-dz.c-u{top:0;left:64px}.c-dz.c-d{bottom:0;left:64px}.c-dz.c-l{left:0;top:64px}.c-dz.c-r{right:0;top:64px}
.c-dz:active{background:#00000040}
.c-okk{appearance:none;border:0;cursor:pointer;position:absolute;left:52px;top:52px;width:80px;height:80px;border-radius:50%;background:var(--cor);color:#1d1c1a;font:600 16px var(--body);letter-spacing:.12em;
  box-shadow:0 0 0 6px #00000040,0 3px 0 color-mix(in srgb,var(--cor) 62%,#000)}
.pop .c-okk{color:#1d1c1a}
.c-seam{height:0;border-top:1px solid #0000002e;border-bottom:1px solid #ffffff80;margin:2px -18px}
[data-n] .c-seam{border-top-color:#00000080;border-bottom-color:#ffffff1f}
/* ---------- pop-ups (openSheet): the house ground, a hairline, 22px corners; eyebrow + title + keys + Close × ---------- */
.pop .veil{background:#0a0d14;opacity:.6}
.pop .sheet{max-width:440px}
.pop .sheet > .face{--p-t:16px;--p-r:16px;--p-b:26px;--p-l:16px;background:var(--cgd);border:1px solid var(--cln);border-radius:22px;box-shadow:none;gap:16px;color:var(--cink)}
.pop .head{align-items:flex-start;gap:12px}
.pop .t{gap:2px}
.pop .t .kick{font:500 12px var(--cmono);letter-spacing:.16em;text-transform:uppercase;color:var(--cdim)}
.pop .t h2{font:500 24px/1.15 var(--body);text-transform:none;letter-spacing:0;color:var(--cink);margin-top:2px}
.pop .acts{gap:8px;align-items:center}
.pop .acts > .key{height:auto}
.pop .acts .c-k{min-height:44px}
.pop .close > .face{--p-t:8px;--p-b:8px;--p-l:14px;--p-r:14px;min-height:44px;display:flex;align-items:center;background:var(--ckey);border:1px solid var(--cln);border-radius:12px;
  font:500 15px/1.15 var(--body);letter-spacing:0;text-transform:none;color:var(--cink)}
.pop .close::after{content:none}
.pop .body{gap:16px;padding:2px;--jam-slab:var(--slab);--jam-slab2:var(--slab2)}
.pop .rule{display:none}
.pop .c-pwr{appearance:none;cursor:pointer;width:46px;height:46px;border-radius:50%;background:var(--cpl);border:1.5px solid var(--cln);display:grid;place-items:center;flex:none;padding:0}
.pop .c-pwr .c-ic{width:18px;height:18px;stroke:var(--cdim);stroke-width:2.4;transition:stroke 300ms}
.pop .c-pwr[aria-pressed=true] .c-ic{stroke:var(--cokg)}
@media (max-width:600px){.pop .sheet{max-width:none}.pop .sheet > .face{border-radius:22px 22px 0 0;border-width:1px 0 0;max-height:90vh}}
@keyframes calm-rise{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes calm-fade{from{opacity:0}to{opacity:1}}
@keyframes calm-fade-out{from{opacity:1}to{opacity:0}}
@keyframes calm-press{from{transform:translateY(1px)}to{transform:translateY(1px)}}
@keyframes calm-settle{from{transform:scale(.98)}to{transform:none}}
@keyframes calm-nudge{0%,100%{transform:none}50%{transform:translateX(3px)}}
.pop.opening .wipe{animation:calm-rise calc(220ms * var(--jam-motion,1)) var(--settle) backwards}
.pop.opening .veil{animation:calm-fade calc(180ms * var(--jam-motion,1)) ease-out backwards}
/* kiosk pop-ups: centred, wider, two columns for the light */
.pop.c-cmp.c-kio .sheet{max-width:760px}
.pop.c-cmp.c-kio .sheet > .face{--p-t:22px;--p-r:24px;--p-b:24px;--p-l:24px;border-radius:22px;border-width:1px;max-height:calc(100vh - 40px)}
.pop.c-cmp.c-kio.c-conf .sheet{max-width:620px}
.pop.c-cmp.c-kio .stage{align-items:center}
.pop.c-kio .c-lab{font-size:15px}.pop.c-kio .c-k{font-size:18px;min-height:52px}.pop.c-kio .c-note{font-size:16px}
.pop.c-kio .c-hf .c-cp b{font-size:16px}.pop.c-kio .c-wh .c-k{font-size:16px;min-height:80px}.pop.c-kio .c-wh .c-k small{font-size:15px}
.pop.c-kio .c-mem{font-size:17px}.pop.c-kio .c-rk.c-mini{width:64px;height:60px}
.c-kp2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}
.c-kp2 > div{display:grid;gap:16px;align-content:start}
.pop.c-cmp.c-kio.c-rem .sheet{max-width:600px}
.pop.c-kio .t .kick{font-size:15px}.pop.c-kio .t h2{font-size:30px;line-height:1.1}
.pop.c-kio .close > .face{min-height:52px;font-size:18px;--p-l:18px;--p-r:18px}.pop.c-kio .acts .c-k{min-height:52px;font-size:18px}
.pop.c-kio.c-rem .sheet > .face{display:grid;grid-template-columns:minmax(0,1fr) 264px;grid-template-rows:minmax(0,1fr);column-gap:24px;align-items:start}
.pop.c-kio.c-rem .head{grid-column:1;grid-row:1;flex-direction:column;align-items:stretch;gap:14px}
.pop.c-kio.c-rem .acts{flex-direction:column;align-items:stretch;gap:12px}
.pop.c-kio.c-rem .acts > *{width:100%}
.pop.c-kio.c-rem .close > .face{justify-content:center}
.pop.c-kio.c-rem .body{grid-column:2;grid-row:1;overflow:visible;padding:0}
.pop.c-kio.c-rem .c-remote{margin:6px 0 0}
.pop.c-cmp.c-rem .body{justify-items:center}
/* ---------- kiosk home: the walnut rule, room + door, a big clock, three keys ---------- */
.c-khome{position:relative;height:var(--kh,600px);min-height:420px;background:var(--cgd);color:var(--cink);overflow:hidden;font-size:18px;container-type:size}
.c-khome::before{content:"";position:absolute;left:var(--kpl,44px);right:var(--kpr,44px);top:0;height:3px;background:var(--cwal);z-index:1}
.c-kh{position:absolute;inset:0;padding:var(--kpt,40px) var(--kpr,44px) var(--kpb,40px) var(--kpl,44px);display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:20px}
.c-echo .c-kh{gap:12px}
.c-ktop{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.c-kplace{font:500 18px var(--cmono);letter-spacing:.16em;text-transform:uppercase;color:var(--cdim);padding-top:10px}
.c-kdoor{appearance:none;border:0;background:none;cursor:pointer;display:flex;gap:14px;align-items:center;text-align:right;padding:4px 0;min-height:56px;color:var(--cink)}
.c-kdoor .c-kdt{display:grid;justify-items:end}
.c-kdoor .c-nm{font:500 22px var(--body)}
.c-kdoor .c-wd{font:500 18px var(--cmono);letter-spacing:.1em;text-transform:uppercase;color:var(--cdim)}
.c-kdoor .c-wd.c-warn{color:var(--cwink)}.c-kdoor .c-wd.c-alert{color:var(--calink)}
.c-kdoor .c-ind.c-led{width:18px;height:18px}.c-kdoor .c-ind.c-led::after{inset:2.5px}
.c-klock{display:flex;gap:16px;align-items:center}
.c-klock .c-k{min-height:60px;padding:8px 26px;font-size:22px;border-radius:14px}
.c-klock .c-k .c-ic{width:22px;height:22px}
.c-clk{align-self:end;display:grid;gap:10px}
.c-clk .c-clt{font:300 200px/.8 var(--body);letter-spacing:-.03em;display:flex;align-items:flex-start;gap:10px}
.c-clk .c-clt small{font:400 28px var(--cmono);letter-spacing:.1em;color:var(--cdim);margin-top:8px}
.c-clk .c-d{font:400 30px/1.2 var(--body);margin-top:16px}
.c-clk .c-f{font:400 22px var(--body);color:var(--cdim)}
.c-echo .c-clk .c-clt{font-size:150px}.c-echo .c-clk .c-d{font-size:26px;margin-top:10px}.c-echo .c-clk{gap:6px}
.c-dock{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:16px;height:150px}
.c-echo .c-dock{height:122px;gap:14px}
.c-kt{position:relative;background:var(--cpl);border:1px solid var(--cln);border-radius:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:0 18px 0 0;min-width:0}
.c-kt .c-open{appearance:none;border:0;background:none;cursor:pointer;height:100%;display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center;padding:0 0 0 22px;text-align:left;min-width:0;color:var(--cink)}
.c-kt .c-open .c-lg,.c-kt .c-open .c-og{width:42px;height:42px}
.c-kt .c-open > span{min-width:0}
.c-kt .c-nm{font:500 26px/1.1 var(--body);display:block}
.c-kt .c-wd{font:400 18px/1.25 var(--body);color:var(--cdim);display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.c-kt .c-k{min-height:60px;padding:8px 18px;font-size:20px;border-radius:14px}
.c-kt .c-k .c-ic{width:20px;height:20px}
.c-echo .c-kt .c-nm{font-size:24px}
/* kiosk sheets (jamCardSheet full screen): the ground, the head (eyebrow, 30px title, Close ×), nothing scrolls */
.pop.full .sheet > .face{--p-t:24px;--p-r:28px;--p-b:26px;--p-l:28px;background:var(--cgd);border:0;border-radius:0;gap:16px}
.pop.full .head{align-items:flex-start}
.pop.full .t .kick{font-size:15px;letter-spacing:.16em}
.pop.full .t h2{font:500 30px/1.1 var(--body);color:var(--cink)}
.pop.full .acts > .key{min-height:52px}
.pop.full .close > .face{min-height:52px;font-size:18px;--p-l:18px;--p-r:18px}
.pop.full .body{gap:14px;overflow:hidden}
@media (max-height:640px){.pop.full .sheet > .face{--p-t:18px;--p-r:22px;--p-b:20px;--p-l:22px;gap:12px}.pop.full .body{gap:12px}}
/* kiosk-size cards (size: kiosk, inside the kiosk sheets) */
.c-kio .c-lab{font-size:15px}.c-kio .c-k{font-size:18px;min-height:52px}.c-kio .c-note{font-size:16px}
.c-kio .c-pn .c-nm{font-size:22px}.c-kio .c-pn .c-wd{font-size:15px}
.c-kio .c-pn .c-lg,.c-kio .c-pn .c-og{width:40px;height:40px}
.c-lc.c-kio .c-pb{grid-template-columns:minmax(0,1fr) 72px;min-height:0;height:100%}
.c-lc.c-kio .c-pb.c-solo{grid-template-columns:1fr}
.c-lc.c-kio .c-rk,.c-lc.c-kio .c-vf{min-height:0}
.c-lc.c-kio .c-rk{--pd-sym:34px;--pd-sw:3.2;--pd-ew:4px;--pd-band:8px}
.c-kio .c-vf .c-cp{height:30px;bottom:calc((100% - 30px) * var(--vn))}.c-kio .c-vf .c-cp b{font-size:16px}
.c-kio .c-ofx .c-note{font-size:16px}
.c-appl.c-kio .c-k,.c-kio .c-akeys .c-k{font-size:17px}.c-appl.c-kio .c-asub{font-size:16px}.c-appl.c-kio .c-aname{font-size:21px}.c-appl.c-kio .c-u{font-size:15px}
.c-scn.c-kio .c-k{min-height:52px;padding:8px 22px}
.c-kio .c-mtitle{font-size:30px}.c-kio .c-msub{font-size:16px}
.c-kio .c-srt{min-height:88px}.c-kio .c-srt .c-nm{font-size:18px}.c-kio .c-srt .c-on{font-size:15px}
.c-kio .c-src{grid-template-columns:repeat(2,minmax(0,1fr))}
.c-kio .c-lr .c-nm{font-size:20px}.c-kio .c-lr .c-wd{font-size:15px}.c-kio .c-lr{min-height:72px}
.c-kio .c-gr{width:96px;height:96px;padding:16px;gap:8px}.c-kio .c-gr i{width:10px;height:10px}
.c-kio .c-hf .c-cp b{font-size:16px}
.c-ktv,.c-kspk{height:100%}
.c-kmed{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;min-height:0;height:100%}
.c-kcol{padding:18px;display:grid;gap:14px;align-content:start;min-height:0}
.c-kcol > .c-sum{border:0;padding:0;background:none}
.c-kio .c-sum .c-mtitle.c-xl{font-size:28px}
`;

  registerLook({
    id: "calm",
    name: "Calm",
    fonts: [{family: "IBM Plex Mono", weight: "400", file: "IBMPlexMono-Regular-Latin1.woff2"},
      {family: "IBM Plex Mono", weight: "500", file: "IBMPlexMono-Medium-Latin1.woff2"},
      {family: "IBM Plex Mono", weight: "600", file: "IBMPlexMono-SemiBold-Latin1.woff2"},
      {family: "Jost", weight: "300", file: "jost-var-latin.woff2"}],
    css: CALM_CSS,
    motifs: {render: calmRender, flash: () => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 1 1"); s.setAttribute("aria-hidden", "true"); return s; }},
  });
})();
