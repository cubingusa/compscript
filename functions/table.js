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
  implementation: (filter, columns, sort, ctx, generics) => {
    var rows = (() => {
      switch (generics.ArgType) {
        case 'Person':
          return ctx.competition.persons
        default:
          return []
      }
    })().filter((val) => {
      return filter.value({[generics.ArgType]: val}, ctx)
    }).sort((rowA, rowB) => {
      sort.value({[generics.ArgType]: rowA}) <
      sort.value({[generics.ArgType]: rowB}) ? -1 : 1
    }).map((val) => {
      return columns.value({[generics.ArgType]: val}, ctx)
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
