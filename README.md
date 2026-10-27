# Jam Cards

Saul Bass inspired Lovelace cards for Home Assistant, poster style: flat colour blocks on an ink ground, straight edges
with one cut corner, one accent colour per card (per room), heavy uppercase display type.

![Dark mode](preview/shots/dark-1280.png)
![Light mode](preview/shots/light-1280.png)

## Install
1. HACS → Custom repositories → `Starkkaman/jam-cards`, category **Dashboard** → Download. The resource is added for you.
2. For the palette, also install the [JamBoard theme](https://github.com/Starkkaman/jam-theme) (HACS category **Theme**)
   and select it. It sets the `--jam-*` colours per light/dark mode; without it the cards fall back to the dark "ink" palette.

All options are YAML. Unknown or unavailable entities render as unavailable instead of throwing.

## Colours
Every card takes `accent:` — `ochre` (default), `teal`, `blue`, `pink`, `violet`, `green`, `red`, or a room alias:
`living` (ochre), `kitchen` (teal), `master` (blue), `marissa` (pink), `music` (violet), `nerd` (green), `alert` (red).
Anything that is on or selected fills with the accent (ink text); idle controls stay neutral. Red is meant for alerts:
unavailable states, jammed locks and power keys are always red. Cards inside a `jam-popup` follow the pop-up's accent
unless they set their own. Status colours: accent = on/active, red = alert/unavailable, teal = calm/informational, line = off.

## Actions
Cards that list `tap_action`, `hold_action` (500 ms) or `double_tap_action` accept standard Lovelace action objects:
`more-info`, `toggle`, `navigate` (`navigation_path`), `url` (`url_path`), `perform-action` / `call-service`
(`perform_action`, `data`, `target`) and `none`. Add `confirmation: true` or `confirmation: {text: ...}` to ask first.

## Cards

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

### jam-button
Chunky key for launchers, scenes, scripts and openers: a small accent square carries the icon; an on light/switch/fan/input_boolean fills the whole key with the accent.
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
| `size` | `normal` / `big` |
| `tap_action`, `hold_action`, `double_tap_action` | Actions (default tap: scene/script → turn_on, button → press, toggleable → toggle, else more-info) |

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
Light with an ON key, brightness strip, colour-temperature chips and colour swatches.
```yaml
type: custom:jam-light
entity: light.living_room
```
| Option | Description |
|---|---|
| `entity` | light (required) |
| `name`, `icon` | Name and icon |
| `show_brightness` | Default true when the light dims |
| `show_color_temp` | Default: when colour temperature is supported |
| `show_color` | Default: when colour is supported |
| `presets` | List of `{name, color_temp_kelvin}` or `{name, rgb_color}` |
| `tap_action`, `hold_action` | Actions for the ON key (default tap: toggle) |

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
| `accent` | Header colour (default ochre); also the default accent of the cards inside |
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
| `entities` | 1–5 entity ids or `{entity, name}` |
| `hours_to_show` | Default 24 |
| `style` | `line` / `step` / `bars` |
| `show_current` | Show current values (default true) |
| `min`, `max` | Y-axis range |
| `refresh_minutes` | Default 5 |

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
| `temperature_entity` | Sensor to use for the current temperature |
| `show_current` | Show the temperature/condition block (default true) |
| `show_forecast` | Show the forecast (default true) |
| `tap_action`, `hold_action`, `double_tap_action` | Actions |

### jam-remote
TV remote: d-pad of cut arrows and keys sending `remote.send_command` (Android TV defaults).
```yaml
type: custom:jam-remote
entity: remote.living_room_tv
media_player: media_player.living_room_tv
```
| Option | Description |
|---|---|
| `entity` | remote (required) |
| `media_player` | media_player for the title/state |
| `name` | Name override |
| `rows` | Key layout, e.g. `[[power, home], [dpad], [back, menu]]` |
| `commands` | Map of key → `send_command` value |
| `actions` | Map of key → action object (overrides the command) |
| `labels` | Map of key → label text |

## Design rules
Flat colour, no gradients, no blur, no shadows, no rounded corners, uppercase display type, straight edges with one cut corner.
The full rules are in [docs/DESIGN.md](docs/DESIGN.md).

## Develop
Source lives in `src/`; `jam-cards.js` is generated by `node tools/bundle.mjs`. `pw-node preview/shoot.js` renders
`preview/index.html` (fake hass) in dark and light at 390 and 1280 px, writes `preview/shots/`, and checks the service
calls of each control (exit 0 = pass). File map: [filemap.md](filemap.md).
