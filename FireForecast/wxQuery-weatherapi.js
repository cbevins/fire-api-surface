/**
 * weatherapi.com
 * See FireForecast for usage.
 */
import fetch from 'node-fetch'
import { weatherapiForecast } from './apiKeys.js'

function fix (v, w = 5, d = 1, c = ' ') { return v.toFixed(d).padStart(w, c) }

/**
 *
 * @param {number} lat Latitude north (+) or south (-)
 * @param {number} lon Longitude east (+) or west (-)
 * @param {integer} days Number of weather forecast days (1-10)
 * @returns
 */
export const getForecast = async (lat, lon, days, format = 'fire') => {
  const api = weatherapiForecast
  // 'q' can be a US Zipcode, UK Postcode, Canada Postalcode, IP address,
  // Latitude/Longitude (decimal degree) or city name.
  const q = `${lat},${lon}` // '46.85714,-114.0073'
  const aqi = 'no' // get air quality?
  const alerts = 'no' // get weather alerts?

  const query = `${api.url}?${api.key}&days=${days}&q=${q}&aqi=${aqi}&alerts=${alerts}`
  const request = await fetch(query, { method: 'GET' })
    .catch((error) => console.error('weatherapi forecast error: ' + error))
  const json = await request.json()
  const records = (format === 'fire') ? asFireWeather(json) : asTable(json)
  return records
}

function asTable (json) {
  const l = json.location
  let str = `Firecast for ${l.name}, ${l.region} (${l.lat}, ${l.lon} at ${l.localtime} (${l.tz_id})\n`
  json.forecast.forecastday.forEach(d => {
    str += `\n  ${d.date} [Sun Rise at ${d.astro.sunrise} Sun Set at ${d.astro.sunset}]\n`
    // NOTE: chance_of_rain and chance_of_snow are numbers as strings
    d.hour.forEach(h => {
      str += `    ${h.time.substr(11)}`
      str += ` db=${fix(h.temp_f, 5, 1)} dp=${fix(h.dewpoint_f, 4, 1)} rh=${fix(h.humidity, 3, 0)}`
      str += ` ws=${fix(h.wind_mph, 4, 1)} wd=${fix(h.wind_degree, 3, 0)} wg=${fix(h.gust_mph, 4, 1)}`
      str += ` pp=${fix(+h.chance_of_rain, 3, 0)} pa=${fix(h.precip_mm, 3, 0)}`
      str += ` ${h.is_day ? 'Day' : 'Nyt'} cl=${fix(h.cloud, 3, 0)} uv=${fix(h.uv, 1, 1)}\n`
    })
  })
  return str
}

// Repackages fire weather fields into a common format
function asFireWeather (json) {
  const records = []
  json.forecast.forecastday.forEach(d => {
    // Note that this service has d.astro.sunrise, .sunset, .moonrise, .moonset, .moon_phase, and .moon_illumination
    d.hour.forEach(h => {
      records.push({
        date: d.date,
        time: h.time.substr(11, 5),
        dryBulb: h.temp_f, // oF
        humidity: h.humidity, // relative humidity (%)
        dewPoint: h.dewpoint_f, // dewpoint temperature (oF)
        windSpeed: h.wind_mph, // wind speed at ??? (mi/h)
        windGust: h.gust_mph,
        windFrom: h.wind_degree, // direction from which the wind originates, degrees clockwise from north
        precipRate: h.precip_in, // in/hr
        precipProb: parseFloat(h.chance_of_rain), // % NOTE: chance_of_rain is a numeric string
        cloudCover: h.cloud, // %
        visibility: h.vis_miles, // mi
        wthrCode: h.condition.code, // code
        feelsLike: h.feelslike_f, // apparent temperature at 2-m (oF)
        atmSurface: h.pressure_in, // weight of the air above the surface (at the surface level) (in/Hg)
        // Items below here are unique to this service
        icon: h.condition.icon,
        text: h.condition.text,
        heatIndex: h.heatindex_f,
        windChill: h.windchill_f,
        uv: h.uv,
        snowProb: parseFloat(h.chance_of_snow) // % NOTE: chance_of_snow is a numeric string
      })
    })
  })
  return records
}
