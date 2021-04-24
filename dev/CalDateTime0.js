/*! \file cdtlib.c
 *  \version BehavePlus3
 *  \author Copyright (C) 2002-2004 by Collin D. Bevins.  All rights reserved.
 *
 *  \brief Calendar-Date-Time (CDT) library C source code.
 *
 *  Fundamental calendar, date, and time routines for the Western
 * (Julian-Gregorian) calendar.
 *
 *  \par References:
 *
 *  The following references were used:
 *
 *  Duffett-Smith, Peter. 1981.  Practical astronomy with your calculator.
 *  Second Edition. Cambridge University Press. 188 pp.
 *
 *  Latham, Lance. 1998. Standard C date/time library.  Miller-Freeman.
 *  560 pp.
 *
 *  Meeus, Jean.  1988.  Astronomical formulae for calculators. Fourth
 *  Edition.  Willman-Bell, Inc. 218 pp.
 *
 *  Montenbruck, Oliver; Pfleger, Thomas.  Astronomy on the personal computer.
 *  Third Edition.  Springer.  312 pp.  (see page 13).
 */

// Global constant defining the radians per degree.
const Radians = 0.0174532925199433
const Eps = 1.0e-07

// dD/dT of mean elongation of moon from sun in revolutions per century
// (1236.853086, see Montenbruck & Pfleger page 179).
const D1 = 1236.853086

// Mean elongation D of the moon from the sun for the epoch J2000
// in units of 1 rev = 360 degrees (0.827361, see Montenbruck & Pfleger, page 179)
const D0 = 0.827361

export class DateTime {
  /**
   *
   * @param {integer} year Julian-Gregorian year (-4712 (4713 B.C.) or greater)
   * @param {integer} month month of the year (1-12)
   * @param {integer} day day of the month (1-31)
   * @param {integer} hour hours past midnight (0-23)
   * @param {integer} minute minutes past the hour (0-59)
   * @param {integer} second seconds past the minute (0-59)
   * @param {number} millisecond milliseconds past the second (0-999).
  */
  constructor (year, month, day, hour, minute = 0, second = 0, millisecond = 0) {
    this._year = year
    this._month = month
    this._day = day
    this._hour = hour
    this._minute = minute
    this._second = second
    this._millisecond = millisecond
  }
}

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
 *  Calculates the Western (Julian-Gregorian) calendar date from the Julian date
 *  using the method described by Duffett-Smith (and similarly by Meeus).
 *
 *  I used Montenbruck & Pfleger (p 13) because it gave the correct calendar
 *  date for Julian date 1.0, whereas the Meeus (p 26) and Duffett-Smith (p 11)
 *  algorithms said Julian date 1 is -4712 Jan 02.
 *
 * \warning No date or time validation is performed.
 *
 * @param {number} jdate Julian date
 *  @returns {DateTime} Reference to a new DateTime instance
 */
export function calendarDate (jdate) {
  let c
  const jd0 = Math.floor(jdate + 0.5)
  if (jd0 < 2299161.0) {
    c = jd0 + 1524.0
  } else {
    const b = Math.floor((jd0 - 1867216.25) / 36524.25)
    c = jd0 + (b - Math.floor(b / 4) + 1525)
  }
  const d = Math.floor((c - 122.1) / 365.25)
  const e = 365.0 * d + Math.floor(d / 4)
  const f = Math.floor((c - e) / 30.6001)

  const day = Math.floor(c - e + 0.5) - Math.floor(30.6001 * f)
  const month = f - 1 - 12 * Math.floor(f / 14)
  const year = d - 4715 - Math.floor((7 + month) / 10)
  const dh = 24 * (jdate + 0.5 - jd0)
  const hour = Math.floor(dh)
  const dm = 60 * (dh - hour)
  const minute = Math.floor(dm)
  const ds = 60 * (dm - minute)
  const second = Math.floor(ds)
  const ms = 1000 * (ds - second)
  const millisecond = Math.floor(ms)
  return new DateTime(year, month, day, hour, minute, second, millisecond)
}

/**
 * Cosine function that operates on \a x degrees.
 *
 * @param {number} degrees Angle in degrees.
 * @returns {number} Cosine in radians of the passed number of degrees.
 */
function cs (degrees) { return Math.cos(Radians * degrees) }

/**
 * Determines the day-of-the week index from the Julian date \a jdate.
 *
 * @param {number} jdate Julian date
 * @returns {integer} The day-of-the-week index (0=Sunday, 7=Saturday)
 */
