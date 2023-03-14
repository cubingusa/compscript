const Or = {
  name: 'Or',
  docs: 'Returns true if any of the provided arguments are true.',
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
  docs: 'Returns true if all of the provided arguments are true.',
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
  docs: 'Returns true if the provided argument is false.',
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
