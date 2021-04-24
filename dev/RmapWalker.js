import { Rmap } from './Rmap.js'

function circleWalk (rounds) {
  const rmap = new Rmap(8, 6)
  const c = Math.trunc((rmap._dim ** (rmap._maxDepth)) / 2)
  let i = 0
  for (let r = 0; r < rounds; r++) {
    for (let y = c - r; y <= c + r; y++) {
      for (let x = c - r; x <= c + r; x++, i++) {
        rmap.setLocation(x, y)
      }
    }
  }
  console.log(i, ' iterations')
  console.log(rmap.tally())
}

const start = Date.now()
circleWalk(100)
console.log(Date.now() - start, ' ms')
