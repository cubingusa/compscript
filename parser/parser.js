const fs = require('fs/promises')
const peggy = require('peggy')

const driver = require('./driver')

async function parse(text, req, res) {
  if (!req.parser) {
    try {
      const data = await fs.readFile('parser/grammar.pegjs')
      req.parser = peggy.generate(data.toString())
      const tree = req.parser.parse(text)
      node = driver.parseNode(tree)
      return node.value()
    } catch (err) {
      console.log(err)
      return { errors: [err.toString()] }
    }
  }
}

module.exports = {
  parse: parse,
}
