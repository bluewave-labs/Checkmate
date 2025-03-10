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

If you don't specify any languages, the default languages `tr` and `gb` will be downloaded.

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
