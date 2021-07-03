/* eslint-disable brace-style */
import { AbstractLandscape } from './AbstractLandscape.js'
import { FireBehaviorProvider } from './FireBehaviorProvider.js'

// Note: we could have any positive number for Burned, such as the burn period,
// but that would lead to highly fractured scanLine with about 2*timeSteps segments each
export const Unburnable = -2
export const Unburned = 0
export const Burned = 1
export const Burning = 2
export const Edge = -1

export class FireLandscape extends AbstractLandscape {
  constructor (sceneWidth, sceneHeight, scanSpacing = 1, timeRes = 1) {
    super(sceneWidth, sceneHeight)
    this._scanSpacing = scanSpacing // spacing between scan lines in common units
    this._timeRes = timeRes // simulation time step in common units (i.e., min)
    this._provider = new FireBehaviorProvider(this)
    this._hLines = [] // An array of Scanlines
    // Each Scanline is [<yPos>, [<segment>]] and always ends with a [<pos>, Edge] segment
    for (let y = 0; y <= sceneHeight; y += scanSpacing) {
      this._hLines.push({
        at: y,
        segments: [
          { starts: 0, status: Unburned },
          { starts: sceneWidth, status: Edge }]
      })
    }
    this._vLines = [] // An array of Scanlines
    // Each Scanline is [<xPos>, [<segment>]] and always ends with a [<xpos>, Edge] segment
    for (let x = 0; x <= sceneWidth; x += scanSpacing) {
      this._vLines.push({
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
    fire.length = this._timeStep * (fire.headRos + fire.backRos)
    fire.width = this._timeStep * 2 * fire.flankRos
    return fire
  }

  hLines () { return this._hLines }

  // Returns FireGrid point spacing (same for both rows and cols)
  scanSpacing () { return this._scanSpacing }

  timeRes () { return this._timeRes }

  /**
   * Updates a scanline with fire in those segments that are currently unburned
   * @param {number} fireBegins Start of the fire segment
   * @param {number} fireEnds End of fire segment
   * @param {number} scanLine Scanline to to be updated
   */
  updateScanlineWithFire (fireBegins, fireEnds, scanLine) {
    const updated = [] // starts with an empty, updated segment
    // Examine each unburned segment of the scanLine
    scanLine.segments.forEach((segment, idx) => {
      // Case 1: this scanline segment is either already Burned or Unburnable
      // add this scanline segment as-is to the updated segment
      if (segment.status !== Unburned) {
        this.updateSegment(updated, segment)
      } else {
        // This scanline segment ends at the start of the next scanline segment
        const segEnds = scanLine.segments[idx + 1].starts
        // Case 2: The fire segment and this scanLine segments do not overlap
        // add this scanline segment as-is to the updated segment
        if (fireEnds < segment.starts || fireBegins > segEnds) {
          this.updateSegment(updated, segment)
        }
        // Case 3: The fire segment completely covers this scanLine segment
        // update this scanline segment to Burned and add it to the updated segment
        else if (fireBegins <= segment.starts && fireEnds >= segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Burned })
        }
        // Case 4: The fire segment starts before this scanLine segment and ends within it
        // add a Burned and an Unburned segment to the update
        else if (fireBegins <= segment.starts && fireEnds < segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Burned })
          this.updateSegment(updated, { starts: fireEnds, status: Unburned })
        }
        // Case 5: The fire segment starts within this scanLine segment and extends beyond it
        // add an Unburned and a Burned segment to the update
        else if (fireBegins > segment.starts && fireBegins < segEnds && fireEnds >= segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Unburned })
          this.updateSegment(updated, { starts: fireBegins, status: Burned })
        }
        // Case 6: The fire segment lies entirely within this scanLine segment
        // add an Unburned, a Burned, and another Unburned segment to the update
        else if (fireBegins > segment.starts && fireBegins < segEnds && fireEnds < segEnds) {
          this.updateSegment(updated, { starts: segment.starts, status: Unburned })
          this.updateSegment(updated, { starts: fireBegins, status: Burned })
          this.updateSegment(updated, { starts: fireEnds, status: Unburned })
        } else {
          throw new Error(`FireLandscape.insertBurning(${fireBegins}, ${fireEnds}) unhandled case`)
        }
      }
    })
    // return an updated scanLine
    return { at: scanLine.at, segments: updated }
  }

  // Adds the segment to the array only if the segment's status differs from the last segment in the array
  updateSegment (a, segment) {
    if (!a.length || a[a.length - 1].status !== segment.status) a.push(segment)
  }

  vLines () { return this._vLines }
}
