import { Sim } from './fire-behavior-simulator.js'

export class FireBehaviorProvider {
  constructor () {
    const sim = new Sim()
    const dag = sim.createDag('FireGrid')
    dag.select([
      dag.node('surface.fire.ellipse.axis.lengthToWidthRatio'),
      dag.node('surface.fire.ellipse.back.spreadRate'),
      dag.node('surface.fire.ellipse.head.spreadRate'),
      dag.node('surface.fire.ellipse.heading.fromNorth'),
      dag.node('surface.fire.ellipse.flank.spreadRate')
    ])
    dag.configure([
      ['configure.fuel.primary', 'catalog'],
      ['configure.fuel.secondary', 'none'],
      ['configure.fuel.moisture', 'individual'],
      ['configure.fuel.curedHerbFraction', 'input'],
      ['configure.wind.speed', 'atMidflame'],
      ['configure.wind.direction', 'sourceFromNorth'],
      ['configure.slope.steepness', 'ratio']
    ])
    this._cache = new Map()
    this._dag = dag
  }

  makeKey (input) {
    let key = `${input.fuelModel}|${input.curedHerb.toFixed(3)}|`
    key += `${input.dead1.toFixed(2)}|${input.dead10.toFixed(2)}|${input.dead100.toFixed(2)}|`
    key += `${input.liveHerb.toFixed(2)}|${input.liveStem.toFixed(2)}|`
    key += `${input.slope.toFixed(2)}|${input.aspect.toFixed(0)}|`
    key += `${input.windFrom.toFixed(0)}|${input.windSpeed.toFixed(0)}`
    return key
  }

  // Black box that returns required fire behavior at some point at some time
  fireBehavior (input) {
    const key = this.makeKey(input)
    if (this._cache.has(key)) {
      return this._cache.get(key)
    }
    this._dag.input([
      ['surface.primary.fuel.model.catalogKey', [input.fuelModel]],
      ['surface.primary.fuel.model.behave.parms.cured.herb.fraction', [input.curedHerb]],
      ['site.moisture.dead.tl1h', [input.dead1]],
      ['site.moisture.dead.tl10h', [input.dead10]],
      ['site.moisture.dead.tl100h', [input.dead100]],
      ['site.moisture.live.herb', [input.liveHerb]],
      ['site.moisture.live.stem', [input.liveStem]],
      ['site.slope.direction.aspect', [input.aspect]],
      ['site.slope.steepness.ratio', [input.slope]],
      ['site.wind.direction.source.fromNorth', [input.windFrom]],
      ['site.wind.speed.atMidflame', [input.windSpeed]]
    ]).run()

    const fire = {
      key: key,
      lwr: this._dag.node('surface.fire.ellipse.axis.lengthToWidthRatio').value(),
      backRos: this._dag.node('surface.fire.ellipse.back.spreadRate').value(),
      flankRos: this._dag.node('surface.fire.ellipse.flank.spreadRate').value(),
      headRos: this._dag.node('surface.fire.ellipse.head.spreadRate').value(),
      heading: this._dag.node('surface.fire.ellipse.heading.fromNorth').value()
    }
    this._cache.set(key, fire)
    return fire
  }
}
