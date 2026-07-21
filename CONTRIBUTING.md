# Contributing to Checkmate

Thanks for your interest in contributing! Checkmate is an open-source, friendly project focused on learning and growth.

We truly appreciate all kinds of contributions — code, ideas, translations or documentation. Contributing helps you level up while making the project better for everyone.

Before you start, please take a moment to read the relevant section. It helps us review and accept contributions faster, and makes the whole process smoother for everyone. 💚

PS: **We work closely with contributors on our [Discord channel](https://discord.com/invite/NAb6H3UTjK)**. You'll find community members, core maintainers, and first-timers helping each other out.

---


## 🚀 Quick Setup Checklist

Before you dive in, make sure you have these installed:

```bash
# Check Node.js (v20+ required)
node --version

# Check npm
npm --version

# Check Docker
docker --version

# Check Git
git --version
```

**New to contributing?** Start here:
1. Pick a [`good-first-issue`](https://github.com/bluewave-labs/checkmate/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
2. Comment that you'd like to work on it
3. Follow the [setup guide](#set-up-checkmate-locally) below
4. Join our [Discord](https://discord.com/invite/NAb6H3UTjK) if you get stuck

## Table of contents

- [How do I...?](#how-do-i)
  - [Get help or ask a question?](#get-help-or-ask-a-question)
  - [Report a bug?](#report-a-bug)
  - [Suggest a new feature?](#suggest-a-new-feature)
  - [Set up Checkmate locally?](#set-up-checkmate-locally)
  - [Start contributing code?](#start-contributing-code)
  - [Improve the documentation?](#improve-the-documentation)
  - [Help with translations?](#help-with-translations)
  - [Submit a pull request?](#submit-a-pull-request)
- [Code guidelines](#code-guidelines)
- [Pull request checklist](#pull-request-checklist)
- [Branching model](#branching-model)
- [Thank you](#thank-you)

---

## How do I...

### Get help or ask a question?

Ask anything in our [Discord server](https://discord.com/invite/NAb6H3UTjK) — we're friendly and happy to help. [Our core contributors](https://github.com/bluewave-labs/checkmate?tab=readme-ov-file#-contributing) are active and ready to support you. You can also use [GitHub Discussions](https://github.com/bluewave-labs/Checkmate/discussions) section to ask your questions.

### Report a bug?

1. Search [existing issues](https://github.com/bluewave-labs/checkmate/issues).
2. If it's not listed, open a **new issue**.
3. Include as much detail as possible: what happened, what you expected, and steps to reproduce. Logs and screenshots help.

### Suggest a new feature?

1. Open a new issue with the **feature request** template.
2. Share your use case and why it would help.
3. You can discuss it in [Discord](https://discord.com/invite/NAb6H3UTjK) before you code.

### Set up Checkmate locally?

#### Prerequisites

- Node.js (with npm)
- Docker 
- Git

#### Step 1: Clone the Repository

```bash
git clone https://github.com/bluewave-labs/Checkmate.git
cd Checkmate
```

#### Step 2: Set Up Docker Containers (MongoDB)

Run MongoDB container:

```bash
docker run -d -p 27017:27017 -v uptime_mongo_data:/data/db --name uptime_database_mongo mongo:8.0
```

#### Step 3: Set Up the Backend (Server)

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `server` directory with the following minimum required configuration:

```env
CLIENT_HOST="http://localhost:5173"
JWT_SECRET="my_secret_key_change_this"
DB_CONNECTION_STRING="mongodb://localhost:27017/uptime_db"
TOKEN_TTL="99d"
ORIGIN="localhost"
LOG_LEVEL="debug"
```

**Environment Variables Explained:**

- `CLIENT_HOST`: Frontend URL (default: http://localhost:5173)
- `JWT_SECRET`: Secret key for JWT tokens (change to something secure)
- `DB_CONNECTION_STRING`: MongoDB connection URL
- `ORIGIN`: Origin for CORS purposes (optional)
- `TOKEN_TTL`: Token time to live in vercel/ms format (optional, default: `99d`)
- `LOG_LEVEL`: Debug level: debug, info, warn, error (optional, default: `debug`)
- `QUEUE_MODE`: Queue mode, `primary` or `worker` (optional, default: `primary`)

Only `CLIENT_HOST`, `JWT_SECRET`, and `DB_CONNECTION_STRING` are strictly required. Note that `CLIENT_HOST` must be a full URL.

Start the backend server:

```bash
npm run dev
```

The server will run at `http://localhost:52345`.

#### Step 4: Set Up the Frontend (Client)

Open a new terminal window and navigate to the client directory from the root:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_APP_API_BASE_URL="http://localhost:52345/api/v1"
VITE_APP_LOG_LEVEL="debug"
```

**Environment Variables Explained:**

- `VITE_APP_API_BASE_URL`: Backend API URL
- `VITE_APP_LOG_LEVEL`: Log level (none, error, warn, debug, info)

Start the frontend:

```bash
npm run dev
```

The client will run at `http://localhost:5173`.  

#### Step 5: Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:52345
- **API Documentation**: http://localhost:52345/api-docs

#### Managing Docker Containers

Stop containers:

```bash
docker stop uptime_database_mongo
```

Start containers:

```bash
docker start uptime_database_mongo
```

Remove containers (if needed):

```bash
docker rm uptime_database_mongo
```

#### Troubleshooting

**Port already in use:**

- Check if another service is using ports 5173, 52345, or 27017
- Stop the conflicting service or change the port in `.env` files

**MongoDB connection issues:**

- Verify container is running: `docker ps`
- Check container logs: `docker logs uptime_database_mongo` 

**Module not found errors:**

- Ensure you ran `npm install` in both `client` and `server` directories

**Need more help?**

- Check the [full documentation](https://checkmate.so/docs)
- Ask on [Discord](https://discord.com/invite/NAb6H3UTjK)

### Start contributing code?

1. Pick or open an issue (check `good-first-issue`s first)
2. (optional but highly suggested) Read a detailed structure of [Checkmate](https://deepwiki.com/bluewave-labs/Checkmate) if you would like to deep dive into the architecture.
3. Ask to be assigned. If there is already someone assigned and it's been more than 7 days, you can raise the flag and ask to be assigned as well.
4. Create a branch from `develop`.
5. Write your code.
6. Run and test locally.
7. Open a PR to `develop`.

Start with [good first issues](https://github.com/bluewave-labs/checkmate/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

### Improve the documentation?

Documentation contributions are very welcome — fixing a typo, clarifying a step, or adding a missing example is a valuable PR.

- Small edits (typos, wording, formatting): open a PR directly against `develop`.
- Larger changes (restructuring a section, adding a new guide): open an issue first so we can align on scope, then a PR.
- Screenshots are helpful when documenting UI behaviour.
- README translations live in `docs/translations/`. If you're adding a new language, please also add a flag + link to the language bar in the root `README.md` and every existing translated README so they stay in sync.

### Help with translations?

The application uses `i18next` with one JSON file per language under `client/src/locales/` (`en.json` is the source of truth). English source strings are the definitive copy; other languages are generated as one-time machine translations that anyone is welcome to refine.

**To improve an existing language:**

1. Edit the relevant `client/src/locales/<code>.json` file directly.
2. Keep the JSON key structure identical to `en.json` — only translate the string values.
3. Open a PR against `develop`. No language-selector code changes are needed.

**To add a new language:**

1. Add `client/src/locales/<code>.json` with the same key structure as `en.json`, translated. If you can't translate every key, leave unfamiliar strings in English rather than removing keys — i18next falls back to the key path when a value is missing.
2. Add the display name to `languageNames` in `client/src/Components/inputs/LanguageSelector.tsx` (e.g. `it: "Italiano"`). The selector picks up any language present in `resources` automatically.
3. Open a PR against `develop`.

If translating a whole file is more than you want to take on, open an issue asking us to add the language and we'll generate an initial machine-translated file that you (or others) can refine over time.

**Note:** an older workflow that synced translations with PoEditor is still in the repo but no longer authoritative. Please treat the `.json` files in `client/src/locales/` as the source of truth.

### Submit a pull request?

Follow the [pull request checklist](#pull-request-checklist). Your PR should:

- Be focused on one issue.
- Be tested locally.
- Use our linting and translation rules.
- Include the related issue (e.g. `Fixes #123`).
- Be opened against the `develop` branch.

---

## Code guidelines

- Use ESLint and Prettier. Run `npm run lint` and `npm run format-check` in both `client` and `server`. If `format-check` reports issues, fix them with `npm run format` before committing.
- Follow naming conventions: `camelCase` for variables, `PascalCase` for components, `UPPER_CASE` for constants.
- No hard-coded strings — use `t('your.key')` for everything visible.
- Use the shared theme and components. No magic numbers or hardcoded styles.
- Follow structure and patterns already used in the codebase.

---

## Pull request checklist

Before submitting your pull request, please confirm the following:

- **You have tested the app locally and confirmed your changes work.**
- You reviewed your code and removed debug logs or leftover code.
- The GitHub issue is assigned to you.
- You included the related issue number in the PR description (e.g. `Fixes #123`).
- All user-facing text uses the translation function `t('key')`; no hardcoded strings.
- You avoided hardcoded URLs, config values, or sensitive data.
- You used the shared theme for any styling — no magic numbers or inline styles.
- The pull request addresses only one issue or topic.
- You added screenshots or a video for any UI-related changes.
- Your code passes `npm run lint`, `npm run format-check`, and `npm run build` in both `client` and `server` with no errors.

If one or more of these are missing, we may ask you to update your pull request before we can merge it.

---

## Branching model

- Code contributions should go to the `develop` branch.
- `master` is used for stable releases.
- Use descriptive branch names, like `fix/login-error` or `feat/add-alerts`.
- Make sure that you are using the latest version.
- Make sure you run the code locally. The Checkmate [documentation](https://checkmate.so/docs) covers it.
- Find out if the functionality is already covered, maybe by an individual configuration.
- Perform a [search](/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to convince the project's developers of the merits of this feature. Keep in mind that we want features that will be useful to the majority of our users and not just a small subset. If you're just targeting a minority of users, consider writing an add-on/plugin library.

---

## Thank you

Thanks for making Checkmate better. We mean it. Whether it's your first pull request or your 50th, we're excited to build with you.

PS: feel free to introduce yourself on [Discord](https://discord.gg/NAb6H3UTjK) and say hi.

-- Checkmate team

Also make sure you read the [document about how to make a good pull request](/PULLREQUESTS.md).
