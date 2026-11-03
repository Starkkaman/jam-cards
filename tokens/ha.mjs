// Home Assistant theme keys per mode, derived from a look's palette (tools/themes.mjs writes them after the --jam-* tokens).
// Values: "{jam-x}" = that mode's token, "{alias}" = an alias below (a look's mode.ha overrides it), "{rgb:x}" = the
// colour as "r, g, b"; anything else is literal. Entries starting with "#" are comment lines in the YAML.
// Ramp: ha-color-primary-05..95 come from mode.ha.ramp (11 colours, 40 = the primary); a look without one gets none.
export const HA_ALIASES = {
  ground: "{jam-ink}",          // page ground (primary-background-color, lovelace-background)
  ground2: "{jam-slab}",        // secondary-background-color
  primary: "{jam-ochre}",       // HA primary (switches, header rule, badges)
  secondary: "{jam-red}",       // HA accent-color
  faint: "{jam-paper-dim}",     // disabled text, inactive state icons
  "chrome-bg": "{jam-ink}",     // app header + sidebar
  "chrome-fg": "{jam-fg}",
  "chrome-dim": "{jam-dim}",
  "chrome-accent": "{jam-ochre}", // selected sidebar item
  "header-rule": "4px solid {primary}", // app header bottom border
};
const RAMP = ["05", "10", "20", "30", "40", "50", "60", "70", "80", "90", "95"];
export const HA_KEYS = [
  "# Home Assistant",
  ["primary-color", "{primary}"],
  ["accent-color", "{secondary}"],
  ["rgb-primary-color", "{rgb:primary}"],
  ["rgb-accent-color", "{rgb:secondary}"],
  "# primary ramp (OKLCH, HA default lightness steps; 40 = primary-color)",
  ...RAMP.map((s, i) => ["ha-color-primary-" + s, "{ramp:" + i + "}"]),
  ["ha-color-on-primary-loud", "{jam-on-fg}"],
  ["text-primary-color", "{jam-on-fg}"],
  ["text-accent-color", "{jam-fg}"],
  ["primary-background-color", "{ground}"],
  ["secondary-background-color", "{ground2}"],
  ["lovelace-background", "{ground}"],
  ["card-background-color", "{jam-slab}"],
  ["ha-card-background", "{jam-slab}"],
  ["ha-dialog-surface-background", "{jam-slab}"],
  ["primary-text-color", "{jam-fg}"],
  ["secondary-text-color", "{jam-dim}"],
  ["disabled-text-color", "{faint}"],
  ["rgb-primary-text-color", "{rgb:jam-fg}"],
  ["divider-color", "{jam-line}"],
  ["outline-color", "{jam-line}"],
  ["state-icon-color", "{jam-dim}"],
  ["state-active-color", "{jam-ochre}"],
  ["state-inactive-color", "{faint}"],
  ["state-unavailable-color", "{jam-red}"],
  ["state-light-active-color", "{jam-ochre}"],
  ["state-switch-active-color", "{jam-ochre}"],
  ["state-media_player-active-color", "{jam-teal}"],
  ["state-climate-heat-color", "{jam-red}"],
  ["state-climate-cool-color", "{jam-teal}"],
  ["error-color", "{jam-red}"],
  ["warning-color", "{jam-ochre}"],
  ["success-color", "{jam-teal}"],
  ["info-color", "{jam-teal}"],
  "# HA named colours (tile/button cards, `color:` options) -> jam palette",
  ["red-color", "{jam-red}"],
  ["orange-color", "{jam-ochre}"],
  ["amber-color", "{jam-ochre}"],
  ["yellow-color", "{jam-ochre}"],
  ["teal-color", "{jam-teal}"],
  ["cyan-color", "{jam-teal}"],
  ["blue-color", "{jam-blue}"],
  ["pink-color", "{jam-pink}"],
  ["purple-color", "{jam-violet}"],
  ["green-color", "{jam-green}"],
  ["app-header-background-color", "{chrome-bg}"],
  ["app-header-text-color", "{chrome-fg}"],
  ["app-header-border-bottom", "{header-rule}"],
  ["sidebar-background-color", "{chrome-bg}"],
  ["sidebar-text-color", "{chrome-fg}"],
  ["sidebar-icon-color", "{chrome-dim}"],
  ["sidebar-selected-text-color", "{chrome-accent}"],
  ["sidebar-selected-icon-color", "{chrome-accent}"],
  ["sidebar-menu-button-text-color", "{chrome-fg}"],
  ["ha-switch-checked-background-color", "{primary}"],
  ["ha-switch-checked-border-color", "{primary}"],
  ["ha-switch-checked-thumb-background-color", "{jam-on-fg}"],
  ["ha-switch-checked-thumb-border-color", "{jam-on-fg}"],
  ["ha-switch-background-color", "{jam-line}"],
  ["ha-switch-border-color", "{jam-line}"],
  ["ha-switch-thumb-background-color", "{jam-dim}"],
  ["ha-switch-thumb-border-color", "{jam-dim}"],
  ["input-fill-color", "{jam-slab2}"],
  ["input-ink-color", "{jam-fg}"],
  ["input-label-ink-color", "{jam-dim}"],
  ["input-idle-line-color", "{jam-line}"],
  ["input-hover-line-color", "{jam-dim}"],
  ["ha-color-form-background", "{jam-slab2}"],
  ["ha-color-form-background-hover", "{jam-line}"],
  ["ha-color-form-background-disabled", "{jam-slab}"],
  ["ha-color-border-neutral-quiet", "{jam-line}"],
  ["ha-color-border-neutral-normal", "{jam-dim}"],
  ["ha-color-border-neutral-loud", "{jam-dim}"],
  ["mdc-theme-primary", "{primary}"],
  ["mdc-theme-secondary", "{secondary}"],
  ["mdc-theme-surface", "{jam-slab}"],
  ["mdc-theme-text-primary-on-background", "{jam-fg}"],
  ["mdc-select-fill-color", "{jam-slab2}"],
  ["mdc-text-field-fill-color", "{jam-slab2}"],
  ["code-editor-background-color", "{jam-slab}"],
  ["markdown-code-background-color", "{jam-slab2}"],
  ["table-row-background-color", "{jam-slab}"],
  ["table-row-alternative-background-color", "{jam-slab2}"],
  ["scrollbar-thumb-color", "{jam-line}"],
  ["badge-color", "{primary}"],
  ["label-badge-red", "{jam-red}"],
  ["label-badge-blue", "{jam-teal}"],
  ["label-badge-green", "{jam-green}"],
  ["label-badge-yellow", "{jam-ochre}"],
  ["label-badge-background-color", "{jam-slab}"],
  ["label-badge-text-color", "{jam-fg}"],
  ["energy-grid-consumption-color", "{jam-red}"],
  ["energy-solar-color", "{jam-ochre}"],
  ["energy-battery-in-color", "{jam-teal}"],
  ["history-unavailable-color", "{jam-line}"],
  ["graph-color-1", "{jam-s1}"],
  ["graph-color-2", "{jam-s2}"],
  ["graph-color-3", "{jam-s3}"],
  ["graph-color-4", "{jam-s4}"],
  ["graph-color-5", "{jam-s5}"],
  ["weather-icon-sun-color", "{jam-ochre}"],
  ["weather-icon-moon-color", "{jam-fg}"],
  ["weather-icon-rain-color", "{jam-teal}"],
  ["weather-icon-cloud-back-color", "{jam-dim}"],
  ["weather-icon-cloud-front-color", "{jam-fg}"],
  ["weather-icon-snow-color", "{jam-fg}"],
  ["weather-icon-snow-stroke-color", "{jam-dim}"],
];

/* Resolves one template value for a mode: {tokens, ha}. Aliases may point at tokens or literals; unknown names throw. */
export function haValue(tpl, mode) {
  const aliases = {...HA_ALIASES, ...(mode.ha || {})};
  const ref = (name, depth = 0) => {
    if (depth > 5) throw new Error("ha: alias loop at " + name);
    if (name in mode.tokens) return mode.tokens[name];
    if (name in aliases && typeof aliases[name] === "string") return resolve(aliases[name], depth + 1);
    throw new Error("ha: unknown reference {" + name + "}");
  };
  const resolve = (s, depth = 0) => s.replace(/\{([\w:-]+)\}/g, (_, n) => {
    if (n.startsWith("rgb:")) {
      const h = ref(n.slice(4), depth).replace("#", "");
      if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error("ha: {" + n + "} is not a #rrggbb colour");
      return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(", ");
    }
    if (n.startsWith("ramp:")) {
      const r = mode.ha && mode.ha.ramp;
      if (!Array.isArray(r) || r.length !== 11) throw new Error("ha: mode.ha.ramp must hold 11 colours (05..95)");
      return r[+n.slice(5)];
    }
    return ref(n, depth);
  });
  return resolve(tpl);
}
