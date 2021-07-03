/**
 * FireWavelet is a FireEllipse over a limited, uniform space and time
 * that is spatially represented by horizontal and vertical scanlines.
 *
 * FireWavelets are used to expand fire berimeters in the FireLandscape
 */
import { FireEllipse } from './FireEllipse.js'
import * as T from './trig.js'

export class FireWavelet extends FireEllipse {
  constructor (leng, wid, headingDegrees = 0, timeSinceIgnition = 1, spacing = 1, verbose = false) {
    super(leng, wid, headingDegrees, timeSinceIgnition)
    this._spacing = spacing
    this._verbose = verbose
    this.scanHorizontal()
    this.scanVertical()
  }

  // Returns an array with 0, 1, or 2 intersection [x,y] point coordinates
  ellipseLineIntersections (x1, y1, x2, y2, segmentOnly = false) {
    const a = this.a()
    const b = this.b()
    // If the ellipse or line segment are empty, return no intersections
    if (a <= 0 || b <= 0 || (x1 === x2 && y1 === y2)) return []

    // For now, assume original center is at origin (can translate later)
    const cx = 0
    const cy = 0

    // Calculate the quadratic parameters
    const A = (x2 - x1) * (x2 - x1) / a / a + (y2 - y1) * (y2 - y1) / b / b
    const B = 2 * x1 * (x2 - x1) / a / a + 2 * y1 * (y2 - y1) / b / b
    const C = x1 * x1 / a / a + y1 * y1 / b / b - 1

    // Calculate the discriminant and make a list of t values
    const t = []
    const discriminant = B * B - 4 * A * C
    if (discriminant === 0) { // One real solution
      t.push(-B / 2 / A)
    } else if (discriminant > 0) { // Two real solutions
      const d = Math.sqrt(discriminant)
      t.push((-B + d) / 2 / A)
      t.push((-B - d) / 2 / A)
    }

    // Convert the t values into points
    const points = []
    t.forEach(v => {
      // If the points are on the segment (or we don't care if they are), add them to the list
      if (!segmentOnly || (v >= 0 && v <= 1)) {
        const x = x1 + (x2 - x1) * v + cx
        const y = y1 + (y2 - y1) * v + cy
        points.push([x, y])
      }
    })
    // Order points by their x value
    if (points.length === 2 && points[0][0] > points[1][0]) {
      return [points[1], points[0]]
    }
    return points
  }

  fmt (x, y) { return `[${x.toFixed(2)}, ${y.toFixed(2)}]` }

  hScans () { return this._hScans }

  scan (p1x, p1y, p2x, p2y, verbose = false) {
    let str = ''
    // 1 - Translate line endpoints by -cx, -cy
    let t1x = p1x - this.cx()
    let t1y = p1y - this.cy()
    let t2x = p2x - this.cx()
    let t2y = p2y - this.cy()
    str += `1: line endpts translate to ${this.fmt(t1x, t1y)} and ${this.fmt(t2x, t2y)}\n`
    // 2 - Rotate
    ;[t1x, t1y] = T.rotatePoint(t1x, t1y, 0, 0, -this.rotation())
    ;[t2x, t2y] = T.rotatePoint(t2x, t2y, 0, 0, -this.rotation())
    str += `2: line endpts rotate to    ${this.fmt(t1x, t1y)} and ${this.fmt(t2x, t2y)}\n`
    // 3 - Determine intersections (may be 0, 1, or 2)
    const pts = this.ellipseLineIntersections(t1x, t1y, t2x, t2y)
    str += `There are ${pts.length} intersections between line and ellipse\n`
    const p = []
    pts.forEach(([x, y]) => {
      str += `   ${this.fmt(x, y)}`
      // 4 - Unrotate
      ;[x, y] = T.rotatePoint(x, y, 0, 0, this.rotation())
      str += ` unrotates to ${this.fmt(x, y)}`
      // 5 - Translate back to ignition point
      x += this.cx()
      y += this.cy()
      str += ` translates to ${this.fmt(x, y)}\n`
      p.push([x, y])
    })
    if (verbose) console.log(str)
    return p
  }

  scanHorizontal () {
    this._hScans = []
    const lines = Math.ceil(this.length() / this._spacing) + 1
    const x = this._spacing * lines
    // Traverse from north (positive y) to origin to south (negative y)
    for (let line = lines; line >= -lines; line--) {
      const y = line * this._spacing
      const a = this.scan(-x, y, x, y)
      if (a.length) {
        if (a.length === 1) a.push(a[0]) // include tangents
        this._hScans.push([a[0][1], a[0][0], a[1][0]]) // [y, x1, x2]
      }
    }
  }

  scanVertical () {
    this._vScans = []
    const lines = Math.ceil(this.length() / this._spacing) + 1
    const y = this._spacing * lines
    // Traverse from west (negative x) to origin to east (positive x)
    for (let line = -lines; line <= lines; line++) {
      const x = line * this._spacing
      const a = this.scan(x, y, x, -y)
      if (a.length) {
        if (a.length === 1) a.push(a[0]) // include tangents
        this._vScans.push([a[0][0], a[0][1], a[1][1]]) // [x, y1, y2]
      }
    }
  }

  vScans () { return this._vScans }
}
