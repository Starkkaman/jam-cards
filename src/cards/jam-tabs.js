/* ---------- jam-tabs: room tabs (equal-width keys, 8px top-right cut, 4px accent bar) ----------
   {type: custom:jam-tabs, tabs: [{name, path (navigation path, e.g. /jam-overview/kitchen), accent? (colour or room
    alias; default the card accent)}], sticky?: true (the host itself is position:sticky, top var(--header-height, 0))}
   Sticky limit: CSS sticky only works inside the element's containing block. In HA the card sits in hui-card inside a
   section grid cell, so it sticks only while that cell / section is on screen and cannot follow the whole view. Put the
   tabs in their own full-width section at the top of the view; there they stay put, they do not float over later sections.
   The cut corners show the page background (--primary-background-color, else --jam-ink) in both modes.
   The tab whose path equals location.pathname is current: filled with its accent, ink text. Tap = navigate like HA
   (history.pushState + location-changed); the card follows location-changed / popstate. */
class JamTabs extends JamBase {
  constructor() {
    super();
    this._onLoc = () => this._render(false);
  }
  validate(c) {
    if (!Array.isArray(c.tabs) || !c.tabs.length) throw new Error("jam-tabs: tabs is required (list of {name, path})");
    for (const t of c.tabs) if (!t || !t.name || !t.path) throw new Error("jam-tabs: every tab needs name and path");
  }
  connectedCallback() {
    window.addEventListener("location-changed", this._onLoc);
    window.addEventListener("popstate", this._onLoc);
    this._render(false);
  }
  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLoc);
    window.removeEventListener("popstate", this._onLoc);
  }
  css() { return `
    :host([data-sticky]){position:sticky;top:var(--header-height,0);z-index:2}
    :host([data-sticky]) .tabs{background:var(--primary-background-color,var(--ink))}
    .tabs{display:flex;gap:4px}
    .tab{flex:1 1 0;min-width:0;position:relative;font:600 .6rem/1 var(--body);letter-spacing:.1em;text-transform:uppercase;
      padding:10px 4px 12px;background:var(--slab2);color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)}
    .tab::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--c)}
    .tab:hover{color:var(--fg)}
    .tab.on{background:var(--c);color:var(--acc-fg)}
    .tab:active{transform:translate(2px,2px)}`; }
  render(b) {
    const c = this._config;
    this.toggleAttribute("data-sticky", !!c.sticky);
    const here = location.pathname.replace(/\/+$/, "");
    const nav = el("nav", "tabs");
    nav.setAttribute("aria-label", "Rooms");
    for (const t of c.tabs) {
      const path = String(t.path), on = path.replace(/\/+$/, "") === here;
      const btn = el("button", "tab" + (on ? " on" : ""), t.name);
      btn.type = "button";
      btn.style.setProperty("--c", accentVar(t.accent) || "var(--acc)");
      if (on) btn.setAttribute("aria-current", "page");
      btn.onclick = () => { if (!on) navigate(path); };
      nav.append(btn);
    }
    b.append(nav);
  }
  getCardSize() { return 1; }
  getGridOptions() { return {columns: "full", rows: "auto", min_columns: 6}; }
}
register("jam-tabs", JamTabs, "Jam Tabs", "Room tabs: equal-width accent keys that navigate between dashboard views.");
