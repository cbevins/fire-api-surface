/**
 * Landscape provides all the fire behavior parameters at a place and time.
 */
export class AbstractLandscape {
  constructor (sceneWidth, sceneHeight) {
    this._sceneWidth = sceneWidth // scene width in common units (i.e., ft)
    this._sceneHeight = sceneHeight // scene height in common units (i.e., ft)
  }

  sceneHeight () { return this._sceneHeight }
  sceneWidth () { return this._sceneWidth }

  // These methods depend just on location
  aspect (point) { return 135 }
  curedHerb (point) { return 0.778 }
  fuelModel (point) { return '124' }
  slope (point) { return 0.25 }

  // These methods depend on location and time
  moistureDead1 (point, time) { return 0.05 }
  moistureDead10 (point, time) { return 0.07 }
  moistureDead100 (point, time) { return 0.09 }
  moistureLiveHerb (point, time) { return 0.5 }
  moistureLiveStem (point, time) { return 1.5 }
  windAtMidflame (point, time) { return 880 }
  windFrom (point, time) { return 315 }
}
