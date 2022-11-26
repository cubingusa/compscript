function getExtension(obj, type) {
  type = 'org.cubingusa.natshelper.' + type
  var matching = obj.extensions.filter((ext) => ext.id == type)
  if (matching.length > 0) {
    return matching[0].data
  }
  var extension = {
    id: type,
    specUrl: 'https://docs.google.com/document/d/1f_UUPXz4-zPrqssbD7IHALNBsqIZomQU1llxe6CuPkQ/edit',
    data: {}
  }
  obj.extensions.push(extension)
  return extension.data
}

module.exports = {
  getExtension: getExtension,
}
