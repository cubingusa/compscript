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
      name: 'filter',
      type: 'Boolean(Person)',
      lazy: true,
    },
    {
      name: 'constraint',
      type: 'Constraint',
      repeated: true,
    },
  ],
  outputType: 'ClusteringResult',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx, name, numClusters, filter, constraints) => {
    return cluster.Cluster(ctx.competition, name, numClusters, filter, constraints)
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
        name: 'applyTo',
        type: 'Array<Number>',
        defaultValue: [],
      }
    ],
    outputType: 'Constraint',
    implementation: (name, value, decay, applyTo) => {
      return new constraint.BalanceConstraint(name, value, decay, applyTo)
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
