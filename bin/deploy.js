#!/usr/bin/env node

/* eslint-disable no-global-assign */
require = require('esm')(module)
require('./deploy-cli').cli(process.argv)
