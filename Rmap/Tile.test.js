import { Tile } from './Tile.js'

test('Tile', () => {
  const t = new Tile(16)
  expect(t instanceof Tile).toEqual(true)
  const q = t.getTile(0)
  expect(q.p).toBeNull()
  expect(q).toEqual({ key: 0, p: null, d: 0, q: ['u', 'u', 'u', 'u'] })

  // The following 4 leaf cells belong to the same quad
  expect(t.markCell(50000, 40002)).toEqual('marked')
  // expect(t.markCell(50000, 40002)).toEqual('closed')

  expect(t.markCell(50000, 40003)).toEqual('marked')
  expect(t.markCell(50001, 40002)).toEqual('marked')
  expect(t.markCell(50001, 40003)).toEqual('marked')

  console.log(t.tally().show())
  // expect(t.markCell(50001, 40003)).toEqual('closed')
})
