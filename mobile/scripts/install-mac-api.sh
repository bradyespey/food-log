#!/usr/bin/env bash
# One-time setup: installs the FoodLog Mac API as a macOS LaunchAgent.
# After running this, the server starts automatically at login — no Terminal needed.
# Usage: bash scripts/install-mac-api.sh (from FoodLog/mobile directory)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_PATH="$(command -v node)"
PLIST_LABEL="com.bradyespey.mac-api"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
LOG_PATH="$HOME/Library/Logs/brady-mac-api.log"

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_PATH}</string>
    <string>${SCRIPT_DIR}/mac-api.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_PATH}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_PATH}</string>
</dict>
</plist>
EOF

# Unload existing agent if running, then load new one
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "✅ Mac API LaunchAgent installed and started."
echo "   Running at: http://localhost:5191"
echo "   Logs:       $LOG_PATH"
echo "   Starts automatically at every login — no Terminal needed."
