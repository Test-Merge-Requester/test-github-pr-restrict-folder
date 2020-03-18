const fs = require('fs')
const require2 = require('esm')(module)
const { join } = require('path')

const errors = require2('./errors.js').default

const filepath = './.env.github'

fs.access(join(__dirname, filepath), fs.F_OK, err => {
  if (err) {
    if (err.code && err.code === 'ENOENT') {
      const { message } = errors.GITHUB_CREDENTIALS_ENV_NOT_FOUND
      console.log(message)
    } else {
      console.error(err)
    }
    process.exit(1)
  }

  process.exit(0)
})
