//------------------------------------------------------------------------------
/*! \file datetime.js
 *  \author Copyright (C) 2002-2018 by Collin D. Bevins.  All rights reserved.
 *
 *  \brief C++ wrapper for calendar, date, and time functions.
 *
 *  The DateTime and GlobalPosition classes provide a C++ wrapper for
 *  the Calender-Date-Time Library in cdtlib.c.
 */

// Imports
import * as CDT from './cdtlib.js'

// #include "datetime.h"
// #include "globalposition.h"

//------------------------------------------------------------------------------
/*! \brief Constructs a new DateTime using the passed values.
 *
 *  \param year Julian-Gregorian year (-4712 or later).
 *  \param month Month of the year (1=Jan, 12=Dec).
 *  \param day Day of the month (1-31).
 *  \param hour Hour of the day (0-23).
 *  \param minute Minute of the hour (0-59).
 *  \param second Second of the minute (0-59).
 *  \param millisecond Millisecond of the second (0-999).
 *
 *  \sa DateTime()
 */

export class DateTime {
  constructor(year, month, day, hour, minute, second, millisecond ) {
    if(arguments.length === 0) {
      setSystem()
      return
    }
    this.year = year
    this.month = month
    this.day = day
    this.hour = hour
    this.minute = minute
    this.second = second
    this.millisecond = millisecond
    this.event = CDT.User
    this.flag = CDT.None
    // Update
    this.julian = this.calculateJulianDate()
    this.isValid() // At least set the flag even tho we can't return it
  }

//------------------------------------------------------------------------------
/*! \brief Adds some number of decimal days to the current DateTime value.
 *
 *  \param days Number of decimal days to add;
 *   may be positive, zero, or negative.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  \sa addHours(), addMinutes(), addSeconds(), addMilliseconds().
 */

