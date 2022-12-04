module.exports = {
  allFunctions:
      [].concat(
          require('./array').functions,
          require('./boolean').functions,
          require('./events').functions,
          require('./persons').functions,
          require('./tags').functions,
      )
}
