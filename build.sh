#!/usr/bin/env bash

emcc worker.c -o worker.js \
    --memory-init-file 0 \
    -s 'EXPORTED_FUNCTIONS=["_d3cpp_set_data", "_d3cpp_set_viewport"]' \
    -s 'NO_FILESYSTEM=1' \
    -s 'ALLOW_MEMORY_GROWTH=1' \
    -s 'BUILD_AS_WORKER=1' \
    -O3 \
    -std=c99 \
    -Wall
