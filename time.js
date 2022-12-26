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
  implementation: (time) => time.toLocaleString(DateTime.TIME_SIMPLE),
}

module.exports = {
  functions: [Time],
}
