const Or = {
  name: 'Or',
  args: [
    {
      name: 'param',
      type: 'Boolean',
      repeated: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (params) => {
    for (var i = 0; i < params.length; i++) {
      if (params[i]) {
        return true
      }
    }
    return false
  },
}

const And = {
  name: 'And',
  args: [
    {
      name: 'param',
      type: 'Boolean',
      repeated: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (params) => {
    for (var i = 0; i < params.length; i++) {
      if (!params[i]) {
        return false
      }
    }
    return true
  },
}

const Not = {
  name: 'Not',
  args: [
    {
      name: 'param',
      type: 'Boolean',
    },
  ],
  outputType: 'Boolean',
  implementation: (param) => {
    return !param
  },
}

module.exports = {
  functions: [And, Or, Not],
}
