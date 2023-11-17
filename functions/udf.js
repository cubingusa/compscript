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
      {
        name: 'public',
        type: 'Boolean',
        defaultValue: false,
      }
    ],
    outputType: 'Void',
    usesContext: true,
    implementation: (ctx, name, implementation, public) => {
      ctx.udfs[name] = {
        impl: implementation,
        name: name,
        public: public
      }
    },
  }
}

const ListScripts = {
  name: 'ListScripts',
  args: [],
  outputType: 'ListScriptsOutput',
  usesContext: true,
  implementation: (ctx) => {
    return Object.entries(ctx.udfs).map((entry) => entry[1]).filter((udf) => {
      return udf.public
    })
  }
}

module.exports = {
  functions: [Define(0), Define(1), ListScripts]
}
