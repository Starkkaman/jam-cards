/* ---------- jam-scenes: horizontally scrolling row of scene keys (Londrina, 10px bottom-right cut) ----------
   {type: custom:jam-scenes, scenes: [{entity (scene.* | script.*), name? (default friendly name), data? (extra
    service data, e.g. {transition: 2})}], current_entity? (input_select whose state names the active scene; matched
    case-insensitively to the scene name or its object id), wrap?: true (keys wrap onto more rows instead of scrolling
    sideways), accent? (default ochre)}
   Tap = scene.turn_on / script.turn_on with {entity_id, ...data}. The active scene is filled with the accent. */
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
    .scenes{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}
    .scene{flex:0 0 auto;font-family:var(--display);font-weight:900;font-size:1rem;line-height:1;text-transform:uppercase;
      padding:12px 14px;background:var(--slab2);color:var(--fg);white-space:nowrap;
      clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}
    .scenes.wrap{flex-wrap:wrap;overflow-x:visible}
    .scene.on{background:var(--acc);color:var(--acc-fg)}
    .scene:active{transform:translate(2px,2px)}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const cur = c.current_entity ? stateObj(h, c.current_entity) : null;
    const want = cur && !UNAVAILABLE.has(cur.state) ? String(cur.state).trim().toLowerCase() : null;
    const row = el("div", "scenes" + (c.wrap ? " wrap" : ""));
    row.setAttribute("role", "group"); row.setAttribute("aria-label", "Scenes");
    for (const sc of c.scenes) {
      const name = friendly(h, sc.entity, sc.name);
      const obj = String(sc.entity).split(".")[1].replace(/_/g, " ");
      const on = !!want && (String(name).trim().toLowerCase() === want || obj === want);
      const btn = el("button", "scene" + (on ? " on" : ""), name);
      btn.type = "button"; btn.setAttribute("aria-pressed", String(on));
      const s = stateObj(h, sc.entity);
      if (!s || UNAVAILABLE.has(s.state)) btn.classList.add("unavail");
      btn.onclick = () => this._hass.callService(sc.entity.split(".")[0], "turn_on", {...(sc.data || {}), entity_id: sc.entity});
      row.append(btn);
    }
    b.append(row);
  }
  getCardSize() { return 1; }
  getGridOptions() { return {columns: "full", rows: "auto", min_columns: 6}; }
}
register("jam-scenes", JamScenes, "Jam Scenes", "Scenes row: scroll of scene/script keys, the active one filled with the accent.");
