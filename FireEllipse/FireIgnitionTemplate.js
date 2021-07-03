import { FireEllipse } from './FireEllipse.js'

export class FireIgnitionTemplate extends FireEllipse {
  constructor (leng, wid, headingDegrees = 0, timeSinceIgnition = 1) {
    super(leng, wid, headingDegrees, timeSinceIgnition)
    // First determine size of the template
    const [hx, hy] = this.head()
    const [bx, by] = this.back()
    this._xmax = Math.max(hx, bx)
    this._xmin = Math.min(hx, bx)
    this._ymax = Math.max(hy, by)
    this._ymin = Math.min(hy, by)
    this._left = Math.floor(this._xmin) - 1
    this._right = Math.ceil(this._xmax) + 1
    this._top = Math.ceil(this._ymax) + 1
    this._bottom = Math.floor(this._ymin) - 1
    this._rows = this._right - this._left + 1
    this._cols = this._top - this._bottom + 1
    this._it = new Array(this._cols * this._rows)
    // Assign ignition (fire arrival) times to each grid point
    for (let row = this._top, idx = 0; row >= this._bottom; row--) {
      for (let col = this._left; col <= this._right; col++, idx++) {
        this._it[idx] = this.betaTimeToPoint(col, row)
      }
    }
  }

  bottom () { return this._bottom }

  cols () { return this._cols }

  // Returns ignition array col index relative to the ignition col
  itCol (col) { return (col - this._left) }

  // Returns ignition array row index relative to the ignition row
  itRow (row) { return (this._top - row) }

  // Returns ignition array index for [row,col] relative to the ignition point
  itIdx (col, row) { return this.itCol(col) + this.itRow(row) * this._cols }

  left () { return this._left }

  right () { return this._right }

  rows () { return this._rows }

  // Returns ignition time from origin for point at col, row
  timeAt (col, row) { return this._it[this.itIdx(col, row)] }

  top () { return this._top }
}
