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

module.exports = {
  functions: [Time, Hour],
}
