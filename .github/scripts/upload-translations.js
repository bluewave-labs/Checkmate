import axios from "axios";
import FormData from "form-data";
import fs from "fs-extra";

// POEditor API information
const API_TOKEN = process.env.POEDITOR_API;
const PROJECT_ID = process.env.POEDITOR_PROJECT_ID;
const FILE_PATH = process.env.FILE_PATH;
const LANGUAGE = process.env.LANGUAGE;

// POEditor API endpoint
const API_URL = 'https://api.poeditor.com/v2';

// Function to upload translations
async function uploadTranslations() {
  try {
    console.log(`Uploading translations for ${LANGUAGE} language from ${FILE_PATH}... test1`);

    // Check if file exists
    if (!await fs.pathExists(FILE_PATH)) {
      throw new Error(`File not found: ${FILE_PATH}`);
    }

    // Read file content
    const fileContent = await fs.readFile(FILE_PATH, 'utf8');

    // Validate JSON format
    try {
      JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Invalid JSON format in ${FILE_PATH}: ${error.message}`);
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append('api_token', API_TOKEN);
    formData.append('id', PROJECT_ID);
    formData.append('language', LANGUAGE);
    formData.append('updating', 'terms_translations');
    formData.append('file', fs.createReadStream(FILE_PATH));
    formData.append('overwrite', '1');
    formData.append('sync_terms', '1');

    // Upload to POEditor
    const response = await axios.post(`${API_URL}/projects/upload`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (response.data.response.status !== 'success') {
      throw new Error(`Failed to upload translations: ${JSON.stringify(response.data)}`);
    }

    console.log(`Successfully uploaded translations for ${LANGUAGE} language.`);
    console.log(`Statistics: ${JSON.stringify(response.data.result)}`);
  } catch (error) {
    console.error('An error occurred while uploading translations:', error);
    process.exit(1);
  }
}

// Run script
uploadTranslations();
