/**
 * Methods for accessing the USGS Elevation Point Query Service
 * https://nationalmap.gov/epqs/
 */
import axios from 'axios'
import { destination } from './greatCircle.js'

const urlUsgsEpqs = 'https://nationalmap.gov/epqs/pqs.php?units=Meters&output=json&'

// -----------------------------------------------------------------------
// Slope-aspect section
// -----------------------------------------------------------------------

function constrain (degrees) {
  while (degrees >= 360) degrees -= 360
  while (degrees < 0) degrees += 360
  return degrees
}

// Formats a number value 'v' to a string of width 'w' and 'd' decimals
function fmt (v, w, d) { return (+v).toFixed(d).padStart(w, ' ') }

function opposite (degrees) { return constrain(degrees - 180) }

function slopeAspect (store) {
  let slope = 0
  let aspect = -1
  const p0 = store[0]
  console.log(`Origin elev: ${p0.e}\nDeg Elev (m)  Slope (%)`)
  let maxAbs = 0 // absolute value of steepest slope
  let maxIdx = 0 // index of vector with steepest slope
  for (let idx = 1; idx < store.length; idx++) {
    const p1 = store[idx]
    slope = (p1.e - p0.e) / p1.d
    if (Math.abs(slope) > maxAbs) {
      maxAbs = Math.abs(slope)
      maxIdx = idx
    }
    store[idx].s = slope
    const str = `${fmt(p1.b, 3, 0)} ${fmt(p1.e, 7, 2)} ${fmt(100 * slope, 7, 2)}`
    console.log(str)
  }
  if (maxIdx !== 0) {
    const p1 = store[maxIdx]
    slope = (p1.e - p0.e) / p1.d
    aspect = (slope > 0) ? opposite(p1.b) : p1.b
  }
  console.log(`Slope = ${(100 * slope).toFixed(2)} Aspect = ${aspect}`)
  return [store[0].e, slope, aspect]
}

// -----------------------------------------------------------------------
// Request and process section
// -----------------------------------------------------------------------

/**
 * Create a rosette of vectors passing through [lat, lon]
 *
 * @param {number} lat rosette origin latitude (decimal degrees)
 * @param {number} lon rosette origin longitude (decimal degrees)
 * @param {number} radius rosette radius (m)
 * @param {number} deg angle between each vector (degrees)
 * @param {array} store Array in which to store returned values
 */
const getRosette = async (lat, lon, radius, deg, store) => {
  try {
    const requests = []
    let idx = 0
    store.push({ i: idx++, x: lon, y: lat, b: -1, e: 0, d: 0, s: 0 })
    requests.push(axios.get(urlUsgsEpqs + `x=${lon}&y=${lat}`))
    for (let bearing = 0; bearing < 360; bearing += deg) {
      const [lat1, lon1] = destination(lat, lon, bearing, radius)
      store.push({ i: idx++, x: lon1, y: lat1, b: bearing, e: 0, d: radius, s: 0 })
      requests.push(axios.get(urlUsgsEpqs + `x=${lon1}&y=${lat1}`))
    }
    const responses = await axios.all(requests)
    return responses
  } catch (error) {
    console.error('error: ' + error)
  }
}

function store (responses, rosette) {
  responses.forEach((res, idx) => {
    const data = res.data.USGS_Elevation_Point_Query_Service.Elevation_Query
    if (rosette[idx].x !== data.x || rosette[idx].y !== data.y) {
      throw new Error('Mismatch for response ' + idx)
    }
    rosette[idx].i = idx
    rosette[idx].e = data.Elevation
  })
}

;(async () => {
  const rosette = []
  const start = Date.now()
  store(await getRosette(47, -114, 30.89, 15, rosette), rosette)
  console.log('USGS latency:', Date.now() - start)
  const sae = slopeAspect(rosette)
  console.log(sae)
})()
