import { branches } from './merge-requester-config'

export default {
  targetBranch: [
    {
      type: 'list',
      name: 'targetBranch',
      message:
        'Seleccione el branch al cuál quiere hacer Merge Request? (Branch de Destino / Target Branch)',
      choices: branches,
    },
  ],
  sourceBranch({ localBranches, defaultBranch }) {
    return [
      {
        type: 'list',
        name: 'sourceBranch',
        message:
          'Seleccione el branch desde el cuál quiere obtener los cambios para hacer Merge Request? (Branch de Origen / Source Branch)',
        choices: localBranches,
        default: defaultBranch,
      },
    ]
  },
  confirmDifferencesBetweenBranches({ sourceBranch, targetBranch }) {
    return [
      {
        type: 'confirm',
        name: 'confirmDifferencesBetweenBranches',
        message: `↑ La lista anterior, son los fuentes de ${sourceBranch} que se van a enviar como Merge Request hacia ${targetBranch}. Desea continuar?`,
        default: true,
      },
    ]
  },
}
