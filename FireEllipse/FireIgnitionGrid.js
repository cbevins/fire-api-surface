import { FireBehaviorProvider } from './FireBehaviorProvider.js'

const UnignitedTime = 32000000
export class FireIgnitionGrid {
  constructor (cols, rows, spacing = 1, timeStep = 1) {
    this._cols = cols
    this._rows = rows
    this._spacing = spacing
    this._it = new Array(rows * cols).fill(UnignitedTime)
    this._timeStep = timeStep
    this._period = { n: 0, beg: 0, end: timeStep }
    this._provider = new FireBehaviorProvider()
  }

  // Returns the base 0 index of the grid column of point 'point'
  colOf (point) { return point % this._cols }

  // Returns the total number of FireGrid columns (e-w)
  cols () { return this._cols }

  // Returns {key, lwr, backRos, flankRos, headRos, heading, length, width}
  fireBehaviorAt (point, time) {
    const fire = this._provider.fireBehaviorAt(point, time)
    fire.length = this._timeStep * (fire.headRos + fire.backRos)
    fire.width = this._timeStep * 2 * fire.flankRos
    return fire
  }

  // Returns TRUE if the point has a scheduled ignition time
  hasIgnition (point) { return this._it[point] !== UnignitedTime }

  // Returns TRUE if the point has a scheduled ignition time before 'beforeTime'
  hasIgnitionBefore (point, beforeTime) { return this._it[point] < beforeTime }

  // Returns TRUE if the point has a scheduled ignition time before or at 'byTime'
  hasIgnitionBy (point, byTime) { return this._it[point] <= byTime }

  // Returns TRUE if the point has no scheduled ignition time
  hasNoIgnition (point) { return this._it[point] === UnignitedTime }

  // Sets the point's ignition time
  ignite (point, time) { this._it[point] = time }

  // Sets the point's ignition time to 'time' only if it is earlier than the point's current ignition time
  igniteEarlier (point, time) { if (time < this._it[point]) { this._it[point] = time } }

  // Returns the point's currently scheduled ignition time
  ignitionTime (point) { return this._it[point] }

  // Returns the base 0 index of the grid row of point 'point'
  rowOf (point) { return Math.floor(point / this._cols) }

  // Returns the total number of FireGrid rows (n-s)
  rows () { return this._rows }

  // Returns FireGrid point spacing (same for both rows and cols)
  spacing () { return this._spacing }

  timeStep () { return this._timeStep }
}
