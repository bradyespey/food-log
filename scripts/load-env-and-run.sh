#!/bin/bash
# Read from 1Password named pipe and export variables, then run vite
cd "$(dirname "$0")/.."
export $(cat .env | grep -v "^#" | grep "=" | xargs)
exec npx vite
