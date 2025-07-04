# AI Code Reviewer with Claude Code

This repository includes an AI-powered code reviewer using **Claude Code CLI** that automatically reviews Pull Requests when requested.

## 🚀 How to Use

1. **Create a Pull Request** as usual
2. **Comment on the PR:** `@agent please review this PR`
3. **Wait ~1-2 minutes** for the Claude Code review to appear as a comment

## 🎯 Review Commands

| Command | Description |
|---------|-------------|
| `@agent please review this PR` | Full comprehensive review using Claude Code |

## 🔍 What Gets Reviewed

Claude Code analyzes your code with deep context understanding for:

- **🔒 Security**: API vulnerabilities, input validation, XSS, SQL injection
- **⚡ Performance**: Bundle size optimization, React rendering, database queries
- **🏗️ Code Quality**: TypeScript best practices, maintainability, readability
- **🛡️ Type Safety**: Proper typing, null/undefined checks, any types
- **🧪 Testing**: Missing coverage, edge cases, test quality
- **📝 Documentation**: JSDoc comments, README updates
- **🎯 Next.js/React**: SSR/SSG patterns, React best practices, accessibility
- **🎨 Puppeteer Integration**: Image generation code review (project-specific)

## ⚙️ Claude Code Advantages

- **🧠 Deep Context**: Understands your entire codebase structure
- **🔍 Intelligent Analysis**: More nuanced understanding than basic API calls
- **📋 Comprehensive Reviews**: Leverages Claude's full coding capabilities
- **🎯 Project-Aware**: Knows about your Next.js/TypeScript/Puppeteer stack

## 🔑 Setup Requirements

The repository maintainer needs to add the `ANTHROPIC_API_KEY` secret:
1. Go to Repository Settings → Secrets and variables → Actions
2. Add `ANTHROPIC_API_KEY` with your Claude API key (same one used for Claude Code CLI)

## 📝 Notes

- Reviews are generated by [Claude Code](https://claude.ai/code) - Anthropic's official CLI
- Focuses specifically on TypeScript/Next.js/React best practices
- Reviews typically take 1-2 minutes for comprehensive analysis
- Understands your project context and recent changes

## 🛠️ Troubleshooting

If the reviewer doesn't respond:
1. Check that your comment includes the exact phrase: `@agent please review this PR`
2. Ensure the PR has actual code changes (not just documentation)
3. Verify the `ANTHROPIC_API_KEY` secret is set correctly
4. Check the Actions tab for workflow execution logs
5. Large PRs may take longer to analyze