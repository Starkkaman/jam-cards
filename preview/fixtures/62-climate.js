// Preview fixture (1.1.0): states only, for the house's inside / outside pop-ups (jam-house halves, the kiosk facts line;
// checked by preview/checks/99-hifi-climate.js on scratch cards). The house temperature and humidity are groups of the four
// room sensors (like Home Assistant's sensor groups: attributes.entity_id), each room sensor pairs by name with its humidity;
// the weather entity carries OpenWeatherMap's attributes (supported_features 3 = daily + hourly forecasts; the fake forecast
// is in 40-data.js) and its UV index / gust sensors stand beside it. The values of 60-house.js (73.9°, clear night 63°) stay.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const ROOMS = ["living_room", "bedroom", "office", "kitchen"];
const H = name => ({friendly_name: name, unit_of_measurement: "%", device_class: "humidity", state_class: "measurement"});
jamPreview.add({
  states: [
    st("sensor.home_temperature", "73.9", {friendly_name: "Home temperature", unit_of_measurement: "°F", device_class: "temperature", state_class: "measurement",
      entity_id: ROOMS.map(r => `sensor.${r}_sensor_temperature`)}),
    st("sensor.home_humidity", "58.6", {...H("Home humidity"), entity_id: ROOMS.map(r => `sensor.${r}_sensor_humidity`)}),
    st("sensor.living_room_sensor_humidity", "57", H("Living Room Sensor Humidity")),
    st("sensor.bedroom_sensor_humidity", "61", H("Bedroom Sensor Humidity")),
    st("sensor.office_sensor_humidity", "52", H("Office Sensor Humidity")),
    st("sensor.kitchen_sensor_humidity", "63", H("Kitchen Sensor Humidity")),
    st("weather.bungalo_weather", "clear-night", {friendly_name: "Bungalo weather", temperature: 63, apparent_temperature: 62, dew_point: 55,
      temperature_unit: "°F", humidity: 72, cloud_coverage: 5, pressure: 30.06, pressure_unit: "inHg", wind_bearing: 311, wind_speed: 1.99,
      wind_speed_unit: "mph", visibility: 6.21, visibility_unit: "mi", precipitation_unit: "in", attribution: "Data provided by OpenWeatherMap", supported_features: 3}),
    st("sensor.bungalo_weather_uv_index", "0", {friendly_name: "Bungalo Weather UV index", unit_of_measurement: "UV index", state_class: "measurement"}),
    st("sensor.bungalo_weather_wind_gust_speed", "6.2", {friendly_name: "Bungalo Weather Wind gust speed", unit_of_measurement: "mph", device_class: "wind_speed"}),
  ],
});
}
