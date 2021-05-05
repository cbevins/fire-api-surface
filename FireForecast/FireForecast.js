/**
 * FireForecast.js
 *
 * Useage: node FireForecast.js
 *
 * Produces an hourly weather and fire forecast using weather forecast data from
 * two alternate sources:
 * - tomorrow.oi
 * - weatherapi.com
 */
import moment from 'moment'
import { FuelMoisture as Fm } from '@cbevins/fire-behavior-simulator'
import { mapquestElevSlopeAspect as mapQuest } from '../Globe/elevQuery-mapquest.js'
import { fireBehavior } from './fireBehavior.js'
import { getTimelines as getTomorrow } from './wxQuery-tomorrow.js'
import { getForecast as getWeatherapi } from './wxQuery-weatherapi.js'

// \TODO
// - Use built-in Fosberg
// - use elevation service

// Adds fire behavior to the weather records
function addFireBehavior (wxArray, parms) {
  addFuelMoisture(wxArray, parms)
  wxArray.forEach(wx => {
    const input = {
      fuel: parms.fuel,
      curedHerb: 0.01 * parms.cured,
      tl1h: 0.01 * wx.fosbergDead1h,
      tl10h: 0.01 * wx.fosbergDead10h,
      tl100h: 0.01 * wx.fosbergDead100h,
      liveMoisture: 0.01 * parms.live,
      windAt10m: wx.windSpeed,
      windAdj: parms.waf,
      aspect: parms.aspect,
      slope: 0.01 * parms.slope,
      windFrom: wx.windFrom,
      dryBulb: wx.dryBulb,
      elapsed: 60
    }
    const output = fireBehavior(input)
    wx.spreadRate = output.heading.spreadRate
    wx.flameLength = output.heading.flameLength
    wx.scorchHeight = output.heading.scorchHeight
  })
  return wxArray
}

// Adds the 5 Fosberg fuel moisture values to each weather record
function addFuelMoisture (wxArray, parms) {
  wxArray.forEach(w => {
    const month = +(w.date).substr(5, 2)
    const hour = +(w.time).substr(0, 2)
    const shading = 0.01 * w.cloudCover
    const aspect = parms.aspect
    const slope = parms.slope // %
    const elevDiff = 0
    // These require humidity, slope, shading as ratios and returns moisture as ratio
    w.fosbergDead1hRef = 100 * Fm.fosbergReference(w.dryBulb, 0.01 * w.humidity)
    w.fosbergDead1hAdj = 100 * Fm.fosbergCorrection(month, shading, aspect, slope, hour, elevDiff)
    w.fosbergDead1h = 100 * Fm.fosbergDead1h(0.01 * w.fosbergDead1hRef, 0.01 * w.fosbergDead1hAdj)
    w.fosbergDead10h = 100 * Fm.fosbergDead10h(0.01 * w.fosbergDead1h)
    w.fosbergDead100h = 100 * Fm.fosbergDead100h(0.01 * w.fosbergDead1h)
  })
  return wxArray
}

function fix (v, w, d, c = ' ') {
  return (typeof v === 'string') ? v.padStart(w, c) : v.toFixed(d).padStart(w, c)
}

// Returns the forecast header
function forecastHeader (parms) {
  let str = `\nFire Forecast for '${parms.name}' at lat ${parms.lat}, lon ${parms.lon}:\n`
  str += `  Elev:       ${fix(parms.elev, 4, 0)} ft\n`
  str += `  Slope:      ${fix(parms.slope, 4, 0)} %\n`
  str += `  Aspect:     ${fix(parms.aspect, 4, 0)} degrees\n`
  str += `  Fuel Model: ${fix(parms.fuel, 4)}\n`
  str += `  Cured Herb: ${fix(parms.cured, 4, 2)} %\n`
  str += `  Live Moist: ${fix(parms.live, 4, 0)} %\n`
  str += `  Wind Adj:   ${fix(parms.waf, 4, 2)}\n`
  str += '| Date       Time  |  Db  Rh | Wind f/s  | Cld | Dead Fuel Moisture | Spread  Flame Scorch |\n'
  str += '| Year-Mo-Dy Hr:Mn |  oF   % | Sp Gs Dir | Cvr | 1h ( R+C) 10h 100h | ft/min     ft     ft |\n'
  str += '|------------------|---------|-----------|-----|--------------------|----------------------|'
  return str
}

