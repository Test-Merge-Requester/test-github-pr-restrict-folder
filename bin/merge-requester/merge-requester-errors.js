import chalk from 'chalk'

export default {
  WINDOWS_NOT_SUPPORTED: {
    message: chalk.red('☠️ Este script no es soportado en Windows ☠️'),
    code: 'WINDOWS_NOT_SUPPORTED',
  },
  NOT_HUB_BIN: {
    message: `${chalk.red(
      '☠️ No se encontró el binario hub necesario en este script. Para ver como se instala vaya a: ☠️'
    )}\n${chalk.white('https://hub.github.com/')}`,
    code: 'NOT_HUB_BIN',
  },
  NOT_UPSTREAM_REMOTE: {
    message: `${chalk.red(
      '☠️ No se encontró configurado el remote de upstream para su git actualmente. Para ver como se configura vaya a: ☠️'
    )}\n${chalk.white(
      'https://help.github.com/es/github/collaborating-with-issues-and-pull-requests/configuring-a-remote-for-a-fork'
    )}`,
    code: 'NOT_UPSTREAM_REMOTE',
  },
  NOT_LOCAL_BRANCH_FOUND: {
    message(targetBranch) {
      return chalk.red(
        `☠️ No se encontró el branch ${chalk.blue(
          targetBranch
        )} en la lista de sus branchs locales ☠️`
      )
    },
    code: 'NOT_LOCAL_BRANCH_FOUND',
  },
  CHECKOUT_TO_SOURCE_BRANCH: {
    message({ error, sourceBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git checkout' al branch de origen ${sourceBranch}. Verifique que no tenga cambios por hacer commit ☠️\n${error}`
      )
    },
    code: 'CHECKOUT_TO_SOURCE_BRANCH',
  },
  NOT_CHANGES_FOUND: {
    message({ sourceBranch, targetBranch }) {
      return chalk.red(
        `☠️ No hay diferencias entre los branch el branch de origen ${chalk.white(
          sourceBranch
        )} y el branch de destino ${chalk.white(targetBranch)}  ☠️`
      )
    },
    code: 'NOT_CHANGES_FOUND',
  },
  CHECKOUT_TO_TARGET_BRANCH: {
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git checkout' al branch de destino ${targetBranch}. Verifique que no tenga cambios por hacer commit ☠️\n${error}`
      )
    },
    code: 'CHECKOUT_TO_TARGET_BRANCH',
  },
  PULL_FROM_ORIGIN_TARGET_BRANCH: {
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git pull' del remote ORIGIN del branch de destino ${targetBranch} ☠️\n${error}`
      )
    },
    code: 'PULL_FROM_ORIGIN_TARGET_BRANCH',
  },
  PULL_FROM_UPSTREAM_TARGET_BRANCH: {
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git pull' del remote UPSTREAM del branch de destino ${targetBranch} ☠️\n${error}`
      )
    },
    code: 'PULL_FROM_UPSTREAM_TARGET_BRANCH',
  },
  MERGE_FROM_SOURCE: {
    message({ error, sourceBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer merge de los cambios del branch ${sourceBranch} ☠️\n${error}`
      )
    },
    code: 'MERGE_FROM_SOURCE',
  },

  GITHUB_AUTH_CONFIG_BAD_FORMAT: {
    message: chalk.red(
      `☠️ Se encontró archivo con los credenciales de Github pero no exporta un objeto ☠️`
    ),
    code: 'GITHUB_AUTH_CONFIG_BAD_FORMAT',
  },
  GITHUB_AUTH_CONFIG_NOT_USERNAME: {
    message: chalk.red(
      `☠️ Se encontró archivo con los credenciales de Github pero no se encontró el username de su cuenta en github. ☠️`
    ),
    code: 'GITHUB_AUTH_CONFIG_NOT_USERNAME',
  },
  GITHUB_AUTH_CONFIG_NOT_PASSWORD: {
    message: chalk.red(
      `☠️ Se encontró archivo con los credenciales de Github pero no se encontró el password de su cuenta en github. ☠️`
    ),
    code: 'GITHUB_AUTH_CONFIG_NOT_PASSWORD',
  },
  MERGE_CHANGES_FROM_ORIGIN_UPSTREAM: {
    message(error) {
      return chalk.red(
        `☠️ Ha ocurrido un error al tratar de hacer commit de los cambios obtenidos de origin/upstream antes del Pull Request. ☠️\n${error}`
      )
    },
    code: 'MERGE_CHANGES_FROM_ORIGIN_UPSTREAM',
  },
}
