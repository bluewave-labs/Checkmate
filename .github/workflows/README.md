# POEditor Translation Synchronization

This GitHub Actions workflow automatically downloads translation files from POEditor and integrates them into the project.

## How It Works

The workflow can be triggered in two ways:

1. **Manual Trigger**: You can manually run the "POEditor Translation Synchronization" workflow from the "Actions" tab in the GitHub interface.
2. **Automatic Trigger**: The workflow runs automatically every day at midnight (UTC).

## Required Settings

For this workflow to function, you need to define the following secrets in your GitHub repository:

1. `POEDITOR_API_TOKEN`: Your POEditor API token
2. `POEDITOR_PROJECT_ID`: Your POEditor project ID

You can add these secrets in the "Settings > Secrets and variables > Actions" section of your GitHub repository.

## Manual Execution

When running the workflow manually, you can specify which languages to download. Languages should be entered as comma-separated values (e.g., `tr,gb,es`).

If you don't specify any languages, the default languages `tr` and `en` will be downloaded.

## Output

When the workflow completes successfully:

1. Translation files for the specified languages are downloaded from POEditor
2. These files are copied to the `src/locales/` directory
3. Changes are automatically committed and pushed to the main branch

## Troubleshooting

If the workflow fails:

1. Check the GitHub Actions logs
2. Make sure your POEditor API token and project ID are correct
3. Ensure that the languages you specified exist in your POEditor project

# POEditor Upload Workflow

## Summary of Implemented Translation Workflow

We have successfully created a GitHub Actions workflow that automatically uploads translation files to POEditor when changes are merged to the develop branch. Here's a summary of what we've implemented:
### Created Files

1. .github/scripts/upload-translations.js

- A Node.js script that handles the upload of translation files to POEditor
- Uses the POEditor API to upload JSON translation files
- Validates file existence and JSON format before uploading
- Provides detailed logging of the upload process

2. .github/workflows/poeditor-upload-on-merge.yml - A GitHub Actions workflow that triggers when PRs are merged to the develop branch - Only runs when changes are made to files in the src/locales directory - Detects which translation files were changed in the PR - Extracts language codes from filenames (e.g., tr.json → "tr") - Calls the upload script for each changed file
   ### Workflow Process
1. When a PR is merged to the develop branch, the workflow checks if any files in src/locales were modified.

1. If translation files were changed, the workflow:

- Sets up the necessary Node.js environment
- Installs required dependencies
- Identifies which specific translation files were changed
- For each changed file, extracts the language code and uploads to POEditor
- Provides status notifications about the upload process

This automated workflow ensures that your translations are always in sync between your codebase and POEditor, eliminating the need for manual uploads and reducing the risk of translation inconsistencies.
