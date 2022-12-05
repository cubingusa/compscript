const MakeArray = {
  name: 'MakeArray',
  genericParams: ['T'],
  args: [
    {
      name: 'vals',
      type: '$T',
      repeated: true,
    },
  ],
  outputType: 'Array<$T>',
  implementation: (vals) => {
    return vals
  },
}

const In = {
  name: 'In',
  genericParams: ['T'],
  args: [
    {
      name: 'value',
      type: '$T',
    },
    {
      name: 'array',
      type: 'Array<$T>',
    },
  ],
  outputType: 'Boolean',
  implementation: (value, array) => {
    return array.includes(value)
  },
}

const Length = {
  name: 'Length',
  genericParams: ['T'],
  args: [
    {
      name: 'array',
      type: 'Array<$T>',
    },
  ],
  outputType: 'Number',
  implementation: (array) => array.length,
}

module.exports = {
  functions: [MakeArray, In, Length],
}
