function getExtension(obj, type) {
  type = 'org.cubingusa.natshelper.v1.' + type
  if (!obj.extensions) {
    obj.extensions = []
  }
  var matching = obj.extensions.filter((ext) => ext.id == type)
  if (matching.length > 0) {
    return matching[0].data
  }
  var extension = {
    id: type,
    specUrl: 'https://github.com/timreyn/natshelper/blob/main/specification.md',
    data: {}
  }
  obj.extensions.push(extension)
  return extension.data
}

module.exports = {
  getExtension: getExtension,
}
