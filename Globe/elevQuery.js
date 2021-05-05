// Gets elevation, slope, and aspect using MapQuest Elevation API
import { mapquestElevSlopeAspect as mapQuest } from './elevQuery-mapquest.js'
import { usgsElevSlopeAspect as usgs } from './elevQuery-usgs.js'
import { Dms } from './dms.js'

function fmt (v) { return v.toFixed(2).padStart(7, ' ') }

// Dumps elevation data
export function show (service, name, data) {
  const z = data.cells.map(cell => cell.elev)
  const r = (100 * data.slopeRatio).toFixed(0)
  let str = `${service}: ----------------------------------\n`
  str += `${name}\n`
  str += `  φ lat:     ${data.lat}\u00B0\n`
  str += `  λ lon:     ${data.lon}\u00B0\n`
  str += `  elev:      ${data.elev} ft\n`
  str += `  slope:     ${data.slopeDeg.toFixed(2)}\u00B0 (${r}%)\n`
  str += `  aspect:    ${data.aspect.toFixed(2)}\u00B0 (${Dms.compassPoint(data.aspect)})\n`
  str += `  cell size: ${(3.2808 * data.nsMeters).toFixed(2)} ft\n`
  str += `             | ${fmt(z[0])} | ${fmt(z[1])} | ${fmt(z[2])} |\n`
  str += `             | ${fmt(z[3])} | ${fmt(z[4])} | ${fmt(z[5])} |\n`
  str += `             | ${fmt(z[6])} | ${fmt(z[7])} | ${fmt(z[8])} |\n`
  console.log(str)
}

async function runBoth (loc, sampleRes, cellWidth) {
  // Schedule first...
  const pending = Promise.all([
    usgs(loc.lat, loc.lon, sampleRes, cellWidth),
    mapQuest(loc.lat, loc.lon, sampleRes, cellWidth)
  ])
  // ... `await` later.
  const [us, mq] = await pending
  // .. then do something with it
  show('USGS', loc.name, us)
  show('MapQuest', loc.name, mq)
}

function runEach (loc, sampleRes, cellWidth) {
  usgs(loc.lat, loc.lon, sampleRes, cellWidth)
    .then(result => { show('USGS', loc.name, result) })

  mapQuest(loc.lat, loc.lon, sampleRes, cellWidth)
    .then(result => { show('MapQuest', loc.name, result) })
}

const M = { name: 'The "M"', lat: 46.859340, lon: -113.975528 }
const Home = { name: 'Home', lat: 46.85714, lon: -114.00730 }

// 1/3 arc-second in decimal degrees
const sampleRes = 1 / (60 * 60 * 3)
// Double sample distance to ensure adjacent cells have different sample
const cellWidth = 2
const loc = M

// runEach(loc, sampleRes, cellWidth)
runBoth(loc, sampleRes, cellWidth)