export function dayOfWeek (jdate) { return Math.floor((jdate + 1.5) % 7) }

/**
 * Returns the 3-letter English abbreviation for the day-of-the-week index \a dowIndex.
 *
 * @param {integer} dowIndex The day-of-the-week index (0=SUnday, 7=Saturday)
 * @returns {string} English 3-letter abbreviation for the day-of-the-week.
 */
export function dayOfWeekAbbreviation (dowIndex) {
  const Dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (dowIndex >= 0 && dowIndex <= 6) ? Dow[dowIndex] : 'Bad Day-of-Week index'
}

/**
 * Returns the English name for the day-of-week index \a dowIndex.
 *
 * @param {integer} dowIndex The day-of-the-week index (0=Sunday, 7=Saturday)
 * @returns {string} Full English name for the day-of-the-week.
 */
export function dayOfWeekName (dowIndex) {
  const Dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return (dowIndex >= 0 && dowIndex <= 6) ? Dow[dowIndex] : 'Bad Day-of-Week index'
}

/**
 * Determines the day-of-the-year number.
 *
 * Day 1 is always January 1 of the \a year.  The day number is adjusted
 * for the occurrence of leap years in the Julian and Gregorian calendars.
 * An adjustment is also made for the Gregorian calendar reform of 1582
 * when Pope Gregory dropped Oct 5-14 from the Julian calendar to begin the
 * Gregorian calendar (thus, 1582 had only 355 days).
 *
 * @param {integer} year Julian-Gregorian calendar year (-4712 or later)
 * @param {integer} month Month of the year (1-12)
 * @param {integer} day Day of the month (1-31)
 * @returns {integer} Day of the year (1-366)
 */
export function dayOfYear (year, month, day) {
  /*                  Jan Feb Mar Apr May  Jun  Jul  Aug  Sep  Oct  Nov  Dec */
  const DaysToMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let doy = day + DaysToMonth[month - 1]

  /* 1582 AD is missing the ten days of Oct 5-14 */
  if (year === 1582 && doy > 277) {
    doy -= 10
  } else if (doy > 59 && isLeapYear(year)) {
    doy++
  }
  return doy
}

/**
 * Determines the number of days in the month for the year.
 *
 * The Julian calendar (prior to the Gregorian calendar reform) has 29 days in February
 * every quadrennial.  October 1582 has only 21 days because of the reform.
 * The Gregorian calendar has exceptions to the quadrennial leap year rule.
 *
 * @param {integer} year Julian-Gregorian calendar year (-4712 or later)
 * @param {integer} month Month of the year (1=Jan, 12=Dec)
 * @returns {integer} Number of days in the \a year month
 */
export function daysInMonth (year, month) {
  /*                  Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec */
  const DaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (year === 1582 && month === 10) return 21
  if (month === 2 && isLeapYear(year)) return 29
  return DaysInMonth[month - 1]
}

/**
 * Determines the number of days in the year.
 *
 * The Julian calendar has quadrennial leap years.
 * The Gregorian calendar reform of 1582 has only 355 days.
 * The post-reform Gregorian calendar has quadrennial leap years with exceptions.
 *
 * @param {integer} year Julian-Gregorian calendar year (-4712 or later).
 * @returns {integer} Number of days in the year (355, 365, or 366).
 */
export function daysInYear (year) {
  if (year === 1582) return 355
  return isLeapYear(year) ? 366 : 365
}

/**
 * Determines the elapsed portion of the day since midnight.
 *
 * @param {integer} hour Hours past midnight (0-23)
 * @param {integer} minute Minutes past the hour (0-59)
 * @param {integer} second Seconds past the minute (0-59)
 * @param {integer} milliseconds Milliseconds past the second (0-999)
 * @returns {number} The elapsed portion of the day since midnight in days [0-1]
 */
export function decimalDay (hour, minute, second, millisecond) {
  return millisecondOfDay(hour, minute, second, millisecond) / 86400000
}

/**
 * Determines the elapsed hours since midnight.
 *
 * @param {integer} hour Hours past midnight (0-23)
 * @param {integer} minute Minutes past the hour (0-59)
 * @param {integer} second Seconds past the minute (0-59)
 * @param {integer} milliseconds Milliseconds past the second (0-999)
 * @returns {number} The elapsed decimal hours since midnight
 */
export function decimalHour (hour, minute, second, millisecond) {
  return millisecondOfDay(hour, minute, second, millisecond) / 3600000
}

