/**
 * Methods for accessing the USGS Elevation Point Query Service
 * https://nationalmap.gov/epqs/
 */
import fetch from 'node-fetch'
import { distance, destination } from './greatCircle.js'
let start = 0

const usgsEpqs = 'https://nationalmap.gov/epqs/'

function accumulate (json, bearing, dist, map, points) {
  const data = json.USGS_Elevation_Point_Query_Service.Elevation_Query
  map.set(bearing, {
    bearing: bearing,
    dist: dist,
    lat: data.y,
    lon: data.x,
    elev: data.Elevation
  })
  if (map.size === points) {
    slopeAspect(map)
  }
}

function constrain (degrees) {
  while (degrees >= 360) degrees -= 360
  while (degrees < 0) degrees += 360
  return degrees
}

// Formats a number value 'v' to a string of width 'w' and 'd' decimals
function fmt (v, w, d) { return (+v).toFixed(d).padStart(w, ' ') }

function opposite (degrees) { return constrain(degrees - 180) }

function slopeAspect (map) {
  console.log('USGS latency:', Date.now() - start)
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

export function getEpqs (lat, lon, bearing, radius, map, points) {
  const url = usgsEpqs + 'pqs.php?'
  const data = `x=${lon}&y=${lat}&units=Meters&output=json`
  // const form1 = '&__ncforminfo=5LRgzQLzziYH6GbIIV0ep3QxcdKV0S-8VNk541MjEsNwrfJ6mI5YakqxTBxIm5fT_qxAHNQnEFQsWMMY5FT2-kXNZ5zKM83HNEsV1TlZhO0%3D'
  // const form2 = '&__ncforminfo=6-TP-45YJEYxt2MKMgSXN3Bm0ToMN2HFp4pEi5Dx7gkpfioLAEXyi7-KiNH1HmfiLODJxVPEvUS-TwvgJvIMRqXXKJVPY5PJn1vg0nviX8JuKH0Mwwdh2g%3D%3D'

  fetch(url + data, { method: 'GET' })
    .then((result) => result.json())
    .then((json) => accumulate(json, bearing, radius, map, points))
    .catch((error) => console.error('error: ' + error))
}

/**
 * Create a rosette of vectors passing through [lat, lon]
 *
 * @param {number} lat rosette origin latitude (decimal degrees)
 * @param {number} lon rosette origin longitude (decimal degrees)
 * @param {number} radius rosette radius (m)
 * @param {number} deg angle between each vector (degrees)
 */
function rosette (lat, lon, radius, deg) {
  const map = new Map()
  const points = 1 + 360 / deg // origin plus each vector
  getEpqs(lat, lon, -1, 0, map, points) // origin
  for (let bearing = 0; bearing < 360; bearing += deg) {
    const [lat1, lon1] = destination(lat, lon, bearing, radius)
    getEpqs(lat1, lon1, bearing, radius, map, points)
  }
}

start = Date.now()
rosette(47, -114, 30.89, 15)
console.log('Waiting for USGS reply ...')
