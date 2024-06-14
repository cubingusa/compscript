const { DateTime } = require('luxon')

const Time = {
  name: 'Time',
  args: [
    {
      name: 'time',
      type: 'DateTime',
    },
  ],
  outputType: 'String',
  implementation: (time) => {
    if (time === null) {
      return ''
    }
    return time.toLocaleString(DateTime.TIME_SIMPLE)
  }
}

const Hour = {
  name: 'Hour',
  args: [
    {
      name: 'time',
      type: 'DateTime',
    },
  ],
  outputType: 'Number',
  implementation: (time) => time.hour,
}

const Day = {
  name: 'Day',
  args: [
    {
      name: 'date',
      type: 'Date',
    }
  ],
  outputType: 'Number',
  implementation: (date) => date.day,
}

const Weekday = {
  name: 'Weekday',
  args: [
    {
      name: 'arg',
      type: 'Date',
    },
  ],
  outputType: 'String',
  implementation: (arg) => arg.toFormat('cccc'),
}

const Midnight = {
  name: 'Midnight',
  args: [
    {
      name: 'date',
      type: 'Date',
    }
  ],
  outputType: 'DateTime',
  implementation: (date) => date,
}

module.exports = {
  functions: [Time, Hour, Day, Weekday, Midnight],
}
