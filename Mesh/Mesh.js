export class MeshSegment {
  constructor (starts, value) {
    this._starts = starts // Starting position in the MeshLine
    this._value = value // value begining at this position
  }

  starts () { return this._starts }

  value () { return this._value }
}

export class MeshLine {
  constructor (pos) {
    this._pos = pos // Meshline's (horizontal or vertical) world coordinate
    this._segments = [] // array of MeshSegments
  }

  /**
   * Appends a MeshSegment to this MeshLine only if it's not a continuation of the previous segment
   * @param {MeshSegment|number} starts Either a MeshSegment reference, or the 'starts' property
   * @param {any} value If first arg is NOT a MeshSegment, this is the new MeshSegment(starts, value)
   * @returns {MeshLine} Reference to *this* MeshLine
   */
  appendSegment (starts, value) {
    let segment = starts
    if (arguments.length === 2 && typeof starts === 'number') {
      segment = new MeshSegment(starts, value)
    }
    const prev = this.lastIdx()
    if (prev < 0 || this._segments[prev].value() !== segment.value()) {
      this._segments.push(segment)
    }
    return this
  }

  // Returns the end position (world coordinates) of segment 'idx', or Infinity if last segment
  ends (idx) { return (idx < this.lastIdx()) ? this._segments[idx + 1].starts() : Infinity }

  // Assigns the MeshLine a single, constant value from the starting position
  fill (starts, value) {
    this._segments = [new MeshSegment(starts, value)]
    return this
  }

  lastIdx () { return this._segments.length - 1 }

  // Returns a new Meshline that is *this* MeshLine overlaid by 'value' from 'begin' to 'ends'.
  overlay (begins, ends, value) {
    const line = new MeshLine(this._pos)
    let idx = 0
    const lastIdx = this._segments.length - 1
    // Step 1 - push all segments that appear before the overlay
    while (idx <= lastIdx && this.starts(idx) < begins) { line.appendSegment(this.segment(idx++)) }
    // Step 2 -push the overlay segment itself
    line.appendSegment(new MeshSegment(begins, value))
    // Step 3 - skip any completely overlaid segments
    while (idx <= lastIdx && this.ends(idx) <= ends) { idx++ }
    // Step 4 - append any partially overlaid segment
    if (idx <= lastIdx) line.appendSegment(new MeshSegment(ends, this.value(idx++)))
    // Step 5 - append any remaining segments
    while (idx <= lastIdx) { line.appendSegment(this.segment(idx++)) }
    return line
  }

  // Returns the MeshLine's world coordinate
  pos () { return this._pos }

  // Returns the MeshSegment at 'idx'
  segment (idx) { return this._segments[idx] }

  // Returns the MeshLine' MeshSegment arrays
  segments () { return this._segments }

  // Returns starting world coordinate of segment at 'idx'
  starts (idx) { return this._segments[idx].starts() }

  // Returns the value of segment at 'idx'
  value (idx) { return this._segments[idx].value() }

  // Returns the value at 'distance' in world coordinate units
  valueAtDistance (distance) {
    let value = this.value(0)
    const lastIdx = this.lastIdx()
    let idx = 1
    while (idx <= lastIdx && this.starts(idx) <= distance) { value = this.value(idx++) }
    return value
  }
}

// Defines an array of regularly spaced MeshLines
export class MeshArray {
  constructor (posStart, posStop, spacing, isHorizontal = true) {
    this._start = posStart // world coordinate of the MeshArray's first (top or left) MeshLine
    this._stop = posStop // world coordinate of the MeshArray's last (bottom or right) MeshLine
    this._step = (posStart <= posStop) ? spacing : -spacing // world coordinate spacing between each adjacent MeshLine
    this._isHorizonatl = isHorizontal
    const n = Math.ceil(Math.abs((posStop - posStart) / spacing))
    this._lines = []
    for (let idx = 0; idx <= n; idx++) {
      this._lines.push(new MeshLine(this._start + idx * this._step))
    }
  }

  // Fills the entire array with a single starting position and value
  fill (starts, value) {
    this._lines.forEach(line => { line.fill(starts, value) })
    return this
  }

  // Returns the index of the MeshLine closest to position
  idxAtPos (position) {
    const idx = (position - this._start) / this._step
    return Math.round(Math.max(0, Math.min(this._lines.length - 1, idx)))
  }

  isHorizontal () { return this._isHorizonatl }

  // Returns a reference to the MeshLine at 'idx'
  line (idx) { return this._lines[idx] }

  // Returns the MeshLine closest to the position
  lineAtPos (position) { return this._lines[this.idxAtPos(position)] }

  lines () { return this._lines }

  // Returns the world coordinate of the first MeshLine
  posStart () { return this._start }

  // Returns the relative (+/-) spacing distance between adjacent MeshLines
  posStep () { return this._step }

  // Returns the world coordinate of the last MeshLine
  posStop () { return this._stop }

  // Sets or replaces the MeshLine at 'idx', perhaps from an overlay operation
  setMeshLine (idx, meshLine) {
    this._lines[idx] = meshLine
    return this
  }

  // Sets or replaces the MeshLine closest to 'pos', perhaps from an overlay operation
  setMeshLineAtPos (pos, meshLine) { return this.setMeshLine(this.idxAtPos(pos), meshLine) }

  // Returns the absolute (positive) spacing distance between adjacent MeshLines
  spacing () { return Math.abs(this._step) }

  // Returns value at MeshLine for 'pos' world coordinate at 'distance'
  valueAtPos (pos, distance) {
    return this.lineAtPos(pos).valueAtDistance(distance)
  }
}

// Defines a regularly spaced Mesh of horizontal and vertical MeshArrays
export class MeshFeature {
  constructor (left, right, top, bottom, spacing) {
    this._spacing = Math.abs(spacing) // spacing between adjacent MeshLines in world coordinates
    this._left = left // feature's left-most vertical Meshline world coordinate
    this._right = right // feature's right-most vertical Meshline world coordinate
    this._top = top // feature's top-most horizontal Meshline world coordinate
    this._bottom = bottom // feature's bottom-most horizontal Meshline world coordinate
    this._harray = new MeshArray(this._top, this._bottom, this._spacing, true) // rows
    this._varray = new MeshArray(this._left, this._right, this._spacing, false) // cols
  }

  bottom () { return this._bottom }

  colAtX (x) { return this._varray.idxAtPos(x) }

  // Fills the entire feature with a single starting position and value
  fill (starts, value) {
    this._harray.fill(starts, value)
    this._varray.fill(starts, value)
    return this
  }

  harray () { return this._harray }

  left () { return this._left }

  right () { return this._right }

  rowAtY (y) { return this._harray.idxAtPos(y) }

  spacing () { return this._spacing }

  top () { return this._top }

  // Returns vertical MeshLine value for 'x' world coordinate at 'distance'
  valueAtX (x, distance) { return this._varray.lineAtPos(x).valueAtDistance(distance) }

  // Returns horizontal MeshLine value for 'y' world coordinate at 'distance'
  valueAtY (y, distance) { return this._harray.lineAtPos(y).valueAtDistance(distance) }

  varray () { return this._varray }
}
