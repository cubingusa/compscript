const MakeArray = {
  name: 'MakeArray',
  genericParams: ['T'],
  docs: 'Makes an array containing the provided elements. Can be invoked as a literal expression via [vals].',
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

const MakeEmptyArray = {
  name: 'MakeEmptyArray',
  docs: 'Constructs an array containing zero elements. Can be invoked as a literal expression via [].',
  args: [],
  outputType: 'Array<Any>',
  implementation: () => [],
}

const In = {
  name: 'In',
  genericParams: ['T'],
  docs: 'Returns whether the provided element is in the given array.',
  args: [
    {
      name: 'value',
      type: '$T',
      nullable: true,
      canBeExternal: true,
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

const InActivityCode = function(type) {
  return {
    name: 'In',
    docs: 'Returns whether the provided element is in the given array, overloaded for activity codes.',
    args: [
      {
        name: 'value',
        type: type,
        nullable: true,
        canBeExternal: true,
      },
      {
        name: 'array',
        type: 'Array<' + type + '>',
      },
    ],
    outputType: 'Boolean',
    implementation: (value, array) => {
      return array.some((val) => val.id() === value.id())
    },
  }
}

const InDateTime = {
  name: 'In',
  docs: 'In, overloaded for DateTime.',
  args: [
    {
      name: 'value',
      type: 'DateTime',
      nullable: true,
      canBeExternal: true,
    },
    {
      name: 'array',
      type: 'Array<DateTime>',
    },
  ],
  outputType: 'Boolean',
  implementation: (value, array) => {
    return array.some((val) => val.toSeconds() === value.toSeconds())
  },
}

const Length = {
  name: 'Length',
  genericParams: ['T'],
  docs: 'Returns the length of the provided array.',
  args: [
    {
      name: 'array',
      type: 'Array<$T>',
    },
  ],
  outputType: 'Number',
  implementation: (array) => array.length,
}

const Map = {
  name: 'Map',
  genericParams: ['T', 'U'],
  docs: 'Transforms the provided array using the provided function.',
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

const Filter = {
  name: 'Filter',
  genericParams: ['T'],
  docs: 'Filters an array to those satisfying a property.',
  args: [
    {
      name: 'array',
      type: 'Array<$T>',
    },
    {
      name: 'condition',
      type: 'Boolean($T)',
      lazy: true,
    },
  ],
  outputType: 'Array<$T>',
  usesGenericTypes: true,
  implementation: (generics, array, condition) => {
    return array.filter((x) => condition({[generics.T]: x}))
  },
}

const Flatten = {
  name: 'Flatten',
  genericParams: ['T'],
  docs: 'Flattens an array of arrays into a single array.',
  args: [
    {
      name: 'args',
      type: 'Array<Array<$T>>',
    }
  ],
  outputType: 'Array<$T>',
  implementation: (args) => {
    return args.flat()
  }
}

const Concat = {
  name: 'Concat',
  genericParams: ['T'],
  docs: 'Concatenates multiple arrays into a single array.',
  args: [
    {
      name: 'args',
      type: 'Array<$T>',
      repeated: true,
    }
  ],
  outputType: 'Array<$T>',
  implementation: (args) => {
    return args.flat()
  }
}

const Sort = {
  name: 'Sort',
  genericParams: ['ValType', 'SortType'],
  args: [
    {
      name: 'vals',
      type: 'Array<$ValType>',
    },
    {
      name: 'sort',
      type: '$SortType($ValType)',
      lazy: true,
    }
  ],
  outputType: 'Array<$ValType>',
  implementation: (vals, sort) => {
    return vals.sort((valA, valB) => {
      return sort({[generics.ValType]: valA}) < sort({[generics.ValType]: valB}) ? -1 : 1
    })
  }
}

module.exports = {
  functions: [MakeArray, MakeEmptyArray, In, InActivityCode('Event'), InActivityCode('Round'), InDateTime,
              Length, Map, Filter, Flatten, Concat, Sort],
}