// Formats and returns a single hourly weather & fire forecast row
function forecastRow (w) {
  let str = `| ${w.date} ${w.time} | `
  str += `${fix(w.dryBulb, 3, 0)} `
  str += `${fix(w.humidity, 3, 0)} | `
  str += `${fix(w.windSpeed, 2, 0)} `
  str += `${fix(w.windGust, 2, 0)} `
  str += `${fix(w.windFrom, 3, 0)} | `
  str += `${fix(w.cloudCover, 3, 0)} | `
  // str += `${fix(w.solarGHI, 5, 0)} | `
  str += `${fix(w.fosbergDead1h, 2, 0)} (`
  str += `${fix(w.fosbergDead1hRef, 2, 0)}+`
  str += `${fix(w.fosbergDead1hAdj, 1, 0)}) `
  str += `${fix(w.fosbergDead10h, 3, 0)} `
  str += `${fix(w.fosbergDead100h, 3, 0)}  | `
  str += `${fix(w.spreadRate, 6, 2)} `
  str += `${fix(w.flameLength, 6, 2)} `
  str += `${fix(w.scorchHeight, 6, 2)} |`
  return str
}

// Adds fuel moisture and fire behavior to forecast, then displays it
function showForecast (wxArray, parms) {
  addFireBehavior(wxArray, parms)
  // console.log(wxArray)
  let str = forecastHeader(parms) + '\n'
  wxArray.forEach(wx => {
    str += forecastRow(wx) + '\n'
  })
  console.log(str)
  return str
}

async function fireForecast (parms) {
  // First get elevation, slope aspect
  const sampleRes = 1 / (60 * 60 * 3) // 1/3 arc-second in decimal degrees
  const cellWidth = 2 // Double sample distance to ensure adjacent cells have different sample
  const esa = await mapQuest(parms.lat, parms.lon, sampleRes, cellWidth)
  parms.elev = esa.elev
  parms.slope = 100 * esa.slopeRatio
  parms.aspect = esa.aspect

  // getTomorrow(parms.lat, parms.lon, parms.start, parms.end, parms.timezone)
  //   .then(result => { showForecast(result, parms) })
  const wx = await getWeatherapi(parms.lat, parms.lon, 1, 'fire')
  showForecast(wx, parms)
}

// ----------------------------------------------------------------
// Main CLI
// ----------------------------------------------------------------
const M = { name: 'The "M"', lat: 46.859340, lon: -113.975528 }
const Home = { name: 'Home', lat: 46.85714, lon: -114.00730 }
const loc = M
// Define the command line parameters and their defaults
// configure the time frame up to 6 hours back and 15 days out
const now = moment.utc()
const parms = {
  name: loc.name,
  // weather service parameters
  lat: loc.lat,
  lon: loc.lon,
  start: moment.utc(now).startOf('hour').toISOString(), // "2019-03-20T14:09:50Z"
  end: moment.utc(now).add(24, 'hours').toISOString(),
  // Timezone of time values, according to IANA Timezone Names (defaults to 'UTC')
  // https://docs.tomorrow.io/reference/api-formats#timezone
  timezone: 'America/Denver',
  // elevation service parameters
  slope: 20, // slope steepness (%)
  aspect: 180, // aspect
  // fire behavior parameters
  fuel: 'gs1',
  waf: 0.4,
  cured: 0, // herb cured fraction (%)
  live: 200 // live herb and stem fuel moisture (%)
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
fireForecast(parms)
console.log('Getting elevation and weather data ...')
