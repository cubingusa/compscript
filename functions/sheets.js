const { GoogleSpreadsheet } = require('google-spreadsheet')

const extension = require('./../extension')

class Header {
  constructor(value) {
    this.value = value
    this.headerType = value.substring(0, value.indexOf(':'))
    if (this.headerType === 'ignore') {
      return
    }
    var suffix = value.substring(value.indexOf(':') + 1).split(':')
    this.type = suffix[0]
    this.name = suffix[1]
  }

  parse(val) {
    if (this.type == 'number') {
      return +val
    }
    if (this.type == 'list') {
      return val.split(', ')
    }
    if (val === null) {
      return ''
    }
    return val
  }

  get(row) {
    return this.parse(row[this.value])
  }

  getIdentifier(person) {
    return this.parse(person[this.name])
  }
}

readSpreadsheetImpl = async function(competition, spreadsheetId) {
  out = { warnings: [], loaded: 0 }
  const creds = require('./../google-credentials.json')
  const doc = new GoogleSpreadsheet(spreadsheetId)
  await doc.useServiceAccountAuth(creds)
  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0]
  await sheet.loadHeaderRow(1)
  var headers = sheet.headerValues.map((val) => new Header(val))

  // Clear existing properties.
  competition.persons.forEach((person) => {
    var ext = extension.getOrInsertExtension(person, 'Person')
    if (!ext.properties) {
      return
    }
    headers.forEach((header) => {
      if (header.headerType == 'property' && header.name in ext.properties) {
        delete ext.properties[header.name]
      }
    })
  })

  const rows = await sheet.getRows({offset: 1})
  rows.forEach((row) => {
    // First use the identifiers provided to find the person.
    var bestMatch = 0
    var countBestMatch = 0
    var matchingPerson = null
    var firstIdentifier = ''
    competition.persons.forEach((person) => {
      var matching = 0
      headers.forEach((header) => {
        if (header.headerType !== 'identifier') {
          return
        }
        var identifierVal = header.get(row)
        if (firstIdentifier === '') {
          firstIdentifier = identifierVal
        }
        if (header.getIdentifier(person).toUpperCase() === identifierVal.toUpperCase()) {
          matching++
        }
      })
      if (matching > bestMatch) {
        bestMatch = matching
        countBestMatch = 1
        matchingPerson = person
      } else if (matching == bestMatch) {
        countBestMatch++
      }
    })
    if (countBestMatch > 1 || matchingPerson === null) {
      out.warnings.push('Ambiguous row for ' + firstIdentifier)
      return
    }
    var ext = extension.getOrInsertExtension(matchingPerson, 'Person')
    if (!ext.properties) {
      ext.properties = {}
    }
    headers.forEach((header) => {
      if (header.headerType !== 'property') {
        return
      }
      ext.properties[header.name] = header.get(row)
    })
    out.loaded += 1
  })
  return out
}

// ReadSpreadsheet.implementation returns a Promise, which is resolved in
// competition.js.
const ReadSpreadsheet = {
  name: 'ReadSpreadsheet',
  docs: 'Reads data from the provided Google Sheet',
  args: [
    {
      name: 'spreadsheetId',
      type: 'String',
    },
  ],
  outputType: 'ReadSpreadsheetResult',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx, spreadsheetId) => {
    return readSpreadsheetImpl(ctx.competition, spreadsheetId)
  }
}

module.exports = {
  functions: [ReadSpreadsheet],
}
