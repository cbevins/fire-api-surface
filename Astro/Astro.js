/**
 * NOTE on sign of longitude expected by each function
 * |- astronomical() [e+, w-]
 * |- civil()  [e+, w-]
 * |- moon() [e+, w-]
 * |- nautical() [e+, w-]
 * |- sun() [e+, w-]
 *    |- _riseSet() [e+, w-] (performs longitude sign swap internally per M&P)
 *       |- sineAltitude() [e-, w+] per M&P
 *          |- localMeanSiderealTime() [e-, w+] per M&P
 *
 * |- solarRadiation() [e-, w+] per M&P
 *    |- sunPosition() [e-, w+] per M&P
 *       |- localMeanSiderealTime() [e-, w+] per M&P
 *
 */
import { ymdToJd } from '../index.js'

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Determines sun or moon rise/set times,
 * or civil, nautical, astronomical dawn/dusk times
 *
 * From Montenbruch and Pfleger, pages 51-54.
 *
 * @param {number} lat Decimal degrees latitude north (+) or south (-) of equator.
 * @param {number} lon Decimal degrees longitude east (+) or west (-) of Greenwich.
 * @param {number} gmtDiff Local hour difference from GMT
 * @param {integer} year
 * @param {integer} month
 * @param {integer} day
 *
 */
export function astronomical (lat, lon, gmtDiff, year, month, day) {
  // Astronomical twilight occurs at -18 degrees
  return _asRiseSet(_riseSet(lat, lon, gmtDiff, year, month, day, -18))
}

export function civil (lat, lon, gmtDiff, year, month, day) {
  // Civil twilight occurs at -6 degrees
  return _asRiseSet(_riseSet(lat, lon, gmtDiff, year, month, day, -6))
}

export function moon (lat, lon, gmtDiff, year, month, day) {
  // Moonrise/moonset occurs at h = +8 arc-minutes
  return _asRiseSet(_riseSet(lat, lon, gmtDiff, year, month, day, (8 / 60), true))
}

export function nautical (lat, lon, gmtDiff, year, month, day) {
  // Nautical twilight occurs at -12 degrees
  return _asRiseSet(_riseSet(lat, lon, gmtDiff, year, month, day, -12))
}

export function sun (lat, lon, gmtDiff, year, month, day) {
  // Sunrise/sunset occurs at h = -50 arc-minutes
  return _asRiseSet(_riseSet(lat, lon, gmtDiff, year, month, day, (-50 / 60)))
}

// -----------------------------------------------------------------------------
// Private API
// -----------------------------------------------------------------------------

// Repackages the array returned by _riseSet() as an object
function _asRiseSet ([rises, rise, sets, set, above]) {
  return {
    rise: {
      occurs: rises,
      time: rise
    },
    set: {
      occurs: sets,
      time: set
    },
    visible: {
      always: (!rises && !sets && above),
      diurnal: (rises && sets),
      never: (!rises && !sets && !above)
    }
  }
}

/**
 * @returns {number} Cosine in radians of the passed number of degrees.
 * @param {number} degrees Angle in degrees.
 */
function cs (degrees) { return Math.cos(degrees * Math.PI / 180) }

/**
 * @returns The fractional part of the passed value.
 * @param {number} value ANy value
 */
function fractionalPart (value) { return value - Math.trunc(value) }

/**
 * Determines the local sidereal time for the modified Julian date and longitude.
 *
 * From Montenbruch and Pfleger, page 41.
 *
 * @param {number} mjd Modified Julian date (JD - 2400000.5)
 * @param {number} lon Longitude (NOTE: Montenbruch and Pfleger require that
 * - must be POSITIVE for WEST of Greenwich,
 * - must be NEGATIVE for EAST of Greenwich;
 * - i.e, Munich lon = -11.6 degrees, while Missoula lon = 114.0
 * @returns {number} The local sidereal time for the modified Julian date and lambda.
 */
