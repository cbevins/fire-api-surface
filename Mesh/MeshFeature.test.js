import { MeshFeature } from './Mesh.js'

test('1: MeshFeature constructor()', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10)
  expect(f.left()).toEqual(1000)
  expect(f.right()).toEqual(2000)
  expect(f.top()).toEqual(5000)
  expect(f.bottom()).toEqual(4000)
  expect(f.spacing()).toEqual(10)

  expect(f.harray().posStart()).toEqual(5000)
  expect(f.harray().posStop()).toEqual(4000)
  expect(f.harray().posStep()).toEqual(-10)
  expect(f.harray().lines()).toHaveLength(101)

  expect(f.varray().posStart()).toEqual(1000)
  expect(f.varray().posStop()).toEqual(2000)
  expect(f.varray().posStep()).toEqual(10)
  expect(f.varray().lines()).toHaveLength(101)
})

test('2: MeshFeature colAtX(), rowAtY(), valueAtX(), valueAtY()', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10)
  expect(f.colAtX(0)).toEqual(0)
  expect(f.colAtX(1000)).toEqual(0)
  expect(f.colAtX(2000)).toEqual(100)
  expect(f.colAtX(3000)).toEqual(100)

  expect(f.rowAtY(9999)).toEqual(0)
  expect(f.rowAtY(5000)).toEqual(0)
  expect(f.rowAtY(4000)).toEqual(100)
  expect(f.rowAtY(-4000)).toEqual(100)
})

test('3: MeshFeature.valueAtX()', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10)
  const src = f.varray().lineAtPos(1500)
  expect(f.varray().idxAtPos(1500)).toEqual(50)
  src.appendSegment(500, 1)
  src.appendSegment(1000, 2)
  src.appendSegment(1500, 3)
  src.appendSegment(2000, 4)
  expect(src.segments()).toHaveLength(4)

  // Duplicate MeshLine
  const dst = src.overlay(1250, 1750, 'overlay')
  expect(dst.segments()).toHaveLength(5)
  expect(dst.segment(0)).toEqual({ _starts: 500, _value: 1 })
  expect(dst.segment(1)).toEqual({ _starts: 1000, _value: 2 })
  expect(dst.segment(2)).toEqual({ _starts: 1250, _value: 'overlay' })
  expect(dst.segment(3)).toEqual({ _starts: 1750, _value: 3 })
  expect(dst.segment(4)).toEqual({ _starts: 2000, _value: 4 })

  expect(dst.valueAtDistance(0)).toEqual(1)
  expect(dst.valueAtDistance(500)).toEqual(1)
  expect(dst.valueAtDistance(999)).toEqual(1)
  expect(dst.valueAtDistance(1000)).toEqual(2)
  expect(dst.valueAtDistance(1249)).toEqual(2)
  expect(dst.valueAtDistance(1250)).toEqual('overlay')
  expect(dst.valueAtDistance(1749)).toEqual('overlay')
  expect(dst.valueAtDistance(1750)).toEqual(3)
  expect(dst.valueAtDistance(1999)).toEqual(3)
  expect(dst.valueAtDistance(2000)).toEqual(4)
  expect(dst.valueAtDistance(9999)).toEqual(4)

  // Store overlaid MeshLine back into the original MeshArray
  f.varray().setMeshLine(50, src.overlay(1250, 1750, 'overlay'))
  expect(f.valueAtX(1500, 0)).toEqual(1)
  expect(f.valueAtX(1500, 500)).toEqual(1)
  expect(f.valueAtX(1500, 999)).toEqual(1)
  expect(f.valueAtX(1500, 1000)).toEqual(2)
  expect(f.valueAtX(1500, 1249)).toEqual(2)
  expect(f.valueAtX(1500, 1250)).toEqual('overlay')
  expect(f.valueAtX(1500, 1749)).toEqual('overlay')
  expect(f.valueAtX(1500, 1750)).toEqual(3)
  expect(f.valueAtX(1500, 1999)).toEqual(3)
  expect(f.valueAtX(1500, 2000)).toEqual(4)
  expect(f.valueAtX(1500, 9999)).toEqual(4)

  // Store overlaid MeshLine back into the original MeshArray
  f.varray().setMeshLineAtPos(1500, src.overlay(1250, 1750, 'overlay'))
  expect(f.valueAtX(1500, 0)).toEqual(1)
  expect(f.valueAtX(1500, 500)).toEqual(1)
  expect(f.valueAtX(1500, 999)).toEqual(1)
  expect(f.valueAtX(1500, 1000)).toEqual(2)
  expect(f.valueAtX(1500, 1249)).toEqual(2)
  expect(f.valueAtX(1500, 1250)).toEqual('overlay')
  expect(f.valueAtX(1500, 1749)).toEqual('overlay')
  expect(f.valueAtX(1500, 1750)).toEqual(3)
  expect(f.valueAtX(1500, 1999)).toEqual(3)
  expect(f.valueAtX(1500, 2000)).toEqual(4)
  expect(f.valueAtX(1500, 9999)).toEqual(4)
})

