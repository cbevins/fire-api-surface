
// ------------------------------------------------------------------
// Main

import moment from 'moment'
import * as Fm from './FuelMoisture.js'
import { SimpleSurfaceFire, SimpleSurfaceFireInput } from '../src/index.js'
import { getWeather } from './tomorrow.js'

// Set up the fire api
const surface = new SimpleSurfaceFire()
const input = { ...SimpleSurfaceFireInput }
let output = surface.run(input)

function addFireBehavior (wxArray, input) {
  wxArray.forEach(wx => {
    input.weather = wx
    input.moisture.dead.tl1h = 100 * wx.fosbergDead1h
    input.moisture.dead.tl10h = 100 * wx.fosbergDead10h
    input.moisture.dead.tl100h = 100 * wx.fosbergDead100h
    input.temperature.air = wx.temperature
    input.wind.speed.at20ft = 60 * wx.windSpeed / 88 // from ft/s to ft/min
    input.wind.speed.atMidflame = input.wind.speed.adj * input.wind.speed.at20ft
    output = surface.run(input)
    wx.spreadRate = output.ellipse.heading.spreadRate
    wx.flameLength = output.ellipse.heading.flameLength
    wx.scorchHeight = output.ellipse.heading.scorchHeight
  })
  return wxArray
}

function addFuelMoisture (wxArray) {
  wxArray.forEach(w => {
    const month = +(w.date).substr(5, 2)
    const hour = +(w.time).substr(0, 2)
    const shading = 0.01 * w.cloudCover
    const aspect = input.slope.direction.aspect
    const slope = input.slope.steepness.ratio
    const elevDiff = 0
    w.fosbergDead1hRef = 100 * Fm.fosbergReference(w.temperature, 0.01 * w.humidity)
    w.fosbergDead1hAdj = 100 * Fm.fosbergCorrection(month, shading, aspect, slope, hour, elevDiff)
    w.fosbergDead1h = 100 * Fm.fosbergDead1h(0.01 * w.fosbergDead1hRef, 0.01 * w.fosbergDead1hAdj)
    w.fosbergDead10h = 100 * Fm.fosbergDead10h(0.01 * w.fosbergDead1h)
    w.fosbergDead100h = 100 * Fm.fosbergDead100h(0.01 * w.fosbergDead1h)
  })
  return wxArray
}

function fix (v, w, d, c = ' ') { return v.toFixed(d).padStart(w, c) }

function headerString (input) {
  let str = `\nForecast for Fuel Model='${input.fuel.model}', `
  str += `Herb=${fix(100 * input.moisture.live.herb, 1, 0)}% `
  str += `Stem=${fix(100 * input.moisture.live.stem, 1, 0)}% `
  str += `WAF=${input.wind.speed.adj}\n`
  str += 'Date       Time  |  Db  Rh | Wind f/s  |  CC Solar | Dead Fuel Moisture |    RoS  Flame Scorch |\n'
  str += 'Year-Mo-Dy Hr:Mn |  oF   % | Sp Gs Dir |   % Solar | 1h ( R+C) 10h 100h | ft/min     ft     ft |'
  return str
}

function weatherString (w) {
  let str = `${w.date} ${w.time} | `
  str += `${fix(w.temperature, 3, 0)} `
  str += `${fix(w.humidity, 3, 0)} | `
  str += `${fix(w.windSpeed, 2, 0)} `
  str += `${fix(w.windGust, 2, 0)} `
  str += `${fix(w.windDirection, 3, 0)} | `
  str += `${fix(w.cloudCover, 3, 0)} `
  str += `${fix(w.solarGHI, 5, 0)} | `
  str += `${fix(w.fosbergDead1h, 2, 0)} (`
  str += `${fix(w.fosbergDead1hRef, 2, 0)}+`
  str += `${fix(w.fosbergDead1hAdj, 1, 0)}) `
  str += `${fix(w.fosbergDead10h, 3, 0)} `
  str += `${fix(w.fosbergDead100h, 3, 0)}  | `
  str += `${fix(w.spreadRate, 6, 0)} `
  str += `${fix(w.flameLength, 6, 0)} `
  str += `${fix(w.scorchHeight, 6, 0)} |`
  return str
}

// getWeather() callback
function process (wxArray) {
  addFuelMoisture(wxArray)
  addFireBehavior(wxArray, input)
  let str = headerString(input) + '\n'
  wxArray.forEach(wx => {
    str += weatherString(wx) + '\n'
  })
  console.log(str)
}

function fireForecast (lat, lon, startTime, endTime,
  model = 'gs1', waf = 0.4, herb = 1, stem = 2, slope = 0.2, aspect = 180) {
  input.location = { lat: lat, lon: lon }
  input.fuel.model = model
  input.moisture.live.herb = herb
  input.moisture.live.stem = stem
  input.slope.direction = { aspect: aspect }
  input.slope.steepness.ratio = slope
  input.wind.direction.headingFromUpslope = 0
  input.wind.speed.adj = waf
  input.time.sinceIgnition = 60
  getWeather(lat, lon, startTime, endTime, process)
}

// ----------------------------------------------------------------

// configure the time frame up to 6 hours back and 15 days out
const now = moment.utc()
// console.log(now)
const startTime = moment.utc(now).startOf('hour').toISOString()
const endTime = moment.utc(now).add(24, 'hours').toISOString()
fireForecast(46.85722, -114.00723, startTime, endTime, 'gs4')
