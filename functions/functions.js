module.exports = {
  allFunctions:
      [].concat(
          require('./array').functions,
          require('./boolean').functions,
          require('./cluster').functions,
          require('./display').functions,
          require('./events').functions,
          require('./groups').functions,
          require('./math').functions,
          require('./persons').functions,
          require('./table').functions,
          require('./time').functions,
          require('./udf').functions,
      )
}
