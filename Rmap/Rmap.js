/**
 * Rtile is a recursive grid of nxn equally-spaced locations
 *
 * Rtile is implemented an array of references to the sub-maps it contains
 * - if an element value === 0, that sub-map has not yet been constructed
 * - if an element value === 1, that sub-map has been discarded
 * - otherwise, the element value is a reference to another active Rtile
 */
export class Rtile extends Array {
  constructor (dim) {
    super(dim * dim)
    this.fill(0)
  }
}

/**
 * Rmap is the top-level data structure for a recursive Rtile
 */
export class Rmap {
  /**
   * Creates an Rtile containing dim x dim sub-Rtiles up to maxDepth
   *
   * The Rtile can represent up to dim^(2*maxDepth) locations.  For example:
   * Dim Dep Maximum Locations    Loc/Side
   *   2   8            65,536         256
   *   2  10         1,048,576        1024
   *   2  12        16,777,216        4096
   *   2  16     4,294,967,296      65,536 (12.41 mi if dist in ft)
   *   2  18    6.871847674e10     262,144 (49.64 mi if dist in ft)
   *   2  20    1.099511628e12   1,048,576
   *
   * Doubling the dim and halving the maxDepth
   * - yields same max locations and location/side, while
   * - halving recursive depth searches for any specific location
   * - doubling data structure size for each Qmap
   * Dim Dep Maximum Locations    Loc/Side
   *   4   4            65,536
   *   4   5         1,048,576        1024
   *   4   6        16,777,216        4096
   *   4   8     4,294,967,296      65,536 (12.41 mi if dist in ft)
   *   4   9    6.871847674e10     262,144 (49.64 mi if dist in ft)
   *   8   5     1,073,741,824      32,768
   *   8   6    6.871847674e10     262,144 (49.64 mi if dist in ft)
   *  16   4     4,294,967,296      65,536 (12.41 mi if dist in ft)
   *
   * @param {number} dist Physical distance between adjacent locations
   * @param {integer} maxDepth Maximum recursion depth
   * @param {integer} dim Number of sub-Qmaps in the x and y dimension [default = 2]
   */
  constructor (dim = 2, maxDepth = 16) {
    this._dim = dim
    this._maxDepth = maxDepth
    this._rmap = new Rtile(dim)
    this._msg = ''
    this._log = false
  }

  // ----------------------------------------------
  // Logging
  // -----------------------------------------------
  clearLog () { this._msg = '' }

  log (msg) {
    if (this._log) {
      this._msg += msg + '\n'
    }
  }

  pauseLog () { this._log = false }

  resumeLog () { this._log = true }

  showLog () { console.log(this._msg) }

  startLog () {
    this._msg = ''
    this._log = true
  }

  // ----------------------------------------------
  // Setting location to burned
  // -----------------------------------------------
  setLocation (x, y) {
    this.log(`setLocation(${x}, ${y}) ...`)
    this.setLocationRecurse(x, y, 0, this._rmap, x, y)
  }

  /**
   *
   * @param {integer} x X location offset within rmap
   * @param {integer} y Y location offset within rmap
   * @param {integer} depth rmap depth (0 = top-level)
   * @param {Rtile} rmap Rtile at depth
   * @param {integer} x0 X location offset at depth 0
   * @param {integer} y0 Y location offset at depth 0
   * @returns {integer}
   */
  setLocationRecurse (x, y, depth, rmap, x0, y0) {
    this.log(`Level ${depth}:`) //  Rtile = [${rmap[0]}|${rmap[1]}|${rmap[2]}|${rmap[3]}]`)
    let close = 0
    // Otherwise determine which submap contains x, y
    // nd is the number of locations per sub-map at the current level
    // If dim=2 and maxDepth=16, there are 2**16 = 65,536 locations in each dim, so
    //          Tile Locs / Side
    // Level   Dim Cells/Sub-map  Population (dim^2)
    // 0     32768 2**15 (16-1-0) 1,073,741,824
    // 1     16384 2**14 (16-1-1)   268,435,456
    // 2      8192 2**13 (16-1-2)    67,108,864
    // 3      4096 2**12 (16-1-3)    16,777,216
    // 4      2048 2**11 (16-1-4)     4,194,304
    // 5      1024 2**10 (16-1-5)     1,048,576
    // 6       512 2**9 (16-1-6)        262,144
    // 7       256 2**8 (16-1-7)         65,536
    // 8       128 2**7 (16-1-8)         16,384
    // 9        64 2**6 (16-1-9)          4,096
    // 10       32 2**5 (16-1-10)         1,024
    // 11       16 2**4 (16-1-11)           256
    // 12        8 2**3                      64
    // 13        4 2**2                      16
    // 14        2 2**1                       4
    // 15        1                            1
    const nd = this._dim ** (this._maxDepth - depth - 1) // sub-map x- and y-dimensions
    const xid = Math.trunc(x / nd) // x (col) index of sub-map containing x
    const yid = Math.trunc(y / nd) // y (row) index of sub-map containing y
    const rid = xid + this._dim * yid // linear index of sub-map containing x, y
    this.log(`Level ${depth}: which sub-map contains (${x}, ${y})? xid=(${x}/${nd})=${xid} yid=(${y}/${nd})=${yid} rid=${rid}`)

    // If we are at the maximum depth
    if (depth === this._maxDepth - 1) {
      // By visiting this location, we can close it
      this.log(`Level ${depth}: x=${x} y=${y} : FOUND x0=${x0} y0=${y0}, so close sub-map rmap[${rid}] by setting it to 1`)
      rmap[rid] = 1
      close = 1
    } else {
      // Ensure there is a sub-map for this location at this level
      if (rmap[rid] === 0) { // No sub-map has been required yet for this pathway
        this.log(`Level ${depth}: sub-map rmap[${rid}]===${rmap[rid]}, so creating a sub-map for rmap[${rid}]...`)
        rmap[rid] = new Rtile(this._dim)
      } else {
        this.log(`Level ${depth}: sub-map rmap[${rid}] already exists...`)
      }

      // If the sub-map containing this location is already closed
      if (rmap[rid] === 1) {
        this.log(`Level ${depth}: sub-map rmap[${rid}]===${rmap[rid]}, is already closed, return 0`)
        return 0 // inform container NOT to close this sub-map
      }

      // Otherwise, update location relative to sub-map and recurse
      const xr = x - xid * nd
      const yr = y - yid * nd
      this.log(`Level ${depth}: location coords in sub-map rmap[${rid}] are xr=${xr} yr=${yr} : recursing ...`)
      close = this.setLocationRecurse(xr, yr, depth + 1, rmap[rid], x0, y0)
      // Should this sub-map be closed?
      if (close) {
        this.log(`Level ${depth}: recursion returned ${close}, so close sub-map rmap[${rid}] by setting it to 1`)
        rmap[rid] = 1 // reference to the Rtile is now dereferenced
      }
    }
    let sig = ''
    let allClosed = true
    for (let i = 0; i < rmap.length; i++) {
      // \ToDO - if (rmap[i] !== 1) return 0 // not all sub-maps are closed
      if (rmap[i] === 1) {
        sig += 'C'
      } else if (rmap[i] === 0) {
        sig += '0'; allClosed = false
      } else { sig += 'A'; allClosed = false }
    }
    if (!allClosed) {
      this.log(`Level ${depth}: signature '${sig}' has unclosed sub-maps, return 0`)
      return 0 // inform container NOT to close this sub-map
    }
    // All sub-maps are now closed, so close this sub-map as well
    this.log(`Level ${depth}: signature '${sig}' sub-maps are all closed, return TRUE to close this map`)
    return 1 // inform container to close this sub-map
  }

