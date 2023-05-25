const cluster = require('./../cluster/cluster')
const constraint = require('./../cluster/constraint')

const Cluster = {
  name: 'Cluster',
  docs: 'Arranges the provided Persons into clusters, and sets a property on each person to indicate which cluster they are in.',
  args: [
    {
      name: 'name',
      type: 'String',
      docs: 'The name of the property where the result should be stored.',
    },
    {
      name: 'numClusters',
      type: 'Number',
      docs: 'The number of clusters to create.',
    },
    {
      name: 'persons',
      type: 'Array<Person>',
      docs: 'The people to be clustered.',
    },
    {
      name: 'preCluster',
      type: 'String(Person)',
      lazy: true,
      docs: 'People with the same value for this function will be assigned to the same cluster.',
    },
    {
      name: 'constraints',
      type: 'Array<Constraint>',
      docs: 'Constraints that should be applied to the clustering.',
    },
  ],
  outputType: 'ClusteringResult',
  mutations: ['persons'],
  implementation: (name, numClusters, persons, preCluster, constraints) => {
    return cluster.Cluster(name, numClusters, persons, preCluster, constraints)
  }
}

function BalanceConstraint(argType) {
  return {
    name: 'BalanceConstraint',
    docs: 'A clustering constraint which balances the number of people in each Cluster with a given property, or the total of a given property.',
    args: [
      {
        name: 'name',
        type: 'String',
        docs: 'The name of the constraint',
      },
      {
        name: 'value',
        type: argType + '(Person)',
        lazy: true,
        docs: 'The value of the constraint to be evaluated for each person',
      },
      {
        name: 'weight',
        type: 'Number',
        docs: 'The weighting value to assign to this cluster',
      },
    ],
    outputType: 'Constraint',
    implementation: (name, value, weight) => {
      return new constraint.BalanceConstraint(name, value, weight)
    }
  }
}

function LimitConstraint(argType) {
  return {
    name: 'LimitConstraint',
    docs: 'A constraint that limits the sum of a given property across all people in a cluster.',
    args: [
      {
        name: 'name',
        type: 'String',
        docs: 'The name of the constraint',
      },
      {
        name: 'value',
        type: argType + '(Person)',
        lazy: true,
        docs: 'The value of the constraint to be evaluated for each person',
      },
      {
        name: 'min',
        type: 'Number',
        docs: 'The minimum value per cluster',
      },
      {
        name: 'weight',
        type: 'Number',
        docs: 'The weighting value to assign to this cluster',
      },
    ],
    outputType: 'Constraint',
    implementation: (name, value, min, weight) => {
      return new constraint.LimitConstraint(name, value, min, weight)
    }
  }
}

module.exports = {
  functions: [Cluster,
              BalanceConstraint('Number'), BalanceConstraint('Boolean'),
              LimitConstraint('Number'), LimitConstraint('Boolean')]
}
