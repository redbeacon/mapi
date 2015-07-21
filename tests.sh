#!/usr/bin/env bash

# Compile test fie
./node_modules/.bin/tsc src/mapi.spec.ts --module commonjs

# run the tests
./node_modules/.bin/jasmine-node src/mapi.spec.js

# Clean the test file
rm src/*.js
