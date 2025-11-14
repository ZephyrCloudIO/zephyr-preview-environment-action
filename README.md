# Zephyr Preview Environments

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Zephyr%20Preview%20Environments-blue.svg)](https://github.com/marketplace/actions/zephyr-preview-environments)
[![CI](https://github.com/ZephyrCloudIO/zephyr-preview-environment-action/workflows/CI/badge.svg)](https://github.com/ZephyrCloudIO/zephyr-preview-environment-action/actions)

Automatically create and manage preview environments for your pull requests using [Zephyr Cloud](https://zephyr-cloud.io/). Get instant preview deployments with every PR to streamline your code review process.

## ✨ What it does

- 🚀 **Creates preview environments** when PRs are opened
- 🔄 **Updates environments** when PRs are updated
- 🧹 **Cleans up resources** when PRs are closed
- 💬 **Posts preview URLs** as PR comments

## 🚀 Quick Start

### 1. Prerequisites

- A [Zephyr Cloud](https://zephyr-cloud.io/) account with your application deployed
- Zephyr authentication token (see [Authentication](#-authentication) below)
- GitHub repository with pull request access

### 2. Add to your workflow

Create `.github/workflows/preview-environments.yml`:

```yaml
name: Preview Environments

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

permissions:
  contents: read
  pull-requests: write

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Your build steps here
      - name: Build your application
        env:
          # Option 1: Personal Token
          ZE_SECRET_TOKEN: ${{ secrets.ZE_SECRET_TOKEN }}

          # Option 2: Server Token (organization-level, recommended)
          # ZE_SERVER_TOKEN: ${{ secrets.ZE_SERVER_TOKEN }}
          # ZE_USER_EMAIL is automatically pulled from GitHub commit author
        run: |
          # Add your build commands
          npm ci && npm run build
      
      - name: Create preview environment
        uses: ZephyrCloudIO/zephyr-preview-environment-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. That's it! 🎉

Your pull requests will now automatically get preview environments with URLs posted as comments.

## 🔐 Authentication

Zephyr supports two authentication approaches for CI/CD. Choose the one that best fits your needs:

### Option 1: Personal Token (User-Level)

Authenticates as an individual user. Best for personal projects or when you need user-specific permissions.

**Setup:**
1. Generate your token from **Profile Settings** in [Zephyr Cloud](https://zephyr-cloud.io/)
2. Add `ZE_SECRET_TOKEN` to your repository secrets
3. Use it in your workflow:
   ```yaml
   env:
     ZE_SECRET_TOKEN: ${{ secrets.ZE_SECRET_TOKEN }}
   ```

**When to use:**
- Individual developer authentication
- Personal projects
- User-specific permission requirements

📖 [Personal Token Documentation](https://docs.zephyr-cloud.io/features/ci-cd-personal-token)

### Option 2: Server Token (Organization-Level) ⭐ Recommended

Authenticates at the organization level without individual user credentials. Best for team projects and shared pipelines.

**Setup:**
1. Generate your token from **Organization Settings** in [Zephyr Cloud](https://zephyr-cloud.io/)
2. Add `ZE_SERVER_TOKEN` to your repository secrets
3. Use it in your workflow:
   ```yaml
   env:
     ZE_SERVER_TOKEN: ${{ secrets.ZE_SERVER_TOKEN }}
     # ZE_USER_EMAIL is automatically pulled from GitHub context
     # You can optionally override it:
     # ZE_USER_EMAIL: custom@example.com
   ```

**Note:** The `ZE_USER_EMAIL` is automatically extracted from the GitHub commit author email, so you typically don't need to set it manually.

**When to use:**
- Organization-level authentication
- Multiple team members sharing pipelines
- Centralized credential management
- GitHub Actions or GitLab CI/CD

**Security:** Do not share server tokens publicly and rotate them regularly.

📖 [Server Token Documentation](https://docs.zephyr-cloud.io/features/ci-cd-server-token)

## 📋 Configuration

### Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `github_token` | GitHub token for API access | ✅ Yes |

### Outputs

| Output | Description |
|--------|-------------|
| `preview_environments_urls` | JSON array of preview environment URLs |

## 🛠️ Troubleshooting

### Common Issues

**❌ Permission denied errors**
```
Missing required workflow permissions
```
→ Add the required permissions to your workflow (see Quick Start example)

**❌ No deployed apps found**
```
No deployed apps found. Make sure you have built it and deployed it to Zephyr Cloud
```
→ Ensure your application is built and deployed to Zephyr before running the action

**❌ Invalid GitHub token**
```
GitHub token lacks required scopes
```
→ Use `${{ secrets.GITHUB_TOKEN }}` or ensure your PAT has `repo` scope

### Getting Help

- 📖 [Zephyr Documentation](https://docs.zephyr-cloud.io/)
- 💬 [Open an issue](https://github.com/ZephyrCloudIO/zephyr-preview-environment-action/issues)
- 🌟 [Examples repository](https://github.com/ZephyrCloudIO/zephyr-examples)

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by [Zephyr Cloud](https://zephyr-cloud.io/)**
