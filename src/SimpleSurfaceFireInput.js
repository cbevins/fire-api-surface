/**
 * @file SimpleSurfaceFireInput.js
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/

/**
 * This defines the structure and properties of the input object
 * passed into SimpleSurfaceFire.run().
 * Clone (or otherwise replicate) this object and modify its property values as needed.
 */
export const SimpleSurfaceFireInput = {
  fuel: {
    model: '10' // BehavePlus fuel model key (see table of keys at end of this file)
  },
  moisture: {
    dead: {
      tl1h: 5, // dead 1-h time-lag fuel moisture content (%)
      tl10h: 7, // dead 10-h time-lag fuel moisture content (%)
      tl100h: 9 // dead 100-h time-lag fuel moisture content (%)
    },
    live: {
      herb: 50, // live herbaceous (curable live fuel) fuel moisture content (%)
      stem: 150 // live stem (uncurable live fuel) fuel moisture content (%)
    }
  },
  wind: {
    direction: {
      headingFromUpslope: 0 // compass degrees clockwise from upslope direction
    },
    speed: {
      atMidflame: 10 // wind speed at midflame height (mi/h)
    }
  },
  slope: {
    steepness: {
      ratio: 25 // slope rise / reach ratio (%)
    }
  },
  temperature: {
    air: 77 // ambient air temperature (oF) (used only for scorch height calculation)
  },
  time: {
    sinceIgnition: 60 // minutes since ignition (used for spread distances and area)
  }
}
