# Jam Cards

Lovelace cards for Home Assistant in one look, **Hi-Fi**: calm instruments (Jam Design pass 6 + 7). Callsheet paper by day
and navy by night, Jost for words and IBM Plex Mono for small labels and numbers, flat panels with a hairline edge and soft
corners, no shadows or glow. Orange is the one thing to do now (at most one per screen), red is alert, and state is colour +
shape + word. Lights get a rocker (or the small switch) beside a vertical brightness fader; everything else that is plainly
on / off gets the small channel-reveal switch, its accent by kind; the kiosk is a clock, the door and three keys whose
sheets never scroll.

![Night](preview/shots/dark-1280.png)
![Day](preview/shots/light-1280.png)

## Install
1. HACS → Custom repositories → `Starkkaman/jam-cards`, category **Dashboard** → Download. The resource is added for you.
2. For the Day and Night palettes, also install the [Hi-Fi theme](https://github.com/Starkkaman/jam-theme) (HACS category
   **Theme**, the repo `jam-theme`) and select **Hi-Fi** (profile, or `frontend.set_theme` with `name: Hi-Fi`, once for
   light and once with `mode: dark`). Without it the cards draw Hi-Fi Night from their own values.
3. Kiosks that follow the sun (1.0.1): the same file also holds **Hi-Fi Day** and **Hi-Fi Night**, each one palette with no
   modes. An automation that runs `frontend.set_theme` with `name: Hi-Fi Day` at sunrise and `name: Hi-Fi Night` at sunset
   (each once with `mode: light` and once with `mode: dark`) sets the default theme, so every device on the default theme
   (the kiosks) switches with the sun whatever its own dark setting; whoever picks **Hi-Fi** in their profile keeps following
   their own device.

**1.1.2: rocker symbols on the iPad.** On Safari / WKWebView up to iPadOS 17 the rocker's I sat against the top of its half
(like a "T") and the O right under the split: WebKit's default style for buttons kept the two halves from filling the
rocker. Both symbols are now centred in their halves in every browser.

**1.1.1: calmer kiosk Lights sheets.** In a kiosk's Lights sheet the rocker and fader of a `size: kiosk` light keep a sensible
height (at most 200px) instead of stretching to the sheet, a switch's card shows a wall plate with its switch in the middle,
and the rows sit in the middle of the sheet with the purifier / All off row at its natural height.

**1.1.0: the house's pop-ups, playback on the TV, motion.** Tap the inside half of jam-house (or the inside part of the
kiosk's facts line) for the indoor climate: temperature, humidity and the air now, each room with a 24 h sparkline, and the
house's 24 h temperature and humidity graphs. Tap the outside half (the weather part on the kiosk) for the next five days
from the weather entity (OpenWeatherMap here): the condition, a low-high bar on one scale for every day with today's
temperature on it, rain chance and amount, wind, plus feels like, humidity, wind, pressure, UV and clouds now
(`inside_more` / `outside_more`, below). jam-tv finds the TV's Google Cast player (`playback_entity`), so a YouTube video
shows as Playing with its title and position even though Android TV Remote only says "on"; without playback it says
"On · YouTube", never idle. Pop-ups open and close with motion again: a phone's bottom sheet rises in, a centred pop-up
settles in, the veil fades, and closing plays it backwards (a fade only with `JamCards.motion = "calm"`, jam-screensaver
`motion: calm`; none with reduced motion). The phone remote's sheet is taller, so the whole remote shows. Every rocker keeps the
lighter shade whether the light is on or off (a toggle used to redraw it with a dark grey half). The jam-popup kicker is dim text with the accent as a mark beside it.

