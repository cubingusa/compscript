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
      // This is not ideal; when displaying room names we'd like to
      // keep only the meaningful part (eg: "Red" when it's "Red Stage", which
      // is usually the first part of the name in English, but may be some other
      // parts in other languages. This is a compromise where we strip out
      // 'Stage' or 'Room' suffix, which should be enough in "regular" major
      // competitions setup while not messing up room names in non English setups.
      return this.room.name.replace(/Room|Stage/g, '').trim() + ' ' + this.activityCode.groupNumber
    } else {
      return this.activityCode.toString()
    }
  }

  fullName() {
    return this.activityCode.toString()
  }
}

module.exports = {
  Group: Group,
}
