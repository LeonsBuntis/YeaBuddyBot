# GitHub Copilot Instructions for YeaBuddyBot (Updated)

This repository is a TypeScript-based Telegram bot for fitness and workout tracking, with a separate Vite/React mini-app in `mini-app/`. The main bot uses Telegraf, Express, and Mistral AI. The project is strict on type safety, modern Node.js, and clean separation of concerns.

## Code Standards

### Required Before Each Commit

- Run `npm run build` (main app) and ensure TypeScript compiles with strict mode.
- Run `npm run build` in `mini-app/` and ensure it builds successfully.
- Test bot functionality with `npm run dev` (main app).
- Run `npm run lint` and `npm run format:check` to enforce code style.

### Development Flow

- **Main app build:** `npm run build` (compiles TypeScript, copies mini-app build output to `dist/`)
- **Mini-app build:** `cd mini-app && npm run build`
- **Development:** `npm run dev` (hot reload for main app)
- **Production:** `npm start` (runs compiled JS from `dist/`)
- **Type checking:** `npm run type-check`
- **Linting/formatting:** `npm run lint`, `npm run format:check`

## Repository Structure

- `src/`: Main TypeScript source code for the bot
  - `index.ts`: Entry point
  - `config.ts`: Configuration and environment variables
  - `bot/`: Core bot logic and handlers
    - `YeaBuddyBot.ts`: Main bot class
    - `scenes/`: Telegraf scenes for user flows
    - `training/`: Training session logic
  - `infrastructure/`: Data access and repository logic
  - `mini-app/`: (copied build output for deployment)
- `mini-app/`: Vite/React mini-app (standalone, with its own `package.json`)
- `dist/`: Compiled output for main app (and mini-app build artifacts)
- `.github/`: GitHub Actions workflows
- `package.json`: Main app scripts and dependencies
- `tsconfig.json`: TypeScript config (strict mode enabled)

## Key Technologies

- **TypeScript** (strict mode, ES2022+)
- **Telegraf** (Telegram bot)
- **Express** (webhook/health)
- **Mistral AI** (NLP)
- **Vite/React** (mini-app)
- **Node.js** (ES modules, Node 22+)

## Key Guidelines

1. **TypeScript Best Practices**
   - No `any` types; use interfaces/types for all data structures.
   - Strict null checks and type safety.
   - Use modern ES features and import/export syntax.

2. **Bot & Mini-App Development**
   - Keep bot logic in `src/`, mini-app logic in `mini-app/`.
   - Use Telegraf scenes for multi-step flows.
   - Maintain session and error boundaries.
   - Use environment variables for secrets (never commit them).
   - Mini-app should be built and its output copied to `dist/mini-app` for deployment.

3. **Code Organization**
   - Separate business logic from bot handlers.
   - Use interfaces for context and data.
   - Document complex flows and public APIs with JSDoc.

4. **AI Integration**
   - Use Mistral AI for NLU.
   - Handle AI errors gracefully and provide fallback responses.

5. **Testing & Validation**
   - Manually test bot and mini-app before commit.
   - Ensure both main app and mini-app build without errors.
   - Lint and format code before pushing.

6. **Deployment**
   - Azure pipeline builds both main app and mini-app.
   - Only deploys after both build successfully.
   - Mini-app build output is included in main app’s `dist/` for deployment.

7. **Fitness/Workout Domain**
   - Prioritize user-friendly, motivating, and accurate fitness tracking.
   - Support various fitness levels and preferences.

## Common Patterns

- Use `async/await` for async code.
- Use interfaces for all data structures.
- Consistent code formatting and naming.
- Scene-based architecture for complex bot flows.
