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
    implementation: (name, implementation, ctx) => {
      const ext = extension.getExtension(ctx.competition, 'Competition')
      if (!ext.udf) {
        ext.udf = {}
      }
      ext.udf[name] = {impl: implementation, cmd: ctx.command, name: name}
      return 'Defined function ' + name
    },
    mutations: ['extensions'],
  }
}

module.exports = {
  functions: [Define(0), Define(1)],
}
