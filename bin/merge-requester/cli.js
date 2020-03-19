// Los reglas de eslint deshabilitados tienen un proposito no intenten esto en casa
/* eslint-disable global-require */
import clear from 'clear'
import chalk from 'chalk'
import os from 'os'
import StandardError from 'standard-error'
import figlet from 'figlet'
import binExists from 'command-exists'
import inquirer from 'inquirer'
import git from 'simple-git/promise'
import util from 'util'
import fs from 'fs'
import { exec as execSync } from 'child_process'
import { join } from 'path'
import { format } from 'date-fns'
import open from 'open'
import { createBasicAuth } from '@octokit/auth-basic'

import errors from './errors'
import questions from './cli-questions'
import { config, REPO, GITHUB_ORGANIZATION, gitActionTypes } from './config'

const exec = util.promisify(execSync)
const mkdirAsync = util.promisify(fs.mkdir)
const appendAsync = util.promisify(fs.appendFile)
const writeFileAsync = util.promisify(fs.writeFile)

const IS_WINDOWS = os.platform().indexOf('win32') > -1
const LOG = console.log

// eslint-disable-next-line import/prefer-default-export
export async function cli() {
  let currentBranch = null
  try {
    await clear()
    LOG('')
    LOG(chalk.yellow(figlet.textSync('Merge Requester')))

    // Definición de variables
    let githubUsername = null
    let githubPassword = null
    let githubToken = null
    let mergeWithOriginRequired = true
    let conflictsWithOrigin = 0
    let conflictsWithUpstream = 0
    let lastCommitInUpstreamTargetBranch = null
    let openPullRequestNumber = 0
    let previousAddedFiles = []
    let newFiles = []
    let pullRequestUri = null
    let pullRequestLocalFolderName = null

    if (IS_WINDOWS) {
      // Este script no se ha probado en Windows, mostrar un error de momento
      const { message, ...rest } = errors.WINDOWS_NOT_SUPPORTED
      throw new StandardError(message, rest)
    }

    // Verificar si existe el usuario y contraseña
    // configurados en el archivo `.env.github`
    if (!process.env.GITHUB_USER) {
      const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_NOT_USERNAME
      throw new StandardError(message, rest)
    }

    if (!process.env.GITHUB_PASSWORD) {
      const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_NOT_PASSWORD
      throw new StandardError(message, rest)
    }

    githubUsername = process.env.GITHUB_USER
    githubPassword = process.env.GITHUB_PASSWORD
    githubToken = process.env.GITHUB_TOKEN

    try {
      // hub es de github, se tiene que instalar en la maquina, se usa el binario para hacer
      // pull request. Se comprueba que exista
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

    const status = await git().status()

    if (
      status.not_added.length ||
      status.conflicted.length ||
      status.created.length ||
      status.deleted.length ||
      status.modified.length ||
      status.renamed.length ||
      status.staged.length
    ) {
      const { message, ...rest } = errors.CHANGES_NOT_COMMITED
      throw new StandardError(message(status), { ...rest })
    }

    if (!githubToken) {
      try {
        // Se obtiene el token de github para ser utilizado en las demás operacion
        // Esto esta deprecado:
        // OJO: https://developer.github.com/changes/2020-02-14-deprecating-password-auth/
        // La solucion sería que cada usuario cree su github_token y lo guarde en el file .env.github
        const auth = createBasicAuth({
          username: githubUsername,
          password: githubPassword,
          async on2Fa() {
            // prompt user for the one-time password retrieved via SMS or authenticator app
            const { twoFa } = await inquirer.prompt([
              {
                type: 'input',
                name: 'twoFa',
                message: 'Two-factor authentication Code:',
              },
            ])
            return twoFa
          },
          token: {
            scopes: ['repo'],
          },
        })

        const tokenAuthentication = await auth({
          type: 'token',
        })
        githubToken = tokenAuthentication.token
        process.env.GITHUB_TOKEN = githubToken
        await appendAsync(
          join(__dirname, '.env.github'),
          `\nGITHUB_TOKEN=${githubToken}`
        )
      } catch (error) {
        if (error.message.match(/Bad credentials/i)) {
          const { message, ...rest } = errors.GITHUB_BAD_CREDENTIALS
          throw new StandardError(message(error.message), {
            ...rest,
            stack: error.stack,
          })
        } else {
          throw error
        }
      }
    }

    // CLI: seleccione el branch de destino
    const { targetBranch } = await inquirer.prompt(questions.targetBranch)

    // listar todos los branches locales
    const localBranches = await git().branchLocal()

    const targetBranchFound = localBranches.all.findIndex(
      branch => branch === targetBranch
    )

    if (targetBranchFound === -1) {
      // Si no se encontró el branch que seleccionó como destino en la lista de branches localmente, mostrar error
      const { message, ...rest } = errors.NOT_LOCAL_BRANCH_FOUND
      throw new StandardError(message(targetBranch), rest)
    }

    if (
      config[targetBranch] === undefined ||
      config[targetBranch].whitelist === undefined
    ) {
      // si no tiene configuración el branch seleccionado, indico error
      const { message, ...rest } = errors.NOT_WHITELIST_CONFIG_FOUND_FOR_BRANCH
      throw new StandardError(message(targetBranch), rest)
    }

    // Hacer fetch del remote origin del branch elegido como destino
    try {
      await git()
        .silent(true)
        .fetch('origin', targetBranch)
    } catch (error) {
      if (error.message.match(/couldn't find remote ref/i)) {
        // no se encontro el branch en el origin
        // no es necesario hacer merge ya que no existe
        // aún el branch en el origin
        mergeWithOriginRequired = false
      } else {
        const { message, ...rest } = errors.FETCH_FROM_ORIGIN_TARGET_BRANCH
        throw new StandardError(
          message({ error: error.message, targetBranch }),
          { ...rest, stact: error.stack }
        )
      }
    }

    // Hacer fetch del remote upstream del branch elegido como destino
    try {
      await git()
        .silent(true)
        .fetch('upstream', targetBranch)
    } catch (error) {
      if (error.message.match(/couldn't find remote ref/i)) {
        const { message, ...rest } = errors.NOT_UPSTREAM_TARGET_BRANCH
        throw new StandardError(
          message({ error: error.message, targetBranch }),
          { ...rest, stack: error.stack }
        )
      } else {
        const { message, ...rest } = errors.FETCH_FROM_UPSTREAM_TARGET_BRANCH
        throw new StandardError(
          message({ error: error.message, targetBranch }),
          { ...rest, stact: error.stack }
        )
      }
    }

    // CLI: seleccione el branch de origen
    const { sourceBranch } = await inquirer.prompt(
      questions.sourceBranch({
        localBranches: localBranches.all,
        defaultBranch: localBranches.current,
      })
    )

    const sourceBranchFound = localBranches.all.findIndex(
      branch => branch === sourceBranch
    )

    if (sourceBranchFound === -1) {
      // Si no se encontró el branch, mostrar error
      // esta de más esta validación, pero por aquello
      const { message, ...rest } = errors.NOT_LOCAL_BRANCH_FOUND
      throw new StandardError(message(sourceBranch), rest)
    }

    // se asigna a la variable currentBranch el current branch en local
    currentBranch = localBranches.current

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
      `git diff upstream/${targetBranch}..${sourceBranch} --color --stat ${filesAndDirectoriesToMerge}`
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
      // no quiere avanzar o no confirma los cambios
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

    if (mergeWithOriginRequired) {
      try {
        // se hace merge de los cambios que hay en el remote origin del branch de destino seleccionado
        // En caso de conflictos se guardan
        const { conflicts } = await git()
          .silent(true)
          .merge([`origin/${targetBranch}`])

        if (conflicts.length) {
          conflictsWithOrigin = conflicts.length
        }
      } catch (error) {
        const { message, ...rest } = errors.MERGE_ORIGIN_TARGET_BRANCH
        throw new StandardError(
          message({
            error: error.message,
            targetBranch,
          }),
          {
            ...rest,
            stack: error.stack,
          }
        )
      }
    }

    // se hace merge de los cambios que hay en el remote upstream del branch de destino seleccionado
    // En caso de conflictos se guardan
    try {
      const { conflicts } = await git()
        .silent(true)
        .merge([`upstream/${targetBranch}`])

      if (conflicts.length) {
        conflictsWithUpstream = conflicts.length
      }
    } catch (error) {
      const { message, ...rest } = errors.MERGE_FROM_UPSTREAM_TARGET_BRANCH
      throw new StandardError(message({ error: error.message, targetBranch }), {
        ...rest,
        stack: error.stack,
      })
    }

    // En caso de conflictos luego de realizar los merge de remote origin y upstream del branch de destino seleccionado, se le indica al usuario que los arregle
    if (conflictsWithOrigin > 0 || conflictsWithUpstream > 0) {
      const { message, ...rest } = errors.CONFLICTS_AFTER_MERGE_REMOTES
      throw new StandardError(message(targetBranch), rest)
    }

    // guardo el último commit SHA antes de hacer merge
    // para luego hacer la comparación de diferencias entre branches
    const { branches } = await git().branch()

    lastCommitInUpstreamTargetBranch =
      branches[`remotes/upstream/${targetBranch}`].commit

    // hacer el merge de los cambios nuevos del origen
    try {
      await exec(`git checkout ${sourceBranch} ${filesAndDirectoriesToMerge}`)
    } catch (error) {
      const { message, ...rest } = errors.MERGE_FROM_SOURCE
      throw new StandardError(
        message({ error: error.message, sourceBranch }),
        rest
      )
    }

    // se hace commit de los cambios del merge del paso anterior
    try {
      await git().commit(branches[sourceBranch].label)
    } catch (error) {
      const { message, ...rest } = errors.MERGE_CHANGES_FROM_ORIGIN_UPSTREAM
      throw new StandardError(message, rest)
    }

    // Realizar push de los cambios al branch de destino en el remote de origin
    console.log('pusheo1')

    try {
      await git()
        .silent(true)
        .push('origin', targetBranch)
      console.log('pusheo')
    } catch (error) {
      const { message, ...rest } = errors.PUSH_TO_ORIGIN_TARGET_BRANCH
      throw new StandardError(message({ targetBranch, error }), {
        ...rest,
        stack: error.stack,
      })
    }

    try {
      // listar los Pull Requesta que están abiertos actualmente para el branch de destino
      // la lista viene en formato: numero del pr|autor del pr|branch del pr salto de línea
      const { stdout: listOfOpenPR } = await exec(
        `hub pr list -b ${targetBranch} -f "%I|%au|%B%n"`
      )

      if (listOfOpenPR && listOfOpenPR.length) {
        listOfOpenPR.split('\n').forEach(pr => {
          if (pr) {
            const [number, author] = pr.split('|')
            if (author === process.env.GITHUB_USER) {
              // solo queremos saber los PR creados por el usuario
              openPullRequestNumber = number
            }
          }
        })
      }
    } catch (error) {
      const { message, ...rest } = errors.LIST_OPENED_PULL_REQUEST
      throw new StandardError(message(error.message), {
        ...rest,
        stack: error.stack,
      })
    }

    // Esto se podría mejorar manejando en alguna BD los datos de los PR
    // de momento se guarda la informacion en archivos, por facilidad y tiempo
    // CONS: no se podría actualizar la info de un PR abierto desde otra maquina
    if (openPullRequestNumber) {
      // se obtienen los archivos anteriormente agregados en un PR activo
      // eslint-disable-next-line import/no-dynamic-require
      previousAddedFiles = require(`./pr${openPullRequestNumber}/files.js`)
      const { stdout: currentPR } = await exec(
        `hub pr show -u ${openPullRequestNumber}`
      )
      pullRequestUri = currentPR
    } else {
      // se crea el Pull Request en Github
      // Flags a tomar en cuenta
      // -m: título del branch
      // -b: branch destino
      // -r: reviewers
      // -l: labels/tags
      let actionToExecute = `hub pull-request -f -m "new pull request by ${githubUsername}" -h ${githubUsername}:${targetBranch} -b ${GITHUB_ORGANIZATION}:${targetBranch}`

      const configuration = config[targetBranch]

      if (configuration.reviewers && configuration.reviewers.length) {
        const reviewers = configuration.reviewers
          .filter(r => r !== githubUsername)
          .join(',')
        if (reviewers && reviewers.length) {
          actionToExecute += ` -r ${reviewers}`
        }
      }

      if (configuration.labels && configuration.labels.length) {
        actionToExecute += ` -l ${configuration.labels.join(',')}`
      }

      try {
        const { stdout: pullRequestCreated } = await exec(actionToExecute)
        openPullRequestNumber = pullRequestCreated.substring(
          pullRequestCreated.lastIndexOf('/') + 1
        )

        pullRequestUri = pullRequestCreated
      } catch (error) {
        const { message, ...rest } = errors.CREATING_PULL_REQUEST
        throw new StandardError(
          message({ targetBranch, error: error.message }),
          { ...rest, stack: error.stack }
        )
      }

      try {
        //  crear carpeta con la información del Pull Request, es temporal
        pullRequestLocalFolderName = `pr${openPullRequestNumber}`
        await mkdirAsync(join(__dirname, pullRequestLocalFolderName))
      } catch (error) {
        const { message, ...rest } = errors.CREATING_PULL_REQUEST_LOCAL_FOLDER
        throw new StandardError(message(error.message), {
          ...rest,
          stack: error.stack,
        })
      }

      try {
        const { steps, pm2 } = config[targetBranch]
        await Promise.all([
          writeFileAsync(
            join(__dirname, pullRequestLocalFolderName, 'README.txt'),
            'No tocar los archivos que hay en esta carpeta\nBorrar esta carpeta luego de que el pull request haya sido mergeado'
          ),
          writeFileAsync(
            join(__dirname, pullRequestLocalFolderName, 'INSTRUCTIONS.txt'),
            `Precondiciones de instalación:\n${
              steps.preconditions
            }\n\nPasos de instalación:\n${steps.installation
              .replace(':path', pm2.path)
              .replace(':branch', targetBranch)
              .replace(
                ':executionScript',
                pm2.executionScript
              )}\n\nPasos de verificación:\n${steps.verification.replace(
              /:name/g,
              pm2.name
            )}\n\nPasos de rollback:\n${steps.rollback
              .replace(':lastCommitSHA', lastCommitInUpstreamTargetBranch)
              .replace(':name', pm2.name)}\n\nLista de fuentes cambiados:\n`
          ),
        ])
      } catch (error) {
        const { message, ...rest } = errors.CREATING_INFO_PULL_REQUEST_FILES
        throw new StandardError(message(error.message), {
          ...rest,
          stack: error.stack,
        })
      }
    }

    // el diff respondería algo como: M README.md
    // En donde M es la acción que ocurrió (Crear, Modificar, etc), basicamente gitActionTypes tiene mapeadas todas las acciones para que lo tome como referencia
    const { stdout: diff } = await exec(
      `git diff upstream/${targetBranch} ${targetBranch} --name-status`
    )

    if (diff && diff.length) {
      const today = new Date()
      let count = 0
      newFiles = diff.split('\n').reduce((acc, currentValue) => {
        if (currentValue && currentValue.length) {
          const [action, file] = currentValue.split('\t')

          if (!previousAddedFiles.includes(file)) {
            count += 1
            if (count === 20) {
              acc.push('')
              count = 0
            }

            acc.push(
              `${file},${
                gitActionTypes[action.toLowerCase()]
              } ${file},1,${format(today, 'dd-MM-yyyy')},Objeto,Objeto`
            )
          }

          previousAddedFiles.push(file)
        }

        return acc
      }, [])
    }

    if (newFiles.length) {
      await appendAsync(
        join(__dirname, pullRequestLocalFolderName, 'INSTRUCTIONS.txt'),
        newFiles.join('\n')
      )
    }

    await writeFileAsync(
      join(__dirname, pullRequestLocalFolderName, 'files.js'),
      `module.exports = [${previousAddedFiles.map(i => `'${i}'`).join(', ')}]`
    )

    await open(pullRequestUri.replace('\n', ''))

    await git().checkout(currentBranch)
  } catch (error) {
    if (error && error.code) {
      LOG(error.message)
    } else {
      console.error(error)
    }
  }
}
