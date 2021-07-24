/*
  A FireTrace is a horizontal line segment
  - at a specific (vertical or y-axis) position
  - with a begining and an ending position, and
  - containing zero or more FireSegments.

  FireSegments on the same FireTrace:
  - may not overlap, and
  - may or may not be connected.

  Any location on the FireTrace that is NOT occupied by a FireSegment
  is assumed to be 'Unburned'.

  The first and last FireSegments on a FireTrace:
  - represent the FireTrace endpoints,
  - have the same begining and ending position, and
  - have an 'Unburnable' status.
*/
import { FireSegment, Unburnable } from './FireSegment.js'

export class FireTrace {
  constructor (y) {
    this._y = y // y-axis position
    this._segments = []
  }

  // Simply adds a FireSegment to the end of the segments array
  // without checking for position, overlap, or range
  addSegment (begins, ends, status) {
    this._segments.push(new FireSegment(begins, ends, status))
    return this
  }

  // Returns the beginning (left) boundary
  begins () { return this._segments.length ? this._segments[0]._begins : null }

  // Returns TRUE if segment 'idx' is NOT connected to an unburnable segment on its left
  burnableLeft (idx) {
    return this.segment(idx - 1).ends() < this.segment(idx).begins() ||
    this.segment(idx - 1).isUnburnable()
  }

  // Returns TRUE if segment 'idx' is NOT connected to an unburnable segment on its left
  burnableRight (idx) {
    return this.segment(idx).ends() < this.segment(idx + 1).begins() ||
    this.segment(idx + 1).isUnburnable()
  }

  // Returns the ending (right) boundary
  ends () { return this._segments.length ? this._segments[this._segments.length - 1]._ends : null }

  // Returns an array of fire start locations on this FireTrace
  getFireStarts () {
    const starts = []
    for (let idx = 1; idx < this._segments.length - 1; idx++) {
      const segment = this.segment(idx)
      if (segment.isBurned() || segment.isBurning()) {
        segment.setBurned()
        if (this.burnableLeft(idx)) starts.push(segment.begins())
        if (this.burnableRight(idx)) starts.push(segment.ends())
      }
    }
    return starts
  }

  y () { return this._y }
}

// FireTrace for a FireScene that is not the top or bottom and may be modified.
export class FireTraceMiddle extends FireTrace {
  constructor (y, begins, ends) {
    super(y)
    this.addSegment(begins, begins, Unburnable)
    this.addSegment(ends, ends, Unburnable)
  }
}

// FireTrace for a FireScene that is at the top or bottom and will not be modified.
export class FireTraceEdge extends FireTrace {
  constructor (y, begins, ends) {
    super(y)
    this.addSegment(begins, ends, Unburnable)
  }
}
