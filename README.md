# Zephyr Preview Environments Action

A GitHub Action that automatically creates preview environments for your pull requests using [Zephyr](https://zephyr-cloud.io/). This action integrates seamlessly with your GitHub workflow to provide instant preview environments for code reviews and testing.

## 🚀 Features

- **Automatic Preview Creation**: Creates preview environments when pull requests are opened
- **Real-time Updates**: Updates preview environments when pull requests are synchronized
- **Cleanup on Close**: Automatically handles cleanup when pull requests are closed
- **GitHub Integration**: Posts preview URLs as comments and creates deployment status
- **PR-only Operation**: Only runs on pull request events for security and efficiency

## 🛬 Future Features

We're actively working on these exciting features to enhance your preview environment experience:

### 🎯 Planned Enhancements

- **💣 Ephemeral preview environments**: Create and destroy Zephyr preview environments using the Zephyr API
- **🔐 Short-lived tokens**: Create short-lived tokens using GitHub OIDC
- **💬 Customizable comments**: Customize the comment that is posted to the pull request
- **🔄 Retry pattern**: Implement robust retry mechanisms for failed operations (e.g. when the preview environments are not created)
- **📝 Better Error Messages**: More descriptive error messages and troubleshooting guides

<!-- ### 🛠️ Developer Experience

- **🔍 Debug Mode**: Enhanced debugging capabilities with detailed logs
- **📋 Configuration Validation**: Validate configuration before deployment
- **🎯 Conditional Deployments**: Deploy only when specific conditions are met
- **📱 Mobile Preview**: Optimized mobile preview experience -->

<!-- ### 🔌 Integration Improvements

- **🔗 Webhook Support**: Real-time notifications via webhooks
- **📧 Email Notifications**: Email alerts for deployment status changes
- **💬 Slack Integration**: Direct integration with Slack for team notifications
- **📈 Metrics Export**: Export deployment metrics to external tools
- **🔐 SSO Integration**: Single Sign-On support for enterprise users -->

---

_Have a feature request? We'd love to hear from you! Please [open an issue](https://github.com/your-username/zephyr-preview-environment-action/issues) or [submit a pull request](https://github.com/your-username/zephyr-preview-environment-action/pulls)._

## 📋 Prerequisites

Before using this action, you need:

<!-- 1. **Zephyr Account**: A Zephyr account with your application configured -->

1. **Zephyr Token**: A Zephyr token defined in the `ZE_SECRET_TOKEN` in your repository secrets and added to your workflow as an environment variable in the build step
2. **GitHub Token**: A GitHub token with appropriate permissions

## 🔧 Setup

### 1. Add the Action to Your Workflow

Create or update your `.github/workflows/on_pull_request.yml` file:

```yaml
name: Preview Environments

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  create-preview-environments:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.12.2
          run_install: false

      - name: Use Node.js ${{ env.NODE_VERSION }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm i

      - name: Build project
        env:
          ZE_SECRET_TOKEN: ${{ secrets.ZE_SECRET_TOKEN }}
        run: pnpm run build

      - name: Deploy preview environments
        uses: ZephyrCloudIO/zephyr-preview-environment-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
        id: preview_environments_action

      - name: Preview deployment URL
        if: steps.preview_environments_action.outputs.preview_environments_urls
        run: echo "Preview available at ${{ steps.preview_environments_action.outputs.preview_environments_urls }}"
```

### 2. Configure Permissions

Make sure your workflow has the necessary permissions. Add this to your workflow file:

```yaml
permissions:
  contents: read
  pull-requests: write
  deployments: write
```

## 📥 Inputs

| Input              | Description                                                    | Required | Default |
| ------------------ | -------------------------------------------------------------- | -------- | ------- |
| `github_token`     | GitHub token for API access                                    | ✅ Yes   | -       |
| `application_uuid` | The UUID of the application to use for the preview environment | ✅ Yes   | -       |

## 📤 Outputs

| Output                      | Description                                  |
| --------------------------- | -------------------------------------------- |
| `preview_environments_urls` | The URLs of the created preview environments |

## 🔄 How It Works

The action automatically handles different pull request events:

### When a PR is Opened

1. Creates new preview environments in Zephyr
2. Creates a GitHub deployment status
3. Posts a comment with the preview URLs
4. Outputs the preview URLs for use in other steps

### When a PR is Updated (synchronize/reopened)

1. Updates the existing preview environments
2. Updates the GitHub deployment status
3. Updates the comment with the new preview URLs
4. Outputs the preview URLs

### When a PR is Closed

1. Handles cleanup of the preview environments
2. Updates the deployment status to indicate closure
3. Updates the comment to reflect the closed state

## 🔒 Security Considerations

- **Token Permissions**: Use the minimum required permissions for your GitHub token
- **PR-only**: This action only runs on pull request events for security
- **Environment Variables**: Store sensitive information in GitHub Secrets

## 📚 Examples

Check out the [zephyr-examples](https://github.com/ZephyrCloudIO/zephyr-examples) repository for complete examples.

## 🛠️ Troubleshooting

### Common Issues

1. **Action not running**: Ensure the workflow is triggered on pull request events
2. **Permission errors**: Check that your GitHub token has the required permissions
3. **Zephyr errors**: Verify your Zephyr application ID and account configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Zephyr Documentation](https://docs.zephyr-cloud.io/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [GitHub Marketplace](https://github.com/marketplace)

---
