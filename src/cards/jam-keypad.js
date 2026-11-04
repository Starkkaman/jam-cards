/* ---------- jam-keypad: scenes / scripts / buttons as round calculator keys (Braun look card, 2026-11-03) ----------
   {type: custom:jam-keypad, title? (room, left in the display; default "Scenes"), keys: [{entity? (scene.* | script.* |
    button.* | input_button.*), name? (default the friendly name), accent? (key colour: a hue or room alias), data? (extra
    service data), tap_action? (instead of the entity's own call; a key without entity needs name + tap_action)}],
    current_entity? (input_select / select naming the active scene), all_on? / all_off? (Lovelace actions: adds an
    "All on" key in green and an "All off" key in ochre, side by side in a wide bar under the keys), accent? (the active ring; default ochre)}
   After the Braun look-cards mockup (ET66 scene pad): a dark body (the look's ink, a step lighter so it stands off a dark
   page) with a small display on top (the room left, the active scene right, in the label style) and the keys as round
   calculator keys in a 3-column grid. A key without accent = a body key (ink mixed with 28 % of the ink text, ink text);
   with accent = that hue, nudged lighter / darker until the look's dark or light text reads 4.5:1 on it (resolved once the
   card is in the page, again on every render and look switch). Active key (as jam-scenes: the listed scene / script
   activated last, or the current_entity option when that changed later) lights up: its face in --kp-on (default the card
   accent, nudged to 4.5:1 like the others), a filled LED dot over its label (the other scene keys show the dot as a ring),
   a 3px ring around it (--kp-ring), aria-pressed, and a one-shot stamp when it changes. Labels 16px. All on / all off sit
   in a wide bottom bar (the ET66 "=" key, the look's key shape), so actions read apart from the scenes. A key whose entity is missing or unavailable = an outlined, disabled key.
   Tap: tap_action, else scene / script .turn_on {entity_id, ...data}, button / input_button .press. Real <button>s,
   >= 56px keys, focus ring outside the active ring; on the dark body a --focus that does not read 3:1 there becomes the ink
   text colour. No continuous animation. */
