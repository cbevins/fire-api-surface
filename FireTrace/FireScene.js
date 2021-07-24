/*
  A FireScene is an array of FireTraces that are temporally updated to reflect:
  - fire growth under variable burning conditions (terrain, fuel, moisture, weather), and
  - construction of fire control line.

  To mark a FireScene's boundary:
    - the top and bottom FireTraces have a single Unburnable FireSegment spanning the scene's width, and
    - all other FireTrace's begin and end with an Unburnable FireSegment (point).
*/
import { FireTraceMiddle, FireTraceEdge } from './FireTrace.js'

export class FireScene {
  constructor (left, right, top, bottom, spacing, timeRes) {
    this._left = left // left-most boundary
    this._right = right // right-most boundary
    this._top = left // top-most boundary
    this._bottom = bottom // bottom-most boundary
    this._spacing = spacing // vertical distance between horizontal FireTraces
    this._ystep = Math.ceil((bottom - top) / spacing)
    this._traces = [new FireTraceEdge(top - this._ystep)]
    const n = Math.ceil(Math.abs(bottom - top) / spacing)
    for (let i = 0; i < n; i++) this._traces.push(new FireTraceMiddle(top + n * this._ystep))
    this._traces.push(new FireTraceEdge(bottom + this._ystep))
  }

  // Returns the index of the FireTrace closest to the 'y' world corrdinate
  idxAt (y) {
    const idx = 1 + ((y - this._top) / this._ystep)
    return Math.round(Math.max(0, Math.min(this._traces.length - 1, idx)))
  }

  // Returns a reference to the FireTrace closest to the 'y' world corrdinate
  fireTraceAt (y) { return this.fireTrace(this.idxAt(y)) }

  // Returns a reference to the FireTrace at index 'idx'
  fireTrace (idx) { return this._traces[idx] }

  // Returns a reference to the array of all FireTraces
  fireTraces () { return this._traces }

  //
  grow (time) {
    // Get all the possible fire start locations
    const starts = []
    this.fireTraces().forEach((trace, idx) => {
      trace.getFireSeeds().forEach(x => { starts.push([x, idx]) })
    })
    // Extend the fire along each FireTrace
    starts.forEach(([x, idx]) => { this.growFromPoint(x, idx, time) })
  }

  // Grow the fire from ignition point [x, y]
  growFromPoint (x, traceIdx, time) {
    // Get the y position for the FireTrace idx
    const y = this.fireTrace(traceIdx).y()

    // Get a FireSeed for this location and time
    const seed = this.getFireSeed(x, y, time)

    // Begin with the FireSeed's ignition row
    const seedOrig = seed.originidx()

    // Extend the FireSeed row
    this.extendFire(idx)
  }
}
