/**
 * @file SimpleSurfaceFire.js
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
import { Sim } from '@cbevins/fire-behavior-simulator'

export class SimpleSurfaceFire {
  constructor () {
    // Step 1 - create a fire behavior simulator with 1 directed acyclical graph (DAG)
    this.sim = new Sim('SimpleSurfaceFire')
    this.dag = this.sim.getDag('SimpleSurfaceFire')

    // Step 2 - configure input choices and computational options
    this.dag.configure([
      // The primary fuel is specified by a fuel model catalog key
      ['configure.fuel.primary', 'catalog'],
      // There is no secondary fuel model
      ['configure.fuel.secondary', 'none'],
      // Fuel moistures are entered for 1-h, 10-h, and 100-h dead and live herbs and stems
      ['configure.fuel.moisture', 'individual'],
      // Cured herb fraction is estimated from herb moisture (rather than directly input)
      ['configure.fuel.curedHerbFraction', 'estimated'],
      // Wind speed is at midflame height
      ['configure.wind.speed', 'atMidflame'],
      // Wind direction is heading direction clockwise from upslope
      ['configure.wind.direction', 'headingFromUpslope'],
      // Slope steepness is the ratio of vertical rise / horizontal reach
      ['configure.slope.steepness', 'ratio']
    ])

    // Step 3 - specify the fire behavior variables to be produced
    // (See ./docs/Variables.md for complete list of 1200+ names)
    const selected = [
      'surface.primary.fuel.model.behave.parms.cured.herb.fraction', // ratio
      'surface.primary.fuel.fire.effectiveWindSpeed', // ft/min
      'surface.primary.fuel.fire.flameResidenceTime', // min
      'surface.primary.fuel.fire.heading.fromUpslope', // degrees
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
    this.dag.select(selected)

    // Step 4 - request and display the required inputs
    // console.log('Required inputs are:', this.dag.requiredInputNodes().map(node => node.key()))
  }

  run (surface) {
    this.dag.input([
      ['surface.primary.fuel.model.catalogKey', [surface.fuel.model]],
      ['site.moisture.dead.tl1h', [0.01 * surface.moisture.dead.tl1h]],
      ['site.moisture.dead.tl10h', [0.01 * surface.moisture.dead.tl10h]],
      ['site.moisture.dead.tl100h', [0.01 * surface.moisture.dead.tl100h]],
      ['site.moisture.live.herb', [0.01 * surface.moisture.live.herb]],
      ['site.moisture.live.stem', [0.01 * surface.moisture.live.stem]],
      ['site.slope.steepness.ratio', [0.01 * surface.slope.steepness.ratio]],
      ['site.wind.speed.atMidflame', [88 * surface.wind.speed.atMidflame]],
      ['site.wind.direction.heading.fromUpslope', [surface.wind.direction.headingFromUpslope]],
      ['site.temperature.air', [surface.temperature.air]],
      ['site.fire.time.sinceIgnition', [surface.time.sinceIgnition]]
    ])
    this.dag.run()

    const result = {
      fire: {
        effectiveWindSpeed: this.dag.node('surface.primary.fuel.fire.effectiveWindSpeed').value(), // ft/min
        flameResidenceTime: this.dag.node('surface.primary.fuel.fire.flameResidenceTime').value(), // min
        headingFromUpslope: this.dag.node('surface.primary.fuel.fire.heading.fromUpslope').value(), // degrees
        heatPerUnitArea: this.dag.node('surface.primary.fuel.fire.heatPerUnitArea').value(), // btu/ft2
        reactionIntensity: this.dag.node('surface.primary.fuel.fire.reactionIntensity').value() // btu/ft2/min
      },
      fuel: {
        curedHerb: this.dag.node('surface.primary.fuel.model.behave.parms.cured.herb.fraction').value()
      },
      ellipse: {
        area: this.dag.node('surface.fire.ellipse.size.area').value(), // ft2
        length: this.dag.node('surface.fire.ellipse.size.length').value(), // ft
        lengthToWidthRatio: this.dag.node('surface.fire.ellipse.axis.lengthToWidthRatio').value(), // ratio
        perimeter: this.dag.node('surface.fire.ellipse.size.perimeter').value(), // ft
        width: this.dag.node('surface.fire.ellipse.size.width').value(), // ft
        backing: {
          firelineIntensity: this.dag.node('surface.fire.ellipse.back.firelineIntensity').value(), // Btu/ft/s
          flameLength: this.dag.node('surface.fire.ellipse.back.flameLength').value(), // ft
          scorchHeight: this.dag.node('surface.fire.ellipse.back.scorchHeight').value(), // ft
          spreadDistance: this.dag.node('surface.fire.ellipse.back.spreadDistance').value(), // ft
          spreadRate: this.dag.node('surface.fire.ellipse.back.spreadRate').value() // ft/min
        },
        flanking: {
          firelineIntensity: this.dag.node('surface.fire.ellipse.flank.firelineIntensity').value(),
          flameLength: this.dag.node('surface.fire.ellipse.flank.flameLength').value(), // ft
          scorchHeight: this.dag.node('surface.fire.ellipse.flank.scorchHeight').value(), // ft
          spreadDistance: this.dag.node('surface.fire.ellipse.flank.spreadDistance').value(), // ft
          spreadRate: this.dag.node('surface.fire.ellipse.flank.spreadRate').value() // ft/min
        },
        heading: {
          firelineIntensity: this.dag.node('surface.fire.ellipse.head.firelineIntensity').value(),
          flameElngth: this.dag.node('surface.fire.ellipse.head.flameLength').value(),
          scorchHeight: this.dag.node('surface.fire.ellipse.head.scorchHeight').value(),
          spreadFistance: this.dag.node('surface.fire.ellipse.head.spreadDistance').value(),
          spreadRate: this.dag.node('surface.fire.ellipse.head.spreadRate').value()
        }
      }
    }
    return result
  }
}
