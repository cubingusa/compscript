const { GoogleSpreadsheet } = require('google-spreadsheet')
const { JWT } = require('google-auth-library')

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

  parse(value) {
    let val = value || ''
    if (this.type == 'number') {
      return +val
    }
    if (this.type == 'list') {
      return val.split(',').map(s => s.trim())
    }
    return val.trim()
  }

  get(row) {
    return this.parse(row.get(this.value))
  }

  getIdentifier(person) {
    return this.parse(person[this.name])
  }
}

readSpreadsheetImpl = async function(competition, spreadsheetId, offset, sheetTitle) {
  out = { warnings: [], loaded: 0 }
  const creds = require('./../google-credentials.json')
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)
  await doc.loadInfo()
  const sheet = sheetTitle == '' ? doc.sheetsByIndex[0] : doc.sheetsByTitle[sheetTitle]
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

  const rows = await sheet.getRows({ offset })
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
        if (!identifierVal) {
          return
        }
        identifierVal = identifierVal instanceof String ? identifierVal.toUpperCase() : identifierVal

        if (firstIdentifier === '') {
          firstIdentifier = identifierVal
        }
        var personIdentifierVal = header.getIdentifier(person)
        personIdentifierVal = personIdentifierVal instanceof String ? personIdentifierVal.toUpperCase() : personIdentifierVal
        if (personIdentifierVal === identifierVal) {
          matching++
          if (header.name == 'wcaid') {
            matching++
          }
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
    {
      name: 'offset',
      type: 'Number',
      docs: 'Skip the first `offset` rows of the spreadsheet.',
      defaultValue: 0,
    },
    {
      name: 'sheetTitle',
      type: 'String',
      docs: 'Select the sheet with this name.',
      defaultValue: '',
    }
  ],
  outputType: 'ReadSpreadsheetResult',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx, spreadsheetId, offset, sheetTitle) => {
    return readSpreadsheetImpl(ctx.competition, spreadsheetId, offset, sheetTitle)
  }
}

module.exports = {
  functions: [ReadSpreadsheet],
}
