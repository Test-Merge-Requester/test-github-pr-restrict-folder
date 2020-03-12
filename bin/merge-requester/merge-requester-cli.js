/* eslint-disable import/prefer-default-export */
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
import { config } from './merge-requester-config'

const exec = util.promisify(execSync)

const IS_WINDOWS = os.platform().indexOf('win32') > -1
const LOG = console.log

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

    // Verificar si existe el usuario y contraseña
    // configurados en el archivo `github-auth-config.js`, sino
    // los pido en el CLI
    try {
      const githubCredentials = require('./github-auth-config')
      console.log('si estan')
    } catch (e) {
      if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
        console.log("Can't load foo!")
        process.exit(0)
      } else {
        throw e
      }
    }

    // Me traigo los ultimos cambios del origin
    // del branch de destino
    let changesInOrigin = { changes: 0 }
    let changesInUpstream = { changes: 0 }
    try {
      const { summary } = await git().pull('origin', targetBranch)
      changesInOrigin = summary
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
      const { summary } = await git().pull(
        'https://chicus12:CoCobolo72040489@github.com/Test-Merge-Requester/test-github-pr-restrict-folder.git',
        targetBranch
      )
      changesInUpstream = summary
    } catch (error) {
      const { message, ...rest } = errors.PULL_FROM_UPSTREAM_TARGET_BRANCH
      throw new StandardError(
        message({ error: error.message, targetBranch }),
        rest
      )
    }

    if (changesInOrigin.changes > 0 || changesInUpstream.changes > 0) {
      try {
        // git add .
        // git commit
      } catch (error) {}
    }

    // guardo el último commit SHA antes de hacer merge
    // para luego hacer la comparación entre fuentes
    const { branches: newBranches } = await git().branch()
    console.log(newBranches)
    const lastCommitSHA = newBranches[`remotes/origin/${targetBranch}`].commit

    // hacer el merge de los cambios nuevos del origen
    // try {
    //   const { stdout: merge } = await exec(
    //     `git checkout ${sourceBranch} ${filesAndDirectoriesToMerge}`
    //   )
    // } catch (error) {
    //   const { message, ...rest } = errors.MERGE_FROM_SOURCE
    //   throw new StandardError(
    //     message({ error: error.message, sourceBranch }),
    //     rest
    //   )
    // }
  } catch (error) {
    if (error && error.code) {
      LOG(error.message)
    } else {
      console.error(error)
    }
  }
}
