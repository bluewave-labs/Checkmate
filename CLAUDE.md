# Claude Code Guidelines for Checkmate

## PR Creation Checklist

### Before Creating Any PR:
1. **Format Check**: Run `npm run format-check`
   - If format check fails, run `npm run format` and commit the changes
2. **Linting**: Run `npm run lint` (if available)  
3. **Tests**: Run tests to ensure nothing is broken
4. **Code Review**: Perform comprehensive review covering security, performance, architecture, error handling, and best practices
5. **Git Workflow**: Always create feature branches, never commit directly to develop

### PR Content Rules:
- ❌ **NO** "🤖 Generated with [Claude Code]" footer in PR descriptions or commit messages
- ❌ **NO** "Test plan" sections in PR descriptions
- ❌ **NO** "Resolves user request" sections in PR descriptions
- ✅ Keep PR descriptions focused on technical summary and implementation details

## Port Configuration
- **Frontend**: http://localhost:5175/
- **Backend**: http://localhost:5002/

## Testing Infrastructure
- **Framework**: Mocha + Chai + Sinon + C8 coverage
- **Test Command**: `npm test`
- **Coverage**: Currently ~36% backend coverage, focus on missing areas
- **Note**: Some existing tests have broken import paths that prevent execution

## Common Commands
```bash
# Format code
npm run format

# Check formatting
npm run format-check

# Run tests
npm test

# Run linting
npm run lint

# Start development servers
cd server && PORT=5002 CLIENT_HOST=http://localhost:5175 npm run dev
cd client && VITE_APP_API_BASE_URL=http://localhost:5002/api/v1 VITE_APP_CLIENT_HOST=http://localhost:5175 npm run dev -- --port 5175
```