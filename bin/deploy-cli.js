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

const exec = util.promisify(execSync)

const IS_WINDOWS = os.platform().indexOf('win32') > -1
const LOG = console.log

export async function cli() {
  try {
    LOG(chalk.yellow(figlet.textSync('Pull Requester')))
    if (IS_WINDOWS) {
      // LOG(chalk.red('☠️ Este script no es soportado en Windows ☠️'))
      throw new StandardError(
        chalk.red('☠️ Este script no es soportado en Windows ☠️'),
        { code: 'NOT_SUPPORTED' }
      )
    }

    try {
      await binExists('hub')
    } catch (error) {
      throw new StandardError(
        `${chalk.red(
          '☠️ No se encontró el binario hub necesario en este script. Para ver como se instala vaya a: ☠️'
        )}\n${chalk.white('https://hub.github.com/')}`,
        { code: 'NOT_BIN_NECESSARY' }
      )
    }

    const branchs = await git().branchLocal()
    const { branchDestiny } = await inquirer.prompt([
      {
        type: 'list',
        name: 'branchDestiny',
        message: 'Seleccione el branch al cuál quiere hacer Pull Request?',
        choices: ['migracion/qa', 'crearempresa/qa'],
      },
    ])
    const branchDestinyFound = branchs.all.findIndex(
      branch => branch === branchDestiny
    )

    if (branchDestinyFound > -1) {
      LOG('Se encontró el branch')
    }

    const { stdout: remotes } = await exec('git remote')

    console.log('remotes', remotes.indexOf('upstream'))
    const { stdout: diff, stderr: diffError } = await exec(
      'git diff branch1..develop --color --stat folder1/ .eslintrc.js .gitignore .prettierrc package.json README.md yarn.lock'
    )

    try {
      await git().checkout('branch1')
    } catch (error) {
      throw new StandardError(
        chalk.red(
          `☠️ Error al hacer checkout al branch x ☠️ \n ${error.message} `
        ),
        {
          code: 'NOT_BIN_NECESSARY',
        }
      )
    }
    console.log(diff)
    console.log('branchs', branchs)
    console.log('answer', branchDestinyFound)
  } catch (error) {
    if (error && error.code) {
      LOG(error.message)
    } else {
      console.error(error)
    }
  }
}