function localMeanSiderealTime (mjd, lon) {
  const mjd0 = Math.floor(mjd)
  const ut = 24 * (mjd - mjd0)
  const t = (mjd0 - 51544.5) / 36525
  const gmst = 6.697374558 + 1.0027379093 * ut +
        (8640184.812866 + (0.093104 - 6.2e-6 * t) * t) * t / 3600
  return 24 * fractionalPart((gmst - lon / 15) / 24)
}

/**
 * Determines low precision lunar coordinates (approximately 1 arc minute).
 *
 * From Montenbruch and Pfleger, page 38.
 *
 * @param {number} t Time in Julian centuries since J2000 (t = (jd - 2451545) / 36526).
 * @returns {array} [rightAscension, declination]
 *  - right ascension (hours, equinox of date) and
 *  - declination (degrees)
 */
function miniMoon (t) {
  // * Two pies
  const p2 = 2 * Math.PI
  // Arc-seconds per radian
  const arc = 206264.8062
  // cosine and sine of the obliquity ecliptic
  const coseps = 0.91748
  const sineps = 0.39778
  // Mean longitude of the moon (in revolutions)
  const l0 = fractionalPart(0.606433 + 1336.855225 * t)
  // Mean anomoly of the moon
  const l = p2 * fractionalPart(0.374897 + 1325.552410 * t)
  // Mean anomoly of the sun
  const ls = p2 * fractionalPart(0.993133 + 99.997361 * t)
  // Difference in longitude between the moon and the sun
  const d = p2 * fractionalPart(0.827361 + 1236.853086 * t)
  // Mean argument of latitude
  const f = p2 * fractionalPart(0.259086 + 1342.227825 * t)
  // Periodic perturbations of the lunar and solar longitude (in ") */
  const dl = 22640 * Math.sin(l) -
       4586 * Math.sin(l - 2 * d) +
       2370 * Math.sin(2 * d) +
       769 * Math.sin(2 * l) -
       668 * Math.sin(ls) -
       412 * Math.sin(2 * f) -
       212 * Math.sin(2 * l - 2 * d) -
       206 * Math.sin(l + ls - 2 * d) +
       192 * Math.sin(l + 2 * d) -
       165 * Math.sin(ls - 2 * d) -
       125 * Math.sin(d) -
       110 * Math.sin(l + ls) +
       148 * Math.sin(l - ls) -
       55 * Math.sin(2 * f - 2 * d)
  const s = f + (dl + 412.0 * Math.sin(2 * f) + 541.0 * Math.sin(ls)) / arc
  const h = f - 2.0 * d
  const n = -526.0 * Math.sin(h) +
      44.0 * Math.sin(l + h) -
      31.0 * Math.sin(-l + h) -
      23.0 * Math.sin(ls + h) +
      11.0 * Math.sin(-ls + h) -
      25.0 * Math.sin(-2.0 * l + f) +
      21.0 * Math.sin(-l + f)
  const lMoon = p2 * fractionalPart(l0 + dl / 1296e3) // in radians
  const bMoon = (18520 * Math.sin(s) + n) / arc // in radians
  // Equatorial coordinates
  const cb = Math.cos(bMoon)
  const x = cb * Math.cos(lMoon)
  const v = cb * Math.sin(lMoon)
  const w = Math.sin(bMoon)
  const y = coseps * v - sineps * w
  const z = sineps * v + coseps * w
  const rho = Math.sqrt(1 - z * z)
  const dec = (360 / p2) * Math.atan(z / rho)
  let ra = (48 / p2) * Math.atan(y / (x + rho))
  ra = ra < 0 ? ra + 24 : ra
  return [ra, dec]
}

/**
 * Determines low precision solar coordinates (approximately 1 arc minute).
 *
 * From Montenbruch and Pfleger, page 39.
 *
 * @param {number} Time in Julian centuries since J2000 (t = (jd - 2451545) / 36526).
 * @returns {array} [rightAscension, declination]
 *  - right ascension right ascension (hours, equinox of date).
 *  - declination (degrees, equinox of date).
 */
