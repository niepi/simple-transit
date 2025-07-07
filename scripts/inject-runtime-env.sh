#!/bin/sh

# Runtime environment variable injection script for containerized deployments
# This script replaces placeholders in built files with actual environment variables

set -e

echo "🔄 Injecting runtime environment variables..."

# Define the web root directory
WEB_ROOT="/usr/share/nginx/html"

# List of environment variables to inject
ENV_VARS="VITE_APP_VERSION VITE_APP_NAME VITE_APP_DESCRIPTION"

# Create a temporary file for environment variables in JSON format
ENV_JSON_FILE="$WEB_ROOT/runtime-env.json"

echo "📝 Creating runtime environment configuration..."

# Start JSON object
echo "{" > "$ENV_JSON_FILE"

# Add each environment variable to JSON
first=true
for var in $ENV_VARS; do
    value=$(eval echo \$$var)
    if [ -n "$value" ]; then
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$ENV_JSON_FILE"
        fi
        echo "  \"$var\": \"$value\"" >> "$ENV_JSON_FILE"
        echo "✅ $var = $value"
    fi
done

# Close JSON object
echo "}" >> "$ENV_JSON_FILE"

echo "🔧 Environment configuration created at $ENV_JSON_FILE"

# Make the file readable by nginx
chmod 644 "$ENV_JSON_FILE"

echo "✅ Runtime environment injection completed"