**1.0.1: Hi-Fi Day and Hi-Fi Night.** Two single-mode themes next to Hi-Fi in `themes/jamboard.yaml` (jam-theme), generated
from the same tokens. Every Hi-Fi theme carries `--jam-mode: day | night`, and the cards decide day or night from it (the
rocker's tones, the night marks of pop-ups, the kiosk and the remote), never from Home Assistant's dark-mode flag or the OS
scheme, so "Hi-Fi Day" on a device in dark mode draws Day everywhere, sheets, pop-ups and the screensaver included. A theme
without the token (Hi-Fi from 1.0.0) still works: the cards fall back to the face's brightness.

**1.0.0: Hi-Fi is the only look.** The Jam Calm look of 0.11 is now built in as **Hi-Fi** (look id `hifi`) and is the
default. Every other look was removed: Poster (the old default and the "JamBoard" theme), Braun, Olympia, Transit, Grid,
Pulsar, New Wave, Brutal, Glass and Girard, with their fonts (Londrina Solid, Archivo, Albert Sans, Arimo, Hanken Grotesk,
Silkscreen, Bricolage Grotesque, Figtree, Fraunces, Work Sans), so there is nothing to pick: the jam-looks picker card is
retired (a dashboard that still holds `custom:jam-looks` shows one quiet line saying it can be removed). The eleven look cards
made for other looks were removed too: jam-dial, jam-keypad, jam-radio, jam-pictogram, jam-programme, jam-results,
jam-linemap, jam-arrivals, jam-matrix, jam-ridge and jam-sticker (Home Assistant shows its "Custom element doesn't exist"
card where one is still configured). The cards draw Hi-Fi under any theme: the theme-level values (type, shapes, motion) are
fixed in the cards, and a card under no Hi-Fi theme (Home Assistant's default theme, or an old Jam theme file still in
`config/themes/`) draws the built-in Night palette. With the Hi-Fi theme selected the cards follow its Day and Night
palettes. Update [jam-theme](https://github.com/Starkkaman/jam-theme) as well: `themes/jamboard.yaml` (the file HACS
installs) now holds the theme **Hi-Fi** instead of JamBoard; select **Hi-Fi** after `frontend.reload_themes`.
Cards Hi-Fi draws in layouts of its own: jam-light, jam-tile / jam-button on switches and actions, jam-fan (the purifier),
jam-scenes, jam-house, jam-heading, jam-tv (TV card + TV / Source / Remote pop-ups), jam-speaker, jam-media `compact` (the PC
row) and jam-kiosk. Every other card keeps its own layout in the Hi-Fi skin (Plex Mono labels, flat keys with a hairline,
grooves like the faders, no cut corners, the default accent is the ink instead of a room colour).

Twenty-two cards have a visual editor and a live preview in the card picker: jam-heading, jam-hero, jam-tile, jam-choice,
jam-slider, jam-button, jam-gauge, jam-fan, jam-weather, jam-graph, jam-alerts, jam-light, jam-speaker, jam-media,
jam-house, jam-screensaver, jam-list, jam-panel, jam-tabs, jam-scenes and jam-tv (main options and sources). List options
such as hero chips, list rows, panel rows, tabs, scenes, house alerts, light whites / presets, speaker pins, screensaver
`now` and TV sources are edited as a list of items (Home Assistant 2026.10 or newer). Options the form does not show
(tile tones, fan speeds / presets, jam-media `sources` / `more`, TV `stereo` / `remote_card`, screensaver `kiosk` ...)
stay YAML and are kept when you edit the form; a config the form cannot show (a bare id in a list of `{entity, name}`
items, a bare uri among pins) opens in the YAML editor instead. jam-remote, jam-kiosk and jam-popup are YAML only (the
tables below). The screensaver stays inert in the picker and while the dashboard is in edit mode. Unknown or unavailable
entities render as unavailable instead of throwing.
Fonts (OFL): Jost 400-600 is embedded in `jam-cards.js` (latin subset); IBM Plex Mono (IBM's own Latin1 files, unmodified)
and a Jost 300 face are files in `fonts/` next to it. Licences are in `dist/fonts/`. Nothing is fetched from outside Home
Assistant (the screensaver's `images.index` is whatever URL you configure).

**Upgrading from 0.7.x (files moved to `dist/`).** The repository ships `dist/jam-cards.js` plus `dist/fonts/`; HACS
downloads the whole `dist/` folder into the same place as before, so the dashboard resource stays
`/hacsfiles/jam-cards/jam-cards.js`: update in HACS and reload the browser. Manual installs: copy the whole `dist/` folder
(not only `jam-cards.js`) to `www/jam-cards/` and keep the resource `/local/jam-cards/jam-cards.js`; if the fonts are
missing, the labels fall back to the system monospace and nothing else breaks.

## Colours
Every card takes `accent:` — `ochre`, `teal`, `blue`, `pink`, `violet`, `green`, `red`, or a room alias: `living` (walnut),
`kitchen` (teal), `master` (blue), `marissa` (pink), `music` (violet), `nerd` (green), `alert` (red), or `ink` / `paper`.
In Hi-Fi an accent is quiet: without one, a card's on-state and fills use the ink (pressed keys are deeper paper with an ink
edge, never a colour fill), so set `accent` only where a colour carries meaning. On the small switch (switches, plugs, the
purifier) `accent` overrides the colour by kind (plugs / power blue, air / climate teal, automations violet, settings
steel). Orange is kept for the one thing to do now (Lock by day, Pause where something plays, the remote's OK) and red for
alerts (solid red keys with dark text). Inside pop-ups and sheets the cards sit on the page ground.

## Actions
Cards that list `tap_action`, `hold_action` (500 ms) or `double_tap_action` accept standard Lovelace action objects:
`more-info`, `toggle`, `navigate` (`navigation_path`), `url` (`url_path`), `perform-action` / `call-service`
(`perform_action`, `data`, `target`) and `none`. Add `confirmation: true` or `confirmation: {text: ...}` to ask first.

## Cards
24 cards. Every card takes `accent`. The full option list of each card is in the header comment of `src/cards/jam-*.js`.

### jam-heading
Section label with a big title over a 5px accent rule.
```yaml
type: custom:jam-heading
title: Living room
kicker: Downstairs
```
| Option | Description |
|---|---|
| `title` | Title (required) |
| `kicker` | Small label above the title |
| `accent` | Rule colour (see Colours) |
| `entities` | List of entity ids shown as state chips |
| `tap_action`, `hold_action`, `double_tap_action` | Actions |
| `size` | Jam Calm: `small` = a group label over a hairline ("Watch and listen") instead of the room head |

### jam-hero
Paper slab with a cut corner: a big title (fixed or from an entity), meta line and chips.
```yaml
type: custom:jam-hero
kicker: Living room TV
title_entity: sensor.tv_current_app
power_entity: switch.tv_power
off_title: TV off
```
| Option | Description |
|---|---|
| `kicker` | Small label above the title |
| `title` / `title_entity` | Fixed title, or an entity whose state is the title |
| `meta_entities` | List of entity ids shown as a meta line |
| `power_entity` | When off, shows `off_title` / `off_text` instead |
| `off_title`, `off_text` | Text shown while `power_entity` is off |
| `chips` | List of `{entity, name, show_state, hide_value, tone}`; a chip is hot (accent colour) when its entity is on; `show_state` shows the chip only in that state; `hide_value` hides the value; `tone`: any accent name, or `paper` |
| `accent` | Hot chips and separators (default ochre; see Colours) |

### jam-tile
Entity block with a status stripe and an optional control.
```yaml
type: custom:jam-tile
entity: switch.coffee_machine
```
| Option | Description |
|---|---|
| `entity` | Entity id (required) |
| `name` | Name override |
| `label` | Fixed text instead of the state |
| `control` | `auto` / `toggle` / `lock` / `press` / `none` (auto: lock → lock, button → press, on/off → toggle) |
| `tones` | Map of state → `on` / `alert` / `calm` / `off` |
| `show_last_changed` | Show when the state last changed |
| `tap_action`, `hold_action`, `double_tap_action` | Actions |
| `kind`, `glyph` | Jam Calm: an on / off entity is a switched-device card with the small switch; `kind` sets its accent (`plug`, `climate`, `auto`, `set`; default by domain), `accent` overrides it; `glyph` = `tree`, `fan`, `plug`, `drop`, `air`, `auto` (default from the name) |

### jam-choice
A `select` / `input_select` as option chips; the selected one fills with the accent.
```yaml
type: custom:jam-choice
entity: input_select.house_mode
```
| Option | Description |
|---|---|
| `entity` | select / input_select (required) |
| `name` | Name override |
| `options` | Subset and order of options to show |
| `columns` | Number of chip columns |

### jam-slider
Strip for number / input_number, light brightness, media volume or fan speed.
```yaml
type: custom:jam-slider
entity: light.desk
```
| Option | Description |
|---|---|
| `entity` | number / input_number / light / media_player / fan (required) |
| `name` | Name override |
| `min`, `max`, `step` | Range overrides |

### jam-media
Now playing as a duotone print, with transport, volume, sources, player switch and grouping.
```yaml
type: custom:jam-media
entity: media_player.kitchen
```
| Option | Description |
|---|---|
| `entity` | media_player (required) |
| `name` | Name override |
| `controls` | Subset of `prev`, `play_pause`, `next`, `stop` |
| `show_art` | Show artwork (default true) |
| `show_volume` | Show volume (default: when the player supports it) |
| `sources` | `true` or a list of sources to offer |
| `players` | media_player ids: chip row that switches the controlled player |
| `group` | media_player ids: join / unjoin chips (shown only when both players support grouping) |
| `compact` | Mini layout: 52px art, title, sub line and one key (⋯ with `more`, else play/pause) |
| `size` | `kiosk` (0.6.0, wins over `compact`): fullscreen-sheet layout for jam-kiosk — large square art, big title, sub line, 64 px keys (transport with a media_player, ⋯ with `more`); fills the sheet height |
| `more` | `{title, kicker, cards}`: ⋯ key opening a sheet with these cards (they get this card's hass) |
| `title_entity`, `state_entity`, `picture_entity`, `sub_entities` | Players without a media_player (e.g. a PC): title from an entity state, on/off tone, art from `entity_picture`, sub line of `id` or `{entity, name}`; `entity` is optional then. A title state of `Nothing` / `None` / `Idle` (0.6.1) shows as "Idle" |
| `sleep_action`, `wake_action` | Jam Calm: the PC row's Sleep / Wake key (`compact`, or `size: kiosk` with a `title_entity`) |
| `accent` | Art block, play key, volume fill, active chips |

### jam-button
Chunky key for launchers, scenes, scripts and openers: a small accent square carries the icon; an on light/switch/fan/input_boolean fills the whole key with the accent.
For a light / switch / fan / input_boolean the top-right corner is a **power corner** (tap = toggle; P or Shift+Enter on the
focused key); a tap anywhere else opens the entity's more-info dialog (or runs `tap_action`).
```yaml
type: custom:jam-button
entity: scene.movie_night
accent: red
```
| Option | Description |
|---|---|
| `entity` | Entity id (entity, `name` or `icon` required) |
| `name`, `icon` | Label and icon |
| `accent` | Any accent (see Colours), `paper`, or `ink` (plain key, no square) |
| `color` | HA colour name instead of `accent` (blue/indigo → blue, purple → violet, green/lime → green, cyan → teal, pink → pink, orange/amber/yellow → ochre, red → red, grey → ink) |
| `show_state` | Show the entity state |
| `size` | `normal` (96 px, same as a jam-light card) / `big` (120 px) |
| `tap_action`, `hold_action`, `double_tap_action` | Actions (default tap: scene/script → turn_on, button → press, light/switch/fan/input_boolean → more-info (the power corner toggles), other toggleable → toggle, else more-info) |

### jam-gauge
Half-disc of cut wedges (or a strip) with a big numeral; read-only.
```yaml
type: custom:jam-gauge
entity: sensor.cpu_load
severity: {green: 0, yellow: 60, red: 85}
```
| Option | Description |
|---|---|
| `entity` | Numeric entity (required) |
| `name` | Name override |
| `min`, `max` | Range (default 0–100) |
| `unit` | Unit override |
| `severity` | `{green, yellow, red}` band starts (HA semantics) |
| `style` | `arc` / `bar` |
| `tap_action`, `hold_action`, `double_tap_action` | Actions |

### jam-list
One paper sheet of entity rows (replaces the entities card). Row tap opens more-info.
```yaml
type: custom:jam-list
title: Doors
entities: [binary_sensor.front_door, lock.back_door]
```
| Option | Description |
|---|---|
| `title` | Sheet title |
| `entities` | List of entity ids or `{entity, name, secondary_info: last-changed / none}` |
| `state_color` | Colour states (default true) |

### jam-light
The card is painted in the light's own colour (at full value); big name, brightness number, a brightness strip and a
power corner in shades of that colour. Tap the corner to switch the light on/off, drag sideways to dim, tap anywhere else
to open the light pop-up: brightness bar, two whites or WLED preset cards, hue strip, "Your colours" (saved per HA user),
group members and an off-timer. Keyboard: Enter = pop-up, P or Shift+Enter = power, ←/→ = ±10 %.
On very mid-tone colours (where neither black nor cream text is readable) the name and number sit on black label plates.

A group light (one with member lights) takes the average colour of its members that are on, says "2 of 3 on" while only
some are, and shows one vertical colour band per bulb on its right edge (off bulbs dark). `member_bands: corner` puts the
bands in a small block under the power corner instead.

The pop-up's **Edit** key: tap a white's pencil to rename it and set its warmth (kelvin, within the light's range); tap ×
on a saved colour to remove it; **Done** to finish. Edited whites are saved per HA user and per light.

Stepless colour (Hi-Fi pop-up, 1.0.0): a light with a colour mode (hs, xy, rgb, rgbw, rgbww; groups and WLED included) gets
**Hue** (0–360°, the track is the spectrum) and **Saturation** (0–100 %, white to the hue) sliders, full width in the Colour
block (they replaced the 12-swatch strip), each with its name and value (Plex Mono) on a line above and a chip showing the result; a light with colour temperature only gets a stepless
**Temperature** slider (the light's min / max kelvin) under its whites. Drag or use the keys (hue / saturation: arrows ±1,
Page ±10, Home / End; temperature: ±50 / ±500 K); the light follows at most every 300 ms while dragging and once more on
release (`light.turn_on` with `hs_color` / `color_temp_kelvin`, which also turns a light that is off on).
```yaml
type: custom:jam-light
entity: light.living_room
```
| Option | Description |
|---|---|
| `entity` | light (required) |
| `name`, `icon` | Name and icon |
| `accent` | Fill when the light reports no colour |
| `kicker` | Pop-up label (default the light's area) |
| `whites` | Two `{name, kelvin}` (default Cozy 2200 / Clean 4000; whites edited in the pop-up win) |
| `preset_entity` | A `select` of presets (e.g. WLED) shown as cards instead of the whites |
| `presets` | Extra pop-up chips: `{name, color_temp_kelvin or rgb_color, brightness_pct}` |
| `timer_script` | Off-timer script (default `script.jam_light_off_in`, fields `entity_id` + `minutes`; the row hides without it) |
| `show_brightness`, `show_color_temp`, `show_color`, `show_members` | Show/hide pop-up parts (whites, hue / saturation sliders + your colours, group members) |
| `member_bands` | Group lights: `full` (default, bands down the whole right edge, black power corner on top) or `corner` (a block under the power corner) |
| `tap_action`, `hold_action` | Card actions (default tap and hold: the pop-up; the power corner always toggles) |
| `size` | `kiosk` (opt-in): a 150 px block for kiosk sheets — 36 px name, 18 px sub line, 52 px number, 64 px power corner, nothing under 18 px. Two to a row (`columns: 2` on the jam-kiosk block) gives the big-light sheet |
| `switch` | `corner` (default: the power corner), `toggle` (opt-in: the small channel-reveal switch top-right; plug / power blue, `switch_accent` overrides) or `paddle` (opt-in): one rocker on the right instead of the corner, with the IEC symbols (a bar on top, a circle below) and no words on it; the face stays the plain panel. On = the top half pressed in, off = the bottom half pressed in: the same rocker flipped, the pressed half one quiet step off the panel (1.1.0: the light pressed-paper beige by day, the key tone by night, the same on and off, split from the raised half by a hairline and a thin edge). The lamp's colour shows only as a thin band on the pressed top half while on. A change rocks it once (none without motion). Offline = the same rocker with a dashed rim and dim symbols. The state words are in its label and title and on the card. Group member bands are left out (the sub line says "2 of 3 on") |
| `switch_accent` | With `switch: toggle`: the small switch's accent (an accent name, room alias or CSS colour) |
| `glyph` | Jam Calm: the lamp drawn on the name row (`floor`, `table`, `strip`, `pendant`, `bulb`, `string`, `lantern`; default from the name) |
| `automations` | Jam Calm: `[automation ids]` or `{entity, name?, accent?}` listed in the light pop-up, each with a small switch (violet: the automations kind) |

A light Home Assistant cannot reach reads "Offline" on a hollow card with a dashed edge (each look draws its own broken form).

Changed in round 3: tap opens the pop-up (was: toggle), the ⋯ corner is now the power corner, the card is 96 px tall.
Changed in 0.3.0: the ON key, brightness strip row, colour-temperature chips and fixed swatches moved off the card;
`presets` are now pop-up chips.

### jam-popup
Full-screen veil with a sheet of cards, opened by a URL hash.
```yaml
type: custom:jam-popup
hash: "#lights-popup"
title: Lights
cards:
  - {type: custom:jam-light, entity: light.living_room}
```
Open it with a `navigate` action to `#lights-popup`; close with the CLOSE key, a veil click, Esc or browser back.

| Option | Description |
|---|---|
| `hash` | URL hash that opens the popup (required) |
| `title`, `kicker` | Sheet title and label |
| `accent` | A mark beside the kicker (1.1.0: the kicker itself is dim text, so it reads in both palettes) and the cards' default accent inside |
| `spiral` | Spiral flash on open (default true) |
| `cards` | List of card configs |

### jam-graph
History chart from the recorder: line, step or bars, 1–5 series.
```yaml
type: custom:jam-graph
title: Temperature
entities: [sensor.living_room_temperature]
```
| Option | Description |
|---|---|
| `title` | Title |
| `entities` | 1–5 entity ids or `{entity, name, color}` (`color`, 1.1.0: a CSS colour for that series; default the theme's series colours in order) |
| `hours_to_show` | Default 24 |
| `style` | `line` / `step` / `bars` |
| `show_current` | Show current values (default true) |
| `min`, `max` | Y-axis range |
| `refresh_minutes` | Default 5 |
| `height` | 1.1.0: the plot's height in px (default 140, 170 with several series) |

### jam-weather
Big temperature, condition word and cut-paper glyph, with a forecast strip and an optional clock.
```yaml
type: custom:jam-weather
entity: weather.home
clock: true
```
| Option | Description |
|---|---|
| `entity` | weather (required) |
| `forecast_type` | `daily` / `hourly` / `twice_daily` |
| `days` | Forecast entries (default 5) |
| `clock` | Show a clock (default false) |
| `clock_size` | `normal` / `big` / `huge` (kiosk: the time scales with the card width) |
| `temperature_entity` | Sensor to use for the current temperature |
| `show_current` | Show the temperature/condition block (default true) |
| `show_forecast` | Show the forecast (default true) |
| `tap_action`, `hold_action`, `double_tap_action` | Actions |

### jam-remote
TV remote: d-pad of cut arrows and keys sending `remote.send_command` (Android TV defaults; also `rewind` MEDIA_REWIND,
`forward` MEDIA_FAST_FORWARD).
```yaml
type: custom:jam-remote
entity: remote.living_room_tv
media_player: media_player.living_room_tv
```
| Option | Description |
|---|---|
| `entity` | remote (optional when `actions` is set: keys without an action are then disabled) |
| `media_player` | media_player for the title/state |
| `name` | Name override |
| `hide_title` | Hide the name and title (set automatically inside jam-tv / jam-media sheets) |
| `rows` | Key layout, e.g. `[[power, home], [dpad], [back, menu]]` |
| `layout` | `full`: power back home settings / tv vol− vol+ / d-pad / prev play next / keyboard captions audio input (`rows` wins) |
| `commands` | Map of key → `send_command` value |
| `actions` | Map of key → action object (overrides the command) |
| `labels` | Map of key → label text |
| `sections` | Colour-coded groups instead of rows: `[{title, accent, rows, entity, actions, commands, labels, active_entity, active_match, power_accent}]`; each group has a 6px left rule in its accent and a header with its title and its `power` key (red; `power_accent: true` = the group accent); keys show a glyph above the label, Play is filled with the accent; `entity: null` = keys run actions only; with `active_entity` the plain row keys are an outlined choice and the one whose `active_match[key]` (else label) equals its state is filled |
| row `rocker` | `[rocker]` in any `rows`: Vol − / Mute / Vol + as one flat block in the accent (keys the remote cannot run are left out) |

The `keyboard` key opens a small sheet: a text field with Send (`send_command` `text:<text>`), Backspace (`DEL`) and
Enter (`ENTER`), as universal-remote-card's Android TV keyboard. Volume and d-pad keys repeat while held.

### jam-tv
Smart TV (Android TV media_player + remote). Hi-Fi draws a TV card (name row with the state words, title, transport, volume
steps, Remote and Source keys) and its TV / Source pop-up and the round 5 remote (with a Stereo group from `stereo`). The
earlier round 3 layout, which the card still draws only if Hi-Fi's drawing fails: an artwork poster (power in its corner) with the title on a solid
ink band, Prev / big Play-Pause / Next, a violet volume rocker (− | Mute | +) and outlined **Remote** and **Source** tabs.
Remote opens a sheet with a jam-remote in a TV group (teal: d-pad, Back / Home / Menu / Settings, Rewind / Play / Forward,
red power) and a Stereo group (violet: rocker, inputs, violet power), with a keyboard key in the header. Source opens its
own sheet: **Inputs** (2-up) and **Apps** (3-up) big colour tiles with a glyph, the one on screen outlined with an
"On now" stamp, then a **Home screen** tile. When the TV is off the card shows "TV off", a big **Turn on** key and quick
source tiles, and the Remote and Source tabs stay (2026-11-06: the remote's power key turns the TV on).
```yaml
type: custom:jam-tv
media_player: media_player.living_room_tv
remote: remote.living_room_tv
sources:
  - {name: YouTube, color: red, exact: true, match: {app: [YouTube, com.google.android.youtube.tv]},
     tap_action: {action: perform-action, perform_action: select.select_option,
     target: {entity_id: select.tv_launch_app}, data: {option: YouTube}}}
  - {name: Console, color: green, match: {input: HDMI 1},
     tap_action: {action: perform-action, perform_action: select.select_option,
     target: {entity_id: select.tv_input}, data: {option: HDMI 1}}}
current_app_entity: sensor.tv_current_app
input_entity: select.tv_input
input_app: Live TV
volume_up_action: {action: perform-action, perform_action: script.stereo_volume_up}
volume_down_action: {action: perform-action, perform_action: script.stereo_volume_down}
stereo:
  power_action: {action: perform-action, perform_action: script.stereo_power}
  inputs:
    - {name: TV, tap_action: {action: perform-action, perform_action: script.stereo_input_tv}}
```
| Option | Description |
|---|---|
| `media_player` | media_player (required) |
| `remote` | remote entity (Remote sheet, power) |
| `name` | Kicker when idle / off (default the player's name) |
| `sources` | `{name, color, icon, tap_action, hold_action, match: {app, input}, exact}` tiles (`launchers` still works as an alias); a source whose `match` has `input` is listed under Inputs, the rest under Apps; `icon` = a glyph name (`input`, `app`, `game`, `disc`, `download`, `grid`, `home`, `tv`, `music`, `film`) or an `mdi:` icon (default `input` / `app`); `match.app` / `match.input` = text or list (a plain text = app); `exact: true` (0.3.8, default false) = `match.app` only matches the whole app name, so YouTube does not light for YouTube Music / YouTube TV |
| `source_label` | Name of the Source tab and sheet (default "Source") |
| `current_app_entity` | Sensor whose state is the app in front (label or package id). The tile whose `match.app` equals it (any source, case-insensitive) is marked "On now"; else the first whose `match.app` is contained in it (sources with `exact: true` skip this step) |
| `input_entity` | Select/sensor naming the TV input; the tile whose `match.input` equals it is marked while the TV shows an input |
| `input_app` | current-app values that mean "the TV shows an input" (e.g. `Live TV`); without it the input counts whenever it matches |
| `input_signal_entity` | Optional: the input only counts while this sensor reports a signal (not "No signal" / off / unavailable) |
| `playback_entity` | 1.1.0: a media_player (or a list) that knows what the TV plays when its own player does not: Android TV Remote reports "on" and the app only. Default: found by itself, the TV's Google Cast player (registry platform `cast`, on the TV's device or named like it: "Phoster" for "Phoster - Android TV"); `false` = none. While the TV is on, the first of them that is playing / paused / buffering an app that matches the one on screen gives the card Playing / Paused, the title, artist and position (a session of another app is ignored as stale). Without playback the card says "On · YouTube" (the source on screen, else the app), never idle |
| | Highlight comes only from these live signals (0.3.5): select states and tap options are not used (`source_entities` is ignored); nothing matches → no tile marked |
| `power_action` | Power triangle and Turn on key action (default `remote.toggle`) |
| `volume_up_action`, `volume_down_action`, `mute_action` | The violet volume rocker on the card (keys without an action are left out; Vol keys repeat while held) |
| `stereo` | `{power_action, inputs: [{name, tap_action, match}], volume_up_action, volume_down_action, mute_action, input_entity, title, accent}`: Stereo group of the Remote sheet (violet; hidden without it; `input_entity` state fills the matching input) |
| `remote_card`, `remote_title` | jam-remote config merged over the default (TV + Stereo `sections`; set `rows`, `layout` or `sections` to replace them; `commands.home` / `actions.home` also drive the Home screen tile); Remote tab + sheet title (default "Remote") |
| `size` | `kiosk` (0.6.0): fullscreen-sheet layout for jam-kiosk — 64-80 px transport keys, rocker and tabs at their own height, the poster takes the rest (art keeps over half of it; kicker + time on one line over a 30-44 px title); off: Turn on + quick tiles; fills the sheet height, nothing under 18 px |
| `room`, `volume_entity`, `volume_label` | Jam Calm: the pop-up's room label; a `number` / `input_number` / media_player whose level the volume fader shows and sets (without one, and with step actions, the card keeps − / Mute / + keys: an IR stereo has no level); the volume label in the pop-ups (default "Stereo volume") |
| `accent` | Poster, progress strip, Play key (see Colours); the Remote sheet's TV group is always teal, Stereo violet |

### jam-speaker
Music Assistant speaker (Spotify Connect too), built like the TV card: album art up top (or, while idle, a cut-paper
abstract that changes each time the player goes idle), the title on a solid ink band with a source dot and "Room ·
source", small **Shuffle** and **Favourite** keys at the right of the band, a power corner, then Prev / big Play / Next and
a volume bar. Tap the art or the band to open the **library panel**: tabs Pinned / Recent / Playlists / Albums / Search
(each row: cover, name, type, Play, and a corner tab to pin / unpin), a player bar docked at the bottom, and a Speakers
key (with `speakers`) for grouping rooms (Join / Playing, per-room volume).
```yaml
type: custom:jam-speaker
entity: media_player.kitchen
name: Kitchen
speakers: [media_player.living_room, media_player.phoster]
pinned:
  - {uri: "library://playlist/12", name: Cooking}
  - spotify://playlist/37i9dQZF1DX4sWSpwq3LiO
```
| Option | Description |
|---|---|
| `entity` | media_player (required; a Music Assistant player) |
| `name` | Room name on the band and the panel (default the player's name) |
| `speakers` | media_player ids (or `{entity, name}`) for the Speakers view (panel / kiosk Speakers key); none = no key |
| `pinned` | Music Assistant uris (or `{uri, name, image, media_type}`) shown first under Pinned and on the kiosk shelf; each person's own pins (corner tab on any row) are added after them and saved to their Home Assistant user (`jam_pins`); a config pin they unpin is hidden for them only. A bare uri gets its name from the library |
| `show_shuffle` | Shuffle key on the band (default true; hidden when the player cannot shuffle) |
| `show_favorite` | Favourite key on the band (default true; hidden when the player has no Music Assistant "Favorite current song" button) |
| `favorite_entity` | That button (default: found on the player's device); `false` = no Favourite key. Favourite adds the playing track to the Music Assistant favourites (there is no un-favourite); it lights for a track MA reports as a favourite (MA queue only) or after a tap |
| `config_entry_id` | Music Assistant config entry for the library calls (default: found automatically) |
| `power_action` | Action for the power corner. Default: `media_player.toggle` when the player can turn on/off, else stop (playing / paused) or play (idle) — Music Assistant players usually have no power control |
| `poster_height` | Height in px of the art above the band (default 150, min 72; below 110 the title is one line) |
| `size` | `kiosk`: the K1 layout for jam-kiosk sheets — art flush left (58 %), the right panel in the album's own main colour (ink or paper text, whichever reads), Shuffle / Favourite by the room, huge title, artist · album, progress line with times, Prev / Play / Next, volume − / bar / + and a Speakers key; a shelf of covers along the bottom (pinned, then recent; tap = play; last tile Browse = the library panel, fullscreen). Fills the sheet height, nothing under 18 px, no animation (the progress line moves every 5 s while it is on screen in a sheet) |
| `accent` | Play key, volume fill, power glyph, panel tab underline (default violet) |
| `compact_idle` | `true` (opt-in): while the player is not playing or paused the card is one compact row (source dot + room, "Last played: …", a quiet Play key; tap = the library panel); the full card comes back while it plays or is paused. Not with `size: kiosk` |

### jam-fan
Fan or air purifier: power corner (top-right, tap = on/off), speed steps, preset chips, air-quality sensors in the
label. A tap elsewhere on the card (or on the name) opens more-info; P or Shift+Enter on the focused name = power.
```yaml
type: custom:jam-fan
entity: fan.air_purifier
sensor: sensor.air_purifier_air_quality
```
| Option | Description |
|---|---|
| `entity` | fan (required) |
| `name` | Name override |
| `speeds` | Percent steps (default from `percentage_step`) |
| `presets` | Preset modes to show (default the fan's; `false` or `[]` hides the chips) |
| `sensor`, `extra_sensor` | `id` or `{entity, name}` shown in the label |
| `switch_accent` | Jam Calm: the power switch's accent (default the air / climate teal) |
| `accent` | Power glyph when on, active speed and preset |
| `size` | `kiosk` (opt-in): 36 px name, 18 px label, 64 px speed / preset keys with 18 px text, 64 px power corner |

### jam-house
House strip for a landing view: inside / outside temperature, condition word, front door chip (tap = lock), who's home,
alert chips.
```yaml
type: custom:jam-house
inside_entity: sensor.home_temperature
outside_entity: weather.home
lock_entity: lock.front_door
people: [person.alex, person.sam]
```
| Option | Description |
|---|---|
| `inside_entity` | Temperature sensor (required) |
| `outside_entity` | weather or sensor (required) |
| `lock_entity` | Door lock chip |
| `people` | person ids; those at home show as chips with their first name (Jam Calm: everyone, a colour tag with the initial, "· out" when away; items may be `{entity, name?, color?}`) |
| `humidity_entity` | Jam Calm: the inside humidity printed small after the inside temperature |
| `inside_more` | 1.1.0, default on: the inside half (label + temperature) opens the indoor climate pop-up: temperature, humidity, the air word with PM2.5 (`sensor.<purifier>_pm2_5` beside the `inside_aq` sensor, found by itself), the rooms (each with its temperature, humidity and a 24 h sparkline on one scale per measure) and the house's 24 h temperature and humidity graphs. `false` = HA's more-info instead. Options: `{temperature, humidity, air_quality, pm25 (or false), rooms: [{name, temperature, humidity}], hours (24)}`; without `rooms` the rooms are the members of the temperature group (`attributes.entity_id`), each paired with the humidity group's member of the same device or name, named by their area |
| `outside_more` | 1.1.0, default on for a weather entity: the outside half opens the forecast pop-up: now (the condition, high / low), feels like, humidity, wind (direction, gusts), pressure, UV and clouds (the weather entity's attributes, else its `sensor.<weather>_uv_index` / `_wind_gust_speed`), then the next days (glyph, condition, a low-high bar on one scale with today's temperature marked, rain chance and amount, wind) and the source as a footnote. `false` = more-info. Options: `{entity, days (5), forecast_type}` (default daily, else twice_daily / hourly as the entity offers) |
| `full_names` | `true`: chips show the full name |
| `alerts` | `{entity, state, name}`: red chip while the entity is in `state` (or on/open/problem) |
| `title`, `kicker` | Title (default the HA location name) and label |
| `compact` | One smaller row (kiosks) |
| `inside_aq`, `outside_aq` | `{entity}` (or an id): "Air · Good" under the temperature, words only; a numeric state is a US AQI shown as its category (Good, Moderate, Unhealthy for sensitive, Unhealthy, Very unhealthy, Hazardous); `extra` is ignored; hidden while the entity is missing/unavailable |
| `attention` | `true` or `{lights: [ids]}` (opt-in): a red strip at the top listing what needs someone — door unlocked / open (tap = lock), jammed or offline; "N lights offline" (the `lights` list, else every light); poor air inside / outside. Invisible while all is well |

The door chip follows the state grammar: unlocked / open = red "Door unlocked · lock" (tap = lock), jammed = red, locked =
plain, offline = a dashed "Door offline".

### jam-tabs
Equal-width room tabs; the tab for the current path fills with its accent.
```yaml
type: custom:jam-tabs
tabs:
  - {name: Living, path: /home-dash/living, accent: living}
  - {name: Kitchen, path: /home-dash/kitchen, accent: kitchen}
```
| Option | Description |
|---|---|
| `tabs` | `{name, path, accent}` (required) |
| `sticky` | `true`: the card is `position: sticky` under the header. In HA it only sticks inside its own section, so put the tabs in their own full-width section at the top |

### jam-scenes
Row of scene / script keys; the active scene fills with the accent: the listed scene activated last (its state is the
activation time), or the `current_entity` option when that changed later. Names default to the scenes' friendly names.
```yaml
type: custom:jam-scenes
current_entity: input_select.light_scenes
scenes:
  - {entity: scene.movie_time, data: {transition: 2}}
```
| Option | Description |
|---|---|
| `scenes` | `{entity, name, data}` with scene.* / script.* entities (required) |
| `current_entity` | input_select naming the active scene |
| `wrap` | `true`: wrap onto more rows instead of scrolling sideways |
| `size` | `kiosk` (opt-in): 64 px keys with 24 px names, wrapped into rows (kiosk sheets) |
| `accent` | Active scene fill |

### jam-screensaver
Takes no space on the dashboard; after inactivity covers the screen with a calm night clock (Jost 300 on the navy, the date,
the weather words; the "poster" view of the options below) or a photo slideshow. Built for weak kiosk tablets (minute timer, no animation loops).
```yaml
type: custom:jam-screensaver
idle_seconds: 120
weather_entity: weather.home
active_hours: {from: "06:00", to: "23:00"}
```
| Option | Description |
|---|---|
| `idle_seconds` | Idle time before it shows (default 120) |
| `mode` | `poster` (default) / `images` |
| `mode_entity` | An `input_select` / `select` (state containing photo / image / slide → photos, clock / poster → clock) or an `input_boolean` (on → photos, off → clock) that picks the mode live; unavailable or anything else → `mode`. A change while it is showing takes effect at the next slide. Photos still need `images` (without it: clock) |
| `weather_entity`, `temperature_entity` | Weather word and temperature |
| `kicker` | Label on the poster |
| `images` | `{index (URL of a JSON list of images) or media (a Home Assistant media source folder), interval (20 s), shuffle, fade (crossfade in ms, default 900, 0 = cut)}` |
| `poster_every` | Images mode without a `mode_entity`: every Nth slide is the poster. Ignored when `mode_entity` is set (0.7.1): Photos then shows only photos, Clock only the clock |
| `now` | 0.7.1: what's playing, same list as jam-kiosk's `now` (`{type: media, entity, states, kicker, app_entity}`; weather entries are ignored). The first active source shows a "Now playing" block: cover, kicker, title, artist; nothing playing = no block |
| `active_hours` | `{from, to}`: only shows in this window |
| `disable_on` | `{entity, state}` or a list: no screensaver while matched (e.g. a player is playing) |
| `accent` | Poster colour |
| `kiosk` | Hide HA's sidebar and the dashboard header on this dashboard: `"url"` (default) only when the URL has `?kiosk`, `true` always, `false` never |
| `motion` | `false`: turn the jam cards' one-shot motion (entrance, wipes, stamps, sheet stagger) off on this page while the card is on screen (`JamCards.motion = false`); `calm` (1.1.0): the calm tier, pop-ups and sheets only fade in and out (≤ 160 ms) and their contents do not stagger (`JamCards.motion = "calm"`); default on |
| `fx` | `false`: keep a look's effects (`--jam-fx`) off on this card and its layer, for slow wall tablets; default: as the look's theme |

Photos from Home Assistant's media source (0.4.0): set `images.media` to a folder's `media-source://` id instead of
`images.index`. The folder is browsed when the screensaver starts and then at most once an hour (after an error: retried
after 10 minutes); only images are shown (other files such as `index.json` are skipped), sorted by name, or shuffled with
`shuffle: true`. Each photo is resolved to a short-lived signed URL right before it is shown; the URLs are never stored or
logged. Photos fill the screen letterboxed on ink. If the folder cannot be read the poster clock shows instead.
Each photo crossfades into the next (0.4.1; `images.fade`, default 900 ms, `0` = instant cut; also instant with the
system's reduce-motion setting), and the clock and photos crossfade into each other.
```yaml
type: custom:jam-screensaver
mode: images
images:
  media: "media-source://media_source/local/Photos/slides"
  interval: 20
  shuffle: true
poster_every: 4
```

Now playing (0.7.1): with `now`, the first active media source shows a block with its cover (or a flat accent square with
bars), a kicker ("Now playing · Living room" from the player's area, or the source's `kicker` plus the app, e.g. "On the TV ·
YouTube"), the title in the display face and the artist. On the clock it sits under the weather line (it moves with the
layout and never covers the clock, date or weather); on photos it is a solid ink label under the time chip, bottom-left.
It changes only when the player's state changes; a new cover is loaded before it is shown.
```yaml
type: custom:jam-screensaver
mode_entity: input_select.kitchen_kiosk_screensaver
now:
  - {type: media, entity: media_player.tv, states: [playing, paused], kicker: On the TV, app_entity: sensor.tv_app}
  - {type: media, entity: media_player.kitchen}
```

Door and alerts (opt-in): with `lock_entity` (and `lock_name`, default "Front door") and / or `alerts`
(`{entity, state or states, name}`; without `state` an alert is on while the entity is on / problem), one block sits at the
top of the clock's text block and above the time chip on photos. It is quiet while all is well (a small padlock and "Front
door · locked" in the muted label style; a dashed ring and "Front door · offline" when the lock is unreachable) and loud only
while something is true: an alert-red plate with "FRONT DOOR UNLOCKED · WATER LEAK" in the display face. The screensaver
closes on the first tap, so the block has no action.
```yaml
type: custom:jam-screensaver
lock_entity: lock.front_door
alerts:
  - {entity: binary_sensor.kitchen_leak, state: "on", name: Water leak}
```

Kiosk chrome (0.3.3): with `?kiosk` in the dashboard URL (e.g. `/jam-kitchen/0?kiosk`) the card hides Home Assistant's
sidebar and top header and removes the space they reserve, without a kiosk-mode plugin. It applies to the dashboard the
card is on only (it stays hidden while you switch views there, and comes back when you open another dashboard).
Way out: press and hold the top-left corner (48 × 48 px) for 2 seconds; the sidebar and header return until the page is reloaded.

### jam-kiosk
The kiosk home screen. Hi-Fi draws it as the Jam Design pass 7 kiosk: a walnut rule, the room and the door (name, state
word, status light) at the top, a big Jost 300 clock with the date and one facts line, and three keys along the bottom whose
full-screen sheets never scroll (per block `rows`, `title`, `glyph`, below). The options below come from the earlier
"Poster + dock" layout (0.5.0), which the card still draws only if Hi-Fi's drawing fails: it fills the whole view with a huge clock, the date under it in the
display font (0.6.1: its own line), a facts line (inside temperature, humidity, air quality; left out without values), a
"now" line (what is playing, else the weather outside) and a dock of 2-5 flat colour blocks along the bottom. Built to be
read from across the room: nothing under 18 px, one room colour (the bar at the top) plus the dock blocks, no chips.
A block opens a fullscreen sheet with its own cards, or runs an action. Weak-kiosk friendly: one timer per minute, no
animation loops (a block stamps once when pressed). With `lock_entity` (0.6.2) a round lock button sits in the top-right
corner under the bar: a ring with a closed padlock when locked, a red disc with an open padlock
otherwise; tap locks at once, or asks "Unlock the front door?" first when locked. Since the 2026-11-03 audit the locked
state is quiet (a ring in the text colour, no fill), so the unlocked red disc is the loudest thing on the screen. Put it alone in a full-width section (with jam-screensaver beside it).
![Kiosk home](preview/shots/kiosk-home-dark-1024.png)
```yaml
type: custom:jam-kiosk
accent: living
lock_entity: lock.front_door
inside_entity: sensor.home_temperature
humidity_entity: sensor.home_humidity
aq_entity: sensor.purifier_air_quality
now:
  - {type: media, entity: media_player.tv, states: [playing, paused], kicker: On the TV, app_entity: sensor.tv_current_app}
  - {type: media, entity: media_player.living_room_speaker}
  - {type: weather, entity: weather.home}
dock:
  - name: Lights
    accent: living
    state: {count_on: [light.lamp, light.ceiling, switch.tree]}
    columns: 2
    cards: [{type: custom:jam-light, entity: light.lamp}, {type: custom:jam-light, entity: light.ceiling}]
  - {name: Music, accent: violet, state: {entity: media_player.living_room_speaker}, cards: [{type: custom:jam-speaker, entity: media_player.living_room_speaker, size: kiosk}]}
  - {name: TV, accent: teal, columns: [3, 2], cards: [{type: custom:jam-tv, media_player: media_player.tv, size: kiosk}, {type: custom:jam-media, entity: media_player.pc, size: kiosk}]}
  - name: All off
    accent: none
    state: {text: Lights}
    tap_action: {action: perform-action, perform_action: light.turn_off, target: {entity_id: [light.lamp, light.ceiling]}, confirmation: {text: Turn off every light?}}
```
| Option | Description |
|---|---|
| `accent` | Room colour of the 10 px bar at the top (default ochre); also the sheet colour of `none` blocks |
| `inside_entity`, `humidity_entity`, `aq_entity` | Facts line under the clock: "Tuesday · October 28 · 67° inside · 58% humidity · air excellent" (each part only while its sensor has a value; AQ as a word, a US AQI number becomes its category; wraps between parts, never cut off) |
| `inside_more`, `outside_more` | 1.1.0 (Hi-Fi): the inside part of the facts line opens the indoor climate pop-up, the weather part the forecast, as jam-house's (same options; the weather is the `now` weather source); centred, two columns, no scrolling on the iPad or the Echo Show. `false` = more-info |
| `lock_entity`, `lock_name` | 0.6.2: round lock button top-right (≈104 px on a 1024×768 iPad, ≈88 px on an Echo Show 8) with a label line "FRONT DOOR · LOCKED" (just "LOCKED" when it does not fit; `lock_name` default "Front door"). Locked = a quiet ring in the text colour; Unlocked / Open / Jammed / Locking… / Unlocking… = red disc; unavailable = dashed dim outline and "Offline". Tap: unlocked / open / jammed → `lock.lock` at once; locked → confirmation "Unlock the front door?" then `lock.unlock`; other states do nothing |
| `now` | Sources for the right-hand block, the first active one wins. `{type: media, entity, states (default [playing]), kicker (default Playing / Paused), app_entity}`: title, else the app; small line = artist, else the app. `{type: weather, entity, temperature_entity, kicker (default Outside)}`: "51° cloudy" + the next change in the hourly forecast within 12 h ("Rain at 3 · high 64°"), else "High 64°", else humidity |
| `dock` | 2-5 blocks: `name`, `accent` (colour or room alias; `none` = plain block with a dim state; default the card accent), `state`, `cards` + `kicker` + `columns` (1-3 equal, or a list of widths such as `[3, 2]` = 60 % / 40 %) for a sheet (cards with `size: kiosk` get the full sheet height), or `tap_action` (confirmation supported); `tap: sheet / action` forces one |
| `fx` | `false`: keep a look's effects (`--jam-fx`) off on this card and its sheets; default: as the look's theme |
| `dock_state` | `fill` (opt-in): a block is filled only while one of its entities is on or playing, otherwise a 4 px ring in its colour; a lock block that is unlocked fills red; action blocks are always outlined; a `count_on` block shows its count as a 72 px numeral at its right edge. Default: the fixed accent fill |
| `attention` | Opt-in list `{entity, state or states, text, tap_action}`: while one is true, a 64 px red bar replaces the accent bar ("FRONT DOOR UNLOCKED · TAP TO LOCK"; default condition: unlocked / open / jammed / problem / offline). Tap: `tap_action`, else `lock.lock` for a lock, else more-info |
| `now_band` | `true` (opt-in): the first active media `now` source moves into the empty top band (64 px title), left of the lock; the right block then shows the weather. While the attention bar shows, the band steps aside |
| `sheet_heading` | `false` (opt-in, also per block): sheets leave out their top-level jam-heading cards (the sheet title already names the room) |
| `title` | Jam Calm: the room name printed top-left of the kiosk home (default the lock's area) |
| `rows` | Jam Calm, per block: cards per row of its sheet, e.g. `[1, 4, [3, 2]]` (a list = the cards' widths); rows of `size: kiosk` players take the height left; rows of lights and switches are their content's height (1.1.1: rockers and faders at most 200px, a switch as a wall plate of the same height) and the rows sit in the middle of the sheet; nothing scrolls. Also per block: `title` (sheet title, default the block name), `glyph` (`lights`, `tv`, `music`, `all off`, `pc`, `air`) and `confirm_title` (an action block's confirmation pop-up) |
| `state` | `{count_on: [ids], suffix: on}` → "3 on" / "All off"; `{entity, attribute, app_entity}` → the entity's state in words (media player: title while playing / paused, else the app from `app_entity`, else On / Idle, Off when off; lock: "Door locked" / "Door unlocked"; air-quality sensor: Good / Moderate / … or its own word); `{text}` |

The clock follows the Home Assistant profile's time format (12 h with a small AM/PM, or 24 h). The card sizes itself from
its top to the bottom of the screen and re-measures on resize and every minute.

### jam-panel
Compact system panel for a control room: name / value rows, red when a value is bad.
```yaml
type: custom:jam-panel
title: NAS
rows:
  - {entity: sensor.nas_cpu_usage, name: CPU, format: pct, bad: {above: 90}}
```
| Option | Description |
|---|---|
| `title` | Title (required) |
| `rows` | `{entity, name, attribute, max, format (pct / temp / bytes_rate / duration / relative), bad: {above, below, state}, tap_action}` |
| `accent` | 4px rule under the title |

### jam-alerts
Automations by last run, watched entities that must never be unavailable, and a count of unavailable entities.
```yaml
type: custom:jam-alerts
auto: true
limit: 6
watch: [lock.front_door]
```
| Option | Description |
|---|---|
| `automations`, `auto` | automation ids, or `auto: true` for all of them |
| `limit` | Rows for `auto` (default 6) |
| `watch` | Entity ids shown red when unavailable |
| `show_unavailable_count` | Default true |
| `title`, `accent` | Title (default "Automations & alerts") and accent |

## Design rules
Hi-Fi (calm instruments): flat panels with a 1px hairline and soft corners (16px cards, 12px keys, 22px sheets, 999px
pills), no gradients, no shadows, no glow; Jost 500 words in mixed case, Jost 300 for big numerals, IBM Plex Mono 500 for
small labels (uppercase, wide tracking); at most one orange per screen; red only for alerts; state = colour + shape + word
(Offline = a dashed outline and the word, never "N/A"). Motion is short and settles (transforms and opacity, 150-220 ms
on `cubic-bezier(.16,1,.3,1)`); `prefers-reduced-motion` or `JamCards.motion = false` makes it instant. Labels are at least
12 px, kiosk text at least 15 px, every control at least 44 px. The full rules are in [docs/DESIGN.md](docs/DESIGN.md).

## Theme tokens
The cards read `--jam-*` theme variables: colours per light/dark mode (surfaces, hues, series, the ink bands, the
calm-instrument parts such as `--jam-ground`, `--jam-groove`, `--jam-cap`, the small switch's kind accents). The theme-level
tokens (font stacks, type, shapes, motion, `--jam-look: hifi`) are fixed in the cards since 1.0.0: one look, nothing to
switch. Without the Hi-Fi theme (no theme, or an old Jam theme) each card carries `data-jam-builtin` and draws the Night
palette from its own values; with it, the cards follow its Day and Night palettes, and a theme or dark-mode switch
re-renders them at once (also in open pop-ups and the screensaver). Day or night is the theme's `--jam-mode` (1.0.1), never
the dark-mode flag: "Hi-Fi Day" / "Hi-Fi Night" keep their palette on any device. The list with every default is in
[docs/DESIGN.md](docs/DESIGN.md) "Token reference". Fonts load from `fonts/` next to `jam-cards.js` (`dist/fonts/`): when
jam-cards.js is not served from `/hacsfiles/jam-cards/` or the folder of its `<script>`, set
`window.JamCardsConfig = {assetBase: "/local/jam-cards/"}` before it loads.

## Develop
Source lives in `src/`; `dist/jam-cards.js` is generated by `node tools/bundle.mjs`. `pw-node preview/shoot.js` renders
`preview/index.html` (fake hass) in Night and Day at 390 and 1280 px, writes `preview/shots/` (plus the contact sheet
`preview/shots/cards.html`), checks fonts, fit, edges and contrast, runs the behaviour checks in `preview/checks/` and the
text-fit / kiosk harness `preview/fit.js` (exit 0 = pass). `preview/index.html?theme=none` shows the built-in palette;
`?theme=Hi-Fi%20Day&dark=1` applies a single-mode theme on a device in dark mode (`preview/checks/99-hifi-daynight.js`).
File map: [filemap.md](filemap.md).
The theme tokens have one source, `tokens/` (`tokens/looks/hifi.mjs`): `node tools/bundle.mjs` writes the cards' built-in
values and `preview/looks.css` from it, `node tools/themes.mjs` writes the Hi-Fi theme YAML (`themes/jamboard.yaml`) into a
[jam-theme](https://github.com/Starkkaman/jam-theme) clone next to this repo (`JAM_THEME_DIR=<dir>/themes` for another
checkout), and `node tools/bundle.mjs --check` fails while any generated file is stale. To prove a refactor changes no
pixel: `JAM_BASELINE=<dir> JAM_BASELINE_WRITE=1 pw-node preview/shoot.js` on the commit before it, then
`JAM_BASELINE=<dir> pw-node preview/shoot.js` after it (add `JAM_SHOTS=<dir>` for the fixed-clock screensaver set).
