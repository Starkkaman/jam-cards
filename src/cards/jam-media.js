/* ---------- jam-media: now playing + transport keys ----------
   {type: custom:jam-media, entity (media_player), name?, controls?: [prev, play_pause, next, stop]} */
class JamMedia extends JamBase {
  validate(c) { if (!c.entity || !c.entity.startsWith("media_player.")) throw new Error("jam-media: entity must be a media_player"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .title{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:.95;text-transform:uppercase;overflow-wrap:anywhere}
    .sub{color:var(--dim);overflow-wrap:anywhere}
    .ctl{display:flex;gap:8px;flex-wrap:wrap}
    .ctl .key{min-width:72px}
    .ctl .key > .face{--p-t:12px;--p-b:12px;--p-l:14px;--p-r:14px}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const t = tone(s);
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: `wrap stripe s-${t}${!s || UNAVAILABLE.has(s.state) ? " unavail" : ""}`});
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const a = (s && s.attributes) || {};
    const title = a.media_title || a.app_name || (s ? fmtState(h, s) : "—");
    const tt = el("div", "title", title); tt.style.cursor = "pointer"; tt.onclick = () => moreInfo(this, c.entity);
    wrap.append(tt);
    const sub = [a.media_artist, a.media_album_name].filter(Boolean).join(" · ");
    if (sub) wrap.append(el("div", "sub", sub));
    const ctl = el("div", "ctl");
    const playing = s && s.state === "playing";
    const map = {
      prev: ["Prev", "media_previous_track"], next: ["Next", "media_next_track"], stop: ["Stop", "media_stop"],
      play_pause: [playing ? "Pause" : "Play", "media_play_pause"],
    };
    for (const k of c.controls || ["prev", "play_pause", "next"]) {
      const m = map[k]; if (!m) continue;
      const btn = cutKey(m[0], `jam-media|${c.entity}|${k}`, k === "play_pause" ? "main on" : "");
      btn.disabled = !s || UNAVAILABLE.has(s.state);
      btn.onclick = () => h.callService("media_player", m[1], {entity_id: c.entity});
      ctl.append(btn);
    }
    wrap.append(ctl);
    b.append(root);
  }
}
register("jam-media", JamMedia, "Jam Media", "Now playing and transport buttons for a media player.");
