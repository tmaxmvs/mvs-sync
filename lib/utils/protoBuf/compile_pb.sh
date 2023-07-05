#!/bin/bash

set -e

function compile_proto() {
    local proto_file=$1

    protoc --proto_path=. --js_out=import_style=commonjs,binary:. "${proto_file}"
}

case "$1" in
    "clean")
        rm -rf *_pb.js
        ;;
    *)
        compile_proto Protocol.proto && compile_proto Struct.proto && compile_proto Enum.proto
        ;;
esac
