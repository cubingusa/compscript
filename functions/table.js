const Table = {
  name: 'Table',
  genericParams: ['SortType'],
  args: [
    {
      name: 'filter',
      type: 'Boolean',
    },
    {
      name: 'columns',
      type: 'Array<Column>',
    },
    {
      name: 'sort',
      type: '$SortType',
    },
  ],
  outputType: 'Table',
  implementation: (filter, columns, sort) => {
    if (!filter) {
      return null
    }
    return {
      columns: columns,
      sortKey: sort,
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
