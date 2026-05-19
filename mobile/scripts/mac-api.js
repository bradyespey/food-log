#!/usr/bin/env node
// Local Mac API server for AdminPanel → FoodLog iOS builds.
// Install as a LaunchAgent (run once): bash scripts/install-mac-api.sh
// Or start manually: node scripts/mac-api.js (from FoodLog/mobile directory)

const http = require('http')
const { spawn } = require('child_process')
const path = require('path')

const PORT = 5191
const PROJECT_ROOT = path.resolve(__dirname, '..')

const ALLOWED_ORIGINS = [
  'http://localhost:5181',
  'http://localhost:8888',
  'http://localhost:3000',
]

function setCorsHeaders(req, res) {
  const origin = req.headers.origin
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// Detect connected iPhone UDID via xcrun xctrace
function getConnectedDeviceUDID() {
  return new Promise((resolve, reject) => {
    const proc = spawn('xcrun', ['xctrace', 'list', 'devices'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    proc.stdout.on('data', (d) => { output += d })
    proc.stderr.on('data', (d) => { output += d })

    proc.on('close', () => {
      const lines = output.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        // Skip section headers and simulators
        if (trimmed.startsWith('==')) continue
        if (trimmed.toLowerCase().includes('simulator')) continue
        // Match any iPhone or iPad line with a UDID
        if (!trimmed.toLowerCase().includes('iphone') && !trimmed.toLowerCase().includes('ipad')) continue

        // Format: "iPhone16ProMax (26.5) (00008140-001C5C100A13001C)"
        const match = trimmed.match(/\(([0-9A-F]{8}-[0-9A-F]{16})\)\s*$/i)
        if (match) {
          const name = trimmed.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
          resolve({ udid: match[1], name })
          return
        }
      }

      reject(new Error('No iPhone found. Make sure it is plugged in and unlocked.'))
    })

    proc.on('error', (err) => reject(new Error(`xcrun failed: ${err.message}`)))
  })
}

function handleHealth(req, res) {
  setCorsHeaders(req, res)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok' }))
}

async function handleFoodLogIosBuild(req, res) {
  setCorsHeaders(req, res)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const send = (type, data) => {
    try { res.write(`data: ${JSON.stringify({ type, data })}\n\n`) } catch {}
  }

  let udid
  try {
    send('log', '🔍 Detecting connected iPhone...\n')
    const device = await getConnectedDeviceUDID()
    udid = device.udid
    send('log', `📱 Found: ${device.name} (${udid})\n`)
    send('log', `📁 ${PROJECT_ROOT}\n\n`)
    send('log', '🚀 Bundling JS...\n\n')
  } catch (err) {
    send('error', `❌ ${err.message}`)
    res.end()
    return
  }

  // Step 1: bundle JS (required — Debug builds without this crash on launch)
  const bundle = spawn('npx', [
    'expo', 'export:embed',
    '--platform', 'ios',
    '--dev', 'false',
    '--bundle-output', 'ios/FoodLog/main.jsbundle',
    '--assets-dest', 'ios/FoodLog',
  ], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  bundle.stdout.on('data', (data) => send('log', data.toString()))
  bundle.stderr.on('data', (data) => send('log', data.toString()))

  bundle.on('close', (bundleCode) => {
    if (bundleCode !== 0) {
      send('error', `❌ JS bundle failed (exit code ${bundleCode})`)
      res.end()
      return
    }

    send('log', '\n🔨 Building and installing (Release)...\n\n')

    // Step 2: native build + install as Release
    const proc = spawn('npx', ['expo', 'run:ios', '--device', udid, '--configuration', 'Release'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    proc.stdout.on('data', (data) => send('log', data.toString()))
    proc.stderr.on('data', (data) => send('log', data.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        send('done', '✅ Build complete! Check your iPhone.')
      } else {
        send('error', `❌ Build failed (exit code ${code})`)
      }
      res.end()
    })

    proc.on('error', (err) => {
      send('error', `❌ Failed to start: ${err.message}`)
      res.end()
    })

    req.on('close', () => proc.kill())
  })

  bundle.on('error', (err) => {
    send('error', `❌ Failed to start bundler: ${err.message}`)
    res.end()
  })
}

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    proc.stdout.on('data', (d) => { output += d })
    proc.stderr.on('data', (d) => { output += d })
    proc.on('close', (code) => resolve({ code, output: output.trim() }))
    proc.on('error', (err) => resolve({ code: -1, output: err.message }))
  })
}

async function handleFixWebcam(req, res) {
  setCorsHeaders(req, res)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const send = (type, data) => {
    try { res.write(`data: ${JSON.stringify({ type, data })}\n\n`) } catch {}
  }

  send('log', '🔧 Restarting camera and audio services...\n\n')

  const targets = ['VDCAssistant', 'AppleCameraAssistant', 'coreaudiod']
  for (const target of targets) {
    const { code, output } = await runCommand('killall', [target])
    if (code === 0) {
      send('log', `✓ ${target}: stopped and will restart automatically\n`)
    } else if (output.includes('No matching processes')) {
      send('log', `- ${target}: not running\n`)
    } else if (output.includes('Operation not permitted')) {
      send('log', `⚠ ${target}: permission denied — try running the command manually with sudo\n`)
    } else {
      send('log', `⚠ ${target}: ${output || 'unknown error'}\n`)
    }
  }

  send('log', '\n')
  send('done', '✅ Done. Reconnect your Logitech camera/mic.')
  res.end()
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res)
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/health' && req.method === 'GET') return handleHealth(req, res)
  if (req.url === '/scripts/foodlog-ios' && req.method === 'GET') return void handleFoodLogIosBuild(req, res)
  if (req.url === '/scripts/fix-webcam' && req.method === 'GET') return void handleFixWebcam(req, res)

  setCorsHeaders(req, res)
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🍎 Mac API server → http://localhost:${PORT}`)
})
