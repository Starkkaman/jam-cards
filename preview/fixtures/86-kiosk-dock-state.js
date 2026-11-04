// Preview STUB (Glass design review, 2026-11-04): jam-kiosk dock blocks get data-state="on|off|action" from another
// branch (merged later). Until jam-kiosk writes it itself, this stamps the same attribute after every update so a look can
// style the dock states in the preview: action = a block with a tap_action and no sheet cards; on = its state entity (or
// any of count_on) is on / playing / open ...; else off. A block whose data-state the card set itself (no data-jam-stub)
// is left alone, so the stub goes quiet once the real attribute lands; delete this file then. No states, no sections.
{
  const K = customElements.get("jam-kiosk");
  const ON = new Set(["on", "playing", "open", "unlocked", "home", "heat", "cool", "heat_cool", "auto", "active"]);
  if (K && !K.prototype._jamDockStub) {
    const up = K.prototype._update;
    K.prototype._jamDockStub = true;
    K.prototype._update = function () {
      const r = up.apply(this, arguments);
      const h = this._hass, on = id => { const s = h && h.states[id]; return !!s && ON.has(String(s.state)); };
      for (const b of this._blocks || []) {
        if (b.btn.dataset.state && !b.btn.dataset.jamStub) continue;
        const c = b.cfg, st = c.state || {};
        const v = c.tap_action && !(c.cards && c.cards.length) ? "action"
          : (st.count_on ? st.count_on.some(on) : st.entity ? on(st.entity) : false) ? "on" : "off";
        if (b.btn.dataset.state !== v) { b.btn.dataset.state = v; b.btn.dataset.jamStub = "1"; }
      }
      return r;
    };
  }
}