  tally () {
    this._tally = []
    for (let idx = 0; idx <= this._maxDepth; idx++) {
      const nd = this._dim ** (this._maxDepth - idx - 1) // sub-map x- and y-dimensions
      const pop = nd * nd
      this._tally.push({ pop: pop, unused: 0, closed: 0, active: 0 })
    }
    this.tallyRecurse(0, this._rmap)
    return this.tallyShow()
  }

  tallyRecurse (depth, rmap) {
    if (depth === this._maxDepth) return
    const total = this._maxDepth
    const pop = this._tally[depth].pop
    const nd = this._dim * this._dim
    for (let idx = 0; idx < nd; idx++) {
      if (rmap[idx] === 1) {
        this._tally[depth].closed++
        this._tally[total].closed += pop
      } else if (rmap[idx] === 0) {
        this._tally[depth].unused++
        this._tally[total].unused += pop
      } else {
        this._tally[depth].active++
        this._tally[total].active++
        this.tallyRecurse(depth + 1, rmap[idx])
      }
    }
  }

  fmt (v, w, d = 0, c = ' ') { return v.toFixed(d).padStart(w, c) }

  tallyShow () {
    const dim = this._dim
    const cells = (dim * dim) ** this._maxDepth
    const side = dim ** this._maxDepth
    let rows = ''
    let structures = 0
    for (let depth = 0; depth < this._maxDepth; depth++) {
      const t = this._tally[depth]
      structures += (t.unused, t.closed, t.active)
      rows += `|${this.fmt(depth, 4)}${this.fmt(t.pop, 11)} |`
      rows += `${this.fmt(t.unused, 7)}${this.fmt(t.unused * t.pop, 11)} |`
      rows += `${this.fmt(t.closed, 7)}${this.fmt(t.closed * t.pop, 11)} |`
      rows += `${this.fmt(t.active, 7)}${this.fmt(0, 11)} |\n` // Active don't represent any cells
    }
    // Totals
    const t = this._tally[this._maxDepth]
    rows += `| Tot${this.fmt(t.pop, 11)} |`
    rows += `${this.fmt(t.unused, 18)} |`
    rows += `${this.fmt(t.closed, 18)} |`
    rows += `${this.fmt(t.active, 18)} |\n` // Active don't represent any cells
    // Table
    let str = `Rmap tiles contain ${dim} x ${dim} sub-tiles to a depth of ${this._maxDepth}.\n`
    str += `Top-level Rmap is therefore ${side} x ${side} cell locations\n`
    str += `and can represent up to ${cells} cells.\n`
    str += `There are currently ${structures} data structues in use for ${t.closed} visited cells.\n`
    str += '| --- ---------- | ------ ---------- | ------ ---------- | ------ ---------- |\n'
    str += '| Cells/ Sub-Map | Unused Structures | Closed Structures | Active Structures |\n'
    str += '| Dep Cells/Quad | Number Represents | Number Represents | Number Represents |\n'
    str += '| --- ---------- | ------ ---------- | ------ ---------- | ------ ---------- |\n'
    str += rows
    str += '| --- ---------- | ------ ---------- | ------ ---------- | ------ ---------- |\n'
    return str
  }
}
