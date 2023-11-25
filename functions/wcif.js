const fs = require('fs')
const fse = require('fs-extra')

const ClearWCIF = {
  name: 'ClearWCIF',
  docs: 'Remove all childActivities keeping only the main schedule, remove all assignments, cleanup roles, cleanup NatsHelper extension data.',
  args: [
    {
      name: 'clearExternalExtensions',
      type: 'Boolean',
      docs: 'Also cleanup external tools extensions.',
      defaultValue: false,
    },
  ],
  outputType: 'Void',
  usesContext: true,
  mutations: ['schedule', 'persons'],
  implementation: (ctx, clearExternalExtensions) => {
    const cleanupExtensions = (object) => {
      if (clearExternalExtensions) {
        object.extensions = []
      } else {
        object.extensions = object.extensions.filter(({ id }) => !id.startsWith("org.cubingusa.natshelper"))
      }
    }
    cleanupExtensions(competition)
    ctx.competition.persons.forEach((person) => {
      // Cleanup roles which are user-defined.
      const immutableRoles = ['delegate', 'organizer', 'trainee-delegate']
      person.roles = person.roles.filter((r) => immutableRoles.includes(r))
      person.assignments = []
      cleanupExtensions(person)
    })
    ctx.competition.schedule.venues.forEach((venue) => {
      venue.rooms.forEach((room) => {
        cleanupExtensions(room)
        room.activities.forEach((activity) => {
          cleanupExtensions(activity)
          activity.childActivities = []
        })
      })
    })
  }
}

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
  functions: [ClearWCIF, ExportWCIF],
}
