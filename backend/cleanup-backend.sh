#!/bin/bash
# MyRoom Backend Cleanup Script

echo "🧹 Starting backend cleanup..."

# Remove test and check files
rm -f check-permissions.js
rm -f check-resources.js
rm -f check-api-key.js
rm -f migrate-add-resource-permissions.js
rm -f upload-test-resources.js
rm -f run-test-flow.cjs
rm -f test-imports.cjs
rm -f test-full-asset-flow.cjs

# Remove any other test/check files
rm -f *test*.js *test*.cjs *test*.mjs
rm -f *check*.js *check*.cjs *check*.mjs
rm -f *migrate*.js *migrate*.cjs *migrate*.mjs
rm -f *upload*.js *upload*.cjs *upload*.mjs

# Remove backup files
rm -f *.backup *.bak *.orig *.tmp *.temp
rm -f *\ -\ Copy.*

# Remove test directories
rm -rf temp tmp test-output test-results
rm -rf tests/__temp__ tests/fixtures/temp

# Clean build artifacts
rm -rf node_modules dist
rm -rf .jest-cache coverage

# Remove log files
rm -rf logs/*.log

echo "✨ Backend cleanup completed!"
