/* ---------- jam-looks: retired (Jam Cards 1.0.0) ----------
   Until 0.11 this was the look picker (one tile per Jam theme, `settheme` like HA's profile picker). Jam Cards 1.0.0 has
   one look, Hi-Fi, so there is nothing to pick. The tag stays defined so a dashboard that still holds
   `type: custom:jam-looks` shows one quiet line instead of Home Assistant's red "Custom element doesn't exist" card; it is
   no longer offered in the card picker (no customCards entry) and accepts any old config (title, looks, accent). */
class JamLooks extends JamBase {
  css() {
    return `.jl{display:flex;gap:10px;align-items:baseline;padding:12px 14px;border:1px dashed var(--line);border-radius:12px;color:var(--dim);
  font:400 14px/1.35 var(--body)}
.jl b{font:500 12px/1.2 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;flex:none}`;
  }
  render(b) {
    const box = el("div", "jl");
    box.append(el("b", "", "Look"), el("span", "", "Jam Cards has one look now, Hi-Fi. This card can be removed."));
    b.append(box);
  }
  getCardSize() { return 1; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 3}; }
}
if (!customElements.get("jam-looks")) customElements.define("jam-looks", JamLooks);
