#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $(basename "$0") filename bytes-length"
  exit 1
fi

if [ -z "$2" ]; then
  echo "Error: missing bytes-length parameter."
  exit 1
fi

for F in $1; do
  echo "$F"
  dd if="$F" of="${F%.*}.tmp" bs="$2" skip=1 status=none
  mv -f "${F%.*}.tmp" "$F"
done
