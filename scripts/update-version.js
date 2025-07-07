import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

// Get version from git tags
function getVersionFromGit() {
  try {
    // Get the latest git tag
    const version = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf8' }).trim()
    
    // Remove 'v' prefix if present (e.g., v1.2.3 -> 1.2.3)
    return version.startsWith('v') ? version.slice(1) : version
  } catch (error) {
    // If no tags exist or git command fails, use commit hash
    try {
      const shortHash = execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim()
      return `dev-${shortHash}`
    } catch (hashError) {
      // Fallback for non-git environments
      return 'dev-unknown'
    }
  }
}

const version = getVersionFromGit()

// Update .env file with current version
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
console.log(`Updated VITE_APP_VERSION to ${version} in .env file`)