#!/bin/bash

# Enhanced Pre-commit Hook for API Key Protection
# This hook prevents committing sensitive data like API keys

echo "🔍 Scanning for sensitive data..."

# Check for OpenAI API keys (sk-proj-*)
if git diff --cached | grep -q "sk-proj-[a-zA-Z0-9]\{20,\}"; then
    echo "❌ ERROR: OpenAI API key detected in staged changes!"
    echo "   Remove the API key before committing."
    exit 1
fi

# Check for other API keys (sk-*)
if git diff --cached | grep -q "sk-[a-zA-Z0-9]\{20,\}"; then
    echo "❌ ERROR: API key detected in staged changes!"
    echo "   Remove the API key before committing."
    exit 1
fi

# Check for .env files
if git diff --cached --name-only | grep -q "\.env"; then
    echo "❌ ERROR: .env file detected in staged changes!"
    echo "   Environment files should never be committed."
    exit 1
fi

# Check for common credential patterns
if git diff --cached | grep -E -i "(password|secret|token|key|credential)" | grep -v -E "(password.*=.*your|secret.*=.*your|token.*=.*your|key.*=.*your|credential.*=.*your)"; then
    echo "⚠️  WARNING: Potential credentials detected in staged changes!"
    echo "   Please review before committing."
    # Don't block, just warn
fi

echo "✅ No sensitive data detected. Proceeding with commit."
exit 0
