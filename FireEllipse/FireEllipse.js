/**
 * A 'fire ellipse' is a regular ellipse that is defined by:
 * - a total length
 * - a total width
 * - a heading direction
 * - time since ignition (optional)
 * - an ignition point at [0,0]
 */
import { abs, azimuthOf, caz2rot, cos, deg2rad, pi, rotatePoint, sin, sqrt, trunc } from './trig.js'

export class FireEllipse {
  /**
   *
   * @param {number} length Fire ellipse total length
   * @param {number} width Fire ellipse total width
   * @param {number} headingDegrees Fire heading (ellipse rotation) in degrees clockwise from north
   * @param {number} timeSinceIgnition Time since ignition
   */
  constructor (leng, wid, headingDegrees = 0, timeSinceIgnition = 1) {
    if (leng <= 0 || wid <= 0) {
      throw new Error('FireEllipse must have non-negative length and width')
    }
    leng = (leng > wid) ? leng : wid
    wid = (leng > wid) ? wid : leng
    this._a = leng / 2 // major axis radius
    this._b = wid / 2 // minor axis radius
    this._c = sqrt(this._a * this._a - this._b * this._b)
    this._e = this._c / this._a // eccentricity
    this._g = this._a - this._c // backing distance
    this._h = 2 * this._a - this._g // head distance
    this._time = timeSinceIgnition
    this._degrees = headingDegrees
    this._radians = headingDegrees * pi() / 180
    // rotatePoint use radians counter-clockwise from the x-axis (east)
    // while we want radians clockwise from north
    this._rot = caz2rot(headingDegrees) * pi() / 180
    // Determine ellipse center and fire head after rotation
    this._center = rotatePoint((this._a - this._g), 0, 0, 0, this._rot)
    this._head = rotatePoint(this._h, 0, 0, 0, this._rot)
    this._back = rotatePoint(-this._g, 0, 0, 0, this._rot)
    // this._scanLines = this.scanLines()
  }

  a () { return this._a } // major axis radius
  b () { return this._b } // minor axis radius
  back () { return this._back } // fire back [x,y] coordinate pair array
  backDist () { return this._g } // backing distance from ignition point
  backRate () { return this._g / this._time } // backing distance from ignition point
  bx () { return this._back[0] }
  by () { return this._back[1] }
  c () { return this._c } // ellipse c (distance from center to focus)
  center () { return this._center } // center point [x,y] coordinate pair array
  cx () { return this._center[0] } // center point x-coordinate
  cy () { return this._center[1] } // center point y-coordinate
  e () { return this._e } // eccentricity
  g () { return this._g } // distance from focus to vertice (backing distance)
  flankDist () { return this._b } // flanking distance
  flankRate () { return this._b / this._time } // flanking distance
  head () { return this._head } // fire head [x,y] coordinate pair array
  headDegrees () { return this._degrees } // major axis rotation in degrees
  headDist () { return this._h } // heading distance from ignition point
  headRadians () { return this._radians } // major
  headRate () { return (2 * this._a - this._g) / this._time } // heading distance from ignition point
  hx () { return this._head[0] }
  hy () { return this._head[1] }
  ign () { return [0, 0] } // ignition point [x, y] coordinate pair array
  ix () { return 0 } // ignition point x-coordinate
  iy () { return 0 } // ignition point y-coordinate
  length () { return 2 * this._a }
  lwr () { return this._a / this._b }
  rotation () { return this._rot }
  xOffset () { return this._g } // distance from ignition point x to ellipse center point x
  width () { return 2 * this._b } // ellipse width

  /**
   * Distance from the ignition point to the ellipse perimeter
   * at 'beta' degrees clockwise from the heading direction.
   *
   * @param {number} beta Angle of interest (degrees clockwise from heading direction).
   * @return {number} The distance from ignition point to ellipse perimeter
   * at 'beta' degrees clockwise from the fire head
   */
  betaDistToPerim (betaRad) { return this.betaRatio(betaRad) * this.headDist() }

  // Returns degrees clockwise from fire head to point [x,y]
  betaDegreesToPoint (x, y) { return (360 + (azimuthOf(x, y) - this._degrees)) % 360 }

