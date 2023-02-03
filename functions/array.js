const MakeArray = {
  name: 'MakeArray',
  genericParams: ['T'],
  args: [
    {
      name: 'vals',
      type: '$T',
      repeated: true,
      nullable: true,
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
      nullable: true,
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

const For = {
  name: 'For',
  genericParams: ['T', 'U'],
  args: [
    {
      name: 'array',
      type: 'Array<$T>',
    },
    {
      name: 'operation',
      type: '$U($T)',
      lazy: true,
    },
  ],
  outputType: 'Array<$U>',
  usesGenericTypes: true,
  implementation: (generics, array, operation) => {
    return array.map((x) => operation({[generics.T]: x}))
  },
}

module.exports = {
  functions: [MakeArray, In, Length, For],
}
