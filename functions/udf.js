const extension = require('./../extension')

const Define = function(argCount) {
  const genericArgs = [...Array(argCount).keys()].map((x) => 'U' + x)
  const implementationType = '$T(' + genericArgs.map((x) => '$' + x).join(', ') + ')'
  return {
    name: 'Define',
    genericParams: ['T'].concat(genericArgs),
    args: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'implementation',
        type: implementationType,
        serialized: true,
      },
    ],
    outputType: 'String',
    usesContext: true,
    implementation: (ctx, name, implementation) => {
      const ext = extension.getOrInsertExtension(ctx.competition, 'Competition.udf.' + name)
      ext.impl = implementation
      ext.name = name
      return 'Defined function ' + name
    },
    mutations: ['extensions'],
  }
}

module.exports = {
  functions: [Define(0), Define(1)]
}
