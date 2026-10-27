/* ---------- jam-hero: torn paper slab with a cut corner and Golden Arm bars ----------
   {type: custom:jam-hero, kicker?, title?, title_entity?, meta_entities?: [ids], power_entity?, off_title?, off_text?,
    chips?: [{entity, name?, show_state?: "on", hide_value?, tone?: red|ochre|teal|paper}], accent?}
   A chip is hot (accent colour) when its entity is on; tone overrides the hot colour (paper = paper-fg block, still .hot). */
class JamHero extends JamBase {
  watched() {
    const c = this._config;
    return [c.title_entity, c.power_entity, ...(c.meta_entities || []), ...(c.chips || []).map(x => x.entity)].filter(Boolean);
  }
  css() { return `
    .hero{--p-t:18px;--p-r:20px;--p-b:22px;--p-l:20px;background:var(--paper);color:var(--paper-fg);display:grid;gap:12px;align-content:start}
    .hero .label{color:var(--paper-dim)}
    h1{font-size:clamp(2.7rem,11vw,4.8rem);line-height:.9;letter-spacing:-.005em} h1 span{color:var(--acc,var(--red))}
    .meta{display:flex;gap:6px 16px;flex-wrap:wrap;font-weight:500}
    .meta span{min-width:0;overflow-wrap:anywhere}
    .meta span + span::before{content:"";display:inline-block;width:7px;height:7px;background:var(--acc,var(--red));margin:0 12px 1px 0;vertical-align:middle}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .chips .chip{background:var(--paper-fg);color:var(--paper);border-color:var(--paper-fg);padding:4px 8px}
    .chips .chip.hot{background:var(--hot,var(--acc,var(--red)));border-color:var(--hot,var(--acc,var(--red)));color:var(--paper)}
    .off h1{color:var(--paper-dim)}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const key = c.title_entity || c.title || c.kicker || "hero";
    const {root, face: hero} = this.paper(key, {edges: "rb", cut: true, face: "hero"});
    hero.style.setProperty("--acc", `var(--${c.accent || "red"})`);
    const pw = c.power_entity ? stateObj(h, c.power_entity) : null;
    const off = pw && (pw.state === "off" || UNAVAILABLE.has(pw.state));
    if (off) hero.classList.add("off");
    if (c.kicker) hero.append(el("div", "label", c.kicker));
    let title = c.title || "";
    if (c.title_entity) { const s = stateObj(h, c.title_entity); title = s && !UNAVAILABLE.has(s.state) ? fmtState(h, s) : (c.title || ""); }
    if (off) title = c.off_title || "Off";
    const h1 = el("h1", "disp focusable", title);
    if (c.title_entity) { h1.tabIndex = 0; h1.style.cursor = "pointer"; h1.onclick = () => moreInfo(this, c.title_entity); }
    hero.append(h1, armBars("jam-hero|" + key));
    if (off) {
      if (c.off_text) hero.append(el("div", "meta", c.off_text));
    } else {
      const meta = el("div", "meta num");
      for (const id of c.meta_entities || []) {
        const s = stateObj(h, id);
        if (!s || UNAVAILABLE.has(s.state)) continue;
        meta.append(el("span", "", fmtState(h, s)));
      }
      if (meta.childNodes.length) hero.append(meta);
      const chips = el("div", "chips");
      for (const ch of c.chips || []) {
        const s = stateObj(h, ch.entity);
        if (!s) continue;
        if (ch.show_state && s.state !== ch.show_state) continue;
        const btn = el("button", `chip${tone(s) === "on" ? " hot" : ""}`, ch.name ? `${ch.name}${ch.hide_value ? "" : " · " + fmtState(h, s)}` : fmtState(h, s));
        if (tone(s) === "on" && ["red", "ochre", "teal", "paper"].includes(ch.tone)) {
          btn.dataset.tone = ch.tone; btn.style.setProperty("--hot", ch.tone === "paper" ? "var(--paper-fg)" : `var(--${ch.tone})`);
        }
        btn.onclick = () => moreInfo(this, ch.entity);
        chips.append(btn);
      }
      if (chips.childNodes.length) hero.append(chips);
    }
    b.append(root);
  }
  getCardSize() { return 4; }
}
register("jam-hero", JamHero, "Jam Hero", "Paper slab with clipped corner: big title from an entity, meta line and chips.");
