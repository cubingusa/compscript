const cluster = require('./../cluster/cluster')
const constraint = require('./../cluster/constraint')

const Cluster = {
  name: 'Cluster',
  args: [
    {
      name: 'name',
      type: 'String',
    },
    {
      name: 'numClusters',
      type: 'Number',
    },
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'constraint',
      type: 'Constraint',
      repeated: true,
    },
  ],
  outputType: 'ClusteringResult',
  mutations: ['persons'],
  implementation: (name, numClusters, persons, constraints) => {
    return cluster.Cluster(name, numClusters, persons, constraints)
  }
}

function BalanceConstraint(argType) {
  return {
    name: 'BalanceConstraint',
    args: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'value',
        type: argType + '(Person)',
        lazy: true,
      },
      {
        name: 'decay',
        type: 'Number',
      },
      {
        name: 'initialAllowance',
        type: 'Number',
        defaultValue: 0,
      },
      {
        name: 'applyTo',
        type: 'Array<Number>',
        defaultValue: [],
      }
    ],
    outputType: 'Constraint',
    implementation: (name, value, decay, initialAllowance, applyTo) => {
      return new constraint.BalanceConstraint(name, value, decay, initialAllowance, applyTo)
    }
  }
}

function LimitConstraint(argType) {
  return {
    name: 'LimitConstraint',
    args: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'value',
        type: argType + '(Person)',
        lazy: true,
      },
      {
        name: 'min',
        type: 'Number',
        defaultValue: -1,
      },
      {
        name: 'max',
        type: 'Number',
        defaultValue: -1,
      },
      {
        name: 'applyTo',
        type: 'Array<Number>',
        defaultValue: [],
      }
    ],
    outputType: 'Constraint',
    implementation: (name, value, min, max, applyTo) => {
      return new condition.LimitConstraint(name, value, min, max, applyTo)
    }
  }
}

module.exports = {
  functions: [Cluster,
              BalanceConstraint('Number'), BalanceConstraint('Boolean'),
              LimitConstraint('Number'), LimitConstraint('Boolean')]
}
