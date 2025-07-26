#!/bin/sh
# MyRoom Backend Docker Entrypoint Script
# This script runs when the container starts

set -e

echo "🚀 Starting MyRoom Backend..."

# Check if database needs initialization
if [ "$INIT_DB" = "true" ]; then
  echo "🗄️ Initializing database..."
  /app/scripts/init-db.sh
fi

# Start the application
echo "🚀 Starting application..."
exec "$@"
