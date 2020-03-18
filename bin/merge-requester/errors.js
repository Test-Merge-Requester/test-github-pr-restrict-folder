import chalk from 'chalk'

export default {
  CHECKOUT_TO_SOURCE_BRANCH: {
    code: 'CHECKOUT_TO_SOURCE_BRANCH',
    message({ error, sourceBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git checkout' al branch de origen ${sourceBranch}. Verifique que no tenga cambios por hacer commit ☠️\n${error}`
      )
    },
  },
  CHECKOUT_TO_TARGET_BRANCH: {
    code: 'CHECKOUT_TO_TARGET_BRANCH',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git checkout' al branch de destino ${targetBranch}. Verifique que no tenga cambios por hacer commit ☠️\n${error}`
      )
    },
  },
  CONFLICTS_AFTER_MERGE_REMOTES: {
    code: 'CONFLICTS_AFTER_MERGE_REMOTES',
    message(targetBranch) {
      return chalk.red(
        `☠️ Parece que tiene conflictos por resolver (manualmente) en el branch ${targetBranch}, esto después de hacer merge de los cambios de los remotes ☠️`
      )
    },
  },
  CREATING_INFO_PULL_REQUEST_FILES: {
    code: 'CREATING_INFO_PULL_REQUEST_FILES',
    message(error) {
      return chalk.red(
        `☠️ Ha ocurrido un error al tratar de crear los archivos INSTRUCTIONS.txt y README.txt en la carpeta local de información del Pull Request, por favor, NO intente de nuevo este script, tendra que realizarlo MANUALMENTE ya que el Pull Request posiblemente haya sido creado o actualizado. ☠️\n${error}`
      )
    },
  },
  CREATING_PULL_REQUEST: {
    code: 'CREATING_PULL_REQUEST',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al tratar de crear el Pull Request de ${targetBranch} ☠️\n${error}`
      )
    },
  },
  CREATING_PULL_REQUEST_LOCAL_FOLDER: {
    code: 'CREATING_PULL_REQUEST_LOCAL_FOLDER',
    message(error) {
      return chalk.red(
        `☠️ Ha ocurrido un error al tratar de crear la carpeta local de información del Pull Request, por favor, NO intente de nuevo este script, tendra que realizarlo MANUALMENTE ya que el Pull Request posiblemente haya sido creado o actualizado. ☠️\n${error}`
      )
    },
  },
  FETCH_FROM_ORIGIN_TARGET_BRANCH: {
    code: 'FETCH_FROM_ORIGIN_TARGET_BRANCH',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al realizar fetch del branch ${targetBranch} del remote origin. ☠️\n${error}`
      )
    },
  },
  FETCH_FROM_UPSTREAM_TARGET_BRANCH: {
    code: 'FETCH_FROM_UPSTREAM_TARGET_BRANCH',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al realizar fetch del branch ${targetBranch} del remote upstream. ☠️\n${error}`
      )
    },
  },
  GITHUB_AUTH_CONFIG_NOT_PASSWORD: {
    code: 'GITHUB_AUTH_CONFIG_NOT_PASSWORD',
    message: chalk.red(
      `☠️ Se encontró archivo con los credenciales de Github pero no se encontró el password de su cuenta en github. ☠️`
    ),
  },
  GITHUB_AUTH_CONFIG_NOT_USERNAME: {
    code: 'GITHUB_AUTH_CONFIG_NOT_USERNAME',
    message: chalk.red(
      `☠️ Se encontró archivo con los credenciales de Github pero no se encontró el username de su cuenta en github. ☠️`
    ),
  },
  GITHUB_BAD_CREDENTIALS: {
    code: 'GITHUB_BAD_CREDENTIALS',
    message(error) {
      return chalk.red(
        `☠️ El username y/o password de su cuenta de Github digitados o configurados son incorrectos. ☠️\n${error}`
      )
    },
  },
  GITHUB_CREDENTIALS_ENV_NOT_FOUND: {
    code: 'GITHUB_CREDENTIALS_ENV_NOT_FOUND',
    message: chalk.red(
      `☠️ No se encontró el archivo ${chalk.yellow(
        '/bin/merge-requester/.env.github'
      )} con los credenciales de su cuenta de Github. Este archivo está incluido en el .gitignore por lo tanto sus datos no serán subidos al repo. ☠️${chalk.white(
        `\n\nCree el archivo '.env.github' y incluya su usuario y password, ejemplo:\nGITHUB_USER=jhondoe\nGITHUB_PASSWORD=asp128 🤫\n`
      )}`
    ),
  },
  LIST_OPENED_PULL_REQUEST: {
    code: 'LIST_OPENED_PULL_REQUEST',
    message(error) {
      return chalk.red(
        `☠️ Ha ocurrido un error al tratar de listar los Pull Request abiertos actualmente ☠️\n${error}`
      )
    },
  },
  MERGE_CHANGES_FROM_ORIGIN_UPSTREAM: {
    code: 'MERGE_CHANGES_FROM_ORIGIN_UPSTREAM',
    message(error) {
      return chalk.red(
        `☠️ Ha ocurrido un error al tratar de hacer commit de los cambios obtenidos de origin/upstream antes del Pull Request. ☠️\n${error}`
      )
    },
  },
  MERGE_FROM_SOURCE: {
    code: 'MERGE_FROM_SOURCE',
    message({ error, sourceBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer merge de los cambios del branch ${sourceBranch} ☠️\n${error}`
      )
    },
  },
  MERGE_FROM_UPSTREAM_TARGET_BRANCH: {
    code: 'MERGE_FROM_UPSTREAM_TARGET_BRANCH',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git merge' del remote UPSTREAM del branch de destino ${targetBranch} ☠️\n${error}`
      )
    },
  },
  MERGE_ORIGIN_TARGET_BRANCH: {
    code: 'MERGE_ORIGIN_TARGET_BRANCH',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Ha ocurrido un error al hacer 'git merge' del remote ORIGIN del branch de destino ${targetBranch} ☠️\n${error}`
      )
    },
  },
  NOT_CHANGES_FOUND: {
    code: 'NOT_CHANGES_FOUND',
    message({ sourceBranch, targetBranch }) {
      return chalk.red(
        `☠️ No hay diferencias entre el branch de origen ${chalk.white(
          sourceBranch
        )} y el branch de destino ${chalk.white(targetBranch)}  ☠️`
      )
    },
  },
  NOT_HUB_BIN: {
    code: 'NOT_HUB_BIN',
    message: `${chalk.red(
      '☠️ No se encontró el binario hub necesario en este script para interectuar con Github a nivel de terminal. Para ver como se instala vaya a: ☠️'
    )}\n${chalk.white('https://hub.github.com/')}`,
  },
  NOT_LOCAL_BRANCH_FOUND: {
    code: 'NOT_LOCAL_BRANCH_FOUND',
    message(targetBranch) {
      return chalk.red(
        `☠️ No se encontró el branch ${chalk.blue(
          targetBranch
        )} en la lista de sus branchs locales ☠️`
      )
    },
  },
  NOT_UPSTREAM_REMOTE: {
    code: 'NOT_UPSTREAM_REMOTE',
    message: `${chalk.red(
      '☠️ No se encontró configurado el remote de upstream para su git actualmente. Para ver como se configura vaya a: ☠️'
    )}\n${chalk.white(
      'https://help.github.com/es/github/collaborating-with-issues-and-pull-requests/configuring-a-remote-for-a-fork'
    )}`,
  },
  NOT_WHITELIST_CONFIG_FOUND_FOR_BRANCH: {
    code: 'NOT_WHITELIST_CONFIG_FOUND_FOR_BRANCH',
    message(targetBranch) {
      return chalk.red(
        `☠️ No se encontró la configuración de los archivos permitidos para merge para el branch ${targetBranch}. Revisar el archivo 'bin/merge-requester/merge-requester-config.js'. ☠️`
      )
    },
  },
  PUSH_TO_ORIGIN_TARGET_BRANCH: {
    code: 'PUSH_TO_ORIGIN_TARGET_BRANCH',
    message({ error, targetBranch }) {
      return chalk.red(
        `☠️ Parece que ha ocurrido un error al realizar push de los cambios al branch ${targetBranch} del remote origin. ☠️\n${error}`
      )
    },
  },
  WINDOWS_NOT_SUPPORTED: {
    code: 'WINDOWS_NOT_SUPPORTED',
    message: chalk.red('☠️ Este script no es soportado en Windows ☠️'),
  },
}
