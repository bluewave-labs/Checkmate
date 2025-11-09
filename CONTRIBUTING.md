# Contributing to Checkmate

Thanks for your interest in contributing! Checkmate is an open-source, friendly project focused on learning and growth.

We truly appreciate all kinds of contributions — code, ideas, translations or documentation. Contributing helps you level up while making the project better for everyone.

Before you start, please take a moment to read the relevant section. It helps us review and accept contributions faster, and makes the whole process smoother for everyone. 💚

PS: **We work closely with contributors on our [Discord channel](https://discord.com/invite/NAb6H3UTjK)**. You'll find community members, core maintainers, and first-timers helping each other out.

---

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

Navigate to the Docker dev directory:

```bash
cd docker/dev
```

Build the Docker images:

```bash
./build_images.sh
```

Run MongoDB container:

```bash
docker docker run -d -p 27017:27017 -v uptime_mongo_data:/data/db --name uptime_database_mongo mongo:6.0
```

Navigate back to the root directory:

```bash
cd ../..
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
- `ORIGIN`: Origin for CORS purposes
- `TOKEN_TTL`: Token time to live (in vercel/ms format)
- `LOG_LEVEL`: Debug level (debug, info, warn, error)

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

if there are errors then delete the node_module file and the package-lock.json   

```bash
rm -rf node_module package-lock.json
```

then re install 

```bash
npm install
```

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

- Check if another service is using ports 5173, 52345, 27017, or 6379
- Stop the conflicting service or change the port in `.env` files

**MongoDB connection issues:**

- Verify container is running: `docker ps`
- Check container logs: `docker logs uptime_database_mongo` 

**Module not found errors:**

- Ensure you ran `npm install` in both `client` and `server` directories

**Need more help?**

- Check the [full documentation](https://docs.checkmate.so)
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

Docs live in [checkmate-documentation](https://github.com/bluewave-labs/checkmate-documentation). You can fix typos, add guides, or explain features better.

### Help with translations?

We use [PoEditor](https://poeditor.com) for translations. You can:

- [Sign up and join your language team](https://poeditor.com/join/project/lRUoGZFCsJ).
- Translate UI strings.
- Ask questions on Discord in the relevant #translations channel.

Make sure all new UI strings in code use `t('key')`.

### Submit a pull request?

Follow the [pull request checklist](#pull-request-checklist). Your PR should:

- Be focused on one issue.
- Be tested locally.
- Use our linting and translation rules.
- Include the related issue (e.g. `Fixes #123`).
- Be opened against the `develop` branch.

---

## Code guidelines

- Use ESLint and Prettier (`npm run lint`).
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
- Your code passes linting and has no TypeScript errors.

If one or more of these are missing, we may ask you to update your pull request before we can merge it.

---

## Branching model

- Code contributions should go to the `develop` branch.
- `master` is used for stable releases.
- Use descriptive branch names, like `fix/login-error` or `feat/add-alerts`.
- Make sure that you are using the latest version.
- Make sure you run the code locally. The Checkmate [documentation](https://docs.checkmate.so) covers it.
- Find out if the functionality is already covered, maybe by an individual configuration.
- Perform a [search](/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to convince the project's developers of the merits of this feature. Keep in mind that we want features that will be useful to the majority of our users and not just a small subset. If you're just targeting a minority of users, consider writing an add-on/plugin library.

---

## Thank you

Thanks for making Checkmate better. We mean it. Whether it's your first pull request or your 50th, we're excited to build with you.

PS: feel free to introduce yourself on [Discord](https://discord.gg/NAb6H3UTjK) and say hi.

-- Checkmate team

Also make sure you read the [document about how to make a good pull request](/PULLREQUESTS.md).