function miniSun (t) {
  const p2 = 2 * Math.PI
  const coseps = 0.91748
  const sineps = 0.39778

  // Mean solar anomoly
  const m = p2 * fractionalPart(0.993133 + 99.997361 * t)
  const dl = 6893 * Math.sin(m) + 72.0 * Math.sin(m + m)
  const l = p2 * fractionalPart(0.7859453 + m / p2 + (6191.2 * t + dl) / 1296e3)
  const sl = Math.sin(l)
  const x = Math.cos(l)
  const y = coseps * sl
  const z = sineps * sl
  const rho = Math.sqrt(1 - z * z)
  const dec = (360.0 / p2) * Math.atan(z / rho)
  let ra = (48 / p2) * Math.atan(y / (x + rho))
  ra = ra < 0 ? ra + 24 : ra
  return [ra, dec]
}

/**
 * Finds a parabola through three points (-1, *yMinus*), (0, *y0*), and (1, *yPlus*)
 * that do not lie on a straight line.
 *
 *  From Montenbruch and Pfleger, page 50.
 *
 *  @param yMinus First y value.
 *  @param y0 Second y value.
 *  @param yPlus Third y value.
 *
 * @return {array} [xe, ye, zero1, zero2]
 * - xe is the x value of the extreme value of the parabola.
 * - ye is the  y value of the extreme value of the parabola.
 * - z1 is the first root within [-1, +1] (if one or more roots, i.e. nz=1,2) otherwise null.
 * - z2 is the second root within [-1, +1] (if two roots, i.e., nz=2), otherwise null
 * - nz is the number of roots within the interval [-1, +1]
 */
function quadraticRoots (yMinus, y0, yPlus) {
  let nz = 0
  let z1 = null
  let z2 = null
  const a = 0.5 * (yMinus + yPlus) - y0
  const b = 0.5 * (yPlus - yMinus)
  const c = y0
  const xe = -b / (2 * a)
  const ye = (a * xe + b) * xe + c
  // Discriminant of y =  axx + bx + c
  const d = b * b - 4 * a * c
  // Parabola intersects the x-axis
  if (d >= 0) {
    const dx = 0.5 * Math.sqrt(d) / Math.abs(a)
    z1 = xe - dx
    z2 = xe + dx
    if (Math.abs(z1) <= 1) nz++
    if (Math.abs(z2) <= 1) nz++
    if (z1 < -1) z1 = z2
  }
  return [xe, ye, z1, z2, nz]
}

/**
 * @param {number} lat
 * @param {number} lon Longitude in degrees east (+) or west (-)
 * NOTE: inside this function, the signs are swapped to east (-) and west (+)
 * in accordane with M&P
 * @param {*} gmtDiff
 * @param {*} year
 * @param {*} month
 * @param {*} day
 * @param {*} pos
 * @param {*} isMoon
 * @returns
 */
function _riseSet (lat, lon, gmtDiff, year, month, day, pos, isMoon = false) {
  // M&P want west longitudes to be positive and east to be negative
  lon = -lon // So swap their sign

  // Convert YMD to modified Julian date adjusted for gmtDiff
  const jd = ymdToJd(year, month, day)
  const mjd = Math.floor(jd - 2400000.5)
  const amjd = mjd - gmtDiff / 24

  // Setup the search loop
  const sinh0 = sn(pos)
  const sphi = sn(lat)
  const cphi = cs(lat)
  let hour = 1
  let yMinus = sineAltitude(amjd, hour - 1, lon, cphi, sphi, isMoon) - sinh0
  const aboveHorizon = (yMinus > 0)
  let rises = false
  let sets = false

  // Loop over search intervals from [0h-2h] to [22h-24h]
  let ye, zero1, zero2, nz, utrise, utset
  do {
    const y0 = sineAltitude(amjd, hour, lon, cphi, sphi, isMoon) - sinh0
    const yPlus = sineAltitude(amjd, hour + 1, lon, cphi, sphi, isMoon) - sinh0;
    [, ye, zero1, zero2, nz] = quadraticRoots(yMinus, y0, yPlus)
    if (nz === 0) { /* no roots, so nothing to do */ } else if (nz === 1) { // 1 root
      if (yMinus < 0) {
        utrise = hour + zero1
        rises = true
      } else {
        utset = hour + zero1
        sets = true
      }
    } else if (nz === 2) { // 2 roots, so both a rise and a set
      if (ye < 0) {
        utrise = hour + zero2
        utset = hour + zero1
      } else {
        utrise = hour + zero1
        utset = hour + zero2
      }
      rises = true
      sets = true
    }
    if (rises && sets) {
      break
    }
    // Prepare for next interval
    yMinus = yPlus
    hour += 2
  } while (hour < 24.5)
  return [rises, utrise, sets, utset, aboveHorizon]
}

