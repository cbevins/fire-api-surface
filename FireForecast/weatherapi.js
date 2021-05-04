import fetch from 'node-fetch'
import { weatherapiAstronomy, weatherapiForecast } from './apiKeys.js'

function fix (v, w = 5, d = 1, c = ' ') { return v.toFixed(d).padStart(w, c) }

/**
 *
 * @param {number} lat Latitude north (+) or south (-)
 * @param {number} lon Longitude east (+) or west (-)
 * @param {string} dt Date in 'yyy-mm-dd' format
 */
export const getAstronomy = async (lat, lon, dt) => {
  const api = weatherapiAstronomy
  // 'q' can be a US Zipcode, UK Postcode, Canada Postalcode, IP address,
  // Latitude/Longitude (decimal degree) or city name.
  const q = `${lat},${lon}` // '46.85714,-114.0073'

  const query = `${api.url}?${api.key}&q=${q}&dt=${dt}`
  const request = await fetch(query, { method: 'GET' })
    .catch((error) => console.error('weatherapi astronomy error: ' + error))
  const json = await request.json()
  return json
}

export function reportAstronomy (dt, json) {
  console.log(json)
  const a = json.astronomy.astro
  let str = `Sun-Moon for ${dt}\n`
  str += `  Sun Rise:   ${a.sunrise}\n`
  str += `  Sun Set:    ${a.sunset}\n`
  str += `  Moon Rise:  ${a.moonrise}\n`
  str += `  Moon Set:   ${a.moonset}\n`
  str += `  Moon Phase: ${a.moon_phase}\n`
  str += `  Moon Illum: ${a.moon_illumination}\n`
  console.log(str)
}

/**
 *
 * @param {number} lat Latitude north (+) or south (-)
 * @param {number} lon Longitude east (+) or west (-)
 * @param {integer} days Number of weather forecast days (1-10)
 * @returns
 */
export const getForecast = async (lat, lon, days) => {
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
  return json
}

function reportForecast (json) {
  const l = json.location
  let str = `Firecast for ${l.name}, ${l.region} (${l.lat}, ${l.lon} at ${l.localtime} (${l.tz_id})\n`
  // console.log(json.current)
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
  console.log(str)
}

const lat = 46.85714
const lon = -114.0073
const days = 3
getForecast(lat, lon, days)
  .then(json => { reportForecast(json) })

// const dt = '1952-09-04'
// getAstronomy(lat, lon, dt)
//   .then(json => { reportAstronomy(dt, json) })
