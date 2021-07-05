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
