# Project Context

Read README.md for full project context before making changes.

## Overview
AI food logging app that analyzes meal photos/descriptions and supports logging workflows through a Flask backend and Lose It! automation integration.

## Stack
React 19, TypeScript, Vite 7, Tailwind CSS, Firebase Auth, OpenAI GPT-4o-mini, Windows Flask API, Netlify.

## Key Files
- src/ (main app, auth, logging flows)
- flask/ (backend automation/API)
- package.json

## Dev Commands
- Start: npm run dev
- Build: npm run build
- Deploy: npm run deploy:watch

## Local Ports
- App dev: `http://localhost:5177`
- Netlify local shell: not reserved for this repo right now

## Rules
- Do not introduce new frameworks
- Follow existing structure and naming
- Keep solutions simple and fast

## Security
- Never expose paid API keys in browser bundles, `VITE_*` vars, or client-side fetch calls
- Put LLM and other paid provider keys behind server-side functions or a backend proxy only
- Do not enable auto-reload, polling, automatic retries, or repeated background inference against paid APIs unless the user explicitly asks for it

## Notes
- Public demo mode is supported; auth is required for logging actions.
- Keep title-case formatting and food-name validation behavior intact.
