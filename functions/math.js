const GreaterThan = {
  name: 'GreaterThan',
  docs: 'Return true if val1 > val2 (maybe invoked with ">")',
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
  implementation: (val1, val2) => {
    if (val1 === null || val2 === null) {
      return false
    }
    return val1 > val2
  }
}

const GreaterThanOrEqualTo = {
  name: 'GreaterThanOrEqualTo',
  docs: 'Return true if val1 >= val2 (maybe invoked with ">=")',
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
  implementation: (val1, val2) => {
    if (val1 === null || val2 === null) {
      return false
    }
    return val1 >= val2
  }
}

const EqualTo = {
  name: 'EqualTo',
  docs: 'Return true if val1 == val2 (maybe invoked with "==")',
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

const EqualTo_Date = {
  name: 'EqualTo',
  docs: 'Override of EqualTo for Date objects',
  args: [
    {
      name: 'val1',
      type: 'Date',
      nullable: true,
    },
    {
      name: 'val2',
      type: 'Date',
      nullable: true,
    },
  ],
  outputType: 'Boolean',
  implementation: (date1, date2) => {
    if (date1 === null || date2 === null) {
      return false
    }
    return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day
  }
}

const Add = {
  name: 'Add',
  docs: 'Adds two numbers (may be invoked with "+")',
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
  docs: 'Concatenates two strings (may be invoked with "+")',
  args: [
    {
      name: 'val1',
      type: 'String',
      nullable: true,
    },
    {
      name: 'val2',
      type: 'String',
      nullable: true,
    },
  ],
  outputType: 'String',
  implementation: (val1, val2) => val1 + val2,
}

const ConcatArrays = {
  name: 'Add',
  genericParams: ['T'],
  docs: 'Concatenates two arrays (may be invoked with "+")',
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
  outputType: 'Array<$T>',
  implementation: (array1, array2) => array1.concat(array2),
}

const Subtract = {
  name: 'Subtract',
  docs: 'Subtracts two numbers (may be invoked with "-")',
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
  docs: 'If the condition is true, return the first value, else the second value',
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
      lazy: true,
    },
    {
      name: 'ifFalse',
      type: '$T',
      nullable: true,
      lazy: true,
    },
  ],
  outputType: '$T',
  implementation: (condition, ifTrue, ifFalse) => {
    return condition ? ifTrue() : ifFalse()
  }
}

const Switch = {
  name: 'Switch',
  docs: 'Returns the first matching value',
  genericParams: ['T', 'U'],
  args: [
    {
      name: 'value',
      type: '$T',
      canBeExternal: true,
    },
    {
      name: 'options',
      type: 'Array<Tuple<$T, $U>>',
    },
    {
      name: 'defaultValue',
      type: '$U',
      defaultValue: null,
      nullable: true,
    },
  ],
  outputType: '$U',
  implementation: (value, options, defaultValue) => {
    for (const option of options) {
      if (option[0] === value) {
        return option[1]
      }
    }
    return defaultValue
  }
}

const Switch_Events = {
  name: 'Switch',
  docs: 'Returns the first matching value',
  genericParams: ['U'],
  args: [
    {
      name: 'value',
      type: 'Event',
      canBeExternal: true,
    },
    {
      name: 'options',
      type: 'Array<Tuple<Event, $U>>',
    },
    {
      name: 'defaultValue',
      type: '$U',
      defaultValue: null,
      nullable: true,
    },
  ],
  outputType: '$U',
  implementation: (value, options, defaultValue) => {
    for (const option of options) {
      if (option[0].id() === value.id()) {
        return option[1]
      }
    }
    return defaultValue
  }
}

const Even = {
  name: 'Even',
  docs: 'Returns true if the number is even',
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
  docs: 'Returns true if the number is odd',
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
  functions: [GreaterThan, GreaterThanOrEqualTo,
              EqualTo, EqualTo_Date, If, Switch, Switch_Events, Add, ConcatStrings, ConcatArrays, Subtract,
              Even, Odd],
}
