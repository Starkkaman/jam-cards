# Jam Cards

Saul Bass inspired Lovelace cards for Home Assistant: flat colour, square corners, heavy uppercase display type,
hard cuts. Same look as the JamBoard / Crew Hub card. Pairs with the [JamBoard theme](https://github.com/Starkkaman/jam-theme)
(colours per light/dark mode); without it the cards use the dark "ink" palette.

![dark](preview/shots/dark-1280.png)

## Install
HACS → Custom repositories → `Starkkaman/jam-cards`, category **Dashboard** → Download. The resource is added for you.

## Cards
All options are YAML. Unknown entities render as unavailable instead of throwing.

| Card | Options |
|---|---|
| `custom:jam-heading` | `title` (required), `kicker`, `accent` (`ochre`/`red`/`teal`), `entities` (state chips), `tap_action` |
| `custom:jam-hero` | `kicker`, `title` or `title_entity`, `meta_entities`, `power_entity` + `off_title` + `off_text`, `chips: [{entity, name, show_state, hide_value}]`, `accent` |
| `custom:jam-tile` | `entity` (required), `name`, `label` (fixed text instead of the state), `control` (`auto`/`toggle`/`none`), `tones` (`{state: on/alert/calm/off}`), `tap_action`, `show_last_changed` |
| `custom:jam-choice` | `entity` (select / input_select), `name`, `options` (subset + order), `columns` |
| `custom:jam-slider` | `entity` (number / input_number / light / media_player), `name`, `min`, `max`, `step` |
| `custom:jam-media` | `entity` (media_player), `name`, `controls` (`prev`, `play_pause`, `next`, `stop`) |

Status colours: ochre = on/active, red = alert/unavailable, teal = calm/informational, line = off.

```yaml
type: custom:jam-hero
kicker: Living room TV
title_entity: sensor.hisense_tv_current_app
power_entity: switch.hisense_tv_power
off_title: TV off
meta_entities: [select.hisense_tv_input, sensor.hisense_tv_input_signal, sensor.hisense_tv_hdr_format]
chips:
  - {entity: sensor.hisense_tv_vrr_refresh_rate, name: VRR}
```

## Develop
No build step. `pw-node preview/shoot.js` renders `preview/index.html` (fake hass) in dark and light at 390 and 1280 px,
writes `preview/shots/`, and checks the service calls of each control (exit 0 = pass).
