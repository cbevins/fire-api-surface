import fetch from 'node-fetch'
const query = 'http://api.weatherapi.com/v1/forecast.json?key=43956b1f6760417db1d182743212704&days=3&q=46.85714,-114.0073&aqi=no'

fetch(query, { method: 'GET' })
  .then((result) => result.json())
  .then((json) => report(json))
  .catch((error) => console.error('error: ' + error))

function fix (v, w = 5, d = 1, c = ' ') { return v.toFixed(d).padStart(w, c) }

function report (json) {
  const l = json.location
  let str = `Firecast for ${l.name}, ${l.region} (${l.lat}, ${l.lon} at ${l.localtime}\n`
  console.log(json.current)
  // console.log(json.forecast)
  json.forecast.forecastday.forEach(d => {
    str += `\n  ${d.date} [Sun Rise at ${d.astro.sunrise} Sun Set at ${d.astro.sunset}]\n`
    d.hour.forEach(h => {
      str += `    ${h.time.substr(11)}`
      str += ` db=${fix(h.temp_f, 5, 1)} dp=${fix(h.dewpoint_f, 4, 1)} rh=${fix(h.humidity, 3, 0)}`
      str += ` ws=${fix(h.wind_mph, 4, 1)} wd=${fix(h.wind_degree, 3, 0)} wg=${fix(h.gust_mph, 4, 1)}`
      str += ` pp=${fix(h.chance_of_rain, 3, 0)} pa=${fix(h.precip_mm, 3, 0)}`
      str += ` ${h.is_day ? 'Day' : 'Nyt'} cl=${fix(h.cloud, 3, 0)} uv=${fix(h.uv, 1, 1)}\n`
    })
  })
  console.log(str)
}
