export function abs (val) { return Math.abs(val) }

export function acos (r) { return Math.acos(r) }

/**
 * Returns clockwise sweep [0..2pi radians] between 2 line segments joined at the origin
 * @param {number} x1 Starting line segment non-origin x-coordinate
 * @param {number} y1  Starting line segment non-origin y-coordinate
 * @param {number} x2  Ending line segment non-origin x-coordinate
 * @param {number} y2 Ending line segment non-origin y-coordinate
 * @returns {number} Clockwise arc (radians) between first and second line segments
 */
export function angle (x1, y1, x2, y2) {
  const den = (x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)
  const a = acos(div((x1 * x2 + y1 * y2), sqrt(den)))
  return (x2 < x1) ? 2 * pi() - a : a
}

/**
 * Returns clockwise sweep [0..2pi radians] between 3 points p1->p2->p3
 * @param {number} x1 Starting point x-coordinate
 * @param {number} y1  Starting point y-coordinate
 * @param {number} x2  Middle (joining) point x-coordinate
 * @param {number} y2 Middle (joining) point y-coordinate
 * @param {number} x3  Ending point x-coordinate
 * @param {number} y3 Ending point y-coordinate
 * @returns {number} Clockwise arc (radians) between 3 points p1->p2->p3
 */
export function angle3 (x1, y1, x2, y2, x3, y3) {
  const ab = sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
  const bc = sqrt((x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3))
  const ac = sqrt((x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1))
  return acos((bc * bc + ab * ab - ac * ac) / (2 * bc * ab))
}

export function asin (r) { return Math.asin(r) }

export function atan (r) { return Math.atan(r) }

// Returns the degrees clockwise from north to point at [x,y]
export function azimuthOf (x, y) {
  if (x === 0) return (y >= 0) ? 0 : 180
  const deg = abs(atan(-y / -x) * 180 / Math.PI)
  if (x > 0) return (y >= 0) ? 90 - deg : 90 + deg
  return (y >= 0) ? 270 + deg : 270 - deg // else x < 0
}

// Converts compass azimuth (degrees clockwise from north)
// into geometric rotation (degrees counter-lockwise from positive x axis, i.e. east)
export function caz2rot (deg) { return (450 - deg) % 360 }

// Converts geometric rotation (degrees counter-lockwise from positive x axis, i.e. east)
// into compass azimuth (degrees clockwise from north)
export function rot2caz (deg) { return (450 - deg) % 360 }

export function cos (r) { return Math.cos(r) }

export function deg2rad (deg) { return deg * Math.PI / 180 }

export function distance (x1, y1, x2, y2) {
  const p = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
  return (p > 0) ? sqrt(p) : 0
}

export function div (n, d) { return d === 0 ? 0 : n / d }

export function cosdeg (deg) { return rad2deg(cos(deg2rad(deg))) }

export function pi () { return Math.PI }

export function rad2deg (rad) { return (rad * 180 / Math.PI) % 360 }

/**
 * Rotates point [px,py] around a center point [cx, cy] by 'radians'
 * @param {*} px x-coordinate of point to be rotated
 * @param {*} py x-coordinate of point to be rotated
 * @param {*} cx x-coordinate of central rotation point
 * @param {*} cy y-coordinate of central rotation point
 * @param {*} rad Radians of rotation
 * @returns {array} [x,y] coordinates of [px,py] after rotation
 */
export function rotatePoint (px, py, cx, cy, rad) {
  const cosa = cos(rad)
  const sina = sin(rad)
  const x = cosa * (px - cx) - sina * (py - cy) + cx
  const y = sina * (px - cx) + cosa * (py - cy) + cy
  return [x, y]
}

export function sin (r) { return Math.sin(r) }

export function sindeg (deg) { return rad2deg(sin(deg2rad(deg))) }

export function sqrt (v) { return (v <= 0) ? 0 : Math.sqrt(v) }

export function tan (r) { return Math.tan(r) }

export function tandeg (deg) { return rad2deg(tan(deg2rad(deg))) }

export function trunc (v) { return Math.trunc(v) }
