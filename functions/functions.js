module.exports = {
  allFunctions:
      [].concat(
          require('./array').functions,
          require('./boolean').functions,
          require('./events').functions,
          require('./math').functions,
          require('./persons').functions,
          require('./tags').functions,
      )
}
