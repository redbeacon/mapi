#!/usr/bin/env bash

# Compile test fie
./node_modules/.bin/tsc

# run the tests
./node_modules/.bin/jasmine-node dist/mapi.spec.js
