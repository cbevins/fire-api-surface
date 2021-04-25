/*                     Jan Feb Mar Apr May  Jun  Jul  Aug  Sep  Oct  Nov  Dec */
const DaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const DaysToMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const DaysToMonthLeap = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335] // leap years
const DaysToMonth1582 = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 294, 324] // 1582

/**
 * Formats time as hh:mm:ss
 * @param {number} h Hours, either integer [0..23] or decimal hours or Julian day number
 * @param {number} m Minutes of the hours (if h not decimal hours or Julian day number)
 * @param {number} s Seconds of the minute
 * @returns {string} Time formatted as 24-h hh:mm:ss
 */
export function clockTime (h, m, s) {
  if (arguments.length === 1) { // h must be decimal hours, or Julian day
    if (h > 24.5) { // must be a Julian day number, which begins at noon each day
      [, h, m, s] = decimalDaysToDhms((h - Math.trunc(h))) // get decimal portion of Julian day
    } else {
      [, h, m, s] = decimalHoursToDhms(h)
    }
  }
  return `${int(h, 2)}:${int(m, 2)}:${int(s, 2)}`
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
  if (month < 1 || month > 12) return 0
  if (year === 1582 && month === 10) return 21
  if (month === 2 && isLeapYear(year)) return 29
  return DaysInMonth[month - 1]
}

/**
 * Converts a real number of days to integer number of days, hours, minutes, seconds, and ms
 * @param {number} decimalDays Real number of days
 * @returns {array} [days, hours, minutes, seconds, milliseconds]
 */
export function decimalDaysToDhms (decimalDays) {
  const days = Math.trunc(decimalDays)
  const decimalHours = 24 * (decimalDays - days)
  const hours = Math.trunc(decimalHours)
  const decimalMinutes = 60 * (decimalHours - hours)
  const minutes = Math.trunc(decimalMinutes)
  const decimalSeconds = 60 * (decimalMinutes - minutes)
  const seconds = Math.trunc(decimalSeconds)
  const decimalMs = 1000 * (decimalSeconds - seconds)
  const milliseconds = Math.round(decimalMs)
  return [days, hours, minutes, seconds, milliseconds]
}

/**
 * Converts a real number of hours to integer number of days, hours, minutes, seconds, and ms
 * @param {number} decimalHours Real number of hours
 * @returns {array} [days, hours, minutes, seconds, milliseconds]
 */
export function decimalHoursToDhms (decimalHours) {
  return decimalDaysToDhms(decimalHours / 24)
}

/**
 * Converts a real number of minutes to integer number of days, hours, minutes, seconds, and ms
 * @param {number} decimalMinutes Real number of minutes
 * @returns {array} [days, hours, minutes, seconds, milliseconds]
 */
export function decimalMinutesToDhms (decimalMinutes) {
  return decimalDaysToDhms(decimalMinutes / (24 * 60))
}

/**
 * Converts a real number of seconds to integer number of days, hours, minutes, seconds, and ms
 * @param {number} decimalSeconds Real number of seconds
 * @returns {array} [days, hours, minutes, seconds, milliseconds]
 */
export function decimalSecondsToDhms (decimalSeconds) {
  return decimalDaysToDhms(decimalSeconds / (24 * 60 * 60))
}

/**
 * Expresses days, hours, minutes, and seconds as decimal {days | hours | minutes | seconds | ms}.
 *
 * @param {integer} days Days
 * @param {integer} hours Hours
 * @param {integer} minute Minutes
 * @param {integer} second Seconds
 * @param {integer} millis Milliseconds
 * @returns {number} Days as a floating point number
 */
export function dhmsToDays (days, hours = 0, minutes = 0, seconds = 0, millis = 0) {
  return dhmsToMs(days, hours, minutes, seconds, millis) / (24 * 60 * 60 * 1000)
}

export function dhmsToHours (days, hours = 0, minutes = 0, seconds = 0, millis = 0) {
  return dhmsToMs(days, hours, minutes, seconds, millis) / (60 * 60 * 1000)
}

export function dhmsToMinutes (days, hours = 0, minutes = 0, seconds = 0, millis = 0) {
  return dhmsToMs(days, hours, minutes, seconds, millis) / (60 * 1000)
}

export function dhmsToSeconds (days, hours = 0, minutes = 0, seconds = 0, millis = 0) {
  return dhmsToMs(days, hours, minutes, seconds, millis) / 1000
}

export function dhmsToMs (days, hours = 0, minutes = 0, seconds = 0, millis = 0) {
  return 1000 * ((86400 * days) + (3600 * hours) + (60 * minutes) + seconds) + millis
}

