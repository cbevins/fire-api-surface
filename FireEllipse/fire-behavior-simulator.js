/**
 * @file Various input string filters
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
function filterInteger(str) {
  if (typeof str !== 'string') return '';
  let filtered = '';
  let decimal = false;

  for (let idx = 0; idx <= str.length; idx += 1) {
    const c = str.charAt(idx);

    if (c >= '0' && c <= '9' && !decimal) {
      filtered += c;
    } else if (c === '-' && filtered === '' && !decimal) {
      // first valid char
      filtered += c;
    } else if (c === '.') {
      decimal = true;
    }
  }

  if (filtered === '-') filtered = '';
  return filtered;
}
function filterNumeric(str) {
  if (typeof str !== 'string') return '';
  let filtered = '';
  let decimal = false;
  let exponent = false;

  for (let idx = 0; idx <= str.length; idx += 1) {
    const c = str.charAt(idx);

    if (c >= '0' && c <= '9') {
      filtered += c;
    } else if (c === '.' && !decimal) {
      filtered += c;
      decimal = true;
    } else if (c === 'e' && !exponent) {
      filtered += c;
      exponent = true;
    } else if (c === '-') {
      if (filtered === '') {
        // first valid char
        filtered += c;
      } else if (filtered.substr(filtered.length - 1) === 'e') {
        // last valid char is 'e'
        filtered += c;
      }
    }
  }

  if (filtered.charAt(0) === 'e' || filtered.substr(0, 2) === '-e') {
    filtered = '';
  } // console.log(`'${str}' => '${filtered}'`)


  return filtered;
}
function filterNonNegativeNumeric(str) {
  let filtered = filterNumeric(str);

  if (filtered[0] === '-') {
    filtered = filtered.substring(1);
  }

  return filtered;
}
function keyLabel(key) {
  let filtered = '';
  let prev = 'separator';

  for (let idx = 0; idx < key.length; idx += 1) {
    const c = key.charAt(idx);

    if (c === '.' || c === '_') {
      filtered += ' '; // replace separator with a space

      prev = 'separator';
    } else if (c >= '0' && c <= '9') {
      if (prev !== 'digit') {
        // start of a number
        if (prev !== 'separator') filtered += ' '; // insert a space
      }

      filtered += c;
      prev = 'digit';
    } else if (c >= 'a' && c <= 'z') {
      if (prev === 'digit') filtered += ' ';

      if (prev === 'separator' || prev === 'digit') {
        filtered += c.toUpperCase();
      } else {
        filtered += c;
      }

      prev = 'letter';
    } else if (c >= 'A' && c <= 'Z') {
      if (prev !== 'separator') filtered += ' ';
      filtered += c;
      prev = 'letter';
    } else if (c === '-') {
      filtered += c;
      prev = 'letter';
    } else {
      filtered += c;
      prev = 'letter';
    }
  }

  return filtered;
}

/**
 * @file DagNode class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
class DagNode {
  constructor(geneRef, variantRef, initialValue) {
    this._dag = {
      _producers: [],
      // array of references to producer DagNodes
      _consumers: [],
      // aray of references to consumer DagNodes
      _depth: 0,
      _order: 0
    };
    this._gene = geneRef;
    this._is = {
      _config: variantRef.key().startsWith('Config'),
      _enabled: true,
      _input: false,
      _required: false,
      _selected: false
    };
    this._update = {
      _config: null,
      // reference to the Config DagNode that activated this updater pathway
      _configs: [],
      // array of all Config nodes referenced by this node's genes
      _method: null,
      // reference to a function that returns the current DagNode value
      _parms: [] // parameters for the arguments to the function that returns the current DagNode value

    };
    this._value = initialValue;
    this._variant = variantRef;
  } // accessors
  // consumers () { return this._dag._consumers }


  depth() {
    return this._dag._depth;
  }

  displayString() {
    return this._variant.displayString(this._value);
  }

  displayUnits() {
    return this._variant.displayUnits();
  }

  displayValue() {
    return this._variant.displayValue(this._value);
  }

  index() {
    return this._gene[0];
  }

  isConfig() {
    return this._is._config;
  }

  isEnabled() {
    return this._is._enabled;
  }

  isInput() {
    return this._is._input;
  }

  isRequired() {
    return this._is._required;
  }

  isSelected() {
    return this._is._selected;
  }

  key() {
    return this._gene[1];
  }

  label() {
    return keyLabel(this.key());
  }

  method() {
    return this._update._method;
  }

  nativeUnits() {
    return this._variant.nativeUnits();
  }

  order() {
    return this._dag._order;
  } // parms () { return this._update._parms }
  // producers () { return this._dag._producers }


  updater(idx) {
    return this._gene[3][idx];
  }

  updaters() {
    return this._gene[3];
  }

  value() {
    return this._value;
  }

  variant() {
    return this._variant;
  } // isValidValue (value) { return this._variant.isValidNativeValue(value) }
  // mutators


  reset() {
    this._dag = {
      _producers: [],
      // array of references to producer DagNodes
      _consumers: [],
      // aray of references to consumer DagNodes
      _depth: 0,
      _order: 0
    };
    this._is._input = false;
    this._is._required = false;
  }

  setEnabled(bool) {
    this._is._enabled = bool;
  } // setValue(value) { this._value = value }
  // Updates the Node's value by calling its update._method and storing the result.


  updateValue() {
    const args = []; // NOTE: This is the most heavily used function in the entire system.
    // DO NOT use this._update._args.map() to iterate over method parms,
    // as it increases execution time time by 50% !!!

    for (let i = 0; i < this._update._parms.length; i++) {
      const [isLiteral, parm] = this._update._parms[i];
      args.push(isLiteral ? parm : parm._value);
    }

    this._value = this._update._method.apply(this, args);
  }

}

/**
 * @file Shared, safe math functions
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
const divide = (...numbers) => numbers.reduce((a, b) => b === 0 ? 0 : a / b, numbers[0] * numbers[0]);
const fraction = number => Math.max(0, Math.min(1, number));
const greaterThan = (a, b) => a > b;
const multiply = (...numbers) => numbers.reduce((a, b) => a * b, 1);
const or = (a, b) => a || b;
const positive = number => Math.max(0, number);
const subtract = (...numbers) => numbers.reduce((a, b) => a - b, 2 * numbers[0]);
const sum$1 = (...numbers) => numbers.reduce((a, b) => a + b, 0);
const sumOfProducts = (...numbers) => {
  const mid = Math.floor(numbers.length / 2);
  const a1 = numbers.slice(0, mid);
  return a1.reduce((acc, number, idx) => acc + a1[idx] * numbers[mid + idx], 0);
};

var Calc = /*#__PURE__*/Object.freeze({
  __proto__: null,
  divide: divide,
  fraction: fraction,
  greaterThan: greaterThan,
  multiply: multiply,
  or: or,
  positive: positive,
  subtract: subtract,
  sum: sum$1,
  sumOfProducts: sumOfProducts
});

/**
 * @file Standard Behave fuel model equations as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
function curedHerbFraction(liveHerbMc) {
  const fraction$1 = 1.333 - 1.11 * liveHerbMc;
  return fraction(fraction$1);
}
function deadHerbLoad(totalHerbLoad, curedHerbFraction) {
  return totalHerbLoad * curedHerbFraction;
}
function liveHerbLoad$1(totalHerbLoad, curedHerbFraction) {
  return totalHerbLoad * (1 - curedHerbFraction);
}

var BehaveFuel = /*#__PURE__*/Object.freeze({
  __proto__: null,
  curedHerbFraction: curedHerbFraction,
  deadHerbLoad: deadHerbLoad,
  liveHerbLoad: liveHerbLoad$1
});

/**
 * @file Canopy functions as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
// is filled with tree crowns (division by 3 assumes conical crown shapes).

function crownFill(cover, cratio) {
  return fraction(cratio) * fraction(cover) / 3;
} // Crown length

function crownLength(baseHt, ht) {
  return positive(ht - baseHt);
} // // Crown length from crown ratio and canopy height
// export function crownLengthFromRatio(crownRatio, ht) {
//   return crownRatio * ht
// }
// Crown ratio

function crownRatio(length, ht) {
  return fraction(divide(length, ht));
} // Canopy fuel load

function fuelLoad(bulk, length) {
  return positive(bulk * length);
} // Canopy heat per unit area

function heatPerUnitArea$1(load, heat) {
  return positive(load * heat);
} // Returns true if canopy effectively shelters the fuel from wind

function sheltersFuelFromWind(cover, ht, fill) {
  return cover >= 0.01 && fill >= 0.05 && ht >= 6;
} // Canopy induced midflame windspeed adjustment factor

function windSpeedAdjustmentFactor$1(cover, ht, fill) {
  let waf = 1;

  if (sheltersFuelFromWind(cover, ht, fill)) {
    waf = 0.555 / (Math.sqrt(fill * ht) * Math.log((20 + 0.36 * ht) / (0.13 * ht)));
  }

  return fraction(waf);
}

var Canopy = /*#__PURE__*/Object.freeze({
  __proto__: null,
  crownFill: crownFill,
  crownLength: crownLength,
  crownRatio: crownRatio,
  fuelLoad: fuelLoad,
  heatPerUnitArea: heatPerUnitArea$1,
  sheltersFuelFromWind: sheltersFuelFromWind,
  windSpeedAdjustmentFactor: windSpeedAdjustmentFactor$1
});

/**
 * @file Chaparral dynamic fuel equations as described by Rothermel and Philpot (1973)
 * and as implemented by BehavePlus V6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
const TypeChamise = 'chamise';
const TypeMixedBrush = 'mixedBrush';
const Types$1 = [TypeChamise, TypeMixedBrush];
/**
 * Estimates the chaparral age (years since last burned)
 * from the chaparral fuel depth and fuel type.
 *
 *  @param {number} depth - Chaparral fuel depth (ft+1)
 *  @param {string} type -  Chaparral fuel type ['chamise' | 'mixedBrush']
 *  @returns {number} Estimated chaparral age (years since last burned).
 */

function age(depth, type) {
  if (type === TypeChamise) {
    return Math.exp(3.912023 * Math.sqrt(depth / 7.5));
  } // else  (type === TypeMixedBrush) {


  return Math.exp(3.912023 * Math.sqrt(depth / 10));
}
/**
 * Estimates the chaparral fuel depth from its age and type.
 *
 * @param {number} age
 * @param {string} type  One of 'chamise' or 'mixedBrush'
 * @returns {number} Estimated fuel bed depth (ft+1)
 */

function fuelDepth$1(age, type) {
  // Prevent values of age < 1 from increasing the depth!
  const x = Math.log(Math.max(age, 1.1)) / 3.912023;
  return type === TypeChamise ? 7.5 * x * x : 10 * x * x; // type === TypeMixedBrush
}
/**
 * @returns {string[]} Array of valid chaparral fuel types.
 */

function fuelTypes$1() {
  return Types$1;
}
/**
 *  Estimates the total chaparral fuel load from age and type.
 *
 * NOTE - Rothermel & Philpot (1973) used a factor of 0.0315 for chamise age,
 * while Cohen used 0.0347 in FIRECAST.  According to Faith Ann Heinsch:
 * <i>We are going to use Cohen’s calculation from FIRECAST. The change has to do
 * with the fact that we are creating a proxy age from fuel bed depth rather than
 * using an entered age. He had to make some corrections for that assumption.</i>
 *
 *  @param {number} age - Chaparral age (years since last burned)
 *  @param {string} type -  Chaparral fuel type ['chamise' | 'mixedBrush']
 *  @returns {number} Total fuel load (lb+1 ft-2)
 */

function totalLoad(age, type) {
  // Total load in tons per acre
  let tpa = 0;

  if (type === TypeChamise) {
    // const chamise1 = 0.0315   // Chamise load factor from Rothermel & Philpot (1973)
    const chamise2 = 0.0347; // Chamise load factor from Cohen's FIRECAST code

    tpa = age / (1.4459 + chamise2 * age);
  } else {
    // if (type === TypeMixedBrush) {
    tpa = age / (0.4849 + 0.017 * age);
  } // Return total load in lb/ft2


  return tpa * 2000 / 43560;
}
/**
 * @returns {number} The dead fuel moisture content of extinction (fraction)
 * as used in BehavePlus V6.
 */

function deadExtinctionMoisture() {
  return 0.3;
}
/**
 * Dead fuel fraction from age for AVERAGE mortality level
 *
 * @param {number} age - Chaparral age (years since last burned)
 * @returns {number} Dead fuel fraction assuming avereage mortality.
 */

function deadFractionAverageMortality(age) {
  return fraction(0.0694 * Math.exp(0.0402 * age));
}
/**
 * Dead fuel fraction from age for SEVERE mortality level
 *
 * @param {number} age - Chaparral age (years since last burned)
 * @returns {number} Dead fuel fraction assuming severe mortality.
 */

function deadFractionSevereMortality(age) {
  return fraction(0.1094 * Math.exp(0.0385 * age));
}
/**
 *  Estimates chaparral dead fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} Chaparral dead fuel load (lb+1 ft-2)
 */

function deadLoad(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * deadFuelFraction);
}
/**
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the dead fine (0 to 0.25 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot 1973 Figure 1.
 */

function deadClass1Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * 0.347 * deadFuelFraction);
}
/**
 *  Estimates chaparral small (0.25-0.5 inch diameter) dead fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the dead small (0.25 to 0.5 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot 1973 Figure 1.
 */

function deadClass2Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * 0.364 * deadFuelFraction);
}
/**
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the dead medium (0.5 to 1 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function deadClass3Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * 0.207 * deadFuelFraction);
}
/**
 * Estimates chaparral large (1 to 3 inch diameter) dead fuel load.
 *
 * Note that the factor of 0.082 varies from the Rothermel & Philpot
 * Figure 1 value of .085, because their factors totaled 1.03 instead of 1.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the dead large (1 to 3 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function deadClass4Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * 0.082 * deadFuelFraction);
}
/**
 *  Estimates chaparral live fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} Chaparral live fuel load (lb+1 ft-2)
 */

function liveLoad(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * (1 - deadFuelFraction));
}
/**
 *  Estimates live fine (0 to 0.25 inch diameter) chaparral stem wood fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the live fine (0 to 0.25 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function liveClass1Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * (0.2416 - 0.256 * deadFuelFraction));
}
/**
 *  Estimates live small (0.25 to 0.5 inch diameter) chaparral stem wood fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the live small (0.25 t0 0.5 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function liveClass2Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * (0.1918 - 0.256 * deadFuelFraction));
}
/**
 *  Estimates live medium (0.5 to 1 inch diameter) chaparral stem wood fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the live medium (0.5 to 1 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function liveClass3Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * (0.2648 - 0.05 * deadFuelFraction));
}
/**
 *  Estimates live large (1 to 3 inch diameter) chaparral stem wood fuel load.
 *
 * Modified so that thisLoad = live load - (liveLeaf + liveFine + liveSmall + liveMedium)
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the live large (1 to 3 inch diameter) chaparral stem wood
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function liveClass4Load(totalFuelLoad, deadFuelFraction) {
  const liveLoad = totalFuelLoad * (1 - deadFuelFraction);
  const l1 = liveClass1Load(totalFuelLoad, deadFuelFraction);
  const l2 = liveClass2Load(totalFuelLoad, deadFuelFraction);
  const l3 = liveClass3Load(totalFuelLoad, deadFuelFraction);
  const l5 = liveClass5Load(totalFuelLoad, deadFuelFraction);
  return positive(liveLoad - l1 - l2 - l3 - l5); // return Calc.positive(totalFuelLoad * (0.1036 - 0.114 * deadFuelFraction))
}
/**
 *  Estimates live chaparral leaf fuel load.
 *
 * @param {number} totalFuelLoad Total chaparral fuel load (lb+1 ft-2)
 * @param {*} deadFuelFraction Dead fuel fraction (fraction)
 * @returns {number} The load (lb+1 ft-2)
 * of the live chaparral leaf
 * as per Rothermel and Philpot (1973) Figure 1.
 */

function liveClass5Load(totalFuelLoad, deadFuelFraction) {
  return positive(totalFuelLoad * (0.1957 - 0.305 * deadFuelFraction));
}

var ChaparralFuel = /*#__PURE__*/Object.freeze({
  __proto__: null,
  TypeChamise: TypeChamise,
  TypeMixedBrush: TypeMixedBrush,
  Types: Types$1,
  age: age,
  fuelDepth: fuelDepth$1,
  fuelTypes: fuelTypes$1,
  totalLoad: totalLoad,
  deadExtinctionMoisture: deadExtinctionMoisture,
  deadFractionAverageMortality: deadFractionAverageMortality,
  deadFractionSevereMortality: deadFractionSevereMortality,
  deadLoad: deadLoad,
  deadClass1Load: deadClass1Load,
  deadClass2Load: deadClass2Load,
  deadClass3Load: deadClass3Load,
  deadClass4Load: deadClass4Load,
  liveLoad: liveLoad,
  liveClass1Load: liveClass1Load,
  liveClass2Load: liveClass2Load,
  liveClass3Load: liveClass3Load,
  liveClass4Load: liveClass4Load,
  liveClass5Load: liveClass5Load
});

/**
 * @file Compass functions as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */

/**
 * Constrain compass degrees to the azimuth range [0 <= degrees < 360].
 *
 * @param float degrees The compass azimuth (degrees).
 *
 * @return float The compass azimuth constrained to the range [0 <= azimuth < 360] degrees.
 */
function constrain(degrees) {
  while (degrees >= 360) {
    degrees -= 360;
  }

  while (degrees < 0) {
    degrees += 360;
  }

  return degrees;
}
/**
 * Calculate compass degrees (azimuth, clockwise from north) from radians.
 *
 * @param float radians Compass azimuth expressed in radians.
 *
 * @return float Compass azimuth expressed in degrees.
 */

function degrees(radians) {
  return radians * 180 / Math.PI;
}
function diff(x, y) {
  return constrain(x - y);
}
/**
 * Get the opposite azimuth from degrees.
 *
 * @param float deg A compass azimuth (degrees).
 *
 * @return float The opposite compass azimuth from dgrees.
 */

function opposite(degrees) {
  return constrain(degrees - 180);
}
/**
 * Calculate the radians of the compass azimuth (clockwise from north).
 *
 * @param float degrees  Compass azimuth (degrees clockwise from north).
 *
 * @return float The compass azimuth expressed in radians.
 */

function radians(degrees) {
  return degrees * Math.PI / 180;
}
/**
 * Calculate the slope steepness in degrees from the slope vertical rise / horizontal reach ratio.
 *
 * @param float ratio Ratio of the slope vertical rise / horizontal reach (fraction).
 *
 * @return float Slope steepness expressed in degrees.
 */

function slopeDegrees(ratio) {
  const radians = Math.atan(ratio);
  return degrees(radians);
}
/**
 * Calculate slope steepness degrees from map measurements.
 *
 * @param float mapScale Map scale factor (Greater than 1, i.e., 24000)
 * @param float contourInterval Map contour interval (in same units-of-measure as distance)
 * @param float contours Number of contours crossed in the measurement
 * @param float mapDistance Map distance covered in the measurement
 *
 * @return float Slope steepness degrees
 */

function slopeDegreesMap(mapScale, contourInterval, contours, mapDistance) {
  const ratio = slopeRatioMap(mapScale, contourInterval, contours, mapDistance);
  return slopeDegrees(ratio);
}
/**
 * Calculate the slope vertical rise / horizontal reach ratio from its steepness in degrees.
 *
 * @param float degrees  Slope steepness in degrees.
 *
 * @return float Slope vertical rise / horizontal reach ratio (fraction).
 */

function slopeRatio(degrees) {
  const rad = radians(constrain(degrees));
  return Math.tan(rad);
}
/**
 * Calculate slope steepness ratio from map measurements.
 *
 * @param float mapScale Map sacle factor (Greater than 1, i.e., 24000)
 * @param float contourInterval Map contour interval (in same units-of-measure as distance)
 * @param float contours Number of contours crossed in the measurement
 * @param float mapDistance Map distance covered in the measurement
 *
 * @return float Slope steepness ratio
 */

function slopeRatioMap(mapScale, contourInterval, contours, mapDistance) {
  const reach = Math.max(0, mapScale * mapDistance);
  const rise = Math.max(0, contours * contourInterval);
  return reach <= 0 ? 0 : rise / reach;
}
function sum(x, y) {
  return constrain(x + y);
}

var Compass = /*#__PURE__*/Object.freeze({
  __proto__: null,
  constrain: constrain,
  degrees: degrees,
  diff: diff,
  opposite: opposite,
  radians: radians,
  slopeDegrees: slopeDegrees,
  slopeDegreesMap: slopeDegreesMap,
  slopeRatio: slopeRatio,
  slopeRatioMap: slopeRatioMap,
  sum: sum
});

/**
 * @file Crown fire functions as described by Rothermel () and by Scott & Reinhardt ()
 * and as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
const ACTIVE = 'Active';
const CONDITIONAL = 'Conditional';
const PASSIVE = 'Passive';
const SURFACE = 'Surface';
const InitiationTypes = [ACTIVE, CONDITIONAL, PASSIVE, SURFACE];
/**
 * Calculate the crown fire active ratio.
 *
 * @param rActive Actual active crown fire spread rate (ft+1 min-1)
 * @param rPrime Crown spread rate required to maintain active crowning (ft+1 min-1)
 * @return Scott & Reinhardt's active crowning ratio.
 */

function activeRatio(rActive, rPrime) {
  return rPrime <= 0 ? 0 : rActive / rPrime;
}
/**
 * Crown fire area per Rothermel (1991) equation 11 (p 16)
 *
 * @param dist Crown fire spread distance (ft+1)
 * @param lwr Crown fire length-to-width ratio
 * @return Crown fire area (ft+2)
 */

function area$1(dist, lwr) {
  return Math.PI * dist * dist / (4 * lwr);
}
function canTransition(transRatio) {
  return transRatio >= 1;
}
/**
 * Calculates the crown fraction burned as per Scott & Reinhardt (2001).
 *
 * @param rSurface Actual surface fire spread rate [Rsurface] (ft+1 min-1).
 * @param rInit Surface fire spread rate required to
 *  initiate torching/crowning [R'initiation] (ft+1 min-1).
 * @param rSa Surface fire spread rate [R'sa] (ft+1 min-1)
 *   at which the active crown fire spread rate is fully achieved
 *   and the crown fraction burned is 1.
 * @return The crown fraction burned (fraction).
 */

function crownFractionBurned(rSurface, rInit, rSa) {
  const numer = rSurface - rInit; // Rsurface - R'init

  const denom = rSa - rInit; // R'sa - R'init

  return fraction(divide(numer, denom));
}
/**
 * Calculate the Scott & Reinhardt 'crowning index' (O'active),
 * the 20-ft wind speed at which the crown canopy becomes fully available
 * for active fire spread (and the crown fraction burned approaches 1).
 *
 * @param oActive Open wind speed sufficient for active xcrown fire (ft+1 min-1)
 * @return The Scott & Reinhardt Crowning Index (km+1 h-1).
 */

function crowningIndex(oActive) {
  return oActive / 54.680665; // CI in km/h
}
/**
 *
 * @param crownHpua Crown fire (surface plus canopy fuel) heat per unit area (Btu+1 ft-2)
 * @param rActive Active crown fire spread rate (ft+1 min-1)
 * @return Active crown fire fireline intensity (BTU+1 ft-1 s-1)
 */

function fliActive(crownHpua, rActive) {
  return rActive / 60 * crownHpua;
}
function fliFinal(rFinal, cfb, cpyHpua, surfHpua) {
  return rFinal * (surfHpua + cfb * cpyHpua) / 60;
}
/**
 * Calculate the critical surface fire intensity (I'initiation)
 * sufficient to drive off canopy foliar moisture and initiate a
 * passive or active crown fire.
 *
 * This is Scott & Reinhardt (2001) equation 11 (p 13).
 *
 * @param folMois Canopy foliar moisture content (ratio).
 * @param cpyBase Crown canopy base height (ft+1).
 * @return The critical surface fireline intensity (btu+1 ft-1 s-1)
 *  required to initiate a passive or active crown fire.
 */

function fliInit(folMois, cpyBase) {
  const fmc = Math.max(30, 100 * folMois); // convert to percent with 30% min

  const cbh = Math.max(0.1, 0.3048 * cpyBase); // convert to meters with 10 cm min

  const kwm = Math.pow(0.01 * cbh * (460 + 25.9 * fmc), 1.5); // (kW/m)

  return kwm * 0.288672; // return as Btu/ft/s
}
/**
 * Calculate Thomas's (1963) flame length (ft+1) given a fireline intensity.
 *
 * @param fli Fireline intensity (Btu+1 ft-1 s-1).
 * @return Thomas' (1963) flame length (ft+1).
 */

function flameLengthThomas$1(fli) {
  return fli <= 0 ? 0 : 0.2 * Math.pow(fli, 2 / 3);
} // Active crown fire heat per unit area,
// sum of the surface fire HPUA and the entire active canopy HPUA
// (i.e., the canopy load * canopy heat content,
// and NOT the canopy fuel model 10 HPUA)

function hpuaActive(surfHpua, cpyHpua) {
  return surfHpua + cpyHpua;
}
function isActive(transRatio, activeRatio) {
  return type(transRatio, activeRatio) === ACTIVE;
}
function isCrown(transRatio, activeRatio) {
  const fireType = type(transRatio, activeRatio);
  return fireType === ACTIVE || fireType === PASSIVE;
}
function isConditional(transRatio, activeRatio) {
  return type(transRatio, activeRatio) === CONDITIONAL;
}
function isPassive(transRatio, activeRatio) {
  return type(transRatio, activeRatio) === PASSIVE;
}
function isSurface(transRatio, activeRatio) {
  return type(transRatio, activeRatio) === SURFACE;
}
function isPlumeDominated(powerRatio) {
  return powerRatio >= 1;
}
function isWindDriven(powerRatio) {
  return powerRatio < 1;
}
/**
 * Calculate the crown fire length-to-width ratio given the 20-ft
 * wind speed (Rothermel 1991, Equation 10, p16).
 *
 * @param wspd20 Wind speed at 20-ft (ft+1 min-1).
 * @return The crown fire length-to-width ratio (ratio).
 */

function lengthToWidthRatio$1(wspd20) {
  return 1 + 0.125 * (wspd20 / 88); // Wind speed must be in miles per hour
}
/**
 * Calculate the Scott & Reinhardt 'crowning index' (O'active),
 * the 20-ft wind speed at which the crown canopy becomes fully available
 * for active fire spread (and the crown fraction burned approaches 1).
 *
 * @param cpyBulk Crown canopy bulk density (btu+1 ft-3).
 * @param crownRxi Crown fire (fuel model 10) reaction intensity (btu+1 ft-2 min-1).
 * @param crownSink Crown fire (fuel model 10) heat sink (btu+1 ft-3).
 * @param phis Slope coefficient (0 for crown fire)
 * @return The O`active wind speed (ft+1 min-1) or Infinity.
 */

function oActive(cpyBulk, crownRxi, crownSink, phis) {
  if (cpyBulk === 0 || crownSink === 0) return Infinity; // In native units

  const cbd = 16.0185 * cpyBulk; // Convert from lb/ft3 to kg/m3

  const ractive = 3.28084 * (3 / cbd); // R'active, ft/min

  const r10 = ractive / 3.34; // R'active = 3.324 * r10

  const pflux = 0.048317062998571636; // Fuel model 10 actual propagating flux ratio

  const ros0 = crownRxi * pflux / crownSink;
  if (ros0 - 1 - phis === 0) return Infinity;
  const windB = 1.4308256324729873; // Fuel model 10 actual wind factor B

  const windBInv = 1 / windB; // Fuel model 10 actual inverse of wind factor B

  const windK = 0.0016102128596515481; // Fuel model 10 actual K = C*pow((beta/betOpt),-E)

  const a = (r10 / ros0 - 1 - phis) / windK;
  if (a === 0) return Infinity;
  const uMid = Math.pow(a, windBInv);
  const u20 = uMid / 0.4;
  return u20;
}
/**
 * Crown fire perimeter per Rothermel (1991) equation 13 (p 16).
 *
 * @param dist Crown fire spread distance (ft+1)
 * @param lwr Crown fire length-to-width ratio
 * @return Crown fire perimeter (ft+1)
 */

function perimeter$1(dist, lwr) {
  return 0.5 * Math.PI * dist * (1 + 1 / lwr);
}
/**
 * Calculate the crown fire power-of-the-fire(ft+11 lb+1 ft-2 s-1).
 *
 * @param fliActive Crown fire active fireline intensity (Btu+1 ft-1 s-1).
 * @return Rothermel's power of the fire (ft+1 lb+1 ft-2 s-1).
 */

function powerOfTheFire(fliActive) {
  return fliActive / 129;
}
/**
 * Calculate the crown fire power-of-the-wind (ft+1 lb+1 ft-2 s-1).
 *
 * See Rothermel (1991) equations 6 & 7 (p 14).
 *
 * @param wspd20 Wind speed at 20-ft (ft+1 min-1).
 * @param rActive Actiuve crown fire spread rate (ft+1 min-1).
 * @return Rothermel's power of the wind (ft+1 lb+1 ft-2 s-1).
 */

function powerOfTheWind(wspd20, rActive) {
  // Difference must be in ft+1 s-1
  const diff = positive((wspd20 - rActive) / 60);
  return 0.00106 * diff * diff * diff;
}
/**
 * Calculate the active crown fire spread rate at head [Ractive] (ft+1 min-1)
 * given the corresponding standard fuel model 10 spread rate at head.
 *
 * This is the crown fire spread rate per Rothermel (1991), and which
 * Scott & Reinhardt term `Ractive`
 *
 * @param fm10Ros Standard fuel model 10 spread rate at head (ft+1 min-1).
 *
 * @return The spread rate at head (ft+1 min-1) of the active crown fire.
 */

function rActive(fm10ros) {
  return 3.34 * fm10ros;
}
/**
 * Scott & Reinhardt (2005) final spread rate based on FAH.
 *
 * @param rSurface
 * @param rActive
 * @param cfb Crown fraction burned (fraction).
 * @return float Final crown fire spread rate (ft+1 min-1)
 */

function rFinal(rSurface, rActive, cfb) {
  return rSurface + cfb * positive(rActive - rSurface);
}
/**
 * Calculate the critical surface fire spread rate (R'initiation)
 * sufficient to initiate a passive or active crown fire.
 *
 * This is Scott & Reinhardt (2001) equation 12 (p 13).
 *
 * @param critSurfFli Critical surface fireline intensity (btu_1 ft-1 s-1).
 * @param surfHpua Surface fire heat per unit area (Btu+1 ft-2).
 * @return Scott & Reinhardt's critical surface fire spread rate
 *  [R'initiation] (ft+1 min-1)
 */

function rInit(critSurfFli, surfHpua) {
  return surfHpua <= 0 ? 1.0e12 : 60 * critSurfFli / surfHpua;
}
/**
 * Calculate R'active, the critical crown (minimum) rate of spread for active crowning.
 *
 * Scott & Reinhardt (2001) equation 14, p 14.
 *
 * @param cpyBulk Crown canopy bulk density (lb+1 ft-3).
 * @return The critical crown fire spread rate (ft+1 min-1).
 */

function rPrimeActive(cpyBulk) {
  const cbdSi = 16.0184663678 * cpyBulk; // convert to Kg/m3

  const rosSi = cbdSi <= 0 ? 0 : 3 / cbdSi; // m/min

  const rosFpm = rosSi * 3.2808399; // return as ft/min

  return rosFpm;
}
/**
 * Scott & Reinhardt (2001) R'sa, the theoretical surface fire spread rate
 * when the 20-ft wind speed equals O'active
 *
 * @param oActive Critical open wind speed (ft+1 min-1) for sustaining fully active crown fire
 * @param surfRos0 Surface fire no-wind no-slope spread rate (ft+1 min-1)
 * @param surfWaf Surface fuel's wind speed adjustment factor to apply to oActive
 * @param surfWindB Surface fuel's wind factor B
 * @param surfWindK Surface fuel's wind factor K
 * @param surfPhiS Surface fuel's slope coefficient
 * @return R'sa The theoretical surface fire spread rate
 * when the 20-ft wind speed equals O'active
 */

function rSa(oActive, surfRos0, surfWaf, surfWindB, surfWindK, surfPhiS) {
  if (oActive === Infinity) return Infinity;
  const mwspd = surfWaf * oActive;
  const surfPhiW = mwspd <= 0 ? 0 : surfWindK * Math.pow(mwspd, surfWindB);
  return surfRos0 * (1 + surfPhiW + surfPhiS);
}
/**
 * Calculate the crown fire transition ratio.
 *
 * @param surfFli Actual surface fire fireline intensity (Btu+1 ft-1 s-1).
 * @param iInit Critical surface fire fireline intensity [I'initiation]
 * required to initiate active or passive crowning (Btu+1 ft-1 s-1).
 * @return Rothermel's crown fire transition ratio.
 */

function transitionRatio(surfFli, fliInit) {
  return fliInit <= 0 ? 0 : surfFli / fliInit;
}
/**
 * Calculate the final fire type.
 *
 *  <table>
 *    <tr>
 *      <td> Transition </td>
 *        <td colspan='2'> Active Ratio </td>
 *    </tr>
 *    <tr>
 *        <td> Ratio </td>
 *        <td> &lt 1 </td>
 *        <td> &gt = 1 </td>
 *    </tr>
 *    <tr>
 *        <td> &lt 1 </td>
 *        <td> 0 : Surface Fire </td>
 *        <td> 2 : Conditional Active Crown Fire </td>
 *    </tr>
 *    <tr>
 *        <td> &gt = 1 </td>
 *        <td> 1 : Passive Crown Fire </td>
 *        <td> 3 : Active Crown Fire </td>
 *    </tr>
 *  </table>
 *
 * @param transRatio The ratio of the surface fireline intensity to the
 * critical surface fireline intensity.
 * @param activeRatio The ratio of the active crown fire spread rate to the
 * critical crown fire spread rate
 * @return One of the following codes:
 *  - 'surface fire' indicates a surface fire with no torching or crowning
 *      (transition ratio < 1 && active ratio < 1)
 * - 'passive crown fire' indicates a passive/torching crown fire
 *      (transition ratio >= 1 && active ratio < 1)
 * - 'conditional surface fire' indicates a surface fire that could conditionally
 *      transition to an active crown fire
 *      (transition ratio < 1 && active ratio >= 1)
 * - 'active crown fire' indicates an active crown fire
 *      (transition ratio >= 1 && active ratio >= 1)
 */

function type(transRatio, activeRatio) {
  if (transRatio < 1) {
    return activeRatio < 1 ? SURFACE : CONDITIONAL;
  } else {
    // ( transRatio >= 1.0 )
    return activeRatio < 1 ? PASSIVE : ACTIVE;
  }
}

var CrownFire = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ACTIVE: ACTIVE,
  CONDITIONAL: CONDITIONAL,
  PASSIVE: PASSIVE,
  SURFACE: SURFACE,
  InitiationTypes: InitiationTypes,
  activeRatio: activeRatio,
  area: area$1,
  canTransition: canTransition,
  crownFractionBurned: crownFractionBurned,
  crowningIndex: crowningIndex,
  fliActive: fliActive,
  fliFinal: fliFinal,
  fliInit: fliInit,
  flameLengthThomas: flameLengthThomas$1,
  hpuaActive: hpuaActive,
  isActive: isActive,
  isCrown: isCrown,
  isConditional: isConditional,
  isPassive: isPassive,
  isSurface: isSurface,
  isPlumeDominated: isPlumeDominated,
  isWindDriven: isWindDriven,
  lengthToWidthRatio: lengthToWidthRatio$1,
  oActive: oActive,
  perimeter: perimeter$1,
  powerOfTheFire: powerOfTheFire,
  powerOfTheWind: powerOfTheWind,
  rActive: rActive,
  rFinal: rFinal,
  rInit: rInit,
  rPrimeActive: rPrimeActive,
  rSa: rSa,
  transitionRatio: transitionRatio,
  type: type
});

/**
 * @file Exported WFSP crown fire spotting distance functions as described by Albini (1998) and
 * as implemented by BehavePlus v6.
  * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/

/**
 * \brief Javascript implementation of "Program for predicting spotting distance
 * from an active crown fire in uniformly forested flat terrain", November 1998,
 * by Frank Albini.
 *
 * The following Javascript implementation was adopted from the MS FORTRAN source
 * code cited above and my 'dist2a.for' derivative (which is also the basis of the
 * C++ version in BehavePlus V6).
 */
function firebrandObjectPrototype() {
  return {
    zdrop: 0,
    xdrop: 0,
    xdrift: 0,
    xspot: 0,
    layer: 0
  };
}
/**
 * Calculates crown firebrand dropout altitude and distance,
 * drift distance, and total flat terrain spot distance.
 *
 * Thin wrapper around dist() that performs input/output
 * units conversions native to BPX.
 *
 * @param {real} canopyHt Average crown top height of forest cover (ft)
 * @param {real} crownFli Fire intensity (Btu/ft/s)
 * @param {real} ws20 Wind speed at canopy top, (ft/min)
 *
 * @return {object}
 *  zdrop: firebrand dropout plume coordinate height (ft)
 *  xdrop: firebrand dropout plume coordinate horizontal distance (ft)
 *  xdrift: firebrand down-wind drift horizontal distance (ft)
 *  xspot:  firebrand down-wind spotting distance on flat terrain (ft)
 *  layer: plume profile layer where dropout occurs
 */

function flatDistance(canopyHt, ws20, crownFli) {
  const fpm = 3.2808;
  const htop = canopyHt / fpm;
  const fikwpm = 3.46414 * crownFli; // Anemometer wind speed must be km/h

  const uan = 1.60934 * ws20 / 88; // Anemometer height (m)

  const anem = 6.096; // utop is wind speed in m/s

  const utop = windSpeedAtCanopyTop(htop, uan, anem);
  const diam = 1;
  const [z, x, drift, spot, layer] = dist(htop, fikwpm, utop, diam);
  return {
    zdrop: fpm * z,
    xdrop: fpm * x,
    xdrift: fpm * drift,
    xspot: fpm * spot,
    layer: layer
  };
}
/**
 * Simply returns the 'layer' property from the 'firebrand' object.
 *
 * @param {real} firebrandObj Object returned by flatDistance().
 * @return {int} Plume profile layer where dropout occurs
 */

function layer(firebrandObj) {
  return firebrandObj.layer;
}
/**
 * Simply returns the 'drift' property from the 'firebrand' object.
 *
 * @param {real} firebrandObj Object returned by flatDistance().
 * @return {real} Firebrand down-wind drift horizontal distance (ft)
 */

function xdrift(firebrandObj) {
  return firebrandObj.xdrift;
}
/**
 * Simply returns the 'xdrop' property from the 'firebrand' object.
 *
 * @param {real} firebrandObj Object returned by flatDistance().
 * @return {real} Firebrand dropout plume coordinate horizontal distance (ft)
 */

function xdrop(firebrandObj) {
  return firebrandObj.xdrop;
}
/**
 * Simply returns the 'spot' property from the 'firebrand' object.
 *
 * @param {real} firebrandObj Object returned by flatDistance().
 * @return {real} Firebrand down-wind spotting distance on flat terrain (ft)
 */

function xspot(firebrandObj) {
  return firebrandObj.xspot;
}
/**
 * Simply returns the 'zdrop' property from the 'firebrand' object.
 *
 * @param {real} firebrandObj Object returned by flatDistance().
 * @return {real} Firebrand dropout plume coordinate height (ft)
 */

function zdrop(firebrandObj) {
  return firebrandObj.zdrop;
}
/**
 * Adapted from Albini's MS FORTRAN PROGRAM DIST().
 *
 * @param {real} htop Average crown top height of forest cover (m)
 * @param {real} fikwpm Fire intensity (kW/m) (must be > 1000 kW/m)
 * @param {real} utop Wind speed at canopy top, (m/s)
 * @param {real} diam Firebrand diameter when it reaches the surface (mm)
 *
 * @return {array} [fbHeight, fbDist, fbDrift, flatSpotDist, layer], where
 *  dbHeight is the firebrand dropout plume coordinate height (m)
 *  dbDist is the firebrand dropout plume coordinate distance (m)
 *  dbDrift is the firebrand down-wind drift distance (m)
 *  flatSpotDist is the firebrand down-wind spotting distance on flat terrain (m)
 *  layer is the plume profile layer
 */

function dist(htop, fikwpm, utop, diam) {
  // flame = flame height above the canopy top (m)
  const flame = flameHeightAlbini(fikwpm, utop, htop);

  if (flame <= 0) {
    return [0, 0, 0, 0, 0];
  } // if (ido===2) fikwpm = fireIntensityAlbini(flame, utop, htop)
  // hf = normalized flame height above the canopy top (dl)


  const hf = flame / htop; // uc = normalized wind speed at the crown top

  const g = 9.82; // Acceleration of gravity, m / s^2

  const wn = Math.sqrt(g * htop);
  const uc = utop / wn; // dlosmm = ember diameter loss from the top of the plume till it hits the surface

  const dlosmm = 0.064 * htop; // Display inputs and intermediates derived so far:
  // console.log('Mean height of forest (htop)', htop, '(m)')
  // console.log('Mean wind speed at anemometer height', uan, '(km/h)')
  // console.log('Mean height of flame above tops', flame, '(m)')
  // console.log('Fire intensity [input or calculated]', fikwpm, '(kW/m)')
  // console.log('Anemometer height', anem, '(m)')
  // console.log('hf (flame ht / canopy ht)', hf, '(dl)')
  // console.log('utop (wind speed at crown top)', utop, '(dl)')
  // console.log('uc (normalized wind at crown top)', uc, '(dl)')
  // console.log('wn (sqrt( g * htop ))', wn)
  // console.log('Firebrand alighting diameter', diam, '(mm)')
  // console.log('dlosmm (Ember diam loss=0.064 * htop)', dlosmm, '(mm)')
  // dhitmm = ember diameter when it hits the ground (mm)

  const dhitmm = diam; // dtopmm = ember diameter when it reaches the top of the plume (mm)

  const dtopmm = dhitmm + dlosmm; // eta = 'safety factor' for firebrand diameter on impact (eta > 1.)

  const eta = dtopmm / dlosmm; // Determine firebrand dropout location within the plume.  Outputs are:
  //  zdrop = normalized vertical firebrand dropout altitude (dl) (m / htop)
  //  xdrop = corresponding dropout normalized distance down wind (dl) (m / htop)
  //  layer = plume layer where dropout occurs

  const [zdrop, xdrop, layer] = dropout(hf, uc, eta); // xdrift = normalized down wind drift distance (dl) (m / htop)

  const xdrift = drift(zdrop, eta, uc); // xspot = normalized total spotting distance on flat terrain (m / htop)

  const xspot = xdrop + xdrift; // Convert normalized distances to m

  const fbHeight = zdrop * htop;
  const fbDist = xdrop * htop;
  const fbDrift = xdrift * htop;
  const flatSpotDist = xspot * htop; // console.log('Plume Drop-out Layer', layer)
  // console.log('Normalized dropout altitude', zdrop, '(m / htop)')
  // console.log('Normalized dropout distance', xdrop, '(m / htop)')
  // console.log('Normalized drift distance', xdrift, '(m / htop)')
  // console.log('Firebrand Height', fbHeight, '(m)')
  // console.log('Firebrand Distance', fbDist, '(m)')
  // console.log('Firebrand Drift', fbDrift, '(m)')
  // console.log('Flat spot distance',  flatSpotDist, '(m)')

  return [fbHeight, fbDist, fbDrift, flatSpotDist, layer];
}
/**
 * According to Albini:
 * "Calculates normalized down wind drift distance, 'delx',
 * for a firebrand particle injected into log profile wind field at
 * normalized altitude 'zdrop' and entering the canopy with diameter
 * equal to 'eta' times that necessary to reach the surface."
 *
 * Adapted from Frank Albini's 'drift.for' FORTRAN source, SUBROUTINE DRIFT()
 *
 * @param {real} zdrop Normalized firebrand drop-out altitude (dl) (m / htop)
 * @param {real} eta Safety factor (eta>1)
 * @param {real} uc Normalized horizontal wind speed at crown top (dl)
 *
 * @return {real} Normalized down wind firebrand drift distance (m / htop)
 */

function drift(zdrop, eta, uc) {
  const f0 = 1 + 2.94 * zdrop;
  const f1 = Math.sqrt(eta / (eta + zdrop));
  const f2 = eta > 0.34 ? Math.sqrt(eta / (eta - 0.34)) : 0;
  const f3 = f1 > 0 ? f2 / f1 : 0;
  const f2log = f2 > 1 ? Math.log((f2 + 1) / (f2 - 1)) : 0;
  const f3log = f3 > 1 ? Math.log((f3 + 1) / (f3 - 1)) : 0;
  const F = f3 > 0 ? 1 + Math.log(f0) - f1 + (f3log - f2log) / f3 : 0;
  const xdrift = 10.9 * F * uc * Math.sqrt(zdrop + eta);
  return xdrift;
}
/**
 * Calculates firebrand drop-out altitude and distance
 *
 * @param {real} hf  Normalized flame height above the canopy top (dl)
 * @param {real} uc Normalized horizontal wind speed at crown top (dl)
 * @param {real} eta Safety factor (eta>1)
 *
 * @returns {array} [zdrop, xdrop, layer], where
 *  zdrop = normalized vertical firebrand dropout altitude (dl) (m / htop)
 *  xdrop = corresponding dropout normalized distance down wind (dl) (m / htop)
 *  layer = plume layer where dropout occurs
 */

function dropout(hf, uc, eta) {
  // Delta x-z iteration factor
  const ds = 0.2; // qfac = constant used to determine sufficient qreq at each layer

  const qfac = uc > 0 ? 0.00838 / (uc * uc) : 0; // Albini's tip()

  const rfc = 1 + 2.94 * hf;
  let fm = 0.468 * rfc * Math.log(rfc);
  const fmuf = 1.3765 * (hf + rfc * Math.log(rfc) ** 2);
  const uf = fmuf / fm;
  const ctn2f = rfc - 1 + rfc * Math.log(rfc) ** 2;
  const tang = 1.4 * hf / (uc * Math.sqrt(ctn2f));
  const ang = Math.atan(tang);
  const wf = tang * uf;
  const vf = Math.sqrt(uf * uf + wf * wf);
  const rhof = 0.6;
  const bf = fm / (rhof * vf); // end tip()

  let sing = Math.sin(ang);
  let cosg = Math.cos(ang);
  let delx = 0.5 * bf * sing;
  let delz = 0.5 * bf * cosg;
  const zc2 = hf;
  const xc2 = hf / Math.tan(ang);
  const fmf = fm;
  const tratf = 2 * fmf / 3;
  const fmadd = fm > 0 ? 0.2735 * fm : 0;
  const hfarg = 1 + 2.94 * hf;
  const fmuadd = 0.3765 * (hf + hfarg * Math.log(hfarg) ** 2);
  let fmw = fm * wf;
  const dmwfac = uc > 0 ? 2 * fmf / (3 * uc * uc) : 0;
  let w = wf;
  let V = vf;
  let z = hf;
  let x = xc2; // Level 1

  let q = 0.5 * rhof * wf * wf;
  let xb = delx;
  let zb = 0; // Level 2

  q = 0.5 * rhof * wf * wf;
  xb = xc2 + delx;
  zb = zc2 - delz;
  let zp = zb;
  let xp = xb;
  let layer = 2;
  let qreq = qfac * (zb + eta);

  if (q <= qreq) {
    // console.log('plume cannot lift a particle large enough to provide the "eta" saftey factor')
    return [0, 0, 0];
  }

  while (true) {
    layer += 1;
    const dx = ds * cosg;
    const dz = ds * sing;
    x = x + dx;
    z = z + dz;
    const zarg = 1 + 2.94 * z;
    fm = 0.34 * zarg * Math.log(zarg) + fmadd;
    const fmu = z + 0.34 * zarg * Math.log(zarg) ** 2 + fmuadd;
    const trat = 1 + tratf / fm;
    const u = fmu / fm;
    fmw = fmw + dmwfac / V * dz;
    w = fmw / fm;
    V = Math.sqrt(u * u + w * w);
    const b = fm * trat / V;
    sing = w / V;
    cosg = u / V;
    delx = 0.5 * b * sing;
    delz = 0.5 * b * cosg;
    xb = x + delx;
    zb = z - delz;
    q = 0.5 * w * w / trat;
    qreq = qfac * (zb + eta); // Compare with dist2a_plume.csv
    // console.log(k, q[k], xb[k], zb[k], ang, dx, dz, x, z, zarg)
    // fm, fmu, trat, u, fmw, w, V, b, sing, cosg, delx, delz)

    if (q < qreq) {
      return [zp, xp, layer - 1];
    }

    zp = zb; // store as previous layer value

    xp = xb; // store as previous layer value

    if (layer > 50000) {
      throw new Error('dropout() exceeded 50000 layers');
    }
  }
}
/**
 * Calculates crown fire intensity from average flame HEIGHT above canopy top
 * as per Albini's MS FORTRAN FUNCTION FINT().
 *
 * @param {real} flame  Average flame height above canopy top (m)
 * @param {real} utop Mean wind speed at canopy top height (m/s)
 * @param {real} htop Canopy top height (m)
 * @return {real} fint Fire intensity (kW/m)
 */

function fireIntensityAlbini(flame, utop, htop) {
  const y = htop > 0 ? 1 + 2.94 * flame / htop : 0;
  const con = y > 0 ? y * Math.log(y) : 0;
  return con * utop * htop / 7.791e-3;
}
/**
 * Calculates crown fire intensity from crown fire flame length
 * using Thomas equation.
 *
 * @param {real} flameLength Crown fire flame length (ft)
 * @return {real} Crown fire intensity (btu/ft/s)
 *  (multiply by 3.46414 to obtain kW/m)
 */

function firelineIntensityThomas(flameLength) {
  return flameLength <= 0 ? 0 : Math.pow(5 * flameLength, 3 / 2);
}
/**
 * Estimates crown fire average flame HEIGHT (not length) above canopy top (m)
 *
 * Adapted from Albini's MS FORTRAN FUNCTION HEIGHT().
 *
 * @param {real} fikwpm Fire intensity (kW/m) (must be > 1000 kW/m)
 * @param {real} utop  Mean wind speed at canopy top (m/s)
 * @param {real} htop Average crown top height of forest cover (m)
 * @return {real} Average height of flame above canopy top (m)
 */

function flameHeightAlbini(fikwpm, utop, htop) {
  if (htop * utop <= 0 || fikwpm < 1000) return 0;
  const con = 7.791e-3 * fikwpm / (utop * htop);
  let ylow = 1;
  let yhigh = Math.exp(con); // As 'con' approaches 780, 'yhigh' approaches Infinity,
  // which causes endless binary seach loop.  So cap it...
  // console.log(`Start flameHeightAlbini(): con=${con}, yhigh=${yhigh}`)

  if (yhigh === Infinity) {
    yhigh = Number.MAX_VALUE; // console.log(` RESET: con=${con}, yhigh=${yhigh}`)
  }

  let loop = 1;

  while (true) {
    const y = 0.5 * (ylow + yhigh);
    const test = y * Math.log(y);

    if (Math.abs(test - con) <= 1e-6) {
      const height = htop * (y - 1) / 2.94; // console.log(`Loop ${loop} ylow=${ylow}, yhigh=${yhigh}`)

      return height;
    }

    loop = loop + 1;

    if (loop > 10000) {
      // The following statement should never be executed, but still...
      throw new Error('flameHeightAlbini() binary search endless loop detected');
    }

    if (test >= con) yhigh = y;
    if (test < con) ylow = y;
  }
}
/**
 * Calculate crown fire flame length from crown fire intensity
 * using Thomas' equation.
 *
 * @param {real} fli Crown fire intensity (btu/ft/s)
 * @result {real} Crown fire flame length (ft)
 */

function flameLengthThomas(fli) {
  return fli <= 0 ? 0 : 0.2 * Math.pow(fli, 2 / 3);
}
/**
 * Estimates the mean wind speed at canopy top (m/s)
 *
 * Adapted from Albini's MS FORTRAN PROGRAM DIST() around statements 45 to 50
 *
 * @param {real} htop Average crown top height of forest cover (m)
 * @param {real} uan Measured wind speed at anemometer height (km/h)
 * @param {real} anem Height of measured wind speed (m)
 * @return {real} utop Mean wind speed at canopy top (m/s)
 */

function windSpeedAtCanopyTop(htop, uan, anem) {
  const zonh = htop > 0 ? anem / htop : 0;
  const fact = 1 + Math.log(1 + 2.94 * zonh);
  const utop = uan / (3.6 * fact);
  return utop;
}

var CrownSpotting = /*#__PURE__*/Object.freeze({
  __proto__: null,
  firebrandObjectPrototype: firebrandObjectPrototype,
  flatDistance: flatDistance,
  layer: layer,
  xdrift: xdrift,
  xdrop: xdrop,
  xspot: xspot,
  zdrop: zdrop,
  dist: dist,
  drift: drift,
  dropout: dropout,
  fireIntensityAlbini: fireIntensityAlbini,
  firelineIntensityThomas: firelineIntensityThomas,
  flameHeightAlbini: flameHeightAlbini,
  flameLengthThomas: flameLengthThomas,
  windSpeedAtCanopyTop: windSpeedAtCanopyTop
});

/**
 * @file DagNode updater methods that are handled internally by the Dag
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
function bind(value) {
  return value;
}
function config(value) {
  return value;
}
function dangler(value) {
  return value;
}
function fixed(value) {
  return value;
}
function input(value) {
  return value;
}
function link(value) {
  return value;
}
/**
 * Callback for Dag.setModule()
 *
 * Notes:
 * - module() is called via Dag.setModules() -> DagDna.setModules() -> DagSetRun.setModules()
 * - The Module values have already been set before module() is called
 * - module() should enabled/disable Nodes and set Link Nodes as appropriate
 * - After returning from module(), DagSetRun.setModules() calls config()
 *
 * @param {Dag} dag  Reference to the DagDna instance
 * @param {string} mode 'cascade', 'independent', or 'none'
 *
 * In 'independent' mode, any two modules are ALWAYS and ONLY linked WHEN they are both active.
 * Thus, if both surfaceFire and crownFire are activate, they are also linked.
 * If crownSpot is then also activated, it is also linked to crownFire and then surfaceFire.
 * This forces the client to select all active modules, just as for BehavePlus for Windows.
 *
 * If mode is 'none', then links are set just like any other configure Node.
 * For example, if the client selects the flanking spread rate, the 'link.fireEllipse'
 * configuration Node becomes 'required', and the client may then choose between
 * 'linkedToSurfaceFire' or 'standAlone'.
 */

function module(dag, mode) {
  if (mode === 'independent') {
    moduleIndependent(dag);
  }
}

function moduleIndependent(dag) {
  const modules = [['surfaceFire', ['surface.primary', 'surface.secondary', 'surface.weighted'], null], ['surfaceSpot', ['spotting.surfaceFire'], 'surfaceFire'], ['crownFire', ['crown.'], 'surfaceFire'], ['crownSpot', ['spotting.crownFire.'], 'crownFire'], ['fireEllipse', ['surface.fire.ellipse.'], 'surfaceFire'], ['fireContain', ['contain'], 'fireEllipse'], ['scorchHeight', ['scorch.'], 'surfaceFire'], ['treeMortality', ['mortality.'], 'scorchHeight'], ['spotting', ['spotting.burningPile', 'spotting.torchingTrees'], null], ['ignitionProbability', ['ignition.'], null]];
  modules.forEach(([name, prefixes, linkName]) => {
    const modNode = dag.get('module.' + name); // *this* module Node

    const active = modNode.value === 'active'; // Set up possible linkage

    if (linkName) {
      const linkNode = dag.get('link.' + name);
      linkNode.value = 'standAlone';

      if (active) {
        const linkMod = dag.get('module.' + linkName);

        if (linkMod.value === 'active') {
          // if there is a link module and its active
          linkNode.value = 'linkedTo' + linkName.charAt(0).toUpperCase() + linkName.slice(1); // link to it
        }
      }
    } // Enable/disable this module's Nodes


    prefixes.forEach(prefix => {
      dag.node.forEach(node => {
        if (node.key.startsWith(prefix)) node.isEnabled = active;
      });
    });
  });
}

var Dag$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  bind: bind,
  config: config,
  dangler: dangler,
  fixed: fixed,
  input: input,
  link: link,
  module: module
});

/**
 * @file Fire ellipse functions as described by Albini (1998) and
 * as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Calculate the fire ellipse area given its major axis length and
 * length-to-width ratio as per Rothermel (1991) equation 11 on page 16
 * (which ignores backing distance).
 *
 * @param len Total fire ellipse length (arbitrary distance unbits-of-measure).
 * @param lwr Fire ellipse length-to-width ratio (ratio).
 * @return Fire ellipse area (in same distance unitsof-measure as length squared).
 */

function area(len, lwr) {
  return divide(Math.PI * len * len, 4 * lwr);
}
/**
 *  Calculate the fire spread rate (ft+1 min-1) at the ellipse back
 *  given the fire spread rate at ellipse head and fire ellipse length-to-width ratio.
 *
 *  NOTE this differs from FireSpread::spreadRateAtBack() which takes the
 *  length-to-width ratio as the second parameter, rather than ellipse eccentricity.
 *
 * @param spreadRateAtHead Fire spread rate at ellipse head (ft+1 min-1).
 * @param eccentricity Fire ellipse eccentricity (ratio).
 *
 * @return float The fire spread rate at the ellipse back (ft+1 min-1).
 */

function backingSpreadRate(rosHead, eccent) {
  return rosHead * divide(1 - eccent, 1 + eccent);
}
/**
 * Calculate the fire spread rate at 'beta' degrees from the fire ignition point-to-head vector.
 *
 * This calculates the fire spread rate at `beta` degrees from its *point of ignition*,
 * which *is not* the fire rate at `psi` degrees from the center of the ellipse.
 *
 * NOTE this differs from FireSPread::spreadRateATBeta(), which takes the ellipse
 * length-to-width ratio as its second argument.
 *
 * @param betaHead Fire spread vector of interest (degrees clockwise from heading direction).
 * @param rosHead Fire spread rate at the head (ft+1 min-1).
 * @param eccent Fire ellipse eccentricity (ratio).
 *
 * @return float The fire spread rate along the specified vector (ft+1 min-1).
 */

function betaSpreadRate(betaHead, rosHead, eccent) {
  let rosBeta = rosHead; // Calculate the fire spread rate in this azimuth
  // if it deviates more than a tenth degree from the maximum azimuth

  if (Math.abs(betaHead) > 0) {
    const rad = radians(betaHead);
    rosBeta = rosHead * (1 - eccent) / (1 - eccent * Math.cos(rad));
  }

  return rosBeta;
}
/**
 * Calculate the fire ellipse eccentricity.
 *
 * @param float lwr Fire ellipse length-to-width ratio.
 * @return float The fire ellipse eccentricity (ratio).
 */

function eccentricity(lwr) {
  const x = lwr * lwr - 1;
  return x <= 0 || lwr <= 0 ? 0 : Math.sqrt(x) / lwr;
}
/**
 * Calculate the fire ellipse expansion rate at the flank.
 *
 * NOTE this differs from backingSpreadRate(), which takes two arguments,
 * the spread rate at head and the ellipse length-to-width ratio.
 *
 * @param rosMinor Fire ellipse expansion rate at its widest point
 * (in arbitrary velocity units-of-measure).
 *
 * @return The fire ellipse spread rate at the flank
 *  (in the same arbitrary velocity units-of-measure as minorAxisExpansionRate).
 */

function flankingSpreadRate(rosMinor) {
  return 0.5 * rosMinor;
}
/**
 * Calculate the fire ellipse distance or rate at `F`.
 *
 * @param rosMajor Fire ellipse major axis spread rate or length
 *  (in arbitrary distance or velocity units-of-measure).
 * @return Fire ellipse `F` used to determine spread rates at arbitrary psi.
 */

function fSpreadRate(rosMajor) {
  return 0.5 * rosMajor;
}
/**
 * Calculate the fire ellipse distance or rate at `G`.
 *
 * @param rosMajor Fire ellipse major axis spread rate or length
 *  (in arbitrary distance or velcoity units-of-measure).
 *
 * @param rosBack Portion of the total major axis rate or distance
 *  attributable to the backing rate or distance (in the same atbitrary
 *  distance or velcoity units-of-measure as majorAxisRateOrDistance).
 *
 * @return Fire ellipse `G` used to determine spread rates at arbitrary psi.
 */

function gSpreadRate(rosMajor, rosBack) {
  return 0.5 * rosMajor - rosBack;
}
/**
 * Calculate the fire ellipse distance or rate at `H`.
 *
 * @param rosMinor Fire ellipse minor axis spread rate or length
 *  (in arbitrary distance or velcoity units-of-measure).
 *
 * @return Fire ellipse `H` used to determine spread rates at arbitrary psi.
 */

function hSpreadRate(rosMinor) {
  return 0.5 * rosMinor;
}
/*! \brief Caluclate the fireline intensity at some azimuth.
 */

function fliAtAzimuth(fliHead, rosHead, rosAz) {
  return positive(divide(fliHead * rosAz, rosHead));
}
/**
 * Calculate the fire ellipse expansion rate along its major axis.
 *
 * @param rosHead Fire spread rate at the head of the ellipse
 *  (in arbitrary velocity units-of-measure).
 *
 * @param rosBack Fire spread rate at the back of the ellipse
 *  (in the same velocity units-of-measure as spreadRateAtHead).
 *
 * @return The fire ellipse expansion rate along its major axis
 *  (in the same velocity units-of-measure as spreadRateAtHead).
 */

function majorSpreadRate(rosHead, rosBack) {
  return rosHead + rosBack;
}
/**
 * Calculate the fire ellipse expansion rate along its minor axis.
 *
 * @param majorAxisRos Fire ellipse expansion rate along its major axis
 * (in arbitrary velocity units-of-measure).
 *
 * @param lwr The fire ellipse length-to-width ratio.
 *
 * @return The fire ellipse expansion rate along its mino axis
 * (in the same arbitrary velocity units-of-measure as majorAxisExpansionRate).
 */

function minorSpreadRate(rosMajor, lwr) {
  return positive(divide(rosMajor, lwr));
} // Map area

function mapArea(area, mapScale) {
  return positive(divide(area, mapScale * mapScale));
}
/**
 *  Calculate the fire ellipse perimeter from its length and width.
 *
 * @param len Fire ellipse length (arbitrary distance units-of-measure).
 * @param wid Fire ellipse width (arbitrary distance units-of-measure).
 *
 * @return float The fire ellipse perimeter (in same distance units-of-measure as length).
 */

function perimeter(len, wid) {
  const a = 0.5 * len;
  const b = 0.5 * wid;
  const xm = a + b <= 0 ? 0 : (a - b) / (a + b);
  const xk = 1 + xm * xm / 4 + xm * xm * xm * xm / 64;
  return Math.PI * (a + b) * xk;
}
function psiFromTheta(thetaFromHead, rosF, rosH) {
  if (rosF <= 0 || rosH <= 0 || thetaFromHead <= 0) {
    return 0;
  }

  const thetaRadians = radians(thetaFromHead);
  const tanPsiRadians = Math.tan(thetaRadians) * rosF / rosH;
  let psiRadians = Math.atan(tanPsiRadians); // psiRadians += ( psiRadians < 0) ? pi : 0
  // psiradians += ( thetaRadians > pi) ? pi : 0
  // Quadrant adjustment

  if (thetaRadians <= 0.5 * Math.PI) ; else if (thetaRadians > 0.5 * Math.PI && thetaRadians <= 1.5 * Math.PI) {
    psiRadians += Math.PI;
  } else if (thetaRadians > 1.5 * Math.PI) {
    psiRadians += 2 * Math.PI;
  } // Convert psi radians to degrees


  return degrees(psiRadians);
}
/**
 * Calculate the fire spread rate at 'psi' degrees from the fire ellipse center-to-head vector.
 *
 * This calculates the fire spread rate at `psi` degrees from its *ellipse center* to the ellipse head,
 * which *is not* the fire rate at `beta` degrees from the point of ignition.
 *
 * @param psiHead The fire spread vector of interest (degrees clockwise from heading direction).
 * @param rosF Fire ellipse expansion rate (ft+1 min-1) at ellipse point F.
 * @param rosG Fire ellipse expansion rate (ft+1 min-1) at ellipse point G.
 * @param rosH Fire ellipse expansion rate (ft+1 min-1) at ellipse point H.
 *
 *  @return The fire spread rate along the specified vector (ft+1 min-1).
 */

function psiSpreadRate(psiHead, rosF, rosG, rosH) {
  let rosPsi = 0;

  if (rosF * rosG * rosH > 0) {
    const radians$1 = radians(psiHead);
    const cosPsi = Math.cos(radians$1);
    const cos2Psi = cosPsi * cosPsi;
    const sin2Psi = 1 - cos2Psi;
    const term1 = rosG * cosPsi;
    const term2 = rosF * rosF * cos2Psi;
    const term3 = rosH * rosH * sin2Psi;
    rosPsi = term1 + Math.sqrt(term2 + term3);
  }

  return rosPsi;
}
/**
 * Calculate the distance given the velocity and elapsed time.
 *
 * @param rate Velocity
 * @param time Elapsed time
 * @return Distance traveled
 */

function spreadDistance(rate, time) {
  return rate * time;
}
function thetaFromBeta(betaHead, rosF, rosG, rosH) {
  if (rosF <= 0 || rosH <= 0) {
    return 0;
  }

  const betaRadians = radians(betaHead);
  const cosBeta = Math.cos(betaRadians);
  const cos2Beta = cosBeta * cosBeta;
  const sin2Beta = 1 - cos2Beta;
  const f2 = rosF * rosF;
  const g2 = rosG * rosG;
  const h2 = rosH * rosH;
  const term = Math.sqrt(h2 * cos2Beta + (f2 - g2) * sin2Beta);
  const num = rosH * cosBeta * term - rosF * rosG * sin2Beta;
  const denom = h2 * cos2Beta + f2 * sin2Beta;
  const cosThetaRadians = num / denom;
  let thetaRadians = Math.acos(cosThetaRadians); // Quadrant adjustment

  if (betaRadians < Math.PI) ; else if (betaRadians >= Math.PI) {
    thetaRadians = 2 * Math.PI - thetaRadians;
  } // Convert theta radians to degrees


  let thetaHead = degrees(thetaRadians);

  if (betaHead > 180) {
    thetaHead = 360 - thetaHead;
  }

  return thetaHead;
} // //--------------------------------------------------------------------------
// /** \brief Updates beta wrt head from theta.
//  *
//  * Calculate the degrees from the fire ignition point given the degrees
//  * from the ellipse center and some ellipse paramaters.
//  *
//  * @param theta Azimuth from the ellipse center wrt the fire head
//  * @param rosF spread rate at F
//  * @param rosG spread rate at G
//  * @param rosH spread rate at H
//  * @returns The azimuth from the fire ignition point.
//  */
// export function betaFromTheta( theta, rosF, rosG, rosH) {
//   const thetaRadians = Compass.radians(theta)
//   const num = rosH * Math.sin( thetaRadians)
//   const denom = rosG + rosF* Math.cos(thetaRadians)
//   let betaRadians = ( denom <= 0 ) ? 0 : Math.atan( num / denom )
//   // Quandrant adjustment
//   const boundary1 = 150
//   const boundary2 = 210
//   if (theta <= boundary1) {
//     // no adjustment required
//   } else if (theta > boundary1 && theta <= boundary2) {
//     betaRadians += Math.PI
//   } else if (theta > boundary2) {
//     betaRadians += 2.0 * Math.PI
//   }
//   // Convert beta radians to degrees
//   return Compass.degrees(betaRadians)
// }
// export function thetaFromPsi( psiHead, rosF, rosH ) {
//   if ( rosF <= 0 ) {
//     return 0.0
//   }
//   const tanThetaRadians = Math.tan( psiHead ) * rosH / rosF
//   let thetaRadians = Math.atan( tanThetaRadians )
//   // Quadrant adjustment
//   if ( psiRadians <= 0.5 * Math.PI ) {
//     // no adjustment
//   } else if ( psiRadians > 0.5 * Math.PI && psiRadians <= 1.5 * Math.PI ) {
//     thetaRadians += Math.PI
//   } else if ( psiRadians > 1.5 * Math.PI ) {
//     thetaRadians += 2 * Math.PI
//   }
//   //thetaRadians += ( thetaRadians < 0. || psiradians > pi ) ? pi : 0.
//   // Convert theta radians to degrees
//   thetaDegrees = Compass.degrees( thetaRadians )
//   return thetaRadians
// }

var FireEllipse = /*#__PURE__*/Object.freeze({
  __proto__: null,
  area: area,
  backingSpreadRate: backingSpreadRate,
  betaSpreadRate: betaSpreadRate,
  eccentricity: eccentricity,
  flankingSpreadRate: flankingSpreadRate,
  fSpreadRate: fSpreadRate,
  gSpreadRate: gSpreadRate,
  hSpreadRate: hSpreadRate,
  fliAtAzimuth: fliAtAzimuth,
  majorSpreadRate: majorSpreadRate,
  minorSpreadRate: minorSpreadRate,
  mapArea: mapArea,
  perimeter: perimeter,
  psiFromTheta: psiFromTheta,
  psiSpreadRate: psiSpreadRate,
  spreadDistance: spreadDistance,
  thetaFromBeta: thetaFromBeta
});

/**
 * @file Fuel bed equations as described by Rothermel (1972) and as implemented by BehavePlus V6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Calculate the 'live' fuel category moisture content of extinction.
 *
 * @param real mextk The 'live' fuel category moisture content of extinction factor (ratio).
 * @param real dfmc The 'dead' fuel category fine moisture content (ratio).
 * @param real dmext The 'dead' category moisture content of extinction (ratio).
 * @return real The 'live' fuel category  moisture content of extinction (ratio).
 */

function extinctionMoistureContent(mextk, dfmc, dmext) {
  const dry = 1 - divide(dfmc, dmext);
  const lmext = mextk * dry - 0.226;
  return Math.max(lmext, dmext);
}
/**
 * Calculate the 'live' fuel category moisture content of extinction factor.
 *
 * This factor is constant for a fuel bed, and represents the ratio
 * of dead-to-live fuel mass that must be raised to ignition.  It
 * is the method described by Rothermel (1972) on page 35 that was
 * subsequently refined in BEHAVE and BehavePlus to use the
 * effective fuel load and effective heating number to determine
 * the ratio of fine dead to fine live fuels.
 *
 * See Rothermel (1972) eq 88 on page 35.
 *
 * @param float defl The 'dead' fuel catagory total fine fuel load (lb+1 ft-2).
 * @param float lefl The 'live' fuel catagory total fine fuel load (lb+1 ft-2).
 *
 * @return float The 'live' fuel category moisture content of extinction factor.
 */

function extinctionMoistureContentFactor(defl, lefl) {
  return 2.9 * divide(defl, lefl);
}
/**
 * Calculate the fire heat per unit area.
 *
 * @param real rxi Fire reaction intensity (btu+1 ft-2 min-1).
 * @param real taur The fire/flame residence time (min+1).
 * @return The heat per unit area (btu+1 ft-2).
 */

function heatPerUnitArea(rxi, taur) {
  return rxi * taur;
}
/**
 *
 * @param float qig Fuel bed heat of pre-ignition (btu+1 lb-1)
 * @param float bulk Fuel bed bulk density (lb+1 ft-3)
 * @return float Fuel bed heat sink (btu+1 ft-3)
 */

function heatSink(qig, bulk) {
  return qig * bulk;
}
/**
 * Calculate the dead or live category mineral damping coefficient.
 *
 * @param float lifeCategoryEffectiveMineralContent
 * @return float Dead or live fuel category mineral damping coefficient.
 */

function mineralDamping(seff) {
  const etas = seff <= 0 ? 1 : 0.174 / seff ** 0.19;
  return fraction(etas);
}
/**
 * Calculate the dead or live life category moisture damping coefficient.
 *
 * @param mois Life fuel category moisture content (ratio).
 * @param mext Life fuel category moisture content of extinction (ratio).
 * @return The life fuel category moisture damping coefficient (fraction).
 */

function moistureDamping(mois, mext) {
  const r = divide(mois, mext);
  return fraction(1 - 2.59 * r + 5.11 * r * r - 3.52 * r * r * r);
}
/**
 * Calculate the no-wind no-slope fire spread rate.
 *
 * @param real rxi The total fire reaction intensity (btu+1 ft-2 min-1).
 * @param real pflx The fuel bed propagating flux ratio (ratio).
 * @param real sink The fuel bed heat sink (btu+1 ft-3).
 * @return The no-wind no-slope fire spread rate (ft+1 min-1).
 */

function noWindNoSlopeSpreadRate(rxi, pflx, sink) {
  return positive(divide(pflx * rxi, sink));
}
/**
 * Calculate the open-canopy midflame wind speed adjustment factor.
 *
 * @param fuelDepth Fuel bed depth (ft+1)
 * @return Wind speed adjustment factor
 */

function openWindSpeedAdjustmentFactor(fuelDepth) {
  const f = Math.min(6, Math.max(fuelDepth, 0.1));
  return 1.83 / Math.log((20 + 0.36 * f) / (0.13 * f));
}
/**
 * Calculate the fuel bed optimum packing ratio (fraction).
 *
 * See Rothermel (1972) eq 37 (p 19, 26) and eq 69 (p32).
 *
 * @param float bedSavr Fuel bed surface area-to-volume ratio (ft-1).
 * @return float The fuel bed optimum packing ratio (fraction).
 */

function optimumPackingRatio(savr) {
  return savr <= 0 ? 0 : 3.348 / savr ** 0.8189;
}
function packingRatio(deadPprc, livePprc, depth) {
  return divide(deadPprc + livePprc, depth);
}
/**
 * Calculate the no-wind propagating flux ratio (ratio).
 *
 * The propagating flux is the numerator of the Rothermel (1972) spread
 * rate equation 1 and has units of heat per unit area per unit time.
 *
 * See Rothermel (1972) eq 42 (p 20, 26) and eq 76 (p32).
 *
 * @param float savr The fuel bed characteristic surface area-to-volume ratio (ft-1).
 * @param float beta The fuel bed packing ratio (ratio).
 * @return float The fuel bed no-wind propagating flux ratio (ratio).
 */

function propagatingFluxRatio(savr, beta) {
  return savr <= 0 ? 0 : Math.exp((0.792 + 0.681 * Math.sqrt(savr)) * (beta + 0.1)) / (192 + 0.2595 * savr);
}
/**
 * Calculate the life fuel category reaction intensity without moisture damping.
 *
 * @param float rxvo Fuel bed optimum reaction velocity (min-1).
 * @param float wnet Life fuel category net ovendry fuel load (lb+1 ft-2).
 * @param float heat Life fuel category heat of combustion (btu+1 lb-1).
 * @param float etas Life fuel category mineral damping coefficient (fraction).
 * @return float The life fuel category reaction intensity (btu+1 ft-2 min-1)
 *      without moisture damping.
 */

function reactionIntensityDry(rxvo, wnet, heat, etas) {
  return rxvo * wnet * heat * etas;
}
/**
 * Calculate the fuel bed reaction velocity exponent 'A'.
 *
 * This is an arbitrary variable 'A'  used to derive the
 * fuel bed optimum reaction velocity.
 * See Rothermel (1972) eq 39 (p19, 26) and 67 (p 31).
 *
 * @param float savr Fuel bed surface area-to-volume ratio (ft-1).
 * @return float Fuel bed reaction velocity exponent 'A' (ratio).
 */

function reactionVelocityExponent(savr) {
  return savr <= 0 ? 0 : 133 / savr ** 0.7913;
}
/**
 * Calculate the fuel bed maximum reaction velocity (min-1).
 *
 * See Rothermel (1972) eq 36 (p 19, 26) and 68 (p 32).
 *
 * @param float bedSavr Fuel bed surface area-to-volume ratio (ft-1).
 * @return float Fuel bed maximum reaction velocity (min-1).
 */

function reactionVelocityMaximum(sv15) {
  return sv15 <= 0 ? 0 : sv15 / (495 + 0.0594 * sv15);
}
/**
 * Calculate the fuel bed optimum reaction velocity (min-1).
 *
 * See Rothermel (1972) eq 38 (p 19, 26) and eq 67 (p 31).
 *
 * @param float betr Fuel bed packing ratio ratio (ratio).
 * @param float rxvm Fuel bed maximum reaction velocity (min-1).
 * @param float rxve Fuel bed reaction velocity exponent 'A' (ratio).
 * @return float Fuel bed optimum reaction velocity (min-1).
 */

function reactionVelocityOptimum(betr, rxvm, rxve) {
  return betr <= 0 || betr === 1 ? 0 : rxvm * betr ** rxve * Math.exp(rxve * (1 - betr));
} // DEPRECATED - The size class surface area calculations are now done inside swtg()
// Accumulate fuel particle surface area by size class
// for fuel particles with size class idx
// export function scArea(idx, s1, a1, s2, a2, s3, a3, s4, a4, s5, a5) {
//   let area = 0
//   area += (idx === s1) ? a1 : 0
//   area += (idx === s2) ? a2 : 0
//   area += (idx === s3) ? a3 : 0
//   area += (idx === s4) ? a4 : 0
//   area += (idx === s5) ? a5 : 0
//   return area
// }

/**
 * Calculate the often-used intermediate parameter of the fuel bed's
 * characteristics surface area-to-volume ratio raised to the 1.5 power.
 *
 * @param float savr Fuel bed characteristic surface area-to-volume ratio (ft-1).
 * @return float Fuel bed parameter (ratio).
 */

function savr15(savr) {
  return savr ** 1.5;
}
/**
 * Calculate the fuel bed slope coeffient `phiS` slope factor.
 *
 * This factor is an intermediate parameter that is constant for a fuel bed,
 * and used to determine the fire spread slope coefficient `phiS`.
 *
 * See Rothermel (1972) eq 51 (p 24, 26) and eq 80 (p 33).
 *
 * @param float packingRatio Fuel bed packing ratio (ratio).
 * @return float Factor used to derive the slope coefficient `phiS' (ratio).
 */

function slopeK(beta) {
  return beta <= 0 ? 0 : 5.275 * beta ** -0.3;
} // Returns an array of 6 size class area weighting factors

function sizeClassWeightingFactorArray(a1, s1, a2, s2, a3, s3, a4, s4, a5, s5) {
  const a = [a1, a2, a3, a4, a5];
  const s = [s1, s2, s3, s4, s5];
  let tarea = 0.0;
  const scar = [0, 0, 0, 0, 0, 0];

  for (let idx = 0; idx < 5; idx += 1) {
    scar[s[idx]] += a[idx];
    tarea += a[idx];
  }

  const scwt = [0, 0, 0, 0, 0, 0];

  if (tarea > 0.0) {
    for (let idx = 0; idx < 6; idx += 1) {
      scwt[idx] = scar[idx] / tarea;
    }
  }

  return scwt;
}
/**
 * Calculate the fuel bed flame residence time.
 *
 * \TODO find reference
 *
 * @param float savr Fuel bed surface area-to-volume ratio (ft-1).
 * @return float Fuel bed flame residence time (min+1).
 */

function taur$1(savr) {
  return savr <= 0 ? 0 : 384 / savr;
}
/**
 * Calculate the fuel bed wind coefficient `phiW` correlation factor `B`.
 *
 * This factor is an intermediate parameter that is constant for a fuel bed,
 * and is used to derive the fire spread wind coefficient `phiW`.
 *
 * See Rothermel (1972) eq 49 (p 23, 26) and eq 83 (p 33).
 *
 * @param float savr Fuel bed characteristic surface area-to-volume ratio (ft-1).
 * @return float Wind coefficient `phiW` correlation parameter `B` (ratio).
 */

function windB(savr) {
  return 0.02526 * savr ** 0.54;
}
/**
 * Calculate the fuel bed wind coefficient `phiW` correlation factor `C`.
 *
 * This factor is an intermediate parameter that is constant for a fuel bed,
 * and is used to derive the fire spread wind coefficient `phiW`.
 *
 * See Rothermel (1972) eq 48 (p 23, 26) and eq 82 (p 33).
 *
 * @param float savr Fuel bed characteristic surface area-to-volume ratio (ft-1).
 * @return float Wind coefficient `phiW` correlation parameter `C` (ratio).
 */

function windC(savr) {
  return 7.47 * Math.exp(-0.133 * savr ** 0.55);
}
/**
 * Calculate the fuel bed wind coefficient `phiW` correlation factor `E`.
 *
 * This factor is an intermediate parameter that is constant for a fuel bed,
 * and is used to derive the fire spread wind coefficient `phiW`.
 *
 * See Rothermel (1972) eq 50 (p 23, 26) and eq 82 (p 33).
 *
 * @param float savr Fuel bed characteristic surface area-to-volume ratio (ft-1).
 * @return float Wind coefficient `phiW` correlation parameter `E` (ratio).
 */

function windE(savr) {
  return 0.715 * Math.exp(-0.000359 * savr);
}
/**
 * Calculate the fuel bed wind coeffient `phiW` wind factor.
 *
 * This factor is an intermediate parameter that is constant for a fuel bed,
 * and used to determine the fire spread wind coefficient `phiW`.
 *
 * See Rothermel (1972) eq 47 (p 23, 26) and eq 79 (p 33).
 *
 * @param float betr Fuel bed packing ratio (ratio).
 * @param float wnde The fuel bed wind coefficient `phiW` correlation factor `E`.
 * @param float wndc The fuel bed wind coefficient `phiW` correlation factor `C`.
 * @return float Factor used to derive the wind coefficient `phiW' (ratio).
 */

function windK(betr, wnde, wndc) {
  return betr <= 0 ? 0 : wndc * betr ** -wnde;
}
/**
 * Calculate the fuel bed wind coeffient `phiW` inverse K wind factor.
 *
 * This factor is an intermediate parameter that is constant for a fuel bed,
 * and used to determine the fire spread wind coefficient `phiW`.
 *
 * It is the inverse of the wind factor 'K', and is used to re-derive
 * effective wind speeds within the BEHAVE fire spread computations.
 *
 * See Rothermel (1972) eq 47 (p 23, 26) and eq 79 (p 33).
 *
 * @param float betr Fuel bed packing ratio ratio (ratio).
 * @param float wnde The fuel bed wind coefficient `phiW` correlation factor `E`.
 * @param float wndc The fuel bed wind coefficient `phiW` correlation factor `C`.
 * @return float Factor used to derive the wind coefficient `phiW' (ratio).
 */

function windI(betr, wnde, wndc) {
  return betr <= 0.0 || wndc <= 0 ? 0 : betr ** wnde / wndc;
}
function windSpeedAdjustmentFactor(fuelSheltered, shelteredWaf, openWaf) {
  return fuelSheltered ? Math.min(shelteredWaf, openWaf) : openWaf;
}

var FuelBed = /*#__PURE__*/Object.freeze({
  __proto__: null,
  extinctionMoistureContent: extinctionMoistureContent,
  extinctionMoistureContentFactor: extinctionMoistureContentFactor,
  heatPerUnitArea: heatPerUnitArea,
  heatSink: heatSink,
  mineralDamping: mineralDamping,
  moistureDamping: moistureDamping,
  noWindNoSlopeSpreadRate: noWindNoSlopeSpreadRate,
  openWindSpeedAdjustmentFactor: openWindSpeedAdjustmentFactor,
  optimumPackingRatio: optimumPackingRatio,
  packingRatio: packingRatio,
  propagatingFluxRatio: propagatingFluxRatio,
  reactionIntensityDry: reactionIntensityDry,
  reactionVelocityExponent: reactionVelocityExponent,
  reactionVelocityMaximum: reactionVelocityMaximum,
  reactionVelocityOptimum: reactionVelocityOptimum,
  savr15: savr15,
  slopeK: slopeK,
  sizeClassWeightingFactorArray: sizeClassWeightingFactorArray,
  taur: taur$1,
  windB: windB,
  windC: windC,
  windE: windE,
  windK: windK,
  windI: windI,
  windSpeedAdjustmentFactor: windSpeedAdjustmentFactor
});

/**
 * @file Fuel catalog accessors.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
const Domains = ['behave', 'chaparral', 'palmettoGallberry', 'westernAspen'];
/**
 * Map of fuel model aliases
 */

const Alias = new Map([['0', '0'], [0, '0'], ['none', '0'], ['rock', '0'], ['water', '0'], ['1', '1'], [1, '1'], ['2', '2'], [2, '2'], ['3', '3'], [3, '3'], ['4', '4'], [4, '4'], ['5', '5'], [5, '5'], ['6', '6'], [6, '6'], ['7', '7'], [7, '7'], ['8', '8'], [8, '8'], ['9', '9'], [9, '9'], ['10', '10'], [10, '10'], ['11', '11'], [11, '11'], ['12', '12'], [12, '12'], ['13', '13'], [13, '13'], ['101', '101'], [101, '101'], ['gr1', '101'], ['102', '102'], [102, '102'], ['gr2', '102'], ['103', '103'], [103, '103'], ['gr3', '103'], ['104', '104'], [104, '104'], ['gr4', '104'], ['105', '105'], [105, '105'], ['gr5', '105'], ['106', '106'], [106, '106'], ['gr6', '106'], ['107', '107'], [107, '107'], ['gr7', '107'], ['108', '108'], [108, '108'], ['gr8', '108'], ['109', '109'], [109, '109'], ['gr9', '109'], ['121', '121'], [121, '121'], ['gs1', '121'], ['122', '122'], [122, '122'], ['gs2', '122'], ['123', '123'], [123, '123'], ['gs3', '123'], ['124', '124'], [124, '124'], ['gs4', '124'], ['141', '141'], [141, '141'], ['sh1', '141'], ['142', '142'], [142, '142'], ['sh2', '142'], ['143', '143'], [143, '143'], ['sh3', '143'], ['144', '144'], [144, '144'], ['sh4', '144'], ['145', '145'], [145, '145'], ['sh5', '145'], ['146', '146'], [146, '146'], ['sh6', '146'], ['147', '147'], [147, '147'], ['sh7', '147'], ['148', '148'], [148, '148'], ['sh8', '148'], ['149', '149'], [149, '149'], ['sh9', '149'], ['161', '161'], [161, '161'], ['tu1', '161'], ['162', '162'], [162, '162'], ['tu2', '162'], ['163', '163'], [163, '163'], ['tu3', '163'], ['164', '164'], [164, '164'], ['tu4', '164'], ['165', '165'], [165, '165'], ['tu5', '165'], ['181', '181'], [181, '181'], ['tl1', '181'], ['182', '182'], [182, '182'], ['tl2', '182'], ['183', '183'], [183, '183'], ['tl3', '183'], ['184', '184'], [184, '184'], ['tl4', '184'], ['185', '185'], [185, '185'], ['tl5', '185'], ['186', '186'], [186, '186'], ['tl6', '186'], ['187', '187'], [187, '187'], ['tl7', '187'], ['188', '188'], [188, '188'], ['tl8', '188'], ['189', '189'], [189, '189'], ['tl9', '189'], ['201', '201'], [201, '201'], ['sb1', '201'], ['202', '202'], [202, '202'], ['sb2', '202'], ['203', '203'], [203, '203'], ['sb3', '203'], ['204', '204'], [204, '204'], ['sb4', '204'], ['301', '301'], [301, '301'], ['chaparral/type=chamise/depth=6/deadFraction=0.5', '301'], ['401', '401'], [401, '401'], ['pg/age=20/basal=120/cover=.8/height=5', '401'], ['501', '501'], [501, '501'], ['aspenShrub50', '501']]);
/**
 * Map of standard fuel models
 * where the map key is the model number as a text string
 */

const Model = new Map([// Example special case dynamic fuel models:
['301', {
  domain: 'chaparral',
  label: 'chaparral, type=chamise, depth=6, deadFraction=0.5',
  number: 301,
  code: 'chaparral/type=chamise/depth=6/deadFraction=0.5',
  depth: 6,
  // the observed.depth
  totalLoad: 1,
  // the observed.totalLoad
  deadFraction: 0.5,
  // the observed.deadFuelFraction
  fuelType: 'chamise'
}], ['401', {
  domain: 'palmettoGallberry',
  label: 'pg, age=20, basal=120, cover=.8, height=5',
  number: 401,
  code: 'pg/age=20/basal=120/cover=.8/height=5',
  age: 20,
  basalArea: 120,
  cover: 0.8,
  height: 5
}], ['501', {
  domain: 'westernAspen',
  label: 'Aspen-shrub 50%',
  number: 501,
  code: 'aspenShrub50',
  curingLevel: 0.5,
  fuelType: 'aspenShrub'
}], [// Standard BehavePlus Fuel Models
'0', {
  domain: 'behave',
  label: 'No Fuel',
  number: 0,
  code: 'none',
  depth: 0,
  deadMext: 0,
  dead1Load: 0,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 0,
  liveHerbSavr: 0,
  liveStemSavr: 0,
  deadHeat: 0,
  liveHeat: 0
}], ['1', {
  domain: 'behave',
  label: 'Short grass',
  number: 1,
  code: '1',
  depth: 1,
  deadMext: 0.12,
  dead1Load: 0.034,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 3500,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['2', {
  domain: 'behave',
  label: 'Timber grass and understory',
  number: 2,
  code: '2',
  depth: 1,
  deadMext: 0.15,
  dead1Load: 0.092,
  dead10Load: 0.046,
  dead100Load: 0.023,
  totalHerbLoad: 0.023,
  liveStemLoad: 0,
  dead1Savr: 3000,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['3', {
  domain: 'behave',
  label: 'Tall grass',
  number: 3,
  code: '3',
  depth: 2.5,
  deadMext: 0.25,
  dead1Load: 0.138,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1500,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['4', {
  domain: 'behave',
  label: 'Chaparral',
  number: 4,
  code: '4',
  depth: 6,
  deadMext: 0.2,
  dead1Load: 0.23,
  dead10Load: 0.184,
  dead100Load: 0.092,
  totalHerbLoad: 0,
  liveStemLoad: 0.23,
  dead1Savr: 2000,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['5', {
  domain: 'behave',
  label: 'Brush',
  number: 5,
  code: '5',
  depth: 2,
  deadMext: 0.2,
  dead1Load: 0.046,
  dead10Load: 0.023,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0.092,
  dead1Savr: 2000,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['6', {
  domain: 'behave',
  label: 'Dormant brush, hardwood slash',
  number: 6,
  code: '6',
  depth: 2.5,
  deadMext: 0.25,
  dead1Load: 0.069,
  dead10Load: 0.115,
  dead100Load: 0.092,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1750,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['7', {
  domain: 'behave',
  label: 'Southern rough',
  number: 7,
  code: '7',
  depth: 2.5,
  deadMext: 0.4,
  dead1Load: 0.052,
  dead10Load: 0.086,
  dead100Load: 0.069,
  totalHerbLoad: 0,
  liveStemLoad: 0.017,
  dead1Savr: 1750,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['8', {
  domain: 'behave',
  label: 'Short needle litter',
  number: 8,
  code: '8',
  depth: 0.2,
  deadMext: 0.3,
  dead1Load: 0.069,
  dead10Load: 0.046,
  dead100Load: 0.115,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['9', {
  domain: 'behave',
  label: 'Long needle or hardwood litter',
  number: 9,
  code: '9',
  depth: 0.2,
  deadMext: 0.25,
  dead1Load: 0.134,
  dead10Load: 0.019,
  dead100Load: 0.007,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2500,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['10', {
  domain: 'behave',
  label: 'Timber litter & understory',
  number: 10,
  code: '10',
  depth: 1,
  deadMext: 0.25,
  dead1Load: 0.138,
  dead10Load: 0.092,
  dead100Load: 0.23,
  totalHerbLoad: 0,
  liveStemLoad: 0.092,
  dead1Savr: 2000,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['11', {
  domain: 'behave',
  label: 'Light logging slash',
  number: 11,
  code: '11',
  depth: 1,
  deadMext: 0.15,
  dead1Load: 0.069,
  dead10Load: 0.207,
  dead100Load: 0.253,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1500,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['12', {
  domain: 'behave',
  label: 'Medium logging slash',
  number: 12,
  code: '12',
  depth: 2.3,
  deadMext: 0.2,
  dead1Load: 0.184,
  dead10Load: 0.644,
  dead100Load: 0.759,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1500,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['13', {
  domain: 'behave',
  label: 'Heavy logging slash',
  number: 13,
  code: '13',
  depth: 3,
  deadMext: 0.25,
  dead1Load: 0.322,
  dead10Load: 1.058,
  dead100Load: 1.288,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1500,
  liveHerbSavr: 1500,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['101', {
  domain: 'behave',
  label: 'Short, sparse, dry climate grass',
  number: 101,
  code: 'gr1',
  depth: 0.4,
  deadMext: 0.15,
  dead1Load: 0.004591368227731864,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.013774104683195591,
  liveStemLoad: 0,
  dead1Savr: 2200,
  liveHerbSavr: 2000,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['102', {
  domain: 'behave',
  label: 'Low load, dry climate grass',
  number: 102,
  code: 'gr2',
  depth: 1,
  deadMext: 0.15,
  dead1Load: 0.004591368227731864,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.04591368227731864,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['103', {
  domain: 'behave',
  label: 'Low load, very coarse, humid climate grass',
  number: 103,
  code: 'gr3',
  depth: 2,
  deadMext: 0.3,
  dead1Load: 0.004591368227731864,
  dead10Load: 0.018365472910927456,
  dead100Load: 0,
  totalHerbLoad: 0.06887052341597796,
  liveStemLoad: 0,
  dead1Savr: 1500,
  liveHerbSavr: 1300,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['104', {
  domain: 'behave',
  label: 'Moderate load, dry climate grass',
  number: 104,
  code: 'gr4',
  depth: 2,
  deadMext: 0.15,
  dead1Load: 0.01147842056932966,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.0872359963269054,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['105', {
  domain: 'behave',
  label: 'Low load, humid climate grass',
  number: 105,
  code: 'gr5',
  depth: 1.5,
  deadMext: 0.4,
  dead1Load: 0.018365472910927456,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.11478420569329659,
  liveStemLoad: 0,
  dead1Savr: 1800,
  liveHerbSavr: 1600,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['106', {
  domain: 'behave',
  label: 'Moderate load, humid climate grass',
  number: 106,
  code: 'gr6',
  depth: 1.5,
  deadMext: 0.4,
  dead1Load: 0.004591368227731864,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.15610651974288337,
  liveStemLoad: 0,
  dead1Savr: 2200,
  liveHerbSavr: 2000,
  liveStemSavr: 1500,
  deadHeat: 9000,
  liveHeat: 9000
}], ['107', {
  domain: 'behave',
  label: 'High load, dry climate grass',
  number: 107,
  code: 'gr7',
  depth: 3,
  deadMext: 0.15,
  dead1Load: 0.04591368227731864,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.24793388429752067,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['108', {
  domain: 'behave',
  label: 'High load, very coarse, humid climate grass',
  number: 108,
  code: 'gr8',
  depth: 4,
  deadMext: 0.3,
  dead1Load: 0.02295684113865932,
  dead10Load: 0.0459139,
  dead100Load: 0,
  totalHerbLoad: 0.33516988062442604,
  liveStemLoad: 0,
  dead1Savr: 1500,
  liveHerbSavr: 1300,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['109', {
  domain: 'behave',
  label: 'Very high load, humid climate grass',
  number: 109,
  code: 'gr9',
  depth: 5,
  deadMext: 0.4,
  dead1Load: 0.04591368227731864,
  dead10Load: 0.04591368227731864,
  dead100Load: 0,
  totalHerbLoad: 0.4132231404958677,
  liveStemLoad: 0,
  dead1Savr: 1800,
  liveHerbSavr: 1600,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['121', {
  domain: 'behave',
  label: 'Low load, dry climate grass-shrub',
  number: 121,
  code: 'gs1',
  depth: 0.9,
  deadMext: 0.15,
  dead1Load: 0.009182736455463728,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0.02295684113865932,
  liveStemLoad: 0.02984403,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1800,
  deadHeat: 8000,
  liveHeat: 8000
}], ['122', {
  domain: 'behave',
  label: 'Moderate load, dry climate grass-shrub',
  number: 122,
  code: 'gs2',
  depth: 1.5,
  deadMext: 0.15,
  dead1Load: 0.02295684113865932,
  dead10Load: 0.02295684113865932,
  dead100Load: 0,
  totalHerbLoad: 0.027548209366391182,
  liveStemLoad: 0.04591368227731864,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1800,
  deadHeat: 8000,
  liveHeat: 8000
}], ['123', {
  domain: 'behave',
  label: 'Moderate load, humid climate grass-shrub',
  number: 123,
  code: 'gs3',
  depth: 1.8,
  deadMext: 0.4,
  dead1Load: 0.013774104683195591,
  dead10Load: 0.01147842056932966,
  dead100Load: 0,
  totalHerbLoad: 0.06657483930211203,
  liveStemLoad: 0.057392102846648294,
  dead1Savr: 1800,
  liveHerbSavr: 1600,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['124', {
  domain: 'behave',
  label: 'High load, humid climate grass-shrub',
  number: 124,
  code: 'gs4',
  depth: 2.1,
  deadMext: 0.4,
  dead1Load: 0.0872359963269054,
  dead10Load: 0.013774104683195591,
  dead100Load: 0.004591368227731864,
  totalHerbLoad: 0.15610651974288337,
  liveStemLoad: 0.3259871441689623,
  dead1Savr: 1800,
  liveHerbSavr: 1600,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['141', {
  domain: 'behave',
  label: 'Low load, dry climate shrub',
  number: 141,
  code: 'sh1',
  depth: 1,
  deadMext: 0.15,
  dead1Load: 0.01147842056932966,
  dead10Load: 0.01147842056932966,
  dead100Load: 0,
  totalHerbLoad: 0.0068870523415977955,
  liveStemLoad: 0.05968778696051423,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['142', {
  domain: 'behave',
  label: 'Moderate load, dry climate shrub',
  number: 142,
  code: 'sh2',
  depth: 1,
  deadMext: 0.15,
  dead1Load: 0.06198347107438017,
  dead10Load: 0.11019283746556473,
  dead100Load: 0.03443526170798898,
  totalHerbLoad: 0,
  liveStemLoad: 0.17676767676767677,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['143', {
  domain: 'behave',
  label: 'Moderate load, humid climate shrub',
  number: 143,
  code: 'sh3',
  depth: 2.4,
  deadMext: 0.4,
  dead1Load: 0.02066115702479339,
  dead10Load: 0.13774104683195593,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0.28466483011937554,
  dead1Savr: 1600,
  liveHerbSavr: 1800,
  liveStemSavr: 1400,
  deadHeat: 8000,
  liveHeat: 8000
}], ['144', {
  domain: 'behave',
  label: 'Low load, humid climate timber-shrub',
  number: 144,
  code: 'sh4',
  depth: 3,
  deadMext: 0.3,
  dead1Load: 0.03902662993572084,
  dead10Load: 0.05280073461891643,
  dead100Load: 0.009182736455463728,
  totalHerbLoad: 0,
  liveStemLoad: 0.11707988980716252,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['145', {
  domain: 'behave',
  label: 'High load, dry climate shrub',
  number: 145,
  code: 'sh5',
  depth: 6,
  deadMext: 0.15,
  dead1Load: 0.1652892561983471,
  dead10Load: 0.09641873278236915,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0.13314967860422405,
  dead1Savr: 750,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['146', {
  domain: 'behave',
  label: 'Low load, humid climate shrub',
  number: 146,
  code: 'sh6',
  depth: 2,
  deadMext: 0.3,
  dead1Load: 0.13314967860422405,
  dead10Load: 0.06657483930211203,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0.06427915518824609,
  dead1Savr: 750,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['147', {
  domain: 'behave',
  label: 'Very high load, dry climate shrub',
  number: 147,
  code: 'sh7',
  depth: 6,
  deadMext: 0.15,
  dead1Load: 0.16069788797061524,
  dead10Load: 0.24334251606978877,
  dead100Load: 0.10101010101010101,
  totalHerbLoad: 0,
  liveStemLoad: 0.15610651974288337,
  dead1Savr: 750,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['148', {
  domain: 'behave',
  label: 'High load, humid climate shrub',
  number: 148,
  code: 'sh8',
  depth: 3,
  deadMext: 0.4,
  dead1Load: 0.0941230486685032,
  dead10Load: 0.15610651974288337,
  dead100Load: 0.03902662993572084,
  totalHerbLoad: 0,
  liveStemLoad: 0.19972451790633605,
  dead1Savr: 750,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['149', {
  domain: 'behave',
  label: 'Very high load, humid climate shrub',
  number: 149,
  code: 'sh9',
  depth: 4.4,
  deadMext: 0.4,
  dead1Load: 0.20661157024793386,
  dead10Load: 0.11248852157943066,
  dead100Load: 0,
  totalHerbLoad: 0.07116620752984389,
  liveStemLoad: 0.3213957759412305,
  dead1Savr: 750,
  liveHerbSavr: 1800,
  liveStemSavr: 1500,
  deadHeat: 8000,
  liveHeat: 8000
}], ['161', {
  domain: 'behave',
  label: 'Light load, dry climate timber-grass-shrub',
  number: 161,
  code: 'tu1',
  depth: 0.6,
  deadMext: 0.2,
  dead1Load: 0.009182736455463728,
  dead10Load: 0.04132231404958678,
  dead100Load: 0.06887052341597796,
  totalHerbLoad: 0.009182736455463728,
  liveStemLoad: 0.04132231404958678,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['162', {
  domain: 'behave',
  label: 'Moderate load, humid climate timber-shrub',
  number: 162,
  code: 'tu2',
  depth: 1,
  deadMext: 0.3,
  dead1Load: 0.0436179981634527,
  dead10Load: 0.08264462809917356,
  dead100Load: 0.057392102846648294,
  totalHerbLoad: 0,
  liveStemLoad: 0.009182736455463728,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['163', {
  domain: 'behave',
  label: 'Moderate load, humid climate timber-grass-shrub',
  number: 163,
  code: 'tu4',
  depth: 1.3,
  deadMext: 0.3,
  dead1Load: 0.050505050505050504,
  dead10Load: 0.0068870523415977955,
  dead100Load: 0.01147842056932966,
  totalHerbLoad: 0.029843893480257115,
  liveStemLoad: 0.050505050505050504,
  dead1Savr: 1800,
  liveHerbSavr: 1600,
  liveStemSavr: 1400,
  deadHeat: 8000,
  liveHeat: 8000
}], ['164', {
  domain: 'behave',
  label: 'Dwarf conifer understory',
  number: 164,
  code: 'tu4',
  depth: 0.5,
  deadMext: 0.12,
  dead1Load: 0.20661157024793386,
  dead10Load: 0,
  dead100Load: 0,
  totalHerbLoad: 0,
  liveStemLoad: 0.09182736455463728,
  dead1Savr: 2300,
  liveHerbSavr: 1800,
  liveStemSavr: 2000,
  deadHeat: 8000,
  liveHeat: 8000
}], ['165', {
  domain: 'behave',
  label: 'Very high load, dry climate timber-shrub',
  number: 165,
  code: 'tu5',
  depth: 1,
  deadMext: 0.25,
  dead1Load: 0.18365472910927455,
  dead10Load: 0.18365472910927455,
  dead100Load: 0.13774104683195593,
  totalHerbLoad: 0,
  liveStemLoad: 0.13774104683195593,
  dead1Savr: 1500,
  liveHerbSavr: 1800,
  liveStemSavr: 750,
  deadHeat: 8000,
  liveHeat: 8000
}], ['181', {
  domain: 'behave',
  label: 'Low load, compact conifer litter',
  number: 181,
  code: 'tl1',
  depth: 0.2,
  deadMext: 0.3,
  dead1Load: 0.04591368227731864,
  dead10Load: 0.10101010101010101,
  dead100Load: 0.1652892561983471,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['182', {
  domain: 'behave',
  label: 'Low load broadleaf litter',
  number: 182,
  code: 'tl2',
  depth: 0.2,
  deadMext: 0.25,
  dead1Load: 0.06427915518824609,
  dead10Load: 0.10560146923783285,
  dead100Load: 0.10101010101010101,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['183', {
  domain: 'behave',
  label: 'Moderate load conifer litter',
  number: 183,
  code: 'tl3',
  depth: 0.3,
  deadMext: 0.2,
  dead1Load: 0.02295684113865932,
  dead10Load: 0.10101010101010101,
  dead100Load: 0.12855831037649218,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['184', {
  domain: 'behave',
  label: 'Small downed logs',
  number: 184,
  code: 'tl4',
  depth: 0.4,
  deadMext: 0.25,
  dead1Load: 0.02295684113865932,
  dead10Load: 0.06887052341597796,
  dead100Load: 0.1928374655647383,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['185', {
  domain: 'behave',
  label: 'High load conifer litter',
  number: 185,
  code: 'tl5',
  depth: 0.6,
  deadMext: 0.25,
  dead1Load: 0.05280073461891643,
  dead10Load: 0.11478420569329659,
  dead100Load: 0.20202020202020202,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['186', {
  domain: 'behave',
  label: 'High load broadleaf litter',
  number: 186,
  code: 'tl6',
  depth: 0.3,
  deadMext: 0.25,
  dead1Load: 0.11019283746556473,
  dead10Load: 0.055096418732782364,
  dead100Load: 0.055096418732782364,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['187', {
  domain: 'behave',
  label: 'Large downed logs',
  number: 187,
  code: 'tl7',
  depth: 0.4,
  deadMext: 0.25,
  dead1Load: 0.013774104683195591,
  dead10Load: 0.06427915518824609,
  dead100Load: 0.371900826446281,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['188', {
  domain: 'behave',
  label: 'Long-needle litter',
  number: 188,
  code: 'tl8',
  depth: 0.3,
  deadMext: 0.35,
  dead1Load: 0.2662993572084481,
  dead10Load: 0.06427915518824609,
  dead100Load: 0.050505050505050504,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1800,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['189', {
  domain: 'behave',
  label: 'Very high load broadleaf litter',
  number: 189,
  code: 'tl9',
  depth: 0.6,
  deadMext: 0.35,
  dead1Load: 0.305325987144169,
  dead10Load: 0.1515151515151515,
  dead100Load: 0.19054178145087236,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 1800,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['201', {
  domain: 'behave',
  label: 'Low load activity fuel',
  number: 201,
  code: 'sb1',
  depth: 1,
  deadMext: 0.25,
  dead1Load: 0.06887052341597796,
  dead10Load: 0.13774104683195593,
  dead100Load: 0.505050505050505,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['202', {
  domain: 'behave',
  label: 'Moderate load activity or low load blowdown',
  number: 202,
  code: 'sb2',
  depth: 1,
  deadMext: 0.25,
  dead1Load: 0.20661157024793386,
  dead10Load: 0.1951331496786042,
  dead100Load: 0.18365472910927455,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['203', {
  domain: 'behave',
  label: 'High load activity fuel or moderate load blowdown',
  number: 203,
  code: 'sb3',
  depth: 1.2,
  deadMext: 0.25,
  dead1Load: 0.2525252525252525,
  dead10Load: 0.12626262626262624,
  dead100Load: 0.13774104683195593,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}], ['204', {
  domain: 'behave',
  label: 'High load blowdown',
  number: 204,
  code: 'sb4',
  depth: 2.7,
  deadMext: 0.25,
  dead1Load: 0.24104683195592286,
  dead10Load: 0.16069788797061524,
  dead100Load: 0.24104683195592286,
  totalHerbLoad: 0,
  liveStemLoad: 0,
  dead1Savr: 2000,
  liveHerbSavr: 1800,
  liveStemSavr: 1600,
  deadHeat: 8000,
  liveHeat: 8000
}]]);

/**
 * @file Fuel catalog accessors.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * @return A sorted array of all the fuel model alias Map key strings.
 */

function aliases() {
  return Array.from(Alias.keys()).sort();
}
function code(alias) {
  return model(alias).code;
}
function domain(alias) {
  return model(alias).domain;
}
/**
 * @param {string} alias The Fuel.Alias map key string
 */

function hasAlias(alias) {
  return Alias.has(alias);
}
/**
 * @param {string} key The Fuel.Model map key string
 */

function hasKey(key) {
  return Model.has(key);
}
/**
 * @return A sorted array of all the fuel catalog model Map key strings.
 */

function keys() {
  return Array.from(Alias.keys()).sort();
}
/**
 * @return A sorted array of fuel catalog model [number, code, label]
 */

function list() {
  return Array.from(Model.keys()).sort().map(key => [number(key), code(key), label(key)]);
}
function label(alias) {
  return model(alias).label;
}
/**
 * @param {string} alias Alias map key string
 * @return Reference to the Fuel.Model with the 'alias',
 * or throws an Error if the alias does not exist.
 */

function model(alias) {
  if (!Alias.has(alias)) {
    throw new Error(`Fuel catalog does not have fuel model key or alias '${alias}'`);
  }

  return Model.get(Alias.get(alias));
}
/**
 * @return An array of all the fuel catalog model objects.
 */

function models() {
  return Array.from(Model.values());
}
function number(alias) {
  return model(alias).number;
}
function behaveDead1Load(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.dead1Load : 0;
}
function behaveDead1Savr(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.dead1Savr : 1;
}
function behaveDead10Load(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.dead10Load : 0;
}
function behaveDead100Load(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.dead100Load : 0;
}
function behaveDeadHeat(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.deadHeat : 0;
}
function behaveDeadMext(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.deadMext : 0.01;
}
function behaveDepth(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.depth : 0.01;
}
function behaveLiveHeat(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.liveHeat : 0;
}
function behaveLiveHerbSavr(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.liveHerbSavr : 1;
}
function behaveLiveStemLoad(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.liveStemLoad : 0;
}
function behaveLiveStemSavr(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.liveStemSavr : 1;
}
function behaveTotalHerbLoad(alias) {
  const fuel = model(alias);
  return fuel.domain === 'behave' ? fuel.totalHerbLoad : 0;
}
function chaparralDeadFraction(alias) {
  const fuel = model(alias);
  return fuel.domain === 'chaparral' ? fuel.deadFraction : 0;
}
function chaparralDepth(alias) {
  const fuel = model(alias);
  return fuel.domain === 'chaparral' ? fuel.depth : 0.01;
}
function chaparralFuelType(alias) {
  const fuel = model(alias); // return fuel.domain === 'chaparral' ? fuel.fuelType : 'none'

  return fuel.domain === 'chaparral' ? fuel.fuelType : 'chamise';
}
function chaparralTotalLoad(alias) {
  const fuel = model(alias);
  return fuel.domain === 'chaparral' ? fuel.totalLoad : 0;
}
function palmettoGallberryAge(alias) {
  const fuel = model(alias);
  return fuel.domain === 'palmettoGallberry' ? fuel.age : 0;
}
function palmettoGallberryBasalArea(alias) {
  const fuel = model(alias);
  return fuel.domain === 'palmettoGallberry' ? fuel.basalArea : 0;
}
function palmettoGallberryCover(alias) {
  const fuel = model(alias);
  return fuel.domain === 'palmettoGallberry' ? fuel.cover : 0;
}
function palmettoGallberryHeight(alias) {
  const fuel = model(alias);
  return fuel.domain === 'palmettoGallberry' ? fuel.height : 0;
}
function westernAspenCuringLevel(alias) {
  const fuel = model(alias);
  return fuel.domain === 'westernAspen' ? fuel.curingLevel : 0;
}
function westernAspenFuelType(alias) {
  const fuel = model(alias); // return fuel.domain === 'westernAspen' ? fuel.fuelType : 'none'

  return fuel.domain === 'westernAspen' ? fuel.fuelType : 'aspenShrub';
}

var FuelCatalog = /*#__PURE__*/Object.freeze({
  __proto__: null,
  aliases: aliases,
  code: code,
  domain: domain,
  hasAlias: hasAlias,
  hasKey: hasKey,
  keys: keys,
  list: list,
  label: label,
  model: model,
  models: models,
  number: number,
  behaveDead1Load: behaveDead1Load,
  behaveDead1Savr: behaveDead1Savr,
  behaveDead10Load: behaveDead10Load,
  behaveDead100Load: behaveDead100Load,
  behaveDeadHeat: behaveDeadHeat,
  behaveDeadMext: behaveDeadMext,
  behaveDepth: behaveDepth,
  behaveLiveHeat: behaveLiveHeat,
  behaveLiveHerbSavr: behaveLiveHerbSavr,
  behaveLiveStemLoad: behaveLiveStemLoad,
  behaveLiveStemSavr: behaveLiveStemSavr,
  behaveTotalHerbLoad: behaveTotalHerbLoad,
  chaparralDeadFraction: chaparralDeadFraction,
  chaparralDepth: chaparralDepth,
  chaparralFuelType: chaparralFuelType,
  chaparralTotalLoad: chaparralTotalLoad,
  palmettoGallberryAge: palmettoGallberryAge,
  palmettoGallberryBasalArea: palmettoGallberryBasalArea,
  palmettoGallberryCover: palmettoGallberryCover,
  palmettoGallberryHeight: palmettoGallberryHeight,
  westernAspenCuringLevel: westernAspenCuringLevel,
  westernAspenFuelType: westernAspenFuelType,
  Domains: Domains
});

/**
 * @file Fuel moisture estimates based on Fosberg and used by National Wildfire Coordinmating Group
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
// Fosberg's Table A - Reference Fuel Moisture
const FosbergA = [// 4  9 14 19 24 29 34 39 44 49 54 59 64 69  74  79  84  89  94  99 100 Relative Humidity
[1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 8, 8, 9, 9, 10, 11, 12, 12, 13, 13, 14], // db < 30
[1, 2, 2, 3, 4, 5, 5, 6, 7, 7, 7, 8, 9, 9, 10, 10, 11, 12, 13, 13, 13], // 30 <= db < 50
[1, 2, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11, 12, 12, 12, 13], // 50 <= db < 70
[1, 1, 2, 2, 3, 4, 5, 5, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 12, 12, 13], // 70 <= db < 90
[1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 12, 12, 13], // 90 <= db < 109
[1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 12, 12, 12] // 109 <= db < 200
]; // Fosberg's Table B. 1-h Fuel Moisture Corrections - May, Jun, Jul

const FosbergBExposed = [// 0800-0959  1000-1159   1200-1359 1400-1559  1600-1759  1800-1959
[// 0 = north
[[2, 3, 4], [1, 1, 1], [0, 0, 1], [0, 0, 1], [1, 1, 1], [2, 3, 4]], // N <= 30%
[[3, 4, 4], [1, 2, 2], [1, 1, 2], [1, 1, 2], [1, 2, 2], [3, 4, 4]] // N > 30%
], [// 1 = east
[[2, 2, 3], [1, 1, 1], [0, 0, 1], [0, 0, 1], [1, 1, 2], [3, 4, 4]], // E <= 30%
[[1, 2, 2], [0, 0, 1], [0, 0, 1], [1, 1, 2], [2, 3, 4], [4, 5, 6]] // E > 30%
], [// 2 = south
[[2, 3, 3], [1, 1, 1], [0, 0, 1], [0, 0, 1], [1, 1, 1], [2, 3, 3]], // S <= 30%
[[2, 3, 3], [1, 1, 2], [0, 1, 1], [0, 1, 1], [1, 1, 2], [2, 3, 3]] // S > 30%
], [// 3 = west
[[2, 3, 4], [1, 1, 2], [0, 0, 1], [0, 0, 1], [0, 1, 1], [2, 3, 3]], // W <= 30%
[[4, 5, 6], [2, 3, 4], [1, 1, 2], [0, 0, 1], [0, 0, 1], [1, 2, 2]] // W > 30%
]];
const FosbergBShaded = [// 0800-0959  1000-1159   1200-1359 1400-1559  1600-1759  1800-1959
[[[4, 5, 5], [3, 4, 5], [3, 3, 4], [3, 3, 4], [3, 4, 5], [4, 5, 5]]], // N
[[[4, 4, 5], [3, 4, 5], [3, 3, 4], [3, 4, 4], [3, 4, 5], [4, 5, 6]]], // S
[[[4, 4, 5], [3, 4, 5], [3, 3, 4], [3, 3, 4], [3, 4, 5], [4, 5, 5]]], // E
[[[4, 5, 6], [3, 4, 5], [3, 3, 4], [3, 3, 4], [3, 4, 5], [4, 4, 5]]] // W
]; // Fosberg's Table C. 1-h Fuel Moisture Corrections - Feb, Mar, Apr and Aug, Sep, oct

const FosbergCExposed = [[// 0 = north
// 0800-0959  1000-1159  1200-1359  1400-1559  1600-1759  1800-1959
[[3, 4, 5], [1, 2, 3], [1, 1, 2], [1, 1, 2], [1, 2, 3], [3, 4, 5]], // N <= 30%
[[3, 4, 5], [3, 3, 4], [2, 3, 4], [2, 3, 4], [3, 3, 4], [3, 4, 5]] // N > 30%
], [// 1 = east
[[3, 4, 5], [1, 2, 3], [1, 1, 1], [1, 1, 2], [1, 2, 4], [3, 4, 5]], // E <= 30%
[[3, 3, 4], [1, 1, 1], [1, 1, 1], [1, 2, 3], [3, 4, 5], [4, 5, 6]] // E > 30%
], [// 2 = south
[[3, 4, 5], [1, 2, 2], [1, 1, 1], [1, 1, 1], [1, 2, 3], [3, 4, 5]], // S <= 30%
[[3, 4, 5], [1, 2, 2], [0, 1, 1], [0, 1, 1], [1, 2, 2], [3, 4, 5]] // S > 30%
], [// 3 = west
[[3, 4, 5], [1, 2, 3], [1, 1, 1], [1, 1, 1], [1, 2, 3], [3, 4, 5]], // W <= 30%
[[4, 5, 6], [3, 4, 5], [1, 2, 3], [1, 1, 1], [1, 1, 1], [3, 3, 4]] // W > 30%
]];
const FosbergCShaded = [// 0800-0959  1000-1159   1200-1359 1400-1559  1600-1759  1800-1959
[[[4, 5, 6], [4, 5, 5], [3, 4, 5], [3, 4, 5], [4, 5, 5], [4, 5, 6]]], // N
[[[4, 5, 6], [3, 4, 5], [3, 4, 5], [3, 4, 5], [4, 5, 6], [4, 5, 6]]], // S
[[[4, 5, 6], [3, 4, 5], [3, 4, 5], [3, 4, 5], [3, 4, 5], [4, 5, 6]]], // E
[[[4, 5, 6], [4, 5, 6], [3, 4, 5], [3, 4, 5], [3, 4, 5], [4, 5, 6]]] // W
]; // Fosberg's Table D. 1-h Fuel Moisture Corrections - Nov, Dec, Jan

const FosbergDExposed = [[// 0 = north
// 0800-0959  1000-1159  1200-1359  1400-1559  1600-1759  1800-1959
[[4, 5, 6], [3, 4, 5], [2, 3, 4], [2, 3, 4], [3, 4, 5], [4, 5, 6]], // N <= 30%
[[4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6]] // N > 30%
], [// 1 = east
[[4, 5, 6], [3, 4, 4], [2, 3, 3], [2, 3, 3], [3, 4, 5], [4, 5, 6]], // E <= 30%
[[4, 5, 6], [2, 3, 4], [2, 2, 3], [3, 4, 4], [4, 5, 6], [4, 5, 6]] // E > 30%
], [// 2 = south
[[4, 5, 6], [3, 4, 5], [2, 3, 3], [2, 2, 3], [3, 4, 4], [4, 5, 6]], // S <= 30%
[[4, 5, 6], [2, 3, 3], [1, 1, 2], [1, 1, 2], [2, 3, 3], [4, 5, 6]] // S > 30%
], [// 3 = west
[[4, 5, 6], [3, 4, 5], [2, 3, 3], [2, 3, 3], [3, 4, 4], [4, 5, 6]], // W <= 30%
[[4, 5, 6], [4, 5, 6], [3, 4, 4], [2, 2, 3], [2, 3, 4], [4, 5, 6]] // W > 30%
]];
const FosbergDShaded = [// 0800-0959  1000-1159   1200-1359 1400-1559  1600-1759  1800-1959
[[[4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 5], [4, 5, 6]]], // N
[[[4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 5], [4, 5, 6]]], // E
[[[4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 5], [4, 5, 6]]], // S
[[[4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 6], [4, 5, 5], [4, 5, 6]]] // W
];
const Correction = [[FosbergBExposed, FosbergBShaded], // 0 = Table B, May, Jun, Jul
[FosbergCExposed, FosbergCShaded], // 1 = Table C, Feb, Mar, Apr and Aug, Sep, Oct
[FosbergDExposed, FosbergDShaded] // 2 = Table D, Nov, Dec, Jan
]; // Mapping from compass quadrant to aspect index

const Aspect = [0, 1, 1, 2, 2, 3, 3, 0, 0, 0]; // N=0, E=1, S=2, W=3
// Mapping from month to correction table index
//             x, J, F, M, A, M, J, J, A, S, O, N, D

const Month = [2, 2, 1, 1, 1, 0, 0, 0, 1, 1, 1, 2, 2];
/**
 * Estimates 1-h fuel moisture from Fosberg's tables
 * @param {number} db Dry bulb temperature (oF)
 * @param {number} rh Relative humidity (ratio)
 * @param {number} month Month number (Jan=1, Dec = 12)
 * @param {number} shading Shading of surface fuels (shaded fraction)
 * @param {number} aspect Aspect (degrees from north)
 * @param {number} slope Slope steepness (ratio of rise / reach)
 * @param {number} hour Hour of the day (midnight=0, 6am=6, noon=12, 6pm = 18)
 * @param {number} elevDiff Elevation diff from db & rh obs to site (+- ft)
 * @returns {number} 1-h fuel moisture correction (ratio)
 */

function fosbergDead1h(reference, correction) {
  return reference + correction;
}
function fosbergDead10h(fm1) {
  return fm1 + 0.02;
}
function fosbergDead100h(fm1) {
  return fm1 + 0.04;
}
/**
 * Returns Fosberg's 'Reference Fuel Moisture'
 * @param {number} db Dry bulb temperature (oF)
 * @param {number} rh Relative humidity (ratio)
 * @returns {number} Reference fuel moisture (ratio)
 */

function fosbergReference(db, rh) {
  const dbIdx = Math.min(Math.max(0, Math.floor((db - 10) / 20)), 5);
  const rhIdx = Math.min(Math.max(0, Math.floor(100 * rh / 5)), 19); // console.log('dbIdx', dbIdx, 'rhIdx', rhIdx)

  return 0.01 * FosbergA[dbIdx][rhIdx];
}
/**
 * Returns Fosberg's 1-hr Fuel Moisture correction
 * @param {number} month Month number (Jan=1, Dec = 12)
 * @param {number} shading Shading of surface fuels (shaded fraction)
 * @param {number} aspect Aspect (degrees from north)
 * @param {number} slope Slope steepness (ratio of rise / reach)
 * @param {number} hour Hour of the day (midnight=0, 6am=6, noon=12, 6pm = 18)
 * @param {number} elevDiff Elevation diff from db & rh obs to site (+- ft)
 * @returns {number} 1-h fuel moisture correction (ratio)
 */

function fosbergCorrection(month, shading, aspect, slope, hour, elevDiff) {
  // First determine the appropriate seasonal-shading table to apply
  const monthCat = Month[month]; // Crosswalk for seasonal correction tables
  // Fine fuel may  be shaded by canopy, cloud cover, or nighttime

  const shadeCat = shading < 0.5 && hour >= 8 && hour < 20 ? 0 : 1;
  const table = Correction[monthCat][shadeCat]; // Crosswalk from compass quadrant to aspect index

  const quadrant = Math.floor(aspect / 45);
  const aspectCat = Aspect[quadrant]; // 2 slope categories for exposed, but just 1 for shaded conditions

  const slopeCat = slope <= 0.3 ? 0 : shadeCat ? 0 : 1; // All hours outside 0800-2000 are assigned to idx 0 (0800-0959)

  const hourCat = Math.min(Math.max(Math.floor((hour - 8) / 2), 0), 5);
  const elevCat = elevDiff < -1000 ? 0 : elevDiff > 1000 ? 2 : 1; // console.log(`mon:${month}=${monthCat} shade:${shading}=${shadeCat} asp:${aspect}=${aspectCat} slp:${slope}=${slopeCat} hr:${hour}=${hourCat} elev:${elevDiff}=${elevCat}`)

  return 0.01 * table[aspectCat][slopeCat][hourCat][elevCat];
}

var FuelMoisture = /*#__PURE__*/Object.freeze({
  __proto__: null,
  FosbergA: FosbergA,
  FosbergBExposed: FosbergBExposed,
  FosbergBShaded: FosbergBShaded,
  FosbergCExposed: FosbergCExposed,
  FosbergCShaded: FosbergCShaded,
  FosbergDExposed: FosbergDExposed,
  FosbergDShaded: FosbergDShaded,
  fosbergDead1h: fosbergDead1h,
  fosbergDead10h: fosbergDead10h,
  fosbergDead100h: fosbergDead100h,
  fosbergReference: fosbergReference,
  fosbergCorrection: fosbergCorrection
});

/**
 * @file Fuel particle equations as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Calculate and return a fuel particle diameter (ft+1)
 * from a surface area-to-volume ratio (ft-1).
 *
 * The diameter is derived using Rothermel (1972) equation 32 (p 14).
 *
 * @param float savr Fuel particle surface area-to-volume ratio (ft-1).
 *
 * @return float Fuel particle diameter (ft+1).
 */

function cylindricalDiameter(savr) {
  return divide(4, savr);
}
/**
 * Calculate and return the length (ft+1) of a hypothetical cylindrical
 * fuel particle given its diameter (ft+1) and volume (ft+3).
 *
 * @param float diam Fuel particle diameter (ft+1).
 * @param float volm Fuel particle volume (ft+3).
 *
 * @return float Fuel particle length (ft+1).
 */

function cylindricalLength(diam, volm) {
  const radius = diam / 2;
  const area = Math.PI * radius * radius;
  return divide(volm, area);
}
/**
 * Calculate and return a fuel particle effective heating number (fraction)
 * from a surface area-to-volume ratio (ft-1).
 *
 * The effective heating number is derived from Rothermel (1972) equation 14
 * (p 8, 26) and 77 (p 32).
 *
 * @param float savr Fuel particle surface area-to-volume ratio (ft-1).
 *
 * @return float Fuel particle effective heating number (fraction).
 */

function effectiveHeatingNumber(savr) {
  return savr <= 0 ? 0 : Math.exp(-138 / savr);
}
/**
 * Calculate and return the dead fuel particle `fine fuel load`.
 *
 * The `fine fuel load` is the portion of the fuel particle
 * load used to determine the life category fine fuel,
 * which in turn is used to determine the live category
 * moisture content of extinction.
 *
 * See Rothermel (1972) equation 88 on page 35.
 *
 * @param string life The fuel particle life category: 'dead' or 'live'.
 * @param real savr The fuel particle surface area-to-volume ratio (ft-1).
 * @param real load The fuel particle load (lb/ft2).
 *
 * @return real Fuel particle ignition fuel load (lb/ft2).
 */

function effectiveFuelLoad(savr, load, life) {
  return life === 'dead' ? effectiveFuelLoadDead(savr, load) : effectiveFuelLoadLive(savr, load);
}
function effectiveFuelLoadDead(savr, load) {
  return savr <= 0 ? 0 : load * Math.exp(-138 / savr);
} // Calculate and return the live fuel particle `fine fuel load`.

function effectiveFuelLoadLive(savr, load) {
  return savr <= 0 ? 0 : load * Math.exp(-500 / savr);
} // Calculate and return the ignition fuel water load (lb water + 1 lb fuel -1)

function effectiveFuelWaterLoad(effectiveFuelOvendryLoad, moistureContent) {
  return effectiveFuelOvendryLoad * moistureContent;
}
/**
 * Calculate the fuel particle heat of pre-ignition.
 * @return real The fuel particle heat of pre-ignition (btu+1 lb-1).
 */

function heatOfPreignition(mc, efhn) {
  const qig = 250.0 + 1116.0 * mc;
  return qig * efhn;
}
function netOvendryLoad(ovendryFuelLoad, totalMineralContent) {
  return (1 - totalMineralContent) * ovendryFuelLoad;
}
function selectByDomain(domain, behave, chaparral, palmetto, waspen) {
  if (domain === 'behave') {
    return behave;
  } else if (domain === 'chaparral') {
    return chaparral;
  } else if (domain === 'palmettoGallberry') {
    return palmetto;
  } else if (domain === 'westernAspen') {
    return waspen;
  }

  throw new Error(`Unknown domain '${domain}'`);
}
/**
 * Calculate and return the fuel particle size class [0-5]
 * given its surface area-to-volume ratio (ft-1).
 *
 * The Rothermel fire spread model groups dead and down fuel particles into
 * one of 6 size classes based upon its diameter (or surface area-to-volume ratio)
 * as follows:
 *
 *<table>
 *<tr><td>Size Class</td><td>Diameter (in)</td><td>Surface Area-to-Vol</td><td>Time-lag</td></tr>
 *  <tr><td>0</td><td>0.00 - 0.04</td><td>&gt 1200</td><td>1</td></tr>
 *  <tr><td>1</td><td>0.04 - 0.25</td><td>192 - 1200</td><td>1</td></tr>
 *  <tr><td>2</td><td>0.25 - 0.50</td><td>96 - 192</td><td>10</td></tr>
 *  <tr><td>3</td><td>0.50 - 1.00</td><td>48 - 96</td><td>10</td></tr>
 *  <tr><td>4</td><td>1.00 - 3.00</td><td>16 - 48</td><td>100</td></tr>
 *  <tr><td>5</td><td>&gt 3.00</td><td>&lt 16</td><td>1000</td></tr>
 * </table>
 *
 * @param {number} savr Fuel particle surface area-to-volume ratio (ft-1).
 *
 * @return {integer} Fuel particle size class [0..5].
 */

function sizeClass(savr) {
  let size = 5; // 3.00+ "

  if (savr >= 1200.0) {
    // 0.00 - 0.04"
    size = 0;
  } else if (savr >= 192.0) {
    // 0.04 - 0.25"
    size = 1;
  } else if (savr >= 96.0) {
    // 0.25 - 0.50"
    size = 2;
  } else if (savr >= 48.0) {
    // 0.50 - 1.00"
    size = 3;
  } else if (savr >= 16.0) {
    // 1.00 - 3.00"
    size = 4;
  }

  return size;
}
function sizeClassWeightingFactor(size, swtgArray) {
  return swtgArray[size];
}
/**
 * Calculate and return the fuel particle surface area (ft+2)
 * given its load (lb+1 ft-2), surface area-to-volume ratio (ft-1),
 * and fiber density (lb+1 ft-3).
 *
 * @param float load Fuel particle load (lb+1 ft-2).
 * @param float savr Fuel particle surface area-to-volume ratio (ft-1).
 * @param float density Fuel particle fiber density (lb+1 ft-3).
 *
 * @return float Fuel particle surface area (ft+2).
 */

function surfaceArea(load, savr, dens) {
  return divide(load * savr, dens);
}
function surfaceAreaWeightingFactor(area, catArea) {
  return fraction(divide(area, catArea));
}
/**
 * Calculate and return the fuel particle volume (ft3/ft2)
 * given its a load (lb/ft2) and fiber density (lb/ft3).
 *
 * @param {number} load Fuel particle ovendry load (lb/ft2).
 * @param {number} dens Fuel particle fiber density (lb/ft3).
 *
 * @return float Fuel particle volume per square foot of fuel bed (ft3/ft2).
 */

function volume(load, dens) {
  return divide(load, dens);
}

var FuelParticle = /*#__PURE__*/Object.freeze({
  __proto__: null,
  cylindricalDiameter: cylindricalDiameter,
  cylindricalLength: cylindricalLength,
  effectiveHeatingNumber: effectiveHeatingNumber,
  effectiveFuelLoad: effectiveFuelLoad,
  effectiveFuelLoadDead: effectiveFuelLoadDead,
  effectiveFuelLoadLive: effectiveFuelLoadLive,
  effectiveFuelWaterLoad: effectiveFuelWaterLoad,
  heatOfPreignition: heatOfPreignition,
  netOvendryLoad: netOvendryLoad,
  selectByDomain: selectByDomain,
  sizeClass: sizeClass,
  sizeClassWeightingFactor: sizeClassWeightingFactor,
  surfaceArea: surfaceArea,
  surfaceAreaWeightingFactor: surfaceAreaWeightingFactor,
  volume: volume
});

/**
 * @file Surface fire and lightning strike ignition probability equations
 * as described by Latham () as described by Albini (1998) and
 * as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Calculates the probability of a surface fire firebrand starting a fire.
 *
 * @param {number} fuelTemperature  Dead surface fuel temperature (oF).
 * @param {number} fuelMoisture     Dead 1-hour time-lag surface fuel moisture content (lb/lb).
 * @return Probability of a firebrand starting a fire [0..1].
 */

function firebrand(fuelTemperature, fuelMoisture) {
  const c = (fuelTemperature - 32) * 5 / 9;
  const qign = Math.min(144.51 - 0.266 * c - 0.00058 * c * c - c * fuelMoisture + 18.54 * (1 - Math.exp(-15.1 * fuelMoisture)) + 640 * fuelMoisture, 400);
  const x = 0.1 * (400 - qign);
  return fraction(0.000048 * Math.pow(x, 4.3) / 50);
}
/**
 * Calculates the fuel temperature using the BEHAVE FIRE2 subroutine CAIGN() algorithm.
 *
 *  @param airTemp        Air temperature (oF).
 *  @param shadeFraction  Fraction of sun shaded from the fuel.
 *  @return Fuel temperature (oF).
 */

function fuelTemperature(airTemp, shadeFraction) {
  const xincr = 25 - 20 * shadeFraction;
  return airTemp + xincr;
} // Probability of a continuing current by charge type (Latham)

const ccNeg = 0.2;
const ccPos = 0.9;
const lightningData = {
  ponderosaPineLitter: {
    label: 'Ponderosa pine litter',
    positive: function (arg) {
      return ccPos * (0.92 * Math.exp(-0.087 * arg.moisture));
    },
    negative: function (arg) {
      return ccNeg * (1.04 * Math.exp(-0.054 * arg.moisture));
    }
  },
  punkyWoodRottenChunky: {
    label: 'Punky wood, rotten, chunky',
    positive: function (arg) {
      return ccPos * (0.44 * Math.exp(-0.11 * arg.moisture));
    },
    negative: function (arg) {
      return ccNeg * (0.59 * Math.exp(-0.094 * arg.moisture));
    }
  },
  punkyWoodPowderDeep: {
    label: 'Punky wood powder, deep (4.8 cm)',
    positive: function (arg) {
      return ccPos * (0.86 * Math.exp(-0.06 * arg.moisture));
    },
    negative: function (arg) {
      return ccNeg * (0.9 * Math.exp(-0.056 * arg.moisture));
    }
  },
  punkyWoodPowderShallow: {
    label: 'Punk wood powder, shallow (2.4 cm)',
    positive: function (arg) {
      return ccPos * (0.6 - 0.011 * arg.moisture);
    },
    negative: function (arg) {
      return ccNeg * (0.73 - 0.011 * arg.moisture);
    }
  },
  lodgepolePineDuff: {
    label: 'Lodgepole pine duff',
    positive: function (arg) {
      return ccPos * (1 / (1 + Math.exp(5.13 - 0.68 * arg.depth)));
    },
    negative: function (arg) {
      return ccNeg * (1 / (1 + Math.exp(3.84 - 0.6 * arg.depth)));
    }
  },
  douglasFirDuff: {
    label: 'Douglas-fir duff',
    positive: function (arg) {
      return ccPos * (1 / (1 + Math.exp(6.69 - 1.39 * arg.depth)));
    },
    negative: function (arg) {
      return ccNeg * (1 / (1 + Math.exp(5.48 - 1.28 * arg.depth)));
    }
  },
  highAltitudeMixed: {
    label: 'High altitude mixed (mainly Engelmann spruce)',
    positive: function (arg) {
      return ccPos * (0.62 * Math.exp(-0.05 * arg.moisture));
    },
    negative: function (arg) {
      return ccNeg * (0.8 - 0.014 * arg.moisture);
    }
  },
  peatMoss: {
    label: 'Peat moss (commercial)',
    positive: function (arg) {
      return ccPos * (0.71 * Math.exp(-0.07 * arg.moisture));
    },
    negative: function (arg) {
      return ccNeg * (0.84 * Math.exp(-0.06 * arg.moisture));
    }
  }
};
const LightningCharges = ['negative', 'positive', 'unknown'];
const LightningFuels = Object.keys(lightningData);
/**
 * Calculates the probability of a lightning strike starting a fire.
 *
 *  @param fuelType Ignition fuel bed type:
 *  @param depth    Ignition fuel (duff & litter) bed depth (inches).
 *  @param duffMoisture Ignition fuel (duff & litter 100-h) moisture content (lb/lb).
 *  @param chargeType Lightning charge, one of 'positive', 'negative', or 'unknown'
 *  @return Probability of the lightning strike starting a fire [0..1].
 *
 *  \note  The following assumptions are made by Latham:
 *  - 20% of negative flashes have continuing current
 *  - 90% of positive flashes have continuing current
 *  - Latham and Schlieter found a relative frequency of
 *    0.723 negative and 0.277 positive strikes
 *  - Unknown strikes are therefore p = 0.1446 neg + 0.2493 pos
 */

function lightningStrike(fuelType, depth, moisture, chargeType) {
  // Convert duff depth to cm and restrict to maximum of 10 cm.
  // Convert duff moisture to percent and restrict to maximum of 40%.
  const args = {
    depth: Math.min(30.48 * depth, 10),
    moisture: Math.min(100 * moisture, 40)
  }; // If 'positive' or 'negative'...

  if (chargeType === 'positive' || chargeType === 'negative') {
    return fraction(lightningData[fuelType][chargeType](args));
  } // Otherwise, return a positive/negative frequency-weighted value using
  // Latham and Schlieter's relative frequency of a continuing current by charge type


  const freqNeg = 0.723;
  const freqPos = 0.277;
  const pos = fraction(lightningData[fuelType].positive(args));
  const neg = fraction(lightningData[fuelType].negative(args));
  return fraction(freqPos * pos + freqNeg * neg);
}

var IgnitionProbability$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  firebrand: firebrand,
  fuelTemperature: fuelTemperature,
  lightningData: lightningData,
  LightningCharges: LightningCharges,
  LightningFuels: LightningFuels,
  lightningStrike: lightningStrike
});

/**
 * @file Palmetto-gallberry dynamic fuel model equations
 * as described by Hough and Albini (1978) and as implemented by BehavePlus V6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */

function deadFineLoad$1(age, ht) {
  return positive(-0.00121 + 0.00379 * Math.log(age) + 0.00118 * ht * ht);
} // dead 0.25 to 1 inch

function deadSmallLoad$1(age, cover) {
  return positive(-0.00775 + 0.00021 * cover + 0.00007 * age * age);
} // dead foliage

function deadFoliageLoad(age, cover) {
  return 0.00221 * age ** 0.51263 * Math.exp(0.02482 * cover);
} // L layer

function deadLitterLoad(age, basalArea) {
  return (0.03632 + 0.0005336 * basalArea) * (1.0 - 0.25 ** age);
}
function fuelDepth(ht) {
  return Math.max(0.01, 2.0 * ht / 3.0);
} // live 0 to 0.25 inch

function liveFineLoad(age, ht) {
  return positive(0.00546 + 0.00092 * age + 0.00212 * ht * ht);
} // live 0.25 to 1 inch

function liveSmallLoad(age, ht) {
  return positive(-0.02128 + 0.00014 * age * age + 0.00314 * ht * ht);
} // live foliage

function liveFoliageLoad(age, cover, ht) {
  return positive(-0.0036 + 0.00253 * age + 0.00049 * cover + 0.00282 * ht * ht);
}

var PalmettoGallberryFuel = /*#__PURE__*/Object.freeze({
  __proto__: null,
  deadFineLoad: deadFineLoad$1,
  deadSmallLoad: deadSmallLoad$1,
  deadFoliageLoad: deadFoliageLoad,
  deadLitterLoad: deadLitterLoad,
  fuelDepth: fuelDepth,
  liveFineLoad: liveFineLoad,
  liveSmallLoad: liveSmallLoad,
  liveFoliageLoad: liveFoliageLoad
});

/**
 * @file Exported WFSP equations for spotting distance from a burning pile,
 * torching trees, and surface fire as implemented by BehavePlus V6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
// Spot distance terrain location parameters
const Location = {
  midslopeWindward: {
    factor: 0,
    label: 'Midslope, Windward'
  },
  valleyBottom: {
    factor: 1,
    label: 'Valley Bottom'
  },
  midslopeLeeward: {
    factor: 2,
    label: 'Midslope, Leeward'
  },
  ridgeTop: {
    factor: 3,
    label: 'Ridge Top'
  }
};
const locations = () => Object.keys(Location);
/**
 * Torching tree spotting distance supported species parameters
 *
 * The primary key is the 4-5 character FOFEM5 genus-species code.
 * The tree species properties are:
 * - common: common name,
 * - scientific: scientific name,
 * - height: flame height computation parameter,
 * - duration: flame duration computation parameter,
 */

const TorchingTreeSpecies = ['ABBA', 'ABGR', 'ABLA', 'PICO', 'PIEC2', 'PIEL', 'PIEN', 'PIMO3', 'PIPA2', 'PIPO', 'PISE', 'PITA', 'PSME', 'TSHE', 'LAOC', 'THPL'];
const TorchingSteadyFlame = {
  ABBA: {
    common: 'balsam fir',
    scientific: 'Abies balsamea',
    height: [16.5, 0.515],
    duration: [10.7, -0.278]
  },
  ABGR: {
    common: 'grand fir',
    scientific: 'Abies grandis',
    height: [16.5, 0.515],
    duration: [10.7, -0.278]
  },
  ABLA: {
    common: 'subalpine fir',
    scientific: 'Abies lasiocarpa',
    height: [15.7, 0.451],
    duration: [10.7, -0.278]
  },
  PICO: {
    common: 'lodgepole pine',
    scientific: 'Pinus contorta',
    height: [12.9, 0.453],
    duration: [12.6, -0.256]
  },
  PIEC2: {
    common: 'shortleaf pine',
    scientific: 'Pinus echinata',
    height: [2.71, 1.0],
    duration: [7.91, -0.344]
  },
  PIEL: {
    common: 'slash pine',
    scientific: 'Pinus elliottii',
    height: [2.71, 1.0],
    duration: [11.9, -0.389]
  },
  PIEN: {
    common: 'Engelmann spruce',
    scientific: 'Picea engelmannii',
    height: [15.7, 0.451],
    duration: [12.6, -0.256]
  },
  PIMO3: {
    common: 'western white pine',
    scientific: 'Pinus monticola',
    height: [12.9, 0.453],
    duration: [10.7, -0.278]
  },
  PIPA2: {
    common: 'longleaf pine',
    scientific: 'Pinus palustrus',
    height: [2.71, 1.0],
    duration: [11.9, -0.389]
  },
  PIPO: {
    common: 'ponderosa pine',
    scientific: 'Pinus ponderosa',
    height: [12.9, 0.453],
    duration: [12.6, -0.256]
  },
  PISE: {
    common: 'pond pine',
    scientific: 'Pinus serotina',
    height: [2.71, 1.0],
    duration: [7.91, -0.344]
  },
  PITA: {
    common: 'loblolly pine',
    scientific: 'Pinus taeda',
    height: [2.71, 1.0],
    duration: [13.5, -0.544]
  },
  PSME: {
    common: 'Douglas-fir',
    scientific: 'Pseudotsuga menziesii',
    height: [15.7, 0.451],
    duration: [10.7, -0.278]
  },
  TSHE: {
    common: 'western hemlock',
    scientific: 'Tsuga heterophylla',
    height: [15.7, 0.451],
    duration: [6.3, -0.249]
  },
  // This is an estimated guess,
  // using the height parms used by PICO, PIPO, and PIMO3
  // and the duration parms used by TSHE
  LAOC: {
    common: 'western larch',
    scientific: '"Larix occidentalis (guess)',
    height: [12.9, 0.453],
    duration: [6.3, -0.249]
  },
  // This is an estimated guess,
  // using the height parms used by ABLA, PIEN, PSME, and TSHE
  // and the duration parms used by PICO, PIEN, and PIPO
  THPL: {
    scientific: 'Thuja plicata',
    common: 'western red cedar (guess)',
    height: [15.7, 0.451],
    duration: [12.6, -0.256]
  }
};
/**
 * Adjusts down-wind canopy height based upon down-wind canopy cover
 * Added in BP6 by Issue #028FAH - Downwind Canopy Open/Closed
 *
 * @param {real} downWindCoverHt (ft+1)
 * @param {real} downWindCanopyIsOpen TRUE if down-wind canopy is open
 */

function appliedDownWindCoverHeight(downWindCoverHt, downWindCanopyIsOpen) {
  return downWindCanopyIsOpen ? 0.5 * downWindCoverHt : downWindCoverHt;
}
/**
 * \brief Calculates maximum firebrand height (ft+1)
 * from a burning pile
 *
 * \param flameHt Flame height (ft+1) from the burning pile
 * \return Maximum firebrand height (ft+1) from a burning pile
 */

function burningPileFirebrandHeight(flameHt) {
  return Math.max(0.0, 12.2 * flameHt);
}
/**
 * \brief Calculates minimum value of cover height
 * used in calculation of flat terrain spotting distance
 * using logarithmic variation with height.
 *
 * Used for burning pile and surface fire spotting distances.
 *
 * \param firebrandHt Maximum firebrand height (ft+1)
 * \param appliedDownWindCoverHeight Adjusted down-wind canopy height
 *   based upon down-wind canopy cover (ft+1)
 * \return Minimum value of cover ht (ft+1) used in calculation
 * of flat terrain spotting distance.
 */

function criticalCoverHeight(firebrandHt, appliedDownWindCoverHeight) {
  const criticalHt = firebrandHt > 0 ? 2.2 * Math.pow(firebrandHt, 0.337) - 4 : 0;
  return Math.max(appliedDownWindCoverHeight, criticalHt);
}
/**
 * \brief Calculates maximum spotting distance over flat terrain
 * for burning piles, torching trees, and surface fires.
 *
 * \param firebrandHt Maximum firebrand height (ft+1)
 * \param criticalCoverHeight Downwind tree/vegetation cover height (ft)
 * \param u20 Wind speed at 20 ft (ft+1 min-1)
 *
 * \return Maximum spotting distance (ft+1) over flat terrain
 */

function distanceFlatTerrain(firebrandHt, criticalCoverHeight, u20) {
  // Wind speed must be converted to mi/h
  return criticalCoverHeight <= 0 || firebrandHt <= 0 ? 0 : 5280 * 0.000718 * (u20 / 88) * Math.sqrt(criticalCoverHeight) * (0.362 + Math.sqrt(firebrandHt / criticalCoverHeight) / 2 * Math.log(firebrandHt / criticalCoverHeight));
}
function distanceFlatTerrainWithDrift(flatDistance, drift) {
  return flatDistance + drift;
}
/*
 * \brief Calculates maximum spotting distance adjusted for mountain terrain.
 *
 * \param flatDistFt Maximum spotting distance over flat terrain (ft+1).
 * \param locationKey location property name
 *  ('midslopeWindward', 'valleyBottom', 'midslopeLeeward', 'ridgetop').
 * \param rvDist Horizontal distance from ridge top to valley bottom (ft+1).
 * \param rvElev Vertical distance from ridge top to valley bottom (ft+1).
 *
 * \return Maximum spotting distance (ft+1) over mountainous terrain
 */

function distanceMountainTerrain(flatDistFt, locationKey, rvDistFt, rvElev) {
  const flatDist = flatDistFt / 5280;
  const rvDist = rvDistFt / 5280;
  let mtnDist = flatDist;

  if (rvElev > 0 && rvDist > 0) {
    const a1 = flatDist / rvDist;
    const b1 = rvElev / (10 * Math.PI) / 1000;
    const factor = Location[locationKey].factor;
    let x = a1;

    for (let i = 0; i < 6; i++) {
      x = a1 - b1 * (Math.cos(Math.PI * x - factor * Math.PI / 2) - Math.cos(factor * Math.PI / 2));
    }

    mtnDist = x * rvDist;
  }

  return mtnDist * 5280;
}
/**
 * \brief Calculates critical down-wind cover height (ft+1)
 * for a surface fire.
 *
 * \param firebrandHt Maximum firebrand height (ft+1)
 * \param appliedDownWindCoverHeight Adjusted down-wind canopy height
 *   based upon down-wind canopy cover (ft+1)
 * \return Critical down-wind cover height (ft+1)
 */

function surfaceFirecriticalCoverHeight(firebrandHt, appliedDownWindCoverHeight) {
  return criticalCoverHeight(firebrandHt, appliedDownWindCoverHeight);
}
/**
 * Calculates surface fire firebrand down-wind drift distance (ft+1).
 * @param {real} firebrandHt  Firebrand loft hight (ft+1)
 * @param {real} u20 Wind speed at 20-ft (ft+1 min-1).
 */

function surfaceFireFirebrandDrift(firebrandHt, u20) {
  return firebrandHt <= 0 ? 0 : 5280 * 0.000278 * (u20 / 88) * Math.pow(firebrandHt, 0.643);
}
/**
 * \brief Calculates maximum firebrand height (ft+1) from a surface fire
 *
 * \param firelineIntensity Surface fireline intensity (btu+1 ft-1 s-1)
 * \param u20 Wind speed at 20-ft (ft+1 min-1)
 *
 * \return Maximum firebrand height (ft+1)
 */

function surfaceFireFirebrandHeight(firelineIntensity, u20) {
  if (u20 > 0 && firelineIntensity > 0) {
    // f is a function relating thermal energy to windspeed.
    const f = 322 * Math.pow(0.474 * (u20 / 88), -1.01); // Initial firebrand height (ft).

    return 1.055 * Math.sqrt(f * firelineIntensity);
  }

  return 0;
}
/**
 * Torching trees firebrand ht (ft+1)
 *
 * \param treeHt Tree height (ft+1) of the torching trees
 * \param flameHt Steady flame height (ft+1) of the toching trees
 *  as calculated by torchingTreesSteadyFlameHeight()
 * \param flameDur Steady flame duration (min+1) of the toching trees
 *  as calculated by torchingTreesSteadyFlameDuration()
 *
 * \return Maximum firebrand height (ft+1)
 */

function torchingTreesFirebrandHeight(treeHt, flameHt, flameDur) {
  const parms = [{
    a: 4.24,
    b: 0.332
  }, {
    a: 3.64,
    b: 0.391
  }, {
    a: 2.78,
    b: 0.418
  }, {
    a: 4.7,
    b: 0.0
  }];
  const ratio = flameHt <= 0 ? 0 : treeHt / flameHt;
  let idx = 3;

  if (ratio >= 1) {
    idx = 0;
  } else if (ratio >= 0.5) {
    idx = 1;
  } else if (flameDur < 3.5) {
    idx = 2;
  }

  return parms[idx].a * Math.pow(flameDur, parms[idx].b) * flameHt + 0.5 * treeHt;
}
/**
 * \brief Calculates steady state flame duration (min+1) of the toching trees
 *
 * \param species Species label of the torching trees
 * \param dbh Dbh of the torching trees (in+1)
 * \param trees Number of torching trees
 *
 * \return Flame duration (min+1) of torching trees
 */

function torchingTreesSteadyFlameDuration(species, dbh, trees) {
  return TorchingSteadyFlame[species].duration[0] * Math.pow(dbh, TorchingSteadyFlame[species].duration[1]) * Math.pow(trees, -0.2);
}
/**
 * \brief Calculates steady state flame height (ft+1) of the torching trees
 *
 * \param species Species label of the torching trees
 * \param dbh Dbh (in+1) of the torching trees
 * \param trees Number of torching trees
 * \return Steady state flame height (ft+1) of the torching trees
 */

function torchingTreesSteadyFlameHeight(species, dbh, trees) {
  return TorchingSteadyFlame[species].height[0] * Math.pow(dbh, TorchingSteadyFlame[species].height[1]) * Math.pow(trees, 0.4);
}

var Spotting = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Location: Location,
  locations: locations,
  TorchingTreeSpecies: TorchingTreeSpecies,
  TorchingSteadyFlame: TorchingSteadyFlame,
  appliedDownWindCoverHeight: appliedDownWindCoverHeight,
  burningPileFirebrandHeight: burningPileFirebrandHeight,
  criticalCoverHeight: criticalCoverHeight,
  distanceFlatTerrain: distanceFlatTerrain,
  distanceFlatTerrainWithDrift: distanceFlatTerrainWithDrift,
  distanceMountainTerrain: distanceMountainTerrain,
  surfaceFirecriticalCoverHeight: surfaceFirecriticalCoverHeight,
  surfaceFireFirebrandDrift: surfaceFireFirebrandDrift,
  surfaceFireFirebrandHeight: surfaceFireFirebrandHeight,
  torchingTreesFirebrandHeight: torchingTreesFirebrandHeight,
  torchingTreesSteadyFlameDuration: torchingTreesSteadyFlameDuration,
  torchingTreesSteadyFlameHeight: torchingTreesSteadyFlameHeight
});

/**
 * @file Surface fire functions as described by Rothermel 1972.
 *
 * Library of algorithms implementing the Rothermel (1972) mathematical model
 * of surface fire spread rate and direction of maximum spread from upslope.
 *
 * It also includes a few of the fundamental Byram and Thomas equations for
 * fireline intensity, flame length, and scorch height.  All equations
 * relating to fire elliptical growth are in BpxLibFireEllipse.
 *
 * All algorithms in this class are implemented as pure export function methods,
 * returning a single property.
 *
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 **/
function arithmeticMeanSpreadRate(cover1, ros1, ros2) {
  return cover1 * ros1 + (1 - cover1) * ros2;
}
/**
 * Calculate the `effective wind speed` of a combined slope-plus-wind spread rate coefficient.
 *
 * The `effective` wind speed is the theoretical wind speed that yields the same
 * spread rate coefficient as the combined slope-plus-wind spread rate coefficient.
 *
 * @param phiew The sum of the slope and wind coefficients.
 * @param windB Fuel bed wind factor B.
 * @param windI Fuel bed wind factor I.
 * @return The effective wind speed for the slope-plus-wind coefficient (ft+1 min-1).
 */

function effectiveWindSpeed(phiew, windB, windI) {
  let ews = 0;

  if (phiew > 0 && windB > 0 && windI > 0) {
    const a = phiew * windI;
    const b = 1.0 / windB;
    ews = Math.pow(a, b);
  }

  return ews;
}
/**
 * Calculate the effective wind speed (ft+1 min-1) from the length-to-width ratio.
 *
 * This uses Anderson's (1983) equation.
 *
 * @param lwr The fire ellipse length-to-width ratio (ratio).
 * @return The effective wind speed (ft+1 min-1).
 */

function effectiveWindSpeedFromLwr(lwr) {
  return 88 * (4 * (lwr - 1));
}
/**
 * Calculate the maximum effective wind speed limit
 * as per Rothermel (1972) equation 86 on page 33.
 *
 * @param rxi Fire reaction intensity (btu+1 ft-2 min-1).
 * @return The maximum effective wind speed limit (ft+1 min-1).
 */

function effectiveWindSpeedLimit(rxi) {
  return 0.9 * rxi;
}
function expectedValueSpreadRateMOCK(cover1, ros1, ros2) {
  return 0.5 * (arithmeticMeanSpreadRate(cover1, ros1, ros2) + harmonicMeanSpreadRate(cover1, ros1, ros2));
}
/**
 * Calculate the fire heading direction (degrees clockwise from north).
 *
 * @param upslopeFromNorth Upslope direction (degrees clockwise from north).
 * @param headingFromUpslope Fire heading direction (degrees clockwise from the upslope direction).
 * @return The fire heading direction (degrees clockwise from north).
 */
// export function headingFromNorth(upslopeFromNorth, headingFromUpslope) {
//   return compass.constrain(upslopeFromNorth + headingFromUpslope)
// }

/**
 * Calculate the fireline intensity (btu+1 ft-1 s-1) from spread rate,
 * reaction intensity, and residence time.
 *
 * @param ros The fire spread rate (ft+1 min-1).
 * @param rxi The reaction intensity (btu+1 ft-2 min-1).
 * @param taur The flame residence time (min+1)
 * @return The fireline intensity (btu+1 ft-1 s-1).
 */

function firelineIntensity(ros, rxi, taur) {
  return ros * rxi * taur / 60;
}
/**
 * Calculate the fireline intensity (btu+1 ft-1 s-1) from flame length.
 *
 * @param flame The flame length (ft+1).
 * @return The fireline intensity (btu+1 ft-1 s-1).
 */

function firelineIntensityFromFlameLength(flame) {
  return flame <= 0 ? 0 : Math.pow(flame / 0.45, 1 / 0.46);
}
/**
 * Calculate Byram's (1959) flame length (ft+1) given a fireline intensity.
 *
 * @param fli Fireline intensity (btu+1 ft-1 s-1).
 * @return Byram's (1959) flame length (ft+1).
 */

function flameLength(fli) {
  return fli <= 0 ? 0 : 0.45 * Math.pow(fli, 0.46);
}
function harmonicMeanSpreadRate(cover1, ros1, ros2) {
  if (cover1 === 0 || ros1 === 0) {
    return ros2;
  } else if (ros2 === 0) {
    return ros1;
  }

  return 1 / (cover1 / ros1 + (1 - cover1) / ros2);
}
/**
 * Calculate the fire ellipse length-to-width ratio from the
 * effective wind speed (ft+1 min-1).
 *
 * This uses Anderson's (1983) equation.
 *
 * @param effectiveWindSpeed The effective wind speed (ft+1 min-1).
 * @return The fire ellipse length-to-width ratio (ratio).
 */

function lengthToWidthRatio(effectiveWindSpeed) {
  // Wind speed MUST be in miles per hour
  return 1 + 0.25 * (effectiveWindSpeed / 88);
}
/**
 * Calculate the maximum fire spread rate under slope & wind conditions.
 *
 * @param ros0 No-wind, no-slope spread rate (ft+1 min-1).
 * @param phiEw Rothermel's (1972) `phiEw` wind-slope coefficient (ratio).
 * @return The maximum fire spread rate (ft+1 min-1).
 */

function maximumSpreadRate(ros0, phiEw) {
  return ros0 * (1 + phiEw);
}
/**
 * Calculate the wind-slope coefficient (phiEw = phiW + phiS)
 * from the individual slope (phiS) and wind (phiW) coefficients.
 *
 * @param phiW Rothermel (1972) wind coefficient `phiW` (ratio)
 * @param phiS Rothermel (1972) slope coefficient `phiS` (ratio)
 * @return Rothermel's (1972) wind-slope coefficient `phiEw` (ratio).
 */

function phiEffectiveWind(phiW, phiS) {
  return phiW + phiS;
}
/**
 * Calculate the wind-slope coefficient (phiEw = phiW + phiS)
 * from the no-wind, no-slope spread rate and an actual spread rate.
 *
 * There are 3 ways to calculate the wind-slope coefficient `phiEw`:
 * - from `phiS` and `phiW`: see phiEw(phiS,phiW)
 * - from `ros0` and `rosHead`: see phiEwInferred(ros0,rosHead)
 * - from `ews`, `windB`, and `windK`: see phiEwFromEws(ews, windB, windK)
 *
 * @param ros0 No-wind, no-slope spread rate (ft+1 min-1).
 * @param rosHead The actual spread rate (ft+1 min-1) at the fire head
 *    (possibly under cross-slope wind conditions).
 * @return Rothermel's (1972) wind-slope coefficient `phiEw` (ratio).
 */

function phiEffectiveWindInferred(ros0, rosHead) {
  return ros0 <= 0 ? 0 : rosHead / ros0 - 1;
}
/**
 * Calculate the wind-slope coefficient (phiEw = phiW + phiS)
 * from the effective wind speed.
 *
 * There are 3 ways to calculate the wind-slope coefficient `phiEw`:
 * - from `phiS` and `phiW`: see phiEw(phiS,phiW)
 * - from `ros0` and `rosHead`: see phiEwInferred(ros0,rosHead)
 * - from `ews`, `windB`, and `windK`: see phiEwFromEws(ews, windB, windK)
 *
 * @param ews The theoretical wind speed that produces
 *  the same spread rate coefficient as the current slope-wind combination.
 * @param windB
 * @param windK
 * @return Rothermel's (1972) wind-slope coefficient `phiEw` (ratio).
 */

function phiEwFromEws(ews, windB, windK) {
  return ews <= 0 ? 0 : windK * ews ** windB;
}
/** Calculate the fire spread rate slope coefficient (ratio).
 *
 * This returns Rothermel's (1972) `phiS' as per equation 51 (p 24, 26).
 *
 * @param slopeRatio Slope steepness ratio (vertical rise / horizontal reach).
 * @param slopeK Fuel Bed slope factor.
 * @return The fire spread rate slope coefficient (ratio).
 */

function phiSlope(slopeRatio, slopeK) {
  return slopeK * slopeRatio * slopeRatio;
}
/** Calculate the fire spread rate wind coefficient (ratio).
 *
 * This returns Rothermel's (1972) `phiW' as per equation 47 (p 23, 26).
 *
 * @param midflameWind Wind speed at midflame height (ft+1 min-1).
 * @param windB Fuel Bed wind factor `B`.
 * @param windK Fuel Bed wind factor `K`.
 * @return The fire spread rate wind coefficient (ratio).
 */

function phiWind(midflameWind, windB, windK) {
  return midflameWind <= 0 ? 0 : windK * Math.pow(midflameWind, windB);
}
/**
 * Calculate the maximum fire spread rate under cross-slope wind conditions.
 *
 * If the wind is blowing up-slope (or, if there is no slope, or if there is no wind),
 * then spreadRateMaximumUpSlopeWind() == spreadRateMaximumCrossSlopeWind().
 *
 * @param ros0 No-wind, no-slope spread rate (ft+1 min-1).
 * @param spreadDirVectorRate Additional spread reate (ft+1 min-1)
 *    along the cross-slope vector of maximum spread.
 * @return The maximum fire spread rate (ft+1 min-1).
 */

function spreadRateWithCrossSlopeWind(ros0, spreadDirVectorRate) {
  return ros0 + spreadDirVectorRate;
}
/**
 * Calculate the maximum spread rate after applying the effective wind speed limit.
 *
 * If the effective wind speed does not exceed the limit,
 * then spreadRateMaximumCrossSlopeWind() == spreadRateMaximumEffectiveWindSpeedLimitApplied().
 *
 * @param ros0 The no-wind, no-slope spread rate (ft+1 min-1).
 * @param phiEwLimited Rothermel's (1972) `phiEw` wind-slope coefficient (ratio)
 * AFTER applying the effective wind speed limit.
 */
// export function rosMaxEwslApplied(ros0, phiEwLimited) {
//   return ros0 * (1 + phiEwLimited)
// }

/**
 * Calculate the maximum spread rate after applying the effective wind speed upper limit.
 *
 * If the spread rate exceeds the effective wind speed
 * AND the effective wind speed exceeds 1 mph, then the
 * spread rate is reduced back to the effective wind speed.
 *
 * @param rosMax The fire maximum spread rate (ft+1 min-1)
 * @param ews The effective wind speed (ft+1 min-1).
 * @return The maximum spread rate (ft+1 min-1) after applying any effective wind speed limit.
 */

function spreadRateWithRosLimitApplied(rosMax, ews) {
  return rosMax > ews && ews > 88 ? ews : rosMax;
}
/**
 * Calculate the scorch height (ft+1) estimated from Byram's fireline
 * intensity, wind speed, and air temperature.
 *
 * @param fli Byram's fireline intensity (btu+1 ft-1 s-1).
 * @param windSpeed Wind speed (ft+1 min-1).
 * @param airTemp (oF).
 * @return The scorch height (ft+1).
 */

function scorchHeight(fli, windSpeed, airTemp) {
  const mph = windSpeed / 88;
  return fli <= 0 ? 0 : 63 / (140 - airTemp) * Math.pow(fli, 1.166667) / Math.sqrt(fli + mph * mph * mph);
}
/**
 * Calculate the scorch height (ft+1) estimated from flame length,
 * wind speed, and air temperature.
 *
 * @param flame Flame length (ft+1).
 * @param windSpeed Wind speed (ft+1 min-1).
 * @param airTemp (oF).
 * @return The scorch height (ft+1)
 */

function scorchHtFromFlame(flame, windSpeed, airTemp) {
  const fli = firelineIntensityFromFlameLength(flame);
  return scorchHeight(fli, windSpeed, airTemp);
}
/**
 * Calculate the direction of maximum spread as degrees clockwise from up-slope.
 *
 * @param xComp Vector x-component returned by spreadDirectionXComponent()
 * @param yComp Vector y-component as returned by spreadDirectionYComponent().
 * @param rosv Spread rate in the vector of maximum spread (ft+1 min-1).
 * @return The direction of maximum fire spread (degrees from upslope)
 */

function spreadDirectionFromUpslope(xComp, yComp, rosv) {
  const pi = Math.PI;
  const al = rosv <= 0 ? 0 : Math.asin(Math.abs(yComp) / rosv);
  const radians = xComp >= 0 ? yComp >= 0 ? al : pi + pi - al : yComp >= 0 ? pi - al : pi + al;
  const degrees = radians * 180 / pi;
  return degrees;
}
/**
 * Calculate the slope contribution to the spread rate.
 *
 * @param ros0 No-wind, no-wlope fire spread rate (ft+1 min-1)
 * @param phiS Slope coefficient (factor)
 * @return The slope contribution to the fire spread rate (ft+1 min-1)
 */

function maximumDirectionSlopeSpreadRate(ros0, phiS) {
  return ros0 * phiS;
}
/**
 * Calculate the wind contribution to the spread rate.
 *
 * @param ros0 No-wind, no-wlope fire spread rate (ft+1 min-1)
 * @param phiW Wind coefficient (factor)
 * @return The wind contribution to the fire spread rate (ft+1 min-1)
 */

function maximumDirectionWindSpreadRate(ros0, phiW) {
  return ros0 * phiW;
}
/**
 * Calculate the additional spread rate (ft+1 min-1) in the direction of maximum
 * spread under cross-slope wind condtions.
 *
 * @param xComp Vector x-component returned by spreadDirXComp()
 * @param yComp Vector y-component as returned by spreadDirYComp().
 * @return Cross wind - cross slope spread rate (ft+1 min-1)
 */

function maximumDirectionSpreadRate(xComp, yComp) {
  return Math.sqrt(xComp * xComp + yComp * yComp);
}
/**
 * Calculate the x-component of the spread rate vector under cross-slope wind conditions.
 *
 * @param windRate
 * @param slopeRate
 * @param windHdgAzUp Wind heading in degrees clockwise from the up-slope direction.
 */

function maximumDirectionXComponent(windRate, slopeRate, windHdgAzUp) {
  const radians = windHdgAzUp * Math.PI / 180;
  return slopeRate + windRate * Math.cos(radians);
}
/**
 * Calculate the y-component of the spread rate vector under cross-slope wind conditions.
 *
 * @param windRate
 * @param windHdgAzUp Wind heading in degrees clockwise from the up-slope direction.
 */

function maximumDirectionYComponent(windRate, windHdgAzUp) {
  const radians = windHdgAzUp * Math.PI / 180;
  return windRate * Math.sin(radians);
}
/**
 * Calculates the midflame wind speed required to attain a target fire spread rate.
 *
 * @param rosTarget Target fire spread rate (ft+1 min-1)
 * @param ros0 The fuel bed no-wind, no-slope fire spread rate (ft+1 min-1)
 * @param windB The fuel bed wind factor B
 * @param windK The fuel bed wind factor K
 * @param phiS The fuel bed slope coefficient (phi slope)
 * @return The midflame wind speed (ft+1 min-1) required to attain the target fire spread rate.
 */
// export function windSpeedAtRosTarget(rosTarget, ros0, windB, windK, phiS) {
//   if (ros0 <= 0 || windK <= 0) {
//     return 0
//   }
//   const numerator = (rosTarget / ros0) - 1 - phiS
//   const term = numerator / windK
//   return Math.pow(term, (1/windB))
// }

/**
 * Calculates the midflame wind speed required to attain a target fire spread rate.
 *
 * @param rosTarget Target fire spread rate (ft+1 min-1)
 * @param ros0 The fuel bed no-wind, no-slope fire spread rate (ft+1 min-1)
 * @param beta The fuel bed packing ratio
 * @param bedSavr The fuel bed characteristic surface area-to-volume ratio (ft-1)
 * @param slopeRatio The fuel bed slope (ratio)
 * @return The midflame wind speed (ft+1 min-1) required to attain the target fire spread rate.
 */
// export function windSpeedAtRosTarget2(rosTarget, ros0, beta, bedSavr, slopeRatio) {
//   const windB = BpxLibFuelBed.windB(bedSavr)
//   const windC = BpxLibFuelBed.windC(bedSavr)
//   const windE = BpxLibFuelBed.windE(bedSavr)
//   const betaOpt = BpxLibFuelBed.beto(bedSavr)
//   const betaRatio = beta / betaOpt
//   const windK = BpxLibFuelBed.windK(betaRatio, windE, windC)
//   const slopeK = BpxLibFuelBed.slopeK(beta)
//   const phiS = BpxLibSurfaceFire.phiS(slopeRatio, slopeK)
//   return BpxLibSurfaceFire.windSpeedAtRosTarget(rosTarget, ros0, windB, windK, phiS)
// }

var SurfaceFire = /*#__PURE__*/Object.freeze({
  __proto__: null,
  arithmeticMeanSpreadRate: arithmeticMeanSpreadRate,
  effectiveWindSpeed: effectiveWindSpeed,
  effectiveWindSpeedFromLwr: effectiveWindSpeedFromLwr,
  effectiveWindSpeedLimit: effectiveWindSpeedLimit,
  expectedValueSpreadRateMOCK: expectedValueSpreadRateMOCK,
  firelineIntensity: firelineIntensity,
  firelineIntensityFromFlameLength: firelineIntensityFromFlameLength,
  flameLength: flameLength,
  harmonicMeanSpreadRate: harmonicMeanSpreadRate,
  lengthToWidthRatio: lengthToWidthRatio,
  maximumSpreadRate: maximumSpreadRate,
  phiEffectiveWind: phiEffectiveWind,
  phiEffectiveWindInferred: phiEffectiveWindInferred,
  phiEwFromEws: phiEwFromEws,
  phiSlope: phiSlope,
  phiWind: phiWind,
  spreadRateWithCrossSlopeWind: spreadRateWithCrossSlopeWind,
  spreadRateWithRosLimitApplied: spreadRateWithRosLimitApplied,
  scorchHeight: scorchHeight,
  scorchHtFromFlame: scorchHtFromFlame,
  spreadDirectionFromUpslope: spreadDirectionFromUpslope,
  maximumDirectionSlopeSpreadRate: maximumDirectionSlopeSpreadRate,
  maximumDirectionWindSpreadRate: maximumDirectionWindSpreadRate,
  maximumDirectionSpreadRate: maximumDirectionSpreadRate,
  maximumDirectionXComponent: maximumDirectionXComponent,
  maximumDirectionYComponent: maximumDirectionYComponent
});

/**
 * Calculates the dew point temperature.
 *
 * @param {number} dbf Dry bulb air temperature (oF).
 * @param {number} wbf Wet bulb air temperature (oF).
 * @param {number} elev Elevation above mean sea level (ft).
 * @returns {number} Dew point temperature (oF).
 */
function dewPoint(dbf, wbf, elev = 0) {
  const dbc = (dbf - 32) * 5 / 9;
  const wbc = Math.min((wbf - 32) * 5 / 9, dbc); // const e1 = 6.1121 * Math.exp(17.502 * dbc / (240.97 + dbc))

  const e2 = wbc < 0 ? 6.1115 * Math.exp(22.452 * wbc / (272.55 + wbc)) : 6.1121 * Math.exp(17.502 * wbc / (240.97 + wbc));
  const p = 1013 * Math.exp(-0.0000375 * elev);
  const d = 0.66 * (1 + 0.00115 * wbc) * (dbc - wbc);
  const e3 = Math.max(0.001, e2 - d * p / 1000);
  const dpc = -240.97 / (1 - 17.502 / Math.log(e3 / 6.1121));
  const dpf = Math.max(-40, 32 + dpc * 9 / 5); // console.log(`dewPoint(${dbf}, ${wbf}, ${elev}) => ${dpf}`)

  return dpf;
}
/**
 * Calculates dew point temperature per the REA HVAC site.
 * http://www.reahvac.com/tools/humidity-formulas/
 * @param {number} dbf Dry bulb temperature (oF)
 * @param {number} rh Relative humidity (fraction [0..1])
 * @returns {number} Dew point temperature (oF)
 */

function reaDewPoint(dbf, rh) {
  const dbc = (dbf - 32) * 5 / 9;
  const es = 6.11 * Math.pow(10, 7.5 * dbc / (237.3 + dbc));
  const e = rh * es;
  const dpc = (-430.22 + 237.7 * Math.log(e)) / (-Math.log(e) + 19.08);
  const dpf = 32 + dpc * 9 / 5;
  return Math.max(-40, dpf);
}
/**
 * Calculates the relative humidity per BehavePlus.
 *
 * @param {number} dbf Dry bulb temperature (oF).
 * @param {number} dpf Dew point temperature (oF).
 * @returns {number} Relative humidity (fraction [0..1]).
 */

function relativeHumidity(dbf, dpf) {
  const rh = dpf >= dbf ? 1 : Math.exp(-7469 / (dpf + 398) + 7469 / (dbf + 398)); // console.log(`relativeHumidity(${dbf}, ${dpf}) => ${rh}`)

  return rh;
}
/**
 * Calculates relative humidity per the REA HVAC site.
 * http://www.reahvac.com/tools/humidity-formulas/
 *
 * @param {number} dbf Dry bulb temperature (oF).
 * @param {number} dpf Dew point temperature (oF).
 * @returns {number} Relative humidity (fraction, [0..1])
 */

function reaRh(dbf, dpf) {
  const dbc = (dbf - 32) * 5 / 9;
  const dpc = Math.min(dbc, (dpf - 32) * 5 / 9);
  const es = 6.11 * Math.pow(10, 7.5 * dbc / (237.3 + dbc));
  const e = 6.11 * Math.pow(10, 7.5 * dpc / (237.3 + dpc));
  const rh = e / es;
  return rh;
}
/**
 * Calculates the Heat Index per NOAA (https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml)
 *
 * The Heat Index is the apparent temperature after factoring in humidity under shady, light wind conditions.
 *
 * @param {*} db Air temperature (oF) [80..110]
 * @param {*} rh Relative humidity (%) [40, 100]
 * @returns {number} The heat index (oF). A value above 137 is generally unreliable.
 */

function heatIndex(db, rh) {
  // The computation of the heat index is a refinement of a result obtained by
  // multiple regression analysis carried out by Lans P. Rothfusz and described in
  // a 1990 National Weather Service (NWS) Technical Attachment (SR 90-23).
  // The Rothfusz regression is not appropriate when conditions of temperature and
  // humidity warrant a heat index value below about 80 degrees F. In those cases,
  // a simpler formula is applied to calculate values consistent with Steadman's results:
  // In practice, the simple formula is computed first and the result averaged with the temperature.
  // If this heat index value is 80 degrees F or higher, the full regression equation
  // along with any adjustment as described below is applied.
  let hi = 0.5 * (db + 61.0 + (db - 68.0) * 1.2 + rh * 0.094);

  if ((db + hi) / 2 < 80) {
    return hi;
  } // The regression equation of Rothfusz is:


  hi = -42.379 + 2.04901523 * db + 10.14333127 * rh - 0.22475541 * db * rh - 0.00683783 * db * db - 0.05481717 * rh * rh + 0.00122874 * db * db * rh + 0.00085282 * db * rh * rh - 0.00000199 * db * db * rh * rh; // hi is the heat index expressed as an apparent temperature in degrees F.
  // If the rh is less than 13% and the temperature is between 80 and 112 degrees F,
  // then the following adjustment is subtracted from the heat index:

  if (rh < 13 && db >= 80 && db <= 112) {
    const less = (13 - rh) / 4 * Math.sqrt((17 - Math.abs(db - 95)) / 17);
    hi -= less;
  } // On the other hand, if the rh is greater than 85% and the temperature is between
  // 80 and 87 degrees F, then the following adjustment is added to the heat index:


  if (rh > 85 && db >= 80 && db <= 97) {
    const more = (rh - 85) / 10 * ((87 - db) / 5);
    hi += more;
  }

  return hi; // The Rothfusz regression is not valid for extreme temperature and relative
  // humidity conditions beyond the range of data considered by Steadman.
}
/**
 * Calculates the summer simmer index (used for overnight low temperatures) using the
 * algorithm from https://ncalculators.com/meteorology/summer-simmer-index-calculator.htm
 *
 * @param {number} at Air temperature (oF).
 * @param {number} rh Relative humidity(%).
 * @returns {number} Summer simmer index (dl).
 */

function summerSimmerIndex(at, rh) {
  return 1.98 * (at - (0.55 - 0.0055 * rh) * (at - 58)) - 56.83;
}
function wetBulbDepression(db, wb) {
  return db - wb;
}
/**
 * Calculates the wind chill temperature.
 *
 * This uses the most recently (Nov 1, 2001) adopted formula
 * used by the US NOAA and Canadian MSC and is now part of AWIPS.
 * A new version in 2002 may add solar radiation effects.
 *
 * @param {number} at Air temperature (oF) [-45..40]
 * @param {number} ws Wind speed at 10m (mi/h) [0..60].
 * @returns {number} Wind chill temperature (oF) [-98 - +36].
 */

function windChill(at, ws) {
  const ws5 = ws > 0 ? Math.pow(ws, 0.16) : 0; // wind speed at 5 ft from 33 ft

  const wcf = 35.74 + 0.6215 * at - 35.75 * ws5 + 0.4275 * at * ws5;
  return wcf;
}

var TemperatureHumidity = /*#__PURE__*/Object.freeze({
  __proto__: null,
  dewPoint: dewPoint,
  reaDewPoint: reaDewPoint,
  relativeHumidity: relativeHumidity,
  reaRh: reaRh,
  heatIndex: heatIndex,
  summerSimmerIndex: summerSimmerIndex,
  wetBulbDepression: wetBulbDepression,
  windChill: windChill
});

/**
 * @file Tree mortality data as implemented by BehavePlus V6 and FOFEM v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
// ------------------------------------------------------------------------------
//  FOFEM tree species and equations
//  These are used in the bark thickness and tree mortality functions.
//
//  NOTE: FOFEM v6 introduced new species codes for all species, and also
// introduced 13 new species and dropped 2 other species.
//
// The FOFEM 6 genus-species abbreviations are the object key.
//  The species object properties are:
//  - 'fofem5' FOFEM 5 genus-species codes (deprecated),
//  - 'mortEq' Index to mortality equation (base 1): 1, 3, and 10-20
//      - Through BP5, there were only mortality equations 1 and 3.
//      - BP6 introduces mortality equations 10 through 20.
//  - 'barkEq' Index to single bark thickness equation (base 1)
//  - 'regions' Region list (any combination of 1, 2, 3, and/or 4, where
//      - 1 = Interior West,
//      - 2 = Pacific West,
//      - 3 = NorthEast,
//      - 4 = SouthEast).
//  - 'scientific' Scientific name
//  - 'common' Common name
// ------------------------------------------------------------------------------
// Fofem factors for determining Single Bark Thickness.
// Each FOFEM species has a SBT equation index "barkEq" [1-39] into this array.
const fofemSingleBarkThicknessFactor = [
/* 00 */
0.0, // Not used

/* 01 */
0.019, // Not used

/* 02 */
0.022,
/* 03 */
0.024,
/* 04 */
0.025,
/* 05 */
0.026,
/* 06 */
0.027,
/* 07 */
0.028,
/* 08 */
0.029,
/* 09 */
0.03,
/* 10 */
0.031,
/* 11 */
0.032,
/* 12 */
0.033,
/* 13 */
0.034,
/* 14 */
0.035,
/* 15 */
0.036,
/* 16 */
0.037,
/* 17 */
0.038,
/* 18 */
0.039,
/* 19 */
0.04,
/* 20 */
0.041,
/* 21 */
0.042,
/* 22 */
0.043,
/* 23 */
0.044,
/* 24 */
0.045,
/* 25 */
0.046,
/* 26 */
0.047,
/* 27 */
0.048,
/* 28 */
0.049,
/* 29 */
0.05,
/* 30 */
0.052,
/* 31 */
0.055,
/* 32 */
0.057, // Not used

/* 33 */
0.059,
/* 34 */
0.06,
/* 35 */
0.062,
/* 36 */
0.063, // Changed from 0.065 to 0.063 in Build 606

/* 37 */
0.068,
/* 38 */
0.072,
/* 39 */
0.081,
/* 40 */
0.0 // Reserved for Pinus palustrus (longleaf pine)
];
const data = {
  ABAM: {
    fofem5: 'ABIAMA',
    mortEq: 1,
    barkEq: 26,
    regions: 2,
    scientific: 'Abies amabilis',
    common: 'Pacific silver fir'
  },
  ABBA: {
    fofem5: 'ABIBAL',
    mortEq: 1,
    barkEq: 10,
    regions: 134,
    scientific: 'Abies balsamea',
    common: 'Balsam fir'
  },
  ABCO: {
    fofem5: 'ABICON',
    mortEq: 10,
    barkEq: 27,
    regions: 12,
    scientific: 'Abies concolor',
    common: 'White fir'
  },
  ABGR: {
    fofem5: 'ABIGRA',
    mortEq: 11,
    barkEq: 25,
    regions: 12,
    scientific: 'Abies grandis',
    common: 'Grand fir'
  },
  ABLA: {
    fofem5: 'ABILAS',
    mortEq: 11,
    barkEq: 20,
    regions: 12,
    scientific: 'Abies lasiocarpa',
    common: 'Subalpine fir'
  },
  ABMA: {
    fofem5: 'ABIMAG',
    mortEq: 16,
    barkEq: 18,
    regions: 12,
    scientific: 'Abies magnifica',
    common: 'Red fir'
  },
  ABPR: {
    fofem5: 'ABIPRO',
    mortEq: 1,
    barkEq: 24,
    regions: 2,
    scientific: 'Abies procera',
    common: 'Noble fir'
  },
  ABISPP: {
    fofem5: 'ABISPP',
    mortEq: 1,
    barkEq: 30,
    regions: 34,
    scientific: 'Abies species',
    common: 'Firs'
  },
  ACBA3: {
    fofem5: 'ACEBAR',
    mortEq: 1,
    barkEq: 8,
    regions: 4,
    scientific: 'Acer barbatum',
    common: 'Southern sugar maple'
  },
  ACLE: {
    fofem5: 'ACELEU',
    mortEq: 1,
    barkEq: 8,
    regions: 4,
    scientific: 'Acer leucoderme',
    common: 'Chalk maple'
  },
  ACMA3: {
    fofem5: 'ACEMAC',
    mortEq: 1,
    barkEq: 3,
    regions: 2,
    scientific: 'Acer macrophyllum',
    common: 'Bigleaf maple'
  },
  ACNE2: {
    fofem5: 'ACENEG',
    mortEq: 1,
    barkEq: 13,
    regions: 34,
    scientific: 'Acer negundo',
    common: 'Boxelder'
  },
  ACNI5: {
    fofem5: 'ACENIG',
    mortEq: 1,
    barkEq: 14,
    regions: 34,
    scientific: 'Acer nigrum',
    common: 'Black maple'
  },
  ACPE: {
    fofem5: 'ACEPEN',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Acer pensylvanicum',
    common: 'Striped maple'
  },
  ACRU: {
    fofem5: 'ACERUB',
    mortEq: 1,
    barkEq: 7,
    regions: 34,
    scientific: 'Acer rubrum',
    common: 'Red maple'
  },
  ACSA2: {
    fofem5: 'ACESACI',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Acer saccharinum',
    common: 'Silver maple'
  },
  ACSA3: {
    fofem5: 'ACESACU',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Acer saccharum',
    common: 'Sugar maple'
  },
  ACESPP: {
    fofem5: 'ACESPI',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Acer spicatum',
    common: 'Mountain maple'
  },
  ACSP2: {
    fofem5: 'ACESPP',
    mortEq: 1,
    barkEq: 8,
    regions: 34,
    scientific: 'Acer species',
    common: 'Maples'
  },
  AEGL: {
    fofem5: 'AESGLA',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Aesculus glabra',
    common: 'Ohio buckeye'
  },
  AEOC2: {
    fofem5: 'AESOCT',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Aesculus octandra',
    common: 'Yellow buckeye'
  },
  AIAL: {
    fofem5: 'AILALT',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Ailanthus altissima',
    common: 'Ailanthus'
  },
  ALRH2: {
    fofem5: 'ALNRHO',
    mortEq: 1,
    barkEq: 35,
    regions: 2,
    scientific: 'Alnus rhombifolia',
    common: 'White alder'
  },
  ALRU2: {
    fofem5: 'ALNRUB',
    mortEq: 1,
    barkEq: 5,
    regions: 2,
    scientific: 'Alnus rubra',
    common: 'Red alder'
  },
  AMAR3: {
    fofem5: 'AMEARB',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Amelanchier arborea',
    common: 'Common serviceberry'
  },
  ARME: {
    fofem5: 'ARBMEN',
    mortEq: 1,
    barkEq: 34,
    regions: 2,
    scientific: 'Arbutus menziesii',
    common: 'Pacific madrone'
  },
  BEAL2: {
    fofem5: 'BETALL',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Betula alleghaniensis',
    common: 'Yellow birch'
  },
  BELE: {
    fofem5: 'BETLEN',
    mortEq: 1,
    barkEq: 9,
    regions: 4,
    scientific: 'Betula lenta',
    common: 'Sweet birch'
  },
  BENI: {
    fofem5: 'BETNIG',
    mortEq: 1,
    barkEq: 8,
    regions: 34,
    scientific: 'Betula nigra',
    common: 'River birch'
  },
  BEOC2: {
    fofem5: 'BETOCC',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Betula occidentalis',
    common: 'Water birch'
  },
  BEPA: {
    fofem5: 'BETPAP',
    mortEq: 1,
    barkEq: 6,
    regions: 234,
    scientific: 'Betula papyrifera',
    common: 'Paper birch'
  },
  BETSPP: {
    fofem5: 'BETSPP',
    mortEq: 1,
    barkEq: 12,
    regions: 234,
    scientific: 'Betula species ',
    common: 'Birches'
  },
  CEOC: {
    fofem5: 'CELOCC',
    mortEq: 1,
    barkEq: 14,
    regions: 34,
    scientific: 'Celtis occidentalis',
    common: 'Common hackberry'
  },
  CAAQ2: {
    fofem5: 'CARAQU',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Carya aquatica',
    common: 'Water hickory'
  },
  CACA18: {
    fofem5: 'CARCAR',
    mortEq: 1,
    barkEq: 9,
    regions: 34,
    scientific: 'Carpinus caroliniana',
    common: 'American hornbeam'
  },
  CACOL3: {
    fofem5: 'CARCOR',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Carya cordiformis',
    common: 'Bitternut hickory'
  },
  CAGL8: {
    fofem5: 'CARGLA',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Carya glabra',
    common: 'Pignut hickory'
  },
  CAIL2: {
    fofem5: 'CARILL',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Carya illinoensis',
    common: 'Pecan'
  },
  CALA21: {
    fofem5: 'CARLAC',
    mortEq: 1,
    barkEq: 22,
    regions: 34,
    scientific: 'Carya laciniosa',
    common: 'Shellbark hickory'
  },
  CAOV2: {
    fofem5: 'CAROVA',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Carya ovata',
    common: 'Shagbark hickory'
  },
  CARSPP: {
    fofem5: 'CARSPP',
    mortEq: 1,
    barkEq: 23,
    regions: 34,
    scientific: 'Carya species',
    common: 'Hickories'
  },
  CATE9: {
    fofem5: 'CARTEX',
    mortEq: 1,
    barkEq: 19,
    regions: 4,
    scientific: 'Carya texana',
    common: 'Black hickory'
  },
  CATO6: {
    fofem5: 'CARTOM',
    mortEq: 1,
    barkEq: 22,
    regions: 34,
    scientific: 'Carya tomentosa',
    common: 'Mockernut hickory'
  },
  CACHM: {
    fofem5: 'CASCHR',
    mortEq: 1,
    barkEq: 24,
    regions: 2,
    scientific: 'Castanopsis chrysophylla',
    common: 'Giant chinkapin'
  },
  CADE12: {
    fofem5: 'CASDEN',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Castanea dentata',
    common: 'American chestnut'
  },
  CATSPP: {
    fofem5: 'CATSPP',
    mortEq: 1,
    barkEq: 16,
    regions: 4,
    scientific: 'Catalpa species',
    common: 'Catalpas'
  },
  CELA: {
    fofem5: 'CELLAE',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Celtis laevigata',
    common: 'Sugarberry'
  },
  CECA4: {
    fofem5: 'CERCAN',
    mortEq: 1,
    barkEq: 14,
    regions: 34,
    scientific: 'Cercis canadensis',
    common: 'Eastern redbud'
  },
  CHLA: {
    fofem5: 'CHALAW',
    mortEq: 1,
    barkEq: 39,
    regions: 2,
    scientific: 'Chamaecyparis lawsoniana',
    common: 'Port Orford cedar'
  },
  CHNO: {
    fofem5: 'CHANOO',
    mortEq: 1,
    barkEq: 2,
    regions: 2,
    scientific: 'Chamaecyparis nootkatenis',
    common: 'Alaska cedar'
  },
  CHTH2: {
    fofem5: 'CHATHY',
    mortEq: 1,
    barkEq: 4,
    regions: 34,
    scientific: 'Chamaecyparis thyoides',
    common: 'Atlantic white cedar'
  },
  COFL2: {
    fofem5: 'CORFLO',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Cornus florida',
    common: 'Flowering dogwood'
  },
  CONU4: {
    fofem5: 'CORNUT',
    mortEq: 1,
    barkEq: 35,
    regions: 2,
    scientific: 'Cornus nuttallii',
    common: 'Pacific dogwood'
  },
  CORSPP: {
    fofem5: 'CORSPP',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Cornus species',
    common: 'Dogwoods'
  },
  CRDO2: {
    fofem5: 'CRADOU',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Crataegus douglasii',
    common: 'Black hawthorn'
  },
  CRASPP: {
    fofem5: 'CRASPPW',
    mortEq: 1,
    barkEq: 35,
    regions: 2,
    scientific: 'Crataegus species (western)',
    common: 'Hawthorns (western)'
  },
  DIVI5: {
    fofem5: 'DIOVIR',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Diospyros virginiana',
    common: 'Persimmon'
  },
  FAGR: {
    fofem5: 'FAGGRA',
    mortEq: 1,
    barkEq: 4,
    regions: 34,
    scientific: 'Fagus grandifolia',
    common: 'American beech'
  },
  FRAM2: {
    fofem5: 'FRAAMA',
    mortEq: 1,
    barkEq: 21,
    regions: 34,
    scientific: 'Fraxinus americana',
    common: 'White ash'
  },
  FRNI: {
    fofem5: 'FRANIG',
    mortEq: 1,
    barkEq: 14,
    regions: 34,
    scientific: 'Fraxinus nigra',
    common: 'Black ash'
  },
  FRPE: {
    fofem5: 'FRAPEN',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Fraxinus pennsylvanica',
    common: 'Green ash'
  },
  FRPR: {
    fofem5: 'FRAPRO',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Fraxinus profunda',
    common: 'Pumpkin ash'
  },
  FRQU: {
    fofem5: 'FRAQUA',
    mortEq: 1,
    barkEq: 9,
    regions: 34,
    scientific: 'Fraxinus quadrangulata',
    common: 'Blue ash'
  },
  FRASPP: {
    fofem5: 'FRASPP',
    mortEq: 1,
    barkEq: 21,
    regions: 34,
    scientific: 'Fraxinus species',
    common: 'Ashes'
  },
  GLTR: {
    fofem5: 'GLETRI',
    mortEq: 1,
    barkEq: 17,
    regions: 34,
    scientific: 'Gleditsia triacanthos',
    common: 'Honeylocust'
  },
  GOLA: {
    fofem5: 'GORLAS',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Gordonia lasianthus',
    common: 'Loblolly bay'
  },
  GYDI: {
    fofem5: 'GYMDIO',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Gymnocladus dioicus',
    common: 'Kentucky coffeetree'
  },
  HALSPP: {
    fofem5: 'HALSPP',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Halesia species',
    common: 'Silverbells'
  },
  ILOP: {
    fofem5: 'ILEOPA',
    mortEq: 1,
    barkEq: 21,
    regions: 34,
    scientific: 'Ilex opaca',
    common: 'American holly'
  },
  JUCI: {
    fofem5: 'JUGCIN',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Juglans cinerea',
    common: 'Butternut'
  },
  JUNI: {
    fofem5: 'JUGNIG',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Juglans nigra',
    common: 'Black walnut'
  },
  JUOC: {
    fofem5: 'JUNOCC',
    mortEq: 1,
    barkEq: 4,
    regions: 2,
    scientific: 'Juniperus occidentalis',
    common: 'Western juniper'
  },
  JUNSPP: {
    fofem5: 'JUNSPP',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Juniperus species',
    common: 'Junipers/Redcedars'
  },
  JUVI: {
    fofem5: 'JUNVIR',
    mortEq: 1,
    barkEq: 17,
    regions: 34,
    scientific: 'Juniperus virginiana',
    common: 'Eastern red cedar'
  },
  LALA: {
    fofem5: 'LARLAR',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Larix laricina',
    common: 'Tamarack'
  },
  LALY: {
    fofem5: 'LARLYA',
    mortEq: 1,
    barkEq: 29,
    regions: 2,
    scientific: 'Larix lyallii',
    common: 'Subalpine larch'
  },
  LAOC: {
    fofem5: 'LAROCC',
    mortEq: 14,
    barkEq: 36,
    regions: 12,
    scientific: 'Larix occidentalis',
    common: 'Western larch'
  },
  LIDE: {
    fofem5: 'LIBDEC',
    mortEq: 12,
    barkEq: 34,
    regions: 2,
    scientific: 'Libocedrus decurrens',
    common: 'Incense cedar'
  },
  LIST2: {
    fofem5: 'LIQSTY',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Liquidambar styraciflua',
    common: 'Sweetgum'
  },
  LITU: {
    fofem5: 'LIRTUL',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Liriodendron tulipifera',
    common: 'Yellow poplar'
  },
  LIDE3: {
    fofem5: 'LITDEN',
    mortEq: 1,
    barkEq: 30,
    regions: 2,
    scientific: 'Lithocarpus densiflorus',
    common: 'Tanoak'
  },
  MAPO: {
    fofem5: 'MACPOM',
    mortEq: 1,
    barkEq: 16,
    regions: 4,
    scientific: 'Maclura pomifera',
    common: 'Osage orange'
  },
  MAAC: {
    fofem5: 'MAGACU',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Magnolia acuminata',
    common: 'Cucumber tree'
  },
  MAGR4: {
    fofem5: 'MAGGRA',
    mortEq: 1,
    barkEq: 12,
    regions: 4,
    scientific: 'Magnolia grandiflora',
    common: 'Southern magnolia'
  },
  MAMA2: {
    fofem5: 'MAGMAC',
    mortEq: 1,
    barkEq: 12,
    regions: 4,
    scientific: 'Magnolia macrophylla',
    common: 'Bigleaf magnolia'
  },
  MAGSPP: {
    fofem5: 'MAGSPP',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Magnolia species',
    common: 'Magnolias'
  },
  MAVI2: {
    fofem5: 'MAGVIR',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Magnolia virginiana',
    common: 'Sweetbay'
  },
  MALPRU: {
    fofem5: 'MALPRU',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Prunus species',
    common: 'Apples/Cherries'
  },
  MALSPP: {
    fofem5: 'MALSPP',
    mortEq: 1,
    barkEq: 22,
    regions: 34,
    scientific: 'Malus species',
    common: 'Apples'
  },
  MOAL: {
    fofem5: 'MORALB',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Morus alba',
    common: 'White mulberry'
  },
  MORU2: {
    fofem5: 'MORRUB',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Morus rubra',
    common: 'Red mulberry'
  },
  MORSPP: {
    fofem5: 'MORSPP',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Morus species',
    common: 'Mulberries'
  },
  NYAQ2: {
    fofem5: 'NYSAQU',
    mortEq: 1,
    barkEq: 9,
    regions: 4,
    scientific: 'Nyssa aquatica',
    common: 'Water tupelo'
  },
  NYOG: {
    fofem5: 'NYSOGE',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Nyssa ogache',
    common: 'Ogeechee tupelo'
  },
  NYSSPP: {
    fofem5: 'NYSSPP',
    mortEq: 1,
    barkEq: 4,
    regions: 34,
    scientific: 'Nyssa species',
    common: 'Tupelos'
  },
  NYSY: {
    fofem5: 'NYSSYL',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Nyssa sylvatica',
    common: 'Black gum, Black tupelo'
  },
  NYBI: {
    fofem5: 'NYSSYLB',
    mortEq: 1,
    barkEq: 16,
    regions: 4,
    scientific: 'Nyssa biflora',
    common: 'Swamp tupelo'
  },
  OSVI: {
    fofem5: 'OSTVIR',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Ostrya virginiana',
    common: 'Hophornbeam'
  },
  OXAR: {
    fofem5: 'OXYARB',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Oxydendrum arboreum',
    common: 'Sourwood'
  },
  PATO2: {
    fofem5: 'PAUTOM',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Paulownia tomentosa',
    common: 'Princess tree'
  },
  PEBO: {
    fofem5: 'PERBOR',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Persea borbonia',
    common: 'Redbay'
  },
  PIAB: {
    fofem5: 'PICABI',
    mortEq: 3,
    barkEq: 8,
    regions: 34,
    scientific: 'Picea abies',
    common: 'Norway spruce'
  },
  PIEN: {
    fofem5: 'PICENG',
    mortEq: 15,
    barkEq: 15,
    regions: 12,
    scientific: 'Picea engelmannii',
    common: 'Engelmann spruce'
  },
  PIGL: {
    fofem5: 'PICGLA',
    mortEq: 3,
    barkEq: 4,
    regions: 123,
    scientific: 'Picea glauca',
    common: 'White spruce'
  },
  PIMA: {
    fofem5: 'PICMAR',
    mortEq: 3,
    barkEq: 11,
    regions: 234,
    scientific: 'Picea mariana',
    common: 'Black spruce'
  },
  PIPU: {
    fofem5: 'PICPUN',
    mortEq: 3,
    barkEq: 10,
    regions: 1,
    scientific: 'Picea pungens',
    common: 'Blue spruce'
  },
  PIRU: {
    fofem5: 'PICRUB',
    mortEq: 3,
    barkEq: 13,
    regions: 34,
    scientific: 'Picea rubens',
    common: 'Red spruce'
  },
  PISI: {
    fofem5: 'PICSIT',
    mortEq: 3,
    barkEq: 6,
    regions: 2,
    scientific: 'Picea sitchensis',
    common: 'Sitka spruce'
  },
  PICSPP: {
    fofem5: 'PICSPP',
    mortEq: 3,
    barkEq: 13,
    regions: 34,
    scientific: 'Picea species',
    common: 'Spruces'
  },
  PIAL: {
    fofem5: 'PINALB',
    mortEq: 17,
    barkEq: 9,
    regions: 12,
    scientific: 'Pinus albicaulis',
    common: 'Whitebark pine'
  },
  PIAT: {
    fofem5: 'PINATT',
    mortEq: 1,
    barkEq: 9,
    regions: 2,
    scientific: 'Pinus attenuata',
    common: 'Knobcone pine'
  },
  PIBA2: {
    fofem5: 'PINBAN',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Pinus banksiana',
    common: 'Jack pine'
  },
  PICL: {
    fofem5: 'PINCLA',
    mortEq: 1,
    barkEq: 14,
    regions: 4,
    scientific: 'Pinus clausa',
    common: 'Sand pine'
  },
  PICO: {
    fofem5: 'PINCON',
    mortEq: 17,
    barkEq: 7,
    regions: 12,
    scientific: 'Pinus contorta',
    common: 'Lodgepole pine'
  },
  PIEC2: {
    fofem5: 'PINECH',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Pinus echinata',
    common: 'Shortleaf pine'
  },
  PIEL: {
    fofem5: 'PINELL',
    mortEq: 1,
    barkEq: 31,
    regions: 4,
    scientific: 'Pinus elliottii',
    common: 'Slash pine'
  },
  PIFL2: {
    fofem5: 'PINFLE',
    mortEq: 1,
    barkEq: 9,
    regions: 1,
    scientific: 'Pinus flexilis',
    common: 'Limber pine'
  },
  PIGL2: {
    fofem5: 'PINGLA',
    mortEq: 1,
    barkEq: 14,
    regions: 4,
    scientific: 'Pinus glabra',
    common: 'Spruce pine'
  },
  PIJE: {
    fofem5: 'PINJEF',
    mortEq: 19,
    barkEq: 37,
    regions: 12,
    scientific: 'Pinus jeffreyi',
    common: 'Jeffrey pine'
  },
  PILA: {
    fofem5: 'PINLAM',
    mortEq: 18,
    barkEq: 38,
    regions: 12,
    scientific: 'Pinus lambertiana',
    common: 'Sugar pine'
  },
  PIMO3: {
    fofem5: 'PINMON',
    mortEq: 1,
    barkEq: 14,
    regions: 12,
    scientific: 'Pinus monticola',
    common: 'Western white pine'
  },
  PIPA2: {
    fofem5: 'PINPAL',
    mortEq: 5,
    barkEq: 40,
    regions: 4,
    scientific: 'Pinus palustrus',
    common: 'Longleaf pine'
  },
  PIPO: {
    fofem5: 'PINPON',
    mortEq: 19,
    barkEq: 36,
    regions: 12,
    scientific: 'Pinus ponderosa',
    common: 'Ponderosa pine'
  },
  PIPU5: {
    fofem5: 'PINPUN',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Pinus pungens',
    common: 'Table mountain pine'
  },
  PIRE: {
    fofem5: 'PINRES',
    mortEq: 1,
    barkEq: 22,
    regions: 34,
    scientific: 'Pinus resinosa',
    common: 'Red pine'
  },
  PIRI: {
    fofem5: 'PINRIG',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Pinus rigida',
    common: 'Pitch pine'
  },
  PISA2: {
    fofem5: 'PINSAB',
    mortEq: 1,
    barkEq: 12,
    regions: 2,
    scientific: 'Pinus sabiniana',
    common: 'Gray (Digger) pine'
  },
  PISE: {
    fofem5: 'PINSER',
    mortEq: 1,
    barkEq: 35,
    regions: 34,
    scientific: 'Pinus serotina',
    common: 'Pond pine'
  },
  PINSPP: {
    fofem5: 'PINSPP',
    mortEq: 1,
    barkEq: 9,
    regions: 34,
    scientific: 'Pinus species',
    common: 'Pines'
  },
  PIST: {
    fofem5: 'PINSTR',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Pinus strobus',
    common: 'Eastern white pine'
  },
  PISY: {
    fofem5: 'PINSYL',
    mortEq: 1,
    barkEq: 9,
    regions: 34,
    scientific: 'Pinus sylvestris',
    common: 'Scots pine'
  },
  PITA: {
    fofem5: 'PINTAE',
    mortEq: 1,
    barkEq: 30,
    regions: 34,
    scientific: 'Pinus taeda',
    common: 'Loblolly pine'
  },
  PIVI2: {
    fofem5: 'PINVIR',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Pinus virginiana',
    common: 'Virginia pine'
  },
  PLOC: {
    fofem5: 'PLAOCC',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Plantus occidentalis',
    common: 'American sycamore'
  },
  POBA2: {
    fofem5: 'POPBAL',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Populus balsamifera',
    common: 'Balsam poplar'
  },
  PODE3: {
    fofem5: 'POPDEL',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Populus deltoides',
    common: 'Eastern cottonwood'
  },
  POGR4: {
    fofem5: 'POPGRA',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Populus grandidentata',
    common: 'Bigtooth aspen'
  },
  POHE4: {
    fofem5: 'POPHET',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Populus heterophylla',
    common: 'Swamp cottonwood'
  },
  POPSPP: {
    fofem5: 'POPSPP',
    mortEq: 1,
    barkEq: 17,
    regions: 34,
    scientific: 'Populus species',
    common: 'Poplars'
  },
  POTR15: {
    fofem5: 'POPTRI',
    mortEq: 1,
    barkEq: 23,
    regions: 2,
    scientific: 'Populus trichocarpa',
    common: 'Black cottonwood'
  },
  PRAM: {
    fofem5: 'PRUAME',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Prunus americana',
    common: 'American plum'
  },
  PREM: {
    fofem5: 'PRUEMA',
    mortEq: 1,
    barkEq: 35,
    regions: 2,
    scientific: 'Prunus emarginata',
    common: 'Bitter cherry'
  },
  PRPE2: {
    fofem5: 'PRUDEN',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Prunus pensylvanica',
    common: 'Pin cherry'
  },
  PRSE2: {
    fofem5: 'PRUSER',
    mortEq: 1,
    barkEq: 9,
    regions: 34,
    scientific: 'Prunus serotina',
    common: 'Black cherry'
  },
  PRVI: {
    fofem5: 'PRUVIR',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Prunus virginiana',
    common: 'Chokecherry'
  },
  PSME: {
    fofem5: 'PSEMEN',
    mortEq: 20,
    barkEq: 36,
    regions: 12,
    scientific: 'Pseudotsuga menziesii',
    common: 'Douglas-fir'
  },
  QUAG: {
    fofem5: 'QUEAGR',
    mortEq: 1,
    barkEq: 29,
    regions: 2,
    scientific: 'Quercus agrifolia',
    common: 'California live oak'
  },
  QUAL: {
    fofem5: 'QUEALB',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Quercus alba',
    common: 'White oak'
  },
  QUBI: {
    fofem5: 'QUEBIC',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Quercus bicolor',
    common: 'Swamp white oak'
  },
  QUCH2: {
    fofem5: 'QUECHR',
    mortEq: 1,
    barkEq: 3,
    regions: 2,
    scientific: 'Quercus chrysolepis',
    common: 'Canyon live oak'
  },
  QUOC2: {
    fofem5: 'QUEOCC',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Quercus coccinea',
    common: 'Scarlet oak'
  },
  QUDU: {
    fofem5: 'QUEDOU',
    mortEq: 1,
    barkEq: 12,
    regions: 2,
    scientific: 'Quercus douglasii',
    common: 'Blue oak'
  },
  QUEL: {
    fofem5: 'QUEELL',
    mortEq: 1,
    barkEq: 17,
    regions: 34,
    scientific: 'Quercus ellipsoidalis',
    common: 'Northern pin oak'
  },
  QUEN: {
    fofem5: 'QUEENG',
    mortEq: 1,
    barkEq: 33,
    regions: 2,
    scientific: 'Quercus engelmannii',
    common: 'Engelmann oak'
  },
  QUFA: {
    fofem5: 'QUEFAL',
    mortEq: 1,
    barkEq: 23,
    regions: 34,
    scientific: 'Quercus falcata',
    common: 'Southern red oak'
  },
  QUGA4: {
    fofem5: 'QUEGAR',
    mortEq: 1,
    barkEq: 8,
    regions: 2,
    scientific: 'Quercus garryana',
    common: 'Oregon white oak'
  },
  QUIM: {
    fofem5: 'QUEIMB',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Quercus imbricaria',
    common: 'Shingle oak'
  },
  QUIN: {
    fofem5: 'QUEINC',
    mortEq: 1,
    barkEq: 17,
    regions: 4,
    scientific: 'Quercus incana',
    common: 'Bluejack oak'
  },
  QUKE: {
    fofem5: 'QUEKEL',
    mortEq: 1,
    barkEq: 9,
    regions: 2,
    scientific: 'Quercus kellogii',
    common: 'Califonia black oak'
  },
  QULA2: {
    fofem5: 'QUELAE',
    mortEq: 1,
    barkEq: 16,
    regions: 4,
    scientific: 'Quercus laevis',
    common: 'Turkey oak'
  },
  QULA3: {
    fofem5: 'QUELAU',
    mortEq: 1,
    barkEq: 15,
    regions: 4,
    scientific: 'Quercus laurifolia',
    common: 'Laurel oak'
  },
  QULO: {
    fofem5: 'QUELOB',
    mortEq: 1,
    barkEq: 22,
    regions: 2,
    scientific: 'Quercus lobata',
    common: 'Valley oak'
  },
  QULY: {
    fofem5: 'QUELYR',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Quercus lyrata',
    common: 'Overcup oak'
  },
  QUMA2: {
    fofem5: 'QUEMAC',
    mortEq: 1,
    barkEq: 21,
    regions: 34,
    scientific: 'Quercus macrocarpa',
    common: 'Bur oak'
  },
  QUMA3: {
    fofem5: 'QUEMAR',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Quercus marilandica',
    common: 'Blackjack oak'
  },
  QUMI: {
    fofem5: 'QUEMIC',
    mortEq: 1,
    barkEq: 25,
    regions: 34,
    scientific: 'Quercus michauxii',
    common: 'Swamp chestnut oak'
  },
  QUMU: {
    fofem5: 'QUEMUE',
    mortEq: 1,
    barkEq: 21,
    regions: 34,
    scientific: 'Quercus muehlenbergii',
    common: 'Chinkapin oak'
  },
  QUNI: {
    fofem5: 'QUENIG',
    mortEq: 1,
    barkEq: 15,
    regions: 34,
    scientific: 'Quercus nigra',
    common: 'Water oak'
  },
  QUNU: {
    fofem5: 'QUENUT',
    mortEq: 1,
    barkEq: 9,
    regions: 4,
    scientific: 'Quercus nuttallii',
    common: 'Nuttall oak'
  },
  QUPA2: {
    fofem5: 'QUEPAL',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Quercus palustris',
    common: 'Pin oak'
  },
  QUPH: {
    fofem5: 'QUEPHE',
    mortEq: 1,
    barkEq: 20,
    regions: 34,
    scientific: 'Quercus phellos',
    common: 'Willow oak'
  },
  QUPR2: {
    fofem5: 'QUEPRI',
    mortEq: 1,
    barkEq: 28,
    regions: 34,
    scientific: 'Quercus prinus',
    common: 'Chestnut oak'
  },
  QURU: {
    fofem5: 'QUERUB',
    mortEq: 1,
    barkEq: 21,
    regions: 34,
    scientific: 'Quercus rubra',
    common: 'Northern red oak'
  },
  QUSH: {
    fofem5: 'QUESHU',
    mortEq: 1,
    barkEq: 16,
    regions: 34,
    scientific: 'Quercus shumardii',
    common: 'Shumard oak'
  },
  QUESPP: {
    fofem5: 'QUESPP',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Quercus species',
    common: 'Oaks'
  },
  QUST: {
    fofem5: 'QUESTE',
    mortEq: 1,
    barkEq: 23,
    regions: 34,
    scientific: 'Quercus stellata',
    common: 'Post oak'
  },
  QUVE: {
    fofem5: 'QUEVEL',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Quercus velutina',
    common: 'Black oak'
  },
  QUVI: {
    fofem5: 'QUEVIR',
    mortEq: 1,
    barkEq: 22,
    regions: 4,
    scientific: 'Quercus virginiana',
    common: 'Live oak'
  },
  QUWI2: {
    fofem5: 'QUEWIS',
    mortEq: 1,
    barkEq: 13,
    regions: 2,
    scientific: 'Quercus wislizenii',
    common: 'Interior live oak'
  },
  ROPS: {
    fofem5: 'ROBPSE',
    mortEq: 1,
    barkEq: 28,
    regions: 34,
    scientific: 'Robinia pseudoacacia',
    common: 'Black locust'
  },
  SABE2: {
    fofem5: 'SALDIA',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Salix bebbiana',
    common: 'Diamond willow'
  },
  SANI: {
    fofem5: 'SALNIG',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Salix nigra',
    common: 'Black willow'
  },
  SALSPP: {
    fofem5: 'SALSPP',
    mortEq: 1,
    barkEq: 20,
    regions: 234,
    scientific: 'Salix species',
    common: 'Willows'
  },
  SAAL5: {
    fofem5: 'SASALB',
    mortEq: 1,
    barkEq: 14,
    regions: 34,
    scientific: 'Sassafras albidum',
    common: 'Sassafras'
  },
  SEGI2: {
    fofem5: 'SEQGIG',
    mortEq: 1,
    barkEq: 39,
    regions: 2,
    scientific: 'Sequoiadendron gigantea',
    common: 'Giant sequoia'
  },
  SESE3: {
    fofem5: 'SEQSEM',
    mortEq: 1,
    barkEq: 39,
    regions: 2,
    scientific: 'Sequoia sempervirens',
    common: 'Redwood'
  },
  SOAM3: {
    fofem5: 'SORAME',
    mortEq: 1,
    barkEq: 19,
    regions: 3,
    scientific: 'Sorbus americana',
    common: 'American mountain ash'
  },
  TABR2: {
    fofem5: 'TAXBRE',
    mortEq: 1,
    barkEq: 4,
    regions: 12,
    scientific: 'Taxus brevifolia',
    common: 'Pacific yew'
  },
  TADI2: {
    fofem5: 'TAXDIS',
    mortEq: 1,
    barkEq: 4,
    regions: 34,
    scientific: 'Taxodium distichum',
    common: 'Bald cypress'
  },
  TAAS: {
    fofem5: 'TAXDISN',
    mortEq: 1,
    barkEq: 21,
    regions: 4,
    scientific: 'Taxodium distictum var. nutans',
    common: 'Pond cypress'
  },
  THOC2: {
    fofem5: 'THUOCC',
    mortEq: 1,
    barkEq: 4,
    regions: 34,
    scientific: 'Thuja occidentalis',
    common: 'Northern white cedar'
  },
  THPL: {
    fofem5: 'THUPLI',
    mortEq: 1,
    barkEq: 14,
    regions: 12,
    scientific: 'Thuja plicata',
    common: 'Western red cedar'
  },
  THUSPP: {
    fofem5: 'THUSPP',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Thuju species',
    common: 'Arborvitae'
  },
  TIAM: {
    fofem5: 'TILAME',
    mortEq: 1,
    barkEq: 17,
    regions: 34,
    scientific: 'Tilia americana',
    common: 'American basswood'
  },
  TIHE: {
    fofem5: 'TILHET',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Tilia heterophylla',
    common: 'White basswood'
  },
  TSCA: {
    fofem5: 'TSUCAN',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Tsuga canadensis',
    common: 'Eastern hemlock'
  },
  TSHE: {
    fofem5: 'TSUHET',
    mortEq: 1,
    barkEq: 19,
    regions: 12,
    scientific: 'Tsuga heterophylla',
    common: 'Western hemlock'
  },
  TSME: {
    fofem5: 'TSUMER',
    mortEq: 1,
    barkEq: 19,
    regions: 12,
    scientific: 'Tsuga mertensiana',
    common: 'Mountain hemlock'
  },
  ULAL: {
    fofem5: 'ULMALA',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Ulmus alata',
    common: 'Winged elm'
  },
  ULAM: {
    fofem5: 'ULMAME',
    mortEq: 1,
    barkEq: 10,
    regions: 34,
    scientific: 'Ulmus americana',
    common: 'American elm'
  },
  ULPU: {
    fofem5: 'ULMPUM',
    mortEq: 1,
    barkEq: 17,
    regions: 34,
    scientific: 'Ulmus pumila',
    common: 'Siberian elm'
  },
  ULRU: {
    fofem5: 'ULMRUB',
    mortEq: 1,
    barkEq: 11,
    regions: 34,
    scientific: 'Ulmus rubra',
    common: 'Slippery elm'
  },
  ULMSPP: {
    fofem5: 'ULMSPP',
    mortEq: 1,
    barkEq: 18,
    regions: 34,
    scientific: 'Ulmus species',
    common: 'Elms'
  },
  ULTH: {
    fofem5: 'ULMTHO',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Ulmus thomasii',
    common: 'Rock elm'
  },
  UMCA: {
    fofem5: 'UMBCAL',
    mortEq: 1,
    barkEq: 5,
    regions: 2,
    scientific: 'Umbellularia californica',
    common: 'California laurel'
  },
  ABLO: {
    fofem5: 'ABLO',
    mortEq: 10,
    barkEq: 27,
    regions: 12,
    scientific: 'Abies lowiana',
    common: 'Sierra white fir'
  },
  ABNO: {
    fofem5: 'ABNO',
    mortEq: 1,
    barkEq: 24,
    regions: 12,
    scientific: 'Abies nobilis',
    common: 'Noble fir'
  },
  AEFL: {
    fofem5: 'AEFL',
    mortEq: 1,
    barkEq: 29,
    regions: 34,
    scientific: 'Aesculus flava',
    common: 'Yellow buckeye'
  },
  CANO9: {
    fofem5: 'CANO9',
    mortEq: 1,
    barkEq: 2,
    regions: 2,
    scientific: 'Callitropsis nootkatensis',
    common: 'Alaska cedar'
  },
  CADE27: {
    fofem5: 'CADE27',
    mortEq: 12,
    barkEq: 34,
    regions: 12,
    scientific: 'Calocedrus decurrens',
    common: 'Incense cedar'
  },
  CAAL27: {
    fofem5: 'CAAL27',
    mortEq: 1,
    barkEq: 22,
    regions: 34,
    scientific: 'Carya alba',
    common: 'Mockernut hickory'
  },
  CACA38: {
    fofem5: 'CACA38',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Carya carolinae septentrionalis',
    common: 'Shagbark hickory'
  },
  CAAM29: {
    fofem5: 'CAAM29',
    mortEq: 1,
    barkEq: 19,
    regions: 34,
    scientific: 'Castenea Americana',
    common: 'American chestnut'
  },
  CHCHC4: {
    fofem5: 'CHCHC4',
    mortEq: 1,
    barkEq: 24,
    regions: 34,
    scientific: 'Chrysolepis chrysophylla',
    common: 'Giant chinkapin'
  },
  CUNO: {
    fofem5: 'CUNO',
    mortEq: 1,
    barkEq: 2,
    regions: 2,
    scientific: 'Cupressus nootkatensis',
    common: 'Nootka cypress'
  },
  CUTH: {
    fofem5: 'CUTH',
    mortEq: 1,
    barkEq: 4,
    regions: 2,
    scientific: 'Cupressus thyoides',
    common: 'Atlantic white cedar'
  },
  QUTE: {
    fofem5: 'QUTE',
    mortEq: 1,
    barkEq: 9,
    regions: 34,
    scientific: 'Quercus texana',
    common: 'Texas red oak'
  },
  ULRA: {
    fofem5: 'ULRA',
    mortEq: 1,
    barkEq: 12,
    regions: 34,
    scientific: 'Ulmus racemosa',
    common: 'Rock elm'
  }
};

/* eslint-disable brace-style */

/*! \brief Calculates the aspen mortality rate.
 *
 *  \param severity Fire severity level: 0 = low severity, 1= moderate+ severity
 *  \param flameLength Flame length of the fire at the tree (ft).
 *  \param dbh          Aspen diameter at breast height (in).
 *
 *  \return Aspen mortality rate (fraction).
 */

function aspenMortality(severity, flameLength, dbh) {
  const ch = flameLength / 1.8;
  return severity < 1 ? fraction(1 / (1 + Math.exp(-4.407 + 0.638 * dbh - 2.134 * ch))) : fraction(1 / (1 + Math.exp(-2.157 + 0.218 * dbh - 3.6 * ch)));
}
function barkThickness(fofem6Code, dbh) {
  ensureFofem6Code(fofem6Code);
  const equationIdx = data[fofem6Code].barkEq;
  ensureEquationIdx(fofem6Code, equationIdx); // In FOFEM 6, longleaf pine has its own bark thickness formula and uses dbh in cm

  if (equationIdx === 40) {
    const dbhCm = 2.54 * dbh; // dbh in cm

    const barkCm = 0.435 + 0.031 * dbhCm; // bark thickness in cm

    return barkCm / 2.54; // bark thickness in inches
  }

  return fofemSingleBarkThicknessFactor[equationIdx] * dbh;
}
/**
 * Calculates fraction of crown length scorched.
 * @param {real} treeHt Tree height (ft)
 * @param {real} baseHt Tree crown base height (ft)
 * @param {real} scorchHt Scorch height (ft)
 * @return {real} Fraction of crown length that was scorched (ft/ft)
 */

function crownLengthScorched(treeHt, baseHt, scorchHt) {
  // Tree crown length (ft) and base height (ft)
  const crownLength = treeHt - baseHt; // Tree crown length scorched (ft)

  const scorchLength = positive(Math.min(scorchHt, treeHt) - baseHt); // Fraction of the crown length scorched (ft/ft)

  return divide(scorchLength, crownLength);
}
/**
 * Calculates fraction of crown volume scorched.
 * @param {real} treeHt Tree height (ft)
 * @param {real} baseHt Tree crown base height (ft)
 * @param {real} scorchHt Scorch height (ft)
 * @return {real} Fraction of crown volume that was scorched (ft3/ft3)
 */

function crownVolumeScorched(treeHt, baseHt, scorchHt) {
  // Tree crown length (ft) and base height (ft)
  const crownLength = treeHt - baseHt; // Tree crown length scorched (ft)

  const scorchLength = positive(Math.min(scorchHt, treeHt) - baseHt); // Fraction of the crown volume scorched (ft3/ft3)

  return divide(scorchLength * (2 * crownLength - scorchLength), crownLength * crownLength);
}
function ensureEquationIdx(fofem6Code, equationIdx) {
  if (equationIdx < 0 || equationIdx >= fofemSingleBarkThicknessFactor.length) {
    throw new Error(`Tree Mortality Fofem6 species code '${fofem6Code}' bark thickness index '${equationIdx}' is invalid`);
  }
}
function ensureFofem6Code(fofem6Code) {
  if (!hasFofem6Code(fofem6Code)) {
    throw new Error(`Tree Mortality Fofem6 species code '${fofem6Code}' is invalid`);
  }
}
function commonNames() {
  return fofem6Codes().map(key => data[key].common);
}
function fofem5Codes() {
  return fofem6Codes().map(key => data[key].fofem5);
}
function fofem6Codes() {
  return Object.keys(data);
}
function scientificNames() {
  return fofem6Codes().map(key => data[key].scientific);
}
function hasFofem6Code(fofem6Code) {
  return Object.prototype.hasOwnProperty.call(data, fofem6Code);
}
/**
 *  Calculates probability of tree mortality using the FOFEM 6.0
 *  equations for trees with dbh >= 1.
 *
 *  This is only a partial implementation of the FOFEM mortality algorithm.
 *  Specifically, it only implements those cases where the tree dbh >= 1".
 *  It also excludes the FOFEM special case of \e Populus \e tremuloides,
 *  which requires additional inputs (namely, flame height and fire severity).
 *
 * @param {string} fofem6Code FOFEM 6 tree species code
 * @param {number} dbh Tree diameter at breast height (in)
 * @param {number} treeHt Tree total height (ft)
 * @param {number} baseHt Tree crown base height (ft)
 * @param {number} scorchHt Scorch height (ft)
 */

function mortalityRate(fofem6Code, dbh, treeHt, baseHt, scorchHt) {
  const clsFraction = crownLengthScorched(treeHt, baseHt, scorchHt);
  const cvsFraction = crownVolumeScorched(treeHt, baseHt, scorchHt);
  const clsPercent = 100 * clsFraction;
  const cvsPercent = 100 * cvsFraction;
  const equationId = data[fofem6Code].mortEq;
  let mr = 0; // Pat requested that if scorch ht is zero, then mortality is zero

  if (scorchHt <= 0) {
    return mr;
  } // Equation 5 is specifically for Pinus palustris (longleaf pine)
  // Note that bark thickness is in cm


  if (equationId === 5) {
    // This equation uses crown volume scorched as a scale of 1-10
    const cvsScale = cvsPercent / 10;
    const barkCm = 2.54 * barkThickness(fofem6Code, dbh);
    mr = 0.169 + 5.136 * barkCm + 14.492 * barkCm * barkCm - 0.348 * cvsScale * cvsScale;
    mr = 1 / (1 + Math.exp(mr));
  } // Equation 10 is specifically for Abies concolor (white fir)
  else if (equationId === 10) {
      mr = -3.5083 + 0.0956 * clsPercent - 0.00184 * clsPercent * clsPercent + 0.000017 * clsPercent * clsPercent * clsPercent;
      mr = 1 / (1 + Math.exp(-mr));
    } // Equation 11 is specifically for Abies lasiocarpa (subalpine fir)
    // and Abies grandis (grad fir)
    else if (equationId === 11) {
        mr = -1.695 + 0.2071 * cvsPercent - 0.0047 * cvsPercent * cvsPercent + 0.000035 * cvsPercent * cvsPercent * cvsPercent;
        mr = 1 / (1 + Math.exp(-mr));
      } // Equation 12 is specifically for Libocedrus decurrens (incense cedar)
      else if (equationId === 12) {
          mr = -4.2466 + 0.000007172 * clsPercent * clsPercent * clsPercent;
          mr = 1 / (1 + Math.exp(-mr));
        } // Equation 14 is specifically for Larix occidentalis (western larch)
        // Note that this is from Hood, so dbh is in cm
        else if (equationId === 14) {
            mr = -1.6594 + 0.0327 * cvsPercent - 0.0489 * (2.54 * dbh);
            mr = 1 / (1 + Math.exp(-mr));
          } // Equation 15 is specifically for Picea engelmannii (Englemann spruce)
          else if (equationId === 15) {
              mr = 0.0845 + 0.0445 * cvsPercent;
              mr = 1 / (1 + Math.exp(-mr));
            } // Equation 16 is specifically for Abies magnifica (red fir)
            else if (equationId === 16) {
                mr = -2.3085 + 0.000004059 * clsPercent * clsPercent * clsPercent;
                mr = 1 / (1 + Math.exp(-mr));
              } // Equation 17 is specifically for Pinus albicaulis (whitebark pine)
              // and Pinus contorta (lodgepole pine)
              // Note that this is from Hood, so dbh is in cm
              else if (equationId === 17) {
                  mr = -0.3268 + 0.1387 * cvsPercent - 0.0033 * cvsPercent * cvsPercent + 0.000025 * cvsPercent * cvsPercent * cvsPercent - 0.0266 * (2.54 * dbh);
                  mr = 1 / (1 + Math.exp(-mr));
                } // Equation 18 is specifically for Pinus lambertiana (sugar pine)
                else if (equationId === 18) {
                    mr = -2.0588 + 0.000814 * clsPercent * clsPercent;
                    mr = 1 / (1 + Math.exp(-mr));
                  } // Equation 19 is specifically for Pinus ponderosa (ponderosa pine)
                  // and Pinus jeffreyi (Jeffry pine)
                  else if (equationId === 19) {
                      mr = -2.7103 + 0.000004093 * cvsPercent * cvsPercent * cvsPercent;
                      mr = 1 / (1 + Math.exp(-mr));
                    } // Equation 20 is specifically for Pseudotsuga menziesii (Douglas-fir)
                    else if (equationId === 20) {
                        mr = -2.0346 + 0.0906 * cvsPercent - 0.0022 * cvsPercent * cvsPercent + 0.000019 * cvsPercent * cvsPercent * cvsPercent;
                        mr = 1 / (1 + Math.exp(-mr));
                      } // Equation 1 is the default mortality equation for all species with dbh > 1"
                      // Equation 3 is for spruce species
                      // its the same as Equation 1 but with a minimum value of 0.8
                      else {
                          // if (equationId === 1 || equationId === 3) {
                          const bark = barkThickness(fofem6Code, dbh);
                          mr = -1.941 + 6.316 * (1 - Math.exp(-bark)) - 5.35 * cvsFraction * cvsFraction;
                          mr = 1 / (1 + Math.exp(mr));
                          mr = equationId === 3 ? Math.max(0.8, mr) : mr;
                        }

  return fraction(mr);
}

var TreeMortality = /*#__PURE__*/Object.freeze({
  __proto__: null,
  aspenMortality: aspenMortality,
  barkThickness: barkThickness,
  crownLengthScorched: crownLengthScorched,
  crownVolumeScorched: crownVolumeScorched,
  ensureEquationIdx: ensureEquationIdx,
  ensureFofem6Code: ensureFofem6Code,
  commonNames: commonNames,
  fofem5Codes: fofem5Codes,
  fofem6Codes: fofem6Codes,
  scientificNames: scientificNames,
  hasFofem6Code: hasFofem6Code,
  mortalityRate: mortalityRate
});

/**
 * @file Western aspen dynamic fuel model equations
 * as described by Brown and Simmerman (1986) and implemented by BehavePlus V6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins
 * @license MIT
 */
const ppsf = 2000 / 43560; // Array curing levels are [0, 0.3, 0.5, 0.7 0.9, 1]

const Table = {
  aspenShrub: {
    depth: 0.65,
    dead1Load: [0.8, 0.893, 1.056, 1.218, 1.379, 1.4595],
    dead1Savr: [1440.0, 1620.0, 1910.0, 2090.0, 2220.0, 2285.0],
    dead10Load: 0.975,
    liveHerbLoad: [0.335, 0.234, 0.167, 0.1, 0.033, 0.0],
    liveStemLoad: [0.403, 0.403, 0.333, 0.283, 0.277, 0.274],
    liveStemSavr: [2440.0, 2440.0, 2310.0, 2090.0, 1670.0, 1670.0]
  },
  aspenTallForb: {
    depth: 0.3,
    dead1Load: [0.738, 0.93, 1.056, 1.183, 1.309, 1.372],
    dead1Savr: [1480.0, 1890.0, 2050.0, 2160.0, 2240.0, 2280.0],
    dead10Load: 0.475,
    liveHerbLoad: [0.665, 0.465, 0.332, 0.199, 0.067, 0.0],
    liveStemLoad: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    liveStemSavr: [2440.0, 2440.0, 2440.0, 2440.0, 2440.0, 2440.0]
  },
  aspenLowForb: {
    depth: 0.18,
    dead1Load: [0.601, 0.645, 0.671, 0.699, 0.73, 0.7455],
    dead1Savr: [1400.0, 1540.0, 1620.0, 1690.0, 1750.0, 1780.0],
    dead10Load: 1.035,
    liveHerbLoad: [0.15, 0.105, 0.075, 0.045, 0.015, 0.0],
    liveStemLoad: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    liveStemSavr: [2440.0, 2440.0, 2440.0, 2440.0, 2440.0, 2440.0]
  },
  mixedShrub: {
    depth: 0.5,
    dead1Load: [0.88, 0.906, 1.037, 1.167, 1.3, 1.3665],
    dead1Savr: [1350.0, 1420.0, 1710.0, 1910.0, 2060.0, 2135.0],
    dead10Load: 1.34,
    liveHerbLoad: [0.1, 0.07, 0.05, 0.03, 0.01, 0.0],
    liveStemLoad: [0.455, 0.455, 0.364, 0.29, 0.261, 0.2465],
    liveStemSavr: [2530.0, 2530.0, 2410.0, 2210.0, 1800.0, 1800.0]
  },
  mixedForb: {
    depth: 0.18,
    dead1Load: [0.754, 0.797, 0.825, 0.854, 0.884, 0.899],
    dead1LoadDEPRECATED: [0.754, 0.797, 0.825, 1.167, 0.884, 0.899],
    dead1Savr: [1420.0, 1540.0, 1610.0, 1670.0, 1720.0, 1745.0],
    dead10Load: 1.115,
    liveHerbLoad: [0.15, 0.105, 0.075, 0.045, 0.015, 0.0],
    liveStemLoad: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    liveStemSavr: [2440.0, 2440.0, 2440.0, 2440.0, 2440.0, 2440.0]
  }
};
const Types = Object.keys(Table);
function interpolate(curingLevel, valueAtLevel) {
  const Curing = [0.0, 0.3, 0.5, 0.7, 0.9, 1.000000001];
  const cl = fraction(curingLevel);
  let fraction$1 = 0;

  for (let idx = 1; idx <= 4; idx += 1) {
    if (cl <= Curing[idx]) {
      fraction$1 = 1 - (Curing[idx] - cl) / (Curing[idx] - Curing[idx - 1]);
      return valueAtLevel[idx - 1] + fraction$1 * (valueAtLevel[idx] - valueAtLevel[idx - 1]);
    }
  }

  return valueAtLevel[5];
}
function deadMext() {
  return 0.25;
}
function has(fuelType) {
  return Object.keys(Table).includes(fuelType);
}
function depth(fuelType) {
  return has(fuelType) ? Table[fuelType].depth : 0.01;
}
function deadFineLoad(fuelType, curingLevel) {
  return has(fuelType) ? ppsf * interpolate(curingLevel, Table[fuelType].dead1Load) : 0;
}
function deadFineSavr(fuelType, curingLevel) {
  return has(fuelType) ? interpolate(curingLevel, Table[fuelType].dead1Savr) : 1;
}
function deadSmallLoad(fuelType) {
  return has(fuelType) ? ppsf * Table[fuelType].dead10Load : 0;
}
function fuelTypes() {
  return Object.keys(Table);
} // Live herb

function liveHerbLoad(fuelType, curingLevel) {
  return has(fuelType) ? ppsf * interpolate(curingLevel, Table[fuelType].liveHerbLoad) : 0;
} // Live stem

function liveStemLoad(fuelType, curingLevel) {
  return has(fuelType) ? ppsf * interpolate(curingLevel, Table[fuelType].liveStemLoad) : 0;
}
function liveStemSavr(fuelType, curingLevel) {
  return has(fuelType) ? interpolate(curingLevel, Table[fuelType].liveStemSavr) : 1;
}

var WesternAspenFuel = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Types: Types,
  interpolate: interpolate,
  deadMext: deadMext,
  has: has,
  depth: depth,
  deadFineLoad: deadFineLoad,
  deadFineSavr: deadFineSavr,
  deadSmallLoad: deadSmallLoad,
  fuelTypes: fuelTypes,
  liveHerbLoad: liveHerbLoad,
  liveStemLoad: liveStemLoad,
  liveStemSavr: liveStemSavr
});

/**
 * @file Wind functions as implemented by BehavePlus v6.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
function speedAt10m(ws20ft) {
  return 1.13 * ws20ft;
}
function speedAt20ft(ws10m) {
  return ws10m / 1.13;
}
function speedAt20ftFromMidflame(wsmid, mwaf) {
  return mwaf > 0 ? divide(wsmid, mwaf) : wsmid;
}
function speedAtMidflame(ws20ft, mwaf) {
  return mwaf * ws20ft;
}

var Wind = /*#__PURE__*/Object.freeze({
  __proto__: null,
  speedAt10m: speedAt10m,
  speedAt20ft: speedAt20ft,
  speedAt20ftFromMidflame: speedAt20ftFromMidflame,
  speedAtMidflame: speedAtMidflame
});

var Lib = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BehaveFuel: BehaveFuel,
  Calc: Calc,
  Canopy: Canopy,
  ChaparralFuel: ChaparralFuel,
  Compass: Compass,
  CrownFire: CrownFire,
  CrownSpotting: CrownSpotting,
  Dag: Dag$1,
  FireEllipse: FireEllipse,
  FuelBed: FuelBed,
  FuelCatalog: FuelCatalog,
  FuelMoisture: FuelMoisture,
  FuelParticle: FuelParticle,
  IgnitionProbability: IgnitionProbability$1,
  PalmettoGallberryFuel: PalmettoGallberryFuel,
  Spotting: Spotting,
  SurfaceFire: SurfaceFire,
  TemperatureHumidity: TemperatureHumidity,
  TreeMortality: TreeMortality,
  WesternAspenFuel: WesternAspenFuel,
  Wind: Wind
});

/**
 * @file ValidationResult returned by validateNativeValue()
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
class ValidationResult {
  constructor(valid, value, message = '') {
    return {
      valid: valid,
      value: value,
      message: message
    };
  }

}

/**
 * @file Abstract base _Variant class from which _Numeric, Text, and Option classes are extended.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
  * _Variant is an ABSTRACT class and should never be instantiated by the client.
  *
  * _Variant is extended by:
  * - _Blob
  * - Bool
  * - _Numeric
  *   - Float
  *     - Quantity
  *   - Integer
  *     - Count
  *     - Size
  * - Option
  *   - Config
  * - Text
  *
  * New Methods:
  * - defaultValue()
  * - key()
  */

class _Variant {
  constructor(key, defaultValue) {
    const signature = `new _Variant(${key}, ${defaultValue})`;

    if (typeof key !== 'string') {
      throw new Error(signature + ' requires arg 1 \'key\' to be of type \'string\'');
    } else if (typeof defaultValue === 'undefined') {
      throw new Error(signature + ' requires arg 2 \'defaultValue\' of \'any\' type');
    } else if (key === '') {
      throw new Error(signature + ' requires arg 1 \'key\' to be non-empty string');
    }

    this._key = key;
    this._value = {
      _default: defaultValue
    };
  } // FINAL - implemented only here


  key() {
    return this._key;
  }

  defaultValue() {
    return this._value._default;
  }
  /**
   * @returns {string} The Variable's label.
   */


  label() {
    return keyLabel(this._key);
  } // Overridden by EVERY _Variant subclass


  defaultDisplayString() {
    return this.displayString(this._value._default);
  }

  defaultDisplayValue() {
    return this.displayValue(this._value._default);
  }

  displayString(value) {
    return value.toString();
  }

  displayValue(value) {
    return value.toString();
  }

  inputHint() {
    return '';
  }

  isValidDisplayValue(inputText) {
    return this.validateDisplayValue(inputText).valid;
  }

  isValidNativeValue(value) {
    return this.validateNativeValue(value).valid;
  }

  validateDisplayValue(inputText) {
    const inputValue = inputText;
    return this.validateNativeValue(inputValue);
  }

  validateNativeValue(value) {
    return new ValidationResult(false, value, 'Must be reimplemented by _Variant subclass');
  } // Overriden and final by _Variant => _Numeric


  maximumValue() {
    return this._value._default;
  }

  minimumValue() {
    return this._value._default;
  }

  stepValue() {
    return this._value._default;
  } // Overriden and final by _Variant => _Numeric => Float


  maximumDisplayValue() {
    return this.maximumValue().toString();
  }

  minimumDisplayValue() {
    return this.minimumValue().toString();
  }

  stepDisplayValue() {
    return this.stepValue().toString();
  }

  setDisplayDecimals() {
    return this;
  }

  setDisplayToExponential() {
    return this;
  }

  setDisplayToFixed() {
    return this;
  }

  setDisplayToPrecision() {
    return this;
  } // Overriden and final by _Variant => _Numeric => Float => Quantity


  displayUnits() {
    return '';
  }

  displayValueToNativeValue(value) {
    return value;
  }

  maximumDisplayString() {
    return this.maximumDisplayValue();
  }

  minimumDisplayString() {
    return this.minimumDisplayValue();
  }

  stepDisplayString() {
    return this.stepDisplayValue();
  }

  nativeUnits() {
    return '';
  }

  nativeValueToDisplayValue(value) {
    return value;
  }

  setDisplayUnits() {
    return this;
  } // Overridden and final by Option


  hasOption() {
    return false;
  }

  options() {
    return [];
  }

  optionText() {
    return '';
  }

  optionTexts() {
    return [];
  }

  prompt() {
    return this.inputHint();
  }

}

/**
 * @file Abstract _Numeric Variant class from which Float and Integer classes are extended
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * _Numeric is an ABSTRACT CLASS and should never be instantiated by the client.
 *
 * _Numeric extends _Variant by
 * - enforcing numeric values within a specified range
 * - validating input text as valid numbers
 *
 * New methods:
 * - inputHint()
 * - isValidDisplayValue(inputText)
 * - maximumValue()
 * - minimumValue()
 * - stepValue()
 * - validateDisplayValue(inputText)
 * - validateNativeValue(value)
 */

class _Numeric extends _Variant {
  constructor(key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1) {
    const signature = `new _Numeric(${key}, ${defaultValue}, ${minValue}, ${maxValue}, ${stepValue})`;

    if (typeof defaultValue !== 'number') {
      throw new Error(signature + ' requires arg 2 \'defaultValue\' to be a \'number\'');
    } else if (typeof minValue !== 'number') {
      throw new Error(signature + ' requires arg 3 \'minValue\' to be a \'number\'');
    } else if (typeof maxValue !== 'number') {
      throw new Error(signature + ' requires arg 4 \'maxValue\' to be a \'number\'');
    } else if (typeof stepValue !== 'number') {
      throw new Error(signature + ' requires arg 5 \'stepValue\' to be a \'number\'');
    } else if (minValue > maxValue) {
      throw new Error(signature + 'requires arg 3 \'minValue\' to be less than arg 3 \'maxValue\'');
    } else if (defaultValue < minValue) {
      throw new Error(signature + 'requires arg 2 \'defaultValue\' to be greater than arg 3 \'minValue\'');
    } else if (defaultValue > maxValue) {
      throw new Error(signature + 'requires arg 2 \'defaultValue\' to be less than arg 4 \'maxValue\'');
    }

    super(key, defaultValue);
    this._value._minimum = minValue;
    this._value._maximum = maxValue;
    this._value._step = stepValue;
  } // defaultDisplayString() { return this.defaultDisplayValue() }
  // defaultDisplayValue() { return this.displayString('Numeric '+this.defaultValue()) }


  displayString(value) {
    return value.toString();
  }

  displayValue(value) {
    return value.toString();
  }

  inputHint() {
    return `${this.minimumValue()} - ${this.maximumValue()}`;
  }

  isValidDisplayValue(inputText) {
    return this.validateDisplayValue(inputText).valid;
  }

  isValidNativeValue(value) {
    if (typeof value !== 'number') return false;
    return this.validateNativeValue(value).valid;
  }

  maximumValue() {
    return this._value._maximum;
  }

  minimumValue() {
    return this._value._minimum;
  }

  stepValue() {
    return this._value._step;
  }

  validateDisplayValue(inputText) {
    // filter invalid characters from input text
    const filtered = filterNumeric(inputText); // cast from text to number, boolean, object, or some other string

    const inputValue = parseFloat(filtered);

    if (isNaN(inputValue)) {
      return new ValidationResult(false, filtered, 'Not a valid number');
    } // Now we have a number value to convert to native units


    return this.validateNativeValue(inputValue);
  }

  validateNativeValue(value) {
    if (value < this._value._minimum) {
      return new ValidationResult(false, value, `Less than minimum value of ${this._value._minimum}`);
    } else if (value > this._value._maximum) {
      return new ValidationResult(false, value, `Greater than maximum value of ${this._value._maximum}`);
    }

    return new ValidationResult(true, value);
  }

}

/**
 * @file Integer Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Integer is a Numeric Variant whose value is an integer.
 */

class Integer extends _Numeric {
  constructor(key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1) {
    const signature = `new Integer(${key}, ${defaultValue}, ${minValue}, ${maxValue}, ${stepValue})`;

    if (typeof defaultValue !== 'number' || Number.isInteger(defaultValue) === false) {
      throw new Error(signature + ' requires arg 2 \'defaultValue\' to be an integer');
    } else if (typeof minValue !== 'number' || Number.isInteger(minValue) === false) {
      throw new Error(signature + ' requires arg 3 \'minValue\' to be an integer');
    } else if (typeof maxValue !== 'number' || Number.isInteger(maxValue) === false) {
      throw new Error(signature + ' requires arg 4 \'maxValue\' to be an integer');
    } else if (typeof stepValue !== 'number' || Number.isInteger(stepValue) === false) {
      throw new Error(signature + ' requires arg 5 \'stepValue\' to be an integer');
    }

    super(key, defaultValue, minValue, maxValue, stepValue);
  }

  _formatValue(value) {
    const int = Math.round(value); // Decorate with commas, prefix, suffix...

    return int.toString();
  }

  displayString(nativeValue) {
    return this.displayValue(nativeValue);
  }

  displayValue(nativeValue) {
    return this._formatValue(nativeValue);
  }

  validateDisplayValue(inputText) {
    // filter invalid characters from input text
    const filtered = filterInteger(inputText); // cast from text to number, boolean, object, or some other string

    const inputValue = parseInt(filtered);

    if (isNaN(inputValue)) {
      return new ValidationResult(false, filtered, 'Not a valid number');
    } // Now we have a number value to convert to native units


    return this.validateNativeValue(inputValue);
  }

}

/**
 * @file Count Variant classes
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Count is an Integer Variant whose minimum value is 0.
 */

class Count extends Integer {
  constructor(key, defaultValue = 0, maxValue = Number.MAX_VALUE, stepValue = 1) {
    super(key, defaultValue, 0, maxValue, stepValue);
  }

}

/**
 * @file ArrayIndex Variant classes
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * ArrayIndex is an Count Variant whose maximum value is size-1.
 */

class ArrayIndex extends Count {
  constructor(key, maxSize = 1) {
    super(key, 0, maxSize - 1, 1);
    this._value._maxSize = maxSize;
  }

}

/**
 * @file Bool Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Bool is a Variant whose value is a Javascript boolean primitive
 */

class Bool extends _Variant {
  /**
   * @param {bool} defaultValue
   * @param {string} falseText
   * @param {string} trueText
   * @param {string} prompt Input prompt text
   */
  constructor(key, defaultValue = false, falseText = 'false', trueText = 'true', prompt = '') {
    const signature = `new Bool('${key}', '${defaultValue}', '${falseText}', '${trueText}', '${prompt}') `;

    if (typeof defaultValue !== 'boolean') {
      throw new Error(signature + 'arg 2 \'defaultValue\' must be a boolean');
    } else if (typeof falseText !== 'string') {
      throw new Error(signature + 'arg 3 \'falseText\' must be a string');
    } else if (typeof trueText !== 'string') {
      throw new Error(signature + 'arg 4 \'trueText\' must be a string');
    }

    super(key, defaultValue);
    this._value._false = falseText;
    this._value._true = trueText;
    this._value._prompt = prompt;
  }

  defaultDisplayString() {
    return this.displayString(this.defaultValue());
  }

  defaultDisplayValue() {
    return this.displayValue(this.defaultValue());
  }

  displayString(bool) {
    return this.displayValue(bool);
  }

  displayValue(bool) {
    return bool ? this._value._true : this._value._false;
  }

  hasOption(inputText) {
    return inputText === this._value._false || inputText === this._value._true;
  }

  inputHint() {
    return `'${this._value._false}' or '${this._value._true}'`;
  }

  isValidDisplayValue(inputText) {
    return this.validateDisplayValue(inputText).valid;
  }

  isValidNativeValue(value) {
    // For now, allow truthy and falsey
    // if (typeof value !== 'boolean') return false
    return this.validateNativeValue(value).valid;
  }

  maximumValue() {
    return true;
  }

  maximumDisplayValue() {
    return this._value._true;
  }

  minimumValue() {
    return false;
  }

  minimumDisplayValue() {
    return this._value._false;
  }

  stepValue() {
    return 1;
  }

  stepDisplayValue() {
    return '';
  }

  options() {
    return [false, true];
  }

  optionText(bool) {
    return bool ? this._value._true : this._value._false;
  }

  optionTexts() {
    return [this._value._false, this._value._true];
  }

  prompt() {
    return this._value._prompt;
  }

  validateDisplayValue(inputText) {
    if (!this.hasOption(inputText)) {
      return new ValidationResult(false, inputText, 'Invalid option');
    }

    const bool = inputText === this._value._true;
    return this.validateNativeValue(bool);
  }

  validateNativeValue(bool) {
    const b = !!bool;
    return new ValidationResult(true, b);
  }

}

/**
 * @file Option Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Option is a Variant whose value is a Javascript string primitive
 * that is a member of a predefined set of strings.
 */

class Option extends _Variant {
  /**
   * @param {string} prompt Input prompt text
   * @param {array} optionsArray A simple array, or an array of value-display pairs
   * @param {number} defaultOptionIndex Index of the default option (0 if omitted)
   */
  constructor(key, prompt, optionsArray, defaultOptionIndex = 0) {
    const signature = `new Option(${key}, ${prompt}, ${optionsArray}, ${defaultOptionIndex}) `;

    if (typeof prompt !== 'string') {
      throw new Error(signature + 'arg 2 \'prompt\' must be a string');
    } else if (!(optionsArray instanceof Array)) {
      throw new Error(signature + 'arg 2 \'optionasArray\' must be an Array');
    } else if (defaultOptionIndex < 0 || defaultOptionIndex >= optionsArray.length) {
      throw new Error(signature + `arg 3 defaultOptionIndex must be 0 - ${optionsArray.length}`);
    }

    const dflt = optionsArray[defaultOptionIndex];
    super(key, Array.isArray(dflt) ? dflt[0] : dflt);
    const map = new Map();
    optionsArray.forEach(opt => {
      if (Array.isArray(opt)) {
        map.set(opt[0], opt[1]);
      } else {
        map.set(opt, opt);
      }
    });
    this._value._options = map;
    this._value._prompt = prompt;
  }

  _ensureOption(optionKey) {
    if (!this.hasOption(optionKey)) {
      throw new Error(`Option '${this.key()}' has no option '${optionKey}'`);
    }

    return this;
  }

  defaultDisplayString() {
    return this.displayString(this.defaultValue());
  }

  defaultDisplayValue() {
    return this.displayValue(this.defaultValue());
  }

  displayString(optionKey) {
    return this.displayValue(optionKey);
  }

  displayValue(optionKey) {
    this._ensureOption(optionKey);

    return this.optionText(optionKey);
  }

  hasOption(optionKey) {
    return this._value._options.has(optionKey);
  }

  inputHint() {
    return this._value._prompt;
  }

  isValidDisplayValue(inputText) {
    return this.validateDisplayValue(inputText).valid;
  }

  isValidNativeValue(value) {
    return this.validateNativeValue(value).valid;
  }

  maximumValue() {
    return 0;
  }

  maximumDisplayValue() {
    return '';
  }

  minimumValue() {
    return 0;
  }

  minimumDisplayValue() {
    return '';
  }

  stepValue() {
    return 1;
  }

  stepDisplayValue() {
    return '';
  }

  options() {
    return Array.from(this._value._options.keys());
  }

  optionText(optionKey) {
    return this._value._options.get(optionKey);
  }

  optionTexts() {
    return Array.from(this._value._options.values());
  }

  prompt() {
    return this._value._prompt;
  }

  validateDisplayValue(optionKey) {
    return this.validateNativeValue(optionKey);
  }

  validateNativeValue(optionKey) {
    if (!this.hasOption(optionKey)) {
      return new ValidationResult(false, optionKey, 'Invalid option');
    }

    return new ValidationResult(true, optionKey);
  }

}

/**
 * @file Config Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Config is a Option used for DAG configuration.
 * Its sole purpose is to check if a DAG Node is a Config via (someObject instanceof Config) === true
 */

class Config extends Option {
  constructor(key, prompt, optionsArray, defaultOptionIndex = 0) {
    super(key, prompt, optionsArray, defaultOptionIndex);
  }

}

/**
 * @file Float Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Float adds the notion of a 'displayValue' to floating point numbers, including
 * - display mode; 'toFixed(), toExponential(), or toPrecision()
 * - display decimal places
 *
 * New Methods:
 * - _setDisplayMode(mode, decimals) {
 * - _formatValue(value)
 * - displayString(nativeValue)
 * - displayValue(nativeValue)
 * - setDisplayDecimals(decimals)
 * - setDisplayToExponential(decimals=null)
 * - setDisplayToFixed(decimals=null)
 * - setDisplayToPrecision(decimals=null)
 * - maximumDisplayValue()
 * - minimumDisplayValue()
 * - stepDisplayValue()
 *
 * Overrides methods:
 * - inputHint()
 */

class Float extends _Numeric {
  constructor(key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1) {
    super(key, defaultValue, minValue, maxValue, stepValue);
    this._display = {
      _mode: 'fixed',
      _decimals: 2
    };
  }

  _formatValue(value) {
    let str;

    if (this._display._mode === 'precision') {
      str = value.toPrecision(Math.max(1, this._display._decimals));
    } else if (this._display._mode === 'exponential') {
      str = value.toExponential(this._display._decimals);
    } else {
      str = value.toFixed(this._display._decimals);
    } // Decorate with commas, prefix, suffix...


    return str;
  }

  _setDisplayMode(mode, decimals) {
    this._display._mode = mode;

    if (typeof decimals === 'number') {
      this._display._decimals = Math.max(Math.min(decimals, 16), 0);
    }

    return this;
  }

  defaultDisplayValue() {
    return this._formatValue(this._value._default);
  }

  displayString(nativeValue) {
    return this.displayValue(nativeValue);
  }

  displayValue(nativeValue) {
    return this._formatValue(nativeValue);
  }

  displayValueToNativeValue(displayValue) {
    return parseFloat(displayValue);
  }

  nativeValueToDisplayValue(nativeValue) {
    return this.displayValue(nativeValue);
  } // Overrides Numeric.inputHint() to perform floating point formatting


  inputHint() {
    return `${this.minimumDisplayValue()} - ${this.maximumDisplayValue()}`;
  }

  maximumDisplayValue() {
    return this._formatValue(this._value._maximum);
  }

  minimumDisplayValue() {
    return this._formatValue(this._value._minimum);
  }

  stepDisplayValue() {
    return this._formatValue(this._value._step);
  }

  setDisplayDecimals(decimals) {
    return this._setDisplayMode(this._display._mode, decimals);
  }

  setDisplayToExponential(decimals = null) {
    return this._setDisplayMode('exponential', decimals);
  }

  setDisplayToFixed(decimals = null) {
    return this._setDisplayMode('fixed', decimals);
  }

  setDisplayToPrecision(decimals = null) {
    return this._setDisplayMode('precision', decimals);
  }

}

/**
 * @file Converter units-of-measure definitions
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
// Defines the set of units signature fields
const baseSet = new Set(['_d', // distance, length (m)
'_m', // mass (kg)
'_t', // time (s)
'_T', // thermodynamic temperature (oK)
'_r', // ratio, dimensionless
'_e', // electric current (A)
'_i', // luminous intensity (cd)
'_s' // amount of substance (mole)
]); // Prototype units signature

const protoSignature = {
  coeff: 1,
  _d: 0,
  _m: 0,
  _t: 0,
  _T: 0,
  _r: 0,
  _e: 0,
  _i: 0,
  _s: 0
}; // Array of [string:unitsKey, array:triplet, array:aliases] elements,
// where triplet is [number:coeff, string|array:base, number:power]

const unitDefs = [// base units (IMPORTANT: power MUST BE 0 for base units!!)
['dl', [1, '_r', 0], ['ratio', '']], ['m', [1, '_d', 0], ['meter', 'metre', 'meters', 'metres']], ['kg', [1, '_m', 0], ['kilogram', 'kilograms', 'kgs']], ['s', [1, '_t', 0], ['sec', 'secs', 'second', 'seconds']], ['oC', [1, '_T', 0], ['Celsius', 'celsius', 'centigrade', '\u2103']], ['A', [1, '_e', 0], ['ampere', 'amp', 'amperes', 'amps']], ['cd', [1, '_i', 0], ['candela', 'candelas']], ['mol', [1, '_s', 0], ['mole', 'moles', 'mols']], // SI derived units with special names and symbols
['rad', [1, [[1, 'm', 1], [1, 'm', -1]], 1], ['radian', 'radians', 'rads']], ['sr', [1, [[1, 'm', 2], [1, 'm', -2]], 1], ['steridian', 'steridians', 'srs']], ['Hz', [1, 's', -1], ['Hertz', 'hertz', 'hz']], ['N', [1, [[1, 'kg', 1], [1, 'm', 1], [1, 's', -2]], 1], ['Newton', 'Newtons', 'newton', 'newtons']], ['Pa', [1, [[1, 'kg', 1], [1, 'm', -1], [1, 's', -2]], 1], ['Pascal', 'Pascals', 'Pas', 'pascal', 'pascals']], ['J', [1, [[1, 'kg', 1], [1, 'm', 2], [1, 's', -2]], 1], ['Joule', 'Joules', 'Js', 'joule', 'joules', 'j']], ['W', [1, [[1, 'J', 1], [1, 's', -1]], 1], ['Watt', 'Watts', 'Ws', 'watt', 'watts', 'w']], ['C', [1, [[1, 's', 1], [1, 'A', 1]], 1], ['coulomb', 'coulombs', 'Coulomb', 'Coulombs']], ['V', [1, [[1, 'kg', 1], [1, 'm', 2], [1, 's', -3], [1, 'A', -1]], 1], ['volt', 'volts', 'v', 'Volt', 'Volts']], ['F', [1, [[1, 'kg', -1], [1, 'm', -2], [1, 's', 4], [1, 'A', 2]], 1], ['farad', 'farads', 'Farad', 'Farads']], ['Ohm', [1, [[1, 'kg', 1], [1, 'm', 2], [1, 's', -3], [1, 'A', -2]], 1], ['ohm', 'ohms', 'Ohms', '\u2126']], ['S', [1, [[1, 'kg', -1], [1, 'm', -2], [1, 's', 3], [1, 'A', 2]], 1], ['siemens', 'Siemens']], ['Wb', [1, [[1, 'kg', 1], [1, 'm', 2], [1, 's', -2], [1, 'A', -1]], 1], ['weber', 'webers', 'Weber', 'Webers']], ['T', [1, [[1, 'kg', 1], [1, 's', -2], [1, 'A', -1]], 1], ['tesla', 'teslas', 'Tesla', 'Teslas']], ['H', [1, [[1, 'kg', 1], [1, 'm', 2], [1, 's', -2], [1, 'A', -2]], 1], ['henry', 'henrys', 'Henry', 'Henrys']], ['lm', [1, [[1, 'cd', 1], [1, 'sr', 2]], 1], ['lumen', 'lumens']], ['lx', [1, [[1, 'cd', 1], [1, 'sr', 2], [1, 'm', -2]], 1], ['lux']], ['Bq', [1, [[1, 's', -1]], 1], ['becquerel', 'Becquerel', 'becquerels', 'Becquerels']], ['Gy', [1, [[1, 'm', 2], [1, 's', -2]], 1], ['gray', 'grays', 'Gray', 'Grays']], ['Sv', [1, [[1, 'm', 2], [1, 's', -2]], 1], ['sievert', 'sieverts', 'Sievert', 'Sieverts']], ['kat', [1, [[1, 'mol', 1], [1, 's', -1]], 1], ['katal', 'katals']], // Non-SI units accepted for use with SI units
// length
['mm', [0.001, 'm', 1], ['millimeter', 'millimeters', 'millimetre', 'millimetres']], ['cm', [0.01, 'm', 1], ['centimeter', 'centimeters', 'centimetre', 'centrimetres']], ['dm', [0.1, 'm', 1], ['decimeter', 'decimeters', 'decimetre', 'decimetres']], ['km', [1000, 'm', 1], ['kms', 'kilometer', 'kilometre', 'kilometers', 'kilometres']], ['au', [149597870700, 'm', 1], ['astronomical unit']], // time
['ms', [0.001, 's', 1], ['millisec', 'millisecs', 'millisecond', 'milliseconds']], ['min', [60, 's', 1], ['minute', 'minutes']], ['h', [60 * 60, 's', 1], ['hour', 'hours', 'hr', 'hrs']], ['day', [24 * 60 * 60, 's', 1], ['d', 'days']], ['y', [365 * 24 * 60 * 60, 's', 1], ['year', 'years', 'yr']], // temperature
['oK', [1, 'oC', 1], ['K', '\u212a']], // plane and phase angle
['degree', [Math.PI / 180, 'rad', 1], ['degrees', 'deg', 'degs', 'o', '\u00b0']], ["'", [Math.PI / 10800, 'rad', 1], []], ['"', [Math.PI / 648000, 'rad', 1], []], // area
['ha', [10000, 'm', 2], ['hectare', 'hectares']], // volume
['l', [1000, 'cm', 3], ['litre', 'liter', 'litres', 'liters', 'L']], // mass
['gm', [0.001, 'kg', 1], ['gram', 'grams', 'ms', 'g']], ['tonne', [1000, 'kg', 1], ['t', 'tonnes']], // energy
['eV', [1.602176634e-19, 'J', 1], ['electronvolt', 'eVs']], ['MJ', [1000000, 'J', 1], ['megaJ', 'mJ', 'mj', 'megaJoules']], // dimensionless
['percent', [0.01, 'dl', 1], ['%', 'pct', 'pph']], ['ppt', [0.001, 'dl', 1], ['partsPerThousand']], ['ppm', [0.000001, 'dl', 1], ['partsPerMillion']], // US Customary units
// length  // derived distance units
['ft', [0.3048, 'm', 1], ['foot', 'feet']], ['in', [1 / 12, 'ft', 1], ['inch', 'inches']], ['yd', [3, 'ft', 1], ['yard', 'yards']], ['rd', [16.5, 'ft', 1], ['rod', 'rods']], ['ch', [66, 'ft', 1], ['chain', 'chains']], ['mi', [5280, 'ft', 1], ['mile', 'miles']], // mass
['lb', [1 / 2.20462262184878, 'kg', 1], ['pound', 'pounds', 'lbs']], ['oz', [1 / 16, 'lb', 1], ['ounce', 'ounces', 'ozs']], ['ton', [2000, 'lb', 1], ['tons', 'shortton', 'shorttons']], // temperature
['oF', [5 / 9, 'oC', 1], ['\u2109', 'Fahrenheit', 'fahrenheit']], // area
['ac', [10, 'ch', 2], ['acre', 'acres']], // energy
['Btu', [1.055870000000e+03, 'J', 1], ['Btus', 'btu', 'btus']], ['Btu_x', [1.055870000000e+03, 'J', 1], ['btu_x']], // mean BTU
['Btu_i', [1.055056000000e+03, 'J', 1], ['btu_i']], // international table BTU (after 1956)
['Btu_39', [1.059670000000e+03, 'J', 1], ['btu_39']], // BTU at 39 oF
['Btu_59', [1.054800000000e+03, 'J', 1], ['btu_59']], // BTU at 59 oF
['Btu_60', [1.054680000000e+03, 'J', 1], ['btu_60']], // BTU at 60 oF
['Btu_tc', [1.054350000000e+03, 'J', 1], ['btu_tc']] // thermochemical BTU
]; // From https://en.wikipedia.org/wiki/International_System_of_Units

const quantity = [// SI base units
['dimensionless', ['']], ['distance', ['m']], ['length', ['m']], ['mass', ['kg']], ['time', ['s']], ['thermodynamic temperature', ['oC']], ['electric current', ['A']], ['luminous intensity', ['cd']], ['amount of substance', ['mol']], // Fire behavior
['fireline intensity', ['m kg s-3', 'W/m']], ['fire heat per unit area', ['kg s-2', 'N/m']], ['fire reaction intensity', ['kg s-3', 'W/m2']], ['surface area-to-volume ratio', ['m-1']], // SI derived units woth special names and symbols
['plane angle', ['m m-1', 'rad']], ['solid angle', ['m2 m-2', 'sr']], ['frequency', ['s-1', 'Hz']], ['force', ['kg m s-2', 'N']], ['weight', ['kg m s-2', 'N']], ['pressure', ['kg m-1 s-2', 'Pa', 'N/m2']], ['stress', ['kg m-1 s-2', 'Pa', 'N/m2']], ['energy', ['kg m2 s-2', 'J', 'N m', 'Pa m3']], ['work', ['kg m2 s-2', 'J', 'N m', 'Pa m3']], ['heat', ['kg m2 s-2', 'J', 'N m', 'Pa m3']], ['power', ['kg m2 s-3', 'W', 'J/s']], ['radiant flux', ['kg m2 s-3', 'W', 'J/s']], ['electric charge', ['s A', 'C']], ['electric potential difference (voltage)', ['kg m2 s-3 A-1', 'V', 'W/A', 'J/C']], ['voltage', ['kg m2 s-3 A-1', 'V', 'W/A', 'J/C']], ['emf', ['kg m2 s-3 A-1', 'V', 'W/A', 'J/C']], ['capacitance', ['kg-1 m-2 s4 A2', 'F', 'C/V']], ['resistance', ['kg m2 s-3 A-2', 'ohm', 'V/A']], ['impedance', ['kg m2 s-3 A-2', 'ohm', 'V/A']], ['reactance', ['kg m2 s-3 A-2', 'ohm', 'V/A']], ['electrical conductance', ['kg-1 m-2 s3 A2', 'S', 'ohm-1']], ['magnetic flux', ['kg m2 s-2 A-1', 'Wb', 'V s']], ['magnetic flux density', ['kg s-2 A-1', 'T', 'Wb/m2']], ['inductance', ['kg m2 s-2 A-2', 'H', 'Wb/A']], ['luminous flux', ['cd sr', 'lm']], ['illuminance', ['cd sr m-2', 'lx', 'lm/m2']], ['radioactivity (decays per unit time)', ['s-1', 'Bq']], ['absorbed dose (of ionising radiation)', ['m2 s-2', 'Gy', 'J/kg']], ['equivalent dose (of ionising radiation)', ['m2 s-2', 'Sv', 'J/kg']], ['catalytic activity', ['mol s-1', 'kat']], // examples of coherent derived units
['area', ['m2']], ['volume', ['m3']], ['speed', ['m s-1']], ['velocity', ['m s-1']], ['acceleration', ['m s-2']], ['wavenumber', ['m-1']], ['vergence (optics)', ['m-1']], ['density', ['kg m-3']], ['load', ['kg m-2']], ['surface density', ['kg m-2']], ['specific volume', ['m3 kg-1']], ['current density', ['A m-2']], ['magnetic field strength', ['A m-1']], ['concentration', ['mol m-3']], ['mass concentration', ['kg m-3']], ['luminance', ['cd m-2']], // Examples of derived units that include units with special name
['dynamic viscosity', ['m-1 kg s-1', 'Pa s']], ['moment of force', ['m2 kg s-2', 'N m']], ['surface tension', ['kg s-2', 'N/m']], ['angular velocity', ['s-1', 'rad/s']], ['angular frequency', ['s-1', 'rad/s']], ['angular acceleration', ['s-2', 'rad/s2']], ['heat flux density', ['kg s-3', 'W/m2']], ['irradiance', ['kg s-3', 'W/m2']], ['entropy', ['m2 kg s-2 oC-1', 'J/oC']], ['heat capacity', ['m2 kg s-2 oC-1', 'J/oC']], ['specific heat capacity', ['m2 s-2 oC-1', 'J/kg oC']], ['specific entropy', ['m2 s-2 oC-1', 'J/kg oC']], ['specific energy', ['m2 s-2', 'J/kg']], ['thermal conductivity', ['m kg s-3 oC-1', 'W/m oC']], ['energy density', ['m-1 kg s-2', 'J/m3']], ['electric field strength', ['m kg s-3 A-1', 'V/m']], ['electric charge density', ['m-3 s A', 'C/m3']], ['surface charge density', ['m-2 s A', 'C/m2']], ['electric flux density', ['m-2 s A', 'C/m2']], ['electric displacement', ['m-2 s A', 'C/m2']], ['permittivity', ['m-3 kg-1 s4 A2', 'F/m']], ['molar energy', ['m2 kg s-2 mol-1', 'J/mol']], ['molar entropy', ['m2 kg s-2 oC-1 mol-1', 'J/mol oC']], ['molar heat capacity', ['m2 kg s-2 oC-1 mol-1', 'J/mol oC']], ['exposure (x- and y-rays)', ['kg-1 s A', 'C/kg']], ['absorbed dose rate', ['m2 s-3', 'Gy/s']], ['radiant intensity', ['m2 kg s-3', 'W/sr']], ['radiance', ['kg s-3', 'W/m2 sr']], ['catalytic activity concentration', ['m-2 s-1 mol', 'kat/m3']]];
/**
 * Btu definitions
    - International Table British thermal unit (after 1956)
        1.055056000000e+03,
    - thermochemical British thermal unit
        1.054350000000e+03,
    - mean British thermal unit [Btu]
        1.055870000000e+03,
    - British thermal unit (39 F)
        1.059670000000e+03,
    - British thermal unit (59 F)
        1.054800000000e+03,
    - British thermal unit (60 F)
        1.054680000000e+03,
 */

/**
 * @file Units-of-measure compiler
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
class Compiler {
  /**
   * @param {array} unitDefs The units definitions array
   */
  constructor(unitDefs) {
    this._unitMap = this._createUnitsMap(unitDefs);
  }

  _createUnitsMap(unitDefs) {
    const map = new Map();
    unitDefs.forEach(([key, uom]) => {
      map.set(key, uom);
    });
    return map;
  }
  /**
   * Compiles a previously parsed and de-aliased units-of-measure triplet into a units Signature.
   *
   * @param {array} triplet [numberf:coeff, string|array:uom, integer:power]
   * @return {object} The units' signature for the triplet
  */


  compile(triplet) {
    let sig = { ...protoSignature
    };
    const [coeff, uom, power] = triplet;

    if (Array.isArray(uom)) {
      // then this is a compound unit-of-measure (such as W = J/s)
      uom.forEach((uomTriplet, idx) => {
        const [,, p] = uomTriplet;
        const sig2 = this.compile(uomTriplet);
        baseSet.forEach(base => {
          sig[base] += sig2[base];
        });
        sig.coeff *= p > 0 ? sig2.coeff : 1 / sig2.coeff;
      });
      sig.coeff *= coeff;
    } else if (baseSet.has(uom)) {
      // then this is a Base unit
      sig[uom] = sig[uom] + 1;
    } else if (this._unitMap.has(uom)) {
      // then this is a derived unit
      // continue recursing until we reach a base
      sig = this.compile(this._unitMap.get(uom));

      if (power !== 1) {
        baseSet.forEach(base => {
          if (sig[base]) sig[base] *= power;
        });
        sig.coeff = sig.coeff ** Math.abs(power);
      }

      sig.coeff = sig.coeff * coeff;
    } else {
      // else this is an unknown uom
      throw new Error(`Unknown unit-of-measure '${uom}'`);
    }

    return sig;
  }

}

/**
 * @file Units-of-measure parser
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
// The parser recognizes these characters as letters (part of a word)
const letters = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '_', '%', '\u2126', // ohm
'\u2109', // oF
'\u2103', // oC
'\u212a', // oK
'\u00B0' // o
]);
class Parser {
  constructor(unitDefs) {
    this._aliasMap = this._createAliasMap(unitDefs);

    this._init();
  }

  _createAliasMap(unitDefs) {
    const map = new Map();
    unitDefs.forEach(def => {
      const [key,, aliases] = def;
      map.set(key, key);
      aliases.forEach(alias => {
        map.set(alias, key);
      });
    });
    return map;
  }

  _init() {
    this._term = '';
    this._tokens = [];
    this._inWord = false;
    this._inNumber = false;
    this._inNumerator = true;
    this._lastToken = '';
    this._token = '';
  }

  _isDigit(c) {
    return c >= '0' && c <= '9' || c === '-' || c === '+';
  }

  _isLetter(c) {
    return letters.has(c);
  }

  _isSlash(c) {
    return c === '/';
  }

  _ensurePower() {
    if (this._lastToken === 'word') {
      const n = this._inNumerator ? 1 : -1;

      this._tokens.push(n);

      this._lastToken = 'number';
    }
  }

  _pushNumber() {
    if (this._lastToken === 'number') {
      throw new Error('Units-of-measure expression has back-to-back powers');
    }

    this._tokens.push(parseInt(this._token) * (this._inNumerator ? 1 : -1));

    this._lastToken = 'number';
    this._inNumber = false;
  }

  _pushWord() {
    const word = this._aliasMap.get(this._token);

    if (word === undefined) {
      throw new Error(`Units-of-measure expression '${this._term}' has unknown term '${this._token}'`);
    }

    this._tokens.push(word);

    this._lastToken = 'word';
    this._inWord = false;
  }
  /**
    * Parses a units-of-measure expression into an array of [coeff, term, power] triplets.
    * @param {string} str The units-of-measure string
    * @returns {array} Array of [number:coeff, string:term, integer:power] triplets
    */


  parse(str) {
    this._init();

    this._term = str;

    if (str === '') {
      return [[1, 'dl', 1]];
    }

    for (let idx = 0; idx < str.length; idx += 1) {
      const c = str[idx];

      if (this._isLetter(c)) {
        if (this._inNumber) {
          this._pushNumber();

          this._token = c;
        } else if (this._inWord) {
          this._token += c;
        } else {
          // not in word or in number
          this._ensurePower();

          this._token = c;
        }

        this._inWord = true;
      } else if (this._isDigit(c)) {
        if (this._inWord) {
          this._ensurePower();

          this._pushWord();

          this._token = c;
        } else if (this._inNumber) {
          this._token += c;
        } else {
          // not in word or in number
          this._token = c;
        }

        this._inNumber = true;
      } else if (this._isSlash(c)) {
        if (this._inWord) {
          this._pushWord();

          this._ensurePower();
        } else if (this._inNumber) {
          this._pushNumber();
        } else {
          // not in word or in number
          this._ensurePower();
        }

        this._inNumber = false;
        this._inWord = false;
        this._inNumerator = false;
        this._lastToken = '';
        this._token = '';
      } else {
        // is white space
        if (this._inNumber) {
          this._pushNumber();
        } else if (this._inWord) {
          this._ensurePower();

          this._pushWord();
        }

        this._inNumber = false;
        this._inWord = false;
        this._token = '';
      }
    } // End of string


    if (this._inNumber) {
      this._pushNumber();
    } else if (this._inWord) {
      this._pushWord();

      this._ensurePower();
    } else {
      this._ensurePower();
    }

    const pairs = [];

    for (let idx = 0; idx < this._tokens.length; idx += 2) {
      pairs.push([1, this._tokens[idx], this._tokens[idx + 1]]);
    }

    return pairs;
  }

}

/**
 * @file Units-of-measure converter
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
class Converter {
  constructor() {
    this._n = 0;
    this._parser = new Parser(unitDefs);
    this._compiler = new Compiler(unitDefs);
    this._signatures = new Map(); // Do this AFTER signatures map is created on previous line

    this._quantities = this._createQuantityMap(quantity);
    this._temp = this._createTemperatureMap(unitDefs);
  }

  _createQuantityMap(quantity) {
    const map = new Map();
    quantity.forEach(q => {
      const [text, terms] = q;
      const sig = this.getSignature(terms[0]);

      const sigKey = this._sigKey(sig);

      if (!map.has(sigKey)) {
        map.set(sigKey, [text]);
      } else {
        map.get(sigKey).push(text);
      }
    });
    return map;
  }

  _createTemperatureMap(unitDefs) {
    const map = new Map();
    unitDefs.forEach(unitDef => {
      const [uom,, aliases] = unitDef;

      if (uom === 'oF' || uom === 'oC' || uom === 'oK') {
        map.set(uom, uom);
        aliases.forEach(alias => {
          map.set(alias, uom);
        });
      }
    });
    return map;
  } // Temperature scale conversion


  _c2f(c) {
    return c * 9 / 5 + 32;
  }

  _c2k(c) {
    return c + 273.15;
  }

  _f2c(f) {
    return (f - 32) * 5 / 9;
  }

  _f2k(f) {
    return this._c2k(this._f2c(f));
  }

  _k2c(k) {
    return k - 273.15;
  }

  _k2f(k) {
    return this._c2f(this._k2c(k));
  } // Returns a signature key like 'd-2m1' used as Map keys


  _sigKey(sig) {
    let key = '';
    baseSet.forEach(base => {
      key += base[1] + sig[base];
    });
    return key;
  }

  _convertTemperatureScale(amount, fromT, intoT) {
    const t1 = this._temp.get(fromT);

    const t2 = this._temp.get(intoT);

    if (t1 === t2) return amount;

    if (t1 === 'oC') {
      return t2 === 'oK' ? this._c2k(amount) : this._c2f(amount);
    } else if (t1 === 'oK') {
      return t2 === 'oC' ? this._k2c(amount) : this._k2f(amount);
    }

    return t2 === 'oC' ? this._f2c(amount) : this._f2k(amount);
  }

  convert(amount, fromUom, intoUom) {
    this._n++;

    if (this._temp.has(fromUom) || this._temp.has(intoUom)) {
      return this._convertTemperatureScale(amount, fromUom, intoUom);
    }

    return amount * this.factorFromInto(fromUom, intoUom);
  }

  convertible(uom1, uom2) {
    const sig1 = this.getSignature(uom1);
    const sig2 = this.getSignature(uom2);
    let ok = true;
    baseSet.forEach(basePower => {
      if (sig1[basePower] !== sig2[basePower]) ok = false;
    });
    return ok;
  }

  factorToBase(uom) {
    const sig = this.getSignature(uom);
    return sig.coeff;
  }

  factorFromInto(fromUom, intoUom) {
    const sig1 = this.getSignature(fromUom);
    const sig2 = this.getSignature(intoUom);
    return sig1.coeff / sig2.coeff;
  }

  hasSignature(key) {
    return this._signatures.has(key);
  }

  quantity(key) {
    const sig = this.getSignature(key);

    const sigKey = this._sigKey(sig);

    const labels = this._quantities.get(sigKey);

    return labels === undefined ? 'unknown' : labels.join(', ');
  }

  getSignature(key) {
    if (!this._signatures.has(key)) {
      const tripletsArray = this._parser.parse(key);

      const signature = this._compiler.compile([1, tripletsArray, 1]);

      this._signatures.set(key, signature);
    }

    return this._signatures.get(key);
  }

}

/**
 * @file Units-of-measure singleton
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */

const Uom = new Converter();

/**
 * @file Quantity Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
  */
/**
 * Quantity class extends Float by adding units-of-measure to the native value, including
 * - conversion of input/display text/values to native units-of-measure
 * - conversion of native value to display units-of-measure
 *
 * New Methods:
 * - _ensureValidUnits(units)
 * - displayValueToNativeValue(displayValue)
 * - nativeValueToDisplayValue(nativeValue)
 * - nativeUnits()
 * - setDisplayUnits(units)
 * - unitsOptions()

 *
 Overridden Methods:
 * - displayString(nativeValue)
 * - displayUnits()
 * - displayValue()
 * - inputHint()
 * - maximumDisplayValue()
 * - minimumDisplayValue()
 * - validateDisplayValue(inputText)
 * - validateNativeValue(displayValue, nativeValue)
 */

class Quantity extends Float {
  /**
   * @param {string} key Unique key for this Variant (i.e., 'FireLineIntensity' or 'WindSpeed')
   * @param {string[]} unitsOptions Array of allowed units-of-measure (i.e., ['lb/ft2', 't/ac', 'kg/m2', 'T/ha'] )
   * @param {number} maxValue Maximum allowed *client/user/display input* value
   * @param {number} defaultValue  If omitted, set to 0
   * @param {number} minValue Minimum allowed *client/user/display input* value
   * @param {number} stepValue Step value for input sliders
   */
  constructor(key, unitsOptions, maxValue, defaultValue = 0, minValue = 0, stepValue = 1) {
    super(key, defaultValue, minValue, maxValue, stepValue);

    if (!(unitsOptions instanceof Array)) {
      throw new Error(`Quantity() arg 2 expects an array, but got '${typeof unitsOptions}'`);
    } // Throw an Error if units-of-measure terms are not valid or compatible


    unitsOptions.forEach(uom => {
      Uom.convert(1, uom, uom);

      if (!Uom.convertible(unitsOptions[0], uom)) {
        throw new Error(`Quantity '${this._key}' units '${uom}' is not convertible to ${unitsOptions[0]}`);
      }
    });
    this._units = {
      _display: unitsOptions[0],
      _native: unitsOptions[0],
      _options: unitsOptions
    };
  }

  _ensureValidUnits(units) {
    if (!this._units._options.includes(units)) {
      throw new Error(`Quantity '${this._key}' has no units of '${units}'`);
    }

    return units;
  }

  defaultDisplayString() {
    return this.displayString(this.defaultValue());
  }

  defaultDisplayValue() {
    return this.displayValue(this.defaultValue());
  } // Overrides Numeric.displayValue() to perform conversions to display units


  displayString(nativeValue) {
    return `${this.displayValue(nativeValue)} ${this.displayUnits()}`;
  }

  displayUnits() {
    return this._units._display;
  } // Overrides Float.displayValue() to perform conversion to display units


  displayValue(nativeValue) {
    return this._formatValue(this.nativeValueToDisplayValue(nativeValue));
  }

  displayValueToNativeValue(displayValue) {
    return Uom.convert(displayValue, this._units._display, this._units._native);
  } // Overrides Float.inputHint() to perform conversion to display units and add display uom


  inputHint() {
    return `${this.minimumDisplayValue()} - ${this.maximumDisplayValue()} ${this._units._display}`;
  }

  isValidDisplayValue(inputText) {
    return this.validateDisplayValue(inputText).valid;
  }

  isValidNativeValue(value) {
    if (typeof value !== 'number') return false;
    return this.validateNativeValue(value).valid;
  } // Overrides Numeric version to perform conversion to display units-of-measure


  maximumDisplayValue() {
    return this._formatValue(Uom.convert(this._value._maximum, this._units._native, this._units._display));
  }

  maximumDisplayString() {
    return `${this.maximumDisplayValue()} ${this._units._display}`;
  } // Overrides Numeric version to perform conversion to display units-of-measure


  minimumDisplayValue() {
    return this._formatValue(Uom.convert(this._value._minimum, this._units._native, this._units._display));
  }

  minimumDisplayString() {
    return `${this.minimumDisplayValue()} ${this._units._display}`;
  }

  nativeUnits() {
    return this._units._native;
  }

  nativeValueToDisplayValue(nativeValue) {
    return Uom.convert(nativeValue, this._units._native, this._units._display);
  }

  setDisplayUnits(units) {
    this._units._display = this._ensureValidUnits(units);
    return this;
  } // Overrides Numeric version to perform conversion to display units-of-measure


  stepDisplayValue() {
    return this._formatValue(Uom.convert(this._value._step, this._units._native, this._units._display));
  }

  stepDisplayString() {
    return `${this.stepDisplayValue()} ${this._units._display}`;
  }

  unitsOptions() {
    return this._units._options;
  } // Overrides Float.validateDisplayValue() to apply filterNonNegativeNumeric()
  // AND convert from display (input) units to native units before validating


  validateDisplayValue(inputText) {
    const text = inputText.toString(); // filter invalid characters from input text

    const filtered = filterNonNegativeNumeric(text); // cast from text to number, boolean, object, or some other string

    const displayValue = parseFloat(filtered);

    if (isNaN(displayValue)) {
      return new ValidationResult(false, filtered, 'Not a valid number string');
    } // convert quantity from display to native units


    const nativeValue = this.displayValueToNativeValue(displayValue); // validate native value

    if (nativeValue < this._value._minimum) {
      return new ValidationResult(false, displayValue, `Less than minimum value of ${this.minimumDisplayString()} ` + `(${this._formatValue(this._value._minimum)} ${this.nativeUnits()})`);
    } else if (nativeValue > this._value._maximum) {
      return new ValidationResult(false, displayValue, `Greater than maximum value of ${this.maximumDisplayString()} ` + `(${this._formatValue(this._value._maximum)} ${this.nativeUnits()})`);
    }

    return new ValidationResult(true, nativeValue);
  }

  validateNativeValue(nativeValue) {
    if (typeof nativeValue === 'undefined') {
      throw new Error('Quantity.validateNativeValue() requires native value arg');
    } else if (nativeValue < this._value._minimum) {
      return new ValidationResult(false, this.displayValue(nativeValue), `Less than minimum value of ${this.minimumDisplayString()} ` + `(${this._formatValue(this._value._minimum)} ${this.nativeUnits()})`);
    } else if (nativeValue > this._value._maximum) {
      return new ValidationResult(false, this.displayValue(nativeValue), `Greater than maximum value of ${this.maximumDisplayString()} ` + `(${this._formatValue(this._value._maximum)} ${this.nativeUnits()})`);
    }

    return new ValidationResult(true, nativeValue);
  }

}

/**
 * @file Ratio Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
  */
/**
 * Ratio is a Quantity Variant for rational numbers that can be expressed
 * in units-of-measure 'ratio' or '%'
 */

class Ratio extends Quantity {
  /**
   * @param {string} key Unique key for this Variant (i.e., 'FireLineIntensity' or 'WindSpeed')
   * @param {number} maxValue Maximum allowed *client/user/display input* value
   * @param {number} defaultValue  If omitted, set to 0
   * @param {number} minValue Minimum allowed *client/user/display input* value
   * @param {number} stepValue Step value for input sliders
   */
  constructor(key, maxValue, defaultValue = 0, minValue = 0, stepValue = 1) {
    const unitsOptions = ['ratio', '%'];
    super(key, unitsOptions, maxValue, defaultValue, minValue, stepValue);
  }

}

/**
 * @file Fraction Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
  */
/**
 * Fraction is a Ratio constrained to the range [0..1]
 */

class Fraction extends Ratio {
  /**
   * @param {string} key Unique key for this Variant (i.e., 'FireLineIntensity' or 'WindSpeed')
   * @param {number} defaultValue  If omitted, set to 0
   * @param {number} stepValue Step value for input sliders
   */
  constructor(key, defaultValue = 0, stepValue = 0.01) {
    super(key, 1, defaultValue, 0, stepValue);
  }

}

/**
 * @file Obj Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Obj is a generic Object that should be subclassed for every instance.
 */

class Obj extends _Variant {
  /**
   * @param {bool} defaultValue
   */
  constructor(key, defaultValue = {}) {
    const signature = `new Obj(${key}, ${defaultValue}) `;

    if (typeof defaultValue !== 'object') {
      throw new Error(signature + 'arg 2 \'defaultValue\' must be an Object');
    }

    super(key, defaultValue);
  }

  defaultDisplayString() {
    return this.displayString(this.defaultValue());
  }

  defaultDisplayValue() {
    return this.displayValue(this.defaultValue());
  }

  displayString(obj) {
    return this.displayValue(obj);
  }

  displayValue(obj) {
    return JSON.stringify(obj);
  }

  inputHint() {
    return '';
  }

  isValidNativeValue(obj) {
    return typeof obj === 'object';
  }

  maximumDisplayValue() {
    return this.defaultDisplayValue();
  }

  minimumDisplayValue() {
    return this.defaultDisplayValue();
  }

  stepValue() {
    return null;
  }

  stepDisplayValue() {
    return '';
  }

}

/**
 * @file Text Variant class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
/**
 * Text is a Variant whose value is a Javascript string primitive.
 */

class Text extends _Variant {
  constructor(key, defaultValue = '', minLength = 0, maxLength = 999999) {
    const signature = `new Text('${key}', '${defaultValue}', ${minLength}, ${maxLength}) `;

    if (typeof defaultValue !== 'string') {
      throw new Error(signature + 'arg 2 \'defaultValue\' must be a \'string\'');
    } else if (typeof minLength !== 'number') {
      throw new Error(signature + `arg 3 'minLength' must be a 'number', but received a ${typeof minLength}`);
    } else if (typeof maxLength !== 'number') {
      throw new Error(signature + `arg 4 'maxLength' must be a 'number', but received a ${typeof maxLength}`);
    } else if (minLength > maxLength) {
      throw new Error(signature + 'arg 3 \'minLength\' exceeds arg 4 \'maxLength\'');
    } else if (defaultValue.length < minLength) {
      throw new Error(signature + 'arg 2 \'defaultValue\' length is less than arg 3 \'minLength\'');
    } else if (defaultValue.length > maxLength) {
      throw new Error(signature + 'arg 2 defaultValue length exceeds arg 4 \'maxLength\'');
    }

    super(key, defaultValue);
    this._value._minimumLength = minLength;
    this._value._maximumLength = maxLength;
  }

  inputHint() {
    return `${this.minimumValue()} - ${this.maximumValue()} chars`;
  }

  isValidDisplayValue(inputText) {
    return this.validateDisplayValue(inputText).valid;
  }

  isValidNativeValue(value) {
    if (typeof value !== 'string') return false;
    return this.validateNativeValue(value).valid;
  }

  maximumValue() {
    return this._value._maximumLength;
  }

  minimumValue() {
    return this._value._minimumLength;
  }

  stepValue() {
    return 1;
  }

  validateDisplayValue(inputText) {
    return this.validateNativeValue(inputText);
  }

  validateNativeValue(text) {
    if (typeof text !== 'string') {
      return new ValidationResult(false, text, 'Must be a string');
    } else if (text.length < this.minimumValue()) {
      return new ValidationResult(false, text, `Must have ${this.minimumValue()} or more chars`);
    } else if (text.length > this.maximumValue()) {
      return new ValidationResult(false, text, `Must have ${this.maximumValue()} or less chars`);
    }

    return new ValidationResult(true, text);
  }

}

/**
 * @file Confgis.js defines the fire simulator Config Variants
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Declares the specialized BehavePlus Config Variants.
 *
 * Note that classes derived from Option() and Config() require an array of options argument.
 */
// Configuration options

class ConfigModuleActive extends Config {
  constructor() {
    super('ConfigModuleActive', '', ['active', 'inactive']);
  }

}
class ConfigLinkCrownFire extends Config {
  constructor() {
    super('ConfigLinkCrownFire', 'The crown spotting module inputs are', [['linkedToCrownFire', 'linked to the Crown Fire Module outputs'], ['standAlone', 'entered directly (stand-alone mode)']]);
  }

}
class ConfigLinkFireEllipse extends Config {
  constructor() {
    super('ConfigLinkFireEllipse', 'The fire containment module inputs are', [['linkedToFireEllipse', 'linked to fire ellipse module outputs'], ['standAlone', 'entered separately (stand-alone)']]);
  }

}
class ConfigLinkScorchHeight extends Config {
  constructor() {
    super('ConfigLinkScorchHeight', 'The tree mortality module inputs (scorch height) are:', [['linkedToScorchHeight', 'linked to the scorch surface or fire ellipse outputs'], ['standAlone', 'entered separately (stand-alone mode)']]);
  }

}
class ConfigLinkSurfaceFire extends Config {
  constructor() {
    super('ConfigLinkSurfaceFire', 'This module\'s inputs are', [['linkedToSurfaceFire', 'linked to Surface Fire outputs'], ['standAlone', 'entered directly (stand-alone mode)']]);
  }

} // bp6 #11 Surface > Input  > Chaparral > Total load is: [specified, est]

class ConfigChaparralTotalLoad extends Config {
  constructor() {
    super('ConfigChaparralTotalLoad', 'When required as input, chaparral total fuel load is', [['input', 'entered directly'], ['estimated', 'estimated from chaparral depth']]);
  }

} // bp6 #2 - Surface > Input  > Moisture > Herb Curing: [est, inp]

class ConfigCuredHerbFraction extends Config {
  constructor() {
    super('ConfigCuredHerbFraction', 'The cured herb fraction for BehavePlus fuel models is', [['input', 'entered directly'], ['estimated', 'estimated from live fuel moisture']]);
  }

} // bp6 #1 Surface > Input  > Fuel:
// [key, std, exp, harm, arith, pg, wa, ch]
// Bpx splits bp6 config #1 into two configs; primary.fuel and secondary.fuel

class ConfigPrimaryFuels extends Config {
  constructor() {
    super('ConfigPrimaryFuels', 'Primary surface fuels are specified by entering', [['catalog', 'a fuel model catalog key'], ['behave', 'standard BehavePlus fuel parameters'], ['chaparral', 'chaparral dynamic fuel parameters'], ['palmettoGallberry', 'palmetto-gallberry dynamic fuel parameters'], ['westernAspen', 'western aspen dynamic fuel parameters']]);
  }

} // bp6 #1 Surface > Input  > Fuel:
// [key, std, exp, harm, arith, pg, wa, ch]
// Bpx splits bp6 config #1 into two configs; primary.fuel and secondary.fuel

class ConfigSecondaryFuels extends Config {
  constructor() {
    super('ConfigSecondaryFuels', 'Secondary surface fuels are specified by entering', [['none', 'there are no secondary fuels'], ['catalog', 'a fuel model catalog key'], ['behave', 'standard BehavePlus fuel parameters'], ['chaparral', 'chaparral dynamic fuel parameters'], ['palmettoGallberry', 'palmetto-gallberry dynamic fuel parameters'], ['westernAspen', 'western aspen dynamic fuel parameters']]);
  }

} // bp6 #3 - Surface > Input  > Moisture > Fuel Moisture:
// [ind, cat, mixed, scen]

class ConfigMoistureContents extends Config {
  constructor() {
    super('ConfigMoistureContents', 'When required as input, fuel moisture is', [['individual', 'entered for the 3 dead and 2 live fuel moisture classes'], ['liveCategory', 'entered for the 3 dead moisture classes and a singe live category moisture'], ['fosberg', 'estimated from Fosbergs tables'], ['category', 'the dead and live category moistures only']]); // ['catalog' // 'a fuel moisture catalog key']
  }

} // bp6 #4 Surface > Input  > Wind Speed > Entered at:
// [mid, 20-wafInp, 20-wafEst, 10-wafInp, 10-wafEst]
// Bpx slipts Bp6 config #4 into 2 configs, fuel.waf and wind.speed

class ConfigWindSpeedAdjustmentFactor extends Config {
  constructor() {
    super('ConfigWindSpeedAdjustmentFactor', 'When required as input, midflame wind speed adjustment factor is', [['input', 'entered directly'], ['estimated', 'estimated from canopy and fuel parameters']]);
  }

} // bp6 #7 Surface > Input  > Slope > Slope is [percent, degrees]
// bp6 #8 Surface > Input  > Slope > Slope is [input, map]
// BPX combined Bp6 configs #7 and #8

class ConfigSlopeSteepness extends Config {
  constructor() {
    super('ConfigSlopeSteepness', 'When required as input, slope steepness is', [['ratio', 'entered as ratio of vertical rise to horizontal reach'], ['degrees', 'entered as degrees of angle above the horizontal plane'], ['map', 'estimated from map measurements']]);
  }

}
class ConfigTemperatureHumidity extends Config {
  constructor() {
    super('ConfigTemperatureHumidity', 'When relative humidity or dew point are required, prefer to', [['humidity', 'enter dry bulb and relative humidity and calculate dew point'], ['wetBulb', 'enter dry bulb, wet bulb, and elev and calculate dew point, relative humidity'], ['dewPoint', 'enter dry bulb and dew point and calculate relative humidity']]);
  }

} // bp6 #5 Surface > Input  > Wind Speed > Wind is:
// [always upslope, specified]

class ConfigWindDirection extends Config {
  constructor() {
    super('ConfigWindDirection', 'When required as input, wind direction is', [['sourceFromNorth', 'the direction FROM which the wind is blowing (degrees from NORTH)'], ['headingFromUpslope', 'the direcion TOWARDS which the wind is blowing (degrees from UPSLOPE)'], ['upslope', 'assumed to be blowing upslope']], 1);
  }

} // bp6 #4 Surface > Input  > Wind Speed > Entered at:
// [mid, 20-wafInp, 20-wafEst, 10-wafInp, 10-wafEst]
// Bpx slipts Bp6 config #4 into 2 configs, fuel.waf and wind.speed

class ConfigWindSpeed extends Config {
  constructor() {
    super('ConfigWindSpeed', 'When required as an input, wind speed is entered for', [['at10m', '10-m height'], ['at20ft', '20-ft height'], ['atMidflame', 'midflame height']], 1);
  }

}
class ConfigFirelineIntensity extends Config {
  constructor() {
    super('ConfigFirelineIntensity', 'When required as an input, fireline intensity is', [['firelineIntensity', 'entered directly'], ['flameLength', 'estimated from the flame length input']]);
  }

}
class ConfigFireLengthToWidthRatio extends Config {
  constructor() {
    super('ConfigFireLengthToWidthRatio', 'When required as an input, fire ellipse length-to-width ratio is', [['lengthToWidthRatio', 'entered directly'], ['effectiveWindSpeed', 'estimated from the effective wind speed input']]);
  }

} // bp6 #6 Surface > Input  > Wind Speed > Impose max wind speed limit?

class ConfigEffectiveWindSpeedLimit extends Config {
  constructor() {
    super('ConfigEffectiveWindSpeedLimit', 'The fire spread rate effective wind speed limit is', [['applied', 'applied'], ['ignored', 'ignored']]);
  }

} // New to BPX

class ConfigFireWeightingMethod extends Config {
  constructor() {
    super('ConfigFireWeightingMethod', 'Weighted fire spread rate of 2 surface fuel types is based on', [['arithmetic', 'arithmetic mean spread rate'], // ['expected', 'expected value spread rate'],
    ['harmonic', 'harmonic mean spread rate']], 1);
  }

} // bp6 #10 Surface > Input  > Directions > Wind & Fire Dir: [wrt upslope, wrt north]

class ConfigFireVector extends Config {
  constructor() {
    super('ConfigFireVector', 'When required as input, fire vector direction inputs are', [['fromHead', 'degrees clockwise from direction of maximum spread'], ['fromUpslope', 'degrees clockwise from upslope'], ['fromNorth', 'degrees clockwise from north']]);
  }

} // bp6 #9 Surface > Input  > Directions > Spread is [head, back, flank, psi, beta]
// BPX implements all spread direction options at any time instead of selecting just one
// bp6 #12 - Crown > Input  > Use [roth, s&r]
// BPX - May not be necessary: S&R is applied only if passive ouputs requested
// export class ConfigCrownFireMethod extends Config {
//   constructor () {
//     super('ConfigCrownFireMethod',
//       'Crown fire is estimated via', [
//         ['rothermel', 'Rothermel'],
//         ['scottReinhardt', 'Scott and Reinhardt (wind must blow upslope)']], 1)
//   }
// }
// bp6 #13 - Crown > Input  > FLI [fl, fli]
// BPX- Required only in STANDALONE mode
// export class ConfigCrownFli extends Config {
//   constructor () {
//     super('ConfigCrownFireFli',
//       'The Crown Module is', [
//         ['surface', 'linked to the Surface Module'],
//         ['flameLength', 'run stand-alone using flame length input'],
//         ['firelineIntensity', 'run stand-alone using fireline intensity input']])
//   }
// }
// bp6 # 14 - Contain > Input  > resources [single, multiple]
// export class ConfigContainResources extends Config {
//   constructor () {
//     super('ConfigContainResources',
//       'Contain Module allows', [
//         ['singleResource', 'a single firefighting resource'],
//         ['multipleResources', 'multiple firefighting resources']], 1)
//   }
// }

/**
 * @file Options.js defines the fire simulator Option Variants
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Declares the specialized BehavePlus Option Variants used by nodes and equations.
 *
 * new Option(key, prompt, optionsArray, defaultOptionIndex = 0)
 *
 */

class ChaparralTypeOption extends Option {
  constructor() {
    super('ChaparralTypeOption', 'Chaparral fuel type', Types$1);
  }

}
class CrownFireInitiationTypeOption extends Option {
  constructor() {
    super('CrownFireInitiationTypeOption', 'Crown fire initiation type', InitiationTypes);
  }

}
class EastWestOption extends Option {
  constructor() {
    super('EastWestOption', 'Longitude East or West', ['east', 'west']);
  }

}
class FuelModelDomainOption extends Option {
  constructor() {
    super('FuelModelDomainOption', 'Fuel model domain', Domains);
  }

}
class FuelModelKeyOption extends Option {
  constructor() {
    super('FuelModelKeyOption', 'Fuel model key', keys());
    this._value._default = '10';
  }

}
class IgnitionFuelTypeOption extends Option {
  constructor() {
    super('IgnitionFuelTypeOption', 'Ignition fuel type', LightningFuels);
  }

}
class IgnitionLightningChargeOption extends Option {
  constructor() {
    super('IgnitionLightningChargeOption', 'Ignition lightning charge', LightningCharges);
  }

}
class NorthSouthOption extends Option {
  constructor() {
    super('NorthSouthOption', 'Latitude North or South', ['north', 'south']);
  }

}
class SpottingSourceLocationOption extends Option {
  constructor() {
    super('SpottingSourceLocationOption', 'Spotting source location', locations());
  }

}
class TorchingTreeSpeciesOption extends Option {
  constructor() {
    super('TorchingTreeSpeciesOption', 'Species of torching trees', TorchingTreeSpecies);
  }

}
class TreeSpeciesFofem6Option extends Option {
  constructor() {
    super('TreeSpeciesFofem6Option', 'Tree species (FOFEM 6 code)', fofem6Codes());
  }

}
class WesternAspenTypeOption extends Option {
  constructor() {
    super('WesternAspenTypeOption', 'Western aspen fuel type', Types);
  }

}

/**
 * @file Variants.js defines the fire simulator non-Config and non-Option Variants
 * (i.e., all the Quantity, Bool, etc)
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Declares the specialized BehavePlus numeric (Quantity, Float, Integer) Variants.
 *
 * Note that classes derived from Crucible.Variant.Quantity()
 * require an array of valid units-of-measure as its first argument.
 */
// Part 1 - Base Variants for more specialized BehavePlus Variants
// All these MUST take a 'key' argument

class NoYes extends Bool {
  // Bool(key, defaultValue=false, falseText='false', trueText='true', prompt='') {
  constructor() {
    super('NoYes', false, 'No', 'Yes', '');
  }

}
class DownWindCanopyIsOpen extends Bool {
  // Bool(key, defaultValue=false, falseText='false', trueText='true', prompt='') {
  constructor() {
    super('DownWindCanopyIsOpen', false, 'Closed', 'Open', 'The down-wind canopy is');
  }

}
class EffectiveWindSpeedLimitIsExceeded extends Bool {
  // Bool(key, defaultValue=false, falseText='false', trueText='true', prompt='') {
  constructor() {
    super('EffectiveWindSpeedLimitIsExceeded', false, 'Not Exceeded', 'Exceeded', 'The effective wind speed limit is');
  }

}
class FireSpreadRateLimitIsExceeded extends Bool {
  // Bool(key, defaultValue=false, falseText='false', trueText='true', prompt='') {
  constructor() {
    super('FireSpreadRateLimitIsExceeded', false, 'Not Exceeded', 'Exceeded', 'The fire spread rate limit is');
  }

}
class FuelIsSheltered extends Bool {
  // Bool(key, defaultValue=false, falseText='false', trueText='true', prompt='') {
  constructor() {
    super('FuelIsSheltered', false, 'Not sheltered', 'Sheltered', 'Is fuel bed sheltered by the canopy?');
  }

}
class Factor extends Float {
  constructor(key = 'Factor', defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1) {
    super(key, defaultValue, minValue, maxValue, stepValue);
  }

}
class NonNegativeFactor extends Factor {
  constructor(key = 'NonNegativeFactor', defaultValue = 0, minValue = 0, maxValue = Number.MAX_VALUE, stepValue = 1) {
    super(key, defaultValue, minValue, maxValue, stepValue);
  }

} // Part 2 - Specialized BehavePlus Variants - All 'key' properties are FIXED

class AirTemperature extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('AirTemperature', ['oF', 'oC']);
  }

}
class CompassAzimuth extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('CompassAzimuth', ['deg'], 360, 0, 0, 5);
  }

}
class CrownFillFraction extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 )
  constructor() {
    super('CrownFillFraction');
  }

}
class CrownFireActiveRatio extends NonNegativeFactor {
  constructor() {
    super('CrownFireActiveRatio');
  }

}
class CrownFireBurnedFraction extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 )
  constructor() {
    super('CrownFireBurnedFraction');
  }

}
class CrownRatioFraction extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 )
  constructor() {
    super('CrownRatioFraction');
  }

}
class CrownTransitionRatio extends NonNegativeFactor {
  constructor() {
    super('CrownTransitionRatio');
  }

}
class DateDayOfMonth extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('DateDayOfMonth', 1, 1, 31, 1);
  }

}
class DateDayOfYear extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('DateDayOfYear', 1, 1, 366, 1);
  }

}
class DateJulian extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('DateJulian', 21100, 0, 40000, 1);
  }

}
class DateMonth extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('DateMonth', 1, 1, 12, 1);
  }

}
class DateYear extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('DateYear', 2020, 1000, 3000, 1);
  }

}
class Documentation extends Text {
  // Text(key, defaultValue = '', minLength = 0, maxLength = 999999)
  constructor() {
    super('Documentation', '', 0, 80);
  }

}
class Elevation extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('Elevation', ['ft', 'm'], 30000, 0, -1000, 100);
  }

}
class ElevationDiff extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('ElevationDiff', ['ft', 'm'], 5000, 0, -5000, 100);
  }

}
class FireArea extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireArea', ['ft2', 'ac', 'mi2', 'm2', 'ha', 'km2']);
  }

}
class FireDampingCoefficient extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 )
  constructor() {
    super('FireDampingCoefficient');
  }

}
class FireElapsedTime extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireElapsedTime', ['min', 'h', 'd']);
  }

}
class FireFirelineIntensity extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireFirelineIntensity', ['btu/ft/s', 'J/m/s', 'W/m']);
  }

}
class FireFlameDuration extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireFlameDuration', ['min', 's', 'h']);
  }

}
class FireFlameLength extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireFlameLength', ['ft', 'm']);
  }

}
class FireHeatPerUnitArea extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireHeatPerUnitArea', ['btu/ft2', 'J/m2']);
  }

}
class FireLengthToWidthRatio extends Factor {
  // Factor(key, defaultValue=0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue=1)
  constructor() {
    super('FireLengthToWidthRatio', 1, 1);
  }

}
class FirePower extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FirePower', ['btu/min', 'btu/s', 'J/s', 'J/min', 'W']);
  }

}
class FirePowerRatio extends NonNegativeFactor {
  constructor() {
    super('FirePowerRatio');
  }

}
class FirePropagatingFluxRatio extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 )
  constructor() {
    super('FirePropagatingFluxRatio');
  }

}
class FireReactionIntensity extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireReactionIntensity', ['btu/ft2/min', 'J/m2/min']);
  }

}
class FireReactionVelocity extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireReactionVelocity', ['min-1', 's-1']);
  }

}
class FireResidenceTime extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireResidenceTime', ['min', 's', 'h']);
  }

}
class FireScorchHeight extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireScorchHeight', ['ft', 'm']);
  }

}
class FireSpotDistance extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireSpotDistance', ['ft', 'm', 'ch', 'mi', 'km']);
  }

}
class FireSpreadDistance extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireSpreadDistance', ['ft', 'm', 'ch', 'mi', 'km']);
  }

}
class FireSpreadRate extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FireSpreadRate', ['ft/min', 'm/min', 'ch/h', 'mi/h', 'km/h']);
  }

}
class FuelAge extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelAge', ['y']);
  }

}
class FuelBasalArea extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelBasalArea', ['ft2', 'm2']);
  }

}
class FuelBedBulkDensity extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelBedBulkDensity', ['lb/ft3', 'kg/m3']);
  }

}
class FuelBedDepth extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelBedDepth', ['ft', 'in', 'm', 'cm'], 0.01);
  }

}
class FuelBedHeatOfPreignition extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelBedHeatOfPreignition', ['btu/lb', 'J/kg']);
  }

}
class FuelBedPackingRatio extends NonNegativeFactor {
  constructor() {
    super('FuelBedPackingRatio');
  }

}
class FuelCoverFraction extends Fraction {
  constructor() {
    super('FuelCoverFraction');
  }

}
class FuelCylindricalDiameter extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelCylindricalDiameter', ['in', 'cm']);
  }

}
class FuelCylindricalVolume extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelCylindricalVolume', ['ft3', 'in3', 'm3', 'cm3', 'mm3']);
  }

}
class FuelDeadFraction extends Fraction {
  constructor() {
    super('FuelDeadFraction');
  }

}
class FuelEffectiveHeatingNumber extends Fraction {
  constructor() {
    super('FuelEffectiveHeatingNumber');
  }

}
class FuelEffectiveMineralContent extends Fraction {
  constructor() {
    super('FuelEffectiveMineralContent');
  }

}
class FuelHeatOfCombustion extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelHeatOfCombustion', ['btu/lb', 'J/kg'], 12000, 8000);
  }

}
class FuelHeatOfPreignition extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelHeatOfPreignition', ['btu/lb', 'J/kg']);
  }

}
class FuelHeatSink extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelHeatSink', ['btu/ft3', 'J/m3']);
  }

}
class FuelLabelText extends Text {
  constructor() {
    super('FuelLabelText', '', 0, 80);
  }

}
class FuelMoistureContent extends Ratio {
  // Ratio(key, maxValue, defaultValue=0, minValue = 0, stepValue = 1 ) {
  constructor() {
    super('FuelMoistureContent', 5, 1, 0.01, 0.01);
  }

}
class FuelMoistureContentDead extends Ratio {
  // Ratio(key, maxValue, defaultValue=0, minValue = 0, stepValue = 1 ) {
  constructor() {
    super('FuelMoistureContentDead', 0.5, 0.1, 0.01, 0.01);
  }

}
class FuelMoistureContentLive extends Ratio {
  // Ratio(key, maxValue, defaultValue=0, minValue = 0, stepValue = 1 ) {
  constructor() {
    super('FuelMoistureContentLive', 5, 1, 0.5, 0.25);
  }

}
class FuelOvendryLoad extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelOvendryLoad', ['lb/ft2', 'ton/ac', 'kg/m2', 'tonne/ha'], 10, 0);
  }

}
class FuelParticleFiberDensity extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelParticleFiberDensity', ['lb/ft3', 'kg/m3']);
  }

}
class FuelSizeClassIndex extends ArrayIndex {
  constructor() {
    super('FuelSizeClassIndex', 6);
  }

}
class FuelSurfaceArea extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelSurfaceArea', ['ft2', 'm2']);
  }

}
class FuelSurfaceAreaToVolumeRatio extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelSurfaceAreaToVolumeRatio', ['ft2/ft3', 'm2/m3', 'cm2/cm3'], 4000, 1, 1, 100);
  }

}
class FuelSurfaceAreaToVolumeRatio1H extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelSurfaceAreaToVolumeRatio1H', ['ft2/ft3', 'm2/m3', 'cm2/cm3'], 4000, 1200, 192, 100);
  }

}
class FuelSurfaceAreaToVolumeRatio10H extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelSurfaceAreaToVolumeRatio10H', ['ft2/ft3', 'm2/m3', 'cm2/cm3'], 192, 96, 48, 4);
  }

}
class FuelSurfaceAreaToVolumeRatio100H extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelSurfaceAreaToVolumeRatio100H', ['ft2/ft3', 'm2/m3', 'cm2/cm3'], 48, 30, 16, 10);
  }

}
class FuelTotalMineralContent extends Fraction {
  constructor() {
    super('FuelTotalMineralContent');
  }

}
class FuelVolume extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('FuelVolume', ['ft3', 'm3']);
  }

}
class GmtDiff extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('GmtDiff', 0, -14, +14, 1);
  }

}
class IgnitionFuelDepth extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('IgnitionFuelDepth', ['in', 'cm']);
  }

}
class IgnitionProbability extends Fraction {
  constructor() {
    super('IgnitionProbability');
  }

}
class Latitude extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('Latitude', ['deg'], 90, 0, 0, 5);
  }

}
class Longitude extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('Longitude', ['deg'], 180, 0, 0, 5);
  }

}
class MapArea extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('MapArea', ['in2', 'cm2', 'mm2']);
  }

}
class MapContoursCount extends Count {
  constructor() {
    super('MapContoursCount', 0);
  }

}
class MapDistance extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('MapDistance', ['in', 'ft', 'cm', 'mm']);
  }

}
class MapFactor extends Factor {
  // Float(key, defaultValue=0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue=1) {
  constructor() {
    super('MapFactor', 1 / 24000, 1 / 2000000, 1);
  }

}
class MapScale extends Factor {
  // Float(key, defaultValue=0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue=1) {
  constructor() {
    super('MapScale', 24000, 1, 2000000);
  }

}
class MortalityFraction extends Fraction {
  constructor() {
    super('MortalityFraction');
  }

}
class RelativeHumidity extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 )
  constructor() {
    super('RelativeHumidity');
  }

}
class ShadingFraction extends Fraction {
  constructor() {
    super('ShadingFraction');
  }

}
class SlopeSteepnessDegrees extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('SlopeSteepnessDegrees', ['deg'], 89, 0, 0, 1);
  }

}
class SlopeSteepnessRatio extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('SlopeSteepnessRatio', ['ratio', '%'], 10, 0, 0, 0.1);
  }

}
class SpottingFirebrandObject extends Obj {
  // Crown fire spotting distance
  constructor() {
    super('SpottingFirebrandObject', {
      zdrop: 0,
      xdrop: 0,
      xdrift: 0,
      xspot: 0,
      layer: 0
    });
  }

}
class TimeHour extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('TimeHour', 0, 0, 24, 1);
  }

}
class TimeMinute extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('TimeMinute', 0, 0, 60, 1);
  }

}
class TimeSecond extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('TimeSecond', 0, 0, 60, 1);
  }

}
class TimeStamp extends Integer {
  // (key, defaultValue = 0, minValue = 1 - Number.MAX_VALUE, maxValue = Number.MAX_VALUE, stepValue = 1)
  constructor() {
    super('TimeStamp');
  }

}
class TreeBarkThickness extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('TreeBarkThickness', ['in', 'cm', 'mm']);
  }

}
class TreeCount extends Count {
  constructor() {
    super('TreeCount', 0);
  }

}
class TreeDbh extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('TreeDbh', ['in', 'ft', 'cm', 'm']);
  }

}
class TreeHeight extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('TreeHeight', ['ft', 'm']);
  }

}
class WeightingFactor extends Fraction {
  constructor() {
    super('WeightingFactor');
  }

}
class WindSpeed extends Quantity {
  // Quantity(key, unitsOptions, maxValue, defaultValue=0, minValue = 0, stepValue = 1 )
  constructor() {
    super('WindSpeed', ['ft/min', 'mi/h', 'm/s', 'm/min', 'km/h']);
  }

}
class WindSpeedAdjustmentFactor extends Fraction {
  // Fraction(key, defaultValue=0, stepValue = 0.01 ) {
  constructor() {
    super('WindSpeedAdjustmentFactor', 1, 0.05);
  }

}

/**
 * @file VariantMap provides a Map() of Variant instances for a Dag.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
const vClasses = [ConfigModuleActive, ConfigLinkCrownFire, ConfigLinkFireEllipse, ConfigLinkScorchHeight, ConfigLinkSurfaceFire, ConfigChaparralTotalLoad, ConfigCuredHerbFraction, ConfigPrimaryFuels, ConfigSecondaryFuels, ConfigMoistureContents, ConfigWindSpeedAdjustmentFactor, ConfigSlopeSteepness, ConfigTemperatureHumidity, ConfigWindDirection, ConfigWindSpeed, ConfigFirelineIntensity, ConfigFireLengthToWidthRatio, ConfigEffectiveWindSpeedLimit, ConfigFireWeightingMethod, ConfigFireVector, ChaparralTypeOption, CrownFireInitiationTypeOption, EastWestOption, FuelModelDomainOption, FuelModelKeyOption, IgnitionFuelTypeOption, IgnitionLightningChargeOption, NorthSouthOption, SpottingSourceLocationOption, TorchingTreeSpeciesOption, TreeSpeciesFofem6Option, WesternAspenTypeOption, NoYes, DownWindCanopyIsOpen, EffectiveWindSpeedLimitIsExceeded, FireSpreadRateLimitIsExceeded, FuelIsSheltered, Factor, NonNegativeFactor, AirTemperature, CompassAzimuth, CrownFillFraction, CrownFireActiveRatio, CrownFireBurnedFraction, CrownRatioFraction, CrownTransitionRatio, DateDayOfMonth, DateDayOfYear, DateJulian, DateMonth, DateYear, Documentation, Elevation, ElevationDiff, FireArea, FireDampingCoefficient, FireElapsedTime, FireFirelineIntensity, FireFlameDuration, FireFlameLength, FireHeatPerUnitArea, FireLengthToWidthRatio, FirePower, FirePowerRatio, FirePropagatingFluxRatio, FireReactionIntensity, FireReactionVelocity, FireResidenceTime, FireScorchHeight, FireSpotDistance, FireSpreadDistance, FireSpreadRate, FuelAge, FuelBasalArea, FuelBedBulkDensity, FuelBedDepth, FuelBedHeatOfPreignition, FuelBedPackingRatio, FuelCoverFraction, FuelCylindricalDiameter, FuelCylindricalVolume, FuelDeadFraction, FuelEffectiveHeatingNumber, FuelEffectiveMineralContent, FuelHeatOfCombustion, FuelHeatOfPreignition, FuelHeatSink, FuelLabelText, FuelMoistureContent, FuelMoistureContentDead, FuelMoistureContentLive, FuelOvendryLoad, FuelParticleFiberDensity, FuelSizeClassIndex, FuelSurfaceArea, FuelSurfaceAreaToVolumeRatio, FuelSurfaceAreaToVolumeRatio1H, FuelSurfaceAreaToVolumeRatio10H, FuelSurfaceAreaToVolumeRatio100H, FuelTotalMineralContent, FuelVolume, GmtDiff, IgnitionFuelDepth, IgnitionProbability, Latitude, Longitude, MapArea, MapContoursCount, MapDistance, MapFactor, MapScale, MortalityFraction, RelativeHumidity, ShadingFraction, SlopeSteepnessDegrees, SlopeSteepnessRatio, SpottingFirebrandObject, TimeHour, TimeMinute, TimeSecond, TimeStamp, TreeBarkThickness, TreeCount, TreeDbh, TreeHeight, WeightingFactor, WindSpeed, WindSpeedAdjustmentFactor];
/**
 * VariantMap is a Javascript Map() object containing an instance of each
 * Variant keyed by its Variant.key()
 */

class VariantMap extends Map {
  constructor() {
    super();
    vClasses.forEach((Vclass, idx) => {
      const v = new Vclass();
      this.set(v.key(), v);
    });

    this._applyInitial();
  } // Applies commonly expected display units where they differ from native units


  _applyInitial() {
    this.get('FireArea').setDisplayUnits('ac');
    this.get('FuelMoistureContent').setDisplayUnits('%');
    this.get('FuelMoistureContentDead').setDisplayUnits('%');
    this.get('FuelMoistureContentLive').setDisplayUnits('%');
    this.get('WindSpeed').setDisplayUnits('mi/h');
  }

}

/**
 * @file DagPrivate class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
class DagPrivate {
  constructor(sim) {
    this._input = new Map(); // Map of input DagNode refs => array of input values

    this._node = []; // array of DagNode references in Genome index order

    this._configureClass = null;
    this._runLimit = 1000000;
    this._selected = new Set(); // Set of selected DagNode references (needed?)

    this._sim = sim; // reference to the master Sim (and its Genome and literals)

    this._sortedNodes = []; // array of topologically ordered DagNode references

    this._storageClass = null; // StorageAbstract derived instance (set by new Dag())

    this._updateClass = null; // UpdateAbstract derived instance (set by new Dag())

    this._variantMap = new VariantMap(); // private VariantMap to be manipulated by this Dag

    const variantsArray = Array.from(this._variantMap.values()); // used below to convert Variant indices to references

    sim.genes().forEach(gene => {
      const variantRef = variantsArray[gene[2]]; // reference to this DagNode's Variant

      const value = variantRef.defaultValue(); // DagNode's actual value

      this._node.push(new DagNode(gene, variantRef, value));
    });
    this.setTopology();
  } // Returns an array of references to ALL Config Nodes that may be used by `node`
  // Called only by Dag.setNodeEdges()


  _nodeConfigs(node) {
    const configs = new Set();
    node.updaters().forEach(updater => {
      if (updater[0].length) {
        configs.add(this._node[updater[0][0]]);
      }
    });
    return Array.from(configs);
  } // Repackages an array of [<DagNode|key|index>] an array of [<DagNode>]


  _refs(nodeRefKeyIdx, name) {
    const refs = [];

    if (!Array.isArray(nodeRefKeyIdx)) {
      throw new Error(`${name}(DagNodes|keys|indices) arg must be an Array`);
    }

    nodeRefKeyIdx.forEach(ref => {
      refs.push(this.get(ref));
    });
    return refs;
  } // Repackages an array of [<DagNode|key|index>, <value>] pairs as an array of [<DagNode>, <value>] pairs


  _refVals(pairs, name) {
    const refVals = [];

    if (!Array.isArray(pairs)) {
      throw new Error(`${name}(keyValuePairs) arg must be an Array of 2-element arrays`);
    }

    pairs.forEach((pair, idx) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error(`${name}(keyValuesPair[${idx}]) [<node|key|index>, <value>] must be a 2-element Array`);
      }

      refVals.push([this.get(pair[0]), pair[1]]);
    });
    return refVals;
  } // Returns the DagNode's updater array under the current configuration,
  // but with the configIdx replaced with its Config DagNode reference


  findNodeUpdater(node) {
    for (let idx = 0; idx < node.updaters().length; idx++) {
      const updater = node.updater(idx);
      const [condition, method] = updater;
      if (!condition.length) return [[null, null], method]; // if no conditions, then this IS the current updater

      const [configIdx, valueIdx] = condition;
      const configNode = this.get(configIdx);
      const configValue = configNode.value(); // current value of the Config DagNode

      const testValue = this._sim.literal(valueIdx); // comparison value to active this updater


      if (configValue === testValue) return [[configNode, testValue], method]; // If there is a match, this IS the current updater
    } // The following line should never be executed, but then....


    throw new Error(`DagNode '${node.key()}' has no active updater condition`);
  }
  /**
   * Returns a reference to a DagNode given its reference, genome key, or genome numeric index
   *
   * @param {DagNode|string|number} something A DagNode reference, key, or Genome index
   * @returns {DagNode} Reference to the passed node locator.
   */


  get(something) {
    if (something instanceof DagNode) {
      return something;
    } else if (this._sim._geneKeyIdxMap.has(something)) {
      return this._node[this._sim._geneKeyIdxMap.get(something)];
    } else if (typeof something === 'number' && something >= 0 && something < this._node.length) {
      return this._node[something];
    }

    throw new Error(`Unable to resolve a Node reference from arg '${something}'`);
  } // Returns the literal string, number, or object given its genome index


  literal(literalIdx) {
    return this._sim.literal(literalIdx);
  }
  /**
   * @returns {Array} An array of references to all required update DagNodes in topological order.
   */


  requiredUpdateNodes() {
    const nodes = [];

    this._sortedNodes.forEach(node => {
      if (node._is._enabled && node._is._required && !node._is._config) {
        nodes.push(node);
      }
    });

    return nodes;
  }
  /**
   * Called by setTopology() to return the DagNode's depth, calculating it first if necessary
   * (Its OK to determine depths of disabled Nodes)
   * @param {DagNode} Reference to the DagNode
   * @param {Set<DagNode>} visited The Set of DagNode keys that have been traversed from the start of the chain
   */


  setNodeDepth(node, visited) {
    // If this Node doesn't yet have a depth, derive it
    if (!node._dag._depth) {
      let maxDepth = 0;

      node._dag._consumers.forEach(consumer => {
        const consumerKey = consumer.key();

        if (visited.has(consumerKey)) {
          // oops, this DagNode was already visited
          // The following lines should never be executed, but then...
          visited.add(consumerKey);
          throw new Error(`Cyclical dependency detected:\n${Array.from(visited).join(' required by ->\n')}`);
        }

        visited.add(consumerKey); // add this consumer to the Visited Set

        const depth = this.setNodeDepth(consumer, visited); // recurse to get depth of this consumer

        visited.delete(consumerKey); // remove the consumer from the Visited Set

        maxDepth = Math.max(depth, maxDepth);
      });

      node._dag._depth = maxDepth + 1; // *this* DagNode's depth  must be greater
    }

    return node._dag._depth;
  } // Called by setTopology() to set each DagNode's:
  // - update method and parms,
  // - producer (in) DagNodes, and
  // - consumer (out) DagNodes.


  setNodeEdges(node) {
    const [condition, methodInfo] = this.findNodeUpdater(node);
    const configNode = condition[0];
    const [methodIdx, ...parms] = methodInfo;

    const [file, func] = this._sim.method(methodIdx).split('.');

    node._update._method = file === 'Math' ? Math[func] : Lib[file][func]; // Add all Config nodes referenced by node to the Required Set

    node._update._configs = this._nodeConfigs(node);

    node._update._configs.forEach(config => {
      config._dag._consumers.push(node);
    });

    node._update._config = configNode; // eslint-disable-next-line dot-notation

    node._is._input = node._update._method === input;
    node._update._parms = [];
    parms.forEach(parm => {
      const [isLiteral, idx] = parm;

      if (isLiteral) {
        // parm is a literal number, string, or object
        node._update._parms.push([isLiteral, this.literal(idx)]);
      } else {
        // parm is a DagNode reference
        const producer = this.get(idx); // get reference to this DagNode parm

        node._update._parms.push([isLiteral, producer]);

        node._dag._producers.push(producer); // add producer to *this* node's producer array


        producer._dag._consumers.push(node); // add *this* node to producer's consumer array

      }
    });
  }

  setRequiredNodes() {
    // Unrequire ALL nodes while building array of all selected nodes
    const selected = [];

    this._sortedNodes.forEach(node => {
      node._is._required = false;
      if (node._is._selected && node._is._enabled) selected.push(node);
    });

    selected.forEach(node => {
      this.setRequiredRecursive(node);
    });
  } // Recursively requires all producers of this DagNode


  setRequiredRecursive(node) {
    if (!node._is._required) {
      // Nothing more to do if this DagNode is already required
      node._is._required = true; // Require this DagNode's Config DagNode

      node._update._configs.forEach(config => {
        config._is._required = true;
      }); // Require all this DagNode's producer DagNodes


      node._dag._producers.forEach(producer => {
        if (!producer._is._enabled) {
          throw new Error(`Node '${node.key()}' has disabled producer '${producer.key()}'`);
        }

        this.setRequiredRecursive(producer);
      });
    }
  }
  /**
   * Updates all the DagNode updater methods and args based on current config Nodes,
   * then determines DagNode depths and topological order
   */


  setTopology() {
    // clear each DagNode's consumers[], producers[], depth, order
    this._node.forEach(node => {
      node.reset();
    }); // set each DagNode's updater methods, parms, consumers, and producers


    this._node.forEach(node => {
      this.setNodeEdges(node);
    }); // set each DagNode's topological depth in the consumer chain


    let maxDepth = 0;

    this._node.forEach(node => {
      const visited = new Set([node.key()]);
      maxDepth = Math.max(maxDepth, this.setNodeDepth(node, visited));
    }); // create this._sortedNodes[]


    this.sortNodes();
  }
  /**
     * Returns a topologically sorted array of the DagNodes, where:
     *  - *input* DagNodes are deferred to the greatest depth allowed by their consumers (out-edges)
     *  - *fixed* DagNodes are run first and just once
     * Its OK to determine depths of disabled Nodes
     */


  sortNodes() {
    this._sortedNodes = [];

    this._node.forEach(node => {
      // Ensure input DagNodes are processed after all other DagNodes at the same depth
      // - non-input DagNodes have an odd numbered level = 2 * depth - 1
      // - input DagNodes have an even numbered level = 2 * depth
      node._dag._depth = node._is._input ? 2 * node._dag._depth - 1 : 2 * node._dag._depth;

      this._sortedNodes.push(node);
    }); // topologically sort the DagNode array


    this._sortedNodes.sort((node1, node2) => node2._dag._depth - node1._dag._depth);

    this._sortedNodes.forEach((node, order) => {
      node._dag._order = order;
    });
  }

}

/**
 * @file StorageAbstract is a do-nothing Dag storage class from which other storage classes are derived.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
class StorageAbstract {
  constructor(dag) {
    if (typeof dag !== 'object') {
      throw new Error('Dag Storage<Something>() class constructors require arg 1 to be an instance of the Dag class');
    }

    this._dag = dag;
  }

  init() {}

  store() {}

  end() {}

}

/**
 * @file UpdateAbstract is a do-nothing Dag updater class from which other updater classes are derived.
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
class UpdateAbstract {
  constructor(dag) {
    if (typeof dag !== 'object') {
      throw new Error('Dag Update<Something>() class constructors require arg 1 to be an instance of the Dag class');
    }

    this._dag = dag;
  }

  update() {}

}

/**
 * @file UpdateOrthogonalStack class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Generates a set of result values for all combinations of the dag.input values.
 *
 * For example, if fuel model has 2 input values, 1-h dead moisture has 3 input values,
 * and wind speed has 4 input values, then 2 x 3 x 4 = 24 results are generated.
 */

class UpdateOrthogonalStack extends UpdateAbstract {
  // eslint-disable-next-line no-useless-constructor
  constructor(dag) {
    super(dag);
  }
  /**
   * @returns {object} {runs: 0, calls: 0, ok: true, message: ''}
   */


  update() {
    const result = {
      runs: 0,
      calls: 0,
      ok: true,
      message: ''
    };
    const ptrMap = new Map(); // map of input DagNode value indices

    this._dag.requiredInputNodes().forEach(node => ptrMap.set(node, 0));

    this._dag._storageClass.init();

    const stack = this._dag.requiredUpdateNodes(); // All required updteable (non-Config) DagNodes in topo order


    if (stack.length > 0) {
      let delta = 1;
      let node;
      let stackIdx = 0;

      while (stackIdx >= 0) {
        node = stack[stackIdx];

        if (ptrMap.has(node)) {
          // this is a required, non-Config input dagNode
          if (delta > 0) {
            // moving down the stack, so start with the first input value
            ptrMap.set(node, 0);
            node._value = this._dag._input.get(node)[0];
          } else {
            // moving up the stack, so check for another input value
            const iptr = ptrMap.get(node) + 1; // point to its next input value

            const inputs = this._dag._input.get(node); // get all the Node's input values


            ptrMap.set(node, iptr); // set the input value pointer

            if (iptr < inputs.length) {
              // there is another input value to process...
              node._value = inputs[iptr]; // set its next input value

              delta = 1; // and go back down the stack
            }
          }
        } else {
          // this is NOT an input DagNode
          if (delta > 0) {
            // if moving down the stack...
            node.updateValue();
            result.calls++;
          }
        }

        stackIdx += delta; // set the next stack node to be processed (+1 === next, -1 === previous)

        if (stackIdx === stack.length) {
          // at the end of the stack (must be going down)
          this._dag._storageClass.store();

          result.runs += 1;

          if (result.runs >= this._dag._runLimit) {
            result.ok = false;
            result.message = `Run limit of ${this._dag._runLimit} exceeded.`;
            stackIdx = 0;
          }

          delta = -1; // must now go back up the stack

          stackIdx += delta; // set the next stack node to process (+1 === next, -1 === previous)
        }
      } // while

    } // if (stack.length > 0)


    this._dag._storageClass.end();

    return result;
  }

}

/**
 * @file Dag class public implementation
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
class Dag extends DagPrivate {
  constructor(sim) {
    super(sim);
    this._storageClass = new StorageAbstract(this);
    this._updateClass = new UpdateOrthogonalStack(this);
  }

  clearInputs() {
    this._input = new Map();
    return this;
  }

  clearSelected() {
    this._node.forEach(node => {
      node._is._required = false;
      node._is._selected = false;
    });

    return this;
  }
  /**
   * Sets the value of one or more Config DagNodes then calls setTopology()
   * @param {*} nodeValuePairs Array of 2-element arrays where:
   *  - element 0 is a Config DagNode reference, string key, or numeric Genome index, and
   *  - element 1 is the Config option value (usually a string)
   * @returns {Dag} Reference to *this* Dag (so we can chain configure([...]).run() )
   */


  configure(nodeValuePairs) {
    this._refVals(nodeValuePairs, 'configure').forEach(([node, value]) => {
      if (!node._is._config) {
        throw new Error(`configure() node '${node.key()}' is not a COnfig DagNode`);
      }

      if (!node._variant.isValidNativeValue(value)) {
        throw new Error(`Config Node '${node.key()}' value '${value}' is invalid`);
      }

      node._value = value;
    });

    if (this._configureClass) this._configureClass.configure();
    this.setTopology();
    this.setRequiredNodes();
    return this;
  }
  /**
   * @returns {Array} An array of references to all enabled DagNodes in topological order.
   */


  enabledNodes() {
    return this._sortedNodes.filter(node => node._is._enabled);
  }
  /**
   * Adds (or replaces) an array of input values for one or more DagNodes.
   *
   * Note that this function stores the DagNode's input values regardless of whether the
   * DagNode is actually an input under the current configuration-selection.
   * The values remain unchanged until they are reset by the another input() or a clearInputs().
   *
    * @param {*} nodeValuePairs Array of 2-element arrays where
   *  - element 0 is a DagNode reference, string key, or numeric Genome index, and
   *  - element 1 is the array of input *native* values
   * @returns {Dag} Reference to *this* Dag (so we can call chain input([...]).run() )
   */


  input(nodeValuePairs) {
    this._refVals(nodeValuePairs, 'input').forEach(([node, value]) => {
      this._input.set(node, Array.isArray(value) ? value : [value]);
    });

    return this;
  }
  /**
   * Returns a reference to a DagNode given its reference, genome key, or genome numeric index
   *
   * @param {DagNode|string|number} something A DagNode reference, key, or Genome index
   * @returns {DagNode} Reference to the passed node locator.
   */


  node(something) {
    return this.get(something);
  }

  nodes() {
    return this._node;
  }
  /**
   * @returns {Array} An array of references to all required Config DagNodes in topological order.
   */


  requiredConfigNodes() {
    return this._sortedNodes.filter(node => node._is._config && node._is._required);
  }
  /**
   * @returns {Array} An array of references to all required DagNodes in topological order.
   */


  requiredNodes() {
    return this._sortedNodes.filter(node => node._is._required);
  }
  /**
   * @returns {Array} An array of references to all required input DagNodes in topological order.
   */


  requiredInputNodes() {
    return this._sortedNodes.filter(node => node._is._input && node._is._required && !node._is._config);
  }

  run() {
    // Ensure every input DagNode has values in the Input Map
    this._sortedNodes.forEach(node => {
      if (node._is._required && node._is._input) {
        if (!this._input.has(node) || this._input.get(node) === []) {
          this._input.set(node, [node.value()]);
        }
      }
    });

    return this._updateClass.update(); // return recursive ? updateOrthogonalStack(this) : updateOrthogonalRecursive(this)
  }

  select(nodeRefsKeysIndices) {
    this._refs(nodeRefsKeysIndices, 'select').forEach(node => {
      node._is._selected = true;
    });

    this.setRequiredNodes();
    return this;
  }

  selectedNodes() {
    const nodes = [];

    this._sortedNodes.forEach(node => {
      if (node._is._selected) nodes.push(node);
    });

    return nodes;
  }

  setEnabled(prefixes, isEnabled) {
    this._node.forEach(node => {
      const key = node.key();

      for (let idx = 0; idx < prefixes.length; idx++) {
        if (key.startsWith(prefixes[idx])) {
          node.setEnabled(isEnabled);
          break;
        }
      }
    });

    return this;
  }

  setRunLimit(runs) {
    this._runLimit = runs;
    return this;
  }
  /**
   * Sets the storage class used by the Dag after every update run.
   * @param {StorageAbstract} storageClass Instance of a class derived from StorageAbstract
   */


  setStorageClass(storageClass) {
    if (!(storageClass instanceof StorageAbstract)) {
      throw new Error('setStorageClass() arg 1 must be an instance of StorageAbstract');
    }

    if (storageClass._dag !== this) {
      throw new Error('setStorageClass() instance must be set on *this* Dag');
    }

    this._storageClass = storageClass;
    return this;
  }
  /**
   * Sets the updater class used by the Dag.
   * @param {UpdateAbstract} updateClass Instance of a class derived from UpdateAbstract
   */


  setUpdateClass(updateClass) {
    if (!(updateClass instanceof UpdateAbstract)) {
      throw new Error('setUpdateClass() arg 1 must be an instance of UpdateAbstract');
    }

    if (updateClass._dag !== this) {
      throw new Error('setUpdateClass() instance must be set on *this* Dag');
    }

    this._updateClass = updateClass;
    return this;
  }

  sortedNodes() {
    return this._sortedNodes;
  }

  unselect(nodeRefsKeysIndices) {
    this._refs(nodeRefsKeysIndices, 'unselect').forEach(node => {
      node._is._selected = false;
    });

    this.setRequiredNodes();
    return this;
  }
  /**
   * Validates one or more DagNode display text input sets whose values are strings
   * (usually from a text file or browser input element) that must be translated,
   * cast, and converted into native values, usually prior to calling Dag.input().
   * @param {*} nodeValuePairs
   * @returns An array with one ValidationResult object {valid, value, message, node}
   * for each *raw input text* DagNode value
   */


  validateDisplayInputs(nodeValuePairs) {
    const errors = [];

    this._refVals(nodeValuePairs, 'validateDisplayInputs').forEach(([node, value]) => {
      const values = Array.isArray(value) ? value : [value]; // ensure values are in an array

      values.forEach(value => {
        const result = node._variant.validateDisplayValue(value); // console.log(`Validating '${value}' returned ${JSON.stringify(result)}`)


        if (!result.valid) {
          errors.push(result);
        }
      });
    });

    return errors;
  }
  /**
   * Validates one or more DagNode *native value* input sets, usually prior to calling Dag.input().
   * NOTE that the provided values must be of the appropriate type (number, string, etc)
   * and if the node is a Quantity, value must be expressed in the native units-of-measure.
   * @param {*} nodeValuePairs
   * @returns An array with one ValidationResult object {valid, value, message, node}
   * for each *invalid* DagNode value
   */


  validateNativeInputs(nodeValuePairs) {
    const errors = [];

    this._refVals(nodeValuePairs, 'validateNativeInputs').forEach(([node, value]) => {
      const values = Array.isArray(value) ? value : [value]; // ensure values are in an array

      values.forEach(value => {
        const result = node._variant.validateNativeValue(value);

        if (!result.valid) {
          errors.push(result);
        }
      });
    });

    return errors;
  } // DEPRECATED - included only for backwards compatability in test files
  // runConfigs(args) {
  //   this.configure(args)
  //   this.run()
  // }
  // setConfigs(args) { this.configure(args) }
  // runInputs(args) {
  //   this.input(args)
  //   this.run()
  // }
  // setInputs(args) { this.input(args) }
  // runSelected(args) {
  //   this.setSelected(args)
  //   this.run()
  // }
  // setSelected(args) {
  //   const a = []
  //   args.forEach(pair => { a.push(pair[0]) })
  //   this.select(a)
  // }


}

// autogenerated by GenomeCompiler.js on 4/26/2021, 5:40:02 PM
// Gene key abbreviations
const spfbdp = 'surface.primary.fuel.bed.dead.particle.class';
const spfblp = 'surface.primary.fuel.bed.live.particle.class';
const ssfbdp = 'surface.secondary.fuel.bed.dead.particle.class';
const ssfblp = 'surface.secondary.fuel.bed.live.particle.class';
const ccfbdp = 'crown.canopy.fuel.bed.dead.particle.class';
const ccfblp = 'crown.canopy.fuel.bed.live.particle.class';
const spfbd = 'surface.primary.fuel.bed.dead';
const spfbl = 'surface.primary.fuel.bed.live';
const spff = 'surface.primary.fuel.fire';
const ssfbd = 'surface.secondary.fuel.bed.dead';
const ssfbl = 'surface.secondary.fuel.bed.live';
const ssff = 'surface.secondary.fuel.fire';
const ccfbd = 'crown.canopy.fuel.bed.dead';
const ccfbl = 'crown.canopy.fuel.bed.live';
const ccff = 'crown.canopy.fuel.fire';
const spfb = 'surface.primary.fuel.bed';
const ssfb = 'surface.secondary.fuel.bed';
const ccfb = 'crown.canopy.fuel.bed';
const cfa = 'crown.fire.active';
const cff = 'crown.fire.final';
const cfi = 'crown.fire.initiation';
const spf = 'surface.primary.fuel';
const ssf = 'surface.secondary.fuel';
const mbd = 'model.behave.derived';
const mbp = 'model.behave.parms';
const mcd = 'model.chaparral.derived';
const mcp = 'model.chaparral.parms';
const mpd = 'model.palmettoGallberry.derived';
const mpp = 'model.palmettoGallberry.parms';
const mwd = 'model.westernAspen.derived';
const mwp = 'model.westernAspen.parms';
const sfe = 'surface.fire.ellipse';
const swf = 'surface.weighted.fire';
const spotb = 'spotting.burningPile';
const spotc = 'spotting.crownFire';
const spots = 'spotting.surfaceFire';
const spott = 'spotting.torchingTrees';
const savr = 'surfaceAreaToVolumeRatio';
const emc = 'effective.mineralContent';
const tmc = 'total.mineralContent';
const heat = 'heatOfCombustion';
const ef = 'effectiveFuel';
const sa = 'surfaceArea';
const sc = 'sizeClass';
const wf = 'weightingFactor';
const qig = 'heatOfPreignition';
const waf = 'windSpeedAdjustmentFactor';
const load = 'ovendryLoad';
const mois = 'moistureContent';
const fli = 'firelineIntensity';
const fl = 'flameLength';
const lwr = 'lengthToWidthRatio';
const ros = 'spreadRate';
const rxi = 'reactionIntensity';
const sh = 'scorchHeight';
const hpua = 'heatPerUnitArea';
const phiew = 'phiEffectiveWind';
const taur = 'flameResidenceTime';
const ews = 'effectiveWindSpeed';
const dens = 'fiberDensity';
const ehn = 'heatingNumber';
const CompiledGenome = {
  // Array of literals used by Gene updater config conditions and method parameters
  literalArgsArray: [8000, // 0
  'lengthToWidthRatio', // 1
  'flameLength', // 2
  'firelineIntensity', // 3
  'headingFromUpslope', // 4
  'upslope', // 5
  'sourceFromNorth', // 6
  'effectiveWindSpeed', // 7
  1, // 8
  'category', // 9
  'fosberg', // 10
  'liveCategory', // 11
  'degrees', // 12
  'map', // 13
  'humidity', // 14
  'wetBulb', // 15
  0, // 16
  'at10m', // 17
  'at20ft', // 18
  'atMidflame', // 19
  32, // 20
  46, // 21
  30, // 22
  8300, // 23
  640, // 24
  350, // 25
  0.01, // 26
  0.015, // 27
  0.0555, // 28
  0.055, // 29
  0.03, // 30
  'dead', // 31
  109, // 32
  127, // 33
  140, // 34
  5, // 35
  61, // 36
  2000, // 37
  27, // 38
  10500, // 39
  2800, // 40
  'live', // 41
  9550, // 42
  2200, // 43
  0.035, // 44
  0.3, // 45
  0.4, // 46
  0.25, // 47
  'input', // 48
  'applied', // 49
  'catalog', // 50
  'behave', // 51
  'chaparral', // 52
  'palmettoGallberry', // 53
  'westernAspen', // 54
  'none', // 55
  'estimated', // 56
  'chamise', // 57
  'aspenShrub', // 58
  'expected', // 59
  'harmonic', // 60
  'linkedToSurfaceFire', // 61
  'fromHead', // 62
  'fromUpslope', // 63
  'fromNorth', // 64
  'linkedToCrownFire', // 65
  'standAlone', // 66
  0.138, // 67
  0.092, // 68
  0.23, // 69
  1500 // 70
  ],
  // Simple array of updater method <file>.<function> names
  methodRefsArray: ['Dag.module', // 0
  'Dag.config', // 1
  'Dag.input', // 2
  'IgnitionProbability.firebrand', // 3
  'IgnitionProbability.lightningStrike', // 4
  'Canopy.crownFill', // 5
  'Canopy.crownLength', // 6
  'Canopy.crownRatio', // 7
  'Canopy.heatPerUnitArea', // 8
  'Dag.fixed', // 9
  'Canopy.sheltersFuelFromWind', // 10
  'Canopy.fuelLoad', // 11
  'Canopy.windSpeedAdjustmentFactor', // 12
  'Spotting.appliedDownWindCoverHeight', // 13
  'TreeMortality.barkThickness', // 14
  'SurfaceFire.effectiveWindSpeedFromLwr', // 15
  'SurfaceFire.firelineIntensityFromFlameLength', // 16
  'SurfaceFire.flameLength', // 17
  'Compass.diff', // 18
  'Compass.sum', // 19
  'SurfaceFire.lengthToWidthRatio', // 20
  'Calc.divide', // 21
  'Calc.multiply', // 22
  'Compass.slopeRatioMap', // 23
  'Compass.slopeDegreesMap', // 24
  'FuelMoisture.fosbergReference', // 25
  'FuelMoisture.fosbergCorrection', // 26
  'FuelMoisture.fosbergDead1h', // 27
  'FuelMoisture.fosbergDead10h', // 28
  'FuelMoisture.fosbergDead100h', // 29
  'Dag.bind', // 30
  'Compass.opposite', // 31
  'Compass.slopeDegrees', // 32
  'Compass.slopeRatio', // 33
  'TemperatureHumidity.reaDewPoint', // 34
  'TemperatureHumidity.dewPoint', // 35
  'IgnitionProbability.fuelTemperature', // 36
  'TemperatureHumidity.relativeHumidity', // 37
  'TemperatureHumidity.wetBulbDepression', // 38
  'Wind.speedAt10m', // 39
  'Wind.speedAt20ft', // 40
  'Wind.speedAt20ftFromMidflame', // 41
  'Wind.speedAtMidflame', // 42
  'FuelParticle.selectByDomain', // 43
  'FuelParticle.effectiveHeatingNumber', // 44
  'FuelParticle.effectiveFuelLoad', // 45
  'FuelParticle.heatOfPreignition', // 46
  'FuelParticle.netOvendryLoad', // 47
  'FuelParticle.sizeClass', // 48
  'FuelParticle.sizeClassWeightingFactor', // 49
  'FuelParticle.surfaceArea', // 50
  'FuelParticle.surfaceAreaWeightingFactor', // 51
  'FuelParticle.volume', // 52
  'FuelParticle.effectiveFuelWaterLoad', // 53
  'Calc.sum', // 54
  'FuelBed.mineralDamping', // 55
  'FuelBed.moistureDamping', // 56
  'Calc.sumOfProducts', // 57
  'FuelBed.extinctionMoistureContentFactor', // 58
  'FuelBed.reactionIntensityDry', // 59
  'FuelBed.sizeClassWeightingFactorArray', // 60
  'FuelBed.extinctionMoistureContent', // 61
  'FuelBed.heatSink', // 62
  'FuelBed.noWindNoSlopeSpreadRate', // 63
  'FuelBed.openWindSpeedAdjustmentFactor', // 64
  'FuelBed.packingRatio', // 65
  'FuelBed.optimumPackingRatio', // 66
  'FuelBed.propagatingFluxRatio', // 67
  'FuelBed.reactionVelocityExponent', // 68
  'FuelBed.reactionVelocityMaximum', // 69
  'FuelBed.reactionVelocityOptimum', // 70
  'FuelBed.savr15', // 71
  'SurfaceFire.maximumDirectionSlopeSpreadRate', // 72
  'SurfaceFire.maximumDirectionWindSpreadRate', // 73
  'SurfaceFire.maximumDirectionXComponent', // 74
  'SurfaceFire.maximumDirectionYComponent', // 75
  'SurfaceFire.maximumDirectionSpreadRate', // 76
  'Calc.greaterThan', // 77
  'SurfaceFire.effectiveWindSpeedLimit', // 78
  'SurfaceFire.phiEwFromEws', // 79
  'SurfaceFire.maximumSpreadRate', // 80
  'FuelBed.slopeK', // 81
  'SurfaceFire.phiSlope', // 82
  'SurfaceFire.effectiveWindSpeed', // 83
  'SurfaceFire.phiEffectiveWind', // 84
  'SurfaceFire.phiEffectiveWindInferred', // 85
  'SurfaceFire.spreadRateWithCrossSlopeWind', // 86
  'Math.min', // 87
  'SurfaceFire.spreadRateWithRosLimitApplied', // 88
  'FuelBed.windSpeedAdjustmentFactor', // 89
  'FuelBed.windB', // 90
  'FuelBed.windC', // 91
  'FuelBed.windE', // 92
  'FuelBed.windK', // 93
  'FuelBed.windI', // 94
  'SurfaceFire.phiWind', // 95
  'SurfaceFire.firelineIntensity', // 96
  'FuelBed.taur', // 97
  'SurfaceFire.spreadDirectionFromUpslope', // 98
  'FuelBed.heatPerUnitArea', // 99
  'SurfaceFire.scorchHeight', // 100
  'FuelCatalog.domain', // 101
  'BehaveFuel.curedHerbFraction', // 102
  'FuelCatalog.behaveDepth', // 103
  'FuelCatalog.behaveDeadMext', // 104
  'FuelCatalog.behaveTotalHerbLoad', // 105
  'FuelCatalog.behaveDead1Load', // 106
  'FuelCatalog.behaveDead10Load', // 107
  'FuelCatalog.behaveDead100Load', // 108
  'FuelCatalog.behaveLiveStemLoad', // 109
  'FuelCatalog.behaveDead1Savr', // 110
  'FuelCatalog.behaveLiveHerbSavr', // 111
  'FuelCatalog.behaveLiveStemSavr', // 112
  'FuelCatalog.behaveDeadHeat', // 113
  'FuelCatalog.behaveLiveHeat', // 114
  'BehaveFuel.deadHerbLoad', // 115
  'BehaveFuel.liveHerbLoad', // 116
  'FuelCatalog.chaparralFuelType', // 117
  'FuelCatalog.chaparralDeadFraction', // 118
  'FuelCatalog.chaparralDepth', // 119
  'FuelCatalog.chaparralTotalLoad', // 120
  'ChaparralFuel.age', // 121
  'ChaparralFuel.deadFractionAverageMortality', // 122
  'ChaparralFuel.deadFractionSevereMortality', // 123
  'ChaparralFuel.fuelDepth', // 124
  'ChaparralFuel.totalLoad', // 125
  'ChaparralFuel.deadLoad', // 126
  'ChaparralFuel.deadClass1Load', // 127
  'ChaparralFuel.deadClass2Load', // 128
  'ChaparralFuel.deadClass3Load', // 129
  'ChaparralFuel.deadClass4Load', // 130
  'ChaparralFuel.liveLoad', // 131
  'ChaparralFuel.liveClass1Load', // 132
  'ChaparralFuel.liveClass2Load', // 133
  'ChaparralFuel.liveClass3Load', // 134
  'ChaparralFuel.liveClass4Load', // 135
  'ChaparralFuel.liveClass5Load', // 136
  'FuelCatalog.palmettoGallberryAge', // 137
  'FuelCatalog.palmettoGallberryBasalArea', // 138
  'FuelCatalog.palmettoGallberryCover', // 139
  'FuelCatalog.palmettoGallberryHeight', // 140
  'PalmettoGallberryFuel.fuelDepth', // 141
  'PalmettoGallberryFuel.deadFineLoad', // 142
  'PalmettoGallberryFuel.deadSmallLoad', // 143
  'PalmettoGallberryFuel.deadFoliageLoad', // 144
  'PalmettoGallberryFuel.deadLitterLoad', // 145
  'PalmettoGallberryFuel.liveFineLoad', // 146
  'PalmettoGallberryFuel.liveSmallLoad', // 147
  'PalmettoGallberryFuel.liveFoliageLoad', // 148
  'FuelCatalog.westernAspenFuelType', // 149
  'FuelCatalog.westernAspenCuringLevel', // 150
  'WesternAspenFuel.depth', // 151
  'WesternAspenFuel.deadFineLoad', // 152
  'WesternAspenFuel.deadSmallLoad', // 153
  'WesternAspenFuel.deadFineSavr', // 154
  'WesternAspenFuel.liveHerbLoad', // 155
  'WesternAspenFuel.liveStemLoad', // 156
  'WesternAspenFuel.liveStemSavr', // 157
  'Math.max', // 158
  'Calc.or', // 159
  'SurfaceFire.arithmeticMeanSpreadRate', // 160
  'SurfaceFire.expectedValueSpreadRateMOCK', // 161
  'SurfaceFire.harmonicMeanSpreadRate', // 162
  'FireEllipse.eccentricity', // 163
  'FireEllipse.majorSpreadRate', // 164
  'FireEllipse.minorSpreadRate', // 165
  'FireEllipse.fSpreadRate', // 166
  'FireEllipse.gSpreadRate', // 167
  'FireEllipse.hSpreadRate', // 168
  'FireEllipse.area', // 169
  'FireEllipse.spreadDistance', // 170
  'FireEllipse.perimeter', // 171
  'FireEllipse.mapArea', // 172
  'FireEllipse.fliAtAzimuth', // 173
  'FireEllipse.backingSpreadRate', // 174
  'TreeMortality.mortalityRate', // 175
  'FireEllipse.flankingSpreadRate', // 176
  'FireEllipse.psiSpreadRate', // 177
  'FireEllipse.betaSpreadRate', // 178
  'FireEllipse.thetaFromBeta', // 179
  'FireEllipse.psiFromTheta', // 180
  'Spotting.criticalCoverHeight', // 181
  'Spotting.burningPileFirebrandHeight', // 182
  'Spotting.distanceFlatTerrain', // 183
  'Spotting.distanceFlatTerrainWithDrift', // 184
  'Spotting.distanceMountainTerrain', // 185
  'CrownSpotting.zdrop', // 186
  'CrownSpotting.xdrift', // 187
  'CrownSpotting.xdrop', // 188
  'CrownSpotting.xspot', // 189
  'CrownSpotting.firelineIntensityThomas', // 190
  'CrownSpotting.flatDistance', // 191
  'Spotting.surfaceFireFirebrandHeight', // 192
  'Spotting.surfaceFireFirebrandDrift', // 193
  'Spotting.torchingTreesFirebrandHeight', // 194
  'Spotting.torchingTreesSteadyFlameHeight', // 195
  'Spotting.torchingTreesSteadyFlameDuration', // 196
  'TreeMortality.crownLengthScorched', // 197
  'TreeMortality.crownVolumeScorched', // 198
  'CrownFire.area', // 199
  'CrownFire.perimeter', // 200
  'CrownFire.lengthToWidthRatio', // 201
  'CrownFire.rActive', // 202
  'CrownFire.fliActive', // 203
  'CrownFire.flameLengthThomas', // 204
  'CrownFire.hpuaActive', // 205
  'CrownFire.powerOfTheFire', // 206
  'CrownFire.powerOfTheWind', // 207
  'CrownFire.isPlumeDominated', // 208
  'CrownFire.isWindDriven', // 209
  'CrownFire.rSa', // 210
  'CrownFire.crownFractionBurned', // 211
  'CrownFire.rFinal', // 212
  'CrownFire.fliFinal', // 213
  'CrownFire.fliInit', // 214
  'CrownFire.rInit', // 215
  'CrownFire.rPrimeActive', // 216
  'CrownFire.transitionRatio', // 217
  'CrownFire.canTransition', // 218
  'CrownFire.activeRatio', // 219
  'CrownFire.type', // 220
  'CrownFire.isActive', // 221
  'CrownFire.isCrown', // 222
  'CrownFire.isPassive', // 223
  'CrownFire.isConditional', // 224
  'CrownFire.isSurface', // 225
  'CrownFire.oActive', // 226
  'CrownFire.crowningIndex' // 227
  ],
  // Array of Genes where each Gene is:
  // [<geneIdx>, <geneKey>, <variantIdx>, [<valueUpdaters>]], where each valueUpdater is:
  // [[<configIdx>, <configValue>], [methodIdx, ...<methodArgs>]], and where each methodArg is:
  // [<0|1>, <geneIdx|literalIdx>]
  genesArray: [[0, `module.surfaceFire`, 0, [[[], [0]]]], [1, `module.surfaceSpot`, 0, [[[], [0]]]], [2, `module.crownFire`, 0, [[[], [0]]]], [3, `module.crownSpot`, 0, [[[], [0]]]], [4, `module.fireEllipse`, 0, [[[], [0]]]], [5, `module.fireContain`, 0, [[[], [0]]]], [6, `module.${sh}`, 0, [[[], [0]]]], [7, `module.treeMortality`, 0, [[[], [0]]]], [8, `module.spotting`, 0, [[[], [0]]]], [9, `module.ignitionProbability`, 0, [[[], [0]]]], [10, `link.crownFire`, 4, [[[], [1]]]], [11, `link.crownSpot`, 1, [[[], [1]]]], [12, `link.fireContain`, 2, [[[], [1]]]], [13, `link.fireEllipse`, 4, [[[], [1]]]], [14, `link.${sh}`, 4, [[[], [1]]]], [15, `link.surfaceSpot`, 4, [[[], [1]]]], [16, `link.treeMortality`, 3, [[[], [1]]]], [17, `configure.fuel.primary`, 7, [[[], [1]]]], [18, `configure.fuel.secondary`, 8, [[[], [1]]]], [19, `configure.fuel.moisture`, 9, [[[], [1]]]], [20, `configure.fuel.${waf}`, 10, [[[], [1]]]], [21, `configure.fuel.curedHerbFraction`, 6, [[[], [1]]]], [22, `configure.fuel.chaparralTotalLoad`, 5, [[[], [1]]]], [23, `configure.slope.steepness`, 11, [[[], [1]]]], [24, `configure.temperature.humidity`, 12, [[[], [1]]]], [25, `configure.wind.direction`, 13, [[[], [1]]]], [26, `configure.wind.speed`, 14, [[[], [1]]]], [27, `configure.fire.${fli}`, 15, [[[], [1]]]], [28, `configure.fire.${lwr}`, 16, [[[], [1]]]], [29, `configure.fire.${ews}Limit`, 17, [[[], [1]]]], [30, `configure.fire.weightingMethod`, 18, [[[], [1]]]], [31, `configure.fire.vector`, 19, [[[], [1]]]], [32, `docs.run.mainTitle`, 51, [[[], [2]]]], [33, `docs.run.subTitle`, 51, [[[], [2]]]], [34, `docs.run.description`, 51, [[[], [2]]]], [35, `docs.run.userName`, 51, [[[], [2]]]], [36, `ignition.firebrand.probability`, 103, [[[], [3, [0, 125], [0, 111]]]]], [37, `ignition.lightningStrike.charge`, 26, [[[], [2]]]], [38, `ignition.lightningStrike.fuel.depth`, 102, [[[], [2]]]], [39, `ignition.lightningStrike.fuel.type`, 25, [[[], [2]]]], [40, `ignition.lightningStrike.probability`, 103, [[[], [4, [0, 39], [0, 38], [0, 113], [0, 37]]]]], [41, `site.canopy.cover`, 78, [[[], [2]]]], [42, `site.canopy.crown.baseHeight`, 124, [[[], [2]]]], [43, `site.canopy.crown.fill`, 41, [[[], [5, [0, 41], [0, 45]]]]], [44, `site.canopy.crown.length`, 124, [[[], [6, [0, 42], [0, 46]]]]], [45, `site.canopy.crown.ratio`, 44, [[[], [7, [0, 44], [0, 46]]]]], [46, `site.canopy.crown.totalHeight`, 124, [[[], [2]]]], [47, `site.canopy.fire.${hpua}`, 60, [[[], [8, [0, 52], [0, 50]]]]], [48, `site.canopy.fuel.bulkDensity`, 74, [[[], [2]]]], [49, `site.canopy.fuel.foliar.${mois}`, 88, [[[], [2]]]], [50, `site.canopy.fuel.${heat}`, 84, [[[], [9, [1, 0]]]]], [51, `site.canopy.fuel.isSheltered`, 36, [[[], [10, [0, 41], [0, 46], [0, 43]]]]], [52, `site.canopy.fuel.${load}`, 91, [[[], [11, [0, 48], [0, 44]]]]], [53, `site.canopy.fuel.shading`, 78, [[[], [2]]]], [54, `site.canopy.sheltered.${waf}`, 127, [[[], [12, [0, 41], [0, 46], [0, 43]]]]], [55, `site.canopy.downwind.height`, 124, [[[], [2]]]], [56, `site.canopy.downwind.isOpen`, 33, [[[], [2]]]], [57, `site.canopy.downwind.appliedHeight`, 124, [[[], [13, [0, 55], [0, 56]]]]], [58, `site.canopy.tree.barkThickness`, 121, [[[], [14, [0, 60], [0, 59]]]]], [59, `site.canopy.tree.dbh`, 123, [[[], [2]]]], [60, `site.canopy.tree.species.fofem6.code`, 30, [[[], [2]]]], [61, `site.date.dayOfMonth`, 46, [[[], [2]]]], [62, `site.date.dayOfYear`, 47, [[[], [2]]]], [63, `site.date.julian`, 48, [[[], [2]]]], [64, `site.date.month`, 49, [[[], [2]]]], [65, `site.date.year`, 50, [[[], [2]]]], [66, `site.time.hour`, 117, [[[], [2]]]], [67, `site.time.minute`, 118, [[[], [2]]]], [68, `site.time.second`, 119, [[[], [2]]]], [69, `site.time.sunrise`, 120, [[[], [2]]]], [70, `site.time.sunset`, 120, [[[], [2]]]], [71, `site.doc.date`, 51, [[[], [2]]]], [72, `site.doc.id`, 51, [[[], [2]]]], [73, `site.doc.location`, 51, [[[], [2]]]], [74, `site.doc.station`, 51, [[[], [2]]]], [75, `site.doc.time`, 51, [[[], [2]]]], [76, `site.fire.observed.${ews}`, 126, [[[28, 1], [15, [0, 82]]], [[], [2]]]], [77, `site.fire.observed.${fli}`, 57, [[[27, 2], [16, [0, 78]]], [[], [2]]]], [78, `site.fire.observed.${fl}`, 59, [[[27, 3], [17, [0, 77]]], [[], [2]]]], [79, `site.fire.observed.heading.fromUpslope`, 40, [[[25, 4], [2]], [[25, 5], [2]], [[], [18, [0, 80], [0, 119]]]]], [80, `site.fire.observed.heading.fromNorth`, 40, [[[25, 6], [2]], [[], [19, [0, 119], [0, 79]]]]], [81, `site.fire.observed.${hpua}`, 60, [[[], [2]]]], [82, `site.fire.observed.${lwr}`, 61, [[[28, 7], [20, [0, 76]]], [[], [2]]]], [83, `site.fire.observed.${ros}`, 71, [[[], [2]]]], [84, `site.fire.observed.${sh}`, 68, [[[], [2]]]], [85, `site.fire.crown.${fl}`, 59, [[[], [2]]]], [86, `site.fire.time.sinceIgnition`, 56, [[[], [2]]]], [87, `site.fire.vector.fromHead`, 40, [[[], [2]]]], [88, `site.fire.vector.fromNorth`, 40, [[[], [2]]]], [89, `site.fire.vector.fromUpslope`, 40, [[[], [2]]]], [90, `site.location.elevation`, 52, [[[], [2]]]], [91, `site.location.elevation.diff`, 53, [[[], [2]]]], [92, `site.location.gmtDiff`, 101, [[[], [2]]]], [93, `site.location.latitude.degrees`, 104, [[[], [2]]]], [94, `site.location.latitude.ns`, 27, [[[], [2]]]], [95, `site.location.longitude.degrees`, 105, [[[], [2]]]], [96, `site.location.longitude.ew`, 22, [[[], [2]]]], [97, `site.map.scale`, 110, [[[], [2]]]], [98, `site.map.contours`, 107, [[[], [2]]]], [99, `site.map.distance`, 70, [[[], [2]]]], [100, `site.map.factor`, 109, [[[], [21, [1, 8], [0, 97]]]]], [101, `site.map.interval`, 70, [[[], [2]]]], [102, `site.map.reach`, 70, [[[], [22, [0, 97], [0, 99]]]]], [103, `site.map.rise`, 70, [[[], [22, [0, 101], [0, 98]]]]], [104, `site.map.slope.ratio`, 115, [[[], [23, [0, 97], [0, 101], [0, 98], [0, 99]]]]], [105, `site.map.slope.degrees`, 114, [[[], [24, [0, 97], [0, 101], [0, 98], [0, 99]]]]], [106, `site.moisture.dead.fosberg.reference`, 88, [[[], [25, [0, 122], [0, 126]]]]], [107, `site.moisture.dead.fosberg.correction`, 88, [[[], [26, [0, 64], [0, 127], [0, 118], [0, 121], [0, 66], [0, 91]]]]], [108, `site.moisture.dead.fosberg.tl1h`, 88, [[[], [27, [0, 106], [0, 107]]]]], [109, `site.moisture.dead.fosberg.tl10h`, 88, [[[], [28, [0, 108]]]]], [110, `site.moisture.dead.fosberg.tl100h`, 88, [[[], [29, [0, 108]]]]], [111, `site.moisture.dead.tl1h`, 88, [[[19, 9], [30, [0, 114]]], [[19, 10], [30, [0, 108]]], [[], [2]]]], [112, `site.moisture.dead.tl10h`, 88, [[[19, 9], [30, [0, 114]]], [[19, 10], [30, [0, 109]]], [[], [2]]]], [113, `site.moisture.dead.tl100h`, 88, [[[19, 9], [30, [0, 114]]], [[19, 10], [30, [0, 110]]], [[], [2]]]], [114, `site.moisture.dead.category`, 88, [[[], [2]]]], [115, `site.moisture.live.herb`, 88, [[[19, 9], [30, [0, 117]]], [[19, 11], [30, [0, 117]]], [[], [2]]]], [116, `site.moisture.live.stem`, 88, [[[19, 9], [30, [0, 117]]], [[19, 11], [30, [0, 117]]], [[], [2]]]], [117, `site.moisture.live.category`, 88, [[[], [2]]]], [118, `site.slope.direction.aspect`, 40, [[[], [2]]]], [119, `site.slope.direction.upslope`, 40, [[[], [31, [0, 118]]]]], [120, `site.slope.steepness.degrees`, 114, [[[23, 12], [2]], [[23, 13], [30, [0, 105]]], [[], [32, [0, 121]]]]], [121, `site.slope.steepness.ratio`, 115, [[[23, 12], [33, [0, 120]]], [[23, 13], [30, [0, 104]]], [[], [2]]]], [122, `site.temperature.air`, 39, [[[], [2]]]], [123, `site.temperature.dewPoint`, 39, [[[24, 14], [34, [0, 124], [0, 126]]], [[24, 15], [35, [0, 124], [0, 128], [0, 90]]], [[], [2]]]], [124, `site.temperature.dryBulb`, 39, [[[], [30, [0, 122]]]]], [125, `site.temperature.fuel`, 39, [[[], [36, [0, 122], [0, 53]]]]], [126, `site.temperature.relativeHumidity`, 112, [[[24, 14], [2]], [[], [37, [0, 124], [0, 123]]]]], [127, `site.temperature.shading`, 113, [[[], [2]]]], [128, `site.temperature.wetBulb`, 39, [[[], [2]]]], [129, `site.temperature.wetBulbDepression`, 39, [[[], [38, [0, 124], [0, 128]]]]], [130, `site.wind.direction.heading.fromUpslope`, 40, [[[25, 4], [2]], [[25, 6], [18, [0, 133], [0, 119]]], [[25, 5], [9, [1, 16]]], [[], [9, [1, 16]]]]], [131, `site.wind.direction.source.fromUpslope`, 40, [[[], [31, [0, 130]]]]], [132, `site.wind.direction.source.fromNorth`, 40, [[[25, 4], [31, [0, 133]]], [[25, 6], [2]], [[25, 5], [31, [0, 119]]], [[], [31, [0, 119]]]]], [133, `site.wind.direction.heading.fromNorth`, 40, [[[25, 4], [19, [0, 130], [0, 119]]], [[25, 6], [31, [0, 132]]], [[25, 5], [30, [0, 119]]], [[], [30, [0, 119]]]]], [134, `site.wind.speed.at10m`, 126, [[[26, 17], [2]], [[], [39, [0, 135]]]]], [135, `site.wind.speed.at20ft`, 126, [[[26, 18], [2]], [[26, 17], [40, [0, 134]]], [[], [41, [0, 136], [0, 137]]]]], [136, `site.wind.speed.atMidflame`, 126, [[[26, 19], [2]], [[], [42, [0, 135], [0, 137]]]]], [137, `site.${waf}`, 127, [[[], [2]]]], [138, `${spfbdp}1.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [139, `${spfbdp}1.${heat}`, 84, [[[], [43, [0, 409], [0, 423], [1, 0], [1, 23], [1, 0]]]]], [140, `${spfbdp}1.${load}`, 91, [[[], [43, [0, 409], [0, 416], [0, 439], [0, 455], [0, 466]]]]], [141, `${spfbdp}1.${mois}`, 88, [[[], [43, [0, 409], [0, 111], [0, 111], [0, 111], [0, 111]]]]], [142, `${spfbdp}1.${savr}`, 95, [[[], [43, [0, 409], [0, 420], [1, 24], [1, 25], [0, 468]]]]], [143, `${spfbdp}1.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [144, `${spfbdp}1.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [145, `${spfbdp}1.${ef}.${ehn}`, 82, [[[], [44, [0, 142]]]]], [146, `${spfbdp}1.${ef}.${load}`, 91, [[[], [45, [0, 142], [0, 140], [1, 31]]]]], [147, `${spfbdp}1.${qig}`, 85, [[[], [46, [0, 141], [0, 145]]]]], [148, `${spfbdp}1.net.${load}`, 91, [[[], [47, [0, 140], [0, 144]]]]], [149, `${spfbdp}1.${sc}`, 93, [[[], [48, [0, 142]]]]], [150, `${spfbdp}1.${sc}.${wf}`, 125, [[[], [49, [0, 149], [0, 319]]]]], [151, `${spfbdp}1.${sa}`, 94, [[[], [50, [0, 140], [0, 142], [0, 138]]]]], [152, `${spfbdp}1.${sa}.${wf}`, 125, [[[], [51, [0, 151], [0, 303]]]]], [153, `${spfbdp}1.volume`, 100, [[[], [52, [0, 140], [0, 138]]]]], [154, `${spfbdp}1.${ef}.waterLoad`, 91, [[[], [53, [0, 146], [0, 141]]]]], [155, `${spfbdp}2.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [156, `${spfbdp}2.${heat}`, 84, [[[], [43, [0, 409], [0, 423], [1, 0], [1, 23], [1, 0]]]]], [157, `${spfbdp}2.${load}`, 91, [[[], [43, [0, 409], [0, 417], [0, 440], [0, 456], [0, 467]]]]], [158, `${spfbdp}2.${mois}`, 88, [[[], [43, [0, 409], [0, 112], [0, 112], [0, 112], [0, 112]]]]], [159, `${spfbdp}2.${savr}`, 95, [[[], [43, [0, 409], [1, 32], [1, 33], [1, 34], [1, 32]]]]], [160, `${spfbdp}2.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [161, `${spfbdp}2.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [162, `${spfbdp}2.${ef}.${ehn}`, 82, [[[], [44, [0, 159]]]]], [163, `${spfbdp}2.${ef}.${load}`, 91, [[[], [45, [0, 159], [0, 157], [1, 31]]]]], [164, `${spfbdp}2.${qig}`, 85, [[[], [46, [0, 158], [0, 162]]]]], [165, `${spfbdp}2.net.${load}`, 91, [[[], [47, [0, 157], [0, 161]]]]], [166, `${spfbdp}2.${sc}`, 93, [[[], [48, [0, 159]]]]], [167, `${spfbdp}2.${sc}.${wf}`, 125, [[[], [49, [0, 166], [0, 319]]]]], [168, `${spfbdp}2.${sa}`, 94, [[[], [50, [0, 157], [0, 159], [0, 155]]]]], [169, `${spfbdp}2.${sa}.${wf}`, 125, [[[], [51, [0, 168], [0, 303]]]]], [170, `${spfbdp}2.volume`, 100, [[[], [52, [0, 157], [0, 155]]]]], [171, `${spfbdp}2.${ef}.waterLoad`, 91, [[[], [53, [0, 163], [0, 158]]]]], [172, `${spfbdp}3.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [173, `${spfbdp}3.${heat}`, 84, [[[], [43, [0, 409], [0, 423], [1, 0], [1, 23], [1, 0]]]]], [174, `${spfbdp}3.${load}`, 91, [[[], [43, [0, 409], [0, 418], [0, 441], [0, 457], [1, 16]]]]], [175, `${spfbdp}3.${mois}`, 88, [[[], [43, [0, 409], [0, 113], [0, 112], [0, 111], [1, 35]]]]], [176, `${spfbdp}3.${savr}`, 95, [[[], [43, [0, 409], [1, 22], [1, 36], [1, 37], [1, 8]]]]], [177, `${spfbdp}3.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [178, `${spfbdp}3.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [179, `${spfbdp}3.${ef}.${ehn}`, 82, [[[], [44, [0, 176]]]]], [180, `${spfbdp}3.${ef}.${load}`, 91, [[[], [45, [0, 176], [0, 174], [1, 31]]]]], [181, `${spfbdp}3.${qig}`, 85, [[[], [46, [0, 175], [0, 179]]]]], [182, `${spfbdp}3.net.${load}`, 91, [[[], [47, [0, 174], [0, 178]]]]], [183, `${spfbdp}3.${sc}`, 93, [[[], [48, [0, 176]]]]], [184, `${spfbdp}3.${sc}.${wf}`, 125, [[[], [49, [0, 183], [0, 319]]]]], [185, `${spfbdp}3.${sa}`, 94, [[[], [50, [0, 174], [0, 176], [0, 172]]]]], [186, `${spfbdp}3.${sa}.${wf}`, 125, [[[], [51, [0, 185], [0, 303]]]]], [187, `${spfbdp}3.volume`, 100, [[[], [52, [0, 174], [0, 172]]]]], [188, `${spfbdp}3.${ef}.waterLoad`, 91, [[[], [53, [0, 180], [0, 175]]]]], [189, `${spfbdp}4.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [190, `${spfbdp}4.${heat}`, 84, [[[], [43, [0, 409], [0, 423], [1, 0], [1, 23], [1, 0]]]]], [191, `${spfbdp}4.${load}`, 91, [[[], [43, [0, 409], [0, 425], [0, 442], [0, 458], [1, 16]]]]], [192, `${spfbdp}4.${mois}`, 88, [[[], [43, [0, 409], [0, 111], [0, 113], [0, 113], [1, 35]]]]], [193, `${spfbdp}4.${savr}`, 95, [[[], [43, [0, 409], [0, 421], [1, 38], [1, 37], [1, 8]]]]], [194, `${spfbdp}4.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [195, `${spfbdp}4.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [196, `${spfbdp}4.${ef}.${ehn}`, 82, [[[], [44, [0, 193]]]]], [197, `${spfbdp}4.${ef}.${load}`, 91, [[[], [45, [0, 193], [0, 191], [1, 31]]]]], [198, `${spfbdp}4.${qig}`, 85, [[[], [46, [0, 192], [0, 196]]]]], [199, `${spfbdp}4.net.${load}`, 91, [[[], [47, [0, 191], [0, 195]]]]], [200, `${spfbdp}4.${sc}`, 93, [[[], [48, [0, 193]]]]], [201, `${spfbdp}4.${sc}.${wf}`, 125, [[[], [49, [0, 200], [0, 319]]]]], [202, `${spfbdp}4.${sa}`, 94, [[[], [50, [0, 191], [0, 193], [0, 189]]]]], [203, `${spfbdp}4.${sa}.${wf}`, 125, [[[], [51, [0, 202], [0, 303]]]]], [204, `${spfbdp}4.volume`, 100, [[[], [52, [0, 191], [0, 189]]]]], [205, `${spfbdp}4.${ef}.waterLoad`, 91, [[[], [53, [0, 197], [0, 192]]]]], [206, `${spfbdp}5.${dens}`, 92, [[[], [9, [1, 20]]]]], [207, `${spfbdp}5.${heat}`, 84, [[[], [9, [1, 0]]]]], [208, `${spfbdp}5.${load}`, 91, [[[], [9, [1, 16]]]]], [209, `${spfbdp}5.${mois}`, 88, [[[], [9, [1, 35]]]]], [210, `${spfbdp}5.${savr}`, 95, [[[], [9, [1, 8]]]]], [211, `${spfbdp}5.${emc}`, 83, [[[], [9, [1, 26]]]]], [212, `${spfbdp}5.${tmc}`, 99, [[[], [9, [1, 28]]]]], [213, `${spfbdp}5.${ef}.${ehn}`, 82, [[[], [44, [0, 210]]]]], [214, `${spfbdp}5.${ef}.${load}`, 91, [[[], [45, [0, 210], [0, 208], [1, 31]]]]], [215, `${spfbdp}5.${qig}`, 85, [[[], [46, [0, 209], [0, 213]]]]], [216, `${spfbdp}5.net.${load}`, 91, [[[], [47, [0, 208], [0, 212]]]]], [217, `${spfbdp}5.${sc}`, 93, [[[], [48, [0, 210]]]]], [218, `${spfbdp}5.${sc}.${wf}`, 125, [[[], [49, [0, 217], [0, 319]]]]], [219, `${spfbdp}5.${sa}`, 94, [[[], [50, [0, 208], [0, 210], [0, 206]]]]], [220, `${spfbdp}5.${sa}.${wf}`, 125, [[[], [51, [0, 219], [0, 303]]]]], [221, `${spfbdp}5.volume`, 100, [[[], [52, [0, 208], [0, 206]]]]], [222, `${spfbdp}5.${ef}.waterLoad`, 91, [[[], [53, [0, 214], [0, 209]]]]], [223, `${spfblp}1.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [224, `${spfblp}1.${heat}`, 84, [[[], [43, [0, 409], [0, 424], [1, 39], [1, 23], [1, 0]]]]], [225, `${spfblp}1.${load}`, 91, [[[], [43, [0, 409], [0, 426], [0, 444], [0, 459], [0, 469]]]]], [226, `${spfblp}1.${mois}`, 88, [[[], [43, [0, 409], [0, 115], [0, 116], [0, 116], [0, 115]]]]], [227, `${spfblp}1.${savr}`, 95, [[[], [43, [0, 409], [0, 421], [1, 24], [1, 25], [1, 40]]]]], [228, `${spfblp}1.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [229, `${spfblp}1.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [230, `${spfblp}1.${ef}.${ehn}`, 82, [[[], [44, [0, 227]]]]], [231, `${spfblp}1.${ef}.${load}`, 91, [[[], [45, [0, 227], [0, 225], [1, 41]]]]], [232, `${spfblp}1.${qig}`, 85, [[[], [46, [0, 226], [0, 230]]]]], [233, `${spfblp}1.net.${load}`, 91, [[[], [47, [0, 225], [0, 229]]]]], [234, `${spfblp}1.${sc}`, 93, [[[], [48, [0, 227]]]]], [235, `${spfblp}1.${sc}.${wf}`, 125, [[[], [49, [0, 234], [0, 339]]]]], [236, `${spfblp}1.${sa}`, 94, [[[], [50, [0, 225], [0, 227], [0, 223]]]]], [237, `${spfblp}1.${sa}.${wf}`, 125, [[[], [51, [0, 236], [0, 323]]]]], [238, `${spfblp}1.volume`, 100, [[[], [52, [0, 225], [0, 223]]]]], [239, `${spfblp}2.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [240, `${spfblp}2.${heat}`, 84, [[[], [43, [0, 409], [0, 424], [1, 42], [1, 23], [1, 0]]]]], [241, `${spfblp}2.${load}`, 91, [[[], [43, [0, 409], [0, 419], [0, 445], [0, 460], [0, 470]]]]], [242, `${spfblp}2.${mois}`, 88, [[[], [43, [0, 409], [0, 116], [0, 116], [0, 116], [0, 116]]]]], [243, `${spfblp}2.${savr}`, 95, [[[], [43, [0, 409], [0, 422], [1, 33], [1, 34], [0, 471]]]]], [244, `${spfblp}2.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [245, `${spfblp}2.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [246, `${spfblp}2.${ef}.${ehn}`, 82, [[[], [44, [0, 243]]]]], [247, `${spfblp}2.${ef}.${load}`, 91, [[[], [45, [0, 243], [0, 241], [1, 41]]]]], [248, `${spfblp}2.${qig}`, 85, [[[], [46, [0, 242], [0, 246]]]]], [249, `${spfblp}2.net.${load}`, 91, [[[], [47, [0, 241], [0, 245]]]]], [250, `${spfblp}2.${sc}`, 93, [[[], [48, [0, 243]]]]], [251, `${spfblp}2.${sc}.${wf}`, 125, [[[], [49, [0, 250], [0, 339]]]]], [252, `${spfblp}2.${sa}`, 94, [[[], [50, [0, 241], [0, 243], [0, 239]]]]], [253, `${spfblp}2.${sa}.${wf}`, 125, [[[], [51, [0, 252], [0, 323]]]]], [254, `${spfblp}2.volume`, 100, [[[], [52, [0, 241], [0, 239]]]]], [255, `${spfblp}3.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [256, `${spfblp}3.${heat}`, 84, [[[], [43, [0, 409], [0, 424], [1, 42], [1, 23], [1, 0]]]]], [257, `${spfblp}3.${load}`, 91, [[[], [43, [0, 409], [1, 16], [0, 446], [0, 461], [1, 16]]]]], [258, `${spfblp}3.${mois}`, 88, [[[], [43, [0, 409], [1, 35], [0, 116], [0, 116], [1, 35]]]]], [259, `${spfblp}3.${savr}`, 95, [[[], [43, [0, 409], [1, 8], [1, 36], [1, 37], [1, 8]]]]], [260, `${spfblp}3.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [261, `${spfblp}3.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [262, `${spfblp}3.${ef}.${ehn}`, 82, [[[], [44, [0, 259]]]]], [263, `${spfblp}3.${ef}.${load}`, 91, [[[], [45, [0, 259], [0, 257], [1, 41]]]]], [264, `${spfblp}3.${qig}`, 85, [[[], [46, [0, 258], [0, 262]]]]], [265, `${spfblp}3.net.${load}`, 91, [[[], [47, [0, 257], [0, 261]]]]], [266, `${spfblp}3.${sc}`, 93, [[[], [48, [0, 259]]]]], [267, `${spfblp}3.${sc}.${wf}`, 125, [[[], [49, [0, 266], [0, 339]]]]], [268, `${spfblp}3.${sa}`, 94, [[[], [50, [0, 257], [0, 259], [0, 255]]]]], [269, `${spfblp}3.${sa}.${wf}`, 125, [[[], [51, [0, 268], [0, 323]]]]], [270, `${spfblp}3.volume`, 100, [[[], [52, [0, 257], [0, 255]]]]], [271, `${spfblp}4.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [272, `${spfblp}4.${heat}`, 84, [[[], [43, [0, 409], [0, 424], [1, 42], [1, 23], [1, 0]]]]], [273, `${spfblp}4.${load}`, 91, [[[], [43, [0, 409], [1, 16], [0, 447], [1, 16], [1, 16]]]]], [274, `${spfblp}4.${mois}`, 88, [[[], [43, [0, 409], [1, 35], [0, 116], [1, 35], [1, 35]]]]], [275, `${spfblp}4.${savr}`, 95, [[[], [43, [0, 409], [1, 8], [1, 38], [1, 8], [1, 8]]]]], [276, `${spfblp}4.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [277, `${spfblp}4.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [278, `${spfblp}4.${ef}.${ehn}`, 82, [[[], [44, [0, 275]]]]], [279, `${spfblp}4.${ef}.${load}`, 91, [[[], [45, [0, 275], [0, 273], [1, 41]]]]], [280, `${spfblp}4.${qig}`, 85, [[[], [46, [0, 274], [0, 278]]]]], [281, `${spfblp}4.net.${load}`, 91, [[[], [47, [0, 273], [0, 277]]]]], [282, `${spfblp}4.${sc}`, 93, [[[], [48, [0, 275]]]]], [283, `${spfblp}4.${sc}.${wf}`, 125, [[[], [49, [0, 282], [0, 339]]]]], [284, `${spfblp}4.${sa}`, 94, [[[], [50, [0, 273], [0, 275], [0, 271]]]]], [285, `${spfblp}4.${sa}.${wf}`, 125, [[[], [51, [0, 284], [0, 323]]]]], [286, `${spfblp}4.volume`, 100, [[[], [52, [0, 273], [0, 271]]]]], [287, `${spfblp}5.${dens}`, 92, [[[], [43, [0, 409], [1, 20], [1, 20], [1, 21], [1, 20]]]]], [288, `${spfblp}5.${heat}`, 84, [[[], [43, [0, 409], [0, 424], [1, 39], [1, 23], [1, 0]]]]], [289, `${spfblp}5.${load}`, 91, [[[], [43, [0, 409], [1, 16], [0, 448], [1, 16], [1, 16]]]]], [290, `${spfblp}5.${mois}`, 88, [[[], [43, [0, 409], [1, 35], [0, 115], [1, 35], [1, 35]]]]], [291, `${spfblp}5.${savr}`, 95, [[[], [43, [0, 409], [1, 8], [1, 43], [1, 8], [1, 8]]]]], [292, `${spfblp}5.${emc}`, 83, [[[], [43, [0, 409], [1, 26], [1, 44], [1, 27], [1, 26]]]]], [293, `${spfblp}5.${tmc}`, 99, [[[], [43, [0, 409], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [294, `${spfblp}5.${ef}.${ehn}`, 82, [[[], [44, [0, 291]]]]], [295, `${spfblp}5.${ef}.${load}`, 91, [[[], [45, [0, 291], [0, 289], [1, 41]]]]], [296, `${spfblp}5.${qig}`, 85, [[[], [46, [0, 290], [0, 294]]]]], [297, `${spfblp}5.net.${load}`, 91, [[[], [47, [0, 289], [0, 293]]]]], [298, `${spfblp}5.${sc}`, 93, [[[], [48, [0, 291]]]]], [299, `${spfblp}5.${sc}.${wf}`, 125, [[[], [49, [0, 298], [0, 339]]]]], [300, `${spfblp}5.${sa}`, 94, [[[], [50, [0, 289], [0, 291], [0, 287]]]]], [301, `${spfblp}5.${sa}.${wf}`, 125, [[[], [51, [0, 300], [0, 323]]]]], [302, `${spfblp}5.volume`, 100, [[[], [52, [0, 289], [0, 287]]]]], [303, `${spfbd}.${sa}`, 94, [[[], [54, [0, 151], [0, 168], [0, 185], [0, 202], [0, 219]]]]], [304, `${spfbd}.${sa}.${wf}`, 125, [[[], [21, [0, 303], [0, 358]]]]], [305, `${spfbd}.mineralDamping`, 55, [[[], [55, [0, 318]]]]], [306, `${spfbd}.moistureDamping`, 55, [[[], [56, [0, 312], [0, 310]]]]], [307, `${spfbd}.${heat}`, 84, [[[], [57, [0, 152], [0, 169], [0, 186], [0, 203], [0, 220], [0, 139], [0, 156], [0, 173], [0, 190], [0, 207]]]]], [308, `${spfbd}.${load}`, 91, [[[], [54, [0, 140], [0, 157], [0, 174], [0, 191], [0, 208]]]]], [309, `${spfbd}.${ef}.${load}`, 91, [[[], [54, [0, 146], [0, 163], [0, 180], [0, 197], [0, 214]]]]], [310, `${spfbd}.extinction.${mois}`, 88, [[[], [43, [0, 409], [0, 414], [1, 45], [1, 46], [1, 47]]]]], [311, `${spfbd}.extinction.${mois}Factor`, 37, [[[], [58, [0, 309], [0, 329]]]]], [312, `${spfbd}.${mois}`, 88, [[[], [57, [0, 152], [0, 169], [0, 186], [0, 203], [0, 220], [0, 141], [0, 158], [0, 175], [0, 192], [0, 209]]]]], [313, `${spfbd}.volume`, 75, [[[], [54, [0, 153], [0, 170], [0, 187], [0, 204], [0, 221]]]]], [314, `${spfbd}.${qig}`, 85, [[[], [57, [0, 152], [0, 169], [0, 186], [0, 203], [0, 220], [0, 147], [0, 164], [0, 181], [0, 198], [0, 215]]]]], [315, `${spfbd}.${rxi}`, 65, [[[], [22, [0, 316], [0, 306]]]]], [316, `${spfbd}.${rxi}Dry`, 65, [[[], [59, [0, 355], [0, 320], [0, 307], [0, 305]]]]], [317, `${spfbd}.${savr}`, 95, [[[], [57, [0, 152], [0, 169], [0, 186], [0, 203], [0, 220], [0, 142], [0, 159], [0, 176], [0, 193], [0, 210]]]]], [318, `${spfbd}.${emc}`, 83, [[[], [57, [0, 152], [0, 169], [0, 186], [0, 203], [0, 220], [0, 143], [0, 160], [0, 177], [0, 194], [0, 211]]]]], [319, `${spfbd}.${sc}.${wf}`, 125, [[[], [60, [0, 151], [0, 149], [0, 168], [0, 166], [0, 185], [0, 183], [0, 202], [0, 200], [0, 219], [0, 217]]]]], [320, `${spfbd}.net.${load}`, 91, [[[], [57, [0, 150], [0, 167], [0, 184], [0, 201], [0, 218], [0, 148], [0, 165], [0, 182], [0, 199], [0, 216]]]]], [321, `${spfbd}.${ef}.waterLoad`, 91, [[[], [54, [0, 154], [0, 171], [0, 188], [0, 205], [0, 222]]]]], [322, `${spfbd}.${ef}.${mois}`, 88, [[[], [21, [0, 321], [0, 309]]]]], [323, `${spfbl}.${sa}`, 94, [[[], [54, [0, 236], [0, 252], [0, 268], [0, 284], [0, 300]]]]], [324, `${spfbl}.${sa}.${wf}`, 125, [[[], [21, [0, 323], [0, 358]]]]], [325, `${spfbl}.mineralDamping`, 55, [[[], [55, [0, 338]]]]], [326, `${spfbl}.moistureDamping`, 55, [[[], [56, [0, 332], [0, 330]]]]], [327, `${spfbl}.${heat}`, 84, [[[], [57, [0, 237], [0, 253], [0, 269], [0, 285], [0, 301], [0, 224], [0, 240], [0, 256], [0, 272], [0, 288]]]]], [328, `${spfbl}.${load}`, 91, [[[], [54, [0, 225], [0, 241], [0, 257], [0, 273], [0, 289]]]]], [329, `${spfbl}.${ef}.${load}`, 91, [[[], [54, [0, 231], [0, 247], [0, 263], [0, 279], [0, 295]]]]], [330, `${spfbl}.extinction.${mois}`, 88, [[[], [61, [0, 331], [0, 322], [0, 310]]]]], [331, `${spfbl}.extinction.${mois}Factor`, 37, [[[], [58, [0, 309], [0, 329]]]]], [332, `${spfbl}.${mois}`, 88, [[[], [57, [0, 237], [0, 253], [0, 269], [0, 285], [0, 301], [0, 226], [0, 242], [0, 258], [0, 274], [0, 290]]]]], [333, `${spfbl}.volume`, 75, [[[], [54, [0, 238], [0, 254], [0, 270], [0, 286], [0, 302]]]]], [334, `${spfbl}.${qig}`, 85, [[[], [57, [0, 237], [0, 253], [0, 269], [0, 285], [0, 301], [0, 232], [0, 248], [0, 264], [0, 280], [0, 296]]]]], [335, `${spfbl}.${rxi}`, 65, [[[], [22, [0, 336], [0, 326]]]]], [336, `${spfbl}.${rxi}Dry`, 65, [[[], [59, [0, 355], [0, 340], [0, 327], [0, 325]]]]], [337, `${spfbl}.${savr}`, 95, [[[], [57, [0, 237], [0, 253], [0, 269], [0, 285], [0, 301], [0, 227], [0, 243], [0, 259], [0, 275], [0, 291]]]]], [338, `${spfbl}.${emc}`, 83, [[[], [57, [0, 237], [0, 253], [0, 269], [0, 285], [0, 301], [0, 228], [0, 244], [0, 260], [0, 276], [0, 292]]]]], [339, `${spfbl}.${sc}.${wf}`, 125, [[[], [60, [0, 236], [0, 234], [0, 252], [0, 250], [0, 268], [0, 266], [0, 284], [0, 282], [0, 300], [0, 298]]]]], [340, `${spfbl}.net.${load}`, 91, [[[], [57, [0, 235], [0, 251], [0, 267], [0, 283], [0, 299], [0, 233], [0, 249], [0, 265], [0, 281], [0, 297]]]]], [341, `${spfb}.depth`, 75, [[[], [43, [0, 409], [0, 413], [0, 430], [0, 454], [0, 465]]]]], [342, `${spfb}.bulkDensity`, 74, [[[], [21, [0, 346], [0, 341]]]]], [343, `${spfb}.${qig}`, 76, [[[], [57, [0, 304], [0, 324], [0, 314], [0, 334]]]]], [344, `${spfb}.heatSink`, 86, [[[], [62, [0, 343], [0, 342]]]]], [345, `${spfb}.noWindNoSlope.${ros}`, 71, [[[], [63, [0, 352], [0, 351], [0, 344]]]]], [346, `${spfb}.${load}`, 91, [[[], [54, [0, 308], [0, 328]]]]], [347, `${spfb}.open.${waf}`, 127, [[[], [64, [0, 341]]]]], [348, `${spfb}.packingRatio`, 77, [[[], [65, [0, 313], [0, 333], [0, 341]]]]], [349, `${spfb}.packingRatio.optimum`, 77, [[[], [66, [0, 356]]]]], [350, `${spfb}.packingRatio.ratio`, 77, [[[], [21, [0, 348], [0, 349]]]]], [351, `${spfb}.propagatingFluxRatio`, 64, [[[], [67, [0, 356], [0, 348]]]]], [352, `${spfb}.${rxi}`, 65, [[[], [54, [0, 315], [0, 335]]]]], [353, `${spfb}.reactionVelocityExponent`, 37, [[[], [68, [0, 356]]]]], [354, `${spfb}.reactionVelocityMaximum`, 66, [[[], [69, [0, 357]]]]], [355, `${spfb}.reactionVelocityOptimum`, 66, [[[], [70, [0, 350], [0, 354], [0, 353]]]]], [356, `${spfb}.${savr}`, 95, [[[], [57, [0, 304], [0, 324], [0, 317], [0, 337]]]]], [357, `${spfb}.savr15`, 37, [[[], [71, [0, 356]]]]], [358, `${spfb}.${sa}`, 94, [[[], [54, [0, 303], [0, 323]]]]], [359, `${spff}.maximumDirection.slope.${ros}`, 71, [[[], [72, [0, 408], [0, 372]]]]], [360, `${spff}.maximumDirection.wind.${ros}`, 71, [[[], [73, [0, 408], [0, 395]]]]], [361, `${spff}.wind.heading.fromUpslope`, 40, [[[], [30, [0, 130]]]]], [362, `${spff}.maximumDirection.xComponent`, 37, [[[], [74, [0, 360], [0, 359], [0, 361]]]]], [363, `${spff}.maximumDirection.yComponent`, 37, [[[], [75, [0, 360], [0, 361]]]]], [364, `${spff}.maximumDirection.${ros}`, 71, [[[], [76, [0, 362], [0, 363]]]]], [365, `${spff}.limit.${ews}.exceeded`, 34, [[[], [77, [0, 376], [0, 367]]]]], [366, `${spff}.limit.${ros}.exceeded`, 35, [[[], [77, [0, 378], [0, 384]]]]], [367, `${spff}.limit.${ews}`, 126, [[[], [78, [0, 405]]]]], [368, `${spff}.limit.windSlopeSpreadRateCoefficient`, 37, [[[], [79, [0, 367], [0, 390], [0, 393]]]]], [369, `${spff}.limit.${ros}`, 71, [[[], [80, [0, 408], [0, 368]]]]], [370, `${spff}.slope.ratio`, 115, [[[], [30, [0, 121]]]]], [371, `${spff}.slope.k`, 37, [[[], [81, [0, 348]]]]], [372, `${spff}.slope.phi`, 37, [[[], [82, [0, 370], [0, 371]]]]], [373, `${spff}.spread.step1.${ews}`, 126, [[[], [83, [0, 374], [0, 390], [0, 394]]]]], [374, `${spff}.spread.step1.${phiew}`, 37, [[[], [84, [0, 395], [0, 372]]]]], [375, `${spff}.spread.step1.${ros}`, 71, [[[], [80, [0, 408], [0, 374]]]]], [376, `${spff}.spread.step2.${ews}`, 126, [[[], [83, [0, 377], [0, 390], [0, 394]]]]], [377, `${spff}.spread.step2.${phiew}`, 37, [[[], [85, [0, 408], [0, 378]]]]], [378, `${spff}.spread.step2.${ros}`, 71, [[[], [86, [0, 408], [0, 364]]]]], [379, `${spff}.spread.step3a.${ews}`, 126, [[[], [87, [0, 376], [0, 367]]]]], [380, `${spff}.spread.step3a.${phiew}`, 37, [[[], [87, [0, 377], [0, 368]]]]], [381, `${spff}.spread.step3a.${ros}`, 71, [[[], [87, [0, 378], [0, 369]]]]], [382, `${spff}.spread.step3b.${ews}`, 126, [[[], [83, [0, 383], [0, 390], [0, 394]]]]], [383, `${spff}.spread.step3b.${phiew}`, 37, [[[], [85, [0, 408], [0, 384]]]]], [384, `${spff}.spread.step3b.${ros}`, 71, [[[], [88, [0, 378], [0, 376]]]]], [385, `${spff}.spread.step4.${ews}`, 126, [[[], [83, [0, 386], [0, 390], [0, 394]]]]], [386, `${spff}.spread.step4.${phiew}`, 37, [[[], [85, [0, 408], [0, 387]]]]], [387, `${spff}.spread.step4.${ros}`, 71, [[[], [88, [0, 381], [0, 379]]]]], [388, `${spff}.${waf}`, 127, [[[20, 48], [30, [0, 137]]], [[], [89, [0, 51], [0, 54], [0, 347]]]]], [389, `${spff}.wind.speed.atMidflame`, 126, [[[26, 19], [30, [0, 136]]], [[], [42, [0, 135], [0, 388]]]]], [390, `${spff}.wind.factor.b`, 37, [[[], [90, [0, 356]]]]], [391, `${spff}.wind.factor.c`, 37, [[[], [91, [0, 356]]]]], [392, `${spff}.wind.factor.e`, 37, [[[], [92, [0, 356]]]]], [393, `${spff}.wind.factor.k`, 37, [[[], [93, [0, 350], [0, 392], [0, 391]]]]], [394, `${spff}.wind.factor.i`, 37, [[[], [94, [0, 350], [0, 392], [0, 391]]]]], [395, `${spff}.wind.phi`, 37, [[[], [95, [0, 389], [0, 390], [0, 393]]]]], [396, `${spff}.${ews}`, 126, [[[29, 49], [30, [0, 385]]], [[], [30, [0, 382]]]]], [397, `${spff}.${fli}`, 57, [[[], [96, [0, 407], [0, 405], [0, 399]]]]], [398, `${spff}.${fl}`, 59, [[[], [17, [0, 397]]]]], [399, `${spff}.${taur}`, 67, [[[], [97, [0, 356]]]]], [400, `${spff}.heading.fromUpslope`, 40, [[[], [98, [0, 362], [0, 363], [0, 364]]]]], [401, `${spff}.heading.fromNorth`, 40, [[[], [19, [0, 119], [0, 400]]]]], [402, `${spff}.${hpua}`, 60, [[[], [99, [0, 405], [0, 399]]]]], [403, `${spff}.${lwr}`, 61, [[[], [20, [0, 396]]]]], [404, `${spff}.${phiew}`, 37, [[[29, 49], [30, [0, 386]]], [[], [30, [0, 383]]]]], [405, `${spff}.${rxi}`, 65, [[[], [30, [0, 352]]]]], [406, `${spff}.${sh}`, 68, [[[], [100, [0, 397], [0, 389], [0, 122]]]]], [407, `${spff}.${ros}`, 71, [[[29, 49], [30, [0, 387]]], [[], [30, [0, 384]]]]], [408, `${spff}.noWindNoSlope.${ros}`, 71, [[[], [30, [0, 345]]]]], [409, `${spf}.model.domain`, 23, [[[17, 50], [101, [0, 410]]], [[17, 51], [9, [1, 51]]], [[17, 52], [9, [1, 52]]], [[17, 53], [9, [1, 53]]], [[17, 54], [9, [1, 54]]], [[], [9, [1, 55]]]]], [410, `${spf}.model.catalogKey`, 24, [[[], [2]]]], [411, `${spf}.model.behave.domain`, 23, [[[], [9, [1, 51]]]]], [412, `${spf}.${mbp}.cured.herb.fraction`, 81, [[[21, 56], [102, [0, 115]]], [[], [2]]]], [413, `${spf}.${mbp}.depth`, 75, [[[17, 50], [103, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 26]]]]], [414, `${spf}.${mbp}.dead.extinction.${mois}`, 88, [[[17, 50], [104, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 47]]]]], [415, `${spf}.${mbp}.total.herb.${load}`, 91, [[[17, 50], [105, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 16]]]]], [416, `${spf}.${mbp}.dead.tl1h.${load}`, 91, [[[17, 50], [106, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 16]]]]], [417, `${spf}.${mbp}.dead.tl10h.${load}`, 91, [[[17, 50], [107, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 16]]]]], [418, `${spf}.${mbp}.dead.tl100h.${load}`, 91, [[[17, 50], [108, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 16]]]]], [419, `${spf}.${mbp}.live.stem.${load}`, 91, [[[17, 50], [109, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 16]]]]], [420, `${spf}.${mbp}.dead.tl1h.${savr}`, 95, [[[17, 50], [110, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 16]]]]], [421, `${spf}.${mbp}.live.herb.${savr}`, 95, [[[17, 50], [111, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 8]]]]], [422, `${spf}.${mbp}.live.stem.${savr}`, 95, [[[17, 50], [112, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 8]]]]], [423, `${spf}.${mbp}.dead.${heat}`, 84, [[[17, 50], [113, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 0]]]]], [424, `${spf}.${mbp}.live.${heat}`, 84, [[[17, 50], [114, [0, 410]]], [[17, 51], [2]], [[], [9, [1, 0]]]]], [425, `${spf}.${mbd}.dead.herb.${load}`, 91, [[[], [115, [0, 415], [0, 412]]]]], [426, `${spf}.${mbd}.live.herb.${load}`, 91, [[[], [116, [0, 415], [0, 412]]]]], [427, `${spf}.model.chaparral.domain`, 23, [[[], [9, [1, 52]]]]], [428, `${spf}.${mcp}.chaparralType`, 20, [[[17, 50], [117, [0, 410]]], [[17, 52], [2]], [[], [9, [1, 57]]]]], [429, `${spf}.${mcp}.observed.deadFuelFraction`, 81, [[[17, 50], [118, [0, 410]]], [[17, 52], [2]], [[], [9, [1, 16]]]]], [430, `${spf}.${mcp}.observed.depth`, 75, [[[17, 50], [119, [0, 410]]], [[17, 52], [2]], [[], [9, [1, 26]]]]], [431, `${spf}.${mcp}.observed.totalLoad`, 91, [[[17, 50], [120, [0, 410]]], [[17, 52], [2]], [[], [9, [1, 16]]]]], [432, `${spf}.${mcp}.applied.totalLoad`, 91, [[[22, 56], [30, [0, 437]]], [[], [30, [0, 431]]]]], [433, `${spf}.${mcd}.age`, 72, [[[], [121, [0, 430], [0, 428]]]]], [434, `${spf}.${mcd}.averageMortality`, 111, [[[], [122, [0, 433]]]]], [435, `${spf}.${mcd}.severeMortality`, 111, [[[], [123, [0, 433]]]]], [436, `${spf}.${mcd}.depth`, 75, [[[], [124, [0, 433], [0, 428]]]]], [437, `${spf}.${mcd}.totalLoad`, 91, [[[], [125, [0, 433], [0, 428]]]]], [438, `${spf}.${mcd}.deadLoad`, 91, [[[], [126, [0, 432], [0, 429]]]]], [439, `${spf}.${mcd}.deadFineLoad`, 91, [[[], [127, [0, 432], [0, 429]]]]], [440, `${spf}.${mcd}.deadSmallLoad`, 91, [[[], [128, [0, 432], [0, 429]]]]], [441, `${spf}.${mcd}.deadMediumLoad`, 91, [[[], [129, [0, 432], [0, 429]]]]], [442, `${spf}.${mcd}.deadLargeLoad`, 91, [[[], [130, [0, 432], [0, 429]]]]], [443, `${spf}.${mcd}.liveLoad`, 91, [[[], [131, [0, 432], [0, 429]]]]], [444, `${spf}.${mcd}.liveFineLoad`, 91, [[[], [132, [0, 432], [0, 429]]]]], [445, `${spf}.${mcd}.liveSmallLoad`, 91, [[[], [133, [0, 432], [0, 429]]]]], [446, `${spf}.${mcd}.liveMediumLoad`, 91, [[[], [134, [0, 432], [0, 429]]]]], [447, `${spf}.${mcd}.liveLargeLoad`, 91, [[[], [135, [0, 432], [0, 429]]]]], [448, `${spf}.${mcd}.liveLeafLoad`, 91, [[[], [136, [0, 432], [0, 429]]]]], [449, `${spf}.model.palmettoGallberry.domain`, 23, [[[], [9, [1, 53]]]]], [450, `${spf}.${mpp}.age`, 72, [[[17, 50], [137, [0, 410]]], [[17, 53], [2]], [[], [9, [1, 16]]]]], [451, `${spf}.${mpp}.basalArea`, 73, [[[17, 50], [138, [0, 410]]], [[17, 53], [2]], [[], [9, [1, 16]]]]], [452, `${spf}.${mpp}.cover`, 78, [[[17, 50], [139, [0, 410]]], [[17, 53], [2]], [[], [9, [1, 16]]]]], [453, `${spf}.${mpp}.height`, 75, [[[17, 50], [140, [0, 410]]], [[17, 53], [2]], [[], [9, [1, 26]]]]], [454, `${spf}.${mpd}.depth`, 75, [[[], [141, [0, 453]]]]], [455, `${spf}.${mpd}.deadFineLoad`, 91, [[[], [142, [0, 450], [0, 453]]]]], [456, `${spf}.${mpd}.deadSmallLoad`, 91, [[[], [143, [0, 450], [0, 452]]]]], [457, `${spf}.${mpd}.deadFoliageLoad`, 91, [[[], [144, [0, 450], [0, 452]]]]], [458, `${spf}.${mpd}.deadLitterLoad`, 91, [[[], [145, [0, 450], [0, 451]]]]], [459, `${spf}.${mpd}.liveFineLoad`, 91, [[[], [146, [0, 450], [0, 453]]]]], [460, `${spf}.${mpd}.liveSmallLoad`, 91, [[[], [147, [0, 450], [0, 453]]]]], [461, `${spf}.${mpd}.liveFoliageLoad`, 91, [[[], [148, [0, 450], [0, 452], [0, 453]]]]], [462, `${spf}.model.westernAspen.domain`, 23, [[[], [9, [1, 54]]]]], [463, `${spf}.${mwp}.aspenType`, 31, [[[17, 50], [149, [0, 410]]], [[17, 54], [2]], [[], [9, [1, 58]]]]], [464, `${spf}.${mwp}.curingLevel`, 81, [[[17, 50], [150, [0, 410]]], [[17, 54], [2]], [[], [9, [1, 16]]]]], [465, `${spf}.${mwd}.depth`, 75, [[[], [151, [0, 463]]]]], [466, `${spf}.${mwd}.dead.fine.${load}`, 91, [[[], [152, [0, 463], [0, 464]]]]], [467, `${spf}.${mwd}.dead.small.${load}`, 91, [[[], [153, [0, 463]]]]], [468, `${spf}.${mwd}.dead.fine.${savr}`, 91, [[[], [154, [0, 463], [0, 464]]]]], [469, `${spf}.${mwd}.live.herb.${load}`, 91, [[[], [155, [0, 463], [0, 464]]]]], [470, `${spf}.${mwd}.live.stem.${load}`, 91, [[[], [156, [0, 463], [0, 464]]]]], [471, `${spf}.${mwd}.live.stem.${savr}`, 91, [[[], [157, [0, 463], [0, 464]]]]], [472, `${ssfbdp}1.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [473, `${ssfbdp}1.${heat}`, 84, [[[], [43, [0, 743], [0, 757], [1, 0], [1, 23], [1, 0]]]]], [474, `${ssfbdp}1.${load}`, 91, [[[], [43, [0, 743], [0, 750], [0, 773], [0, 789], [0, 800]]]]], [475, `${ssfbdp}1.${mois}`, 88, [[[], [43, [0, 743], [0, 111], [0, 111], [0, 111], [0, 111]]]]], [476, `${ssfbdp}1.${savr}`, 95, [[[], [43, [0, 743], [0, 754], [1, 24], [1, 25], [0, 802]]]]], [477, `${ssfbdp}1.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [478, `${ssfbdp}1.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [479, `${ssfbdp}1.${ef}.${ehn}`, 82, [[[], [44, [0, 476]]]]], [480, `${ssfbdp}1.${ef}.${load}`, 91, [[[], [45, [0, 476], [0, 474], [1, 31]]]]], [481, `${ssfbdp}1.${qig}`, 85, [[[], [46, [0, 475], [0, 479]]]]], [482, `${ssfbdp}1.net.${load}`, 91, [[[], [47, [0, 474], [0, 478]]]]], [483, `${ssfbdp}1.${sc}`, 93, [[[], [48, [0, 476]]]]], [484, `${ssfbdp}1.${sc}.${wf}`, 125, [[[], [49, [0, 483], [0, 653]]]]], [485, `${ssfbdp}1.${sa}`, 94, [[[], [50, [0, 474], [0, 476], [0, 472]]]]], [486, `${ssfbdp}1.${sa}.${wf}`, 125, [[[], [51, [0, 485], [0, 637]]]]], [487, `${ssfbdp}1.volume`, 100, [[[], [52, [0, 474], [0, 472]]]]], [488, `${ssfbdp}1.${ef}.waterLoad`, 91, [[[], [53, [0, 480], [0, 475]]]]], [489, `${ssfbdp}2.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [490, `${ssfbdp}2.${heat}`, 84, [[[], [43, [0, 743], [0, 757], [1, 0], [1, 23], [1, 0]]]]], [491, `${ssfbdp}2.${load}`, 91, [[[], [43, [0, 743], [0, 751], [0, 774], [0, 790], [0, 801]]]]], [492, `${ssfbdp}2.${mois}`, 88, [[[], [43, [0, 743], [0, 112], [0, 112], [0, 112], [0, 112]]]]], [493, `${ssfbdp}2.${savr}`, 95, [[[], [43, [0, 743], [1, 32], [1, 33], [1, 34], [1, 32]]]]], [494, `${ssfbdp}2.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [495, `${ssfbdp}2.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [496, `${ssfbdp}2.${ef}.${ehn}`, 82, [[[], [44, [0, 493]]]]], [497, `${ssfbdp}2.${ef}.${load}`, 91, [[[], [45, [0, 493], [0, 491], [1, 31]]]]], [498, `${ssfbdp}2.${qig}`, 85, [[[], [46, [0, 492], [0, 496]]]]], [499, `${ssfbdp}2.net.${load}`, 91, [[[], [47, [0, 491], [0, 495]]]]], [500, `${ssfbdp}2.${sc}`, 93, [[[], [48, [0, 493]]]]], [501, `${ssfbdp}2.${sc}.${wf}`, 125, [[[], [49, [0, 500], [0, 653]]]]], [502, `${ssfbdp}2.${sa}`, 94, [[[], [50, [0, 491], [0, 493], [0, 489]]]]], [503, `${ssfbdp}2.${sa}.${wf}`, 125, [[[], [51, [0, 502], [0, 637]]]]], [504, `${ssfbdp}2.volume`, 100, [[[], [52, [0, 491], [0, 489]]]]], [505, `${ssfbdp}2.${ef}.waterLoad`, 91, [[[], [53, [0, 497], [0, 492]]]]], [506, `${ssfbdp}3.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [507, `${ssfbdp}3.${heat}`, 84, [[[], [43, [0, 743], [0, 757], [1, 0], [1, 23], [1, 0]]]]], [508, `${ssfbdp}3.${load}`, 91, [[[], [43, [0, 743], [0, 752], [0, 775], [0, 791], [1, 16]]]]], [509, `${ssfbdp}3.${mois}`, 88, [[[], [43, [0, 743], [0, 113], [0, 112], [0, 111], [1, 35]]]]], [510, `${ssfbdp}3.${savr}`, 95, [[[], [43, [0, 743], [1, 22], [1, 36], [1, 37], [1, 8]]]]], [511, `${ssfbdp}3.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [512, `${ssfbdp}3.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [513, `${ssfbdp}3.${ef}.${ehn}`, 82, [[[], [44, [0, 510]]]]], [514, `${ssfbdp}3.${ef}.${load}`, 91, [[[], [45, [0, 510], [0, 508], [1, 31]]]]], [515, `${ssfbdp}3.${qig}`, 85, [[[], [46, [0, 509], [0, 513]]]]], [516, `${ssfbdp}3.net.${load}`, 91, [[[], [47, [0, 508], [0, 512]]]]], [517, `${ssfbdp}3.${sc}`, 93, [[[], [48, [0, 510]]]]], [518, `${ssfbdp}3.${sc}.${wf}`, 125, [[[], [49, [0, 517], [0, 653]]]]], [519, `${ssfbdp}3.${sa}`, 94, [[[], [50, [0, 508], [0, 510], [0, 506]]]]], [520, `${ssfbdp}3.${sa}.${wf}`, 125, [[[], [51, [0, 519], [0, 637]]]]], [521, `${ssfbdp}3.volume`, 100, [[[], [52, [0, 508], [0, 506]]]]], [522, `${ssfbdp}3.${ef}.waterLoad`, 91, [[[], [53, [0, 514], [0, 509]]]]], [523, `${ssfbdp}4.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 22], [1, 20]]]]], [524, `${ssfbdp}4.${heat}`, 84, [[[], [43, [0, 743], [0, 757], [1, 0], [1, 23], [1, 0]]]]], [525, `${ssfbdp}4.${load}`, 91, [[[], [43, [0, 743], [0, 759], [0, 776], [0, 792], [1, 16]]]]], [526, `${ssfbdp}4.${mois}`, 88, [[[], [43, [0, 743], [0, 111], [0, 113], [0, 113], [1, 35]]]]], [527, `${ssfbdp}4.${savr}`, 95, [[[], [43, [0, 743], [0, 755], [1, 38], [1, 37], [1, 8]]]]], [528, `${ssfbdp}4.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 26], [1, 26]]]]], [529, `${ssfbdp}4.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [530, `${ssfbdp}4.${ef}.${ehn}`, 82, [[[], [44, [0, 527]]]]], [531, `${ssfbdp}4.${ef}.${load}`, 91, [[[], [45, [0, 527], [0, 525], [1, 31]]]]], [532, `${ssfbdp}4.${qig}`, 85, [[[], [46, [0, 526], [0, 530]]]]], [533, `${ssfbdp}4.net.${load}`, 91, [[[], [47, [0, 525], [0, 529]]]]], [534, `${ssfbdp}4.${sc}`, 93, [[[], [48, [0, 527]]]]], [535, `${ssfbdp}4.${sc}.${wf}`, 125, [[[], [49, [0, 534], [0, 653]]]]], [536, `${ssfbdp}4.${sa}`, 94, [[[], [50, [0, 525], [0, 527], [0, 523]]]]], [537, `${ssfbdp}4.${sa}.${wf}`, 125, [[[], [51, [0, 536], [0, 637]]]]], [538, `${ssfbdp}4.volume`, 100, [[[], [52, [0, 525], [0, 523]]]]], [539, `${ssfbdp}4.${ef}.waterLoad`, 91, [[[], [53, [0, 531], [0, 526]]]]], [540, `${ssfbdp}5.${dens}`, 92, [[[], [9, [1, 20]]]]], [541, `${ssfbdp}5.${heat}`, 84, [[[], [9, [1, 0]]]]], [542, `${ssfbdp}5.${load}`, 91, [[[], [9, [1, 16]]]]], [543, `${ssfbdp}5.${mois}`, 88, [[[], [9, [1, 35]]]]], [544, `${ssfbdp}5.${savr}`, 95, [[[], [9, [1, 8]]]]], [545, `${ssfbdp}5.${emc}`, 83, [[[], [9, [1, 26]]]]], [546, `${ssfbdp}5.${tmc}`, 99, [[[], [9, [1, 28]]]]], [547, `${ssfbdp}5.${ef}.${ehn}`, 82, [[[], [44, [0, 544]]]]], [548, `${ssfbdp}5.${ef}.${load}`, 91, [[[], [45, [0, 544], [0, 542], [1, 31]]]]], [549, `${ssfbdp}5.${qig}`, 85, [[[], [46, [0, 543], [0, 547]]]]], [550, `${ssfbdp}5.net.${load}`, 91, [[[], [47, [0, 542], [0, 546]]]]], [551, `${ssfbdp}5.${sc}`, 93, [[[], [48, [0, 544]]]]], [552, `${ssfbdp}5.${sc}.${wf}`, 125, [[[], [49, [0, 551], [0, 653]]]]], [553, `${ssfbdp}5.${sa}`, 94, [[[], [50, [0, 542], [0, 544], [0, 540]]]]], [554, `${ssfbdp}5.${sa}.${wf}`, 125, [[[], [51, [0, 553], [0, 637]]]]], [555, `${ssfbdp}5.volume`, 100, [[[], [52, [0, 542], [0, 540]]]]], [556, `${ssfbdp}5.${ef}.waterLoad`, 91, [[[], [53, [0, 548], [0, 543]]]]], [557, `${ssfblp}1.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [558, `${ssfblp}1.${heat}`, 84, [[[], [43, [0, 743], [0, 758], [1, 39], [1, 23], [1, 0]]]]], [559, `${ssfblp}1.${load}`, 91, [[[], [43, [0, 743], [0, 760], [0, 778], [0, 793], [0, 803]]]]], [560, `${ssfblp}1.${mois}`, 88, [[[], [43, [0, 743], [0, 115], [0, 116], [0, 116], [0, 115]]]]], [561, `${ssfblp}1.${savr}`, 95, [[[], [43, [0, 743], [0, 755], [1, 24], [1, 25], [1, 40]]]]], [562, `${ssfblp}1.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [563, `${ssfblp}1.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [564, `${ssfblp}1.${ef}.${ehn}`, 82, [[[], [44, [0, 561]]]]], [565, `${ssfblp}1.${ef}.${load}`, 91, [[[], [45, [0, 561], [0, 559], [1, 41]]]]], [566, `${ssfblp}1.${qig}`, 85, [[[], [46, [0, 560], [0, 564]]]]], [567, `${ssfblp}1.net.${load}`, 91, [[[], [47, [0, 559], [0, 563]]]]], [568, `${ssfblp}1.${sc}`, 93, [[[], [48, [0, 561]]]]], [569, `${ssfblp}1.${sc}.${wf}`, 125, [[[], [49, [0, 568], [0, 673]]]]], [570, `${ssfblp}1.${sa}`, 94, [[[], [50, [0, 559], [0, 561], [0, 557]]]]], [571, `${ssfblp}1.${sa}.${wf}`, 125, [[[], [51, [0, 570], [0, 657]]]]], [572, `${ssfblp}1.volume`, 100, [[[], [52, [0, 559], [0, 557]]]]], [573, `${ssfblp}2.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [574, `${ssfblp}2.${heat}`, 84, [[[], [43, [0, 743], [0, 758], [1, 42], [1, 23], [1, 0]]]]], [575, `${ssfblp}2.${load}`, 91, [[[], [43, [0, 743], [0, 753], [0, 779], [0, 794], [0, 804]]]]], [576, `${ssfblp}2.${mois}`, 88, [[[], [43, [0, 743], [0, 116], [0, 116], [0, 116], [0, 116]]]]], [577, `${ssfblp}2.${savr}`, 95, [[[], [43, [0, 743], [0, 756], [1, 33], [1, 34], [0, 805]]]]], [578, `${ssfblp}2.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [579, `${ssfblp}2.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [580, `${ssfblp}2.${ef}.${ehn}`, 82, [[[], [44, [0, 577]]]]], [581, `${ssfblp}2.${ef}.${load}`, 91, [[[], [45, [0, 577], [0, 575], [1, 41]]]]], [582, `${ssfblp}2.${qig}`, 85, [[[], [46, [0, 576], [0, 580]]]]], [583, `${ssfblp}2.net.${load}`, 91, [[[], [47, [0, 575], [0, 579]]]]], [584, `${ssfblp}2.${sc}`, 93, [[[], [48, [0, 577]]]]], [585, `${ssfblp}2.${sc}.${wf}`, 125, [[[], [49, [0, 584], [0, 673]]]]], [586, `${ssfblp}2.${sa}`, 94, [[[], [50, [0, 575], [0, 577], [0, 573]]]]], [587, `${ssfblp}2.${sa}.${wf}`, 125, [[[], [51, [0, 586], [0, 657]]]]], [588, `${ssfblp}2.volume`, 100, [[[], [52, [0, 575], [0, 573]]]]], [589, `${ssfblp}3.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [590, `${ssfblp}3.${heat}`, 84, [[[], [43, [0, 743], [0, 758], [1, 42], [1, 23], [1, 0]]]]], [591, `${ssfblp}3.${load}`, 91, [[[], [43, [0, 743], [1, 16], [0, 780], [0, 795], [1, 16]]]]], [592, `${ssfblp}3.${mois}`, 88, [[[], [43, [0, 743], [1, 35], [0, 116], [0, 116], [1, 35]]]]], [593, `${ssfblp}3.${savr}`, 95, [[[], [43, [0, 743], [1, 8], [1, 36], [1, 37], [1, 8]]]]], [594, `${ssfblp}3.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [595, `${ssfblp}3.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [596, `${ssfblp}3.${ef}.${ehn}`, 82, [[[], [44, [0, 593]]]]], [597, `${ssfblp}3.${ef}.${load}`, 91, [[[], [45, [0, 593], [0, 591], [1, 41]]]]], [598, `${ssfblp}3.${qig}`, 85, [[[], [46, [0, 592], [0, 596]]]]], [599, `${ssfblp}3.net.${load}`, 91, [[[], [47, [0, 591], [0, 595]]]]], [600, `${ssfblp}3.${sc}`, 93, [[[], [48, [0, 593]]]]], [601, `${ssfblp}3.${sc}.${wf}`, 125, [[[], [49, [0, 600], [0, 673]]]]], [602, `${ssfblp}3.${sa}`, 94, [[[], [50, [0, 591], [0, 593], [0, 589]]]]], [603, `${ssfblp}3.${sa}.${wf}`, 125, [[[], [51, [0, 602], [0, 657]]]]], [604, `${ssfblp}3.volume`, 100, [[[], [52, [0, 591], [0, 589]]]]], [605, `${ssfblp}4.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 21], [1, 21], [1, 20]]]]], [606, `${ssfblp}4.${heat}`, 84, [[[], [43, [0, 743], [0, 758], [1, 42], [1, 23], [1, 0]]]]], [607, `${ssfblp}4.${load}`, 91, [[[], [43, [0, 743], [1, 16], [0, 781], [1, 16], [1, 16]]]]], [608, `${ssfblp}4.${mois}`, 88, [[[], [43, [0, 743], [1, 35], [0, 116], [1, 35], [1, 35]]]]], [609, `${ssfblp}4.${savr}`, 95, [[[], [43, [0, 743], [1, 8], [1, 38], [1, 8], [1, 8]]]]], [610, `${ssfblp}4.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 27], [1, 27], [1, 26]]]]], [611, `${ssfblp}4.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [612, `${ssfblp}4.${ef}.${ehn}`, 82, [[[], [44, [0, 609]]]]], [613, `${ssfblp}4.${ef}.${load}`, 91, [[[], [45, [0, 609], [0, 607], [1, 41]]]]], [614, `${ssfblp}4.${qig}`, 85, [[[], [46, [0, 608], [0, 612]]]]], [615, `${ssfblp}4.net.${load}`, 91, [[[], [47, [0, 607], [0, 611]]]]], [616, `${ssfblp}4.${sc}`, 93, [[[], [48, [0, 609]]]]], [617, `${ssfblp}4.${sc}.${wf}`, 125, [[[], [49, [0, 616], [0, 673]]]]], [618, `${ssfblp}4.${sa}`, 94, [[[], [50, [0, 607], [0, 609], [0, 605]]]]], [619, `${ssfblp}4.${sa}.${wf}`, 125, [[[], [51, [0, 618], [0, 657]]]]], [620, `${ssfblp}4.volume`, 100, [[[], [52, [0, 607], [0, 605]]]]], [621, `${ssfblp}5.${dens}`, 92, [[[], [43, [0, 743], [1, 20], [1, 20], [1, 21], [1, 20]]]]], [622, `${ssfblp}5.${heat}`, 84, [[[], [43, [0, 743], [0, 758], [1, 39], [1, 23], [1, 0]]]]], [623, `${ssfblp}5.${load}`, 91, [[[], [43, [0, 743], [1, 16], [0, 782], [1, 16], [1, 16]]]]], [624, `${ssfblp}5.${mois}`, 88, [[[], [43, [0, 743], [1, 35], [0, 115], [1, 35], [1, 35]]]]], [625, `${ssfblp}5.${savr}`, 95, [[[], [43, [0, 743], [1, 8], [1, 43], [1, 8], [1, 8]]]]], [626, `${ssfblp}5.${emc}`, 83, [[[], [43, [0, 743], [1, 26], [1, 44], [1, 27], [1, 26]]]]], [627, `${ssfblp}5.${tmc}`, 99, [[[], [43, [0, 743], [1, 28], [1, 29], [1, 30], [1, 29]]]]], [628, `${ssfblp}5.${ef}.${ehn}`, 82, [[[], [44, [0, 625]]]]], [629, `${ssfblp}5.${ef}.${load}`, 91, [[[], [45, [0, 625], [0, 623], [1, 41]]]]], [630, `${ssfblp}5.${qig}`, 85, [[[], [46, [0, 624], [0, 628]]]]], [631, `${ssfblp}5.net.${load}`, 91, [[[], [47, [0, 623], [0, 627]]]]], [632, `${ssfblp}5.${sc}`, 93, [[[], [48, [0, 625]]]]], [633, `${ssfblp}5.${sc}.${wf}`, 125, [[[], [49, [0, 632], [0, 673]]]]], [634, `${ssfblp}5.${sa}`, 94, [[[], [50, [0, 623], [0, 625], [0, 621]]]]], [635, `${ssfblp}5.${sa}.${wf}`, 125, [[[], [51, [0, 634], [0, 657]]]]], [636, `${ssfblp}5.volume`, 100, [[[], [52, [0, 623], [0, 621]]]]], [637, `${ssfbd}.${sa}`, 94, [[[], [54, [0, 485], [0, 502], [0, 519], [0, 536], [0, 553]]]]], [638, `${ssfbd}.${sa}.${wf}`, 125, [[[], [21, [0, 637], [0, 692]]]]], [639, `${ssfbd}.mineralDamping`, 55, [[[], [55, [0, 652]]]]], [640, `${ssfbd}.moistureDamping`, 55, [[[], [56, [0, 646], [0, 644]]]]], [641, `${ssfbd}.${heat}`, 84, [[[], [57, [0, 486], [0, 503], [0, 520], [0, 537], [0, 554], [0, 473], [0, 490], [0, 507], [0, 524], [0, 541]]]]], [642, `${ssfbd}.${load}`, 91, [[[], [54, [0, 474], [0, 491], [0, 508], [0, 525], [0, 542]]]]], [643, `${ssfbd}.${ef}.${load}`, 91, [[[], [54, [0, 480], [0, 497], [0, 514], [0, 531], [0, 548]]]]], [644, `${ssfbd}.extinction.${mois}`, 88, [[[], [43, [0, 743], [0, 748], [1, 45], [1, 46], [1, 47]]]]], [645, `${ssfbd}.extinction.${mois}Factor`, 37, [[[], [58, [0, 643], [0, 663]]]]], [646, `${ssfbd}.${mois}`, 88, [[[], [57, [0, 486], [0, 503], [0, 520], [0, 537], [0, 554], [0, 475], [0, 492], [0, 509], [0, 526], [0, 543]]]]], [647, `${ssfbd}.volume`, 75, [[[], [54, [0, 487], [0, 504], [0, 521], [0, 538], [0, 555]]]]], [648, `${ssfbd}.${qig}`, 85, [[[], [57, [0, 486], [0, 503], [0, 520], [0, 537], [0, 554], [0, 481], [0, 498], [0, 515], [0, 532], [0, 549]]]]], [649, `${ssfbd}.${rxi}`, 65, [[[], [22, [0, 650], [0, 640]]]]], [650, `${ssfbd}.${rxi}Dry`, 65, [[[], [59, [0, 689], [0, 654], [0, 641], [0, 639]]]]], [651, `${ssfbd}.${savr}`, 95, [[[], [57, [0, 486], [0, 503], [0, 520], [0, 537], [0, 554], [0, 476], [0, 493], [0, 510], [0, 527], [0, 544]]]]], [652, `${ssfbd}.${emc}`, 83, [[[], [57, [0, 486], [0, 503], [0, 520], [0, 537], [0, 554], [0, 477], [0, 494], [0, 511], [0, 528], [0, 545]]]]], [653, `${ssfbd}.${sc}.${wf}`, 125, [[[], [60, [0, 485], [0, 483], [0, 502], [0, 500], [0, 519], [0, 517], [0, 536], [0, 534], [0, 553], [0, 551]]]]], [654, `${ssfbd}.net.${load}`, 91, [[[], [57, [0, 484], [0, 501], [0, 518], [0, 535], [0, 552], [0, 482], [0, 499], [0, 516], [0, 533], [0, 550]]]]], [655, `${ssfbd}.${ef}.waterLoad`, 91, [[[], [54, [0, 488], [0, 505], [0, 522], [0, 539], [0, 556]]]]], [656, `${ssfbd}.${ef}.${mois}`, 88, [[[], [21, [0, 655], [0, 643]]]]], [657, `${ssfbl}.${sa}`, 94, [[[], [54, [0, 570], [0, 586], [0, 602], [0, 618], [0, 634]]]]], [658, `${ssfbl}.${sa}.${wf}`, 125, [[[], [21, [0, 657], [0, 692]]]]], [659, `${ssfbl}.mineralDamping`, 55, [[[], [55, [0, 672]]]]], [660, `${ssfbl}.moistureDamping`, 55, [[[], [56, [0, 666], [0, 664]]]]], [661, `${ssfbl}.${heat}`, 84, [[[], [57, [0, 571], [0, 587], [0, 603], [0, 619], [0, 635], [0, 558], [0, 574], [0, 590], [0, 606], [0, 622]]]]], [662, `${ssfbl}.${load}`, 91, [[[], [54, [0, 559], [0, 575], [0, 591], [0, 607], [0, 623]]]]], [663, `${ssfbl}.${ef}.${load}`, 91, [[[], [54, [0, 565], [0, 581], [0, 597], [0, 613], [0, 629]]]]], [664, `${ssfbl}.extinction.${mois}`, 88, [[[], [61, [0, 665], [0, 656], [0, 644]]]]], [665, `${ssfbl}.extinction.${mois}Factor`, 37, [[[], [58, [0, 643], [0, 663]]]]], [666, `${ssfbl}.${mois}`, 88, [[[], [57, [0, 571], [0, 587], [0, 603], [0, 619], [0, 635], [0, 560], [0, 576], [0, 592], [0, 608], [0, 624]]]]], [667, `${ssfbl}.volume`, 75, [[[], [54, [0, 572], [0, 588], [0, 604], [0, 620], [0, 636]]]]], [668, `${ssfbl}.${qig}`, 85, [[[], [57, [0, 571], [0, 587], [0, 603], [0, 619], [0, 635], [0, 566], [0, 582], [0, 598], [0, 614], [0, 630]]]]], [669, `${ssfbl}.${rxi}`, 65, [[[], [22, [0, 670], [0, 660]]]]], [670, `${ssfbl}.${rxi}Dry`, 65, [[[], [59, [0, 689], [0, 674], [0, 661], [0, 659]]]]], [671, `${ssfbl}.${savr}`, 95, [[[], [57, [0, 571], [0, 587], [0, 603], [0, 619], [0, 635], [0, 561], [0, 577], [0, 593], [0, 609], [0, 625]]]]], [672, `${ssfbl}.${emc}`, 83, [[[], [57, [0, 571], [0, 587], [0, 603], [0, 619], [0, 635], [0, 562], [0, 578], [0, 594], [0, 610], [0, 626]]]]], [673, `${ssfbl}.${sc}.${wf}`, 125, [[[], [60, [0, 570], [0, 568], [0, 586], [0, 584], [0, 602], [0, 600], [0, 618], [0, 616], [0, 634], [0, 632]]]]], [674, `${ssfbl}.net.${load}`, 91, [[[], [57, [0, 569], [0, 585], [0, 601], [0, 617], [0, 633], [0, 567], [0, 583], [0, 599], [0, 615], [0, 631]]]]], [675, `${ssfb}.depth`, 75, [[[], [43, [0, 743], [0, 747], [0, 764], [0, 788], [0, 799]]]]], [676, `${ssfb}.bulkDensity`, 74, [[[], [21, [0, 680], [0, 675]]]]], [677, `${ssfb}.${qig}`, 76, [[[], [57, [0, 638], [0, 658], [0, 648], [0, 668]]]]], [678, `${ssfb}.heatSink`, 86, [[[], [62, [0, 677], [0, 676]]]]], [679, `${ssfb}.noWindNoSlope.${ros}`, 71, [[[], [63, [0, 686], [0, 685], [0, 678]]]]], [680, `${ssfb}.${load}`, 91, [[[], [54, [0, 642], [0, 662]]]]], [681, `${ssfb}.open.${waf}`, 127, [[[], [64, [0, 675]]]]], [682, `${ssfb}.packingRatio`, 77, [[[], [65, [0, 647], [0, 667], [0, 675]]]]], [683, `${ssfb}.packingRatio.optimum`, 77, [[[], [66, [0, 690]]]]], [684, `${ssfb}.packingRatio.ratio`, 77, [[[], [21, [0, 682], [0, 683]]]]], [685, `${ssfb}.propagatingFluxRatio`, 64, [[[], [67, [0, 690], [0, 682]]]]], [686, `${ssfb}.${rxi}`, 65, [[[], [54, [0, 649], [0, 669]]]]], [687, `${ssfb}.reactionVelocityExponent`, 37, [[[], [68, [0, 690]]]]], [688, `${ssfb}.reactionVelocityMaximum`, 66, [[[], [69, [0, 691]]]]], [689, `${ssfb}.reactionVelocityOptimum`, 66, [[[], [70, [0, 684], [0, 688], [0, 687]]]]], [690, `${ssfb}.${savr}`, 95, [[[], [57, [0, 638], [0, 658], [0, 651], [0, 671]]]]], [691, `${ssfb}.savr15`, 37, [[[], [71, [0, 690]]]]], [692, `${ssfb}.${sa}`, 94, [[[], [54, [0, 637], [0, 657]]]]], [693, `${ssff}.maximumDirection.slope.${ros}`, 71, [[[], [72, [0, 742], [0, 706]]]]], [694, `${ssff}.maximumDirection.wind.${ros}`, 71, [[[], [73, [0, 742], [0, 729]]]]], [695, `${ssff}.wind.heading.fromUpslope`, 40, [[[], [30, [0, 130]]]]], [696, `${ssff}.maximumDirection.xComponent`, 37, [[[], [74, [0, 694], [0, 693], [0, 695]]]]], [697, `${ssff}.maximumDirection.yComponent`, 37, [[[], [75, [0, 694], [0, 695]]]]], [698, `${ssff}.maximumDirection.${ros}`, 71, [[[], [76, [0, 696], [0, 697]]]]], [699, `${ssff}.limit.${ews}.exceeded`, 34, [[[], [77, [0, 710], [0, 701]]]]], [700, `${ssff}.limit.${ros}.exceeded`, 35, [[[], [77, [0, 712], [0, 718]]]]], [701, `${ssff}.limit.${ews}`, 126, [[[], [78, [0, 739]]]]], [702, `${ssff}.limit.windSlopeSpreadRateCoefficient`, 37, [[[], [79, [0, 701], [0, 724], [0, 727]]]]], [703, `${ssff}.limit.${ros}`, 71, [[[], [80, [0, 742], [0, 702]]]]], [704, `${ssff}.slope.ratio`, 115, [[[], [30, [0, 121]]]]], [705, `${ssff}.slope.k`, 37, [[[], [81, [0, 682]]]]], [706, `${ssff}.slope.phi`, 37, [[[], [82, [0, 704], [0, 705]]]]], [707, `${ssff}.spread.step1.${ews}`, 126, [[[], [83, [0, 708], [0, 724], [0, 728]]]]], [708, `${ssff}.spread.step1.${phiew}`, 37, [[[], [84, [0, 729], [0, 706]]]]], [709, `${ssff}.spread.step1.${ros}`, 71, [[[], [80, [0, 742], [0, 708]]]]], [710, `${ssff}.spread.step2.${ews}`, 126, [[[], [83, [0, 711], [0, 724], [0, 728]]]]], [711, `${ssff}.spread.step2.${phiew}`, 37, [[[], [85, [0, 742], [0, 712]]]]], [712, `${ssff}.spread.step2.${ros}`, 71, [[[], [86, [0, 742], [0, 698]]]]], [713, `${ssff}.spread.step3a.${ews}`, 126, [[[], [87, [0, 710], [0, 701]]]]], [714, `${ssff}.spread.step3a.${phiew}`, 37, [[[], [87, [0, 711], [0, 702]]]]], [715, `${ssff}.spread.step3a.${ros}`, 71, [[[], [87, [0, 712], [0, 703]]]]], [716, `${ssff}.spread.step3b.${ews}`, 126, [[[], [83, [0, 717], [0, 724], [0, 728]]]]], [717, `${ssff}.spread.step3b.${phiew}`, 37, [[[], [85, [0, 742], [0, 718]]]]], [718, `${ssff}.spread.step3b.${ros}`, 71, [[[], [88, [0, 712], [0, 710]]]]], [719, `${ssff}.spread.step4.${ews}`, 126, [[[], [83, [0, 720], [0, 724], [0, 728]]]]], [720, `${ssff}.spread.step4.${phiew}`, 37, [[[], [85, [0, 742], [0, 721]]]]], [721, `${ssff}.spread.step4.${ros}`, 71, [[[], [88, [0, 715], [0, 713]]]]], [722, `${ssff}.${waf}`, 127, [[[20, 48], [30, [0, 137]]], [[], [89, [0, 51], [0, 54], [0, 681]]]]], [723, `${ssff}.wind.speed.atMidflame`, 126, [[[26, 19], [30, [0, 136]]], [[], [42, [0, 135], [0, 722]]]]], [724, `${ssff}.wind.factor.b`, 37, [[[], [90, [0, 690]]]]], [725, `${ssff}.wind.factor.c`, 37, [[[], [91, [0, 690]]]]], [726, `${ssff}.wind.factor.e`, 37, [[[], [92, [0, 690]]]]], [727, `${ssff}.wind.factor.k`, 37, [[[], [93, [0, 684], [0, 726], [0, 725]]]]], [728, `${ssff}.wind.factor.i`, 37, [[[], [94, [0, 684], [0, 726], [0, 725]]]]], [729, `${ssff}.wind.phi`, 37, [[[], [95, [0, 723], [0, 724], [0, 727]]]]], [730, `${ssff}.${ews}`, 126, [[[29, 49], [30, [0, 719]]], [[], [30, [0, 716]]]]], [731, `${ssff}.${fli}`, 57, [[[], [96, [0, 741], [0, 739], [0, 733]]]]], [732, `${ssff}.${fl}`, 59, [[[], [17, [0, 731]]]]], [733, `${ssff}.${taur}`, 67, [[[], [97, [0, 690]]]]], [734, `${ssff}.heading.fromUpslope`, 40, [[[], [98, [0, 696], [0, 697], [0, 698]]]]], [735, `${ssff}.heading.fromNorth`, 40, [[[], [19, [0, 119], [0, 734]]]]], [736, `${ssff}.${hpua}`, 60, [[[], [99, [0, 739], [0, 733]]]]], [737, `${ssff}.${lwr}`, 61, [[[], [20, [0, 730]]]]], [738, `${ssff}.${phiew}`, 37, [[[29, 49], [30, [0, 720]]], [[], [30, [0, 717]]]]], [739, `${ssff}.${rxi}`, 65, [[[], [30, [0, 686]]]]], [740, `${ssff}.${sh}`, 68, [[[], [100, [0, 731], [0, 723], [0, 122]]]]], [741, `${ssff}.${ros}`, 71, [[[29, 49], [30, [0, 721]]], [[], [30, [0, 718]]]]], [742, `${ssff}.noWindNoSlope.${ros}`, 71, [[[], [30, [0, 679]]]]], [743, `${ssf}.model.domain`, 23, [[[18, 50], [101, [0, 744]]], [[18, 51], [9, [1, 51]]], [[18, 52], [9, [1, 52]]], [[18, 53], [9, [1, 53]]], [[18, 54], [9, [1, 54]]], [[], [9, [1, 55]]]]], [744, `${ssf}.model.catalogKey`, 24, [[[], [2]]]], [745, `${ssf}.model.behave.domain`, 23, [[[], [9, [1, 51]]]]], [746, `${ssf}.${mbp}.cured.herb.fraction`, 81, [[[21, 56], [102, [0, 115]]], [[], [2]]]], [747, `${ssf}.${mbp}.depth`, 75, [[[18, 50], [103, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 26]]]]], [748, `${ssf}.${mbp}.dead.extinction.${mois}`, 88, [[[18, 50], [104, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 47]]]]], [749, `${ssf}.${mbp}.total.herb.${load}`, 91, [[[18, 50], [105, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 16]]]]], [750, `${ssf}.${mbp}.dead.tl1h.${load}`, 91, [[[18, 50], [106, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 16]]]]], [751, `${ssf}.${mbp}.dead.tl10h.${load}`, 91, [[[18, 50], [107, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 16]]]]], [752, `${ssf}.${mbp}.dead.tl100h.${load}`, 91, [[[18, 50], [108, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 16]]]]], [753, `${ssf}.${mbp}.live.stem.${load}`, 91, [[[18, 50], [109, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 16]]]]], [754, `${ssf}.${mbp}.dead.tl1h.${savr}`, 95, [[[18, 50], [110, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 16]]]]], [755, `${ssf}.${mbp}.live.herb.${savr}`, 95, [[[18, 50], [111, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 8]]]]], [756, `${ssf}.${mbp}.live.stem.${savr}`, 95, [[[18, 50], [112, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 8]]]]], [757, `${ssf}.${mbp}.dead.${heat}`, 84, [[[18, 50], [113, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 0]]]]], [758, `${ssf}.${mbp}.live.${heat}`, 84, [[[18, 50], [114, [0, 744]]], [[18, 51], [2]], [[], [9, [1, 0]]]]], [759, `${ssf}.${mbd}.dead.herb.${load}`, 91, [[[], [115, [0, 749], [0, 746]]]]], [760, `${ssf}.${mbd}.live.herb.${load}`, 91, [[[], [116, [0, 749], [0, 746]]]]], [761, `${ssf}.model.chaparral.domain`, 23, [[[], [9, [1, 52]]]]], [762, `${ssf}.${mcp}.chaparralType`, 20, [[[18, 50], [117, [0, 744]]], [[18, 52], [2]], [[], [9, [1, 57]]]]], [763, `${ssf}.${mcp}.observed.deadFuelFraction`, 81, [[[18, 50], [118, [0, 744]]], [[18, 52], [2]], [[], [9, [1, 16]]]]], [764, `${ssf}.${mcp}.observed.depth`, 75, [[[18, 50], [119, [0, 744]]], [[18, 52], [2]], [[], [9, [1, 26]]]]], [765, `${ssf}.${mcp}.observed.totalLoad`, 91, [[[18, 50], [120, [0, 744]]], [[18, 52], [2]], [[], [9, [1, 16]]]]], [766, `${ssf}.${mcp}.applied.totalLoad`, 91, [[[22, 56], [30, [0, 771]]], [[], [30, [0, 765]]]]], [767, `${ssf}.${mcd}.age`, 72, [[[], [121, [0, 764], [0, 762]]]]], [768, `${ssf}.${mcd}.averageMortality`, 111, [[[], [122, [0, 767]]]]], [769, `${ssf}.${mcd}.severeMortality`, 111, [[[], [123, [0, 767]]]]], [770, `${ssf}.${mcd}.depth`, 75, [[[], [124, [0, 767], [0, 762]]]]], [771, `${ssf}.${mcd}.totalLoad`, 91, [[[], [125, [0, 767], [0, 762]]]]], [772, `${ssf}.${mcd}.deadLoad`, 91, [[[], [126, [0, 766], [0, 763]]]]], [773, `${ssf}.${mcd}.deadFineLoad`, 91, [[[], [127, [0, 766], [0, 763]]]]], [774, `${ssf}.${mcd}.deadSmallLoad`, 91, [[[], [128, [0, 766], [0, 763]]]]], [775, `${ssf}.${mcd}.deadMediumLoad`, 91, [[[], [129, [0, 766], [0, 763]]]]], [776, `${ssf}.${mcd}.deadLargeLoad`, 91, [[[], [130, [0, 766], [0, 763]]]]], [777, `${ssf}.${mcd}.liveLoad`, 91, [[[], [131, [0, 766], [0, 763]]]]], [778, `${ssf}.${mcd}.liveFineLoad`, 91, [[[], [132, [0, 766], [0, 763]]]]], [779, `${ssf}.${mcd}.liveSmallLoad`, 91, [[[], [133, [0, 766], [0, 763]]]]], [780, `${ssf}.${mcd}.liveMediumLoad`, 91, [[[], [134, [0, 766], [0, 763]]]]], [781, `${ssf}.${mcd}.liveLargeLoad`, 91, [[[], [135, [0, 766], [0, 763]]]]], [782, `${ssf}.${mcd}.liveLeafLoad`, 91, [[[], [136, [0, 766], [0, 763]]]]], [783, `${ssf}.model.palmettoGallberry.domain`, 23, [[[], [9, [1, 53]]]]], [784, `${ssf}.${mpp}.age`, 72, [[[18, 50], [137, [0, 744]]], [[18, 53], [2]], [[], [9, [1, 16]]]]], [785, `${ssf}.${mpp}.basalArea`, 73, [[[18, 50], [138, [0, 744]]], [[18, 53], [2]], [[], [9, [1, 16]]]]], [786, `${ssf}.${mpp}.cover`, 78, [[[18, 50], [139, [0, 744]]], [[18, 53], [2]], [[], [9, [1, 16]]]]], [787, `${ssf}.${mpp}.height`, 75, [[[18, 50], [140, [0, 744]]], [[18, 53], [2]], [[], [9, [1, 26]]]]], [788, `${ssf}.${mpd}.depth`, 75, [[[], [141, [0, 787]]]]], [789, `${ssf}.${mpd}.deadFineLoad`, 91, [[[], [142, [0, 784], [0, 787]]]]], [790, `${ssf}.${mpd}.deadSmallLoad`, 91, [[[], [143, [0, 784], [0, 786]]]]], [791, `${ssf}.${mpd}.deadFoliageLoad`, 91, [[[], [144, [0, 784], [0, 786]]]]], [792, `${ssf}.${mpd}.deadLitterLoad`, 91, [[[], [145, [0, 784], [0, 785]]]]], [793, `${ssf}.${mpd}.liveFineLoad`, 91, [[[], [146, [0, 784], [0, 787]]]]], [794, `${ssf}.${mpd}.liveSmallLoad`, 91, [[[], [147, [0, 784], [0, 787]]]]], [795, `${ssf}.${mpd}.liveFoliageLoad`, 91, [[[], [148, [0, 784], [0, 786], [0, 787]]]]], [796, `${ssf}.model.westernAspen.domain`, 23, [[[], [9, [1, 54]]]]], [797, `${ssf}.${mwp}.aspenType`, 31, [[[18, 50], [149, [0, 744]]], [[18, 54], [2]], [[], [9, [1, 58]]]]], [798, `${ssf}.${mwp}.curingLevel`, 81, [[[18, 50], [150, [0, 744]]], [[18, 54], [2]], [[], [9, [1, 16]]]]], [799, `${ssf}.${mwd}.depth`, 75, [[[], [151, [0, 797]]]]], [800, `${ssf}.${mwd}.dead.fine.${load}`, 91, [[[], [152, [0, 797], [0, 798]]]]], [801, `${ssf}.${mwd}.dead.small.${load}`, 91, [[[], [153, [0, 797]]]]], [802, `${ssf}.${mwd}.dead.fine.${savr}`, 91, [[[], [154, [0, 797], [0, 798]]]]], [803, `${ssf}.${mwd}.live.herb.${load}`, 91, [[[], [155, [0, 797], [0, 798]]]]], [804, `${ssf}.${mwd}.live.stem.${load}`, 91, [[[], [156, [0, 797], [0, 798]]]]], [805, `${ssf}.${mwd}.live.stem.${savr}`, 91, [[[], [157, [0, 797], [0, 798]]]]], [806, `${swf}.primaryCover`, 78, [[[18, 55], [9, [1, 8]]], [[], [2]]]], [807, `${swf}.${ews}`, 126, [[[], [30, [0, 396]]]]], [808, `${swf}.heading.fromUpslope`, 40, [[[], [30, [0, 400]]]]], [809, `${swf}.heading.fromNorth`, 40, [[[], [30, [0, 401]]]]], [810, `${swf}.${lwr}`, 61, [[[], [30, [0, 403]]]]], [811, `${swf}.wind.speed.atMidflame`, 126, [[[], [30, [0, 389]]]]], [812, `${swf}.${waf}`, 127, [[[], [30, [0, 388]]]]], [813, `${swf}.${fli}`, 57, [[[18, 55], [30, [0, 397]]], [[], [158, [0, 397], [0, 731]]]]], [814, `${swf}.${fl}`, 59, [[[18, 55], [30, [0, 398]]], [[], [158, [0, 398], [0, 732]]]]], [815, `${swf}.${hpua}`, 60, [[[18, 55], [30, [0, 402]]], [[], [158, [0, 402], [0, 736]]]]], [816, `${swf}.${rxi}`, 65, [[[18, 55], [30, [0, 405]]], [[], [158, [0, 405], [0, 739]]]]], [817, `${swf}.${sh}`, 68, [[[18, 55], [30, [0, 406]]], [[], [158, [0, 406], [0, 740]]]]], [818, `${swf}.limit.${ews}.exceeded`, 34, [[[18, 55], [30, [0, 365]]], [[], [159, [0, 365], [0, 699]]]]], [819, `${swf}.limit.${ews}`, 126, [[[18, 55], [30, [0, 367]]], [[], [87, [0, 367], [0, 701]]]]], [820, `${swf}.${ros}`, 71, [[[30, 59], [30, [0, 822]]], [[30, 60], [30, [0, 823]]], [[], [30, [0, 821]]]]], [821, `${swf}.arithmeticMean.${ros}`, 71, [[[18, 55], [30, [0, 407]]], [[], [160, [0, 806], [0, 407], [0, 741]]]]], [822, `${swf}.expectedValue.${ros}`, 71, [[[18, 55], [30, [0, 407]]], [[], [161, [0, 806], [0, 407], [0, 741]]]]], [823, `${swf}.harmonicMean.${ros}`, 71, [[[18, 55], [30, [0, 407]]], [[], [162, [0, 806], [0, 407], [0, 741]]]]], [824, `${sfe}.axis.eccentricity`, 61, [[[], [163, [0, 826]]]]], [825, `${sfe}.axis.${ews}`, 126, [[[13, 61], [30, [0, 807]]], [[], [30, [0, 76]]]]], [826, `${sfe}.axis.${lwr}`, 61, [[[13, 61], [30, [0, 810]]], [[], [30, [0, 82]]]]], [827, `${sfe}.axis.major.${ros}`, 71, [[[], [164, [0, 861], [0, 847]]]]], [828, `${sfe}.axis.minor.${ros}`, 71, [[[], [165, [0, 827], [0, 826]]]]], [829, `${sfe}.axis.f.${ros}`, 71, [[[], [166, [0, 827]]]]], [830, `${sfe}.axis.g.${ros}`, 71, [[[], [167, [0, 827], [0, 847]]]]], [831, `${sfe}.axis.h.${ros}`, 71, [[[], [168, [0, 828]]]]], [832, `${sfe}.vector.fromHead`, 40, [[[31, 62], [30, [0, 87]]], [[31, 63], [18, [0, 834], [0, 888]]], [[31, 64], [18, [0, 833], [0, 889]]], [[], [18, [0, 833], [0, 889]]]]], [833, `${sfe}.vector.fromNorth`, 40, [[[31, 64], [30, [0, 88]]], [[31, 62], [19, [0, 832], [0, 889]]], [[31, 63], [19, [0, 834], [0, 119]]], [[], [19, [0, 834], [0, 119]]]]], [834, `${sfe}.vector.fromUpslope`, 40, [[[31, 63], [30, [0, 89]]], [[31, 62], [19, [0, 832], [0, 888]]], [[31, 64], [18, [0, 833], [0, 119]]], [[], [18, [0, 833], [0, 119]]]]], [835, `${sfe}.size.area`, 54, [[[], [169, [0, 836], [0, 826]]]]], [836, `${sfe}.size.length`, 70, [[[], [170, [0, 827], [0, 86]]]]], [837, `${sfe}.size.perimeter`, 70, [[[], [171, [0, 836], [0, 838]]]]], [838, `${sfe}.size.width`, 70, [[[], [170, [0, 828], [0, 86]]]]], [839, `${sfe}.map.area`, 106, [[[], [172, [0, 835], [0, 97]]]]], [840, `${sfe}.map.length`, 108, [[[], [21, [0, 836], [0, 97]]]]], [841, `${sfe}.map.perimeter`, 108, [[[], [21, [0, 837], [0, 97]]]]], [842, `${sfe}.map.width`, 108, [[[], [21, [0, 838], [0, 97]]]]], [843, `${sfe}.back.spreadDistance`, 70, [[[], [170, [0, 847], [0, 86]]]]], [844, `${sfe}.back.${fli}`, 57, [[[], [173, [0, 858], [0, 861], [0, 847]]]]], [845, `${sfe}.back.${fl}`, 59, [[[], [17, [0, 844]]]]], [846, `${sfe}.back.mapDistance`, 108, [[[], [21, [0, 843], [0, 97]]]]], [847, `${sfe}.back.${ros}`, 71, [[[], [174, [0, 861], [0, 824]]]]], [848, `${sfe}.back.${sh}`, 68, [[[], [100, [0, 844], [0, 890], [0, 122]]]]], [849, `${sfe}.back.treeMortality`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 848]]]]], [850, `${sfe}.flank.spreadDistance`, 70, [[[], [170, [0, 854], [0, 86]]]]], [851, `${sfe}.flank.${fli}`, 57, [[[], [173, [0, 858], [0, 861], [0, 854]]]]], [852, `${sfe}.flank.${fl}`, 59, [[[], [17, [0, 851]]]]], [853, `${sfe}.flank.mapDistance`, 108, [[[], [21, [0, 850], [0, 97]]]]], [854, `${sfe}.flank.${ros}`, 71, [[[], [176, [0, 828]]]]], [855, `${sfe}.flank.${sh}`, 68, [[[], [100, [0, 851], [0, 890], [0, 122]]]]], [856, `${sfe}.flank.treeMortality`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 855]]]]], [857, `${sfe}.head.spreadDistance`, 70, [[[], [170, [0, 861], [0, 86]]]]], [858, `${sfe}.head.${fli}`, 57, [[[13, 61], [30, [0, 813]]], [[], [30, [0, 77]]]]], [859, `${sfe}.head.${fl}`, 59, [[[13, 61], [30, [0, 814]]], [[], [30, [0, 78]]]]], [860, `${sfe}.head.mapDistance`, 108, [[[], [21, [0, 857], [0, 97]]]]], [861, `${sfe}.head.${ros}`, 71, [[[13, 61], [30, [0, 820]]], [[], [30, [0, 83]]]]], [862, `${sfe}.head.${sh}`, 68, [[[], [100, [0, 858], [0, 890], [0, 122]]]]], [863, `${sfe}.head.treeMortality`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 862]]]]], [864, `${sfe}.psi.spreadDistance`, 70, [[[], [170, [0, 868], [0, 86]]]]], [865, `${sfe}.psi.${fli}`, 57, [[[], [173, [0, 858], [0, 861], [0, 868]]]]], [866, `${sfe}.psi.${fl}`, 59, [[[], [17, [0, 865]]]]], [867, `${sfe}.psi.mapDistance`, 108, [[[], [21, [0, 864], [0, 97]]]]], [868, `${sfe}.psi.${ros}`, 71, [[[], [177, [0, 832], [0, 829], [0, 830], [0, 831]]]]], [869, `${sfe}.psi.${sh}`, 68, [[[], [100, [0, 865], [0, 890], [0, 122]]]]], [870, `${sfe}.psi.treeMortality`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 869]]]]], [871, `${sfe}.beta5.spreadDistance`, 70, [[[], [170, [0, 875], [0, 86]]]]], [872, `${sfe}.beta5.${fli}`, 57, [[[], [173, [0, 858], [0, 861], [0, 882]]]]], [873, `${sfe}.beta5.${fl}`, 59, [[[], [17, [0, 872]]]]], [874, `${sfe}.beta5.mapDistance`, 108, [[[], [21, [0, 871], [0, 97]]]]], [875, `${sfe}.beta5.${ros}`, 71, [[[], [30, [0, 882]]]]], [876, `${sfe}.beta5.${sh}`, 68, [[[], [100, [0, 872], [0, 890], [0, 122]]]]], [877, `${sfe}.beta5.treeMortality`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 876]]]]], [878, `${sfe}.beta.spreadDistance`, 70, [[[], [170, [0, 882], [0, 86]]]]], [879, `${sfe}.beta.${fli}`, 57, [[[], [173, [0, 858], [0, 861], [0, 887]]]]], [880, `${sfe}.beta.${fl}`, 59, [[[], [17, [0, 879]]]]], [881, `${sfe}.beta.mapDistance`, 108, [[[], [21, [0, 878], [0, 97]]]]], [882, `${sfe}.beta.${ros}`, 71, [[[], [178, [0, 832], [0, 861], [0, 824]]]]], [883, `${sfe}.beta.${sh}`, 68, [[[], [100, [0, 879], [0, 890], [0, 122]]]]], [884, `${sfe}.beta.treeMortality`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 883]]]]], [885, `${sfe}.beta.theta`, 40, [[[], [179, [0, 832], [0, 829], [0, 830], [0, 831]]]]], [886, `${sfe}.beta.psi`, 40, [[[], [180, [0, 885], [0, 829], [0, 831]]]]], [887, `${sfe}.beta.psiSpreadRate`, 71, [[[], [177, [0, 886], [0, 829], [0, 830], [0, 831]]]]], [888, `${sfe}.heading.fromUpslope`, 40, [[[13, 61], [30, [0, 808]]], [[], [30, [0, 79]]]]], [889, `${sfe}.heading.fromNorth`, 40, [[[], [19, [0, 119], [0, 888]]]]], [890, `${sfe}.wind.speed.atMidflame`, 126, [[[13, 61], [30, [0, 811]]], [[], [30, [0, 136]]]]], [891, `site.terrain.spotSourceLocation`, 28, [[[], [2]]]], [892, `site.terrain.ridgeValleyDistance`, 69, [[[], [2]]]], [893, `site.terrain.ridgeValleyElevation`, 70, [[[], [2]]]], [894, `${spotb}.firebrand.criticalCoverHeight`, 124, [[[], [181, [0, 895], [0, 57]]]]], [895, `${spotb}.firebrand.height`, 124, [[[], [182, [0, 900]]]]], [896, `${spotb}.firebrand.drift`, 69, [[[], [9, [1, 16]]]]], [897, `${spotb}.spotDistance.flatTerrain`, 69, [[[], [183, [0, 895], [0, 894], [0, 135]]]]], [898, `${spotb}.spotDistance.flatTerrainWithDrift`, 69, [[[], [184, [0, 897], [0, 896]]]]], [899, `${spotb}.spotDistance.mountainTerrain`, 69, [[[], [185, [0, 898], [0, 891], [0, 892], [0, 893]]]]], [900, `${spotb}.flameHeight`, 59, [[[], [2]]]], [901, `${spotc}.firebrand.criticalCoverHeight`, 124, [[[], [9, [1, 16]]]]], [902, `${spotc}.firebrand.height`, 124, [[[], [186, [0, 908]]]]], [903, `${spotc}.firebrand.drift`, 69, [[[], [187, [0, 908]]]]], [904, `${spotc}.spotDistance.flatTerrain`, 69, [[[], [188, [0, 908]]]]], [905, `${spotc}.spotDistance.flatTerrainWithDrift`, 69, [[[], [189, [0, 908]]]]], [906, `${spotc}.spotDistance.mountainTerrain`, 69, [[[], [185, [0, 905], [0, 891], [0, 892], [0, 893]]]]], [907, `${spotc}.${fli}`, 57, [[[11, 65], [30, [0, 1214]]], [[], [190, [0, 85]]]]], [908, `${spotc}.firebrandObject`, 116, [[[], [191, [0, 46], [0, 135], [0, 907]]]]], [909, `${spots}.firebrand.criticalCoverHeight`, 124, [[[], [181, [0, 911], [0, 57]]]]], [910, `${spots}.${fli}`, 57, [[[15, 61], [30, [0, 813]]], [[], [30, [0, 77]]]]], [911, `${spots}.firebrand.height`, 124, [[[], [192, [0, 910], [0, 135]]]]], [912, `${spots}.firebrand.drift`, 69, [[[], [193, [0, 911], [0, 135]]]]], [913, `${spots}.spotDistance.flatTerrain`, 69, [[[], [183, [0, 911], [0, 909], [0, 135]]]]], [914, `${spots}.spotDistance.flatTerrainWithDrift`, 69, [[[], [184, [0, 913], [0, 912]]]]], [915, `${spots}.spotDistance.mountainTerrain`, 69, [[[], [185, [0, 914], [0, 891], [0, 892], [0, 893]]]]], [916, `${spott}.firebrand.criticalCoverHeight`, 124, [[[], [181, [0, 917], [0, 57]]]]], [917, `${spott}.firebrand.height`, 124, [[[], [194, [0, 923], [0, 926], [0, 927]]]]], [918, `${spott}.firebrand.drift`, 69, [[[], [9, [1, 16]]]]], [919, `${spott}.spotDistance.flatTerrain`, 69, [[[], [183, [0, 917], [0, 916], [0, 135]]]]], [920, `${spott}.spotDistance.flatTerrainWithDrift`, 69, [[[], [184, [0, 919], [0, 918]]]]], [921, `${spott}.spotDistance.mountainTerrain`, 69, [[[], [185, [0, 920], [0, 891], [0, 892], [0, 893]]]]], [922, `${spott}.species`, 29, [[[], [2]]]], [923, `${spott}.height`, 124, [[[], [2]]]], [924, `${spott}.dbh`, 123, [[[], [2]]]], [925, `${spott}.count`, 122, [[[], [2]]]], [926, `${spott}.flameHeight`, 59, [[[], [195, [0, 922], [0, 924], [0, 925]]]]], [927, `${spott}.flameDuration`, 58, [[[], [196, [0, 922], [0, 924], [0, 925]]]]], [928, `scorch.height`, 68, [[[14, 66], [100, [0, 77], [0, 136], [0, 122]]], [[], [30, [0, 817]]]]], [929, `mortality.${sh}`, 68, [[[16, 66], [30, [0, 84]]], [[], [30, [0, 928]]]]], [930, `mortality.rate`, 111, [[[], [175, [0, 60], [0, 59], [0, 46], [0, 42], [0, 929]]]]], [931, `mortality.crownLengthScorched`, 111, [[[], [197, [0, 46], [0, 42], [0, 929]]]]], [932, `mortality.crownVolumeScorched`, 111, [[[], [198, [0, 46], [0, 42], [0, 929]]]]], [933, `${ccfbdp}1.${dens}`, 92, [[[], [9, [1, 20]]]]], [934, `${ccfbdp}1.${heat}`, 84, [[[], [9, [1, 0]]]]], [935, `${ccfbdp}1.${load}`, 91, [[[], [9, [1, 67]]]]], [936, `${ccfbdp}1.${mois}`, 88, [[[], [30, [0, 111]]]]], [937, `${ccfbdp}1.${savr}`, 95, [[[], [9, [1, 37]]]]], [938, `${ccfbdp}1.${emc}`, 83, [[[], [9, [1, 26]]]]], [939, `${ccfbdp}1.${tmc}`, 99, [[[], [9, [1, 28]]]]], [940, `${ccfbdp}2.${dens}`, 92, [[[], [9, [1, 20]]]]], [941, `${ccfbdp}2.${heat}`, 84, [[[], [9, [1, 0]]]]], [942, `${ccfbdp}2.${load}`, 91, [[[], [9, [1, 68]]]]], [943, `${ccfbdp}2.${mois}`, 88, [[[], [30, [0, 112]]]]], [944, `${ccfbdp}2.${savr}`, 95, [[[], [9, [1, 32]]]]], [945, `${ccfbdp}2.${emc}`, 83, [[[], [9, [1, 26]]]]], [946, `${ccfbdp}2.${tmc}`, 99, [[[], [9, [1, 28]]]]], [947, `${ccfbdp}3.${dens}`, 92, [[[], [9, [1, 20]]]]], [948, `${ccfbdp}3.${heat}`, 84, [[[], [9, [1, 0]]]]], [949, `${ccfbdp}3.${load}`, 91, [[[], [9, [1, 69]]]]], [950, `${ccfbdp}3.${mois}`, 88, [[[], [30, [0, 113]]]]], [951, `${ccfbdp}3.${savr}`, 95, [[[], [9, [1, 22]]]]], [952, `${ccfbdp}3.${emc}`, 83, [[[], [9, [1, 26]]]]], [953, `${ccfbdp}3.${tmc}`, 99, [[[], [9, [1, 28]]]]], [954, `${ccfbdp}4.${dens}`, 92, [[[], [9, [1, 20]]]]], [955, `${ccfbdp}4.${heat}`, 84, [[[], [9, [1, 0]]]]], [956, `${ccfbdp}4.${load}`, 91, [[[], [9, [1, 16]]]]], [957, `${ccfbdp}4.${mois}`, 88, [[[], [30, [0, 111]]]]], [958, `${ccfbdp}4.${savr}`, 95, [[[], [9, [1, 70]]]]], [959, `${ccfbdp}4.${emc}`, 83, [[[], [9, [1, 26]]]]], [960, `${ccfbdp}4.${tmc}`, 99, [[[], [9, [1, 28]]]]], [961, `${ccfbdp}5.${dens}`, 92, [[[], [9, [1, 20]]]]], [962, `${ccfbdp}5.${heat}`, 84, [[[], [9, [1, 0]]]]], [963, `${ccfbdp}5.${load}`, 91, [[[], [9, [1, 16]]]]], [964, `${ccfbdp}5.${mois}`, 88, [[[], [9, [1, 35]]]]], [965, `${ccfbdp}5.${savr}`, 95, [[[], [9, [1, 8]]]]], [966, `${ccfbdp}5.${emc}`, 83, [[[], [9, [1, 26]]]]], [967, `${ccfbdp}5.${tmc}`, 99, [[[], [9, [1, 28]]]]], [968, `${ccfblp}1.${dens}`, 92, [[[], [9, [1, 20]]]]], [969, `${ccfblp}1.${heat}`, 84, [[[], [9, [1, 0]]]]], [970, `${ccfblp}1.${load}`, 91, [[[], [9, [1, 16]]]]], [971, `${ccfblp}1.${mois}`, 88, [[[], [30, [0, 115]]]]], [972, `${ccfblp}1.${savr}`, 95, [[[], [9, [1, 70]]]]], [973, `${ccfblp}1.${emc}`, 83, [[[], [9, [1, 26]]]]], [974, `${ccfblp}1.${tmc}`, 99, [[[], [9, [1, 28]]]]], [975, `${ccfblp}2.${dens}`, 92, [[[], [9, [1, 20]]]]], [976, `${ccfblp}2.${heat}`, 84, [[[], [9, [1, 0]]]]], [977, `${ccfblp}2.${load}`, 91, [[[], [9, [1, 68]]]]], [978, `${ccfblp}2.${mois}`, 88, [[[], [30, [0, 116]]]]], [979, `${ccfblp}2.${savr}`, 95, [[[], [9, [1, 70]]]]], [980, `${ccfblp}2.${emc}`, 83, [[[], [9, [1, 26]]]]], [981, `${ccfblp}2.${tmc}`, 99, [[[], [9, [1, 28]]]]], [982, `${ccfblp}3.${dens}`, 92, [[[], [9, [1, 20]]]]], [983, `${ccfblp}3.${heat}`, 84, [[[], [9, [1, 0]]]]], [984, `${ccfblp}3.${load}`, 91, [[[], [9, [1, 16]]]]], [985, `${ccfblp}3.${mois}`, 88, [[[], [9, [1, 35]]]]], [986, `${ccfblp}3.${savr}`, 95, [[[], [9, [1, 8]]]]], [987, `${ccfblp}3.${emc}`, 83, [[[], [9, [1, 26]]]]], [988, `${ccfblp}3.${tmc}`, 99, [[[], [9, [1, 28]]]]], [989, `${ccfblp}4.${dens}`, 92, [[[], [9, [1, 20]]]]], [990, `${ccfblp}4.${heat}`, 84, [[[], [9, [1, 0]]]]], [991, `${ccfblp}4.${load}`, 91, [[[], [9, [1, 16]]]]], [992, `${ccfblp}4.${mois}`, 88, [[[], [9, [1, 35]]]]], [993, `${ccfblp}4.${savr}`, 95, [[[], [9, [1, 8]]]]], [994, `${ccfblp}4.${emc}`, 83, [[[], [9, [1, 26]]]]], [995, `${ccfblp}4.${tmc}`, 99, [[[], [9, [1, 28]]]]], [996, `${ccfblp}5.${dens}`, 92, [[[], [9, [1, 20]]]]], [997, `${ccfblp}5.${heat}`, 84, [[[], [9, [1, 0]]]]], [998, `${ccfblp}5.${load}`, 91, [[[], [9, [1, 16]]]]], [999, `${ccfblp}5.${mois}`, 88, [[[], [9, [1, 35]]]]], [1000, `${ccfblp}5.${savr}`, 95, [[[], [9, [1, 8]]]]], [1001, `${ccfblp}5.${emc}`, 83, [[[], [9, [1, 26]]]]], [1002, `${ccfblp}5.${tmc}`, 99, [[[], [9, [1, 28]]]]], [1003, `${ccfbdp}1.${ef}.${ehn}`, 82, [[[], [44, [0, 937]]]]], [1004, `${ccfbdp}1.${ef}.${load}`, 91, [[[], [45, [0, 937], [0, 935], [1, 31]]]]], [1005, `${ccfbdp}1.${qig}`, 85, [[[], [46, [0, 936], [0, 1003]]]]], [1006, `${ccfbdp}1.net.${load}`, 91, [[[], [47, [0, 935], [0, 939]]]]], [1007, `${ccfbdp}1.${sc}`, 93, [[[], [48, [0, 937]]]]], [1008, `${ccfbdp}1.${sc}.${wf}`, 125, [[[], [49, [0, 1007], [0, 1114]]]]], [1009, `${ccfbdp}1.${sa}`, 94, [[[], [50, [0, 935], [0, 937], [0, 933]]]]], [1010, `${ccfbdp}1.${sa}.${wf}`, 125, [[[], [51, [0, 1009], [0, 1098]]]]], [1011, `${ccfbdp}1.volume`, 100, [[[], [52, [0, 935], [0, 933]]]]], [1012, `${ccfbdp}1.${ef}.waterLoad`, 91, [[[], [53, [0, 1004], [0, 936]]]]], [1013, `${ccfbdp}2.${ef}.${ehn}`, 82, [[[], [44, [0, 944]]]]], [1014, `${ccfbdp}2.${ef}.${load}`, 91, [[[], [45, [0, 944], [0, 942], [1, 31]]]]], [1015, `${ccfbdp}2.${qig}`, 85, [[[], [46, [0, 943], [0, 1013]]]]], [1016, `${ccfbdp}2.net.${load}`, 91, [[[], [47, [0, 942], [0, 946]]]]], [1017, `${ccfbdp}2.${sc}`, 93, [[[], [48, [0, 944]]]]], [1018, `${ccfbdp}2.${sc}.${wf}`, 125, [[[], [49, [0, 1017], [0, 1114]]]]], [1019, `${ccfbdp}2.${sa}`, 94, [[[], [50, [0, 942], [0, 944], [0, 940]]]]], [1020, `${ccfbdp}2.${sa}.${wf}`, 125, [[[], [51, [0, 1019], [0, 1098]]]]], [1021, `${ccfbdp}2.volume`, 100, [[[], [52, [0, 942], [0, 940]]]]], [1022, `${ccfbdp}2.${ef}.waterLoad`, 91, [[[], [53, [0, 1014], [0, 943]]]]], [1023, `${ccfbdp}3.${ef}.${ehn}`, 82, [[[], [44, [0, 951]]]]], [1024, `${ccfbdp}3.${ef}.${load}`, 91, [[[], [45, [0, 951], [0, 949], [1, 31]]]]], [1025, `${ccfbdp}3.${qig}`, 85, [[[], [46, [0, 950], [0, 1023]]]]], [1026, `${ccfbdp}3.net.${load}`, 91, [[[], [47, [0, 949], [0, 953]]]]], [1027, `${ccfbdp}3.${sc}`, 93, [[[], [48, [0, 951]]]]], [1028, `${ccfbdp}3.${sc}.${wf}`, 125, [[[], [49, [0, 1027], [0, 1114]]]]], [1029, `${ccfbdp}3.${sa}`, 94, [[[], [50, [0, 949], [0, 951], [0, 947]]]]], [1030, `${ccfbdp}3.${sa}.${wf}`, 125, [[[], [51, [0, 1029], [0, 1098]]]]], [1031, `${ccfbdp}3.volume`, 100, [[[], [52, [0, 949], [0, 947]]]]], [1032, `${ccfbdp}3.${ef}.waterLoad`, 91, [[[], [53, [0, 1024], [0, 950]]]]], [1033, `${ccfbdp}4.${ef}.${ehn}`, 82, [[[], [44, [0, 958]]]]], [1034, `${ccfbdp}4.${ef}.${load}`, 91, [[[], [45, [0, 958], [0, 956], [1, 31]]]]], [1035, `${ccfbdp}4.${qig}`, 85, [[[], [46, [0, 957], [0, 1033]]]]], [1036, `${ccfbdp}4.net.${load}`, 91, [[[], [47, [0, 956], [0, 960]]]]], [1037, `${ccfbdp}4.${sc}`, 93, [[[], [48, [0, 958]]]]], [1038, `${ccfbdp}4.${sc}.${wf}`, 125, [[[], [49, [0, 1037], [0, 1114]]]]], [1039, `${ccfbdp}4.${sa}`, 94, [[[], [50, [0, 956], [0, 958], [0, 954]]]]], [1040, `${ccfbdp}4.${sa}.${wf}`, 125, [[[], [51, [0, 1039], [0, 1098]]]]], [1041, `${ccfbdp}4.volume`, 100, [[[], [52, [0, 956], [0, 954]]]]], [1042, `${ccfbdp}4.${ef}.waterLoad`, 91, [[[], [53, [0, 1034], [0, 957]]]]], [1043, `${ccfbdp}5.${ef}.${ehn}`, 82, [[[], [44, [0, 965]]]]], [1044, `${ccfbdp}5.${ef}.${load}`, 91, [[[], [45, [0, 965], [0, 963], [1, 31]]]]], [1045, `${ccfbdp}5.${qig}`, 85, [[[], [46, [0, 964], [0, 1043]]]]], [1046, `${ccfbdp}5.net.${load}`, 91, [[[], [47, [0, 963], [0, 967]]]]], [1047, `${ccfbdp}5.${sc}`, 93, [[[], [48, [0, 965]]]]], [1048, `${ccfbdp}5.${sc}.${wf}`, 125, [[[], [49, [0, 1047], [0, 1114]]]]], [1049, `${ccfbdp}5.${sa}`, 94, [[[], [50, [0, 963], [0, 965], [0, 961]]]]], [1050, `${ccfbdp}5.${sa}.${wf}`, 125, [[[], [51, [0, 1049], [0, 1098]]]]], [1051, `${ccfbdp}5.volume`, 100, [[[], [52, [0, 963], [0, 961]]]]], [1052, `${ccfbdp}5.${ef}.waterLoad`, 91, [[[], [53, [0, 1044], [0, 964]]]]], [1053, `${ccfblp}1.${ef}.${ehn}`, 82, [[[], [44, [0, 972]]]]], [1054, `${ccfblp}1.${ef}.${load}`, 91, [[[], [45, [0, 972], [0, 970], [1, 41]]]]], [1055, `${ccfblp}1.${qig}`, 85, [[[], [46, [0, 971], [0, 1053]]]]], [1056, `${ccfblp}1.net.${load}`, 91, [[[], [47, [0, 970], [0, 974]]]]], [1057, `${ccfblp}1.${sc}`, 93, [[[], [48, [0, 972]]]]], [1058, `${ccfblp}1.${sc}.${wf}`, 125, [[[], [49, [0, 1057], [0, 1134]]]]], [1059, `${ccfblp}1.${sa}`, 94, [[[], [50, [0, 970], [0, 972], [0, 968]]]]], [1060, `${ccfblp}1.${sa}.${wf}`, 125, [[[], [51, [0, 1059], [0, 1118]]]]], [1061, `${ccfblp}1.volume`, 100, [[[], [52, [0, 970], [0, 968]]]]], [1062, `${ccfblp}2.${ef}.${ehn}`, 82, [[[], [44, [0, 979]]]]], [1063, `${ccfblp}2.${ef}.${load}`, 91, [[[], [45, [0, 979], [0, 977], [1, 41]]]]], [1064, `${ccfblp}2.${qig}`, 85, [[[], [46, [0, 978], [0, 1062]]]]], [1065, `${ccfblp}2.net.${load}`, 91, [[[], [47, [0, 977], [0, 981]]]]], [1066, `${ccfblp}2.${sc}`, 93, [[[], [48, [0, 979]]]]], [1067, `${ccfblp}2.${sc}.${wf}`, 125, [[[], [49, [0, 1066], [0, 1134]]]]], [1068, `${ccfblp}2.${sa}`, 94, [[[], [50, [0, 977], [0, 979], [0, 975]]]]], [1069, `${ccfblp}2.${sa}.${wf}`, 125, [[[], [51, [0, 1068], [0, 1118]]]]], [1070, `${ccfblp}2.volume`, 100, [[[], [52, [0, 977], [0, 975]]]]], [1071, `${ccfblp}3.${ef}.${ehn}`, 82, [[[], [44, [0, 986]]]]], [1072, `${ccfblp}3.${ef}.${load}`, 91, [[[], [45, [0, 986], [0, 984], [1, 41]]]]], [1073, `${ccfblp}3.${qig}`, 85, [[[], [46, [0, 985], [0, 1071]]]]], [1074, `${ccfblp}3.net.${load}`, 91, [[[], [47, [0, 984], [0, 988]]]]], [1075, `${ccfblp}3.${sc}`, 93, [[[], [48, [0, 986]]]]], [1076, `${ccfblp}3.${sc}.${wf}`, 125, [[[], [49, [0, 1075], [0, 1134]]]]], [1077, `${ccfblp}3.${sa}`, 94, [[[], [50, [0, 984], [0, 986], [0, 982]]]]], [1078, `${ccfblp}3.${sa}.${wf}`, 125, [[[], [51, [0, 1077], [0, 1118]]]]], [1079, `${ccfblp}3.volume`, 100, [[[], [52, [0, 984], [0, 982]]]]], [1080, `${ccfblp}4.${ef}.${ehn}`, 82, [[[], [44, [0, 993]]]]], [1081, `${ccfblp}4.${ef}.${load}`, 91, [[[], [45, [0, 993], [0, 991], [1, 41]]]]], [1082, `${ccfblp}4.${qig}`, 85, [[[], [46, [0, 992], [0, 1080]]]]], [1083, `${ccfblp}4.net.${load}`, 91, [[[], [47, [0, 991], [0, 995]]]]], [1084, `${ccfblp}4.${sc}`, 93, [[[], [48, [0, 993]]]]], [1085, `${ccfblp}4.${sc}.${wf}`, 125, [[[], [49, [0, 1084], [0, 1134]]]]], [1086, `${ccfblp}4.${sa}`, 94, [[[], [50, [0, 991], [0, 993], [0, 989]]]]], [1087, `${ccfblp}4.${sa}.${wf}`, 125, [[[], [51, [0, 1086], [0, 1118]]]]], [1088, `${ccfblp}4.volume`, 100, [[[], [52, [0, 991], [0, 989]]]]], [1089, `${ccfblp}5.${ef}.${ehn}`, 82, [[[], [44, [0, 1000]]]]], [1090, `${ccfblp}5.${ef}.${load}`, 91, [[[], [45, [0, 1000], [0, 998], [1, 41]]]]], [1091, `${ccfblp}5.${qig}`, 85, [[[], [46, [0, 999], [0, 1089]]]]], [1092, `${ccfblp}5.net.${load}`, 91, [[[], [47, [0, 998], [0, 1002]]]]], [1093, `${ccfblp}5.${sc}`, 93, [[[], [48, [0, 1000]]]]], [1094, `${ccfblp}5.${sc}.${wf}`, 125, [[[], [49, [0, 1093], [0, 1134]]]]], [1095, `${ccfblp}5.${sa}`, 94, [[[], [50, [0, 998], [0, 1000], [0, 996]]]]], [1096, `${ccfblp}5.${sa}.${wf}`, 125, [[[], [51, [0, 1095], [0, 1118]]]]], [1097, `${ccfblp}5.volume`, 100, [[[], [52, [0, 998], [0, 996]]]]], [1098, `${ccfbd}.${sa}`, 94, [[[], [54, [0, 1009], [0, 1019], [0, 1029], [0, 1039], [0, 1049]]]]], [1099, `${ccfbd}.${sa}.${wf}`, 125, [[[], [21, [0, 1098], [0, 1153]]]]], [1100, `${ccfbd}.mineralDamping`, 55, [[[], [55, [0, 1113]]]]], [1101, `${ccfbd}.moistureDamping`, 55, [[[], [56, [0, 1107], [0, 1105]]]]], [1102, `${ccfbd}.${heat}`, 84, [[[], [57, [0, 1010], [0, 1020], [0, 1030], [0, 1040], [0, 1050], [0, 934], [0, 941], [0, 948], [0, 955], [0, 962]]]]], [1103, `${ccfbd}.${load}`, 91, [[[], [54, [0, 935], [0, 942], [0, 949], [0, 956], [0, 963]]]]], [1104, `${ccfbd}.${ef}.${load}`, 91, [[[], [54, [0, 1004], [0, 1014], [0, 1024], [0, 1034], [0, 1044]]]]], [1105, `${ccfbd}.extinction.${mois}`, 88, [[[], [9, [1, 47]]]]], [1106, `${ccfbd}.extinction.${mois}Factor`, 37, [[[], [58, [0, 1104], [0, 1124]]]]], [1107, `${ccfbd}.${mois}`, 88, [[[], [57, [0, 1010], [0, 1020], [0, 1030], [0, 1040], [0, 1050], [0, 936], [0, 943], [0, 950], [0, 957], [0, 964]]]]], [1108, `${ccfbd}.volume`, 75, [[[], [54, [0, 1011], [0, 1021], [0, 1031], [0, 1041], [0, 1051]]]]], [1109, `${ccfbd}.${qig}`, 85, [[[], [57, [0, 1010], [0, 1020], [0, 1030], [0, 1040], [0, 1050], [0, 1005], [0, 1015], [0, 1025], [0, 1035], [0, 1045]]]]], [1110, `${ccfbd}.${rxi}`, 65, [[[], [22, [0, 1111], [0, 1101]]]]], [1111, `${ccfbd}.${rxi}Dry`, 65, [[[], [59, [0, 1150], [0, 1115], [0, 1102], [0, 1100]]]]], [1112, `${ccfbd}.${savr}`, 95, [[[], [57, [0, 1010], [0, 1020], [0, 1030], [0, 1040], [0, 1050], [0, 937], [0, 944], [0, 951], [0, 958], [0, 965]]]]], [1113, `${ccfbd}.${emc}`, 83, [[[], [57, [0, 1010], [0, 1020], [0, 1030], [0, 1040], [0, 1050], [0, 938], [0, 945], [0, 952], [0, 959], [0, 966]]]]], [1114, `${ccfbd}.${sc}.${wf}`, 125, [[[], [60, [0, 1009], [0, 1007], [0, 1019], [0, 1017], [0, 1029], [0, 1027], [0, 1039], [0, 1037], [0, 1049], [0, 1047]]]]], [1115, `${ccfbd}.net.${load}`, 91, [[[], [57, [0, 1008], [0, 1018], [0, 1028], [0, 1038], [0, 1048], [0, 1006], [0, 1016], [0, 1026], [0, 1036], [0, 1046]]]]], [1116, `${ccfbd}.${ef}.waterLoad`, 91, [[[], [54, [0, 1012], [0, 1022], [0, 1032], [0, 1042], [0, 1052]]]]], [1117, `${ccfbd}.${ef}.${mois}`, 88, [[[], [21, [0, 1116], [0, 1104]]]]], [1118, `${ccfbl}.${sa}`, 94, [[[], [54, [0, 1059], [0, 1068], [0, 1077], [0, 1086], [0, 1095]]]]], [1119, `${ccfbl}.${sa}.${wf}`, 125, [[[], [21, [0, 1118], [0, 1153]]]]], [1120, `${ccfbl}.mineralDamping`, 55, [[[], [55, [0, 1133]]]]], [1121, `${ccfbl}.moistureDamping`, 55, [[[], [56, [0, 1127], [0, 1125]]]]], [1122, `${ccfbl}.${heat}`, 84, [[[], [57, [0, 1060], [0, 1069], [0, 1078], [0, 1087], [0, 1096], [0, 969], [0, 976], [0, 983], [0, 990], [0, 997]]]]], [1123, `${ccfbl}.${load}`, 91, [[[], [54, [0, 970], [0, 977], [0, 984], [0, 991], [0, 998]]]]], [1124, `${ccfbl}.${ef}.${load}`, 91, [[[], [54, [0, 1054], [0, 1063], [0, 1072], [0, 1081], [0, 1090]]]]], [1125, `${ccfbl}.extinction.${mois}`, 88, [[[], [61, [0, 1126], [0, 1117], [0, 1105]]]]], [1126, `${ccfbl}.extinction.${mois}Factor`, 37, [[[], [58, [0, 1104], [0, 1124]]]]], [1127, `${ccfbl}.${mois}`, 88, [[[], [57, [0, 1060], [0, 1069], [0, 1078], [0, 1087], [0, 1096], [0, 971], [0, 978], [0, 985], [0, 992], [0, 999]]]]], [1128, `${ccfbl}.volume`, 75, [[[], [54, [0, 1061], [0, 1070], [0, 1079], [0, 1088], [0, 1097]]]]], [1129, `${ccfbl}.${qig}`, 85, [[[], [57, [0, 1060], [0, 1069], [0, 1078], [0, 1087], [0, 1096], [0, 1055], [0, 1064], [0, 1073], [0, 1082], [0, 1091]]]]], [1130, `${ccfbl}.${rxi}`, 65, [[[], [22, [0, 1131], [0, 1121]]]]], [1131, `${ccfbl}.${rxi}Dry`, 65, [[[], [59, [0, 1150], [0, 1135], [0, 1122], [0, 1120]]]]], [1132, `${ccfbl}.${savr}`, 95, [[[], [57, [0, 1060], [0, 1069], [0, 1078], [0, 1087], [0, 1096], [0, 972], [0, 979], [0, 986], [0, 993], [0, 1000]]]]], [1133, `${ccfbl}.${emc}`, 83, [[[], [57, [0, 1060], [0, 1069], [0, 1078], [0, 1087], [0, 1096], [0, 973], [0, 980], [0, 987], [0, 994], [0, 1001]]]]], [1134, `${ccfbl}.${sc}.${wf}`, 125, [[[], [60, [0, 1059], [0, 1057], [0, 1068], [0, 1066], [0, 1077], [0, 1075], [0, 1086], [0, 1084], [0, 1095], [0, 1093]]]]], [1135, `${ccfbl}.net.${load}`, 91, [[[], [57, [0, 1058], [0, 1067], [0, 1076], [0, 1085], [0, 1094], [0, 1056], [0, 1065], [0, 1074], [0, 1083], [0, 1092]]]]], [1136, `${ccfb}.depth`, 75, [[[], [9, [1, 8]]]]], [1137, `${ccfb}.bulkDensity`, 74, [[[], [21, [0, 1141], [0, 1136]]]]], [1138, `${ccfb}.${qig}`, 76, [[[], [57, [0, 1099], [0, 1119], [0, 1109], [0, 1129]]]]], [1139, `${ccfb}.heatSink`, 86, [[[], [62, [0, 1138], [0, 1137]]]]], [1140, `${ccfb}.noWindNoSlope.${ros}`, 71, [[[], [63, [0, 1147], [0, 1146], [0, 1139]]]]], [1141, `${ccfb}.${load}`, 91, [[[], [54, [0, 1103], [0, 1123]]]]], [1142, `${ccfb}.open.${waf}`, 127, [[[], [64, [0, 1136]]]]], [1143, `${ccfb}.packingRatio`, 77, [[[], [65, [0, 1108], [0, 1128], [0, 1136]]]]], [1144, `${ccfb}.packingRatio.optimum`, 77, [[[], [66, [0, 1151]]]]], [1145, `${ccfb}.packingRatio.ratio`, 77, [[[], [21, [0, 1143], [0, 1144]]]]], [1146, `${ccfb}.propagatingFluxRatio`, 64, [[[], [67, [0, 1151], [0, 1143]]]]], [1147, `${ccfb}.${rxi}`, 65, [[[], [54, [0, 1110], [0, 1130]]]]], [1148, `${ccfb}.reactionVelocityExponent`, 37, [[[], [68, [0, 1151]]]]], [1149, `${ccfb}.reactionVelocityMaximum`, 66, [[[], [69, [0, 1152]]]]], [1150, `${ccfb}.reactionVelocityOptimum`, 66, [[[], [70, [0, 1145], [0, 1149], [0, 1148]]]]], [1151, `${ccfb}.${savr}`, 95, [[[], [57, [0, 1099], [0, 1119], [0, 1112], [0, 1132]]]]], [1152, `${ccfb}.savr15`, 37, [[[], [71, [0, 1151]]]]], [1153, `${ccfb}.${sa}`, 94, [[[], [54, [0, 1098], [0, 1118]]]]], [1154, `${ccff}.maximumDirection.slope.${ros}`, 71, [[[], [72, [0, 1203], [0, 1167]]]]], [1155, `${ccff}.maximumDirection.wind.${ros}`, 71, [[[], [73, [0, 1203], [0, 1190]]]]], [1156, `${ccff}.wind.heading.fromUpslope`, 40, [[[], [9, [1, 16]]]]], [1157, `${ccff}.maximumDirection.xComponent`, 37, [[[], [74, [0, 1155], [0, 1154], [0, 1156]]]]], [1158, `${ccff}.maximumDirection.yComponent`, 37, [[[], [75, [0, 1155], [0, 1156]]]]], [1159, `${ccff}.maximumDirection.${ros}`, 71, [[[], [76, [0, 1157], [0, 1158]]]]], [1160, `${ccff}.limit.${ews}.exceeded`, 34, [[[], [77, [0, 1171], [0, 1162]]]]], [1161, `${ccff}.limit.${ros}.exceeded`, 35, [[[], [77, [0, 1173], [0, 1179]]]]], [1162, `${ccff}.limit.${ews}`, 126, [[[], [78, [0, 1200]]]]], [1163, `${ccff}.limit.windSlopeSpreadRateCoefficient`, 37, [[[], [79, [0, 1162], [0, 1185], [0, 1188]]]]], [1164, `${ccff}.limit.${ros}`, 71, [[[], [80, [0, 1203], [0, 1163]]]]], [1165, `${ccff}.slope.ratio`, 115, [[[], [9, [1, 16]]]]], [1166, `${ccff}.slope.k`, 37, [[[], [81, [0, 1143]]]]], [1167, `${ccff}.slope.phi`, 37, [[[], [82, [0, 1165], [0, 1166]]]]], [1168, `${ccff}.spread.step1.${ews}`, 126, [[[], [83, [0, 1169], [0, 1185], [0, 1189]]]]], [1169, `${ccff}.spread.step1.${phiew}`, 37, [[[], [84, [0, 1190], [0, 1167]]]]], [1170, `${ccff}.spread.step1.${ros}`, 71, [[[], [80, [0, 1203], [0, 1169]]]]], [1171, `${ccff}.spread.step2.${ews}`, 126, [[[], [83, [0, 1172], [0, 1185], [0, 1189]]]]], [1172, `${ccff}.spread.step2.${phiew}`, 37, [[[], [85, [0, 1203], [0, 1173]]]]], [1173, `${ccff}.spread.step2.${ros}`, 71, [[[], [86, [0, 1203], [0, 1159]]]]], [1174, `${ccff}.spread.step3a.${ews}`, 126, [[[], [87, [0, 1171], [0, 1162]]]]], [1175, `${ccff}.spread.step3a.${phiew}`, 37, [[[], [87, [0, 1172], [0, 1163]]]]], [1176, `${ccff}.spread.step3a.${ros}`, 71, [[[], [87, [0, 1173], [0, 1164]]]]], [1177, `${ccff}.spread.step3b.${ews}`, 126, [[[], [83, [0, 1178], [0, 1185], [0, 1189]]]]], [1178, `${ccff}.spread.step3b.${phiew}`, 37, [[[], [85, [0, 1203], [0, 1179]]]]], [1179, `${ccff}.spread.step3b.${ros}`, 71, [[[], [88, [0, 1173], [0, 1171]]]]], [1180, `${ccff}.spread.step4.${ews}`, 126, [[[], [83, [0, 1181], [0, 1185], [0, 1189]]]]], [1181, `${ccff}.spread.step4.${phiew}`, 37, [[[], [85, [0, 1203], [0, 1182]]]]], [1182, `${ccff}.spread.step4.${ros}`, 71, [[[], [88, [0, 1176], [0, 1174]]]]], [1183, `${ccff}.${waf}`, 127, [[[], [9, [1, 46]]]]], [1184, `${ccff}.wind.speed.atMidflame`, 126, [[[26, 19], [30, [0, 136]]], [[], [42, [0, 135], [0, 1183]]]]], [1185, `${ccff}.wind.factor.b`, 37, [[[], [90, [0, 1151]]]]], [1186, `${ccff}.wind.factor.c`, 37, [[[], [91, [0, 1151]]]]], [1187, `${ccff}.wind.factor.e`, 37, [[[], [92, [0, 1151]]]]], [1188, `${ccff}.wind.factor.k`, 37, [[[], [93, [0, 1145], [0, 1187], [0, 1186]]]]], [1189, `${ccff}.wind.factor.i`, 37, [[[], [94, [0, 1145], [0, 1187], [0, 1186]]]]], [1190, `${ccff}.wind.phi`, 37, [[[], [95, [0, 1184], [0, 1185], [0, 1188]]]]], [1191, `${ccff}.${ews}`, 126, [[[29, 49], [30, [0, 1180]]], [[], [30, [0, 1177]]]]], [1192, `${ccff}.${fli}`, 57, [[[], [96, [0, 1202], [0, 1200], [0, 1194]]]]], [1193, `${ccff}.${fl}`, 59, [[[], [17, [0, 1192]]]]], [1194, `${ccff}.${taur}`, 67, [[[], [97, [0, 1151]]]]], [1195, `${ccff}.heading.fromUpslope`, 40, [[[], [98, [0, 1157], [0, 1158], [0, 1159]]]]], [1196, `${ccff}.heading.fromNorth`, 40, [[[], [19, [0, 119], [0, 1195]]]]], [1197, `${ccff}.${hpua}`, 60, [[[], [99, [0, 1200], [0, 1194]]]]], [1198, `${ccff}.${lwr}`, 61, [[[], [20, [0, 1191]]]]], [1199, `${ccff}.${phiew}`, 37, [[[29, 49], [30, [0, 1181]]], [[], [30, [0, 1178]]]]], [1200, `${ccff}.${rxi}`, 65, [[[], [30, [0, 1147]]]]], [1201, `${ccff}.${sh}`, 68, [[[], [100, [0, 1192], [0, 1184], [0, 122]]]]], [1202, `${ccff}.${ros}`, 71, [[[29, 49], [30, [0, 1182]]], [[], [30, [0, 1179]]]]], [1203, `${ccff}.noWindNoSlope.${ros}`, 71, [[[], [30, [0, 1140]]]]], [1204, `${cfa}.size.area`, 54, [[[], [199, [0, 1205], [0, 1212]]]]], [1205, `${cfa}.size.length`, 70, [[[], [170, [0, 1213], [0, 86]]]]], [1206, `${cfa}.size.perimeter`, 70, [[[], [200, [0, 1205], [0, 1212]]]]], [1207, `${cfa}.size.width`, 70, [[[], [21, [0, 1205], [0, 1212]]]]], [1208, `${cfa}.map.area`, 106, [[[], [172, [0, 1204], [0, 97]]]]], [1209, `${cfa}.map.length`, 108, [[[], [21, [0, 1205], [0, 97]]]]], [1210, `${cfa}.map.perimeter`, 108, [[[], [21, [0, 1206], [0, 97]]]]], [1211, `${cfa}.map.width`, 108, [[[], [21, [0, 1207], [0, 97]]]]], [1212, `${cfa}.${lwr}`, 61, [[[], [201, [0, 135]]]]], [1213, `${cfa}.${ros}`, 71, [[[], [202, [0, 1202]]]]], [1214, `${cfa}.${fli}`, 57, [[[], [203, [0, 1216], [0, 1213]]]]], [1215, `${cfa}.${fl}`, 59, [[[], [204, [0, 1214]]]]], [1216, `${cfa}.${hpua}`, 60, [[[], [205, [0, 47], [0, 1252]]]]], [1217, `${cfa}.powerOfTheFire`, 62, [[[], [206, [0, 1214]]]]], [1218, `${cfa}.powerOfTheWind`, 62, [[[], [207, [0, 135], [0, 1213]]]]], [1219, `${cfa}.powerRatio`, 63, [[[], [21, [0, 1217], [0, 1218]]]]], [1220, `${cfa}.isPlumeDominated`, 32, [[[], [208, [0, 1219]]]]], [1221, `${cfa}.isWindDriven`, 32, [[[], [209, [0, 1219]]]]], [1222, `${cff}.size.area`, 54, [[[], [199, [0, 1223], [0, 1212]]]]], [1223, `${cff}.size.length`, 70, [[[], [170, [0, 1232], [0, 86]]]]], [1224, `${cff}.size.perimeter`, 70, [[[], [200, [0, 1223], [0, 1212]]]]], [1225, `${cff}.size.width`, 70, [[[], [21, [0, 1223], [0, 1212]]]]], [1226, `${cff}.map.area`, 106, [[[], [172, [0, 1222], [0, 97]]]]], [1227, `${cff}.map.length`, 108, [[[], [21, [0, 1223], [0, 97]]]]], [1228, `${cff}.map.perimeter`, 108, [[[], [21, [0, 1224], [0, 97]]]]], [1229, `${cff}.map.width`, 108, [[[], [21, [0, 1225], [0, 97]]]]], [1230, `${cff}.rSa`, 71, [[[], [210, [0, 1248], [0, 345], [0, 388], [0, 390], [0, 393], [0, 372]]]]], [1231, `${cff}.crownFractionBurned`, 43, [[[], [211, [0, 407], [0, 1237], [0, 1230]]]]], [1232, `${cff}.${ros}`, 71, [[[], [212, [0, 407], [0, 1213], [0, 1231]]]]], [1233, `${cff}.${fli}`, 57, [[[], [213, [0, 1232], [0, 1231], [0, 47], [0, 1252]]]]], [1234, `${cff}.${fl}`, 57, [[[], [204, [0, 1233]]]]], [1235, `${cfi}.${fli}`, 57, [[[], [214, [0, 49], [0, 42]]]]], [1236, `${cfi}.${fl}`, 59, [[[], [17, [0, 1235]]]]], [1237, `${cfi}.${ros}`, 71, [[[], [215, [0, 1235], [0, 1252]]]]], [1238, `${cfi}.rPrime`, 71, [[[], [216, [0, 48]]]]], [1239, `${cfi}.transitionRatio`, 45, [[[], [217, [0, 1250], [0, 1235]]]]], [1240, `${cfi}.canTransition`, 32, [[[], [218, [0, 1239]]]]], [1241, `${cfi}.activeRatio`, 42, [[[], [219, [0, 1213], [0, 1238]]]]], [1242, `${cfi}.type`, 21, [[[], [220, [0, 1239], [0, 1241]]]]], [1243, `${cfi}.isActiveCrownFire`, 32, [[[], [221, [0, 1239], [0, 1241]]]]], [1244, `${cfi}.isCrownFire`, 32, [[[], [222, [0, 1239], [0, 1241]]]]], [1245, `${cfi}.isPassiveCrownFire`, 32, [[[], [223, [0, 1239], [0, 1241]]]]], [1246, `${cfi}.isConditionalCrownFire`, 32, [[[], [224, [0, 1239], [0, 1241]]]]], [1247, `${cfi}.isSurfaceFire`, 32, [[[], [225, [0, 1239], [0, 1241]]]]], [1248, `${cfi}.oActive`, 126, [[[], [226, [0, 48], [0, 1200], [0, 1139], [0, 1167]]]]], [1249, `${cfi}.crowningIndex`, 37, [[[], [227, [0, 1248]]]]], [1250, `crown.fire.surface.${fli}`, 57, [[[10, 61], [30, [0, 813]]], [[], [30, [0, 77]]]]], [1251, `crown.fire.surface.${fl}`, 59, [[[10, 61], [30, [0, 814]]], [[], [30, [0, 78]]]]], [1252, `crown.fire.surface.${hpua}`, 60, [[[10, 61], [30, [0, 815]]], [[], [30, [0, 81]]]]]]
};

/**
 * @file Sim class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
 */
class Sim {
  constructor(dagKey = null) {
    this._genome = CompiledGenome; // Map of gene key => index into this._genome

    this._geneKeyIdxMap = new Map();

    this._genome.genesArray.forEach(gene => this._geneKeyIdxMap.set(gene[1], gene[0])); // Map of independent simulation DAGs based upon this._genome


    this._dagMap = new Map();

    if (dagKey !== null) {
      this.createDag(dagKey);
    }
  }

  _ensureKey(key) {
    if (!this._geneKeyIdxMap.has(key)) {
      throw new Error(`Genome has no Gene with key '${key}'`);
    }

    return this._geneKeyIdxMap.get(key);
  }

  genes() {
    return this._genome.genesArray;
  } // Returns the gene based on an either a numerical index arg or a string key arg


  gene(arg) {
    const idx = typeof arg === 'number' ? arg : this._ensureKey(arg);
    return this._genome.genesArray[idx];
  } // Returns the *index* of the gene based on an either a numerical index arg or a string key arg


  geneIndex(arg) {
    return this.gene(arg)[0];
  }

  literal(literalIdx) {
    return this._genome.literalArgsArray[literalIdx];
  }

  method(methodIdx) {
    return this._genome.methodRefsArray[methodIdx];
  } // Dag methods


  createDag(dagKey) {
    const dag = new Dag(this);

    this._dagMap.set(dagKey, dag);

    return dag;
  }

  dagKeys() {
    return Array.from(this._dagMap.keys());
  }

  deleteDag(dagKey) {
    this._dagMap.delete(dagKey);
  }

  getDag(dagKey) {
    return this._dagMap.get(dagKey);
  }

  hasDag(dagKey) {
    return this._dagMap.has(dagKey);
  }

}

/**
 * @file StorageNodeMap class stores results in a Map(<DagNode> => <valuesArray>)
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
class StorageNodeMap extends StorageAbstract {
  constructor(dag) {
    super(dag);
    this._nodeArray = []; // Array of references to all DagNodes to be saved

    this._valueTable = []; // first subscript is DagNode idx, second subscript is runIdx

    this._valueMap = new Map(); // Map of DagNode reference => run results array
  } // Called by Dag UpdaterClass after all runs


  end() {
    // Creates a Map of <dagNode> => <resultsArray>
    for (let idx = 0; idx < this._nodeArray.length; idx++) {
      this._valueMap.set(this._nodeArray[idx], this._valueTable[idx]);
    }
  }
  /**
   * Returns a reference to a DagNode given its reference, genome key, or genome numeric index
   *
   * @param {DagNode|string|number} something A DagNode reference, key, or Genome index
   * @returns {DagNode} Reference to the passed node locator.
   */


  get(something, idx = -1) {
    const node = this._dag.get(something);

    return idx >= 0 ? this._valueMap.get(node)[idx] : this._valueMap.get(node);
  }

  init() {
    this._valueMap = new Map();
    this._valueTable = []; // first subscript is DagNode idx, second subscript is runIdx

    this._nodeArray = [...this._dag.requiredInputNodes(), ...this._dag.selectedNodes()];

    for (let idx = 0; idx < this._nodeArray.length; idx++) {
      this._valueTable.push([]);
    }
  } // Called by Dag UpdaterClass at the end of each DAG value update traversal


  store() {
    for (let idx = 0; idx < this._nodeArray.length; idx++) {
      this._valueTable[idx].push(this._nodeArray[idx].value());
    }
  }

}

/**
 * @file UpdateOrthogonalRecursive class
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
/**
 * Generates a set of result values for all combinations of the this._dag.input values.
 *
 * For example, if fuel model has 2 input values, 1-h dead moisture has 3 input values,
 * and wind speed has 4 input values, then 2 x 3 x 4 = 24 results are generated.
 */

class UpdateOrthogonalRecursive extends UpdateAbstract {
  constructor(dag) {
    super(dag);
    this._stack = [];
    this._inputSet = new Set();
    this._result = {};
  }

  update() {
    this._result = {
      runs: 0,
      calls: 0,
      ok: true,
      message: ''
    };
    this._stack = this._dag.requiredUpdateNodes(); // All required updteable (non-Config) DagNodes in topo order

    this._inputSet = new Set(); // map of input value indices

    this._dag.requiredInputNodes().forEach(node => this._inputSet.add(node));

    this._dag._storageClass.init();

    this.recurse(0);

    this._dag._storageClass.end();

    return this._result;
  }

  recurse(stackIdx) {
    if (!this._result.ok) return; // If at the end of the stack...

    if (stackIdx === this._stack.length) {
      this._dag._storageClass.store();

      this._result.runs += 1;

      if (this._result.runs >= this._dag._runLimit) {
        this._result.message = `Run limit of ${this._dag._runLimit} exceeded.`;
        this._result.ok = false;
      }

      return;
    }

    const node = this._stack[stackIdx];

    if (this._inputSet.has(node)) {
      // this is a required, non-Config input dagNode
      this._dag._input.get(node).forEach(value => {
        // loop over each input value
        node._value = value;
        this.recurse(stackIdx + 1);
      });
    } else {
      node.updateValue();
      this._result.calls++;
      this.recurse(stackIdx + 1);
    }
  }

}

/**
 * @file Dag class public implementation
 * @copyright 2021 Systems for Environmental Management
 * @author Collin D. Bevins, <cbevins@montana.com>
 * @license MIT
*/
// This is a bolt-on extension of the Dag to implement BehavePlus Modules
class BehavePlusModules {
  constructor(dag) {
    this._dag = dag; // Set *this* BehavePlusModules instance as the Dag.configure() callback hook

    this._dag._configureClass = this; // Define the module DagNode keys and their member DagNode key prefixes

    this._modules = [['module.surfaceFire', ['surface.primary.', 'surface.secondary.', 'surface.weighted.']], ['module.surfaceSpot', ['spotting.surfaceFire.']], ['module.crownFire', ['crown.']], ['module.crownSpot', ['spotting.crownFire.']], ['module.fireEllipse', ['surface.fire.ellipse.']], ['module.fireContain', ['contain.']], ['module.scorchHeight', ['scorch.']], ['module.treeMortality', ['mortality.']], ['module.spotting', ['spotting.burningPile.', 'spotting.torchingTrees.']], ['module.ignitionProbability', ['ignition.']]]; // Define the link DagNode keys and their linkedTo* edge and consumer and producer dagNode keys

    this._links = [['link.crownFire', 'linkedToSurfaceFire', 'module.crownFire', 'module.surfaceFire'], ['link.crownSpot', 'linkedToCrownFire', 'module.crownSpot', 'module.crownFire'], ['link.fireContain', 'linkedToFireEllipse', 'module.fireContain', 'module.fireEllipse'], ['link.fireEllipse', 'linkedToSurfaceFire', 'module.fireEllipse', 'module.surfaceFire'], ['link.scorchHeight', 'linkedToSurfaceFire', 'module.scorchHeight', 'module.surfaceFire'], ['link.surfaceSpot', 'linkedToSurfaceFire', 'module.surfaceSpot', 'module.surfaceFire'], ['link.treeMortality', 'linkedToScorchHeight', 'module.treeMortality', 'module.scorchHeight']];
  } // Activate modules specified in [<moduleKeys>]


  activate(moduleKeys) {
    moduleKeys = Array.isArray(moduleKeys) ? moduleKeys : [moduleKeys];

    this._dag.configure(moduleKeys.map(moduleKey => [moduleKey, 'active']));
  } // Activate all 10 modules


  activateAll() {
    this._dag.configure(this._modules.map(mod => [mod[0], 'active']));
  } // Called by Dag.configure() AFTER setting the passed Config DagNode values,
  // but BEFORE calling Dag.setTopology()


  configure() {
    // Only link adjacent Modules if they are both active
    this._links.forEach(([linkKey, linkedValue, consumerKey, producerKey]) => {
      if (this._dag.node(consumerKey).value() === 'active' && this._dag.node(producerKey).value() === 'active') {
        this._dag.node(linkKey)._value = linkedValue;
      } else {
        this._dag.node(linkKey)._value = 'standAlone';
      }
    }); // Enable/disable DagNodes based on whether their Module is active/inactive


    this._modules.forEach(([moduleKey, prefixes]) => {
      this._dag.setEnabled(prefixes, this._dag.node(moduleKey).value() === 'active');
    });
  } // De-activate modules specified in [<moduleKeys>]


  deactivate(moduleKeys) {
    moduleKeys = Array.isArray(moduleKeys) ? moduleKeys : [moduleKeys];

    this._dag.configure(moduleKeys.map(moduleKey => [moduleKey, 'inactive']));
  } // De-activate all 10 modules


  deactivateAll() {
    this._dag.configure(this._modules.map(mod => [mod[0], 'inactive']));
  }

  linkKeys() {
    return this._links.map(link => link[0]);
  }

  linkNodes() {
    return this._links.map(link => this._dag.node(link[0]));
  }

  moduleKeys() {
    return this._modules.map(mod => mod[0]);
  } // Returns an array of references to all DagNodes that are members of moduleKey


  moduleMembers(moduleKey) {
    const module = this._modules.find(mod => mod[0] === moduleKey);

    return module === undefined ? [] : this.nodesThatStartWith(module[1]);
  }

  moduleNodes() {
    return this._modules.map(mod => this._dag.node(mod[0]));
  } // Returns an array of references to all DagNodes matching and of the [prefixes]


  nodesThatStartWith(prefixes) {
    const nodes = [];

    this._dag.nodes().forEach(node => {
      const key = node.key();

      for (let idx = 0; idx < prefixes.length; idx++) {
        if (key.startsWith(prefixes[idx])) {
          nodes.push(node);
          break;
        }
      }
    });

    return nodes;
  }

}

const columnHeaders = new Map([['key', 'Key'], ['label', 'Label'], ['index', 'Index'], ['order', 'Order'], ['displayValue', 'Display Value'], ['displayUnits', 'Display Units'], ['nativeValue', 'Native Value'], ['nativeUnits', 'Native Units'], ['variantKey', 'Variant Key']]);
function nodeTable(nodes, columns, title = '') {
  // Initialize the columns
  const map = new Map();
  columns.forEach(column => {
    const hdr = columnHeaders.get(column);
    map.set(column, {
      hdr: hdr,
      wid: hdr.length,
      str: ''
    });
  }); // Determine column widths

  nodes.forEach((node, nodeIdx) => {
    columns.forEach((column, idx) => {
      const col = map.get(column);

      if (column === 'key') {
        col.wid = Math.max(col.wid, node.key().length);
      } else if (column === 'label') {
        col.wid = Math.max(col.wid, node.label().length);
      } else if (column === 'index') {
        col.wid = Math.max(col.wid, nodeIdx.toString().length);
      } else if (column === 'order') {
        col.wid = Math.max(col.wid, node.order().toString().length);
      } else if (column === 'displayValue') {
        col.wid = Math.max(col.wid, node.displayValue().length);
      } else if (column === 'nativeValue') {
        col.wid = Math.max(col.wid, node.value().toString().length);
      } else if (column === 'displayUnits') {
        col.wid = Math.max(col.wid, node.displayUnits().length);
      } else if (column === 'nativeUnits') {
        col.wid = Math.max(col.wid, node.nativeUnits().length);
      } else if (column === 'variantKey') {
        col.wid = Math.max(col.wid, node.variant().key().length);
      }
    });
  }); // table headers

  let head = '';
  let dash = '';
  columns.forEach(column => {
    const col = map.get(column);
    head += '| ' + col.hdr.padEnd(col.wid + 1, ' ');
    dash += '|-'.padEnd(col.wid + 3, '-');
  });
  dash += '|\n';
  head += '|\n';
  let ctitle = title.padStart(title.length + (dash.length - title.length - 2) / 2, ' ');
  ctitle = `| ${ctitle.padEnd(dash.length - 4, ' ')}|\n`;
  let str = `+${'-'.padEnd(dash.length - 3, '-')}+\n${ctitle}${dash}${head}${dash}`;
  nodes.forEach((node, nodeIdx) => {
    columns.forEach((column, idx) => {
      const col = map.get(column);
      let cell = '';

      if (column === 'key') {
        cell = node.key();
      } else if (column === 'label') {
        cell = node.label();
      } else if (column === 'index') {
        cell = nodeIdx.toString();
      } else if (column === 'order') {
        cell = node.order().toString();
      } else if (column === 'displayValue') {
        cell = node.displayValue();
      } else if (column === 'nativeValue') {
        cell = node.value().toString();
      } else if (column === 'displayUnits') {
        cell = node.displayUnits();
      } else if (column === 'nativeUnits') {
        cell = node.nativeUnits();
      } else if (column === 'variantKey') {
        cell = node.variant().key();
      }

      str += `| ${cell.padEnd(col.wid + 1, ' ')}`;
    });
    str += '|\n';
  });
  return str + dash;
}

export { BehaveFuel, BehavePlusModules, Calc, Canopy, ChaparralFuel, Compass, CrownFire, CrownSpotting, Dag, DagNode, FireEllipse, FuelBed, FuelCatalog, FuelMoisture, FuelParticle, IgnitionProbability$1 as IgnitionProbability, PalmettoGallberryFuel, Sim, Spotting, StorageAbstract, StorageNodeMap, SurfaceFire, TemperatureHumidity, TreeMortality, UpdateAbstract, UpdateOrthogonalRecursive, UpdateOrthogonalStack, WesternAspenFuel, Wind, nodeTable };
