module.exports = {
  allFunctions:
      [].concat(
          require('./boolean').functions,
          require('./events').functions,
          require('./persons').functions,
          require('./tags').functions,
      )
}
