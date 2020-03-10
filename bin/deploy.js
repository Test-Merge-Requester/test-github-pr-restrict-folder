#!/usr/bin/env node

require = require('esm')(module /*, options*/);
require('./deploy-cli').cli(process.argv);
