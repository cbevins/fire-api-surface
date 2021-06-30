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

  makeKey () {
    let key = `${this._fuelModel}|${this._curedHerb.toFixed(3)}|`
    key += `${this._dead1.toFixed(2)}|${this._dead10.toFixed(2)}|${this._dead100.toFixed(2)}|`
    key += `${this._liveHerb.toFixed(2)}|${this._liveStem.toFixed(2)}|`
    key += `${this._slope.toFixed(2)}|${this._aspect.toFixed(0)}|`
    key += `${this._windFrom.toFixed(0)}|${this._windSpeed.toFixed(0)}`
    return key
  }

  // Black box that returns required fire behavior at some point at some time
  fireBehaviorAt (point, time) {
    this._fuelModel = this.fuelModel(point)
    this._curedHerb = this.curedHerb(point)
    this._dead1 = this.moistureDead1(point, time)
    this._dead10 = this.moistureDead10(point, time)
    this._dead100 = this.moistureDead100(point, time)
    this._liveHerb = this.moistureLiveHerb(point, time)
    this._liveStem = this.moistureLiveStem(point, time)
    this._aspect = this.aspect(point)
    this._slope = this.slope(point)
    this._windFrom = this.windFrom(point, time)
    this._windSpeed = this.windAtMidflame(point, time)
    const key = this.makeKey()
    if (this._cache.has(key)) {
      return this._cache.get(key)
    }
    this._dag.input([
      ['surface.primary.fuel.model.catalogKey', [this._fuelModel]],
      ['surface.primary.fuel.model.behave.parms.cured.herb.fraction', [this._curedHerb]],
      ['site.moisture.dead.tl1h', [this._dead1]],
      ['site.moisture.dead.tl10h', [this._dead10]],
      ['site.moisture.dead.tl100h', [this._dead100]],
      ['site.moisture.live.herb', [this._liveHerb]],
      ['site.moisture.live.stem', [this._liveStem]],
      ['site.slope.direction.aspect', [this._aspect]],
      ['site.slope.steepness.ratio', [this._slope]],
      ['site.wind.direction.source.fromNorth', [this._windFrom]],
      ['site.wind.speed.atMidflame', [this._windSpeed]]
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

  // Black box methods that return fire parameters at a specific point
  // These may be deferred to derived subclasses for each application
  aspect (point) { return 135 }
  curedHerb (point) { return 0.778 }
  fuelModel (point) { return '124' }
  slope (point) { return 0.25 }

  // Black box methods that return fire parameters at a specific point and time
  moistureDead1 (point, time) { return 0.05 }
  moistureDead10 (point, time) { return 0.07 }
  moistureDead100 (point, time) { return 0.09 }
  moistureLiveHerb (point, time) { return 0.5 }
  moistureLiveStem (point, time) { return 1.5 }
  windAtMidflame (point, time) { return 880 }
  windFrom (point, time) { return 315 }
}