/**
 * Determines the date of Easter for the year.
 *
 * Valid for the Gregorian calendar (1583 and later).  Uses the algorithm
 * from Duffett-Smith (page 5), Meeus (page 31), and Latham (page 164).
 *
 * @param {integer} year Julian-Gregorian calendar year for easter (1583 or later).
 * @returns {array} [month, day]
 */
export function easterDay (year) {
  const a = year % 19
  const b = year / 100
  const c = year % 100
  const d = b / 4
  const e = b % 4
  const f = (b + 8) / 25
  const g = (b - f + 1) / 3
  const h = (19 * a + b - d - g + 15) % 30
  const i = c / 4
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = (a + 11 * h + 22 * l) / 451
  const n = (h + l - 7 * m + 114) / 31
  const p = (h + l - 7 * m + 114) % 31
  const day = p + 1
  const month = n
  return [month, day]
}

/*! \brief Determines the fractional part of the passed \a value.
 *
 *  @returns Returns the fractional part of the passed \a value.
 */
function fractionalPart (value) {
  return (value < 0) ? value - Math.ceil(value) : value - Math.floor(value)
}

/**
 * Improves an approximation for the time of the new moon.
 *
 * This is an internal function from Montenbruck and Pfleger that improves
 * an approximation \a t0 for the time of the new moon and finds the
 * ecliptic longitude \a b of the moon for that date.
 *
 * Called only by the lunation routine CDT_NewMoonGMT().
 *
 * @param {number} t0 Time in Julian centuries since J2000 (t = (jd - 2451545) / 36526).
 *
 * Note: also calculates 'b', the ecliptic longitude of the moon for that date,
 * although it does not return it.
 *
 * @returns {number} The adjusted time \a t0 (and the ecliptic longitude b) of the moon
 *  for the date are returned in the passed arguments.
 */
export function improveMoon (t0) {
  const p2 = 2 * Math.PI
  const arc = 206264.8062 // Arcseconds per radian
  // Store the input time */
  const t = t0
  // Mean anomoly of the moon
  const l = p2 * fractionalPart(0.374897 + 1325.552410 * t)
  // Mean anomoly of the sun
  const ls = p2 * fractionalPart(0.993133 + 99.997361 * t)
  // Mean elongation of Moon-Sun
  const d = p2 * (fractionalPart(0.5 + D0 + D1 * t) - 0.5)
  // Mean argument of latitude
  const f = p2 * fractionalPart(0.259086 + 1342.227825 * t)

  // Periodic perturbations of the lunar and solar longitude (in ")
  const dlm = 22640 * Math.sin(l) -
      4586.0 * Math.sin(l - 2.0 * d) +
      2370.0 * Math.sin(2.0 * d) +
      769.0 * Math.sin(2.0 * l) -
      668.0 * Math.sin(ls) -
      412.0 * Math.sin(2.0 * f) -
      212.0 * Math.sin(2.0 * l - 2.0 * d) -
      206.0 * Math.sin(l + ls - 2.0 * d) +
      192 * Math.sin(l + 2 * d) -
      165.0 * Math.sin(ls - 2 * d) -
      125.0 * Math.sin(d) -
      110.0 * Math.sin(l + ls) +
      148.0 * Math.sin(l - ls) -
      55.0 * Math.sin(2 * f - 2 * d)

  const dls = 6893 * Math.sin(ls) +
        72.0 * Math.sin(2 * ls)

  // Difference of the true longitudes of moon and sun in revolutions
  const dlambda = d / p2 + (dlm - dls) / 1296000

  // Correction for the time of the new moon
  const tcorrection = t - dlambda / D1

  // Ecliptic latitude B of the moon in degrees
  const bMoonNew = (18520 * Math.sin(f + dlm / arc) - 526 * Math.sin(f - 2 * d)) / 3600
  return tcorrection
}

