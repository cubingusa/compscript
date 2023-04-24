const extension = require('./../extension')

const Tuple = function(argCount) {
  const genericArgs = [...Array(argCount).keys()].map((x) => 'T' + x)
  const outputType = 'Tuple<' + genericArgs.map((x) => '$' + x).join(', ') + '>'
  return {
    name: 'Tuple',
    genericParams: genericArgs,
    args: genericArgs.map(arg => {
      return {
        name: 'arg_' + arg,
        type: '$' + arg,
      }
    }),
    outputType: outputType,
    implementation: (...args) => {
      return args
    },
  }
}

const Get = function(name, argCount, selected) {
  const genericArgs = [...Array(argCount).keys()].map((x) => 'T' + x)
  const tupleType = 'Tuple<' + genericArgs.map((x) => '$' + x).join(', ') + '>'
  return {
    name: name,
    genericParams: genericArgs,
    args: [
      {
        name: 'tuple',
        type: tupleType,
      }
    ],
    outputType: '$T' + (selected - 1),
    implementation: (args) => {
      return args[selected - 1]
    },
  }
}

module.exports = {
  functions: [
    Tuple(1), Get('First', 1, 1),
    Tuple(2), Get('First', 2, 1), Get('Second', 2, 2),
  ]
}
