function getExtension(obj, type, namespace='org.cubingusa.natshelper.v1') {
  type = namespace + '.' + type
  if (!obj.extensions) {
    obj.extensions = []
  }
  var matching = obj.extensions.filter((ext) => ext.id == type)
  if (matching.length > 0) {
    return matching[0].data
  }
  return null
}

function getOrInsertExtension(obj, type, namespace='org.cubingusa.natshelper.v1') {
  type = namespace + '.' + type
  if (!obj.extensions) {
    obj.extensions = []
  }
  var matching = obj.extensions.filter((ext) => ext.id == type)
  if (matching.length > 0) {
    return matching[0].data
  }
  var extension = {
    id: type,
    specUrl: 'https://github.com/cubingusa/natshelper/blob/main/specification.md',
    data: {}
  }
  obj.extensions.push(extension)
  return extension.data
}

function getExtensionsWithPrefix(obj, type, prefix, namespace='org.cubingusa.natshelper.v1') {
  if (!obj.extensions) {
    obj.extensions = []
  }
  return obj.extensions.filter((ext) => ext.id.startsWith(namespace + '.' + type + '.' + prefix))
}

module.exports = {
  getExtension: getExtension,
  getOrInsertExtension: getOrInsertExtension,
  getExtensionsWithPrefix: getExtensionsWithPrefix,
}
