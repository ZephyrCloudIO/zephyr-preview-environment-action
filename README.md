# Zephyr Preview Environments

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Zephyr%20Preview%20Environments-blue.svg)](https://github.com/marketplace/actions/zephyr-preview-environments)
[![CI](https://github.com/ZephyrCloudIO/zephyr-preview-environment-action/actions/workflows/on_pull_request.yml/badge.svg)](https://github.com/ZephyrCloudIO/zephyr-preview-environment-action/actions)

Automatically create and manage preview environments for your pull requests using [Zephyr Cloud](https://zephyr-cloud.io/). Get instant preview deployments with every PR to streamline your code review process.

## ✨ What it does

- 🚀 **Creates preview environments** when PRs are opened
- 🔄 **Updates environments** when PRs are updated
- 🧹 **Cleans up resources** when PRs are closed
- 💬 **Keeps the latest deployment at the bottom** and removes old preview comments

## 🚀 Quick Start

### 1. Prerequisites

- A [Zephyr Cloud](https://zephyr-cloud.io/) account with your application deployed
- Zephyr authentication token (see [Authentication](#-authentication) below)
- GitHub repository with pull request access

### 2. Add to your workflow

Create `.github/workflows/preview-environments.yml`:

```yaml
name: Zephyr Preview Environments

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
      - name: Build Your Application
        env:
          ZE_CI_TOKEN: ${{ secrets.ZE_CI_TOKEN }}
        run: |
          # Add your build commands
          npm ci && npm run build

      - name: Zephyr Preview Environments
        uses: ZephyrCloudIO/zephyr-preview-environment-action@v0.2.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. That's it! 🎉

Your pull requests will now automatically get preview environments with URLs posted as comments.

## 🔐 Authentication

The build step authenticates to Zephyr with an organization CI token. The preview action then reads that build's deployment results and uses `github_token` only to manage pull request comments.

**Setup:**

1. Generate a token from **Organization Settings → CI Tokens** in [Zephyr Cloud](https://zephyr-cloud.io/)
2. Add it to your repository secrets as `ZE_CI_TOKEN`
3. Use it in your workflow:

   ```yaml
   env:
     ZE_CI_TOKEN: ${{ secrets.ZE_CI_TOKEN }}
   ```

GitHub Actions automatically provides the build actor metadata used during CI token exchange. Existing server-token pipelines should follow the [CI token migration guide](https://docs.zephyr-cloud.io/migrations/ci-token-migration).

### Comment author branding

GitHub controls a comment's author name and avatar from the token used to create it. The default `${{ secrets.GITHUB_TOKEN }}` always posts as `github-actions[bot]`; its avatar cannot be customized.

To post as a Zephyr-branded bot:

1. Create a GitHub App with the Zephyr name and logo.
2. Give it **Pull requests: Read and write** repository permission and install it on the target repositories.
3. Store its client ID as `ZEPHYR_APP_CLIENT_ID` and private key as `ZEPHYR_APP_PRIVATE_KEY`.
4. Generate an installation token and pass it to this action:

   ```yaml
   - name: Create Zephyr GitHub App token
     id: zephyr-app-token
     uses: actions/create-github-app-token@v3
     with:
       client-id: ${{ vars.ZEPHYR_APP_CLIENT_ID }}
       private-key: ${{ secrets.ZEPHYR_APP_PRIVATE_KEY }}

   - name: Zephyr Preview Environments
     uses: ZephyrCloudIO/zephyr-preview-environment-action@v0.2.0
     with:
       github_token: ${{ steps.zephyr-app-token.outputs.token }}
   ```

Comments will then use the GitHub App's `<app-slug>[bot]` identity and profile image.

## 📋 Configuration

### Inputs

| Input          | Description                 | Required |
| -------------- | --------------------------- | -------- |
| `github_token` | GitHub token for API access | ✅ Yes   |

### Outputs

| Output                      | Description                            |
| --------------------------- | -------------------------------------- |
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
