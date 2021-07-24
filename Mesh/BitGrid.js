export class BitGrid {
  constructor (cols, rows) {
    this.cols = cols
    this.rows = rows
    this.bit = new Uint32Array(Math.ceil(cols * rows / 32))
  }

  // Set the bit at col, row
  set (col, row) {
    const i = col + row * this.cols
    const bigIndex = Math.floor(i / 32)
    const smallIndex = i % 32
    this.bit[bigIndex] = this.bit[bigIndex] | (1 << smallIndex)
  }

  // Clear the bit at col, row
  clear (col, row) {
    const i = col + row * this.cols
    const bigIndex = Math.floor(i / 32)
    const smallIndex = i % 32
    this.bit[bigIndex] = this.bit[bigIndex] & ~(1 << smallIndex)
  }

  // Return the value of the bit at col, row
  get (col, row) {
    const i = col + row * this.cols
    const bigIndex = Math.floor(i / 32)
    const smallIndex = i % 32
    const value = this.bit[bigIndex] & (1 << smallIndex)
    // we convert to boolean to make sure the result is always 0 or 1,
    // instead of what is returned by the mask
    return value != 0
  }
}

// Since our bit vector is stored in a single number, we simply initialize it as 0.
// const vec = buildVector(64)
const grid = new BitGrid(1000, 1000)

grid.set(200, 700)
console.log('Is cell [200,700] set? ' + grid.get(200, 700))
console.log('Is cell [500,500] set? ' + grid.get(500, 500))

grid.clear(200, 700)
console.log('Is cell [200,700] set? ' + grid.get(200, 700))
