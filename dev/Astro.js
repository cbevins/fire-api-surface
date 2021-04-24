import { ymdToJd } from './Calendar.js'

const Radians = 0.0174532925199433

// Enumerates the possible events that can be determined for a date and/or time.
export const UserTime = 'User Time'
export const SystemTime = 'System Time'
export const SunRise = 'Sun Rise'
export const SunSet = 'Sun Set'
export const MoonRise = 'Moon Rise'
export const MoonSet = 'Moon Set'
export const CivilDawn = 'Civil Dawn'
export const CivilDusk = 'Civil Dusk'
export const NauticalDawn = 'Nautical Dawn'
export const NauticalDusk = 'Nautical Dusk'
export const AstronomicalDawn = 'Astronomical Dawn'
export const AstronomicalDusk = 'Astronomical Dusk'
export const SpringEquinox = 'Spring Equinox'
export const SummerSolstice = 'Summer Solstice'
export const FallEquinox = 'Fall Equinox'
export const WinterSolstice = 'Winter Solstice'
export const Easter = 'Easter'
export const NewMoon = 'New Moon'
export const FullMoon = 'Full Moon'

// Enumerates the possible conditions that can result from a calendar date-time operation.
export const None = 'None'
export const ValidDateTime = 'Valid DateTime'
export const ValidDate = 'Valid Date'
export const ValidTime = 'Valid Time'
export const InvalidYear = 'Invalid Year'
export const InvalidMonth = 'Invalid Month'
export const InvalidDay = 'Invalid Day'
export const InvalidHour = 'Invalid Hour'
export const InvalidMinute = 'Invalid Minute'
export const InvalidSecond = 'Invalid Second'
export const InvalidMillisecond = 'Invalid Millisecond'
export const Rises = 'Rises'
export const NeverRises = 'Never Rises'
export const Sets = 'Sets'
export const NeverSets = 'Never Sets'
export const AlwaysVisible = 'Always Visible'
export const NeverVisible = 'Never Visible'
export const AlwaysLight = 'Always Light'
export const AlwaysDark = 'Always Dark'

/**
 * Cosine function that operates on \a x degrees.
 *
 * @param {number} degrees Angle in degrees.
 * @returns {number} Cosine in radians of the passed number of degrees.
 */
function cs (degrees) { return Math.cos(Radians * degrees) }

/*! \brief Determines the fractional part of the passed \a value.
 *
 *  @returns Returns the fractional part of the passed \a value.
 */
function fractionalPart (value) { return value - Math.trunc(value) }

export function julianCenturies (jd) { return (jd - 2451545) / 36526 }

/**
 * Determines the local sidereal time for the modified Julian date
 *  \a mjd and longitude \a lambda.
 *
 *  From Montenbruch and Pfleger, page 41.
 *
 *  @param mjd Modified Julian date (JD - 2400000.5)
 *  @param lambda Longitude (positive \a west of Greenwich, negative \a east
 *  of Greenwich; Munich is lambda = -11.6 degrees).
 *
 *  @returns {number} The local sidereal time for \a mjd and \a lambda.
 */
export function localMeanSiderealTime (mjd, lambda) {
  const mjd0 = Math.floor(mjd)
  const ut = 24 * (mjd - mjd0)
  const t = (mjd0 - 51544.5) / 36525
  const gmst = 6.697374558 + 1.0027379093 * ut +
        (8640184.812866 + (0.093104 - 6.2e-6 * t) * t) * t / 3600
  return 24 * fractionalPart((gmst - lambda / 15) / 24)
}

/**
 * Determines low precision lunar coordinates (approximately 1 arc minute).
 *
 *  From Montenbruch and Pfleger, page 38.
 *
 *  @param t Time in Julian centuries since J2000 (t = (jd - 2451545) / 36526).
 *
 * @returns {array} [rightAscension, declination]
 *  - right ascension (hours, equinox of date) and
 *  - declination (degrees)
 */
