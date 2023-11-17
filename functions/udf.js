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
    outputType: 'Void',
    usesContext: true,
    implementation: (ctx, name, implementation) => {
      ctx.udfs[name] = {
        impl: implementation,
        name: name,
      }
    },
  }
}

module.exports = {
  functions: [Define(0), Define(1)]
}
