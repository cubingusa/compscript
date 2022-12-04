module.exports = {
  allFunctions:
      [].concat(
          require('./boolean').functions,
          require('./tags').functions,
          require('./persons').functions,
      )
}