const KP_DOMAINS = ["scene", "script", "button", "input_button"];
/* [r,g,b] of a computed colour: rgb() / hex (parseRgb), or the color(srgb r g b) form a color-mix() computes to; else null. */
function jamCssRgb(v) {
  const m = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(String(v || "").trim());
  return m ? [m[1], m[2], m[3]].map(x => Math.round(Math.max(0, Math.min(1, +x)) * 255)) : parseRgb(v);
}
class JamKeypad extends JamBase {
  validate(c) {
    if (!Array.isArray(c.keys) || !c.keys.length) throw new Error("jam-keypad: keys is required (list of {entity} or {name, tap_action})");
    for (const k of c.keys) {
      if (!k || typeof k !== "object") throw new Error("jam-keypad: every key is an object ({entity} or {name, tap_action})");
      const d = k.entity ? String(k.entity).split(".")[0] : "";
      if (k.entity && !KP_DOMAINS.includes(d) && !k.tap_action) throw new Error("jam-keypad: a key's entity is a scene, script, button or input_button (or give it a tap_action)");
      if (!k.entity && !(k.name && k.tap_action)) throw new Error("jam-keypad: a key without entity needs name and tap_action");
    }
  }
  watched() { const c = this._config; return [...c.keys.map(k => k.entity), c.current_entity].filter(Boolean); }
  connectedCallback() {
    super.connectedCallback();
    if (this._accWait) this._render(false); // accent keys resolve to rgb only in the page
  }
  getCardSize() { return 5; }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 4}; }
  css() { return `
    .paper.kp > .face{padding:0;overflow:hidden}
    .kp-body{height:100%;display:grid;gap:12px;align-content:start;padding:14px;color:var(--ink-fg);
      background:var(--kp-body,color-mix(in srgb,var(--ink) 88%,var(--ink-fg)));--kp-key:color-mix(in srgb,var(--ink) 72%,var(--ink-fg))}
    .kp-disp{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:44px;padding:8px 12px;
      background:var(--kp-disp,var(--ink));color:var(--kp-disp-fg,var(--ink-fg))}
    .kp-room{font:500 16px/1.2 var(--body);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .kp-cur{font:var(--lbl-w) 14px/1.2 var(--body);letter-spacing:calc(.08em * var(--lbl-track));text-transform:uppercase;text-align:right;
      min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:none;max-width:60%}
    .kp-keys{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;justify-items:center}
    .kp-key{position:relative;width:100%;max-width:96px;min-width:56px;aspect-ratio:1;border-radius:50%;color:var(--kf,var(--ink-fg))}
    .kp-cap{position:absolute;inset:0;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:8px;
      background:var(--kc,var(--kp-key));font:var(--key-w) 16px/1.12 var(--body);letter-spacing:calc(.04em * var(--key-track));text-transform:var(--key-case);text-align:center;overflow-wrap:anywhere}
    .kp-cap > span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .kp-key:disabled{cursor:default}
    .kp-key:disabled > .kp-cap{background:transparent;border:2px dashed var(--ink-dim);color:var(--ink-fg)}
    /* the scene LED: a ring on every scene key, lit (filled) on the active one, whose whole face lights up too */
    .kp-key[aria-pressed] > .kp-cap::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;box-sizing:border-box;border:1.5px solid currentColor}
    .kp-key.on > .kp-cap::before{background:currentColor}
    .kp-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:10px}
    .kp-act{position:relative;height:56px;color:var(--kf,var(--ink-fg))}
    .kp-act > .kp-cap{border-radius:var(--jam-radius-key,0px);clip-path:var(--jam-shape-key,polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%))}
    .kp-act:not(:disabled):active > .kp-cap{transform:var(--press-from)}
    .kp-act:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
    .kp-key.on::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:3px solid var(--kp-ring,var(--acc));pointer-events:none}
    .kp-key:focus-visible{outline:3px solid var(--focus);outline-offset:6px}
    .kp-key:not(:disabled):active > .kp-cap{transform:var(--press-from);animation:var(--jam-kf-print,jam-print) calc(60ms * var(--jam-motion,1) * var(--dur)) var(--jam-ease-2,steps(2,end)) forwards}
    .kp-key.jam-stamp::before{content:none}`; }
  /* The active key's index: the listed scene / script activated last; the current_entity option wins when it changed later. */
  _active() {
    const c = this._config, h = this._hass, cur = c.current_entity ? stateObj(h, c.current_entity) : null;
    const want = cur && !UNAVAILABLE.has(cur.state) ? String(cur.state).trim().toLowerCase() : null;
    let newest = -1, newT = -Infinity;
    c.keys.forEach((k, i) => {
      const d = k.entity ? String(k.entity).split(".")[0] : "";
      if (d !== "scene" && d !== "script") return;
      const t = jamSceneTime(stateObj(h, k.entity));
      if (t > newT) { newT = t; newest = i; }
    });
    const curT = cur && cur.last_changed ? Date.parse(cur.last_changed) : NaN;
    if (newest >= 0 && !(want && curT > newT)) return {i: newest, text: null};
    if (!want) return {i: -1, text: null};
    const i = c.keys.findIndex(k => {
      const nm = String(this._keyName(k)).trim().toLowerCase(), obj = k.entity ? String(k.entity).split(".")[1].replace(/_/g, " ") : "";
      return nm === want || obj === want;
    });
    return {i, text: i < 0 ? String(cur.state) : null};
  }
  _keyName(k) { return k.name || friendly(this._hass, k.entity) || "Key"; }
  _press(btn, k) {
    const h = this._hass;
    if (k.tap_action) { runAction(btn, h, k.tap_action, k.entity); return; }
    const d = String(k.entity).split(".")[0];
    if (d === "scene" || d === "script") jamCall(btn, h, d, "turn_on", {...(k.data || {}), entity_id: k.entity}, "start");
    else jamCall(btn, h, d, "press", {...(k.data || {}), entity_id: k.entity}, "run");
  }
  render(b) {
    const c = this._config, h = this._hass;
    const {root, face} = this.paper("keypad", {cls: "kp"});
    b.append(root); // in the page first: accent keys resolve to rgb
    const body = el("div", "kp-body"), disp = el("div", "kp-disp"), keys = el("div", "kp-keys"), bar = el("div", "kp-bar");
    const act = this._active(), title = c.title || "Scenes";
    const items = c.keys.map((k, i) => ({k, i, name: this._keyName(k)}));
    // All on / all off: the wide bottom bar (the ET66 "=" key), so actions read apart from scenes.
    if (c.all_on) items.push({k: {name: "All on", accent: "green", tap_action: c.all_on}, name: "All on", bar: true});
    if (c.all_off) items.push({k: {name: "All off", accent: "ochre", tap_action: c.all_off}, name: "All off", bar: true});
    const curName = act.i >= 0 ? items[act.i].name : act.text || "";
    disp.append(el("span", "kp-room", title));
    if (curName) disp.append(el("span", "kp-cur", curName));
    disp.setAttribute("aria-label", curName ? `${title}: ${curName}` : title);
    keys.setAttribute("role", "group"); keys.setAttribute("aria-label", title);
    body.append(disp, keys);
    if (items.some(it => it.bar)) { bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "All lights"); body.append(bar); }
    face.append(body);
    const tc = textColors(b);
    this._accWait = false;
    let activeBtn = null;
    // A fill (CSS colour) as the key face with the look's dark / light text, nudged to 4.5:1.
    const paint = (btn, css) => {
      const rgb = resolveRgb(btn, css);
      if (!rgb) { this._accWait = true; return; }
      const r = jamMuReadable(rgb, tc); btn.style.setProperty("--kc", r.bg); btn.style.setProperty("--kf", r.fg);
    };
    for (const it of items) {
      const k = it.k, s = k.entity ? stateObj(h, k.entity) : null, on = it.i != null && it.i === act.i;
      const btn = el("button", (it.bar ? "kp-act" : "kp-key") + (on ? " on" : "")), cap = el("span", "kp-cap");
      btn.type = "button"; cap.append(el("span", null, it.name)); btn.append(cap);
      (it.bar ? bar : keys).append(btn);
      if (k.entity && !k.tap_action && (!s || s.state === "unavailable")) { btn.disabled = true; btn.setAttribute("aria-label", `${it.name} (unavailable)`); }
      if (it.i != null && k.entity && /^(scene|script)\./.test(k.entity)) btn.setAttribute("aria-pressed", String(on));
      const av = accentVar(k.accent);
      if (av) btn.dataset.accent = accentName(k.accent); // a look pack may recolour a hue's keys
      // The active key lights up: its face in --kp-on (default the card accent; Braun: ET66 yellow), whatever its own colour.
      if (on && !btn.disabled) paint(btn, "var(--kp-on,var(--acc))");
      else if (av && !btn.disabled) paint(btn, av);
      btn.onclick = () => this._press(btn, k);
      if (on) activeBtn = btn;
    }
    // Focus ring on the dark body: the look's --focus when it reads 3:1 there, else the ink text colour.
    const bodyRgb = jamCssRgb(getComputedStyle(body).backgroundColor), foc = resolveRgb(b, "var(--focus)");
    if (bodyRgb && foc && contrastRatio(bodyRgb, foc) < 3) body.style.setProperty("--focus", "var(--ink-fg)");
    // Stamp (as jam-scenes): the newly active key, once, when it changes after the first render.
    const id = act.i >= 0 ? act.i : null;
    if (this._actSeen && activeBtn && id !== this._act && motionOn()) activeBtn.classList.add("jam-stamp");
    this._act = id; this._actSeen = true;
  }
}
register("jam-keypad", JamKeypad, "Jam Keypad", "Scene pad: scenes, scripts and buttons as round calculator keys on a dark body, a small display with the room and the active scene.");
