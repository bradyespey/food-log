#!/bin/bash

# Pre-commit hook to prevent API keys and sensitive data from being committed

echo "🔍 Scanning for sensitive data..."

# Check for OpenAI API keys
if git diff --cached | grep -q "sk-proj-[a-zA-Z0-9]\{20,\}"; then
    echo "❌ ERROR: OpenAI API key detected in staged changes!"
    echo "   Remove the API key before committing."
    exit 1
fi

# Check for other API keys (but not our hook script)
if git diff --cached | grep -q "sk-[a-zA-Z0-9]\{20,\}" | grep -v "pre-commit-hook.sh"; then
    echo "❌ ERROR: API key detected in staged changes!"
    echo "   Remove the API key before committing."
    exit 1
fi

# Check for .env files
if git diff --cached --name-only | grep -q "\.env"; then
    echo "❌ ERROR: .env file detected in staged changes!"
    echo "   Environment files should not be committed."
    exit 1
fi

# Check for common credential patterns
if git diff --cached | grep -E "(password|secret|token|key)" | grep -v "your_" | grep -v "example_" | grep -v "placeholder"; then
    echo "⚠️  WARNING: Potential credentials detected in staged changes!"
    echo "   Please review before committing."
    # Don't block commit, just warn
fi

echo "✅ No sensitive data detected. Proceeding with commit."
exit 0
