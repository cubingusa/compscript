const activityCode = require('./activity_code')
const { DateTime } = require('luxon')

class Group {
  constructor(activity, room, competition) {
    this.wcif = activity
    this.activityCode = activityCode.parse(activity.activityCode)
    this.room = room
    this.startTime = DateTime.fromISO(activity.startTime).setZone(competition.schedule.venues[0].timezone)
    this.endTime = DateTime.fromISO(activity.endTime).setZone(competition.schedule.venues[0].timezone)
  }

  name() {
    if (this.activityCode.isActivity()) {
      return this.room.name.split(' ')[0] + ' ' + this.activityCode.groupNumber
    } else {
      return this.activityCode.toString()
    }
  }
}

module.exports = {
  Group: Group,
}
