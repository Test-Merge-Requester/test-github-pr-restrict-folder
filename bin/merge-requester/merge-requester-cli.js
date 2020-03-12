/* eslint-disable global-require */

import chalk from 'chalk'
import os from 'os'
import StandardError from 'standard-error'
import figlet from 'figlet'
import binExists from 'command-exists'
import inquirer from 'inquirer'
import git from 'simple-git/promise'
import util from 'util'
import { exec as execSync } from 'child_process'

import errors from './merge-requester-errors'
import questions from './merge-requester-cli-questions'
import { config, REPO, GITHUB_ORGANIZATION } from './merge-requester-config'

const exec = util.promisify(execSync)

const IS_WINDOWS = os.platform().indexOf('win32') > -1
const LOG = console.log

// eslint-disable-next-line import/prefer-default-export
export async function cli() {
  let currentBranch = null
  try {
    LOG(chalk.yellow(figlet.textSync('Merge Requester')))
    if (IS_WINDOWS) {
      // Este script no se ha probado en Windows, mostrar un error de momento
      const { message, ...rest } = errors.WINDOWS_NOT_SUPPORTED
      throw new StandardError(message, rest)
    }

    try {
      // hub es de github, se tiene que instalar en la maquina, se usa el binario para hacer
      // pull request
      await binExists('hub')
    } catch (error) {
      const { message, ...rest } = errors.NOT_HUB_BIN
      throw new StandardError(message, rest)
    }

    const { stdout: remotes } = await exec('git remote')

    if (remotes.indexOf('upstream') === -1) {
      // Tienen que tener configurado el upstream, si no mostrar error ↓
      const { message, ...rest } = errors.NOT_UPSTREAM_REMOTE
      throw new StandardError(message, rest)
    }

    // CLI: seleccione el branch de destino
    const { targetBranch } = await inquirer.prompt(questions.targetBranch)

    const branches = await git().branchLocal()

    const targetBranchFound = branches.all.findIndex(
      branch => branch === targetBranch
    )

    if (targetBranchFound === -1) {
      // Si no se encontró el branch, mostrar error
      const { message, ...rest } = errors.NOT_LOCAL_BRANCH_FOUND
      throw new StandardError(message(targetBranch), rest)
    }

    // CLI: seleccione el branch de origen
    const { sourceBranch } = await inquirer.prompt(
      questions.sourceBranch({
        localBranches: branches.all,
        defaultBranch: branches.current,
      })
    )

    const sourceBranchFound = branches.all.findIndex(
      branch => branch === sourceBranch
    )

    if (sourceBranchFound === -1) {
      // Si no se encontró el branch, mostrar error
      // esta de mas esta validacion, pero por aquello
      const { message, ...rest } = errors.NOT_LOCAL_BRANCH_FOUND
      throw new StandardError(message(sourceBranch), rest)
    }

    // se asigna a la variable global el current branch
    currentBranch = branches.current

    // se hace checkout al branch de origen en caso
    // de no estarlo
    if (currentBranch !== sourceBranch) {
      try {
        await git().checkout(sourceBranch)
      } catch (error) {
        const { message, ...rest } = errors.CHECKOUT_TO_SOURCE_BRANCH

        throw new StandardError(
          message({ error: error.message, sourceBranch }),
          rest
        )
      }
    }

    currentBranch = sourceBranch

    const filesAndDirectoriesToMerge = config[targetBranch].whitelist.join(' ')

    // diff targetBranch..sourceBranch
    const { stdout: differencesBetweenBranches } = await exec(
      `git diff ${targetBranch}..${sourceBranch} --color --stat ${filesAndDirectoriesToMerge}`
    )

    if (!differencesBetweenBranches) {
      // no hay cambios en los fuentes, nada para
      // el deploy
      const { message, ...rest } = errors.NOT_CHANGES_FOUND
      throw new StandardError(message({ sourceBranch, targetBranch }), rest)
    }

    // Mostrar los fuentes cambiados y preguntar
    // si quiere avanzar
    LOG(differencesBetweenBranches)
    const { confirmDifferencesBetweenBranches } = await inquirer.prompt(
      questions.confirmDifferencesBetweenBranches({
        targetBranch,
        sourceBranch,
      })
    )

    if (!confirmDifferencesBetweenBranches) {
      // no quiere avanzar
      process.exit(0)
      return
    }

    // cambiarse al branch de destino para obtener
    // cambios
    try {
      await git()
        .silent(true)
        .checkout(targetBranch)
    } catch (error) {
      const { message, ...rest } = errors.CHECKOUT_TO_TARGET_BRANCH

      throw new StandardError(message({ error: error.message, targetBranch }), {
        ...rest,
        stack: error.stack,
      })
    }

    let githubUsername = null
    let githubPassword = null
    // Verificar si existe el usuario y contraseña
    // configurados en el archivo `github-auth-config.js`, si no
    // los pido en el CLI
    try {
      const githubCredentials = require('./github-auth-config')
      if (typeof githubCredentials !== 'object') {
        const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_BAD_FORMAT
        throw new StandardError(message, rest)
      }

      if (
        !githubCredentials.username ||
        typeof githubCredentials.username !== 'string' ||
        !githubCredentials.username.length
      ) {
        const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_NOT_USERNAME
        throw new StandardError(message, rest)
      }

      if (
        !githubCredentials.password ||
        typeof githubCredentials.password !== 'string' ||
        !githubCredentials.password.length
      ) {
        const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_NOT_PASSWORD
        throw new StandardError(message, rest)
      }

      githubUsername = githubCredentials.username
      githubPassword = githubCredentials.password
    } catch (e) {
      if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
        // no se encontró el archivo con los credenciales de Github
        LOG(
          chalk.cyan(
            'Ha futuro puede crear el archivo github-auth-config.js (está incluído en el .gitignore) en la ruta `bin/merge-requester/` y exportar un objeto con `username` y `password`, seran tomados de ahí sus credenciales para que no tenga que digitarlos'
          )
        )
      } else {
        throw e
      }
    }

    if (!githubUsername || !githubPassword) {
      // si no se definió archivo de credenciales
      // pregunto por CLI usuario y password de github
      const githubCredentials = await inquirer.prompt(
        questions.githubCredentials
      )

      githubUsername = githubCredentials.githubUsername
      githubPassword = githubCredentials.githubPassword
    }

    // Me traigo los ultimos cambios del origin
    // del branch de destino
    const changesInOrigin = { changes: 0 }
    const changesInUpstream = { changes: 0 }
    try {
      const response = await git().fetch(
        `https://${githubUsername}:${githubPassword}@github.com/${githubUsername}/${REPO}`,
        targetBranch
      )
      const response2 = await git().merge(`origin/${targetBranch}`)
      // changesInOrigin = summary
      console.log('response origin', response)
      console.log('response origin2', response2)
    } catch (error) {
      const { message, ...rest } = errors.PULL_FROM_ORIGIN_TARGET_BRANCH
      throw new StandardError(
        message({ error: error.message, targetBranch }),
        rest
      )
    }

    // Me traigo los ultimos cambios del upstream
    // del branch de destino
    try {
      const response = await git().fetch(
        `https://${githubUsername}:${githubPassword}@github.com/${GITHUB_ORGANIZATION}/${REPO}`,
        targetBranch
      )
      const response2 = await git().merge(`upstream/${targetBranch}`)
      console.log('response upstream', response)
      console.log('response upstream2', response2)

      // changesInUpstream = summary
    } catch (error) {
      const { message, ...rest } = errors.PULL_FROM_UPSTREAM_TARGET_BRANCH
      throw new StandardError(
        message({ error: error.message, targetBranch }),
        rest
      )
    }

    if (changesInOrigin.changes > 0 || changesInUpstream.changes > 0) {
      try {
        await git()
          .add('.')
          .commit('Merge changes from upstream and origin before Pull Request')
      } catch (error) {
        const { message, ...rest } = errors.MERGE_CHANGES_FROM_ORIGIN_UPSTREAM
        throw new StandardError(message, rest)
      }
    }

    // guardo el último commit SHA antes de hacer merge
    // para luego hacer la comparación entre fuentes
    const { branches: newBranchesReference } = await git().branch()

    const lastCommitSHA =
      newBranchesReference[`remotes/origin/${targetBranch}`].commit

    console.log('lastCommitSHA', lastCommitSHA)

    // hacer el merge de los cambios nuevos del origen
    try {
      const { stdout: merge } = await exec(
        `git checkout ${sourceBranch} ${filesAndDirectoriesToMerge}`
      )

      console.log('merge', merge)
    } catch (error) {
      const { message, ...rest } = errors.MERGE_FROM_SOURCE
      throw new StandardError(
        message({ error: error.message, sourceBranch }),
        rest
      )
    }

    try {
      await git()
        .add('.')
        .commit('Merge changes from upstream and origin before Pull Request')
    } catch (error) {
      const { message, ...rest } = errors.MERGE_CHANGES_FROM_ORIGIN_UPSTREAM
      throw new StandardError(message, rest)
    }
  } catch (error) {
    if (error && error.code) {
      LOG(error.message)
    } else {
      console.error(error)
    }
  }
}
