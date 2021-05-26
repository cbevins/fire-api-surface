// Generates fuel model properties
import { Sim } from '@cbevins/fire-behavior-simulator'

const bed = 'surface.primary.fuel.bed.'
const dead = 'surface.primary.fuel.bed.dead.'
const live = 'surface.primary.fuel.bed.live.'
const fire = 'surface.primary.fuel.fire.'

export class FuelModelProps {
  constructor () {
    this.sim = new Sim()
    this.dag = this.sim.createDag('FireForecast')
    this.dag.configure([
      ['configure.fuel.primary', 'catalog'], // The primary fuel is specified by a fuel model catalog key
      ['configure.fuel.secondary', 'none'], // There are no secondary fuels
      ['configure.fuel.moisture', 'individual'],
      ['configure.fuel.curedHerbFraction', 'input'],
      ['configure.wind.speed', 'atMidflame'],
      ['configure.wind.direction', 'upslope'],
      ['configure.slope.steepness', 'ratio'],
      ['configure.fuel.windSpeedAdjustmentFactor', 'input'],
      ['configure.fire.vector', 'fromHead'],
      ['configure.temperature.humidity', 'humidity'], // enter dry bulb and humidity
      ['configure.fuel.chaparralTotalLoad', 'input'], // unimportant
      ['configure.fire.weightingMethod', 'arithmetic'], // unimportant
      ['configure.fire.effectiveWindSpeedLimit', 'ignored'],
      ['configure.fire.firelineIntensity', 'flameLength'],
      ['configure.fire.lengthToWidthRatio', 'lengthToWidthRatio']
    ])

    this.dag.select([
      bed + 'depth',
      bed + 'bulkDensity',
      bed + 'packingRatio',
      dead + 'extinction.moistureContent',
      dead + 'ovendryLoad',
      dead + 'net.ovendryLoad',
      dead + 'mineralDamping',
      dead + 'moistureContent',
      dead + 'particle.class1.surfaceArea.weightingFactor',
      dead + 'particle.class1.moistureContent',
      dead + 'particle.class2.moistureContent',
      dead + 'particle.class2.surfaceArea.weightingFactor',
      dead + 'particle.class3.moistureContent',
      dead + 'particle.class3.surfaceArea.weightingFactor',
      dead + 'particle.class4.surfaceArea.weightingFactor',
      dead + 'particle.class4.moistureContent',
      dead + 'moistureDamping',
      dead + 'reactionIntensity',
      live + 'ovendryLoad',
      live + 'net.ovendryLoad',
      live + 'mineralDamping',
      live + 'moistureContent',
      live + 'moistureDamping',
      live + 'reactionIntensity',
      fire + 'spreadRate',
      fire + 'flameLength',
      fire + 'heatPerUnitArea',
      fire + 'reactionIntensity'
    ])
  }

  /**
   * Display the required input nodes
   */
  showInputs () {
    const requiredInputs = this.dag.requiredInputNodes() // returns an array of DagNode references
    console.log('REQUIRED INPUTS:')
    requiredInputs.forEach(node => { console.log(node.key()) })
  }

