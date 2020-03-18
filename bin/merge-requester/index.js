#!/usr/bin/env node

/* eslint-disable no-global-assign */
require = require('esm')(module)
require('./cli').cli(process.argv)
