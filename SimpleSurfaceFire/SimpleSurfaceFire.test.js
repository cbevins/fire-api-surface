import { SimpleSurfaceFire, SimpleSurfaceFireInput } from './index.js'

test('new SimpleSurfaceFire', () => {
  const surface = new SimpleSurfaceFire()
  expect(surface instanceof SimpleSurfaceFire).toEqual(true)

  // Get the input object and make desired changes
  const input = { ...SimpleSurfaceFireInput }
  input.wind.direction.headingFromUpslope = 90

  const result = surface.run(input)
  expect(surface.dag.node('surface.primary.fuel.model.catalogKey').value()).toEqual('10')
  expect(input.moisture.dead.tl1h).toEqual(5)
  expect(surface.dag.node('site.moisture.dead.tl1h').value()).toEqual(0.05)
  expect(surface.dag.node('site.moisture.dead.tl10h').value()).toEqual(0.07)
  expect(surface.dag.node('site.moisture.dead.tl100h').value()).toEqual(0.09)
  expect(surface.dag.node('site.moisture.live.herb').value()).toEqual(0.5)
  expect(surface.dag.node('site.moisture.live.stem').value()).toEqual(1.5)
  expect(surface.dag.node('surface.primary.fuel.fire.flameResidenceTime').value()).toEqual(0.21764611427384198)
  expect(surface.dag.node('surface.primary.fuel.fire.reactionIntensity').value()).toEqual(5794.6954002291168)
  expect(surface.dag.node('surface.primary.fuel.fire.firelineIntensity').value())
    .toBeCloseTo(389.95413667947145, 7)
  console.log(result)
})
