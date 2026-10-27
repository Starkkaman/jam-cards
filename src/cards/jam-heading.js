/* ---------- jam-heading: section label + big title over a straight 5px accent rule ----------
   {type: custom:jam-heading, title, kicker?, accent?: colour or room alias (DESIGN "Colour system"; default ochre),
    entities?: [ids shown as chips], tap_action?, hold_action?, double_tap_action?} */
class JamHeading extends JamBase {
  validate(c) { if (!c.title) throw new Error("jam-heading: title is required"); }
  watched() { return this._config.entities || []; }
  css() { return `
    .h{display:grid;gap:6px;padding:6px 2px 0}
    .row{display:flex;gap:10px 16px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}
    .rule{height:5px;background:var(--acc)}
    h2{font-size:clamp(1.6rem,5.4vw,2.3rem)} .t{display:grid;gap:4px;min-width:0}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .h.tap{cursor:pointer}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const box = el("div", "h");
    if (c.tap_action || c.hold_action || c.double_tap_action) {
      box.classList.add("tap", "focusable"); box.tabIndex = 0; box.setAttribute("role", "button");
      bindActions(box, () => this._hass, {tap_action: {action: "none"}, ...c});
    }
    const row = el("div", "row"), t = el("div", "t");
    if (c.kicker) t.append(el("div", "label", c.kicker));
    t.append(el("h2", "disp", c.title));
    row.append(t);
    const ids = c.entities || [];
    if (ids.length) {
      const chips = el("div", "chips");
      for (const id of ids) {
        const s = stateObj(h, id);
        const b2 = el("button", `chip c-${tone(s) === "off" ? "dim" : tone(s)}`, fmtState(h, s));
        b2.title = friendly(h, id); b2.onclick = e => { e.stopPropagation(); moreInfo(this, id); };
        chips.append(b2);
      }
      row.append(chips);
    }
    const rule = el("div", "rule"); rule.setAttribute("aria-hidden", "true");
    box.append(row, rule);
    b.append(box);
  }
  getCardSize() { return 1; }
}
register("jam-heading", JamHeading, "Jam Heading", "Section title slab with an accent rule and optional state chips.");