/**
 * Returns the 3-letter English abbreviation for the day-of-the-week index \a dowIndex.
 *
 * @param {integer} dowIndex The day-of-the-week index (0=SUnday, 7=Saturday)
 * @returns {string} English 3-letter abbreviation for the day-of-the-week.
 */
export function dowAbbr (dowIndex) {
  const Dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (dowIndex >= 0 && dowIndex <= 6) ? Dow[dowIndex] : 'Bad Day-of-Week index'
}

/**
 * Returns the English name for the day-of-week index \a dowIndex.
 *
 * @param {integer} dowIndex The day-of-the-week index (0=Sunday, 7=Saturday)
 * @returns {string} Full English name for the day-of-the-week.
 */
export function dowName (dowIndex) {
  const Dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return (dowIndex >= 0 && dowIndex <= 6) ? Dow[dowIndex] : 'Bad Day-of-Week index'
}

export function doyToYmd (year, doy) {
  // Select leap year or non-leap years days to the start of each month
  let dtm = isLeapYear(year) ? DaysToMonthLeap : DaysToMonth
  // Adjust for 1582 AD which is missing the ten days of Oct 5-14
  if (year === 1582) dtm = DaysToMonth1582
  let month = 0
  while (dtm[month] < doy) month++
  const day = doy - dtm[month - 1]
  return [year, month, day]
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
  const y = Math.trunc(year)
  const a = y % 19
  const b = Math.trunc(y / 100)
  const c = y % 100
  const d = Math.trunc(b / 4)
  const e = b % 4
  const f = Math.trunc((b + 8) / 25)
  const g = Math.trunc((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.trunc(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.trunc((a + 11 * h + 22 * l) / 451)
  const n = Math.trunc((h + l - 7 * m + 114) / 31)
  const p = (h + l - 7 * m + 114) % 31
  // console.log(`a=${a} b=${b} c=${c} d=${d} e=${e} f=${f} g=${g} h=${h} i=${i} k=${k} l=${l} m=${m} n=${n} p=${p}`)
  const day = p + 1
  const month = n
  return [month, day]
}

/**
 * Formats date as yyy-mm-dd
 * @param {number} y Year or Julian day number
 * @param {number} m Month of the year [1..12]
 * @param {number} d Day of the month
 * @returns {string} Date formatted as yyy-mm-dd
 */
export function formatDate (y, m, d) {
  if (arguments.length === 1) { // must be Julian day number
    ;[y, m, d] = jdToYmd(y)
  }
  return `${int(y, 4)}-${int(m, 2)}-${int(d, 2)}`
}

/**
 * Formats time as hh:mm:ss.uuu (see also clockTime())
 * @param {number} h Hours, either integer [0..23] or decimal hours, or Julian day number
 * @param {number} m Minutes of the hours (if h not decimal hours or Julian day)
 * @param {number} s Seconds of the minute
 * @param {number} ms Milleseconds
 * @returns {string} Time formatted as 24-h hh:mm:ss
 */
export function formatTime (h, m, s, ms) {
  if (arguments.length === 1) { // h must be decimal hours, or Julian day
    if (h > 24.5) { // must be a Julian day number, which begins at noon each day
      [, h, m, s, ms] = decimalDaysToDhms((h - Math.trunc(h))) // get decimal portion of Julian day
    } else {
      [, h, m, s, ms] = decimalHoursToDhms(h)
    }
  }
  const str = `${int(h, 2)}:${int(m, 2)}:${int(s, 2)}`
  return (ms > 0) ? str + `.${int(ms, 3)}` : str
}

/**
 * Formats a number as an integer with leading zeros
 * @param {number} number Number to be formatted
 * @param {number} width Final string width
 * @returns {string} String of number padded to width with leading zeros
 */
function int (number, width) { return number.toFixed(0).padStart(width, '0') }

/**
 * Determines if the year, month, and day occurs after the Gregorian calendar reform
 * @param {integer} year
 * @param {integer} month Month of the year [1..12]
 * @param {integer} day Day of thre month [1..31]
 * @returns {boolean} TRUE if the date occurs on or after Oct 15, 1582
 * (The dates Oct 5 - 14 were abolished)
 */
export function isGregorian (year, month, day) { return (year * 10000 + month * 100 + day) >= 15821015 }

/**
 * Determines if the specified year is a Julian-Gregorian leap year.
 *
 * All quadrennial years in the Julian calendar (prior to 1582) are leap years.
 *
 *  @param {integer} year Julian-Gregorian calendar year (-4712 or later).
 *  @returns {bool} TRUE if leap year
 */
export function isLeapYear (year) {
  if (year % 4 !== 0) return false // Years not divisible by 4 are NOT leap years
  if (year < 1582) return true // Years divisible by 4 prior to 1582 were leap years
  if (year % 400 === 0) return true // Years divisible by 4 and by 400 are leap years
  if (year % 100 === 0) return false // Years divisible by 4 and 100 are NOT leap years
  return true // All other years divisible by 4 are leap years
}

export function jdToMjd (jd) { return jd - 2400000.5 }

/**
 * Calculates the year, month, and decimal day of a Julian day number
 * as described by Duffett-Smith (1979) and by Meeus (1979).
 *
 * @param {number} jdn Julian day number
 * @returns {array} [year, month, day] where
 * - year is the integer year
 * - month is the integer month of the year [1..12]
 * - day is the real number of decimal days
 */
export function jdToYmd (jdn) {
  const jdnp = jdn + 0.5
  const i = Math.trunc(jdnp)
  const f = jdnp - i
  let b = i
  if (i > 2299160) {
    const alpha = Math.trunc((i - 1867216.25) / 36524.25)
    b = i + 1 + alpha - Math.trunc(alpha / 4)
  }
  const c = b + 1524
  const d = Math.trunc((c - 122.1) / 365.25)
  const e = Math.trunc(365.25 * d)
  const g = Math.trunc((c - e) / 30.6001)
  // console.log(`i=${i} f=${f} a=${a} b=${b} c=${c} d=${d} e=${e} g=${g}`)
  const day = c - e + f - Math.trunc(30.6001 * g) // decimal day (with fractional part)
  const month = (g < 13.5) ? g - 1 : g - 13
  const year = (month > 2.5) ? d - 4716 : d - 4715
  return [year, month, day]
}

export function mjdToJd (mjd) { return mjd + 2400000.5 }

export function mjdToYmd (mjd) { return jdToYmd(mjd + 2400000.5) }

/**
 * brief Returns the 3-letter English abbreviation for the \a month index
 *
 * @param {integer} month Month of the year where 1=Jan and 12=Dec.
 * @returns {string} The 3-letter English abbreviation for the month index, or "Bad month index".
 */
export function monthAbbr (month) {
  const Abbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return (month >= 1 && month <= 12) ? Abbr[month - 1] : 'Bad month index'
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
  return (month >= 1 && month <= 12) ? Name[month - 1] : 'Bad month index'
}

/**
 * Determines the day-of-the week index from the Julian date \a jdate.
 *
 * @param {number} year *Either* the integer year if passing 3 args, or the julianDay (1 arg)
 * @param {integer} month Month of the year [1..12] if passing 3 args
 * @param {integer} day Day of the month [1..31] if passing 3 args
 * @returns {integer} The day-of-the-week index (0=Sunday, 7=Saturday)
 */
export function ymdToDow (year, month, day) {
  const jdn = arguments.length === 1 ? year : ymdToJd(year, month, day)
  return Math.trunc((jdn + 1.5) % 7)
}

/**
 * Determines the day-of-the-year number.
 *
 * Day 1 is always January 1 of the year.  The day number is adjusted
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
export function ymdToDoy (year, month, day) {
  let doy = day + DaysToMonth[month - 1]

  // 1582 AD is missing the ten days of Oct 5-14
  if (year === 1582 && doy > 277) {
    doy -= 10
  } else if (doy > 59 && isLeapYear(year)) {
    doy++
  }
  return doy
}

/**
 * Calculates the Julian day number (per Duffett-Smith and also per Meeus)
 *
 * @param {integer|DateTime} year Year or a DateTime instance
 * Note that 1 AD is year === 1, while 1 BC is year === 0, and 2 BC is year === -1
 * @param {integer} month Month of the year where 1=January and 12=December
 * @param {integer} day Day of the month (1-31)
 * @returns {number} Julian day number
 */
export function ymdToJd (year, month, day) {
  const y = (month > 2) ? year : year - 1
  const m = (month > 2) ? month : month + 12
  // if Gregorian calendar date
  let a = 0
  let b = 0
  if (isGregorian(year, month, day)) {
    a = Math.trunc(y / 100)
    b = 2 - a + Math.trunc(a / 4)
  }
  const c = Math.trunc(365.25 * y)
  const d = Math.trunc(30.6001 * (m + 1))
  const jd = b + c + d + day + 1720994.5
  return jd
}

export function ymdToMjd (year, month, day) {
  return ymdToJd(year, month, day) - 2400000.5
}
