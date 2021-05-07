/**
 * fireForecast.js is an example of using the FireBehaviorForecaster in Node.js
 *
 * Usage: node fireForecast.js lat=46.85934 lon=-113.975528 fuel=gs1 cured=50 liv=50
 *
 * Produces an hourly weather and fire forecast table
 * using world-wide weather forecast data from two alternate sources:
 * - tomorrow.oi
 * - weatherapi.com
 */
import { FireBehaviorForecaster } from './FireBehaviorForecaster.js'

function fix (v, w, d, c = ' ') {
  return (typeof v === 'string') ? v.padStart(w, c) : v.toFixed(d).padStart(w, c)
}

// Returns the forecast table string
function getForecastTable (forecast) {
  const parms = forecast.parms
  const h0 = '|-------|---------|-----------|-----|-------------|---------------------------|---------------------------|\n'
  const h1 = '|  Time |  Db  Rh | Wind mph  | Cld |  Dead Fuel  | Spread  Flame Scorch Head | Spread  Flame Scorch Head |\n'
  const h2 = '|       |  oF   % | Sp Gs Dir | Cvr | 1h 10h 100h | ft/min     ft     ft  No  |      During Wind Gusts    |\n'

  let str = `\nFire Forecast for '${parms.name}':\n`
  str += '| Latitude | Longitude | Elev | Slope | Asp | Fuel | Cured | Live | Wind |\n'
  str += '|          |           |  ft  |   %   |     | Modl |  Herb | Mois | Adj  |\n'
  str += `|${fix(parms.lat, 9, 5)} |${fix(parms.lon, 9, 5)} |`
  str += `${fix(parms.elev, 5, 0)} | ${fix(parms.slope, 4, 0)}  |${fix(parms.aspect, 4, 0)} | `
  str += `${fix(parms.fuel, 4)} | ${fix(parms.cured, 4, 0)}  | ${fix(parms.live, 4, 0)} |${fix(parms.waf, 5, 2)} |\n\n`
  let lastDate = ''
  forecast.wx.forEach(w => {
    if (w.date !== lastDate) {
      if (lastDate !== '') str += h0
      str += `\n  Date: ${w.date}\n` + h0 + h1 + h2 + h0
    }
    str += `| ${w.time} | `
    str += `${fix(w.dryBulb, 3, 0)} `
    str += `${fix(w.humidity, 3, 0)} | `
    str += `${fix(w.windSpeed, 2, 0)} `
    str += `${fix(w.windGust, 2, 0)} `
    str += `${fix(w.windFrom, 3, 0)} | `
    str += `${fix(w.cloudCover, 3, 0)} | `
    // str += `${fix(w.solarGHI, 5, 0)} | `
    str += `${fix(w.tl1h, 2, 0)} `
    str += `${fix(w.tl10h, 3, 0)} `
    str += `${fix(w.tl100h, 3, 0)}  |`
    str += `${fix(w.spreadRate, 7, 2)}`
    str += `${fix(w.flameLength, 7, 2)}`
    str += `${fix(w.scorchHeight, 7, 2)}`
    str += `${fix(w.headingFromNorth, 4, 0)}  |`
    str += `${fix(w.gust.spreadRate, 7, 2)}`
    str += `${fix(w.gust.flameLength, 7, 2)}`
    str += `${fix(w.gust.scorchHeight, 7, 2)}`
    str += `${fix(w.gust.headingFromNorth, 4, 0)}  |\n`
    lastDate = w.date
  })
  str += h0
  return str
}

// ----------------------------------------------------------------
// Main CLI
// ----------------------------------------------------------------

const M = { name: 'The "M"', lat: 46.859340, lon: -113.975528 }
// const Home = { name: 'Home', lat: 46.85714, lon: -114.00730 }
const loc = M
const parms = {
  name: loc.name,
  lat: loc.lat,
  lon: loc.lon,
  timezone: 'America/Denver',
  fuel: 'gs1', // fuel model key
  waf: 0.4, // wind speed adjustment factor from 20-ft to midflame height
  cured: 0, // herb cured fraction (%)
  live: 200, // live herb and stem fuel moisture (%)
  elevdiff: 0
}

// Process any actual command line parameters
for (let a = 2; a < process.argv.length; a++) {
  const part = process.argv[a].split('=')
  if (part.length === 2) {
    const [key, value] = part
    if (!Object.prototype.hasOwnProperty.call(parms, key)) {
      throw new Error(`Invalid argument '${key}'`)
    }
    parms[key] = (['name', 'fuel', 'timezone'].includes(key)) ? value : parseFloat(value)
  }
}

// \TODO - validate command line args
async function showForecast (forecaster, parms) {
  const forecast = await forecaster.getForecast(parms)
  const table = getForecastTable(forecast)
  console.log(table)
  return forecast
}

const forecaster = new FireBehaviorForecaster()
showForecast(forecaster, parms)
console.log('Getting elevation and weather data ...')
