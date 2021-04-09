# ![](favicon.png) cbevins/fire-api-surface

*fire-api-surface* is a simplified API for generating wildland surface fire behavior estimates. Under the hood, it uses a pre-configured *@cbevins/fire-behavior-simulator* package to do the heavy lifting.

*fire-api-surface* covers the most common fire behavior use case, producing the following variables:

- Fire ellipse:
  - area (ft2)
  - length-to-width ratio
  - perimeter (ft)
  - length (ft)
  - width: (ft)
  - heading, backing, and flanking fire behavior:
    - fireline intensity (Btu/ft/s)
    - flame length (ft)
    - scorch height (ft)
    - spread distance (ft)
    - spread rate (ft/min)

- Basic surface fire:
  - cured herb fraction (ratio)
  - effective wind speed (ft/min)
  - flame residence time (min)
  - direction of maximum spread (degrees clockwise from upslope direction)
  - heat per unit area (btu/ft2)
  - reaction intensity (btu/ft2/min)

The following inputs are required:
- fuel model key
- 3 dead and 2 live fuel class moisture contents
- slope steepness
- wind speed and direction
- air temperature
- time since ignition

---

## ![](favicon.png) Installation

From your computer, enter:
```
> git clone https://github.com/cbevins/fire-api-surface.git
> cd fire-api-surface
> npm install
```

---

## ![](favicon.png) Example Use

```js
// Import and create a SimpleSurfaceFire instance
import { SimpleSurfaceFire, SimpleSurfaceFireInput } from './index.js'
const surface = new SimpleSurfaceFire()

// Get a copy of the SimpleSurfaceFireInput object and make any desired changes
const input = { ...SimpleSurfaceFireInput } // make a copy of the input object
input.fuel.model = 'gs4' // change the fuel model
input.wind.direction.headingFromUpslope = 90 // change the wind direction

// Submit the input and display the results
const results = surface.run(input)
console.log(results)
```
---

## ![](favicon.png) Input Data Structure

The **SimpleSurfaceFire.run(input)** method requires an input object with the following structure:

```js
SimpleSurfaceFire.run({
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
})
```

---

## ![](favicon.png) Output Data Structure

The **SimpleSurfaceFire.run()** method returns an object with the following structure:

```js
{
  fire: {
    curedHerbFraction: {number}, // ratio,
    effectiveWindSpeed: {number}, // ft/min
    flameResidenceTime: {number}, // min
    headingFromUpslope: {number}, // degrees
    heatPerUnitArea: {number}, // btu/ft2
    reactionIntensity: {number} // btu/ft2/min
  },
  ellipse: {
    area: {number}, // ft2
    length: {number}, // ft
    lengthToWidthRatio: {number}, // ratio
    perimeter: {number}, // ft
    width: {number}, // ft
    backing: {
      firelineIntensity: {number}, // Btu/ft/s
      flameLength: {number}, // ft,
      scorchHeight: {number}, // ft,
      spreadDistance: {number}, // ft
      spreadRate: {number}, // ft/min
    },
    flanking: {
      firelineIntensity: {number}, // Btu/ft/s
      flameLength: {number}, // ft,
      scorchHeight: {number}, // ft,
      spreadDistance: {number}, // ft
      spreadRate: {number}, // ft/min
    },
    heading: {
      firelineIntensity: {number}, // Btu/ft/s
      flameLength: {number}, // ft,
      scorchHeight: {number}, // ft,
      spreadDistance: {number}, // ft
      spreadRate: {number}, // ft/min
    }
  }
}
```