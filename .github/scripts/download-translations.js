import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { URLSearchParams } from "url";

// POEditor API information
const API_TOKEN = process.env.POEDITOR_API;
const PROJECT_ID = process.env.POEDITOR_PROJECT_ID;
const LANGUAGES = (
  process.env.LANGUAGES || "ar,zh-tw,cs,en,fi,fr,de,pt-br,ru,es,tr,ja"
).split(",");
const EXPORT_FORMAT = process.env.EXPORT_FORMAT || "key_value_json";

// POEditor API endpoint
const API_URL = "https://api.poeditor.com/v2";

function normalizeLanguageCode(language) {
  if (language.includes("-")) {
    const [base, region] = language.split("-");
    return `${base}-${region.toUpperCase()}`;
  }
  return language;
}

// Function to download translations
async function downloadTranslations() {
  try {
    console.log("Downloading translations from POEditor...");
    console.log(`Using export format: ${EXPORT_FORMAT}`);

    for (const language of LANGUAGES) {
      console.log(`Downloading translations for ${language} language...`);

      // Get export URL from POEditor
      const exportResponse = await axios.post(
        `${API_URL}/projects/export`,
        new URLSearchParams({
          api_token: API_TOKEN,
          id: PROJECT_ID,
          language: language,
          type: EXPORT_FORMAT,
        })
      );

      if (exportResponse.data.response.status !== "success") {
        throw new Error(
          `Failed to get export URL for ${language} language: ${JSON.stringify(
            exportResponse.data
          )}`
        );
      }

      const fileUrl = exportResponse.data.result.url;
      console.log(`Export URL obtained for ${language}`);

      // Download translation file
      const downloadResponse = await axios.get(fileUrl, {
        responseType: "json",
      });
      const translations = downloadResponse.data;
      console.log(`Downloaded translations for ${language}`);

      // Check the format of data returned from POEditor and convert if necessary
      let formattedTranslations = translations;

      // If data is in array format, convert it to key-value format
      if (Array.isArray(translations)) {
        console.log(
          `Converting array format to key-value format for ${language}`
        );
        formattedTranslations = {};
        translations.forEach((item) => {
          if (item.term && item.definition) {
            formattedTranslations[item.term] = item.definition;
          }
        });
      }

      // Determine the output filename based on language
      const normalizedLanguage = normalizeLanguageCode(language);
      const filename = `${normalizedLanguage}.json`;
      const outputPath = path.join(process.cwd(), "temp", filename);
      await fs.writeJson(outputPath, formattedTranslations, { spaces: 2 });

      console.log(
        `Translations for ${language} language successfully downloaded and saved as: ${filename}`
      );
    }

    console.log("All translations successfully downloaded!");
  } catch (error) {
    console.error("An error occurred while downloading translations:", error);
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    // Clean temp folder
    await fs.emptyDir(path.join(process.cwd(), "temp"));

    // Download translations
    await downloadTranslations();
  } catch (error) {
    console.error("An error occurred during the process:", error);
    process.exit(1);
  }
}

// Run script
main();