/**
 * Calculates the Julian date from the passed date and time.
 *
 *  The Julian Date is the number of days that have elapsed since \e noon,
 *  12h Universal Time on January 1, 4713 B.C.
 *
 *  The Julian Date was developed in 1583 by French scholar Joseph Justus
 *  Scaliger.  The beginning day of January 1, 4713 B.C. is the previous
 *  coincidence of the 28-year solar cycle, the 19-year Golden Number (Metonic)
 *  lunar cycle, and the 15-year indiction cycle used for Roman taxation.
 *
 *  The Gregorian calendar reform is taken into account when calculating
 *  the Julian Date.  Thus the day following 1582 October 4 is 1582 October 15.
 *  The Julian calendar is used through 1582 Oct 4 (leap years every 4th year),
 *  and the Gregorian calendar is used for dates on and after 1582 Oct 15
 *  (leap year exceptions).  Together, the Julian-Gregorian calendar system
 *  may be referred to simply as the Western calendar.
 *
 *  The "B.C." years are counted astronomically; the year before A.D. 1
 *  is year 0, and the year preceeding this is -1.
 *
 *  \par References:
 *
 *  Duffett-Smith, Peter. 1981.  Practical astronomy with your calculator.
 *  Second Edition. Cambridge University Press. 188 pp. (see page 9).
 *
 *  Latham, Lance. 1998. Standard C date/time library.  Miller-Freeman.
 *  560 pp.  (see page 41).
 *
 *  Meeus, Jean.  1988.  Astronomical formulae for calculators. Fourth
 *  Edition.  Willman-Bell, Inc. 218 pp. (see page 24).
 *
 *  Montenbruck, Oliver; Pfleger, Thomas.  Astronomy on the personal computer.
 *  Third Edition.  Springer.  312 pp.  (see page 13).
 *
 *  \warning No date or time validation is performed.
 *
 *  \bug
 *  While all authors agree that the Julian Date starts at zero at 12:00
 *  \e noon of 4713 B.C. January  1, the Duffett-Smith and Meeus algorithms
 *  actually yields a JD of 1.0 for this date and time!  The function here
 *  correctly reproduces all the examples in their texts, but yield a JD of
 *  1.0 for -4712 Jan 1 12:00.
 *
 *  \htmlonly
 *  <table>
 *  <tr><td>Calendar Date</td> <td>Julian Date</td> <td>Source</td></tr>
 *  <tr><td>1985 Feb 17 06:00:00</td><td>2,446,113.75</td><td>(Duffett-Smith p 9)</td></tr>
 *  <tr><td>1980 Jan 40 00:00:00</td><td>2,444,238.50</td><td>(Duffett-Smith, p10)</td></tr>
 *  <tr><td>1957 Oct 04 19:26:24</td><td>2,436,116.31</td><td>(Meeus, p23)</td></tr>
 *  <tr><td>0333 Jan 27 12:00:00</td><td>1,842,713.00</td><td>(Meeus, p24)</td></tr>
 *  <tr><td>-4712 Jan 01 12:00:00</td><td>1.00</td><td>Should be 0.0! </td>
 *  </table>
 *  Note the last example.
 *  \endhtmlonly
 *
 *  While this certainly deviates from the formal definition of JD, I will
 *  continue to use this algorithm since I also use their other algorithms
 *  for Julian-to-calendar conversions and astronomical date derivations.
 *
 *  @param year            -4712 (4713 B.C.) or greater
 *  @param month           Month of the year (1-12)
 *  @param day             Day of the month (1-31)
 *  @param hour            Hours past midnight (0-23)
 *  @param minute          Minutes past the hour (0-59)
 *  @param second          Seconds past the minute (0-59)
 *  @param milliseconds    Milliseconds past the second (0-999)
 *
 *  @returns The Julian date in decimal days since 1 Jan -4712.
 */
export function julianDate (year, month, day, hour, minute, second, millisecond) {
  let jdate = 10000 * year + 100 * month + day
  if (month <= 2) {
    year--
    month += 12
  }
  let a = 0
  let b = 0
  if (jdate >= 15821015) {
    a = Math.floor(year / 100)
    b = 2 - a + Math.floor(a / 4)
  }
  const c = Math.floor(365.25 * year)
  const d = Math.floor(30.6001 * (month + 1))
  jdate = b + c + d + day + decimalDay(hour, minute, second, millisecond) + 1720994.5
  return jdate
}

/**
 * Determines if the specified \a year is a Julian-Gregorian leap year.
 *
 *  All quadrennial years in the Julian calendar (prior to 1582) are leap
 *  years.
 *
 *  @param year Julian-Gregorian calendar year (-4712 or later).
 *
 *  @returns {bool} TRUE if leap year
 */
