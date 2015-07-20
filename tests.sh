#!/usr/bin/env bash

# Compile test fie
tsc src/mapi.spec.ts --module commonjs

# run the tests
./node_modules/jasmine-node/bin/jasmine-node src/mapi.spec.js

# Clean the test file
rm src/mapi.spec.js