/**
 *
 * @param {*} mjd0
 * @param {*} hour
 * @param {number} lon Longitude (NOTE: Montenbruch and Pfleger require that
 * - must be POSITIVE for WEST of Greenwich,
 * - must be NEGATIVE for EAST of Greenwich;
 * - i.e, Munich lon = -11.6 degrees, while Missoula lon = 114.0
 * @param {*} cphi
 * @param {*} sphi
 * @param {*} isMoon
 * @returns
 */
function sineAltitude (mjd0, hour, lon, cphi, sphi, isMoon = false) {
  const mjd = mjd0 + hour / 24
  const t = (mjd - 51544.5) / 36525 // Julian centuries
  const [ra, dec] = isMoon ? miniMoon(t) : miniSun(t)
  const tau = 15 * (localMeanSiderealTime(mjd, lon) - ra)
  return sphi * sn(dec) + cphi * cs(dec) * cs(tau)
}

/**
 * Sine function that operates on degrees and returns radians.
 *
 *  @param degrees Angle in degrees.
 *  @returns {number} Sine in *radians* of the passed number of degrees.
 */
function sn (degrees) { return Math.sin(degrees * Math.PI / 180) }

/**
 * Determines the solar angle to the terrain slope.
 *
 * @aram slope Terrain slope in degrees.
 * @param {number} slope Terrain slope (degrees)
 * @param {number} aspect Terrain aspect; downslope direction in degrees clockwise from north.
 * @param {number} altitude Sun altitude above horizon in degrees.
 * @param {number} azimuth Sun azimuth in degrees clockwise from north.
 * @returns {number} Solar angle to the slope in degrees.  The range is [-90..+90].
 * - a value of 90 indicates the sun is normal to the slope
 * - a negative number indicates that the slope is shaded.
 */
export function solarAngle (slope, aspect, sunAltitude, sunAzimuth) {
  const sunRad = sn(sunAltitude) * sn(90 - slope) +
    cs(sunAltitude) * cs(90 - slope) * cs(sunAzimuth - aspect)
  return Math.asin(sunRad) * 180 / Math.PI
}

/**
 * Determines the proportion [0..1] of the solar radiation constant arriving at the forest floor
 *
 *  Uses the algorithm from MTCLIM.
 *
 * @param {number} jdate Julian date-time.
 * @param {number} lat Site latitude in degrees north (+) or south (-).
 * @param {number} lon Site longitude (NOTE: Montenbruch and Pfleger require that
 * - must be POSITIVE for WEST of Greenwich,
 * - must be NEGATIVE for EAST of Greenwich;
 * - i.e, Munich lon = -11.6 degrees, while Missoula lon = 114.0
 * @param {number} elev Site elevation in meters.
 * @param {number} slope Terrain slope in degrees.
 * @param {number} aspect Terrain aspect (downslope direction in degrees clockwise from north)
 * @param {number} canopyTransmittance The canopy transmittance factor [0..1].
 * @param {number} canopyTransmittance The cloud transmittance factor [0..1].
 * @param {number} atmTransparency The atmospheric transparency coefficient ([0.6-0.8])
 * - 0.80 Exceptionally clear atmosphere
 * - 0.75 Average clear forest atmosphere
 * - 0.70 Moderate forest (blue) haze
 * - 0.60 Dense haze
 *
 * NOTE: Does not account for reflected or diffuse radiation.  Therefore, a
 * site will have zero radiation if any of the following are true:
 * - the sun is below the horizon,
 * - the slope is self-shaded,
 * - the cloud transmittance is zero, or
 * - the canopy transmittance is zero.
 *
 *  @returns {number} Proportion of the solar radiation constant arriving at the forest floor [0..1].
 */
