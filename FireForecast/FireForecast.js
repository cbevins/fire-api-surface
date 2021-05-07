/**
 * FireForecast.js
 *
 * Useage: node FireForecast.js
 *
 * Produces an hourly weather and fire forecast table
 * using world-wide weather forecast data from two alternate sources:
 * - tomorrow.oi
 * - weatherapi.com
 */
import moment from 'moment'
import { mapquestElevSlopeAspect as mapQuest } from '../Globe/elevQuery-mapquest.js'
import { FireBehavior } from './fireBehavior.js'
import { getTimelines as getTomorrow } from './wxQuery-tomorrow.js'
// import { getForecast as getWeatherapi } from './wxQuery-weatherapi.js'

// Adds fire behavior to the weather records
function addFireBehavior (parms, wxArray) {
  wxArray.forEach(wx => {
    const input = {
      fuel: parms.fuel,
      curedHerb: 0.01 * parms.cured,
      month: +(wx.date).substr(5, 2),
      hour: +(wx.time).substr(0, 2),
      elevDiff: parms.elevdiff,
      aspect: parms.aspect,
      slope: 0.01 * parms.slope,
      dryBulb: wx.dryBulb,
      humidity: 0.01 * wx.humidity,
      shading: 0.01 * wx.cloudCover,
      liveMoisture: 0.01 * parms.live,
      windAt10m: 88 * wx.windSpeed,
      windGust: 88 * wx.windGust,
      windAdj: parms.waf,
      windFrom: wx.windFrom,
      elapsed: 60
    }
    const output = parms.fireBehavior.run(input)
    wx.tl1h = 100 * output.moisture.fosberg.tl1h // ratio
    wx.tl10h = 100 * output.moisture.tl10h // ratio
    wx.tl100h = 100 * output.moisture.tl100h // ratio
    wx.spreadRate = output.heading.spreadRate // ft/min
    wx.flameLength = output.heading.flameLength // ft
    wx.scorchHeight = output.heading.scorchHeight // ft
    wx.headingFromNorth = output.fire.headingFromNorth // degrees
    wx.gust = {
      spreadRate: output.heading.gust.spreadRate, // ft/min
      flameLength: output.heading.gust.flameLength, // ft
      scorchHeight: output.heading.gust.scorchHeight, // ft
      headingFromNorth: output.fire.gust.headingFromNorth // degrees
    }
  })
  return wxArray
}

function fix (v, w, d, c = ' ') {
  return (typeof v === 'string') ? v.padStart(w, c) : v.toFixed(d).padStart(w, c)
}

// Returns the forecast table string
function getForecastTable (parms, wxArray) {
  const h0 = '|-------|---------|-----------|-----|-------------|---------------------------|---------------------------|\n'
  const h1 = '|  Time |  Db  Rh | Wind mph  | Cld |  Dead Fuel  | Spread  Flame Scorch Head | Spread  Flame Scorch Head |\n'
  const h2 = '|       |  oF   % | Sp Gs Dir | Cvr | 1h 10h 100h | ft/min     ft     ft  No  |      During Wind Gusts    |\n'

  let str = `\nFire Forecast for '${parms.name}' at lat ${parms.lat}, lon ${parms.lon}:\n`
  str += 'Elev Slope Asp Fuel Cured Live Wind\n'
  str += ' ft    %   Asp Fuel  Herb Mois  Adj\n'
  str += `${fix(parms.elev, 4, 0)}${fix(parms.slope, 5, 0)}${fix(parms.aspect, 5, 0)}`
  str += `${fix(parms.fuel, 5)}${fix(parms.cured, 5, 2)}${fix(parms.live, 5, 0)}${fix(parms.waf, 6, 2)}\n\n`
  let lastDate = ''
  wxArray.forEach(w => {
    if (w.date !== lastDate) {
      if (lastDate !== '') str += h0
      str += `\n  ${w.date}\n` + h0 + h1 + h2 + h0
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

async function fireForecast (parms) {
  // First get elevation, slope, and aspect and add it to the parms
  const sampleRes = 1 / (60 * 60 * 3) // 1/3 arc-second in decimal degrees
  const cellWidth = 2 // Double sample distance to ensure adjacent cells have different sample
  const esa = await mapQuest(parms.lat, parms.lon, sampleRes, cellWidth)
  parms.elev = esa.elev
  parms.slope = 100 * esa.slopeRatio
  parms.aspect = esa.aspect

  // Next get weather data from tomorrow.io or weatherapi.com
  const wxArray = await getTomorrow(parms.lat, parms.lon, parms.start, parms.end, parms.timezone)
  // const wxArray = await getWeatherapi(parms.lat, parms.lon, 1, 'fire')
  addFireBehavior(parms, wxArray)
  const table = getForecastTable(parms, wxArray)
  console.log(table)
}

// ----------------------------------------------------------------
// Main CLI
// ----------------------------------------------------------------
const M = { name: 'The "M"', lat: 46.859340, lon: -113.975528 }
// const Home = { name: 'Home', lat: 46.85714, lon: -114.00730 }
const loc = M
// Define the command line parameters and their defaults
// configure the time frame up to 6 hours back and 15 days out
const now = moment.utc()
const parms = {
  name: loc.name,
  // weather and elevation service input parameters
  lat: loc.lat,
  lon: loc.lon,
  start: moment.utc(now).startOf('hour').toISOString(), // "2019-03-20T14:09:50Z"
  end: moment.utc(now).add(48, 'hours').toISOString(),
  // Timezone of time values, according to IANA Timezone Names (defaults to 'UTC')
  // https://docs.tomorrow.io/reference/api-formats#timezone
  timezone: 'America/Denver',

  // fire behavior input parameters
  fuel: 'gs1',
  waf: 0.4,
  cured: 0, // herb cured fraction (%)
  live: 200, // live herb and stem fuel moisture (%)
  elevdiff: 0
}

// Process any actual command line parameters
for (let a = 2; a < process.argv.length; a++) {
  const part = process.argv[a].split('=')
  if (part.length === 2) {
    if (!Object.prototype.hasOwnProperty.call(parms, part[0])) {
      throw new Error(`Invalid argument ${part[0]}`)
    }
    parms.set(part[0], part[1])
  }
}
// \TODO - validate command line args
parms.fireBehavior = new FireBehavior()
fireForecast(parms)
console.log('Getting elevation and weather data ...')
