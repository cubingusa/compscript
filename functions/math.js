const GreaterThan = {
  name: 'GreaterThan',
  args: [
    {
      name: 'val1',
      type: 'Number',
      nullable: true,
    },
    {
      name: 'val2',
      type: 'Number',
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => {
    if (val1 === null || val2 === null) {
      return false
    }
    return val1 > val2
  }
}

const GreaterThan_AttemptResult = {
  name: 'GreaterThan',
  args: [
    {
      name: 'val1',
      type: 'AttemptResult',
      nullable: true,
    },
    {
      name: 'val2',
      type: 'AttemptResult',
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => {
    if (val1 === null || val2 === null) {
      return false
    }
    return val1 > val2
  }
}

const GreaterThanOrEqualTo = {
  name: 'GreaterThanOrEqualTo',
  args: [
    {
      name: 'val1',
      type: 'Number',
      nullable: true,
    },
    {
      name: 'val2',
      type: 'Number',
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => {
    if (val1 === null || val2 === null) {
      return false
    }
    return val1 >= val2
  }
}

const GreaterThanOrEqualTo_AttemptResult = {
  name: 'GreaterThanOrEqualTo',
  args: [
    {
      name: 'val1',
      type: 'AttemptResult',
      nullable: true,
    },
    {
      name: 'val2',
      type: 'AttemptResult',
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (val1, val2) => {
    if (val1 === null || val2 === null) {
      return false
    }
    return val1 >= val2
  }
}

const EqualTo = {
  name: 'EqualTo',
  genericParams: ['T'],
  args: [
    {
      name: 'val1',
      type: '$T',
      nullable: true,
    },
    {
      name: 'val2',
      type: '$T',
      nullable: true,
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

const ConcatArrays = {
  name: 'Add',
  genericParams: ['T'],
  args: [
    {
      name: 'array1',
      type: 'Array<$T>',
    },
    {
      name: 'array2',
      type: 'Array<$T>',
    }
  ],
  outputType: 'Array<T>',
  implementation: (array1, array2) => array1.concat(array2),
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
      nullable: true,
    },
    {
      name: 'ifFalse',
      type: '$T',
      nullable: true,
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
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (val) => val !== null && val % 2 == 0,
}

const Odd = {
  name: 'Odd',
  args: [
    {
      name: 'val',
      type: 'Number',
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (val) => val !== null && val % 2 == 1,
}

module.exports = {
  functions: [GreaterThan, GreaterThan_AttemptResult,
              GreaterThanOrEqualTo, GreaterThanOrEqualTo_AttemptResult,
              EqualTo, If, Add, ConcatStrings, ConcatArrays, Subtract,
              Even, Odd],
}
