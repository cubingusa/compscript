const Table = {
  name: 'Table',
  genericParams: ['ArgType'],
  args: [
    {
      name: 'keys',
      type: 'Array<$ArgType>',
    },
    {
      name: 'columns',
      type: 'Array<Column>($ArgType)',
      lazy: true,
    },
  ],
  outputType: 'Table',
  usesGenericTypes: true,
  implementation: (generics, keys, columns) => {
    var rows = keys
    rows = rows.map((val) => {
      return columns({[generics.ArgType]: val})
    })
    return {
      headers: rows.length ? rows[0].map((col) => col.title) : 0,
      rows: rows
    }
  },
}

const Column = {
  name: 'Column',
  genericParams: ['T'],
  args: [
    {
      name: 'title',
      type: 'String',
    },
    {
      name: 'value',
      type: '$T',
      nullable: true,
    },
    {
      name: 'link',
      type: 'String',
      defaultValue: null,
      nullable: true,
    },
  ],
  outputType: 'Column',
  implementation: (title, value, link) => {
    return {title: title, value: value, link: link}
  },
}

module.exports = {
  functions: [Table, Column],
}
