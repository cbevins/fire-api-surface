import { BitGrid } from './BitGrid.js'

// Since our bit vector is stored in a single number, we simply initialize it as 0.
// const vec = buildVector(64)
test('BitGrid', () => {
  const grid = new BitGrid(1000, 1000)
  expect(grid.get(200, 700)).toEqual(1)
  expect(grid.get(500, 500)).toEqual(0)

  grid.set(200, 700)
  expect(grid.get(200, 700)).toEqual(1)
  expect(grid.get(500, 500)).toEqual(0)

  grid.clear(200, 700)
  expect(grid.get(200, 700)).toEqual(1)
  expect(grid.get(500, 500)).toEqual(0)
})
