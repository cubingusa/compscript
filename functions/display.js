const extension = require('./../extension')

const All = function(argCount) {
  const genericParams = [...Array(argCount).keys()].map((x) => 'T' + x)
  return {
    name: 'All',
    docs: 'Renders multiple items, possibly of different types',
    genericParams: genericParams,
    args: genericParams.map((param) => {
      return {
        name: param,
        type: '$' + param,
      }
    }),
    outputType: 'Multi',
    usesGenericTypes: true,
    implementation: (generics, ...args) => {
      return args.map((arg, idx) => {
        return {
          type: generics['T' + idx],
          data: arg,
        }
      })
    }
  }
}

const Header = {
  name: 'Header',
  docs: 'Renders a header',
  args: [
    {
      name: 'value',
      type: 'String',
    },
  ],
  outputType: 'Header',
  implementation: (value) => value,
}

const NoPageBreak = {
  name: 'NoPageBreak',
  docs: 'Renders without a page break',
  genericParams: ['T'],
  args: [
    {
      name: 'arg',
      type: '$T',
    },
  ],
  outputType: 'NoPageBreak',
  usesGenericTypes: true,
  implementation: (generics, value) => {
    return [
      {
        type: generics.T,
        data: value,
      }
    ]
  }
}

module.exports = {
  functions: [All(0), All(1), All(2), All(3), All(4), All(5), All(6), All(7), All(8), All(9),
              Header, NoPageBreak],
}
