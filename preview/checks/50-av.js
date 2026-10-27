// AV fixture interactions: jam-remote d-pad / custom actions / hold repeat; jam-media v2 transport, volume, mute,
// sources, player switch, group join/unjoin; jam-media v1 config (00-tv) still renders.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check, {callsNow}) => {
  const RID = "remote.living_room_phoster_android_tv";
  const reset = () => page.evaluate(() => { window.__calls.length = 0; });
  const remote = page.locator("jam-remote").first();
  const key = k => remote.locator(`button[data-key="${k}"]`);

  // D-pad: 4 arms + OK disc send the Android TV key codes; hit areas are >= 48 px.
  const want = {up: "DPAD_UP", down: "DPAD_DOWN", left: "DPAD_LEFT", right: "DPAD_RIGHT", ok: "DPAD_CENTER"};
  for (const [k, cmd] of Object.entries(want)) {
    await reset(); await key(k).click();
    const c = await callsNow();
    check(c.length === 1 && c[0].domain === "remote" && c[0].service === "send_command" && c[0].data.entity_id === RID && c[0].data.command === cmd,
      `remote d-pad ${k} sends ${cmd} once`);
    const bb = await key(k).boundingBox();
    check(bb.width >= 48 && bb.height >= 48, `remote d-pad ${k} target >= 48px (${Math.round(bb.width)}x${Math.round(bb.height)})`);
  }
  for (const [k, cmd] of [["home", "HOME"], ["menu", "MENU"], ["back", "BACK"], ["mute", "VOLUME_MUTE"]]) {
    await reset(); await key(k).click();
    check((await callsNow()).some(c => c.service === "send_command" && c.data.command === cmd), `remote ${k} sends ${cmd}`);
  }
  await reset(); await key("power").click();
  check((await callsNow()).some(c => c.domain === "remote" && c.service === "toggle" && c.data.entity_id === RID), "remote power = remote.toggle");
  check(await key("power").evaluate(b => b.classList.contains("alert")), "remote power key is red");
  // Custom actions override the command.
  await reset(); await key("tv").click();
  check((await callsNow()).some(c => c.domain === "script" && c.service === "stereo_input_select_video"), "remote tv key runs script.stereo_input_select_video");
  await reset(); await key("vol_down").click();
  let c = await callsNow();
  check(c.length === 1 && c[0].domain === "script" && c[0].service === "stereo_volume_down", "remote vol_down runs script.stereo_volume_down (not send_command)");
  // Hold vol_up: repeats >= 3 times within 1 s, stops on release.
  await reset();
  const vb = await key("vol_up").boundingBox();
  await page.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2);
  await page.mouse.down(); await page.waitForTimeout(1000); await page.mouse.up();
  const n1 = (await callsNow()).filter(x => x.service === "stereo_volume_up").length;
  await page.waitForTimeout(600);
  const n2 = (await callsNow()).filter(x => x.service === "stereo_volume_up").length;
  check(n1 >= 3, `hold vol_up repeats (${n1} calls in 1 s)`);
  check(n2 === n1, `hold vol_up stops on release (${n1} -> ${n2})`);
  // Hold on a d-pad arm also repeats; leaving the key stops it.
  await reset();
  const rb = await key("right").boundingBox();
  await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2);
  await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.move(rb.x - 200, rb.y - 200);
  const r1 = (await callsNow()).filter(x => x.data.command === "DPAD_RIGHT").length;
  await page.waitForTimeout(500); await page.mouse.up();
  const r2 = (await callsNow()).filter(x => x.data.command === "DPAD_RIGHT").length;
  check(r1 >= 2 && r2 === r1, `hold d-pad right repeats and stops on leave (${r1} -> ${r2})`);

  // jam-media v1 config (00-tv) still renders: title, transport, no art-less crash.
  const v1 = page.locator("jam-media").first();
  check((await v1.locator(".title").textContent()) === "Close Encounters of the Third Kind", "jam-media v1 config renders its title");
  check(await v1.locator(".track").count() === 0, "jam-media v1 player without volume support shows no volume strip");

  // jam-media v2 (kitchen).
  const MID = "media_player.kitchen";
  const media = page.locator("jam-media").nth(1);
  check(await media.locator(".art img").count() === 1, "jam-media v2 shows art as an image");
  check(await media.locator(".art img").evaluate(i => getComputedStyle(i).mixBlendMode) === "multiply", "art is a multiply duotone print");
  for (const [k, svc] of [["prev", "media_previous_track"], ["play_pause", "media_play_pause"], ["next", "media_next_track"]]) {
    await reset(); await media.locator(`button[data-key="${k}"]`).click();
    c = await callsNow();
    check(c.some(x => x.domain === "media_player" && x.service === svc && x.data.entity_id === MID), `media ${k} calls ${svc}`);
  }
  await reset();
  const tb = await media.locator(".track").boundingBox();
  await page.mouse.click(tb.x + tb.width * 0.5, tb.y + tb.height / 2);
  c = await callsNow();
  check(c.some(x => x.service === "volume_set" && x.data.entity_id === MID && Math.abs(x.data.volume_level - 0.5) < 0.011), "media volume strip at 50% sets volume 0.5");
  await reset(); await media.locator('button[data-key="mute"]').click();
  check((await callsNow()).some(x => x.service === "volume_mute" && x.data.entity_id === MID && x.data.is_volume_muted === true), "media mute key mutes");
  await reset(); await media.locator(".sources button", {hasText: "Spotify Connect (Kitchen)"}).click();
  check((await callsNow()).some(x => x.service === "select_source" && x.data.entity_id === MID && x.data.source === "Spotify Connect (Kitchen)"), "media source chip selects source");
  // Group chips only for members with the GROUPING feature bit (House lacks it, like the real entity).
  check(await media.locator('.group button[data-id="media_player.oneplus_speaker_2"]').count() === 1 &&
    await media.locator('.group button[data-id="media_player.house"]').count() === 0, "group row hides a member without the GROUPING bit");
  // Group join, then unjoin once HA reports the member.
  await reset(); await media.locator('.group button[data-id="media_player.oneplus_speaker_2"]').click();
  check((await callsNow()).some(x => x.service === "join" && x.data.entity_id === MID && x.data.group_members[0] === "media_player.oneplus_speaker_2"), "group chip joins speaker to kitchen");
  await page.evaluate(() => { const h = window.__hass, k = h.states["media_player.kitchen"];
    h.states["media_player.kitchen"] = {...k, attributes: {...k.attributes, group_members: ["media_player.kitchen", "media_player.oneplus_speaker_2"]}, last_updated: "g"};
    document.querySelectorAll("jam-media").forEach(m => m.hass = {...h}); });
  const gk = media.locator('.group button[data-id="media_player.oneplus_speaker_2"]');
  check(await gk.getAttribute("aria-pressed") === "true", "joined speaker chip is on");
  await reset(); await gk.click();
  check((await callsNow()).some(x => x.service === "unjoin" && x.data.entity_id === "media_player.oneplus_speaker_2"), "group chip unjoins the speaker");
  // Player switch: House takes over the controls, Kitchen brings it back.
  await media.locator('.players button[data-id="media_player.house"]').click();
  check((await media.locator(".label").first().textContent()) === "House", "player chip switches the card to House");
  check(await media.locator(".group").count() === 0, "group row hidden when the controlled player (House) lacks the GROUPING bit");
  await reset(); await media.locator('button[data-key="play_pause"]').click();
  check((await callsNow()).some(x => x.service === "media_play_pause" && x.data.entity_id === "media_player.house"), "transport follows the selected player");
  await media.locator('.players button[data-id="media_player.kitchen"]').click();
  check((await media.locator(".label").first().textContent()) === "Kitchen Speakers", "player chip switches back to Kitchen");
};