  addDays (days ) {
    this.jdate += days
    // Update
    this.event = CDT.User
    this.calculateJulianDate()
    return this.isValid()
  }

//------------------------------------------------------------------------------
/*! \brief Adds some number of decimal hours to the current DateTime value.
 *
 *  \param hours Number of decimal hours to add;
 *   may be positive, zero, or negative.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  \sa addDays(), addMinutes(), addSeconds(), addMilliseconds().
 */
  addHours (hours) { return this.addDays( hours / 24 ) }

//------------------------------------------------------------------------------
/*! \brief Adds some number of decimal hours to the current DateTime value.
 *
 *  \param minutes Number of decimal minutes to add;
 *   may be positive, zero, or negative.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  \sa addDays(), addHours(), addSeconds(), addMilliseconds().
 */
  addMinutes (minutes) { return this.addDays( minutes / 1440 ) }

//------------------------------------------------------------------------------
/*! \brief Adds some number of decimal seconds to the current DateTime value.
 *
 *  \param seconds a Number of decimal seconds to add;
 *   may be positive, zero, or negative.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  \sa addDays(), addHours(), addMinutes(), addMilliseconds().
 */
  addSeconds (seconds) { return this.addDays( seconds / 86400 ) }

//------------------------------------------------------------------------------
/*! \brief Adds some number of whole milliseconds to the current DateTime value.
 *
 *  \param milliseconds Number of whole milliseconds to add;
 *   may be positive, zero, or negative.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  \sa addDays(), addHours(), addMinutes(), addSeconds(), MillisecondsOfDay().
 */
  addMilliseconds (milliseconds) { return this.addDays(milliseconds / 86400000) }

//------------------------------------------------------------------------------
/*! \brief Determines the time of astronomical dawn for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  The astronomical dawn occurs when the rising sun reaches 18 degrees
 *  below the horizon.
 *
 *  If the #CDT.Flag returned by flag() is #CDT.Rises,
 *  then astronomical dawn occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then dawn doesn't occur on the date because it is polar day,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then dawn doesn't occur on the date because it is polar night,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.AstronomicalDawn.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of dawn.
 *
 *  \sa astronimicalDusk(), civilDawn(), civilDusk(), nauticalDawn(),
 *  nauticalDusk().
 */
  astronomicalDawn (globalPosition) { return this.calculateSunTime( CDT.AstronomicalDawn, globalPosition ) }

//------------------------------------------------------------------------------
/*! \brief Determines the time of astronomical dusk for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  The astronomical dusk occurs when the setting sun reaches 18 degrees
 *  below the horizon.
 *
 *  If the #CDT.Flag returned by flag() is #CDT.Sets,
 *  then astronomical dusk occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then dusk doesn't occur on the date because it is polar day,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then dusk doesn't occur on the date because it is polar night,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.AstronomicalDusk.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of dawn.
 *
 *  \sa astronimicalDawn(), civilDawn(), civilDusk(), nauticalDawn(),
 *  nauticalDusk().
 */
  astronomicalDusk (globalPosition) { return this.calculateSunTime( CDT.AstronomicalDusk, globalPosition ) }

//------------------------------------------------------------------------------
/*! \brief Calculates the calendar date and time from the current DateTime
 *  \a this.jdate Julian date.
 *
 *  The algorithms of Duffett-Smith and Meeus are used as described for
 *  CDT.CalendarDate().
 *
 *  \warning No date or time validation is performed before the calendar
 *  date and time is calculated.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  \sa CDT.CalendarDate().
 */
  calculateCalendarDate () {
    this.CDT.CalendarDate( this.jdate, this.year, this.month, this.day,
      this.hour, this.minute, this.second, this.millisecond )
    return this.isValid()
}

//------------------------------------------------------------------------------
/*! \brief Calculates the Julian date from the DateTime current date and
 *  time data members.
 *
 *  Calls CDT.JulianDate() to perform the actual computations.
 *
 *  \return The Julian date in decimal days since 1 Jan -4712.  On return the
 *  #this.jdate data member is updated.
 *
 *  \sa CDT.JulianDate().
 */
  calculateJulianDate () {
    return this.CDT.JulianDate( this.year, this.month, this.day,
        this.hour, this.minute, this.second, this.millisecond )
  }

//------------------------------------------------------------------------------
/*! \brief Calculates the calendar date-time of an equinox or solstice
 *  #CDT.Event for the current DateTime year.
 *
 *  Calls #CDT.SolsticeGMT() to perform the computation.
 *
 *  \param event One of the #CDT.Event enumeration values:
 *  \arg #CDT.Spring for the spring (March) equinox date and time,
 *  \arg #CDT.Summer for the summer (June) solstice date and time,
 *  \arg #CDT.Fall for the fall (September) equinox date and time, or
 *  \arg #CDT.Winter for the winter (December) solstice date and time.
 *  \param gp Reference to an existing GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 */
  calculateSolstice (event, gp) {
    // Determine GMT Julian date of the event
    this.jdate = this.CDT.SolsticeGMT(event, this.year)

    // Add time zone difference from GMT
    this.jdate += (gp.gmtDiff() / 24)

    // Update (this.flag must be set by the caller)
    this.calculateCalendarDate()
    return this.isValid()
}

//------------------------------------------------------------------------------
/*! \brief calculates the rise or set times for a GlobalPosition for the
 *  current DateTime #this.year, #this.mont, and #this.day values.
 *
 *  Called by one of the family of rise/set functions to derive the time of
 *  the event.
 *
 *  \param event One of the #CDT.Event enumeration values:
 *  \arg #CDT.SunRise
 *  \arg #CDT.SunSet
 *  \arg #CDT.MoonRise
 *  \arg #CDT.MoonSet
 *  \arg #CDT.AstronomicalDawn
 *  \arg #CDT.AstronomicalDusk
 *  \arg #CDT.CivilDawn
 *  \arg #CDT.CivilDusk
 *  \arg #CDT.NauticalDawn
 *  \arg #CDT.NauticalDusk
 *  \param gp Reference to an existing GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 */
  calculateSunTime (event, gp) {
    // Get the local rise/set time of this event and save the flag
    hours = 0
    flag = CDT.RiseSet( (int) event, this.jdate, gp.longitude(),
        gp.latitude(), gp.gmtDiff(), &hours );

    // Add the event time to the Julian date
    this.jdate += ( hours / 24. );

    // Update the calendar
    this.event = event;
    calculateCalendarDate();
    if ( ! isValid() )
    {
        return( false );
    }

    // Since the validation routine updates this.flag, set it back again.
    this.flag = flag;
    return( true );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of civil dawn for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  The civil dawn occurs when the rising sun reaches 6 degrees
 *  below the horizon.
 *
 *  If the #CDT.Flag returned by flag() returns #CDT.Rises,
 *  then civil dawn occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then dawn doesn't occur on the date because it is polar day,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then dawn doesn't occur on the date because it is polar night,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.CivilDawn.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of dawn.
 *
 *  \sa astronimicalDawn(), astronicalDusk(), civilDusk(), nauticalDawn(),
 *  nauticalDusk().
 */

bool DateTime::civilDawn( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.CivilDawn, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of civil dusk for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  The civil dusk occurs when the setting sun reaches 6 degrees
 *  below the horizon.
 *
 *  If the #CDT.Flag returned by flag() returns #CDT.Sets,
 *  then civil dusk occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then dusk doesn't occur on the date because it is polar day,
 *  and the resulting DateTime time is undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then dusk doesn't occur on the date because it is polar night,
 *  and the resulting DateTime time is undefined.
 *
 *  After calling this function, event() returns #CDT.CivilDusk.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of dawn.
 *
 *  \sa astronimicalDawn(), astronicalDusk(), civilDawn(), nauticalDawn(),
 *  nauticalDusk().
 */

bool DateTime::civilDusk( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.CivilDusk, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime day of the month.
 *
 *  \return Current value of the DateTime day of the month (1-31).
 */

int DateTime::day( void ) const
{
    return( this.day );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime day to newDay.
 *
 *  \param newDay New day of the month (1-31).
 *
 *  \return New day of the month value (1-31).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::day( int newDay )
{
    this.day = newDay;
    calculateJulianDate();
    isValid();
    return( this.day );
}

//------------------------------------------------------------------------------
/*! \brief detrmines the day-of-the-week index for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  Calls #CDT.DayOfWeek() to perform the calculation.
 *
 *  \retval 0 = Sun
 *  \retval 1 = Mon
 *  \retval 2 = Tue
 *  \retval 3 = Wed
 *  \retval 4 = Thu
 *  \retval 5 = Fri
 *  \retval 6 = Sat
 */

int DateTime::dayOfWeek( void ) const
{
    return( CDT.DayOfWeek( this.jdate ) );
}

//------------------------------------------------------------------------------
/*! \brief Returns the 3-letter English abbreviation for the current
 *  DateTime #this.year, #this.month, and #this.day.
 *
 *  Calls #CDT.DayOfWeekAbbreviation() to perform the calculation.
 *
 *  \return Pointer to a static string containing the 3-letter English
 *  abbreviation for the current DateTime day-of-the-week,
 *  or a pointer to the static string "Bad Day-of-Week Index".
 */

const char *DateTime::dayOfWeekAbbreviation( void ) const
{
    return( CDT.DayOfWeekAbbreviation( dayOfWeek() ) );
}

//------------------------------------------------------------------------------
/*! \brief Returns the English name for the current DateTime #this.year,
 *  #this.month, and #this.day.
 *
 *  Calls #CDT.DayOfWeekName() to perform the calculation.
 *
 *  \return Pointer to a static string containing the English name for the
 *  current DateTime day-of-the-week,
 *  or a pointer to the static string "Bad Day-of-Week Index".
 */

const char *DateTime::dayOfWeekName( void ) const
{
    return( CDT.DayOfWeekName( dayOfWeek() ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the day of the year for the current DateTime #this.year,
 *  #this.month, and #this.day.
 *
 *  Julian leap years, Gregorian leap years, and the Gregorian calendar
 *  reform of 1582 is taken into account.
 *
 *  Calls #CDT.DayOfYear() to perform the calculation.
 *
 *  \return Current DateTime day-of-the-year (1-366).
 */

int DateTime::dayOfYear( void ) const
{
    return( CDT.DayOfYear( this.year, this.month, this.day ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the days in the month for the current DateTime #this.year
 *  and #this.month.
 *
 *  Julian leap years, Gregorian leap years, and the Gregorian calendar
 *  reform of 1582 is taken into account.
 *
 *  Calls CDT.DaysInMonth() to perform the calculation.
 *
 *  \return Days in the month for the current DateTime (21-31).
 */

int DateTime::daysInMonth( void ) const
{
    return( CDT.DaysInMonth( this.year, this.month ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the days in the month for the current DateTime #this.year.
 *
 *  Julian leap years, Gregorian leap years, and the Gregorian calendar
 *  reform of 1582 is taken into account.
 *
 *  Calls CDT.DaysInYear() to perform the calculation.
 *
 *  \return Days in the year for the current DateTime (355, 365, or 366).
 */

int DateTime::daysInYear( void ) const
{
    return( CDT.DaysInYear( this.year ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the number of days since another DateTime.

 *  The result is positive if \a dt is earlier than \a this DateTime.
 *  The result is negative if \a dt is later than \a this DateTime.
 *
 *  \param dt Reference to an existing DateTime instance.
 *
 *  \return Decimal days since \a dt DateTime and \a this DateTime.
 *
 *  \sa daysUntil(), hoursUntil(), hoursSince().
 */

double DateTime::daysSince( const DateTime &dt ) const
{
    return( this.jdate - dt.this.jdate );
}

//------------------------------------------------------------------------------
/*! \brief Determines the number of days until another DateTime.
 *
 *  The result is negative if \a dt is earlier than \a this DateTime.
 *  The result is positive if \a dt is later than \a this DateTime.
 *
 *  \param dt Reference to an existing DateTime instance.
 *
 *  \return Decimal days from \a this DateTime until \a dt DateTime.
 *
 *  \sa daysSince(), hoursSince(), hoursUntil().
 */

double DateTime::daysUntil( const DateTime &dt ) const
{
    return( dt.this.jdate - this.jdate );
}

//------------------------------------------------------------------------------
/*! \brief Determines the elapsed portion of the DateTime #this.day since midnight.
 *
 *  \return The elapsed portion of the DateTime #this.day since midnight in
 *  decimal days.
 *
 *  \sa millisecondOfDay(), decimalHour()
 */

double DateTime::decimalDay( void ) const
{
    return( CDT.DecimalDay( this.hour, this.minute, this.second, this.millisecond ) ) ;
}

//------------------------------------------------------------------------------
/*! \brief Determines the DateTime elapsed hours since midnight.
 *
 *  \return The elapsed portion of the DateTime day since midnight in
 *  decimal hours.
 *
 *  \sa millisecondOfDay(), decimalDay()
 */

double DateTime::decimalHour( void ) const
{
    return( CDT.DecimalHour( this.hour, this.minute, this.second, this.millisecond ) ) ;
}

//------------------------------------------------------------------------------
/*! \brief Determines the date of Easter for the specified \a year.
 *
 *  Calls CDT.EasterDay() to perform the computations.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later).
 *
 *  \warning Valid \e only for the Gregorian calendar (1583 and later).
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return #this.year is set to \a year, #this.month is set to the month of
 *  Easter (3=March, 4=April) and #this.day is set to the day of easter
 *  for the \a year.
 *
 *  \sa easter().
 */

bool DateTime::easter( int year )
{
    this.year = year;
    return( easter() );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date of Easter for the current DateTime #this.year.
 *
 *  Calls CDT.EasterDay() to perform the computations.
 *
 *  \warning Valid \e only for the Gregorian calendar (1583 and later).
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return #this.month is set to the month of Easter (3=March, 4=April)
 *  and #this.day is set to the day of easter for the #this.year.
 *
 *  \sa easter(int year).
 */

bool DateTime::easter( void )
{
    CDT.EasterDay( this.year, &this.month, &this.day );
    this.hour = 12;
    this.minute = this.second = this.millisecond = 0;
    // Update
    calculateJulianDate();
    this.event = CDT.Easter;
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Gets the #CDT.Event enumeration value indicating the last operation
 *  on performed on this DateTime.
 *
 *  \return One of the #CDT.Event enumeration values.
 */

int DateTime::event( void ) const
{
    return( this.event );
}

//------------------------------------------------------------------------------
/*! \brief Gets the brief name of the #CDT.Event enumeration value indicating
 *  the last operation on performed on this DateTime.
 *
 *  \return Pointer to a static string containing the English name of the
 *  #CDT.Event enumeration value.
 */

const char *DateTime::eventName( void ) const
{
    return( CDT.EventName( this.event ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the fall equinox for \a year.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later).
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the fall
 *  equinox for \a year, and event() returns #CDT.Fall.
 */

bool DateTime::fallEquinox( int year, const GlobalPosition &gp )
{
    this.year = year;
    return( fallEquinox( gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the fall equinox for the current
 *  DateTime #this.year.
 *
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the fall
 *  equinox for \a year, and event() returns #CDT.Fall.
 */

bool DateTime::fallEquinox( const GlobalPosition &gp )
{
    calculateSolstice( (this.event = CDT.Fall), gp );
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Gets the #CDT.Flag enumeration value indicating the result condition
 *  of the last operation on performed on this DateTime.
 *
 *  \return One of the #CDT.Flag enumeration values.
 */

int DateTime::flag( void ) const
{
    return( this.flag );
}

//------------------------------------------------------------------------------
/*! \brief Gets the brief name of the #CDT.Flag enumeration value indicating
 *  the result condition of the last operation on performed on this DateTime.
 *
 *  \return Pointer to a static string containing the English name of the
 *  #CDT.Flag enumeration value.
 */

const char *DateTime::flagName( void ) const
{
    return( CDT.FlagName( this.flag ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the full moon following the
 *  \a period new moon for the current DateTime #this.year at the GlobalPosition
 *  and stores the result in the DateTime.
 *
 *  \param period Lunation period; 1 == first new moon of \a year, 2 == second
 *  new moon of \a year, etc.  Use period==0 to get the last new moon prior to
 *  \a year.
 *  \param gp Reference to an existing GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return #this.event is set to #CDT.NewMoon and
 *  the remaining DateTime fields contains the date and time of the new moon.
 */

bool DateTime::fullMoon( int period, const GlobalPosition &gp )
{
    int l_year = this.year;
    newMoon( period, gp );
    double date0 = this.jdate;
    newMoon( l_year, period+1, gp );
    double date1 = this.jdate;
    this.jdate = 0.5 * (date0 + date1);

    // Update
    calculateCalendarDate();
    this.event = CDT.FullMoon;
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime hour of the day.
 *
 *  \return Current value of the DateTime hour of the day (0-23).
 */

int DateTime::hour( void ) const
{
    return( this.hour );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime hour to newHour.
 *
 *  \param newHour New hour of the day; e.g. elapsed hours since midnight (0-23).
 *
 *  \return New hour of the day value (0-23).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::hour( int newHour )
{
    this.hour = newHour;
    calculateJulianDate();
    isValid();
    return( this.hour );
}

//------------------------------------------------------------------------------
/*! \brief Determines the number of hours since another DateTime.
 *
 *  The result is positive if \a dt is earlier than \a this DateTime.
 *  The result is negative if \a dt is later than \a this DateTime.
 *
 *  \param dt Reference to an existing DateTime instance.
 *
 *  \return Decimal hours since \a dt DateTime and \a this DateTime.
 *
 *  \sa daysSince(), daysUntil(), hoursUntil().
 */

double DateTime::hoursSince( const DateTime &dt ) const
{
    return( 24. * (this.jdate - dt.this.jdate) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the number of hours until another DateTime.
 *
 *  The result is negative if \a dt is earlier than \a this DateTime.
 *  The result is positive if \a dt is later than \a this DateTime.
 *
 *  \param dt Reference to an existing DateTime instance.
 *
 *  \return Decimal hours from \a this DateTime until \a dt DateTime.
 *
 *  \sa daysSince(), daysUntil(), hoursSince().
 */
double DateTime::hoursUntil( const DateTime &dt ) const
{
    return( 24. * (dt.this.jdate - this.jdate) );
}

//------------------------------------------------------------------------------
/*! \brief determines the number of leap days for the current DateTime #this.year.
 *
 *  Accounts for both Julian and Gregorian leap years.
 *
 *  \return Number of leap days for the current DateTime #this.year (0 or 1).
 */

int DateTime::isLeapYear( void ) const
{
    return( CDT.LeapYear( this.year ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines if all the current DateTime date and time data member
 *  values are valid.
 *
 *  On return #this.flag has one of the following #CDT.Flag enumeration values
 *  (which may be queried via flag()):
 *  \arg #CDT.HasValidDateTime if all the date and time fields are valid.
 *  \arg #CDT.HasInvalidYear
 *  \arg #CDT.HasInvalidMonth
 *  \arg #CDT.HasInvalidDay
 *  \arg #CDT.HasInvalidHour
 *  \arg #CDT.HasInvalidMinute
 *  \arg #CDT.HasInvalidSecond
 *  \arg #CDT.HasInvalidMillisecond
 *
 *  \return Sets the #this.flag and returns TRUE if valid, FALSE if invalid.
 *
 *  \sa isValidDate(), isValidTime().
 */

bool DateTime::isValid( void )
{
    if ( ( this.flag =
            CDT.ValidDateTime( this.year, this.month, this.day,
                this.hour, this.minute, this.second, this.millisecond ) )
        != CDT.HasValidDateTime )
    {
        return( false );
    }
    return( true );
}

//------------------------------------------------------------------------------
/*! \brief Determines if the current DateTime #this.year, #this.month, and #this.day
 *  values are valid.
 *
 *  On return #this.flag has one of the following #CDT.Flag enumeration values
 *  (which may be queried via flag()):
 *  \arg #CDT.HasValidDate if all the date fields are valid.
 *  \arg #CDT.HasInvalidYear
 *  \arg #CDT.HasInvalidMonth
 *  \arg #CDT.HasInvalidDay
 *
 *  \return Sets the #this.flag and returns TRUE if valid, FALSE if invalid.
 *
 *  \sa isValidDate(), isValidTime().
 */

bool DateTime::isValidDate( void )
{
    if ( ( this.flag =
            CDT.ValidDate( this.year, this.month, this.day ) )
        != CDT.HasValidDate )
    {
        return( false );
    }
    return( true );
}

//------------------------------------------------------------------------------
/*! \brief Determines if the current DateTime #this.hour, #this.minute,
 *  #m-second, and #this.millisecond values are valid.
 *
 *  On return #this.flag has one of the following #CDT.Flag enumeration values
 *  (which may be queried via flag()):
 *  \arg #CDT.HasValidTime if all the time fields are valid.
 *  \arg #CDT.HasInvalidHour
 *  \arg #CDT.HasInvalidMinute
 *  \arg #CDT.HasInvalidSecond
 *  \arg #CDT.HasInvalidMillisecond
 *
 *  \return Sets the #this.flag and returns TRUE if valid, FALSE if invalid.
 *
 *  \sa isValidDate(), isValidDateTime().
 */

bool DateTime::isValidTime( void )
{
    if ( ( this.flag =
            CDT.ValidTime( this.hour, this.minute, this.second, this.millisecond ) )
        != CDT.HasValidTime )
    {
        return( false );
    }
    return( true );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime Julian date.
 *
 *  \return Current value of the DateTime Julian date in days since noon of
 *  January 1, 4713 B.C.
 */

double DateTime::julianDate( void ) const
{
    return( this.jdate );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime millisecond of the second.
 *
 *  \return Current value of the DateTime millisecond of the second (0-999).
 */

int DateTime::millisecond( void ) const
{
    return( this.millisecond );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime millisecond to newMillisecond.
 *
 *  \param newMillisecond New millisecond of the second (0-999).
 *
 *  \return New millisecond of the second value (0-999).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::millisecond( int newMillisecond )
{
    this.millisecond = newMillisecond;
    calculateJulianDate();
    isValid();
    return( this.millisecond );
}

//------------------------------------------------------------------------------
/*! \brief Determines the number of milliseconds elapsed since midnight for
 *  the current DateTime.
 *
 *  \return Milliseconds past midnight for the current DateTime (0 - 86399999).
 */

int DateTime::millisecondOfDay( void ) const
{
    return( CDT.MillisecondOfDay( this.hour, this.minute, this.second, this.millisecond ) );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime minute of the hour.
 *
 *  \return Current value of the DateTime minute of the hour (0-59).
 */

int DateTime::minute( void ) const
{
    return( this.minute );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime minute to newMinute.
 *
 *  \param newMinute New minute of the hour (0-59).
 *
 *  \return New minute of the hour value (0-59).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::minute( int newMinute )
{
    this.minute = newMinute;
    calculateJulianDate();
    isValid();
    return( this.minute );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime \e modified Julian date.
 *
 *  \return Current value of the DateTime \e modified Julian date in days
 *  since midnight of 1858 Nov 17.
 */

double DateTime::modifiedJulianDate( void ) const
{
    return( CDT.ModifiedJulianDate( this.jdate ) );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime month of the year (1-12).
 *
 *  \return Current value of the DateTime month of the year (1-12).
 */

int DateTime::month( void ) const
{
    return( this.month );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime month to newMonth.
 *
 *  \param newMonth New month of the year (1-12).
 *
 *  \return New month of the year value (1-12).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::month( int newMonth )
{
    this.month = newMonth;
    calculateJulianDate();
    isValid();
    return( this.month );
}

//------------------------------------------------------------------------------
/*! \brief Returns the 3-letter English abbreviation for the current
 *  DateTime #this.month.
 *
 *  Calls #CDT.MonthAbbreviation() to perform the calculation.
 *
 *  \return Pointer to a static string containing the 3-letter English
 *  abbreviation for the current DateTime month.
 */

const char *DateTime::monthAbbreviation( void ) const
{
    return( CDT.MonthAbbreviation( this.month ) );
}

//------------------------------------------------------------------------------
/*! \brief Returns the English name for the current  DateTime #this.month.
 *
 *  Calls #CDT.MonthName() to perform the calculation.
 *
 *  \return Pointer to a static string containing the English  name for the
 *  current DateTime month.
 */

const char *DateTime::monthName( void ) const
{
    return( CDT.MonthName( this.month ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of moonrise for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  If the #CDT.Flag returned by flag() returns #CDT.Rises,
 *  then a moonrise occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.NeverRises,
 *  then a moonrise does not occur on the date
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Light,
 *  then it is polar day and the moon is always visible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then it is polar night and the moon is always invisible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.MoonRise.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of moonrise.
 *
 *  \sa moonSet(), sunRise(), sunSet().
 */

bool DateTime::moonRise( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.MoonRise, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of moonset for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  If the #CDT.Flag returned by flag() returns #CDT.Sets,
 *  then a moonset occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.NeverSets,
 *  then a moonrise does not occur on the date
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Light,
 *  then it is polar day and the moon is always visible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then it is polar night and the moon is always invisible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.MoonSet.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of moonset.
 *
 *  \sa moonRise(), sunRise(), sunSet().
 */

bool DateTime::moonSet( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.MoonSet, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of nautical dawn for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  The nautical dawn occurs when the rising sun reaches 12 degrees
 *  below the horizon.
 *
 *  If the #CDT.Flag returned by flag() is #CDT.Rises,
 *  then nautical dawn occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then dawn doesn't occur on the date because it is polar day,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then dawn doesn't occur on the date because it is polar night,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.NauticalDawn.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of dawn.
 *
 *  \sa astronimicalDawn(), astronicalDusk(), civilDawn(), civilDusk(),
 *  nauticalDusk().
 */

bool DateTime::nauticalDawn( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.NauticalDawn, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of nautical dusk for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  The nautical dusk occurs when the setting sun reaches 12 degrees
 *  below the horizon.
 *
 *  If the #CDT.Flag returned by flag() is #CDT.Sets,
 *  then nautical dusk occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then dusk doesn't occur on the date because it is polar day,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then dusk doesn't occur on the date because it is polar night,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.NauticalDusk.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of dawn.
 *
 *  \sa astronimicalDawn(), astronicalDusk(), civilDawn(), civilDusk(),
 *  nauticalDawn().
 */

bool DateTime::nauticalDusk( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.NauticalDusk, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the \a year's \a period new moon at
 *  the GlobalPosition and stores the result in the DateTime.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later) for the new moon.
 *  \param period Lunation period; 1 == first new moon of \a year, 2 == second
 *  new moon of \a year, etc.  Use period==0 to get the last new moon prior to
 *  \a year.
 *  \param gp Reference to an existing GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return #this.event is set to #CDT.NewMoon, #this.year is set to \a year, and
 *  the remaining DateTime fields contains the date and time of the new moon.
 */

bool DateTime::newMoon( int year, int period, const GlobalPosition &gp )
{
    this.year = year;
    return( newMoon( period, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the \a period new moon for the
 *  current DateTime #this.year at the GlobalPosition
 *  and stores the result in the DateTime.
 *
 *  \param period Lunation period; 1 == first new moon of \a year, 2 == second
 *  new moon of \a year, etc.  Use period==0 to get the last new moon prior to
 *  \a year.
 *  \param gp Reference to an existing GlobalPosition instance.
 *
 *  \par Important Note
 *  Calling this with period==0 will get the last new moon before this year,
 *  \b BUT it will also reset the #this.year to the previous year!
 *  Any subsequent call will then be getting lunations from the \e PREVIOUS
 *  year.  Subsequent calls should use the 3-parameter form ::newMoon(
 *  int year, int period, const GlobalPosition &gp ).
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return #this.event is set to #CDT.NewMoon and
 *  the remaining DateTime fields contains the date and time of the new moon.
 */

bool DateTime::newMoon( int period, const GlobalPosition &gp )
{
    // Get new moon GMT and adjust to local time
    this.jdate = CDT.NewMoonGMT( this.year, period) + ( gp.gmtDiff() / 24. );

    // Update
    calculateCalendarDate();
    this.event = CDT.NewMoon;
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Prints the current DateTime member data values to the file stream.
 *
 *  \param fptr Pointer to an open file stream.
 *
 *  \return The function returns nothing.
 */

void DateTime::print( FILE *fptr ) const
{
    fprintf( fptr,
        "%s is %s %s %02d, %04d (%03d) at %02d:%02d:%02d.%03d %s [jd %1.9f]\n",
        eventName(), dayOfWeekAbbreviation(), monthAbbreviation(), this.day,
        this.year, dayOfYear(), this.hour, this.minute, this.second, this.millisecond,
        flagName(), this.jdate );
    return;
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime second of the hour.
 *
 *  \return Current value of the DateTime second of the hour (0-59).
 */

int DateTime::second( void ) const
{
    return( this.second );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime second to newSecond.
 *
 *  \param newSecond New second of the minute (0-59).
 *
 *  \return New second of the minute value (0-59).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::second( int newSecond )
{
    this.second = newSecond;
    calculateJulianDate();
    isValid();
    return( this.second );
}

//------------------------------------------------------------------------------
/*! \brief Sets all the DateTime data members from the passed Julian date.
 *
 *  \param julianDate Julian date (-4712 or later).
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 */

bool DateTime::set( double julianDate )
{
    this.jdate = julianDate;
    return( calculateCalendarDate() );
}

//------------------------------------------------------------------------------
/*! \brief Sets all the DateTime data members from the passed arguments.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later).
 *  \param month Month of the year (1=Jan, 12=Dec).
 *  \param day Day of the month (1-31).
 *  \param hour Hour of the day (0-23).
 *  \param minute Minute of the hour (0-59).
 *  \param second Second of the minute (0-59).
 *  \param millisecond Millisecond of the second (0-999).
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 */

bool DateTime::set( int year, int month, int day, int hour, int minute,
        int second, int millisecond )
{
    // Store the passed values
    this.year          = year;
    this.month         = month;
    this.day           = day;
    this.hour          = hour;
    this.minute        = minute;
    this.second        = second;
    this.millisecond   = millisecond;

    // Update
    this.event = CDT.User;
    calculateJulianDate();
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Sets all the data members of the DateTime to the current system
 *  clock values.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 */

bool DateTime::setSystem( void )
{
    // Get the current system date and time
    time_t now = time( (time_t *) NULL );
    struct tm *t = localtime( &now );

    // Store in the DateTime
    this.year          = t->tthis.year + 1900;
    this.month         = t->tthis.mon + 1;
    this.day           = t->tthis.mday;
    this.hour          = t->tthis.hour;
    this.minute        = t->tthis.min;
    this.second        = t->tthis.sec;
    this.millisecond   = 0;

    // Update
    this.event = CDT.System;
    calculateJulianDate();
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Sets the DateTime time data members from the passed arguments.
 *
 *  \param hour Hour of the day (0-23).
 *  \param minute Minute of the hour (0-59).
 *  \param second Second of the minute (0-59).
 *  \param millisecond Millisecond of the second (0-999).
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 */

bool DateTime::setTime( int hour, int minute, int second, int millisecond )
{
    if ( hour >= 0 )
    {
        this.hour = hour;
    }
    if ( minute >= 0 )
    {
        this.minute = minute;
    }
    if ( second >= 0 )
    {
        this.second = second;
    }
    if ( millisecond >= 0 )
    {
        this.millisecond = millisecond;
    }

    // Update
    this.event = CDT.User;
    calculateJulianDate();
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the spring equinox for \a year.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later).
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the spring
 *  equinox for \a year, and event() returns #CDT.Spring.
 */

bool DateTime::springEquinox( int year, const GlobalPosition &gp )
{
    this.year = year;
    return( springEquinox( gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the spring equinox for the current
 *  DateTime #this.year.
 *
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the spring
 *  equinox for \a year, and event() returns #CDT.Spring.
 */

bool DateTime::springEquinox( const GlobalPosition &gp)
{
    calculateSolstice( (this.event = CDT.Spring), gp );
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the summer solstice for \a year.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later).
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the summer
 *  solstice for \a year, and event() returns #CDT.Summer.
 */

bool DateTime::summerSolstice( int year, const GlobalPosition &gp )
{
    this.year = year;
    return( summerSolstice( gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the summer solstice for the current
 *  DateTime #this.year.
 *
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the summer
 *  solstice for \a year, and event() returns #CDT.Summer.
 */

bool DateTime::summerSolstice( const GlobalPosition &gp )
{
    calculateSolstice( (this.event = CDT.Summer), gp );
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of sunrise for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  If the #CDT.Flag returned by flag() returns #CDT.Rises,
 *  then a sunrise occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then it is polar day and the sun is always visible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then it is polar night and the sun is always invisible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.SunRise.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of sunrise.
 *
 *  \sa moonRise(), moonSet(), sunSet(), #CDT.Event, #CDT.Flag.
 */

bool DateTime::sunRise( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.SunRise, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the time of sunset for the current DateTime
 *  #this.year, #this.month, and #this.day.
 *
 *  If the #CDT.Flag returned by flag() returns #CDT.Sets,
 *  then a sunrise occurs on the DateTime day at the new DateTime time.
 *
 *  If flag() returns #CDT.Light,
 *  then it is polar day and the sun is always visible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  If flag() returns #CDT.Dark,
 *  then it is polar night and the sun is always invisible,
 *  and the resulting DateTime time fields are undefined.
 *
 *  After calling this function, event() returns #CDT.SunSet.
 *
 *  Calls #calculateSunTime() to perform the calculation.
 *
 *  \param gp Reference to a GlobalPosition or GlobalSite object.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return, the #this.hour, #this.minute, #this.second, and #this.millisecond
 *  data members are set to the time of sunset.
 *
 *  \sa moonRise(), moonSet(), sunRise(), #CDT.Event, #CDT.Flag.
 */

bool DateTime::sunSet( const GlobalPosition &gp )
{
    return( calculateSunTime( CDT.SunSet, gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the winter solstice for \a year.
 *
 *  \param year Julian-Gregorian calendar year (-4712 or later).
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the winter
 *  solstice for \a year, and event() returns #CDT.Winter.
 */

bool DateTime::winterSolstice( int year, const GlobalPosition &gp )
{
    this.year = year;
    return( winterSolstice( gp ) );
}

//------------------------------------------------------------------------------
/*! \brief Determines the date and time of the winter solstice for the current
 *  DateTime #this.year.
 *
 *  \param gp Reference to a GlobalPosition instance.
 *
 *  \return TRUE if the resulting DateTime is valid,
 *  FALSE if the resulting DateTime is invalid.
 *  The invalid data member can be determined from the flag() return code.
 *
 *  On return the DateTime member data contain the date and time of the winter
 *  solstice for \a year, and event() returns #CDT.Winter.
 */

bool DateTime::winterSolstice( const GlobalPosition &gp)
{
    calculateSolstice( (this.event = CDT.Winter), gp );
    return( isValid() );
}

//------------------------------------------------------------------------------
/*! \brief Gets the value of the DateTime year.
 *
 *  \return Current value of the DateTime year (-4712 or later).
 */

int DateTime::year( void ) const
{
    return( this.year );
}

//------------------------------------------------------------------------------
/*! \brief Sets the value of the DateTime year to newYear.
 *
 *  \param newYear New Julian-Gregorian calendar year (-4712 or later).
 *
 *  \return New Julian-Gregorian calendar year value (-4712 or later).
 *  The Julian date #this.jdate and #CDT.Flag #this.flag are updated.
 */

int DateTime::year( int newYear )
{
    this.year = newYear;
    calculateJulianDate();
    isValid();
    return( this.year );
}

//------------------------------------------------------------------------------
/*! \brief Assignment operator.
 *
 *  \param dt Reference to an existing DateTime object.
 *  \return Reference to \a this object.
 */

DateTime &DateTime::operator=( const DateTime &dt )
{
    this.jdate         = dt.this.jdate;
    this.year          = dt.this.year;
    this.month         = dt.this.month;
    this.day           = dt.this.day;
    this.hour          = dt.this.hour;
    this.minute        = dt.this.minute;
    this.second        = dt.this.second;
    this.millisecond   = dt.this.millisecond;
    this.event         = dt.this.event;
    this.flag          = dt.this.flag;
    return( *this );
}

//------------------------------------------------------------------------------
//  End of datetime.cpp
//------------------------------------------------------------------------------


//------------------------------------------------------------------------------
/*! \brief Calculates the dew point temperature.
 *
 *  \param dryBulb  Dry bulb air temperature (oF).
 *  \param wetBulb  Wet bulb air temperature (oF).
 *  \param elev     Elevation above mean sea level (ft).
 *
 *  \return         Dew point temperature (oF).
 */

double FBL_DewPointTemperature( double dryBulb, double wetBulb, double elev )
{
    double dbulbc = ( dryBulb - 32. ) * 5. / 9.;
    double wbulbc = ( wetBulb - 32. ) * 5. / 9.;
    double dewpoint = dryBulb;
    if ( wbulbc < dbulbc )
    {
        // double e1 = 6.1121 * exp( 17.502 * dbulbc / (240.97 + dbulbc) );
        double e2 = 6.1121 * exp( 17.502 * wbulbc / (240.97 + wbulbc) );
        if ( wbulbc < 0. )
        {
            e2 = 6.1115 * exp( 22.452 * wbulbc / ( 272.55 + wbulbc) );
        }
        double p = 1013. * exp( -0.0000375 * elev );
        double d = 0.66 * ( 1. + 0.00115 * wbulbc) * (dbulbc - wbulbc);
        double e3 = e2 - d * p / 1000.;
        if ( e3 < 0.001 )
        {
            e3 = 0.001;
        }
        double t3 = -240.97 /  ( 1.- 17.502 / log(e3 / 6.1121) );
        if ( ( dewpoint = t3 * 9. / 5. + 32. ) < -40. )
        {
            dewpoint = -40.;
        }
    }
    return( dewpoint );
}

//------------------------------------------------------------------------------
/*! \brief Calculates the relative humidity.
 *
 *  \param dryBulb  Air temperature (oF).
 *  \param dewPt    Dew point temperature (oF).
 *
 *  \return Relative humidity (fraction).
 */

double FBL_RelativeHumidity( double dryBulb, double dewPt )
{
    return( ( dewPt >= dryBulb )
          ? ( 1.0 )
          : ( exp( -7469. / ( dewPt+398.0 ) + 7469. / ( dryBulb+398.0 ) ) ) );
}

//------------------------------------------------------------------------------
/*! \brief Calculates the heat index using the algorithm from
 *  http://www.usatoday.com/weather/whumcalc.htm and
 *  http://www.srh.noaa.gov/elp/wxcalc/heatindexsc.html
 *
 *  \param at Air temperature (oF).
 *  \param rh Air relative humidity (%).
 *
 *  \return Heat index.
 */

double FBL_HeatIndex1( double at, double rh )
{
    return( -42.379
        + 2.04901523 * at
        + 10.14333127 * rh
        - 0.22475541 * at * rh
        - 6.83783e-03 * at * at
        - 5.481717e-02 * rh * rh
        + 1.22874e-03 * at * at * rh
        + 8.5282e-04 * at * rh * rh
        - 1.99e-06 * at * at * rh * rh );
}

//------------------------------------------------------------------------------
/*! \brief Calculates the heat index using the algorithm from
 *  http://www.wvec.com/knowledge/heatindex.htm
 *
 *  \param at Air temperature (oF).
 *  \param rh Air relative humidity (%).
 *
 *  \return Heat index.
 */

double FBL_HeatIndex2( double at, double rh )
{
    return( 16.923
        + 0.185212e+00 * at
        + 0.537941e+01 * rh
        - 0.100254e+00 * at * rh
        + 0.941695e-02 * at * at
        + 0.728898e-02 * rh * rh
        + 0.345372e-03 * at * at * rh
        - 0.814970e-03 * at * rh * rh
        + 0.102102e-04 * at * at * rh * rh
        - 0.386460e-04 * at * at * at
        + 0.291583e-04 * rh * rh * rh
        + 0.142721e-05 * at * at * at * rh
        + 0.197483e-06 * at * rh * rh * rh
        - 0.218429e-07 * at * at * at * rh * rh
        + 0.843296e-09 * at * at * rh * rh * rh
        - 0.481975e-10 * at * at * at * rh * rh * rh );
}

//------------------------------------------------------------------------------
/*! \brief Calculates the summer simmer index using the algorithm from
 *  http://www.usatoday.com/weather/whumcalc.htm.
 *
 *  \param at Air temperature (oF).
 *  \param rh Relative humidity(%).
 *
 *  \return Summer simmer index (dl).
 */

double FBL_SummerSimmerIndex( double at, double rh )
{
    return( 1.98 * ( at - ( 0.55 - 0.0055*rh ) * ( at - 58. ) ) - 56.83 );
}

//------------------------------------------------------------------------------
/*! \brief Calculates the wind chill temperature.
 *
 *  This uses the most recently (Nov 1, 2001) adopted formula
 *  used by the US NOAA and Canadian MSC and is now part of AWIPS.
 *  A new version in 2002 may add solar radiation effects.
 *
 *  \param airTemperature   Air temperature (oF).
 *  \param windSpeed        Wind speed (mi/h).
 *
 *  \return Wind chill temperature (oF).
 */

double FBL_WindChillTemperature( double airTemperature, double windSpeed )
{
    double v = 0.;
    if ( windSpeed > 0.0 )
    {
        v = pow( windSpeed, 0.16 );
    }
    double t = airTemperature;
    return( 35.74 + 0.6215 * t - 35.75 * v + 0.4275 * t * v );
    // Old method
    //return( 0.0817 * ( 5.81 + 3.71 * pow( windSpeed, 0.5 ) - 0.25 * windSpeed )
    //    * ( airTemperature - 91.4 ) + 91.4 );
}