export function isLeapYear (year) {
  // If its not divisible by 4, its not a leap year
  if (year % 4 !== 0) return false
  // All years divisible by 4 prior to 1582 were leap years
  if (year < 1582) return true
  // If divisible by 4, but not by 100, its a leap year
  if (year % 100 !== 0) return true
  // If divisible by 100, but not by 400, its not a leap year
  if (year % 400 !== 0) return false
  // If divisible by 400, it is a leap year
  return true
}

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
 * Determines the milliseconds elapsed since midnight.
 *
 *  @param hour            Hours past midnight (0-23).
 *  @param minute          Minutes past the hour (0-59).
 *  @param second          Seconds past the minute (0-59).
 *  @param milliseconds    Milliseconds past the second (0-999).
 *
 *  @returns {number} The elapsed time since midnight in milliseconds.
 */
export function millisecondOfDay (hour, minute, second, millisecond) {
  return millisecond + 1000 * second + 60000 * minute + 3600000 * hour
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
  // cosine nad sine of the obliquity ecliptic
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
 * Determines the \a modified Julian date from the \a jdate Julian date.
 *
 *  The \a modified Julian date is just the standard Julian date adjusted to
 *  the epoch starting midnight 1858 Nov 17:
 *  - mjd = jd - 2400000.5;
 *
 *  @param jdate Julian date
 *
 *  @returns Modified Julian date.
 */
export function modifiedJulianDate (jdate) { return jdate - 2400000.5 }

/**
 * brief Returns the 3-letter English abbreviation for the \a month index
 *
 * @param {integer} month Month of the year where 1=Jan and 12=Dec.
 * @returns {string} The 3-letter English abbreviation for the \a month index, or "Bad month index".
 */
export function monthAbbreviation (month) {
  const Abb = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return (month >= 1 && month <= 12) ? Abb[month] : 'Bad month index'
}

/**
 * Returns the English name for the \a month index
 *
 * @param {integer} month Month of the year where 1=Jan and 12=Dec.
 * @returns {string} The English name for the *month* index, or "Bad month index".
 */
export function monthName (month) {
  const Name = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December']
  return (month >= 1 && month <= 12) ? Name[month] : 'Bad month index'
}

/**
 * Determines the GMT time of the period of the new moon for the year.
 *
 *
 *  @param {integer} year Julian-Gregorian calendar year (-4712 or later).
 *  @param {integer} period New moon of the year (1 === first new moon).
 *  Calling this with *period* === 0 will get the last new moon before the year.
 *  @returns {number} The Julian date (GMT) of the \a period's new moon for the \a year.
 */
export function newMoonGMT (year, period) {
  // Derive lunation number
  const lunation = Math.floor(D1 * (year - 2000) / 100) + period
  const newMoon1 = (lunation - D0) / D1

  // Improve the estimate
  const newMoon2 = improveMoon(newMoon1)
  const newMoon3 = improveMoon(newMoon2)

  // Greenwich time of new moon for this lunation paeriod
  return 36525 * newMoon3 + 51544.5 + 2400000.5
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
 *  @param jdate    Julian date as determined by CDT_JulianDate().
 *  @param lon      Decimal degrees longitude (west GMT is positive).
 *  @param lat      Decimal degrees latitude (north equator is positive).
 *  @param *hours   Returned decimals hours of the event.
 *  @param event Event to determine, may be one of:
 *  \arg #CDT_SunRise
 *  \arg #CDT_SunSet
 *  \arg #CDT_MoonRise
 *  \arg #CDT_MoonSet
 *  \arg #CDT_AstronomicalDawn
 *  \arg #CDT_AstronomicalDusk
 *  \arg #CDT_CivilDawn
 *  \arg #CDT_CivilDusk
 *  \arg #CDT_NauticalDawn
 *  \arg #CDT_NauticalDusk
 *
 * @returns {string}
 *  \retval #CDT_Rises (only if #CDT_Event is #CDT_SunRise or #CDT_MoonRise)
 *  \retval #CDT_NeverRises (only if #CDT_Event is #CDT_MoonRise)
 *  \retval #CDT_Sets (only if #CDT_Event is #CDT_SunSet or #CDT_MoonSet)
 *  \retval #CDT_NeverSets (only if #CDT_Event is #CDT_MoonSet)
 *  \retval #CDT_Visible (only if #CDT_Event is #CDT_SunRise, #CDT_SunSet,
 *  #CDT_MoonRise, or #CDT_MoonSet)
 *  \retval #CDT_Invisible  (only if #CDT_Event is #CDT_SunRise, #CDT_SunSet,
 *  #CDT_MoonRise, or #CDT_MoonSet)
 *  \retval #CDT_Light (only if #CDT_Event is #CDT_AstronomicalDawn,
 *  #CDT_AstronomicalDusk, #CDT_CivilDawn, #CDT_CivilDusk, #CDT_NauticalDawn,
 *  or #CDT_NauticalDusk)
 *  \retval #CDT_Dark  (only if #CDT_Event is #CDT_AstronomicalDawn,
 *  #CDT_AstronomicalDusk, #CDT_CivilDawn, #CDT_CivilDusk, #CDT_NauticalDawn,
 *  or #CDT_NauticalDusk)
 */
export function riseSet (event, jdate, lon, lat, gmtDiff) {
  // Strip time from the Julian date
  const jd = Math.floor(jdate - 2400000.5)
  // Convert to modified JD adjusted for time zone difference to GMT
  const amjd = jd - gmtDiff / 24

  /* Determine the parameters for this type of event */
  let doRise = 0
  let doSet = 0
  let sinh0
  let flag = None
  switch (event) {
    // Sunrise/sunset occurs at h = -50 minutes
    case SunRise:
      sinh0 = sn(-50 / 60)
      doRise = 1
      break
    case SunSet:
      sinh0 = sn(-50 / 60)
      doSet = 1
      break
    // Moonrise/moonset occurs at h = +8 minutes
    case MoonRise:
      sinh0 = sn(8 / 60)
      doRise = 1
      break
    case MoonSet:
      sinh0 = sn(8 / 60)
      doSet = 1
      break
    // Civil twilight occurs at -6 degrees
    case CivilDawn:
      sinh0 = sn(-6)
      doRise = 1
      break
    case CivilDusk:
      sinh0 = sn(-6)
      doSet = 1
      break
    // Nautical twilight occurs at -12 degrees
    case NauticalDawn:
      sinh0 = sn(-12)
      doRise = 1
      break
    case NauticalDusk:
      sinh0 = sn(-12)
      doSet = 1
      break
    // Astronomical twilight occurs at -18 degrees
    case AstronomicalDawn:
      sinh0 = sn(-18)
      doRise = 1
      break
    case AstronomicalDusk:
      sinh0 = sn(-18)
      doSet = 1
      break
    default:
      return [flag, null]
  }

  // Setup
  const sphi = sn(lat)
  const cphi = cs(lat)
  let hour = 1
  let yMinus = sineAltitude(event, amjd, hour - 1, lon, cphi, sphi) - sinh0
  const aboveHorizon = (yMinus > 0)
  let rises = false
  let sets = false

  // Loop over search intervals from [0h-2h] to [22h-24h] */
  let ye, zero1, zero2, nz, utrise, utset, hours
  do {
    const y0 = sineAltitude(event, amjd, hour, lon, cphi, sphi) - sinh0
    const yPlus = sineAltitude(event, amjd, hour + 1, lon, cphi, sphi) - sinh0;
    [, ye, zero1, zero2, nz] = quadraticRoots(yMinus, y0, yPlus)
    if (nz === 0) { /* nothing to do */ } else if (nz === 1) {
      if (yMinus < 0) {
        utrise = hour + zero1
        rises = true
      } else {
        utset = hour + zero1
        sets = true
      }
    } else if (nz === 2) {
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
  if (rises || sets) {
    if (doRise) {
      if (rises) {
        hours = utrise
        flag = Rises
      } else {
        flag = NeverRises
      }
    } else if (doSet) {
      if (sets) {
        hours = utset
        flag = Sets
      } else {
        flag = NeverSets
      }
    }
  } else { // No rise or set occurred
    if (aboveHorizon) { // If above horizon, then always visible or always light
      flag = (event === SunRise || event === SunSet || event === MoonRise || event === MoonSet)
        ? AlwaysVisible
        : AlwaysLight
    } else { // If below horizon, then always invisible or always dark
      flag = (event === SunRise || event === SunSet || event === MoonRise || event === MoonSet)
        ? NeverVisible
        : AlwaysDark
    }
  }
  return [flag, hours]
}

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
  const [ra, dec] = (event === 'Moon Rise' || event === 'Moon Set') ? miniMoon(t) : miniSun(t)
  const tau = 15 * (localMeanSiderealTime(mjd, lambda) - ra)
  return sphi * sn(dec) + cphi * cs(dec) * cs(tau)
}

/**
 * Sine function that operates on \a x degrees.
 *
 *  @param degrees Angle in degrees.
 *  @returns {number} Sine in radians of the passed number of degrees.
 */
function sn (degrees) { return Math.sin(Radians * degrees) }

/**
 * Determines the solar angle to the terrain slope.
 *
 *  @param slope Terrain slope in degrees.
 *  @param aspect Terrain aspect; downslope direction in degrees clockwise from north.
 *  @param altitude Sun altitude above horizon in degrees.
 *  @param azimuth Sun azimuth in degrees clockwise from north.
 *
 *  @returns Solar angle to the slope in degrees.  A value of 90 indicates the
 *  sun is normal to the slope.  A negative number indicates that the slope is
 *  shaded.  The range is [-90..+90].
 */
export function solarAngle (slope, aspect, altitude, azimuth) {
  /* Convert slope, aspect, and sun positions from degrees to radians */
  const slpRad = Radians * (90 - slope)
  const aspRad = Radians * aspect
  const altRad = Radians * altitude
  const azmRad = Radians * azimuth
  const sunRad = Math.sin(altRad) * Math.sin(slpRad) +
      Math.cos(altRad) * Math.cos(slpRad) * Math.cos(azmRad - aspRad)
  return Math.asin(sunRad) / Radians
}

/**
 * Determines the proportion [0..1] of the solar radiation constant
 *  arriving at the forest floor given:
 *
 *  Uses the algorithm from MTCLIM.
 *
 *  @param jdate Julian date-time.
 *  @param lon Site longitude in degrees east (+) or west (-) of Greenwich Meridian
 *  @param lat Site latitude in degrees north (+) or south (-) of the equator
 *  @param elev Site elevation (ft)
 *  @param slope Terrain slope in degrees.
 *  @param aspect Terrain aspect (downslope direction in degrees clockwise from north)
 *  @param canopyTransmittance The canopy transmittance factor [0..1].
 *  @param canopyTransmittance The cloud transmittance factor [0..1].
 *  @param atmTransparency The atmospheric transparency coefficient ([0.6-0.8])
 *  - 0.80 Exceptionally clear atmosphere
 *  - 0.75 Average clear forest atmosphere
 *  - 0.70 Moderate forest (blue) haze
 *  - 0.60 Dense haze
 *
 *  \bug Does not account for reflected or diffuse radiation.  Therefore, a
 *  site will have zero radiation if any of the following are true:
 *  - the sun is below the horizon,
 *  - the slope is self-shaded,
 *  - the cloud transmittance is zero, or
 *  - the canopy transmittance is zero.
 *
 *  @returns {number} Proportion of the solar radiation constant arriving at the forest floor [0..1].
 */
export function solarRadiation (jdate, lon, lat, gmtDiff, slope, aspect, elev,
  atmTransparency, cloudTransmittance, canopyTransmittance) {
  // Get the sun position for this date.
  const [alt, azim] = sunPosition(jdate, lon, lat, gmtDiff)

  // If the sun is below the horizon, return radiation fraction of zero.
  if (alt <= 0) return 0

  // If the slope is self-shaded, return radiation fraction of zero. */
  const angle = solarAngle(slope, aspect, alt, azim)
  if (angle < 0) return 0

  // Optical air mass (from MTCLIM).
  const m = Math.exp(-0.0001467 * elev) / Math.sin(Radians * alt)

  // Proportion of sr arriving thu air mass, clouds, and canopy
  const fraction = Math.pow(atmTransparency, m) *
    cloudTransmittance *
    canopyTransmittance *
    Math.sin(Radians * angle)
  return fraction
}

/**
 * Determines the calendar date and time of the requested equinox or solstice.
 *
 *  Uses the method described by Meeus on page 90.
 *
 *  @param event One of #CDT_Spring, #CDT_SUmmer, #CDT_Fall, or #CDT_Winter.
 *  @param year Julian-Gregorian year of trhe event (-4712 or later).
 *
 *  @returns Julian date of the requested solstice or equinox.
 */
export function solsticeGMT (event, year) {
  const a = [1721139.2855, 1721233.2486, 1721325.6978, 1721414.3920]
  const b1 = [365.2421376, 365.2417284, 365.2425055, 365.2428898]
  const b2 = [0.0679190, -0.0530180, -0.1266890, -0.0109650]
  const b3 = [-0.0027879, 0.0093320, 0.0019401, -0.0084885]

  // Determine the event parameter set
  let i = 0 // SpringEquinox
  if (event === SummerSolstice) i = 1
  else if (event === FallEquinox) i = 2
  else if (event === WinterSolstice) i = 3

  // Determine GMT Julian date of the event
  const y = year / 1000
  return a[i] + b1[i] * year + b2[i] * y * y + b3[i] * y * y * y
}

/**
 * Determines the position of the sun in the sky.
 *
 *  @param jdate        Julian date-time.
 *  @param lon          Observer's longitude (west of GMT is positive).
 *  @param lat          Observer's latitude in degrees.
 *  @param gmtDiff      Local time difference from GMT (local=GMT+gmtDiff).
 *  @param *altitude    Returned sun altitude in degrees from horizon.
 *  @param *azimuth     Returned sun azimuth in degrees clockwise from north.
 *
 *  @returns {array} The sun [altitude, azimuth]
 */
export function sunPosition (jdate, lon, lat, gmtDiff) {
  // Modified Julian date adjusted for GMT difference
  const mjd = jdate - 2400000.5 - (gmtDiff / 24)

  // Sun declination and right ascension
  const t = (mjd - 51544.5) / 36525.0
  const [ra, dec] = miniSun(t)

  // Sun azimuth
  const tau = 15 * (localMeanSiderealTime(mjd, lon) - ra)
  const azimuth = (tau >= 180) ? tau - 180 : tau + 180

  // Sun altitude
  const sinPhi = Math.sin(Radians * lat)
  const cosPhi = Math.cos(Radians * lat)
  const sinDec = Math.sin(Radians * dec)
  const cosDec = Math.cos(Radians * dec)
  const cosTau = Math.cos(Radians * tau)
  const sinAlt = sinPhi * sinDec + cosPhi * cosDec * cosTau
  const altitude = Math.asin(sinAlt) / Radians
  return [altitude, azimuth]
}

/**
 * Determines if the passed arguments form a valid date and time in
 *  the Western (Julian-Gregorian) calendar.
 *
 * @param year Julian-Gregorian year (-4712 (4713 B.C.) or greater).
 * @param month Month of the year (1-12).
 * @param day Day of the month (1-31).
 * @param hour Hours past midnight (0-23).
 * @param minute Minutes past the hour (0-59).
 * @param second Seconds past the minute (0-59).
 * @param milliseconds Milliseconds past the second (0-999).
 *
 * @returns {string} One of the following string values:
 *  - ValidDateTime if all the date and time fields are valid.
 *  - InvalidYear
 *  - InvalidMonth
 *  - InvalidDay
 *  - InvalidHour
 *  - InvalidMinute
 *  - InvalidSecond
 *  - InvalidMillisecond
 */
export function validDateTime (year, month, day, hour, minute, second, millisecond) {
  let flag = validDate(year, month, day)
  if (flag !== ValidDate) return flag

  flag = validTime(hour, minute, second, millisecond)
  if (flag !== ValidTime) return flag
  return ValidDateTime
}

/**
 * Determines if the passed arguments form a valid date in
 *  the Western (Julian-Gregorian) calendar.
 *
 * @param {integer} year Julian-Gregorian year (-4712 (4713 B.C.) or greater).
 * @param {integer} month Month of the year (1-12).
 * @param {integer} day Day of the month (1-31).
 * @returns {string} One of the following string values:
 *  - ValidDate if all the date fields are valid.
 *  - InvalidYear
 *  - InvalidMonth
 *  - InvalidDay
 */
export function validDate (year, month, day) {
  if (year < -4712) return InvalidYear
  if (month < 1 || month > 12) return InvalidMonth
  if (day < 1 || day > daysInMonth(year, month)) return InvalidDay

  // Gregorian calendar check
  if (year === 1582 && month === 10) {
    if (day > 4 && day < 15) return InvalidDay
  }
  return ValidDate
}

/**
 * Determines if the passed arguments form a valid time.
 *
 * @param {integer} hour Hours past midnight (0-23).
 * @param {integer} minute Minutes past the hour (0-59).
 * @param {integer} second Seconds past the minute (0-59).
 * @param {integer} milliseconds Milliseconds past the second (0-999).
 *
 * @returns {string} One of the following string values:
 *  - ValidTime if all the time fields are valid.
 *  - InvalidHour
 *  - InvalidMinute
 *  - InvalidSecond
 *  - InvalidMillisecond
 */
export function validTime (hour, minute, second, millisecond) {
  if (hour < 0 || hour > 23) return InvalidHour
  if (minute < 0 || minute > 59) return InvalidMinute
  if (second < 0 || second > 59) return InvalidSecond
  if (millisecond < 0 || millisecond > 999) return InvalidMillisecond
  return ValidTime
}
