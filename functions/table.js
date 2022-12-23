const Table = {
  name: 'Table',
  genericParams: ['ArgType', 'SortType'],
  args: [
    {
      name: 'filter',
      type: 'Boolean($ArgType)',
      lazy: true,
    },
    {
      name: 'columns',
      type: 'Array<Column>($ArgType)',
      lazy: true,
    },
    {
      name: 'sort',
      type: '$SortType($ArgType)',
      lazy: true,
    },
  ],
  usesContext: true,
  usesGenericTypes: true,
  outputType: 'Table',
  implementation: (ctx, generics, filter, columns, sort) => {
    var rows = (() => {
      switch (generics.ArgType) {
        case 'Person':
          return ctx.competition.persons
        default:
          return []
      }
    })().filter((val) => {
      return filter({[generics.ArgType]: val})
    }).sort((rowA, rowB) => {
      return sort({[generics.ArgType]: rowA}) < sort({[generics.ArgType]: rowB}) ? -1 : 1
    }).map((val) => {
      return columns({[generics.ArgType]: val})
    })
    return {
      headers: rows[0].map((col) => col.title),
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
    },
    {
      name: 'link',
      type: 'String',
      defaultValue: '',
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
