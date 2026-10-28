// jam-choice 0.5.1: never wider than its slot. Mounted at 300px with a long name and 3 options; the options wrap.
module.exports = async (page, check) => {
  const m = await page.evaluate(async () => {
    const h = window.__hass, id = "input_select.narrow_probe";
    h.states[id] = {entity_id: id, state: "Photos", attributes: {options: ["Photos", "Clock", "Slideshow"], friendly_name: "Living room iPad"}};
    const wrap = document.createElement("div"); wrap.style.cssText = "width:300px";
    const e = document.createElement("jam-choice"); e.setConfig({type: "custom:jam-choice", entity: id, name: "Living room iPad"}); e.hass = h;
    wrap.append(e); document.body.append(wrap);
    await new Promise(r => setTimeout(r, 100));
    const out = [...e.shadowRoot.querySelectorAll("*")].filter(n => n.getClientRects().length).map(n => n.getBoundingClientRect().right - wrap.getBoundingClientRect().left);
    const res = {w: Math.round(e.getBoundingClientRect().width), right: Math.round(Math.max(...out)), opts: e.shadowRoot.querySelectorAll(".opt").length};
    wrap.remove(); delete h.states[id];
    return res;
  });
  check(m.w <= 300 && m.right <= 300 && m.opts === 3, `jam-choice at 300px stays in its slot (card ${m.w}px, rightmost ${m.right}px, ${m.opts} options)`);
};
