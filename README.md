<a id='top'></a>

# ![](favicon.png) @cbevins/fire-api-surface

*fire-api-surface* package is an API for estimating wildland surface fire behavior. It offers a simplified, pre-configured interface to the underlying *@cbevins/fire-behavior-simulator* package.

---

- [Summary](#summary)
- [Installation](#installation)
- [Example Use](#example-use)
- [Input Data Structure](#input-data-structure)
- [Output Data Structure](#output-data-structure)
- [Standard Fuel Models](#standard-fuel-models)

---
<a id='summary'></a>

## ![](favicon.png) Summary

*fire-api-surface* covers many of the most common wildland fire behavior programming use cases.  It estimates the following variables:

- Fire ellipse:
  - area (ft<sup>2</sup>)
  - length-to-width ratio
  - perimeter (ft)
  - length (ft)
  - width (ft)
  - heading, backing, and flanking:
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
  - heat per unit area (btu/ft<sup>2</sup>)
  - reaction intensity (btu/ft<sup>2</sup>/min)

It requires just 11 inputs:
- a fuel model key  (see [Standard Fuel Models](#standard-fuel-models))
- 3 dead and 2 live fuel class moisture contents
- slope steepness
- wind speed and direction
- air temperature (required only if scorch height is an output of interest)
- time since ignition (required only if area, perimeter, and spread distances are of interest)

[Back to Top](#top)

---
<a id='installation'></a>

## ![](favicon.png) Installation

To work with a local copy of the *fire-api-surface* source code:

```dos
git clone https://github.com/cbevins/fire-api-surface.git
cd fire-api-surface
npm install
```

To use the *fire-api-surface* package as a node_module dependency in your own application, run:

```dos
npm i --save @cbevins/fire-api-surface
```
from the folder containing the project's **package.json** file.

[Back to Top](#top)

---

<a id='example-use'></a>

## ![](favicon.png) Example Use


```js
// 1 - import the classes from node_modules or source code index.js
import { SimpleSurfaceFire, SimpleSurfaceFireInput } from '@cbevins/fire-api-surface'

// 2 - create a SimpleSurfaceFire instance
const surface = new SimpleSurfaceFire()

// 3 - get a copy of the SimpleSurfaceFireInput object
const input = { ...SimpleSurfaceFireInput }

// 4 - inject your own data values into the input object
input.fuel.model = 'gs4' // change the fuel model key (string)
input.wind.direction.headingFromUpslope = 90 // change the wind direction (degrees)

// 5 - submit the input and do something with the results
const results = surface.run(input)
console.log(results)

// Repeat steps 4 and 5 as needed
```

[Back to Top](#top)

---
<a id='input-data-structure'></a>

## ![](favicon.png) Input Data Structure

The **SimpleSurfaceFire.run(input)** method requires an input object with the following structure:

```js
const input = {
  fuel: {
    model: '10' // BehavePlus fuel model key string (see table of keys at end of this file)
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
```

which is used as below:

```js
const surface = new SimpleSurfaceFire()
const result = surface.run(input)
```

You can create the input object yourself from scratch, or simply generate a copy of it from **SimpleSurfaceFireInput** and then reassign your own values to its properties:

```js
// get a copy of the SimpleSurfaceFireInput object
const input = { ...SimpleSurfaceFireInput }

// inject your own data values into the input object
input.fuel.model = 'gs4' // change the fuel model key (string)
input.wind.direction.headingFromUpslope = 90 // change the wind direction (degrees)
const result = surface.run(input)
```

[Back to Top](#top)

---
<a id='output-data-structure'></a>

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

[Back to Top](#top)

---

<a id='standard-fuel-models'></a>

## ![](favicon.png) Standard Fuel Models

The **standard** fuel models may be selected via their **key** strings ('124', 'gs4') or number (124).  Note that key *strings* are case-sensitive; there is a fuel model with key 'gs4', but not one with key 'GS4' or 'Gs4'.

The 13 original standard fuel models specified by Rothermel (1972) and illustrated in Anderson's (1982) photo guide are listed below.  All 13 original fuel models are *static*; there is no transfer of cured herbaceous fuel loads from the live into the dead fuel category.

  | Key | Name |
  |-----|------|
  | '1' | Short grass |
  | '2' | Timber grass and understory |
  | '3' | Tall grass |
  | '4' | Chaparral |
  | '5' | Brush |
  | '6' | Dormant brush, hardwood slash |
  | '7' | Southern rough |
  | '8' | Short needle litter |
  | '9' | Long needle or hardwood litter |
  | '10' | Timber litter & understory |
  | '11' | Light logging slash |
  | '12' | Medium logging slash |
  | '13' | Heavy logging slash |

---

The 40 additional standard fuel models specified by Scott and Burgan (2005) are listed below.  All 40 fuel models are *dynamic*; any cured cured herbaceous fuel loading they may have is transferred from the live into the dead fuel category.

  | Key(s) | Name |
  |--------|------|
  | '101', 'gr1' | Short, sparse, dry climate grass |
  | '102', 'gr2' | Low load, dry climate grass |
  | '103', 'gr3' | Low load, very coarse, humid climate grass |
  | '104', 'gr4' | Moderate load, dry climate grass |
  | '105', 'gr5' | Low load, humid climate grass |
  | '106', 'gr6' | Moderate load, humid climate grass |
  | '107', 'gr7' | High load, dry climate grass |
  | '108', 'gr8' | High load, very coarse, humid climate grass |
  | '109', 'gr9' | Very high load, humid climate grass |
  | '121', 'gs1' | Low load, dry climate grass-shrub |
  | '122', 'gs2' | Moderate load, dry climate grass-shrub |
  | '123', 'gs3' | Moderate load, humid climate grass-shrub |
  | '124', 'gs4' | High load, humid climate grass-shrub |
  | '141', 'sh1' | Low load, dry climate shrub |
  | '142', 'sh2' | Moderate load, dry climate shrub |
  | '143', 'sh3' | Moderate load, humid climate shrub |
  | '144', 'sh4' | Low load, humid climate timber-shrub |
  | '145', 'sh5' | High load, dry climate shrub |
  | '146', 'sh6' | Low load, humid climate shrub |
  | '147', 'sh7' | Very high load, dry climate shrub |
  | '148', 'sh8' | High load, humid climate shrub |
  | '149', 'sh9' | Very high load, humid climate shrub |
  | '161', 'tu1' | Light load, dry climate timber-grass-shrub |
  | '162', 'tu2' | Moderate load, humid climate timber-shrub |
  | '163', 'tu3' | Moderate load, humid climate timber-grass-shrub |
  | '164', 'tu4' | Dwarf conifer understory |
  | '165', 'tu5' | Very high load, dry climate timber-shrub |
  | '181', 'tl1' | Low load, compact conifer litter |
  | '182', 'tl2' | Low load broadleaf litter |
  | '183', 'tl3' | Moderate load conifer litter |
  | '184', 'tl4' | Small downed logs |
  | '185', 'tl5' | High load conifer litter |
  | '186', 'tl6' | High load broadleaf litter |
  | '187', 'tl7' | Large downed logs |
  | '188', 'tl8' | Long-needle litter |
  | '189', 'tl9' | Very high load broadleaf litter |
  | '201', 'sb1' | Low load activity fuel |
  | '202', 'sb2' | Moderate load activity or low load blowdown |
  | '203', 'sb3' | High load activity fuel or moderate load blowdown |
  | '204', 'sb4' | High load blowdown |

---

Finally, *fire-behavior-simulator* also provides a **no-fuel** fuel model:

  | Key(s) | Name |
  |--------|------|
  | '0', 'none', 'rock', 'water' | No Fuel |

[Back to Top](#top)

---
