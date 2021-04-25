/**
 * DateTime is a thin wrapper around the Calendar.js library
 * to provide bult-in date and time properties.
 */
import * as Cal from './Calendar.js'

export class DateTime {
  /**
   * DateTime constructor
   * @param {integer} year Julian-Gregorian year (-4712 (4713 B.C.) or greater)
   * @param {integer} month month of the year (1-12)
   * @param {integer} day day of the month (1-31)
   * @param {integer} hour hours past midnight (0-23)
   * @param {integer} minute minutes past the hour (0-59)
   * @param {integer} second seconds past the minute (0-59)
   * @param {integer} millisecond milliseconds past the second (0-999).
  */
  constructor (year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0) {
    this.setDateTime(year, month, day, hour, minute, second, millisecond)
  }

  asArray () {
    return [this._year, this._month, this._day, this._hour, this._minute, this._second, this._millisecond]
  }

  asDhmsu () {
    return [this._day, this._hour, this._minute, this._second, this._millisecond]
  }

  asHmsu () {
    return [this._hour, this._minute, this._second, this._millisecond]
  }

  asYmd () {
    return [this._year, this._month, this._day]
  }

  clockTime () { return Cal.clockTime(this._hour, this._minute, this._second) }

  day () { return this._day }

  daysInMonth () { return Cal.daysInMonth(this._year, this._month) }

  decimalTime () {
    return Cal.dhmsToDays(0, this._hour, this._minute, this._second, this._millisecond)
  }

  dow () { return this._dow }

  dowAbbr () { return Cal.dowAbbr(this._dow) }

  dowName () { return Cal.dowName(this._dow) }

  doy () { return this._doy }

  formatDate () { return Cal.formatDate(this._year, this._month, this._day) }

  formatTime () { return Cal.formatTime(this._hour, this._minute, this._second) }

  hour () { return this._hour }

  isGregorian () { return Cal.isGregorian(this._year, this._month, this._day) }

  isLeapYear () { return Cal.isLeapYear(this._year) }

  jd () { return this._jd }

  minute () { return this._minute }

  month () { return this._month }

  mjd () { return this._mjd }

  monthAbbr () { return Cal.monthAbbr(this._month) }

  monthName () { return Cal.monthName(this._month) }

  ms () { return this._millisecond }

  second () { return this._second }

  setDateTime (year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0) {
    this._year = year
    this._month = month
    this._day = day
    this._hour = hour
    this._minute = minute
    this._second = second
    this._millisecond = millisecond
    return this.update()
  }

  setDate (year, month = 1, day = 1) {
    this._year = year
    this._month = month
    this._day = day
    return this.update()
  }

  setTime (hour = 0, minute = 0, second = 0, millisecond = 0) {
    this._hour = hour
    this._minute = minute
    this._second = second
    this._millisecond = millisecond
    return this.update()
  }

  update () { return this.updateDow().updateDoy().updateJd().updateMjd() }

  updateDow () {
    this._dow = Cal.ymdToDow(this._year, this._month, this._day)
    return this
  }

  updateDoy () {
    this._doy = Cal.ymdToDoy(this._year, this._month, this._day)
    return this
  }

  updateJd () {
    this._jd = Cal.ymdToJd(this._year, this._month, this._day)
    return this
  }

  updateMjd () {
    this._mjd = Cal.ymdToMjd(this._year, this._month, this._day)
    return this
  }

  year () { return this._year }
}
