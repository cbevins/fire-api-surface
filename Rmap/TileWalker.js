import { Tile } from './index.js'

function circleWalk (rounds) {
  const tile = new Tile(16)
  const c = Math.trunc(tile._dim / 2)
  console.log(c, ': ', (c - rounds), '-', (c + rounds))
  let i = 0
  let marked = 0
  for (let r = 0; r < rounds; r++) {
    for (let y = c - r; y <= c + r; y++) {
      for (let x = c - r; x <= c + r; x++, i++) {
        // console.log(i, r, x, y)
        if (tile.markCell(x, y) === 'marked') marked++
      }
    }
  }
  console.log(tile.tally().show())
  console.log(`rounds=${rounds}, side=${2 * rounds - 1} iterations=${i} marked=${marked} structures=${tile._tiles.size}`)
}

const start = Date.now()
circleWalk(100)
console.log(Date.now() - start, ' ms')