  // Returns radians clockwise from fire head to point [x,y]
  betaRadiansToPoint (x, y) { return this.betaDegreesToPoint(x, y) * pi() / 180 }

  // Returns ratio of distance to ellipse perimeter at betaRad to the distance to the head
  betaRatio (betaRad) { return abs(betaRad) === 0 ? 1 : (1 - this._e) / (1 - this._e * cos(betaRad)) }

  // Returns ratio of distances to ellipse perimeter from ignition pt [x,y] / [hx, hy]
  betaRatioToPoint (x, y) { return this.betaRatio(this.betaRadiansToPoint(x, y)) }

  betaRate (betaRad) { return this.betaDistToPerim(betaRad) / this._time }

  betaTimeToPerim (betaRad) { return this.betaDistToPerim(betaRad) / this._time }

  betaTimeToPoint (x, y) {
    const betaRadians = this.betaRadiansToPoint(x, y)
    const betaRatio = this.betaRatio(betaRadians)
    const betaRate = betaRatio * this.headDist() / this._time
    const betaDist = sqrt(x * x + y * y)
    const betaTime = betaDist / betaRate
    return betaTime
  }

  /**
   * Returns TRUE if point x,y is *within* this Ellipse's boundary by the buffer amount.
   *
   * @param {Point} p Point to be tested
   * @param {number} buffer Buffer zone distance inside the ellipse perimeter
   *  If buffer===0, points on the ellipse boundary are considered within the ellipse.
   * @returns {bool} TRUE if p is inside the perimeter buffer
   */
  containsPoint (px, py, buffer = 0) {
    // Translate point relative to ellipse center
    const dx = px - this.cx()
    const dy = py - this.cy()
    // Unrotate the point about the ellipse center
    const [x, y] = rotatePoint(dx, dy, 0, 0, -this._rot)
    const rx = x / this._a
    const ry = y / this._b
    // console.log(`p[${px}, ${py}], unrot[${x}, ${y}], ratio[${rx}. ${ry}]`)
    return (rx * rx + ry * ry) <= (1 - buffer)
  }

  perimeter () {
    const xm = (this.a() - this.b()) / (this.a() + this.b())
    const xk = 1 + xm * xm / 4 + xm * xm * xm * xm / 64
    return pi() * (this.a() + this.b()) * xk
  }

  /**
  * Determine the point on the ellipse perimeter at angle theta from the ellipse center
  * @param {number} theta Angle from ellipse center to the perimeter point (radians)
  * @returns {array} Perimeter point [x,y] coordinate pair
  */
  perimeterPointAt (theta) {
    const cosT = cos(theta)
    const sinT = sin(theta)
    const cosA = cos(this.headRadians())
    const sinA = sin(this.headRadians())
    const x = this.a() * cosT * cosA - this.b() * sinT * sinA + this.cx()
    const y = this.a() * cosT * sinA + this.b() * sinT * cosA + this.cy()
    return [x, y]
  }

  scanLines () {
    const map = new Map()
    for (let a = 0; a < 360; a += 1) {
      const [px, py] = this.perimeterPointAt(deg2rad(a))
      const key = trunc(py) // Use the y-coordinate integer as a key
      if (map.has(key)) {
        const [xmin, xmax] = map.get(key)
        if (px < xmin) {
          map.set(key, [px, xmax]) // found a new minimum x at this y scanline
        } else if (px > xmax) {
          map.set(key, [xmin, px]) // found a new maximum x at this y scanline
        }
      } else {
        map.set(key, [px, px]) // found first entry for this y scanline
      }
    }
    this._scanLines = map
  }
}

// Alternate method of creating a FireEllipse
// given a spread rate, length-to-width ratio, angle, and time
export function createFireEllipse (headRate, lwr, headingDegrees = 0, time = 1) {
  const x = lwr * lwr - 1
  const e = (x > 0) ? (sqrt(x) / lwr) : 0
  const backRate = headRate * (1 - e) / (1 + e)
  const length = time * (headRate + backRate)
  const width = length / lwr
  return new FireEllipse(length, width, headingDegrees, time)
}
