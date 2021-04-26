export class Tile {
  constructor (depth) {
    this._depth = depth
    this._dim = 2 ** this._depth // cells per side at depth 0 (top-level)
    this._tiles = new Map().set(0, { key: 0, p: null, d: 0, q: ['u', 'u', 'u', 'u'] }) // root tile
    this._keys = 1 // next tile number
  }

  addTile (depth, parentKey, qid) {
    const key = this._keys++
    this._tiles.set(key, { key: key, p: parentKey, d: depth, q: ['u', 'u', 'u', 'u'] })
    const parent = this.getTile(parentKey)
    parent.q[qid] = key
    return key
  }

  closeTile (key, qid) {
    const t = this._tiles.get(key)
    t.q[qid] = 'c'
    return 'c'
  }

  getTile (key) { return this._tiles.get(key) }

  harvestTile (tile) {
    const p = this.getTile(tile.p)
    for (let i = 0; i < 4; i++) { // Find the parent's quad containing this tile
      if (p.q[i] === tile.key) {
        p.q[i] = 'c'
        this._tiles.delete(tile.key)
        break
      }
    }
  }

  log (str) {
    // console.log(str)
  }

  markCell (x, y) {
    let str = '-----------------------------------\n'
    str += `markCell(${x}, ${y})\n`
    let qside = this._dim // number of cells per side for each sub-tile at each depth
    let qx = x
    let qy = y
    let tile = this.getTile(0) // start at the top-level tile
    let d
    for (d = 0; d < this._depth; d++) {
      // Find index [0..3] of the quad containing x, y
      qside /= 2 // number of cells per quad side at this depth
      const xid = Math.trunc(qx / qside) // x (col) index of quad containing qx [0..1]
      const yid = Math.trunc(qy / qside) // y (row) index of quad containing qy [0..1]
      const qid = xid + 2 * yid // linear index of quad containing x, y [0..3]
      let quad = tile.q[qid] // reference to quad containing qx, qy
      if (quad === 'c') { // Return if this quad is already closed
        str += `  ${d}: already closed ${x}, ${y} : tile=${this.tstring(tile)}`
        this.log(str)
        return 'closed'
      } else if (quad === 'u') { // If this quad does not yet exist
        if (d === this._depth - 1) { // If at the lowest depth (leaf-level)
          quad = this.closeTile(tile.key, qid)
          str += `${d}  MARKED ${x}, ${y}, closeTile() => ${this.tstring(tile)}\n`
          break
        } else { // create a quad
          quad = this.addTile(d + 1, tile.key, qid)
          str += `${d}  addTile ${quad} to parent ${tile.key} quad ${qid} => ${this.tstring(tile)}\n`
        }
      }
      // The selected quad becomes the next tile
      tile = this.getTile(quad)
      qx = qx - xid * qside
      qy = qy - yid * qside
    }

    // Only get here if we are visiting a cell for the first time
    // Return up the layers, closing sub-tiles when possible
    while (tile.key) {
      str += `  ${tile.d}: Examining tile ${this.tstring(tile)}\n`
      for (let qid = 0; qid < 4; qid++) {
        if (tile.q[qid] !== 'c') {
          str += `  ${tile.d}:   quad ${qid} is not closed ... no consolidation\n`
          this.log(str)
          return 'marked' // still return 'marked' since we added the leaf tile
        }
      }
      // All the tile's quads are closed, so harvest them
      str += `  ${tile.d}:   All quads are closed ... CONSOLIDATE\n`
      this.harvestTile(tile)
      tile = this.getTile(tile.p)
    }
    this.log(str)
    return 'marked'
  }

  tstring (t) { return `{key: ${t.key}, p: ${t.p}, d: ${t.d}, q: [${t.q[0]}, ${t.q[1]}, ${t.q[2]}, ${t.q[3]}]}` }

  tally () {
    this._tally = []
    let dim = this._dim
    for (let idx = 0; idx <= this._depth; idx++) {
      dim /= 2 // quad x- and y-dimensions
      const pop = dim * dim
      this._tally.push({ pop: pop, unused: 0, closed: 0, active: 0 })
    }
    const sum = this._depth
    this._tiles.forEach((tile, key) => {
      const d = tile.d
      const pop = this._tally[d].pop
      tile.q.forEach(q => {
        if (q === 'u') {
          this._tally[d].unused++
          this._tally[sum].unused += pop
        } else if (q === 'c') {
          this._tally[d].closed++
          this._tally[sum].closed += pop
        } else {
          this._tally[d].active++
          this._tally[this._depth].active += pop
        }
      })
    })
    return this
  }

  fmt (v, w, d = 0, c = ' ') { return v.toFixed(d).padStart(w, c) }

  show () {
    const side = this._dim
    const cells = side * side
    let rows = ''
    let structures = 0
    for (let depth = 0; depth < this._depth; depth++) {
      const t = this._tally[depth]
      structures += (t.unused, t.closed, t.active)
      rows += `|${this.fmt(depth, 4)}${this.fmt(t.pop, 11)} |`
      rows += `${this.fmt(t.unused, 7)}${this.fmt(t.unused * t.pop, 11)} |`
      rows += `${this.fmt(t.closed, 7)}${this.fmt(t.closed * t.pop, 11)} |`
      rows += `${this.fmt(t.active, 7)}${this.fmt(0, 11)} |\n` // Active don't represent any cells
    }
    // Totals
    const t = this._tally[this._depth]
    rows += `| Tot${this.fmt(t.pop, 11)} |`
    rows += `${this.fmt(t.unused, 18)} |`
    rows += `${this.fmt(t.closed, 18)} |`
    rows += `${this.fmt(t.active, 18)} |\n` // Active don't represent any cells
    // Table
    let str = `Map contains recursive 2 x 2 quads to a depth of ${this._depth}.\n`
    str += `Top-level tile is therefore ${side} x ${side} cell locations\n`
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
