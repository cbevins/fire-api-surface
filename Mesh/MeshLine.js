import { MeshSegment } from './MeshSegment.js'

export class MeshLine {
  constructor (pos) {
    this._pos = pos // Meshline's (horizontal or vertical) world coordinate
    this._segments = [] // array of MeshSegments
  }

  // Appends a NEW MeshSegment to this MeshLine
  appendClone (segment) {
    return this.appendSegment(segment.begins(), segment.ends(), segment.value())
  }

  // Appends a NEW MeshSegment to this MeshLine
  appendSegment (begins, ends, value) {
    this._segments.push(new MeshSegment(begins, ends, value))
    return this
  }

  /**
   * Extends this MeshLine with a MeshSegment.
   * @param {MeshSegment} segment MeshSegment to be added
   */
  extendLine (begins, ends, value) {
    const lastSegment = this.lastSegment()
    if (!lastSegment) { // If there currently are no segments on this MeshLine ...
      this.appendSegment(begins, ends, value) // ... then simply append the segment to this line.
    } else if (lastSegment.ends() === begins && // else if these segments are connected AND...
      lastSegment.value() === value) { // ... they have the same value ...
      lastSegment.setEnds(ends) // ... then just extend the last segment's end.
    } else { // otherwise, there already are segments and they are not connected or have different value
      this.appendSegment(begins, ends, value) // append a new segment
    }
    return this
  }

  // Returns beginning world coordinate of segment at 'idx'
  begins (idx) { return this.segment(idx).begins() }

  // Returns the end position (world coordinates) of segment 'idx'
  ends (idx) { return this.segment(idx).ends() }

  // Assigns the MeshLine a single, constant value from the starting position
  fill (begins, ends, value) {
    this._segments = [new MeshSegment(begins, ends, value)]
    return this
  }

  // Returns index of the last MeshSegment in the line, or -1 if line has no segments
  lastIdx () { return this._segments.length - 1 }

  // Returns reference to the last MeshSegment in the line, or NULL if line has no segments
  lastSegment () {
    const idx = this.lastIdx()
    return (idx >= 0) ? this._segments[this.lastIdx()] : null
  }

  overlay (begins, ends, value) {
    const line = new MeshLine(this._pos) // start a new MeshLine
    const lastIdx = this.lastIdx()
    let idx = 0
    // First add all segments that occur entirely or partially before the overlay
    for (; idx <= lastIdx; idx++) {
      if (this.ends(idx) < begins) {
        line.appendClone(this.segment(idx))
      } else {
        if (this.begins(idx) < begins) { // then this segment *contains* begins
          line.extendLine(this.begins(idx), begins, this.value(idx)) // save the front portion
        }
        break
      }
    }
    // Add the overlay segment
    line.extendLine(begins, ends, value)
    // Skip any covered segments, add remaining segments
    for (; idx <= lastIdx; idx++) {
      if (this.ends(idx) <= ends) {
        // skip segments that end before the overlay
      } else if (this.begins(idx) < ends) {
        line.extendLine(ends, this.ends(idx), this.value(idx)) // save the back portio
      } else {
        line.appendClone(this.segment(idx))
      }
    }
    return line
  }

  overlaySegment (segment) {
    return this.overlay(segment.begins(), segment.ends(), segment.value())
  }

  overlaySelf (begins, ends, value) {
    const line = this.overlay(begins, ends, value)
    this._segments = line._segments
    return this
  }

  // Returns the MeshLine's world coordinate
  pos () { return this._pos }

  // Returns the MeshSegment at 'idx'
  segment (idx) { return this._segments[idx] }

  // Returns the MeshLine' MeshSegment arrays
  segments () { return this._segments }

  // Returns the value of segment at 'idx'
  value (idx) { return this._segments[idx].value() }

  // Returns the value at 'distance' in world coordinate units
  valueAtDistance (distance) {
    const lastIdx = this.lastIdx()
    for (let idx = 0; idx <= lastIdx; idx++) {
      if (this.begins(idx) <= distance && distance < this.ends(idx)) {
        return this.value(idx)
      } else if (this.begins(idx) > distance) {
        break
      }
    }
    return undefined
  }
}
