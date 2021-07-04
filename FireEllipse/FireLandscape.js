/* eslint-disable brace-style */
import { AbstractLandscape } from './AbstractLandscape.js'
import { FireBehaviorProvider } from './FireBehaviorProvider.js'

// Note: we could have any positive number for Burned, such as the burn period,
// but that would lead to highly fractured scanline with about 2*timeSteps segments each
export const Unburnable = -2
export const Unburned = 0
export const Burned = 1
export const Burning = 2
export const Edge = -1

export class FireLandscape extends AbstractLandscape {
  constructor (sceneWidth, sceneHeight, timeRes = 1, scanSpacing = 1) {
    super(sceneWidth, sceneHeight)
    this._scanSpacing = scanSpacing // spacing between scan lines in common units
    this._timeRes = timeRes // simulation time step in common units (i.e., min)
    this._provider = new FireBehaviorProvider(this)
    this._hlines = [] // An array of Scanlines
    // Each Scanline is [<yPos>, [<segment>]] and always ends with a [<pos>, Edge] segment
    for (let y = 0; y <= sceneHeight; y += scanSpacing) {
      this._hlines.push({
        at: y,
        segments: [
          { starts: 0, status: Unburned },
          { starts: sceneWidth, status: Edge }]
      })
    }
    this._vlines = [] // An array of Scanlines
    // Each Scanline is [<xPos>, [<segment>]] and always ends with a [<xpos>, Edge] segment
    for (let x = 0; x <= sceneWidth; x += scanSpacing) {
      this._vlines.push({
        at: x,
        segments: [
          { starts: 0, status: Unburned },
          { starts: sceneHeight, status: Edge }]
      })
    }
  }

  // Returns {key, lwr, backRos, flankRos, headRos, heading, length, width}
  fireBehaviorAt (point, time) {
    const input = {
      aspect: this.aspect(point),
      curedHerb: this.curedHerb(point),
      fuelModel: this.fuelModel(point),
      slope: this.slope(point),
      dead1: this.moistureDead1(point, time),
      dead10: this.moistureDead10(point, time),
      dead100: this.moistureDead100(point, time),
      liveHerb: this.moistureLiveHerb(point, time),
      liveStem: this.moistureLiveStem(point, time),
      windSpeed: this.windAtMidflame(point, time),
      windFrom: this.windFrom(point, time)
    }

    const fire = this._provider.fireBehavior(input)
    fire.length = this._timeRes * (fire.headRos + fire.backRos)
    fire.width = this._timeRes * 2 * fire.flankRos
    return fire
  }

  // Returns index of the vlines at x
  col (x) {
    x = Math.max(0, x)
    x = Math.min(x, this._sceneWidth)
    return Math.floor(x / this._scanSpacing)
  }

  // Returns the index of the hline at y
  row (y) {
    y = Math.max(0, y)
    y = Math.min(y, this._sceneHeight)
    return Math.floor(y / this._scanSpacing)
  }

  // Returns a reference to the horizontal scan line at idx
  hline (idx) { return this._hlines[idx] }

  // Returns a reference to the array of horizontal scan lines
  hlines () { return this._hlines }

  // Returns an array of all the scaline's burned-unbured and unburned-burned interfaces
  scanlineFireFronts (scanline) {
    const pts = []
    scanline.segments.forEach((segment, idx) => {
      if (segment.status === Burned) {
        if (idx && scanline.segments[idx - 1].status === Unburned) pts.push(segment.starts)
        if (scanline.segments[idx + 1].status === Unburned) pts.push(scanline.segments[idx + 1].starts)
      }
    })
    return pts
  }

  // Returns FireGrid point spacing (same for both rows and cols)
  scanSpacing () { return this._scanSpacing }

  // Returns the time resolution
  timeRes () { return this._timeRes }

  /**
   * Updates a scanline with fire in those segments that are currently unburned
   * @param {number} fireBegins Start of the fire segment
   * @param {number} fireEnds End of fire segment
   * @param {number} scanline Scanline to to be updated
   */
  updateScanlineWithFire (fireBegins, fireEnds, scanline) {
    const updated = [] // starts with an empty, updated segment
    // Examine each unburned segment of the scanline
    scanline.segments.forEach((segment, idx) => {
      // Case 1: this scanline segment is either already Burned or Unburnable
      // adds this scanline segment as-is to the updated segment
      if (segment.status !== Unburned) {
        this.updateSegment(updated, segment)
      } else {
        // This scanline segment ends at the start of the next scanline segment
        const segEnds = scanline.segments[idx + 1].starts
        // Case 2: The fire segment and this scanline segments do not overlap
        // adds this scanline segment as-is to the updated segment
        if (fireEnds < segment.starts || fireBegins > segEnds) {
          this.updateSegment(updated, segment)
        }
        // Case 3: The fire segment completely covers this scanline segment
        // updates this scanline segment to Burned and add it to the updated segment
        else if (fireBegins <= segment.starts && fireEnds >= segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Burned })
        }
        // Case 4: The fire segment starts before this scanline segment and ends within it
        // adds a Burned and an Unburned segment to the update
        else if (fireBegins <= segment.starts && fireEnds < segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Burned })
          this.updateSegment(updated, { starts: fireEnds, status: Unburned })
        }
        // Case 5: The fire segment starts within this scanline segment and extends beyond it
        // adds an Unburned and a Burned segment to the update
        else if (fireBegins > segment.starts && fireBegins < segEnds && fireEnds >= segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Unburned })
          this.updateSegment(updated, { starts: fireBegins, status: Burned })
        }
        // Case 6: The fire segment lies entirely within this scanline segment
        // adds an Unburned, a Burned, and another Unburned segment to the update
        else if (fireBegins > segment.starts && fireBegins < segEnds && fireEnds < segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Unburned })
          this.updateSegment(updated, { starts: fireBegins, status: Burned })
          this.updateSegment(updated, { starts: fireEnds, status: Unburned })
        } else {
          throw new Error(`FireLandscape.insertBurning(${fireBegins}, ${fireEnds}) unhandled case`)
        }
      }
    })
    // return an updated scanline
    return { at: scanline.at, segments: updated }
  }

  // Adds the segment to the array only if the segment's status differs from the last segment in the array
  updateSegment (a, segment) {
    if (!a.length || a[a.length - 1].status !== segment.status) a.push(segment)
  }

  // Returns a reference to the vertical scan line at idx
  vline (idx) { return this._vlines[idx] }

  // Returns a reference to the array of vertical scan lines
  vlines () { return this._vlines }
}
