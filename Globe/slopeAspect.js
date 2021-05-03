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

/**
 * Creates a 3x3 grid of *square* cell [lat, lon] pairs at some resolution
 * @param {number} lat0 Center cell latitude north (+) or south (-)
 * @param {number} lon0  Center cell longitude east (+) or west (-)
 * @param {number} sampleRes Sample resolution in decimal degrees (usually 1/3 arc-second)
 * @param {number} cellWidth Cell width (and height) in sampleRes units
 * @returns { cell, nsDist, ewMeters, nsMeters, ewDegrees, sampleRes, cellWidth } where
 * - cell is 3x3 array of cell center {lat, lon} objects
 * - nsMeters is north-south distance between cell centers (m)
 * - ewMeters is east-west distance between cell centers (m)
 * - nsDegrees is north-south distance between cell centers in decimal degrees
 * - ewDegrees is east-west distance between cell centers in decimal degrees
 * - sampleRes is the specified sample resolution in decimal degrees (usually 1/3 arc-second)
 * - cellWidth is the specified cell width (and height) in sampleRes units
 *
 * We want elevations for 3x3 grid of evenly spaced cells at elevation sample resolution.
 * But while decimal degrees are uniform in north-south (y) dimension, they approach
 * zero in the east-west direction as longitude lines converge at the poles.
 * So the east-west distance (m) is adjusted to equal north-south distance for *sampleRes*
 */
export function locationGrid (lat0, lon0, sampleRes, cellWidth) {
  const nsDegrees = sampleRes * cellWidth
  const nsMeters = distance(lat0, lon0, lat0 + nsDegrees, lon0)
  const ewMeters = distance(lat0, lon0, lat0, lon0 + nsDegrees)
  // Determine east-west decimal degrees with same distance as north-south decimal degrees at this lat
  const ewDegrees = nsDegrees * nsMeters / ewMeters

  // Create the 3x3 grid of [lat, lon]
  const cells = []
  ;[-1, 0, 1].forEach(y => {
    const lat = lat0 + y * nsDegrees
    ;[-1, 0, 1].forEach(x => {
      const lon = lon0 + x * ewDegrees
      cells.push({ lat, lon })
    })
  })
  return { cells, nsMeters, ewMeters, nsDegrees, ewDegrees, sampleRes, cellWidth }
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
