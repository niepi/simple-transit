# Development Workflow

This repository uses a **pull request-only workflow** with automated branch protection and container builds.

## 🔒 Branch Protection

### Main Branch Rules
- ❌ **No direct pushes to main** - All changes must go through pull requests
- ✅ **Required status checks** - CI tests must pass before merge
- ✅ **Required PR reviews** - At least 1 approving review needed
- ✅ **Up-to-date branches** - Branches must be current before merge
- ✅ **Conversation resolution** - All PR comments must be resolved

### Automatic Setup
Branch protection rules are automatically configured via the `branch-protection.yml` workflow.

## 🔄 Development Process

### 1. Feature Development
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/awesome-feature

# Make your changes
# ... code changes ...

# Commit and push to feature branch
git add .
git commit -m "feat: add awesome feature"
git push origin feature/awesome-feature
```

### 2. Pull Request
```bash
# Create PR via GitHub web interface or CLI
gh pr create --title "Add awesome feature" --body "Description of changes"
```

**PR Requirements:**
- ✅ All CI checks must pass (lint, test, type-check, build)
- ✅ At least 1 approving review
- ✅ All conversations resolved
- ✅ Branch up-to-date with main

### 3. Merge to Main
Once PR is approved and checks pass:
- Use **"Squash and merge"** or **"Merge commit"**
- Feature branch will be automatically deleted

## 🚀 Container Releases

### Tagging for Container Build
```bash
# After merging to main, create version tag
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0
```

**What happens automatically:**
1. ✅ **Tag validation** - Ensures tag is on main branch
2. 🧪 **Build & test** - Full application build
3. 🔍 **Security scan** - Trivy container scanning
4. 📦 **Container push** - Push to GitHub Container Registry

**Available at:**
- `registry.niepi.org/simple-transit:v1.2.0` (specific version)
- `registry.niepi.org/simple-transit:latest` (latest tag)

## 🧪 CI/CD Pipeline

### CI Workflow (`.github/workflows/ci.yml`)
**Triggers:** Push to feature branches, PRs to main
**Jobs:**
- Linting (`npm run lint`)
- Type checking (`npm run type-check`)
- Unit tests (`npm test`)
- Build verification (`npm run build`)

### Container Build (`.github/workflows/container-build.yml`)
**Triggers:** Version tags on main branch (`v*.*.*`)
**Jobs:**
- Tag validation (must be on main)
- Multi-stage Docker build
- Trivy security scanning
- Push to GHCR

### Branch Protection (`.github/workflows/branch-protection.yml`)
**Triggers:** Changes to the workflow file
**Jobs:**
- Automatically configure main branch protection rules
- Enforce PR-only workflow

## 🚨 Emergency Procedures

### Hotfix Process
```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# Make minimal fix
# ... fix code ...

# Create emergency PR
git push origin hotfix/critical-fix
gh pr create --title "🚨 Hotfix: Critical issue" --body "Emergency fix for production issue"
```

**Note:** Admins can bypass branch protection for emergency merges if needed.

### Rollback Process
```bash
# Revert to previous version
git checkout main
git tag v1.2.1-rollback v1.2.0  # Tag previous good version
git push origin v1.2.1-rollback  # Trigger new container build
```

## 📊 Workflow Benefits

- ✅ **Quality Gate** - No untested code reaches main
- ✅ **Code Review** - All changes reviewed before merge
- ✅ **Automated** - Container builds happen automatically
- ✅ **Safe** - Branch protection prevents accidents
- ✅ **Traceable** - Clear history via PRs and tags
- ✅ **Secure** - All containers scanned before publication

## 🛠️ Troubleshooting

### "CI checks failed"
- Check the Actions tab for specific failures
- Fix issues in your feature branch
- Push new commits to update the PR

### "Branch not up to date"
```bash
# Update your branch with latest main
git checkout feature/my-feature
git fetch origin
git rebase origin/main
git push --force-with-lease origin feature/my-feature
```

### "Container build failed"
- Verify tag was created on main branch
- Check container-build workflow logs
- Common issues: security scan failures, build errors

### "Can't push to main"
This is expected! Use the PR workflow:
```bash
# Instead of pushing to main
git push origin main  # ❌ This will fail

# Create a PR
git checkout -b fix/my-change
git push origin fix/my-change  # ✅ This works
gh pr create  # Then create PR
```