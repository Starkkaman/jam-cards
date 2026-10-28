// Preview fixture: Music — jam-speaker (0.3.6). Own preview_spk_* entities (50-av / 70-tv keep the real ids for their
// checks): Kitchen playing over Spotify Connect with art + Phoster joined, Living room idle (last title), Phoster grouped
// into Kitchen, an MA-queue player without art, a paused one, a TV-source one without shuffle / speakers, and House
// (no GROUPING feature).
{
const {st} = jamPreview;
const K = "media_player.preview_spk_kitchen", L = "media_player.preview_spk_living", P = "media_player.preview_spk_phoster";
const F = 8322623; // Music Assistant player features (GROUPING 524288 + SHUFFLE_SET 32768 + VOLUME_SET 4 ...)
const art = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">' +
  '<rect width="300" height="300" fill="#1d3557"/><rect x="0" y="180" width="300" height="120" fill="#e63946"/>' +
  '<rect x="40" y="40" width="90" height="90" fill="#f1faee"/></svg>');
jamPreview.add({
  states: [
    st(K, "playing", {friendly_name: "Kitchen Speakers", source: "Spotify Connect (Kitchen)", source_list: ["Music Assistant Queue", "Spotify Connect (Kitchen)"],
      media_title: "Lobby", media_artist: "AERwave", entity_picture: art, volume_level: 0.48, shuffle: true,
      group_members: [K, P], supported_features: F}),
    st(L, "idle", {friendly_name: "Living Room Speakers", source: "Music Assistant Queue", media_title: "Saturn", media_artist: "The Olympians",
      volume_level: 0.4, shuffle: false, group_members: [], supported_features: F}),
    st(P, "playing", {friendly_name: "Phoster", source: "Spotify", media_title: "Lobby", media_artist: "AERwave", volume_level: 1,
      group_members: [K, P], supported_features: 8320575}),
    st("media_player.preview_spk_ma", "playing", {friendly_name: "Office Speakers", source: "Music Assistant Queue", media_title: "Midnight City",
      media_artist: "M83", volume_level: 0.3, shuffle: false, group_members: [], supported_features: F}),
    st("media_player.preview_spk_paused", "paused", {friendly_name: "Porch Speakers", source: "Music Assistant Queue", media_title: "Teardrop",
      media_artist: "Massive Attack", volume_level: 0.25, group_members: [], supported_features: F}),
    st("media_player.preview_spk_tv", "playing", {friendly_name: "Den Speakers", source: "TV", media_title: "Evening news", volume_level: 0.6,
      supported_features: 4 | 16 | 32 | 16384}),
    st("media_player.preview_spk_house", "idle", {friendly_name: "House", source: "Music Assistant Queue", volume_level: 0.4, supported_features: 7798335}),
    st("media_player.preview_spk_gone", "unavailable", {friendly_name: "Garage Speakers", supported_features: F}),
  ],
  sections: [
    ["", [
      {type: "custom:jam-heading", kicker: "Whole house", title: "Speakers", accent: "music"},
      {type: "custom:jam-speaker", entity: K, name: "Kitchen", speakers: [L, P]},
      {type: "custom:jam-speaker", entity: L, name: "Living room", speakers: [K, P, "media_player.preview_spk_house", "media_player.preview_spk_gone"]},
      {type: "custom:jam-speaker", entity: P, name: "Phoster", speakers: [K, L]},
    ]],
    ["", [
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_ma", name: "Office", speakers: [K]},
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_paused", name: "Porch", show_shuffle: false, poster_height: 120},
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_tv", name: "Den"},
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_house", name: "House"},
    ]],
  ],
});
}
