import { branches } from './config'

function isEmail(username) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)
}

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
        message: `↑ La lista anterior, son los fuentes del branch local ${sourceBranch} que se van a enviar como Merge Request hacia el branch upstream/${targetBranch}. Desea continuar?`,
        default: true,
      },
    ]
  },
  githubCredentials: [
    {
      type: 'input',
      name: 'githubUsername',
      message: 'Digite su usuario de github',
      validate(username) {
        if (!username || !username.length) {
          return 'El username es requerido'
        }

        if (isEmail(username)) {
          return 'Se requiere el username no el correo asociado a la cuenta de github'
        }
        return true
      },
    },
    {
      type: 'password',
      name: 'githubPassword',
      message: 'Digite su contraseña de github',
      mask: '*',
      validate(password) {
        if (!password || !password.length) {
          return 'El password es requerido'
        }

        return true
      },
    },
  ],
}
