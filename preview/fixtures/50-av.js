// Preview fixture: AV — jam-remote (Android TV with the user's custom volume/input actions) + jam-media v2 (kitchen).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
// Local placeholder cover (no network): a flat SVG print, rendered as a duotone by the card.
const ART = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/>' +
  '<circle cx="62" cy="40" r="24" fill="#222"/><rect x="8" y="58" width="14" height="36" fill="#555"/>' +
  '<rect x="26" y="46" width="10" height="48" fill="#111"/><polygon points="40,94 70,70 96,94" fill="#888"/></svg>');
const MP = 8322623; // Music Assistant player features (volume set/mute, source, grouping)
jamPreview.add({
  states: [
    st("remote.living_room_phoster_android_tv", "on", {friendly_name: "Phoster - Android TV", supported_features: 4,
      activity_list: ["Corridor Digital", "Youtube", "Jellyfin"], current_activity: "com.spocky.projengmenu"}),
    st("media_player.kitchen", "playing", {friendly_name: "Kitchen Speakers", supported_features: MP, volume_level: 0.36, is_volume_muted: false,
      media_title: "Lobby", media_artist: "Laufey", media_album_name: "Bewitched", entity_picture: ART,
      source_list: ["Music Assistant Queue", "Spotify Connect (Kitchen)"], source: "Music Assistant Queue", group_members: ["media_player.kitchen"]}),
    st("media_player.house", "idle", {friendly_name: "House", supported_features: 7798335, volume_level: 0.4,
      source_list: ["Music Assistant Queue", "Spotify Connect (House)"]}),
    st("media_player.phoster", "paused", {friendly_name: "Phoster", supported_features: 8320575, volume_level: 1, media_title: "lost",
      media_artist: "Frank Ocean", group_members: []}),
    st("media_player.oneplus_speaker_2", "idle", {friendly_name: "Living Room Speakers", supported_features: MP, volume_level: 0.4,
      group_members: [], source_list: ["Music Assistant Queue", "Spotify Connect (Livingroom)"]}),
  ],
  sections: [
    ["", [
      {type: "custom:jam-heading", kicker: "Living room", title: "Remote", accent: "red"},
      {type: "custom:jam-remote", entity: "remote.living_room_phoster_android_tv", media_player: "media_player.living_room_phoster_android_tv", name: "Phoster",
        rows: [["power", "tv", "home", "menu"], ["dpad"], ["back", "play_pause", "next"], ["vol_down", "mute", "vol_up"]],
        labels: {tv: "TV in"},
        actions: {
          vol_up: {action: "perform-action", perform_action: "script.stereo_volume_up"},
          vol_down: {action: "perform-action", perform_action: "script.stereo_volume_down"},
          tv: {action: "perform-action", perform_action: "script.stereo_input_select_video"},
        }},
    ]],
    ["", [
      {type: "custom:jam-heading", kicker: "Music", title: "Kitchen", accent: "ochre"},
      {type: "custom:jam-media", entity: "media_player.kitchen", sources: true,
        players: ["media_player.kitchen", "media_player.house", "media_player.phoster"], group: ["media_player.oneplus_speaker_2"]},
    ]],
  ],
});
}