export function miniMoon (t) {
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
export function miniSun (t) {
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
export function quadraticRoots (yMinus, y0, yPlus) {
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
 * Determines the rise or set times of the sun, moon, dawn, or dusk
 * at an observer's position.
 *
 *  From Montenbruch and Pfleger, pages 51-54.
 *
 *  @param jd Julian day number (as determined by Calendar.ymdToJd())
 *  @param lat Decimal degrees latitude north (+) or south (-) of equator.
 *  @param lon Decimal degrees longitude east (+) or west (-) of Greenwich.
 *  @param event Event to determine, may be one of:
 *  - SunRise, SunSet
 *  - MoonRise, MoonSet
 *  - AstronomicalDawn, AstronomicalDusk
 *  - CivilDawn, CivilDusk
 *  - NauticalDawn, NauticalDusk
 *
 * @returns {array} [time, flag] where
 *  - time is the decimals hours of the event.
 *  - flag is one of:
 *  - Rises (only if Event is SunRise or MoonRise)
 *  - NeverRises (only if Event is MoonRise)
 *  - Sets (only if Event is SunSet or MoonSet)
 *  - NeverSets (only if Event is MoonSet)
 *  - Visible (only if Event is SunRise, SunSet, MoonRise, or MoonSet)
 *  - Invisible  (only if Event is SunRise, SunSet, MoonRise, or MoonSet)
 *  - AlwaysDark (only if Event is AstronomicalDawn, AstronomicalDusk,
 *    CivilDawn, CivilDusk, NauticalDawn, or NauticalDusk)
 *  - AlwaysLight (only if Event is AstronomicalDawn, AstronomicalDusk,
 *    CivilDawn, CivilDusk, NauticalDawn, or NauticalDusk)
 */
export function sun (lat, lon, gmtDiff, year, month, day) {
  const jd = ymdToJd(year, month, day)
}
export function riseSet (event, jd, lat, lon, gmtDiff) {
  // M&P want west longitudes to be positive and east to be negative
  lon = -lon // So swap sign
  const mjd = Math.floor(jd - 2400000.5) // Convert to modified Julian date
  const amjd = mjd - gmtDiff / 24 // Adjust modified JD for GMT difference

  // Determine the parameters for this type of event
  const Event = new Map([
    // Sunrise/sunset occurs at h = -50 minutes
    [SunRise, { sinh0: sn(-50 / 60), doRise: true, doSet: false }],
    [SunSet, { sinh0: sn(-50 / 60), doRise: false, doSet: true }],
    // Moonrise/moonset occurs at h = +8 minutes
    [MoonRise, { sinh0: sn(8 / 60), doRise: true, doSet: false }],
    [MoonSet, { sinh0: sn(8 / 60), doRise: false, doSet: true }],
    // Civil twilight occurs at -6 degrees
    [CivilDawn, { sinh0: sn(-6 / 60), doRise: true, doSet: false }],
    [CivilDusk, { sinh0: sn(-6 / 60), doRise: false, doSet: true }],
    // Nautical twilight occurs at -12 degrees
    [NauticalDawn, { sinh0: sn(-12 / 60), doRise: true, doSet: false }],
    [NauticalDusk, { sinh0: sn(-12 / 60), doRise: false, doSet: true }],
    // Astronomical twilight occurs at -18 degrees
    [AstronomicalDawn, { sinh0: sn(-18 / 60), doRise: true, doSet: false }],
    [AstronomicalDusk, { sinh0: sn(-18 / 60), doRise: false, doSet: true }]
  ])
  const ev = Event.get(event)

  // Setup for search loop
  const sphi = sn(lat)
  const cphi = cs(lat)
  let hour = 1
  let yMinus = sineAltitude(event, amjd, hour - 1, lon, cphi, sphi) - ev.sinh0
  const aboveHorizon = (yMinus > 0)
  let rises = false
  let sets = false

  // Loop over search intervals from [0h-2h] to [22h-24h]
  let ye, zero1, zero2, nz, utrise, utset
  do {
    const y0 = sineAltitude(event, amjd, hour, lon, cphi, sphi) - ev.sinh0
    const yPlus = sineAltitude(event, amjd, hour + 1, lon, cphi, sphi) - ev.sinh0;
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

  // Store results
  let result = []
  if (rises || sets) {
    if (ev.doRise) {
      result = (rises) ? [utrise, Rises] : [null, NeverRises]
    } else if (ev.doSet) {
      result = (sets) ? [utset, Sets] : [null, NeverSets]
    }
  } else { // No rise or set occurred
    let flag
    if (aboveHorizon) { // If above horizon, then always visible or always light
      flag = (event === SunRise || event === SunSet || event === MoonRise || event === MoonSet)
        ? AlwaysVisible
        : AlwaysLight
    } else { // If below horizon, then always invisible or always dark
      flag = (event === SunRise || event === SunSet || event === MoonRise || event === MoonSet)
        ? NeverVisible
        : AlwaysDark
    }
    result = [null, flag]
  }
  return result
}

/**
 * Sine function that operates on \a x degrees.
 *
 *  @param degrees Angle in degrees.
 *  @returns {number} Sine in radians of the passed number of degrees.
 */
function sn (degrees) { return Math.sin(Radians * degrees) }

/**
 * Determines the sine of the altitude of the moon or sun.
 *
 *  From Montenbruck and Pfleger, page 52.
 *
 *  @param event One of the #CDT_Event enumerations.
 *  @param mjd0 Modified Julian date.
 *  @param hour Hour of the day.
 *  @param lambda Longitude in degrees (west of Greenwich is positive).
 *  @param cphi Cosine of the latitude
 *  @param sphi Sine of the latitude
 *
 *  @returns {number} Sine of the altitude of the moon or sun.
 */
export function sineAltitude (event, mjd0, hour, lambda, cphi, sphi) {
  const mjd = mjd0 + hour / 24
  const t = (mjd - 51544.5) / 36525
  const [ra, dec] = (event === MoonRise || event === MoonSet) ? miniMoon(t) : miniSun(t)
  const tau = 15 * (localMeanSiderealTime(mjd, lambda) - ra)
  return sphi * sn(dec) + cphi * cs(dec) * cs(tau)
}
