const fs = require('fs')
const fse = require('fs-extra')

const ExportWCIF = {
  name: 'ExportWCIF',
  docs: 'Export the WCIF to a json file',
  args: [
    {
      name: 'filename',
      type: 'String',
      docs: 'WCIF filename (emitted in WCIF_DATA_FOLDER/competitionId)',
      defaultValue: 'wcif.json',
    },
  ],
  outputType: 'String',
  usesContext: true,
  implementation: (ctx, filename) => {
    var folder = `${process.env.WCIF_DATA_FOLDER || '.'}/${ctx.competition.id}`;
    var fullPath = `${folder}/${filename}`
    fse.ensureDirSync(folder)
    fs.writeFileSync(
      fullPath,
      JSON.stringify(ctx.competition, null, 2)
    )
    return `WCIF saved to '${fullPath}'.`
  }
}

module.exports = {
  functions: [ExportWCIF],
}
