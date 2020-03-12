#!/usr/bin/env node

/* eslint-disable no-global-assign */
require = require('esm')(module)
require('./merge-requester-cli')(process.argv)
