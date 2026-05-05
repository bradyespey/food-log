#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Bundling FoodLog for standalone iPhone install..."
npx expo export:embed \
  --platform ios \
  --dev false \
  --bundle-output ios/FoodLog/main.jsbundle \
  --assets-dest ios/FoodLog

echo
echo "Building and installing FoodLog on your plugged-in iPhone..."
echo "If iOS reports Untrusted Developer after install, trust baespey@gmail.com in:"
echo "Settings > General > VPN & Device Management"
echo

npx expo run:ios --device --configuration Release
