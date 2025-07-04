import { readFileSync, writeFileSync } from 'fs'

// Check if version is already set via environment variable (e.g., Docker build)
const envVersion = process.env.VITE_APP_VERSION
if (envVersion) {
  console.log(`Using version from environment: ${envVersion}`)
  process.exit(0)
}

// Read package.json version as fallback
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
const version = packageJson.version

// Update .env file with current version (for local development)
const envPath = './.env'
let envContent = ''

try {
  envContent = readFileSync(envPath, 'utf8')
} catch (error) {
  // .env file doesn't exist, create it
  envContent = ''
}

// Update or add VITE_APP_VERSION
const versionRegex = /^VITE_APP_VERSION=.*/m
const newVersionLine = `VITE_APP_VERSION=${version}`

if (versionRegex.test(envContent)) {
  envContent = envContent.replace(versionRegex, newVersionLine)
} else {
  envContent = envContent.trim() + '\n' + newVersionLine + '\n'
}

writeFileSync(envPath, envContent)
console.log(`Updated VITE_APP_VERSION to ${version} in .env file (local development)`)