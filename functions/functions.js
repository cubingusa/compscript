const categories = [
  { name: 'array' },
  { name: 'boolean' },
  { name: 'cluster' },
  { name: 'display' },
  { name: 'events' },
  { name: 'groups' },
  { name: 'help' },
  { name: 'math' },
  { name: 'persons' },
  { name: 'sheets' },
  { name: 'staff' },
  { name: 'table' },
  { name: 'time' },
  { name: 'tuple' },
  { name: 'udf' },
  { name: 'util' },
  { name: 'wcif', docs: 'This category gathers all functions regarding high level WCIF manipulation' },
]

module.exports = {
  categories,
  allFunctions: categories.flatMap(c => require(`./${c.name}`).functions)
}
