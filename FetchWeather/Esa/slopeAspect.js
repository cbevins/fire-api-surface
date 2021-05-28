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

export function aspect (z, xdim, ydim) {
  const [dx, dy] = _dz(z, xdim, ydim)
  return _adjustAspect(57.29578 * Math.atan2(dy, -dx))
}

export function compassDir (deg) {
  const text = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N']
  const arc = 360 / 16 // 22.5
  const segment = Math.trunc((deg + arc / 2) / arc)
  return text[segment]
}

export function slope (z, xdim, ydim) {
  const [dx, dy] = _dz(z, xdim, ydim)
  return Math.atan(Math.sqrt(dx ** 2 + dy ** 2)) * 180 / Math.PI
}

/**
 *
 * @param {array} z  Array of elevations
 * @param {*} xdim Cell width in same units as elevation
 * @param {*} ydim Cell height in same units as elevation
 * @returns {array} [elev, slopeDegrees, aspectDegrees]
 */
export function slopeAspect (z, xdim, ydim) {
  const [dx, dy] = _dz(z, xdim, ydim)
  const slopeDeg = Math.atan(Math.sqrt(dx ** 2 + dy ** 2)) * 180 / Math.PI
  const aspect = _adjustAspect(57.29578 * Math.atan2(dy, -dx))
  return [z[4], slopeDeg, aspect]
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
