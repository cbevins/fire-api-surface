import { MeshFeature } from './MeshFeature.js'

test('1: MeshFeature constructor and accessors', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10)
  expect(f.left()).toEqual(1000)
  expect(f.right()).toEqual(2000)
  expect(f.top()).toEqual(5000)
  expect(f.bottom()).toEqual(4000)
  expect(f.spacing()).toEqual(10)
  expect(f.hlines()).toHaveLength(101)
})

test('2: MeshFeature.idxAt(), lineAt()', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10, 0)
  expect(f.idxAt(9999)).toEqual(0)
  expect(f.lineAt(9999).pos()).toEqual(5000)

  expect(f.idxAt(5000)).toEqual(0)
  expect(f.lineAt(5000).pos()).toEqual(5000)

  expect(f.idxAt(4000)).toEqual(100)
  expect(f.lineAt(4000).pos()).toEqual(4000)

  expect(f.idxAt(-4000)).toEqual(100)
  expect(f.lineAt(-4000).pos()).toEqual(4000)
})

test('3: MeshFeature.valueAt()', () => {
  const f = new MeshFeature(1000, 2000, 5000, 4000, 10, -1234)
  const line = f.lineAt(4500)
  for (let i = 0; i < f.hlines().length; i++) {
    const begins = f.left() + i * f.spacing()
    const ends = begins + f.spacing()
    line.appendSegment(begins, ends, i)
  }
  expect(f.lineAt(4500).segments()).toHaveLength(101)
  expect(line.segments()).toHaveLength(101)
  expect(line.segment(0).value()).toEqual(0)
  expect(line.segment(50)).toEqual({ _begins: 1500, _ends: 1510, _value: 50 })
  expect(line.valueAt(1505)).toEqual(50)

  expect(f.value(-999, 4500)).toBeUndefined()
  expect(f.value(1505, 4500)).toEqual(50)
  expect(f.value(9999, 4500)).toBeUndefined()

  expect(f.boundValue(-999, 4500)).toEqual(-1234)
  expect(f.boundValue(1505, 4500)).toEqual(50)
  expect(f.boundValue(9999, 4500)).toEqual(-1234)
})
