/* ---------- jam-choice: select / input_select as option chips ----------
   {type: custom:jam-choice, entity, name?, options?: [subset/order], columns?, accent? (selected option fill; DESIGN "Colour system")}
   Options are chips (bottom-right 6px cut): slab2 off, accent fill + ink text when selected. */
class JamChoice extends JamBase {
  validate(c) {
    if (!c.entity || !/^(input_)?select\./.test(c.entity)) throw new Error("jam-choice: entity must be a select or input_select");
  }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .opts{display:grid;grid-template-columns:repeat(var(--cols,auto-fill),minmax(var(--min,92px),1fr));gap:8px}
    .opt{text-align:left}
    .opt > .face{--p-t:12px;--p-b:12px;--p-l:10px;--p-r:10px;min-height:46px;display:flex;align-items:center;
      font-size:.76rem;letter-spacing:.08em;overflow-wrap:break-word;min-width:0}
    .opt.busy > .face{border-color:var(--acc)}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const {root, face: wrap} = this.paper(c.entity, {face: `wrap stripe s-${s && !UNAVAILABLE.has(s.state) ? "on" : "alert"}`});
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const box = el("div", "opts");
    if (c.columns) box.style.setProperty("--cols", String(c.columns));
    const all = (s && s.attributes.options) || [];
    const list = c.options ? c.options.filter(o => all.includes(o)) : all;
    const dom = c.entity.split(".")[0];
    for (const o of list) {
      const on = !!s && s.state === o;
      const btn = cutKey(o, `jam-choice|${c.entity}|${o}`, "opt" + (on ? " on" : ""), "chip");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.disabled = !s || UNAVAILABLE.has(s.state);
      btn.onclick = () => { btn.classList.add("busy"); h.callService(dom, "select_option", {entity_id: c.entity, option: o}); };
      box.append(btn);
    }
    if (!list.length) box.append(el("div", "c-dim", s ? "No options" : "Entity not found"));
    wrap.append(box);
    b.append(root);
  }
  getCardSize() { return 3; }
}
register("jam-choice", JamChoice, "Jam Choice", "Select / input_select options as chunky chips.");
