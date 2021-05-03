/**
 * Calculates slope and aspect using the third order finite difference technique shown by
 * https://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-aspect-works.htm
 * which references:
 * Burrough, P. A., and McDonell, R. A., 1998.
 *    Principles of Geographical Information Systems.
 *    (Oxford University Press, New York), 190 pp.
 *
 * @param {array} e Array of 9 elevations in a 3x3 grid whose spatial indices are:
 * 0 1 2
 * 3 4 5
 * 6 7 8
 * @param {number} x Cell east-west distance (in same units as elevation)
 * @param {number} y Cell north-south distance (in same units as elevation)
 * @returns [slope, aspect] where
 *  - slope is in degrees,
 *  - aspect is degrees clockwise from north
 */
import { distance } from './greatCircle.js'

export function aspect (z, xdim, ydim) {
  const [dx, dy] = _dz(z, xdim, ydim)
  return _adjustAspect(57.29578 * Math.atan2(dy, -dx))
}

// We want elevations for 3x3 grid of evenly spaced cells at elevation resolution
// But while arc-second is uniform in north-south (y) dimension,
// it approaches zero in the east-west direction as longitude lines converge at poles
export function buildGrid (lat, lon, step, showElev = false, showDist = false) {
  // USGS has elevation sampled at every 1/3 arc-second
  const nsArcSec = 1 / 60 / 60 / 3 // 1/3 arc-second in degrees

  // Distance of 1/3 arc-second in north-south direction at lat
  // (this distance is constant in the north-south (y) direction)
  const nsDist = distance(lat, lon, lat + nsArcSec, lon)

  // Distance of 1/3 arc-second in east-west direction at lat
  // (this distance approaches zero in the east-west direction as longitude lines converge at poles)
  const ewDist = distance(lat, lon, lat, lon + nsArcSec)

  // Determine east-west arc-seconds with same distance as north-south 1/3 arc-seconds at this lat
  const ewArcSec = nsArcSec * nsDist / ewDist
  if (showDist) {
    _showDistances(lat, lon, nsArcSec, nsDist, ewDist, ewArcSec)
  }

  // Create the 3x3 grid of [lat, lon]
  const z = []
  ;[-1, 0, 1].forEach(y => {
    const lat1 = lat + y * step * nsArcSec
    ;[-1, 0, 1].forEach(x => {
      const lon1 = lon + x * step * ewArcSec
      z.push([lat1, lon1])
    })
  })
  return [z, nsDist, ewDist, nsArcSec, ewArcSec]
}

// Dumps sample distance data
function _showDistances (lat, lon, nsArcSec, nsDist, ewDist, ewArcSec) {
  console.log(`1/3 arc-sec at lat ${lat} in north-south direction is ${nsDist} m (${3.2808 * nsDist} f)`)
  console.log(`1/3 arc-sec at lat ${lat} in east-west direction is ${ewDist} m (${3.2808 * ewDist} f)`)
  console.log(`${ewArcSec * 3600} arc-sec are required to span ${nsDist} m in east-west direction`)
  const testEwDist = distance(lat, lon, lat, lon + ewArcSec)
  console.log(`${ewArcSec * 3600} arc-sec in east-west direction is ${testEwDist} m`)
}

// Dumps elevation data
export function showElevation (z, slope, aspect, step, nsDist) {
  let str = `\nCell size = ${nsDist} m (size factor=${step}):\n`
  str += `${z[0]} ${z[1]} ${z[2]}\n`
  str += `${z[3]} ${z[4]} ${z[5]}\n`
  str += `${z[6]} ${z[7]} ${z[8]}\n`
  str += `Slope = ${slope} degrees, Aspect = ${aspect}\n`
  console.log(str)
}

export function slope (z, xdim, ydim) {
  const [dx, dy] = _dz(z, xdim, ydim)
  return Math.atan(Math.sqrt(dx ** 2 + dy ** 2)) * 180 / Math.PI
}

export function slopeAspect (z, xdim, ydim) {
  const [dx, dy] = _dz(z, xdim, ydim)
  const slopeDeg = Math.atan(Math.sqrt(dx ** 2 + dy ** 2)) * 180 / Math.PI
  const aspect = _adjustAspect(57.29578 * Math.atan2(dy, -dx))
  return [slopeDeg, aspect]
}

// Private method to adjust aspect (deg) from counter-clockwise wrt east to clockwise wrt north
function _adjustAspect (aspect) {
  if (aspect < 0) return 90 - aspect
  if (aspect > 90) return 360 - aspect + 90
  return 90 - aspect
}

/**
 *  Private method to determine change in Z (elev) in the x-direction |dZ/dX|
 *  and change in Z (elev) in the y-direction |dZ/dY|
 * @param {array} z  9-element array of 3x3 cell grid
 * @param {number} xdim Length of a cell in the x-direction (same units as z)
 * @param {number} ydim Length of a cell in the y-direction (same units as z)
 * @returns [dZdX, dZdY]
 */
function _dz (z, xdim, ydim) {
  const [a, b, c, d, , f, g, h, i] = z
  const dZdX = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * xdim)
  const dZdY = ((g + 2 * h + i) - (a + 2 * b + c)) / (8 * ydim)
  return [dZdX, dZdY] // actually |dZ/dX| and |dZ/dy|
}
