# 🚊 Simple Transit

A modern **Progressive Web Application** for Berlin public transit, showing nearby stations and real-time departures on an interactive map. Built for speed, reliability, and offline use.

![Version](https://img.shields.io/github/v/release/niepi/simple-transit-vue)
![License](https://img.shields.io/github/license/niepi/simple-transit-vue)
![CI](https://img.shields.io/github/actions/workflow/status/niepi/simple-transit-vue/ci.yml)
![Container](https://img.shields.io/badge/container-ghcr.io-blue)

## ✨ Features

- 🗺️ **Interactive Map** - Find transit stations with Leaflet-powered maps
- ⏱️ **Real-time Departures** - Live VBB API integration for accurate times  
- 📱 **Progressive Web App** - Install on mobile, works offline
- 🚀 **Fast & Modern** - Vue 3 + TypeScript + Vite for optimal performance
- 🎨 **Beautiful UI** - Tailwind CSS with responsive design
- 🔄 **Auto-updates** - Smart PWA caching with version management
- 🧪 **Well-tested** - Comprehensive test suite with Vitest

## 🏃‍♂️ Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app.

### Using Docker

```bash
# Run pre-built container
docker run -p 8080:80 ghcr.io/niepi/simple-transit-vue:latest

# Or build locally
docker build -t simple-transit .
docker run -p 8080:80 simple-transit
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## 🛠️ Development

### Prerequisites

- Node.js 20+ and npm
- Modern browser with ES modules support

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run test         # Run test suite
npm run coverage     # Generate test coverage
npm run type-check   # TypeScript type checking
```

### Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build**: Vite with modern optimizations
- **Styling**: Tailwind CSS + PostCSS
- **Maps**: Leaflet with custom markers
- **PWA**: Vite Plugin PWA + Workbox
- **Testing**: Vitest + Vue Test Utils
- **Icons**: Heroicons + Unplugin Icons
- **State**: Pinia for state management

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run tests in watch mode (development)
npm run test -- --watch
```

Tests cover components, composables, utilities, and PWA functionality.

## 🚀 Development & Deployment

### Pull Request Workflow

This project uses a **pull request-only workflow** with strict quality gates:

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and push
git push origin feature/my-feature

# 3. Create PR (triggers CI)
gh pr create --title "Add feature" --body "Description"

# 4. After PR approval and CI success → Merge to main
```

### Container Deployment

Container images are built **only for version tags on main branch**:

```bash
# After successful PR merge to main
git checkout main && git pull
git tag v1.2.0
git push origin v1.2.0  # Triggers container build
```

**Automated process:**
1. ✅ **Tag validation** - Ensures tag is on main branch
2. 🧪 **Build & Security scan** - Full build + Trivy scanning
3. 📦 **Container publish** - Push to GitHub Container Registry

**Quality Gates:**
- ❌ No direct pushes to main (branch protection)
- ❌ PR merge blocked if CI fails
- ❌ Container build blocked if tag not on main

### Container Images

Released containers are available at:
```bash
# Latest release
ghcr.io/niepi/simple-transit-vue:latest

# Specific version  
ghcr.io/niepi/simple-transit-vue:v1.2.0
```

### Manual Version Updates

```bash
# Update version and create tag
npm version patch  # 1.2.0 → 1.2.1
npm version minor  # 1.2.0 → 1.3.0  
npm version major  # 1.2.0 → 2.0.0

# Push changes and tags
git push origin main --follow-tags
```

## 📱 PWA Features

- **Smart Caching** - Version-based cache invalidation
- **Update Notifications** - User-controlled app updates
- **Offline Support** - App shell cached for offline use
- **Install Prompt** - Add to home screen on mobile
- **Icons & Manifest** - Complete PWA icon set (72px to 512px)

## 🔧 Configuration

### Environment Variables

Create `.env.local` for local development:

```bash
# API Configuration
VITE_VBB_API_BASE=https://v6.vbb.transport.rest
VITE_APP_VERSION=0.2.1

# Development
VITE_DEV_TOOLS=true
```

### PWA Configuration

PWA settings are in `vite.config.ts`:
- Cache strategies for images and app shell
- Service worker registration and updates
- Manifest configuration for mobile installation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

- All changes must go through pull requests
- PRs require passing CI (tests, linting, build) and code review
- No direct pushes to main branch (enforced by branch protection)
- Use conventional commit messages for automatic changelog generation
- TypeScript strict mode is enforced
- Test coverage should be maintained

See [`.github/WORKFLOW.md`](.github/WORKFLOW.md) for detailed workflow documentation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [VBB (Verkehrsverbund Berlin-Brandenburg)](https://www.vbb.de/) for transit data API
- [Leaflet](https://leafletjs.com/) for interactive maps
- [Vue.js](https://vuejs.org/) ecosystem for the amazing developer experience

---

Made with ❤️ using Vue 3 + TypeScript + Vite