export function solarRadiation (jdate,
  lat, lon, gmtDiff,
  slope, aspect, elev,
  atmTransparency, cloudTransmittance, canopyTransmittance) {
  // Get the sun position for this date
  const [sunAlt, sunAzim] = sunPosition(jdate, lat, lon, lat, gmtDiff)

  // If the sun is below the horizon, return radiation fraction of zero
  if (sunAlt <= 0) { return 0 }

  // If the slope is self-shaded, return radiation fraction of zero. */
  const sunAngle = solarAngle(slope, aspect, sunAlt, sunAzim)
  if (sunAngle <= 0) { return 0 }

  // Optical air mass (from MTCLIM)
  const airMass = Math.exp(-0.0001467 * (elev / 3.2808)) / sn(sunAlt)

  // Proportion of sr arriving thu air mass, clouds, and canopy.
  const fraction = Math.pow(atmTransparency, airMass) *
    cloudTransmittance * canopyTransmittance * sn(sunAngle)
  return fraction
}

/**
 * Determines the calendar date and time of the requested equinox or solstice.
 *
 *  Uses the method described by Meeus on page 90.
 *
 * @param {integer} id Solstice number where 0=March, 1=June, 2=September, 3=December
 * @param {number} year Julian-Gregorian year of trhe event (-4712 or later).
 * @returns {array} [Mar, Jun, Sep, Dec] solstices as Julian day numbers GMT.
 */
export function solsticeGMT (id, year) {
  const a = [1721139.2855, 1721233.2486, 1721325.6978, 1721414.3920]
  const b1 = [365.2421376, 365.2417284, 365.2425055, 365.2428898]
  const b2 = [0.0679190, -0.0530180, -0.1266890, -0.0109650]
  const b3 = [-0.0027879, 0.0093320, 0.0019401, -0.0084885]
  // Determine GMT Julian date of the event
  const y = year / 1000
  const jd = []
  for (let i = 0; i < 4; i++) {
    jd.push(a[i] + b1[i] * year + b2[i] * y * y + b3[i] * y * y * y)
  }
  return jd
}

/**
 * Determines the position of the sun in the sky.
 *
 * @param {number} jdate Julian date-time.
 * @param {number} lat Observer's latitude in degrees north (+) or south(-).
 * @param {number} lon Observer's longitude (NOTE: Montenbruch and Pfleger require that
 * - must be POSITIVE for WEST of Greenwich,
 * - must be NEGATIVE for EAST of Greenwich;
 * - i.e, Munich lon = -11.6 degrees, while Missoula lon = 114.0
 * @param {number} gmtDiff Local time difference from GMT (local=GMT+gmtDiff).
 * @returns {array} [altitude, azimuth] where
 *  - altitude is sun degrees above the horizon.
 *  - azimuth is sun azimuth (right ascension) in degrees clockwise from north.
 */
export function sunPosition (jdate, lat, lon, gmtDiff) {
  // Modified Julian date adjusted for GMT difference
  const mjd = jdate - 2400000.5 - (gmtDiff / 24)

  // Sun declination and right ascension
  const t = (mjd - 51544.5) / 36525.0
  const [ra, dec] = miniSun(t)

  // Sun azimuth
  const tau = 15 * (localMeanSiderealTime(mjd, lon) - ra)
  const azimuth = (tau >= 180) ? tau - 180 : tau + 180

  // Sun altitude
  const sinAlt = sn(lat) * sn(dec) + cs(lat) * cs(dec) * cs(tau)
  const altitude = Math.asin(sinAlt) * 180 / Math.PI
  return [altitude, azimuth]
}
