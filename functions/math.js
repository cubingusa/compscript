const GreaterThan = {
  name: 'GreaterThan',
  args: [
    {
      name: 'val1',
      type: 'Number',
    },
    {
      name: 'val2',
      type: 'Number',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 > val2,
}

const GreaterThan_AttemptResult = {
  name: 'GreaterThan',
  args: [
    {
      name: 'val1',
      type: 'AttemptResult',
    },
    {
      name: 'val2',
      type: 'AttemptResult',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 > val2,
}

const GreaterThanOrEqualTo = {
  name: 'GreaterThanOrEqualTo',
  args: [
    {
      name: 'val1',
      type: 'Number',
    },
    {
      name: 'val2',
      type: 'Number',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 >= val2,
}

const GreaterThanOrEqualTo_AttemptResult = {
  name: 'GreaterThanOrEqualTo',
  args: [
    {
      name: 'val1',
      type: 'AttemptResult',
    },
    {
      name: 'val2',
      type: 'AttemptResult',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 >= val2,
}

const EqualTo = {
  name: 'EqualTo',
  genericParams: ['T'],
  args: [
    {
      name: 'val1',
      type: '$T',
    },
    {
      name: 'val2',
      type: '$T',
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => val1 === val2,
}

const Add = {
  name: 'Add',
  args: [
    {
      name: 'val1',
      type: 'Number',
    },
    {
      name: 'val2',
      type: 'Number',
    },
  ],
  outputType: 'Number',
  implementation: (val1, val2) => val1 + val2,
}

const Subtract = {
  name: 'Subtract',
  args: [
    {
      name: 'val1',
      type: 'Number',
    },
    {
      name: 'val2',
      type: 'Number',
    },
  ],
  outputType: 'Number',
  implementation: (val1, val2) => val1 - val2,
}

const If = {
  name: 'If',
  genericParams: ['T'],
  args: [
    {
      name: 'condition',
      type: 'Boolean',
    },
    {
      name: 'ifTrue',
      type: '$T',
    },
    {
      name: 'ifFalse',
      type: '$T',
    },
  ],
  outputType: '$T',
  implementation: (condition, ifTrue, ifFalse) => {
    return condition ? ifTrue : ifFalse
  }
}

module.exports = {
  functions: [GreaterThan, GreaterThan_AttemptResult,
              GreaterThanOrEqualTo, GreaterThanOrEqualTo_AttemptResult,
              EqualTo, If, Add, Subtract],
}
