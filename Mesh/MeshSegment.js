export class MeshSegment {
  constructor (begins, ends, value = null) {
    this._begins = Math.min(begins, ends)
    this._ends = Math.max(begins, ends)
    this._value = value
  }

  // Returns segment's beginning world coordinate
  begins () { return this._begins }

  // Returns TRUE if *this* and *another* MeshSegment are connected
  connects (another) { return this.begins() === another.ends() || this.ends() === another.begins() }

  // Returns segment's ending world coordinate
  ends () { return this._ends }

  // Returns TRUE if *this* MeshSegment overlaps the distance 'begins' to 'ends'
  overlaps (begins, ends) { return this.begins() < ends && this.ends() > begins }

  // Returns TRUE if *this* MeshSegment overlaps with *another* MeshSegment
  overlapsWith (another) { return this.overlaps(another.begins(), another.ends()) }

  // Called by MeshLine.appendSegment() to combine connected segments of same value
  setEnds (ends) { this._ends = ends }

  // Returns segment's value
  value () { return this._value }
}
