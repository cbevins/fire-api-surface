import { Rmap } from './index.js'

test('1 Rmap()', () => {
  const rmap = new Rmap()
  expect(rmap._dim).toEqual(2)
  expect(rmap._maxDepth).toEqual(16)
  expect(rmap._rmap).toEqual([0, 0, 0, 0])
  // rmap.startLog()
  rmap.setLocation(50000, 40002)
  rmap.setLocation(50000, 40003)
  rmap.setLocation(50001, 40002)
  rmap.setLocation(50001, 40003)
  // rmap.showLog()
  console.log(rmap.tally())
})

test('2 Rmap(dim=8, depth=6)', () => {
  const rmap = new Rmap(8, 6)
  expect(rmap._dim).toEqual(8)
  expect(rmap._maxDepth).toEqual(6)
  // rmap.startLog()
  rmap.setLocation(50000, 40002)
  // rmap.showLog()
  console.log(rmap.tally())
})
