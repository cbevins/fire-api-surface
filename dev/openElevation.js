/**
 * Methods for accessing the USGS Elevation Point Query Service
 * https://nationalmap.gov/epqs/
 */
import fetch from 'node-fetch'
import { distance, destination } from './greatCircle.js'

let start = 0

export function getOpenElevation (map, locations) {
  const url = 'https://api.open-elevation.com/api/v1/lookup?locations='
  fetch(url + locations, { method: 'GET' })
    .then((result) => result.json())
    .then((json) => slopeAspect(json, map))
    .catch((error) => console.error('error: ' + error))
}

function constrain (degrees) {
  while (degrees >= 360) degrees -= 360
  while (degrees < 0) degrees += 360
  return degrees
}

// Formats a number value 'v' to a string of width 'w' and 'd' decimals
function fmt (v, w, d) { return (+v).toFixed(d).padStart(w, ' ') }

function opposite (degrees) { return constrain(degrees - 180) }

function slopeAspect (json, map) {
  console.log('OpenElevation latency:', Date.now() - start)
  map.forEach((data, bearing) => {
    data.elev = json.results[data.id].elevation
    map.set(bearing, data)
  })
  // The rest is the same as usgsEqps
  const deg = 360 / (map.size - 1)
  let slope = 0
  let aspect = -1
  const p0 = map.get(-1)
  console.log(`Origin elev: ${p0.elev}\nDeg Elev (m)  Slope (%)`)
  let steepestAbs = 0 // absolute value of steepest slope
  let steepestAt = -1 // bearing for steepest slope
  for (let bearing = 0; bearing < 360; bearing += deg) {
    const p1 = map.get(bearing)
    const slope = (p1.elev - p0.elev) / p1.dist
    if (Math.abs(slope) > steepestAbs) {
      steepestAbs = Math.abs(slope)
      steepestAt = bearing
    }
    const str = `${fmt(p1.bearing, 3, 0)} ${fmt(p1.elev, 7, 2)} ${fmt(100 * slope, 7, 2)}`
    console.log(str)
  }
  if (steepestAt !== -1) {
    const p1 = map.get(steepestAt)
    slope = (p1.elev - p0.elev) / p1.dist
    aspect = (slope > 0) ? opposite(p1.bearing) : p1.bearing
  }
  console.log(`Slope = ${(100 * slope).toFixed(2)} Aspect = ${aspect}`)
}

function rosette (lat, lon, radius, deg) {
  const map = new Map()
  let id = 0
  map.set(-1, {
    id: id++,
    bearing: -1,
    dist: 0,
    lat: lat,
    lon: lon,
    elev: 0
  })
  let locations = `${lat},${lon}`
  for (let bearing = 0; bearing < 360; bearing += deg) {
    const [lat1, lon1] = destination(lat, lon, bearing, radius)
    map.set(bearing, {
      id: id++,
      bearing: bearing,
      dist: radius,
      lat: lat1,
      lon: lon1,
      elev: 0
    })
    locations += `|${lat1},${lon1}`
  }
  getOpenElevation(map, locations)
}

start = Date.now()
rosette(47, -114, 30.89, 15)
console.log('Waiting for Open-Elevation reply ...')
