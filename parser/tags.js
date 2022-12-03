const extension = require('./../extension')

const HasTag = {
  name: 'HasTag'
  args: [
    {
      name: 'tag',
      type: 'String',
    },
  ],
  outputType: 'PersonFilter',
  implementation: (tag) => {
    return function(person) {
      const tags = extension.getExtension(person, 'Person').tags || []
      return tags.includes(tag)
    }
  },
}

module.exports = {
  functions: [HasTag],
}