  run (inp) {
    this.dag.input([
      ['surface.primary.fuel.model.catalogKey', [inp.fuel]],
      ['surface.primary.fuel.model.behave.parms.cured.herb.fraction', [inp.cured]], // fraction
      ['site.moisture.dead.tl1h', [inp.tl1h]], // fraction of fuel ovendry weight
      ['site.moisture.dead.tl10h', [inp.tl10h]], // fraction of fuel ovendry weight
      ['site.moisture.dead.tl100h', [inp.tl100h]], // fraction of fuel ovendry weight
      ['site.moisture.live.herb', [inp.liveHerb]], // fraction of fuel ovendry weight
      ['site.moisture.live.stem', [inp.liveStem]], // fraction of fuel ovendry weight
      ['site.slope.steepness.ratio', [inp.slope]], // vertical rise / horizontal reach
      ['site.wind.speed.atMidflame', [inp.windMidflame]], // feet per minute (1 mph = 88 ft/min)
      ['site.fire.time.sinceIgnition', [inp.elapsed]] // minutes
    ]).run()

    return {
      fuel: this.dag.node('surface.primary.fuel.model.catalogKey').value(),
      depth: this.dag.node(bed + 'depth').value(),
      bulk: this.dag.node(bed + 'bulkDensity').value(),
      beta: this.dag.node(bed + 'packingRatio').value(),
      mext: this.dag.node(dead + 'extinction.moistureContent').value(),
      deadLoad: this.dag.node(dead + 'ovendryLoad').value(),
      deadNet: this.dag.node(dead + 'net.ovendryLoad').value(),
      // deadEtaS: this.dag.node(dead + 'mineralDamping').value(),
      // deadSawf1: this.dag.node(dead + 'particle.class1.surfaceArea.weightingFactor').value(),
      // deadMois1: this.dag.node(dead + 'particle.class1.moistureContent').value(),
      // deadSawf2: this.dag.node(dead + 'particle.class2.surfaceArea.weightingFactor').value(),
      // deadMois2: this.dag.node(dead + 'particle.class2.moistureContent').value(),
      // deadSawf3: this.dag.node(dead + 'particle.class3.surfaceArea.weightingFactor').value(),
      // deadMois3: this.dag.node(dead + 'particle.class3.moistureContent').value(),
      // deadSawf4: this.dag.node(dead + 'particle.class4.surfaceArea.weightingFactor').value(),
      // deadMois4: this.dag.node(dead + 'particle.class4.moistureContent').value(),
      // deadMois: this.dag.node(dead + 'moistureContent').value(),
      // deadEtaM: this.dag.node(dead + 'moistureDamping').value(),
      // deadRxi: this.dag.node(dead + 'reactionIntensity').value(),
      liveLoad: this.dag.node(live + 'ovendryLoad').value(),
      liveNet: this.dag.node(live + 'net.ovendryLoad').value(),
      // liveEtaS: this.dag.node(live + 'mineralDamping').value(),
      // liveMois: this.dag.node(live + 'moistureContent').value(),
      // liveEtaM: this.dag.node(live + 'moistureDamping').value(),
      // liveRxi: this.dag.node(live + 'reactionIntensity').value(),
      ros: this.dag.node(fire + 'spreadRate').value(),
      flame: this.dag.node(fire + 'flameLength').value(),
      hpua: this.dag.node(fire + 'heatPerUnitArea').value()
    }
  }
}

const fmp = new FuelModelProps()
fmp.showInputs()

const fuels = [
  'gr1', 'gr2', 'gr3', 'gr4', 'gr5', 'gr6', 'gr7', 'gr8', 'gr9',
  'gs1', 'gs2', 'gs3', 'gs4',
  'sh1', 'sh2', 'sh3', 'sh4', 'sh5', 'sh6', 'sh7', 'sh8', 'sh9',
  'tu1', 'tu2', 'tu3', 'tu4', 'tu5',
  'tl1', 'tl2', 'tl3', 'tl4', 'tl5', 'tl6', 'tl7', 'tl8', 'tl9',
  'sb1', 'sb2', 'sb3', 'sb4'
]

// Scott & Burgan inputs
const inputs = {
  fuel: 'gs1',
  cured: 0, // use 0 to get total herb weights, use 0.5 to get fire behavior
  tl1h: 0.06,
  tl10h: 0.07,
  tl100h: 0.08,
  liveHerb: 0.6,
  liveStem: 0.9,
  windMidflame: 88 * 5,
  WindHeading: 0,
  slope: 0,
  elapsed: 60
}
const seriesMap = new Map([['gr', 0], ['gs', 1], ['sh', 2], ['tu', 3], ['tl', 4], ['sb', 5]])
function run () {
  fuels.forEach(fuel => {
    inputs.fuel = fuel
    // Run first with 0% cured
    inputs.cured = 0
    const a = fmp.run(inputs)
    // Run again with 67% cured
    inputs.cured = 2 / 3
    const b = fmp.run(inputs)
    a.ros2 = b.ros
    a.flame2 = b.flame
    a.hpua2 = b.hpua
    //
    const seriesKey = fuel.substr(0, 2)
    const p0 = seriesMap.get(seriesKey)
    const p1 = fuel.substr(2, 1) - 1
    a.pos = [p0, p1]
    console.log(a, ',')
  })
}

run()
