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

const ConcatStrings = {
  name: 'Add',
  args: [
    {
      name: 'val1',
      type: 'String',
    },
    {
      name: 'val2',
      type: 'String',
    },
  ],
  outputType: 'String',
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

const Even = {
  name: 'Even',
  args: [
    {
      name: 'val',
      type: 'Number',
    },
  ],
  outputType: 'Boolean',
  implementation: (val) => val % 2 == 0,
}

const Odd = {
  name: 'Odd',
  args: [
    {
      name: 'val',
      type: 'Number',
    },
  ],
  outputType: 'Boolean',
  implementation: (val) => val % 2 == 1,
}

module.exports = {
  functions: [GreaterThan, GreaterThan_AttemptResult,
              GreaterThanOrEqualTo, GreaterThanOrEqualTo_AttemptResult,
              EqualTo, If, Add, ConcatStrings, Subtract,
              Even, Odd],
}
