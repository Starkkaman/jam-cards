/* ---------- jam-scenes: horizontally scrolling row of scene keys (Londrina, 10px bottom-right cut) ----------
   {type: custom:jam-scenes, scenes: [{entity (scene.* | script.*), name? (default friendly name), data? (extra
    service data, e.g. {transition: 2})}], current_entity? (input_select whose state names the active scene; matched
    case-insensitively to the scene name or its object id), wrap?: true (keys wrap onto more rows instead of scrolling
    sideways), accent? (default ochre)}
   Tap = scene.turn_on / script.turn_on with {entity_id, ...data}. The active scene is filled with the accent.
   Active scene (0.3.2): the listed scene with the newest activation time (a scene's state is its last activation ISO time;
   a script's is attributes.last_triggered); when current_entity changed (last_changed) after that time, its option match
   wins instead. No timestamps at all -> the current_entity match. Re-evaluated on every state change (live).
   Motion (0.3.5): a newly active scene gets a one-shot stamp (scale 1.08 -> 1, 3 steps) while its accent wipes in. */
function jamSceneTime(s) {
  if (!s || UNAVAILABLE.has(s.state)) return NaN;
  const v = String(s.entity_id || "").startsWith("script.") ? s.attributes.last_triggered : s.state;
  return v ? Date.parse(v) : NaN;
}
class JamScenes extends JamBase {
  validate(c) {
    if (!Array.isArray(c.scenes) || !c.scenes.length) throw new Error("jam-scenes: scenes is required (list of {entity})");
    for (const s of c.scenes) {
      const d = s && s.entity ? String(s.entity).split(".")[0] : "";
      if (d !== "scene" && d !== "script") throw new Error("jam-scenes: every scene needs a scene.* or script.* entity");
    }
  }
  watched() { const c = this._config; return [...c.scenes.map(s => s.entity), c.current_entity].filter(Boolean); }
  css() { return `
    /* 0.3.9: each key is a 44px button (2px transparent above and below, cancelled by the row's -2px margins, so the layout
       is unchanged) with the visible 40px face inside: a 44px touch target with the same look. */
    .scenes{display:flex;gap:6px;overflow-x:auto;margin:-2px 0;padding-bottom:2px;scrollbar-width:thin}
    .scene{position:relative;flex:0 0 auto;padding:2px 0;font-family:var(--display);font-weight:900;font-size:1rem;line-height:1;
      text-transform:uppercase;color:var(--fg);white-space:nowrap}
    .scene > .sf{position:relative;display:block;padding:12px 14px;background:var(--slab2);
      clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}
    .scenes.wrap{flex-wrap:wrap;overflow-x:visible}
    .scene.on > .sf{background:var(--acc);color:var(--acc-fg)}
    .scene:focus-visible{outline-offset:-2px} .scene.on:focus-visible{outline-color:var(--fg)}
    .scene:active > .sf{transform:translate(2px,2px);animation:jam-print calc(60ms * var(--jam-motion,1)) steps(2,end) forwards}
    .scene.jam-stamp::before{content:none}
    .scene.jam-stamp > .sf::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:var(--jam-stamp-from,var(--slab2));
      clip-path:inset(0 0 0 100%);animation:jam-uncover 210ms steps(3,end)}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const cur = c.current_entity ? stateObj(h, c.current_entity) : null;
    const want = cur && !UNAVAILABLE.has(cur.state) ? String(cur.state).trim().toLowerCase() : null;
    // Newest activation among the listed scenes; the input_select wins only when it changed after that.
    let newest = null, newT = -Infinity;
    for (const sc of c.scenes) { const t = jamSceneTime(stateObj(h, sc.entity)); if (t > newT) { newT = t; newest = sc.entity; } }
    const curT = cur && cur.last_changed ? Date.parse(cur.last_changed) : NaN;
    const bySelect = !newest || (!!want && curT > newT);
    // Stamp (0.3.5): when the active scene changes after the first render, the new one gets the one-shot stamp + wipe.
    let active = null;
    const row = el("div", "scenes" + (c.wrap ? " wrap" : ""));
    row.setAttribute("role", "group"); row.setAttribute("aria-label", "Scenes");
    for (const sc of c.scenes) {
      const name = friendly(h, sc.entity, sc.name);
      const obj = String(sc.entity).split(".")[1].replace(/_/g, " ");
      const on = bySelect ? !!want && (String(name).trim().toLowerCase() === want || obj === want) : sc.entity === newest;
      const btn = el("button", "scene" + (on ? " on" : ""));
      btn.append(el("span", "sf", name));
      btn.type = "button"; btn.setAttribute("aria-pressed", String(on));
      if (on && !active) active = {btn, id: sc.entity};
      const s = stateObj(h, sc.entity);
      if (!s || UNAVAILABLE.has(s.state)) btn.classList.add("unavail");
      btn.onclick = () => this._hass.callService(sc.entity.split(".")[0], "turn_on", {...(sc.data || {}), entity_id: sc.entity});
      row.append(btn);
    }
    b.append(row);
    const id = active ? active.id : null;
    if (this._actSeen && id && id !== this._act && motionOn()) active.btn.classList.add("jam-stamp");
    this._act = id; this._actSeen = true;
  }
  getCardSize() { return 1; }
  getGridOptions() { return {columns: "full", rows: "auto", min_columns: 6}; }
}
register("jam-scenes", JamScenes, "Jam Scenes", "Scenes row: scroll of scene/script keys, the active one filled with the accent.");