test('3: MeshFeature.valueAtY()', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10)
  const src = f.varray().lineAtPos(1500)
  expect(f.harray().idxAtPos(4750)).toEqual(25)
  src.appendSegment(500, 1)
  src.appendSegment(1000, 2)
  src.appendSegment(1500, 3)
  src.appendSegment(2000, 4)
  expect(src.segments()).toHaveLength(4)

  // Duplicate MeshLine
  const dst = src.overlay(1250, 1750, 'overlay')
  expect(dst.segments()).toHaveLength(5)
  expect(dst.segment(0)).toEqual({ _starts: 500, _value: 1 })
  expect(dst.segment(1)).toEqual({ _starts: 1000, _value: 2 })
  expect(dst.segment(2)).toEqual({ _starts: 1250, _value: 'overlay' })
  expect(dst.segment(3)).toEqual({ _starts: 1750, _value: 3 })
  expect(dst.segment(4)).toEqual({ _starts: 2000, _value: 4 })

  expect(dst.valueAtDistance(0)).toEqual(1)
  expect(dst.valueAtDistance(500)).toEqual(1)
  expect(dst.valueAtDistance(999)).toEqual(1)
  expect(dst.valueAtDistance(1000)).toEqual(2)
  expect(dst.valueAtDistance(1249)).toEqual(2)
  expect(dst.valueAtDistance(1250)).toEqual('overlay')
  expect(dst.valueAtDistance(1749)).toEqual('overlay')
  expect(dst.valueAtDistance(1750)).toEqual(3)
  expect(dst.valueAtDistance(1999)).toEqual(3)
  expect(dst.valueAtDistance(2000)).toEqual(4)
  expect(dst.valueAtDistance(9999)).toEqual(4)

  // Store overlaid MeshLine back into the original MeshArray
  f.harray().setMeshLine(25, src.overlay(1250, 1750, 'overlay'))
  expect(f.valueAtY(4750, 0)).toEqual(1)
  expect(f.valueAtY(4750, 500)).toEqual(1)
  expect(f.valueAtY(4750, 999)).toEqual(1)
  expect(f.valueAtY(4750, 1000)).toEqual(2)
  expect(f.valueAtY(4750, 1249)).toEqual(2)
  expect(f.valueAtY(4750, 1250)).toEqual('overlay')
  expect(f.valueAtY(4750, 1749)).toEqual('overlay')
  expect(f.valueAtY(4750, 1750)).toEqual(3)
  expect(f.valueAtY(4750, 1999)).toEqual(3)
  expect(f.valueAtY(4750, 2000)).toEqual(4)
  expect(f.valueAtY(4750, 9999)).toEqual(4)

  // Store overlaid MeshLine back into the original MeshArray
  f.harray().setMeshLineAtPos(4750, src.overlay(1250, 1750, 'overlay'))
  expect(f.valueAtY(4750, 0)).toEqual(1)
  expect(f.valueAtY(4750, 500)).toEqual(1)
  expect(f.valueAtY(4750, 999)).toEqual(1)
  expect(f.valueAtY(4750, 1000)).toEqual(2)
  expect(f.valueAtY(4750, 1249)).toEqual(2)
  expect(f.valueAtY(4750, 1250)).toEqual('overlay')
  expect(f.valueAtY(4750, 1749)).toEqual('overlay')
  expect(f.valueAtY(4750, 1750)).toEqual(3)
  expect(f.valueAtY(4750, 1999)).toEqual(3)
  expect(f.valueAtY(4750, 2000)).toEqual(4)
  expect(f.valueAtY(4750, 9999)).toEqual(4)
})