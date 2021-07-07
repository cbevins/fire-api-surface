import { MeshLine } from './MeshLine.js'

export class MeshFeature {
  constructor (left, right, top, bottom, spacing, defaultValue = -1) {
    this._spacing = Math.abs(spacing) // spacing between adjacent MeshLines in world coordinates
    this._left = left // feature's left-most vertical Meshline world coordinate
    this._right = right // feature's right-most vertical Meshline world coordinate
    this._top = top // feature's top-most horizontal Meshline world coordinate
    this._bottom = bottom // feature's bottom-most horizontal Meshline world coordinate
    this._hstep = (top <= bottom) ? spacing : -spacing // world coordinate spacing between each adjacent MeshLine
    this._defaultValue = defaultValue
    this._hlines = []
    const n = Math.ceil(Math.abs((bottom - top) / spacing))
    for (let idx = 0; idx <= n; idx++) {
      this._hlines.push(new MeshLine(this._top + idx * this._hstep))
    }
  }

  // Returns the feature's bottom-most horizontal MeshLine y world coordinate
  bottom () { return this._bottom }

  // Returns a value if the segment [x,y] exists, otherwise returns the default value
  boundValue (x, y) {
    const v = this.lineAt(y).valueAt(x)
    return (v === undefined) ? this._defaultValue : v
  }

  // Fills the feature's MeshLines with the same MeshSegment
  fill (begins, ends, value) {
    this._hlines.fill(begins, ends, value)
    return this
  }

  // Returns a reference to the horizontal MeshLine array
  hlines () { return this._hlines }

  // Returns the index of the horizontal MeshLine closest to the 'y' world corrdinate
  idxAt (y) {
    const idx = (y - this._top) / this._hstep
    return Math.round(Math.max(0, Math.min(this._hlines.length - 1, idx)))
  }

  // Returns the feature's left-most x world coordinate
  left () { return this._left }

  // Returns the feature's right-most x world coordinate
  right () { return this._right }

  // Returns a reference to the feature's array of horizontal MeshLines
  line (idx) { return this._hlines[idx] }

  // Returns a reference to the horizontal MeshLine closets to the 'y' world coordinate
  lineAt (y) { return this._hlines[this.idxAt(y)] }

  spacing () { return this._spacing }

  // Returns the feature's top-most horizontal MeshLine y world coordinate
  top () { return this._top }

  // Returns horizontal MeshLine value for 'y' world coordinate at 'distance'
  value (x, y) { return this.lineAt(y).valueAt(x) }
}
