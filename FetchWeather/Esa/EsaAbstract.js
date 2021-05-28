import { distance } from './greatCircle.js'
import { compassDir, slopeAspect } from './slopeAspect.js'

/**
 * Represents the elevation, slope, and aspect at a single terrain point.
 *
 * const esa = new Esa<Loader>()
 * if (esa.load(lat1, lon1).ok()
 * const elev2 = esa.setPoint(lat2, lon2).load().elev
 */
export class EsaAbstract {
  /**
   * Creates an elevation-slope-aspect object for a terrain point.
   * @param {number} res Default sample resolution is 1/3 arc-second in decimal degrees
   * @param {integer} rad Default radius (number of resultion steps)
   *  Use double resolution (rad===2) to ensure adjacent cells have different elev sample pt
   */
  constructor (deg = (1 / (60 * 60 * 3)), rad = 2) {
    this._deg = deg
    this._rad = rad
    this.load(0, 0, deg, rad, false)
    // Message may be 'OK', 'Loading', 'OK', or an error message
    this._msg = 'Uninitialized'
  }

  // Public accessors ----------------------------------------------------------
  aspect () { return this._aspect }
  aspectDir () { return compassDir(this._aspect) }
  elevFt () { return 3.2808 * this._elev }
  elevM () { return this._elev }
  esa () { return [this.elevFt(), this.slopeRatio(), this.aspect()] }
  message () { return this._msg }
  ok () { return this._msg === 'OK' }
  slopeDegrees () { return this._slope }
  slopeRatio () { return Math.tan(this._slope * Math.PI / 180) }

  // Public mutators ----------------------------------------------------------

  /**
   * Calls the re-derived loadGrid() to get elevation grid samples
   * for the current lat, lon, deg, and rad, and determines slope and aspect
   * @param {number} lat Latidude of ESA terrain point
   * @param {number} lon Longitude of ESA terrain point
   * @param {number} deg Elevation sample resolution in decimal degrees
   * @param {number} rad Number of resolution steps between 3x3 sample grid cells
   * @param {bool} doLoad Always TRUE unless invoked by the constructor
   * @returns {EsaMapQuest} *this*
   */
  async load (lat, lon, deg = null, rad = null, doLoad = true) {
    this._lat = lat
    this._lon = lon
    this._deg = (deg === null) ? this._deg : deg
    this._rad = (rad === null) ? this._rad : rad
    // Sample n-s distance in decimal degrees
    this._ns = { _deg: this._deg * this._rad }
    // Sample n-s distance in meters
    this._ns._m = distance(this._lat, this._lon, this._lat + this._ns._deg, this._lon)
    // Sample e-w distance in meters
    this._ew = { _m: distance(this._lat, this._lon, this._lat, this._lon + this._ns._deg) }
    // Determine e-w decimal degrees with same distance as n-s decimal degrees at this lat
    this._ew._deg = this._ns._deg * this._ns._m / this._ew._m
    // Initialze ESA
    this._elev = 0
    this._slope = 0 // degrees
    this._aspect = 0 // degrees
    // Initialize the 3x3 grid elevaion-slope-aspect sample grid
    this._initGrid()
    // Only the constructor has doLoad===false
    if (doLoad) {
      // Attempt to load the 3x3 elevation grid
      this._msg = 'Loading'
      this._msg = await this._loadGrid(this._grid).then()
      // Calculate slope and aspect
      if (this.ok()) {
        const [elev, slopeDeg, aspect] = slopeAspect(this._grid, this._ew._m, this._ns._m)
        this._elev = elev // m
        this._slope = slopeDeg // degrees
        this._aspect = aspect // degrees
      }
    }
    // Return *this* so we can chain to isOk()
    return this
  }

  // Private ------------------------------------------------------------------

  // Initializes the 3x3 grid of *equidistant* sample points with their lat, lon
  _initGrid () {
    const elev = this._elev
    this._grid = []
    ;[-1, 0, 1].forEach(y => {
      const lat = this._lat + y * this._ns._deg
      ;[-1, 0, 1].forEach(x => {
        const lon = this._lon + x * this._ew._deg
        this._grid.push({ lat, lon, elev })
      })
    })
  }

  // Re-derived method that fills with elevation (m)
  _loadGrid (elevGrid) {
    throw new Error('Esa.loadGrid() must be reimplemented by a derived class')
  }
}
