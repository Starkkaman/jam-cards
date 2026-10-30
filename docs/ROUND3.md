# Round 3 (2026-10-30): decided designs
Mockup (source of truth for the look): docs/round3-mockup.html. Open it with Playwright to see it; sections "Take 3",
"3 · TV remote and sources", "4 · Speaker card" (panel B), "5 · Kiosk music" (K1, as revised in Take 3).

## Interaction rule (all on/off cards: jam-light, jam-button with a switch/input_boolean, jam-fan, jam-tv, jam-speaker, …)
- Top-right corner triangle (≈46px; TV keeps its own) = power toggle, glyph = power icon.
- Tap anywhere else on the card = open its panel (pop-up). Lights: horizontal drag still dims.
- Corner colour = a shade of the card face (darker on light faces, lighter on dark faces), never the page background.

## Lights (jam-light)
- Name bigger (display 24px on the 84–96px card). Brightness strip (bottom, 10px) = shade of the face colour: track = deep
  shade, fill = mid shade. Same shade family for the corner.
- Text ink/paper by luminance; if contrast < 4.5:1 for both, put the text on an ink label plate.
- Group: face = AVERAGE of the members that are ON; member bands are VERTICAL side-by-side stripes, one per member, off
  members = slab2. Two layouts behind `member_bands: "corner" | "full"` (V1 = a block under the power corner, V2 = full
  height of the right edge with the power corner in ink on top). Default "full" until the user picks.
- Pop-up: "Edit" toggle. In edit mode each of the two whites gets a pencil (rename + kelvin slider within the light's range;
  saved per HA user via frontend/set_user_data, key jam_whites, keyed by entity), and each saved colour gets an × to remove
  it (jam_colors). "Done" leaves edit mode. Config `whites` stays the default when nothing is saved.

## TV (jam-tv)
- Always opens on Now playing (also when off: poster "TV off" + big Turn on).
- Poster: title on a solid ink band (title 34px display, kicker/time 12–14px full cream), progress strip, ink power corner.
- Keys by job: Prev / big Play (accent) / Next with SVG glyphs; volume = one violet rocker (− | Mute | +); bottom row =
  outlined Remote and Source tabs with icons. Source opens its own sheet (not a tab swap).
- Remote sheet: header Remote + keyboard key + Close. TV group (teal rule, red power): D-pad with teal OK, Back/Home/Menu/
  Settings with icons, Rewind/Play/Forward. Stereo group (violet rule, violet power): rocker, inputs TV/Turntable/Music sync.
- Source sheet: "Inputs" (2-up) and "Apps" (3-up) big colour tiles with an icon, current = cream outline + "On now" stamp;
  a "Home screen" tile at the end.

## Speaker (jam-speaker)
- Card = TV-style: art (entity_picture) or, when idle, a cut-paper abstract (flat circles/bars/strips from the Jam palette,
  seeded so it changes each time the player goes idle; no animation). Ink title band: kicker = coloured dot (Spotify green /
  MA violet / idle dim) + "Room · source", title, artist; small (32px) Shuffle and Favourite keys at the right of the band.
  Power corner. Row: Prev / big Play / Next. Volume bar − / + / number.
- Panel = B: mini header (thumb, room, source, Close), tabs Pinned / Recent / Playlists / Albums / Search as a list with
  cover thumbs + Play, and a docked bottom bar (thumb, title, Prev, Play, Next, Favourite).
- Pinned = config `pinned:` list (MA URIs) merged with per-user pins (user data key jam_pins); pin/unpin from any list row.
- Kiosk size = K1: art flush left; right panel in the art's dominant colour (sampled), ink controls: Shuffle + Favourite by
  the kicker, huge title, artist, progress line with times, Prev/Play/Next, volume −/bar/+, Speakers key; bottom shelf of
  covers (pinned, then recent, last tile "Browse" opens panel B).
