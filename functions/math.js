const GreaterThan = {
  name: 'GreaterThan',
  args: [
    {
      name: 'val1',
      type: 'Number',
    },
    {
      name: 'val2',
      type: 'Number',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 > val2,
}

const GreaterThanOrEqualTo = {
  name: 'GreaterThanOrEqualTo',
  args: [
    {
      name: 'val1',
      type: 'Number',
    },
    {
      name: 'val2',
      type: 'Number',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 >= val2,
}

const EqualTo = {
  name: 'EqualTo',
  genericParams: 'T',
  args: [
    {
      name: 'val1',
      type: '$T',
    },
    {
      name: 'val2',
      type: '$T',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 === val2,
}
module.exports = {
  functions: [GreaterThan, GreaterThanOrEqualTo, EqualTo],
}
