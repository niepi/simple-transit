#!/bin/sh

# Docker entrypoint script that injects runtime environment variables
# and then starts nginx

set -e

echo "🚀 Starting Berlin Transit Map container..."

# Inject runtime environment variables
/usr/local/bin/inject-runtime-env.sh

# Start nginx
echo "🌐 Starting nginx server..."
exec nginx -g "daemon off;"