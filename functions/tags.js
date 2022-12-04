const extension = require('./../extension')

const HasTag = {
  name: 'HasTag',
  args: [
    {
      name: 'tag',
      type: 'String',
    },
  ],
  outputType: 'Boolean(Person)',
  implementation: (tag, person) => {
    const tags = extension.getExtension(person, 'Person').tags || []
    return tags.includes(tag)
  },
}

module.exports = {
  functions: [HasTag],
}
