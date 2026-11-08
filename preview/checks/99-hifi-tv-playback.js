// jam-tv's playback (1.1.0, Isaac 2026-11-08: "Now playing on the TV shows the app, but says idle even when I'm watching a
// movie or a YouTube video"). The Android TV Remote integration reports "on" and the app only, never playing; the TV's
// Google Cast player knows what plays (YouTube's title, position, playing / paused). Scratch cards on the fixture
// 88-tv-playback.js (Den: Android TV on with YouTube, its Cast player playing; Loft: Jamfin, its Cast player off):
//   - auto: the Den card finds its Cast player (registry platform cast, named like the TV) and says "Playing · YouTube" with
//     the title and a Pause key; paused Cast = "Paused"; watched() lists the Cast player;
//   - playback_entity: false, or a Cast session of another app than the one on screen (stale): "On · YouTube" / "On ·
//     Jamfin TV" and the app as the title; never "idle" and never "Nothing playing" anywhere on the card;
//   - playback_entity: <id> works the same as auto; the TV pop-up's summary says Playing + the title;
//   - jam-kiosk's dock word follows it (the title, a Pause key) and its watched() lists the Cast player.
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const H = window.__hass, wait = ms => new Promise(res => setTimeout(res, ms));
    if (!H.states["media_player.pv_den_android_tv"] || !H.entities || !H.entities["media_player.pv_den_cast"]) return {missing: true};
    const box = document.createElement("div"); box.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:8px";
    document.body.prepend(box);
    const den = {type: "custom:jam-tv", media_player: "media_player.pv_den_android_tv", remote: "remote.pv_den_android_tv", name: "TV · Den", current_app_entity: "sensor.pv_den_current_app"};
    const loft = {type: "custom:jam-tv", media_player: "media_player.pv_loft_android_tv", name: "TV · Loft", current_app_entity: "sensor.pv_loft_current_app"};
    const mk = (cfg, h = H) => { const e = document.createElement("jam-tv"); e.setConfig(cfg); e.hass = h; box.append(e); return e; };
    const read = e => { const r = e.shadowRoot; return {word: (r.querySelector(".c-pn .c-wd") || {}).textContent, title: (r.querySelector(".c-mtitle") || {}).textContent,
      pause: !!r.querySelector('[data-key="play_pause"]') && r.querySelector('[data-key="play_pause"]').textContent.trim(), text: r.textContent, watched: e.watched()}; };
    const set = (id, patch) => { const s = H.states[id]; return {...H, states: {...H.states, [id]: {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}}}}; };
    const out = {};
    out.auto = read(mk(den));
    out.explicit = read(mk({...den, playback_entity: "media_player.pv_den_cast"}));
    out.off = read(mk({...den, playback_entity: false}));
    out.paused = read(mk(den, set("media_player.pv_den_cast", {state: "paused"})));
    const jam = set("media_player.pv_den_android_tv", {attributes: {app_id: "com.isaac.jamfin", app_name: "com.isaac.jamfin"}});
    out.stale = read(mk(den, {...jam, states: {...jam.states, "sensor.pv_den_current_app": {...H.states["sensor.pv_den_current_app"], state: "Jamfin TV"}}}));
    out.loft = read(mk(loft));
    await wait(200);
    // the TV pop-up's summary
    const pc = mk(den); await wait(100);
    [...pc.shadowRoot.querySelectorAll("button")].find(b => /open controls/.test(b.getAttribute("aria-label") || "")).click();
    await wait(400);
    const hs = [...document.querySelectorAll(".jam-sheet-host")].pop(), sum = hs && hs.shadowRoot.querySelector(".c-sum");
    out.pop = sum ? sum.textContent : null;
    window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
    // the kiosk dock
    const k = document.createElement("jam-kiosk");
    k.setConfig({type: "custom:jam-kiosk", dock: [{name: "TV", state: {entity: "media_player.pv_den_android_tv", app_entity: "sensor.pv_den_current_app"}, cards: [den]},
      {name: "Loft", state: {entity: "media_player.pv_loft_android_tv", app_entity: "sensor.pv_loft_current_app"}, cards: [loft]}]});
    k.hass = H; box.append(k); await wait(300);
    const kts = [...k.shadowRoot.querySelectorAll(".c-kt")];
    out.kiosk = {words: kts.map(x => (x.querySelector(".c-wd") || {}).textContent), pause: kts.map(x => !!x.querySelector('[data-key^="pause:"]')), watched: k.watched()};
    await wait(350); // the pop-up's leave
    box.remove();
    return out;
  });
  if (r.missing) { check(false, "tv playback: fixture 88-tv-playback.js (states + registry) missing"); return; }
  const T = "media_player.pv_den_cast", title = "How a Creative Couple Transformed an Abandoned Workshop Into Their Home", idle = x => /\bidle\b|nothing playing/i.test(x.text);
  check(r.auto.word === "Playing · YouTube" && r.auto.title === title && r.auto.pause === "Pause" && r.auto.watched.includes(T) && !idle(r.auto),
    `tv playback auto: the Cast player of the same TV gives "${r.auto.word}", the title, a ${r.auto.pause} key (watched: ${r.auto.watched.includes(T)})`);
  check(r.explicit.word === r.auto.word && r.explicit.title === title, `tv playback_entity: <id> = the same ("${r.explicit.word}")`);
  check(r.off.word === "On · YouTube" && r.off.title === "YouTube" && !idle(r.off) && !r.off.watched.includes(T),
    `tv playback_entity false: "${r.off.word}", title ${r.off.title}, no "idle" / "Nothing playing"`);
  check(r.paused.word === "Paused · YouTube" && r.paused.pause === "Play", `tv playback paused Cast: "${r.paused.word}", key ${r.paused.pause}`);
  check(r.stale.word === "On · Jamfin TV" && !idle(r.stale), `tv playback: a Cast session of another app than the one on screen is ignored ("${r.stale.word}")`);
  check(r.loft.word === "On · Jamfin TV" && r.loft.title === "Jamfin TV" && !idle(r.loft), `tv playback: no Cast session (Loft): "${r.loft.word}", the app as the title, never idle`);
  check(!!r.pop && /Playing/.test(r.pop) && r.pop.includes(title), `tv pop-up summary: Playing + the title (${(r.pop || "").slice(0, 60)}…)`);
  check(r.kiosk.words[0] === title && r.kiosk.pause[0] && r.kiosk.words[1] === "On · Jamfin TV" && !r.kiosk.pause[1] && r.kiosk.watched.includes(T),
    `tv playback kiosk dock: ${JSON.stringify(r.kiosk.words)}, Pause ${JSON.stringify(r.kiosk.pause)}, watches the Cast player ${r.kiosk.watched.includes(T)}`);
};
