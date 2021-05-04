/**
 * @file fireBehavior.js provides the fire behavior for FireForecast
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
// Step 1: import the fire-behavior-simulator package from node_modules or source folder
import { Sim } from '@cbevins/fire-behavior-simulator'

export function fireBehavior (inp) {
  // Step 2 - create a fire behavior simulator with 1 directed acyclical graph (DAG)
  const sim = new Sim()
  const dag = sim.createDag('FireForecast')

  // Step 3 - configure input choices and computational options
  dag.configure([
    ['configure.fuel.primary', 'catalog'], // The primary fuel is specified by a fuel model catalog key
    ['configure.fuel.secondary', 'none'], // There are no secondary fuels
    ['configure.fuel.moisture', 'liveCategory'], // 3 dead moisture classes and a singe live category moisture
    ['configure.fuel.curedHerbFraction', 'input'],
    ['configure.wind.speed', 'at10m'],
    ['configure.wind.direction', 'sourceFromNorth'],
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

  // Step 4 - select the fire behavior variables (DagNodes) of interest
  // (See ./docs/Variables.md for complete list of 1200+ names)
  const selected = [
    'surface.primary.fuel.model.behave.parms.cured.herb.fraction', // ratio
    'surface.primary.fuel.fire.effectiveWindSpeed', // ft/min
    'surface.primary.fuel.fire.flameResidenceTime', // min
    'surface.primary.fuel.fire.heading.fromUpslope', // degrees
    'surface.primary.fuel.fire.heading.fromNorth', // degrees
    'surface.primary.fuel.fire.heatPerUnitArea', // btu/ft2 |
    'surface.primary.fuel.fire.reactionIntensity', // btu/ft2/min
    'surface.fire.ellipse.axis.lengthToWidthRatio', // ratio
    'surface.fire.ellipse.back.firelineIntensity', // Btu/ft/s
    'surface.fire.ellipse.back.flameLength', // ft
    'surface.fire.ellipse.back.scorchHeight', // ft
    'surface.fire.ellipse.back.spreadDistance', // ft
    'surface.fire.ellipse.back.spreadRate', // ft/min
    'surface.fire.ellipse.flank.firelineIntensity',
    'surface.fire.ellipse.flank.flameLength',
    'surface.fire.ellipse.flank.scorchHeight',
    'surface.fire.ellipse.flank.spreadDistance',
    'surface.fire.ellipse.flank.spreadRate',
    'surface.fire.ellipse.head.firelineIntensity',
    'surface.fire.ellipse.head.flameLength',
    'surface.fire.ellipse.head.scorchHeight',
    'surface.fire.ellipse.head.spreadDistance',
    'surface.fire.ellipse.head.spreadRate',
    'surface.fire.ellipse.size.area', // ft2
    'surface.fire.ellipse.size.length', // ft
    'surface.fire.ellipse.size.perimeter', // ft
    'surface.fire.ellipse.size.width' // ft
  ]
  dag.select(selected)

  // Step 5 - determine the required input variables

  // You can request an array of the configurations currently applicable to your selected variables:
  // const activeConfigs = dag.requiredConfigNodes() // returns an array of DagNode references
  // console.log('ACTIVE CONFIGS:')
  // activeConfigs.forEach(cfg => { console.log(cfg.key(), cfg.value()) })

  // You will initially need to see exactly which inputs are required
  // for your currently selected variables and configuration settings
  // const requiredInputs = dag.requiredInputNodes() // returns an array of DagNode references
  // console.log('REQUIRED INPUTS:')
  // requiredInputs.forEach(node => { console.log(node.key()) })

  // Step 6 - specify the values of the required inputs and run()
  console.log(inp)
  dag.input([
    ['surface.primary.fuel.model.catalogKey', [inp.fuel]],
    ['surface.primary.fuel.model.behave.parms.cured.herb.fraction', [inp.curedHerb]], // fraction
    ['site.moisture.dead.tl1h', [inp.tl1h]], // fraction of fuel ovendry weight
    ['site.moisture.dead.tl10h', [inp.tl10h]], // fraction of fuel ovendry weight
    ['site.moisture.dead.tl100h', [inp.tl100h]], // fraction of fuel ovendry weight
    ['site.moisture.live.category', [inp.liveMoisture]], // fraction of fuel ovendry weight
    ['site.wind.speed.at10m', [88 * inp.windAt10m]], // feet per minute (1 mph = 88 ft/min)
    ['site.windSpeedAdjustmentFactor', [inp.windAdj]], // fraction of 10m wind speed
    ['site.slope.direction.aspect', [inp.aspect]], // degrees clockwise from north
    ['site.slope.steepness.ratio', [inp.slope]], // vertical rise / horizontal reach
    ['site.wind.direction.source.fromNorth', [inp.windFrom]], // direction of wind origin, degrees clockwise from north
    ['site.temperature.air', [inp.dryBulb]], // oF
    ['site.fire.time.sinceIgnition', [inp.elapsed]] // minutes
  ]).run()

  // Step 7 - return the single result set
  const output = {
    fire: {
      effectiveWindSpeed: dag.node('surface.primary.fuel.fire.effectiveWindSpeed').value(), // ft/min
      flameResidenceTime: dag.node('surface.primary.fuel.fire.flameResidenceTime').value(), // min
      headingFromUpslope: dag.node('surface.primary.fuel.fire.heading.fromUpslope').value(), // degrees
      headingFromNorth: dag.node('surface.primary.fuel.fire.heading.fromNorth').value(), // degrees
      heatPerUnitArea: dag.node('surface.primary.fuel.fire.heatPerUnitArea').value(), // btu/ft2 |
      reactionIntensity: dag.node('surface.primary.fuel.fire.reactionIntensity').value() // btu/ft2/min
    },
    ellipse: {
      lwRatio: dag.node('surface.fire.ellipse.axis.lengthToWidthRatio').value(), // ratio
      area: dag.node('surface.fire.ellipse.size.area').value(), // ft2
      length: dag.node('surface.fire.ellipse.size.length').value(), // ft
      perimeter: dag.node('surface.fire.ellipse.size.perimeter').value(), // ft
      width: dag.node('surface.fire.ellipse.size.width').value() // ft
    },
    backing: {
      firelineIntensity: dag.node('surface.fire.ellipse.back.firelineIntensity').value(), // Btu/ft/s
      flameLength: dag.node('surface.fire.ellipse.back.flameLength').value(), // ft
      scorchHeight: dag.node('surface.fire.ellipse.back.scorchHeight').value(), // ft
      spreadDistance: dag.node('surface.fire.ellipse.back.spreadDistance').value(), // ft
      spreadRate: dag.node('surface.fire.ellipse.back.spreadRate').value() // ft/min
    },
    flanking: {
      firelineIntensity: dag.node('surface.fire.ellipse.flank.firelineIntensity').value(),
      flameLength: dag.node('surface.fire.ellipse.flank.flameLength').value(),
      scorchHeight: dag.node('surface.fire.ellipse.flank.scorchHeight').value(),
      spreadDistance: dag.node('surface.fire.ellipse.flank.spreadDistance').value(),
      spreadRate: dag.node('surface.fire.ellipse.flank.spreadRate').value()
    },
    heading: {
      firelineIntensity: dag.node('surface.fire.ellipse.head.firelineIntensity').value(),
      flameLength: dag.node('surface.fire.ellipse.head.flameLength').value(),
      scorchHeight: dag.node('surface.fire.ellipse.head.scorchHeight').value(),
      spreadDistance: dag.node('surface.fire.ellipse.head.spreadDistance').value(),
      spreadRate: dag.node('surface.fire.ellipse.head.spreadRate').value()
    }
  }
  return output
}
