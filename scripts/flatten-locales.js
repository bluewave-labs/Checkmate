#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function flattenKeys(obj, prefix = "", result = []) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        flattenKeys(obj[key], newKey, result);
      } else {
        result.push(newKey);
      }
    }
  }
  return result;
}

// Paths
const localesDir = path.join(__dirname, "../client/src/locales");
const inputPath = path.join(localesDir, "en.json");
const outputPath = path.join(localesDir, "keys.json");

try {
  const jsonContent = fs.readFileSync(inputPath, "utf8");
  const jsonData = JSON.parse(jsonContent);

  const flattenedKeys = flattenKeys(jsonData);
  flattenedKeys.sort();

  fs.writeFileSync(outputPath, JSON.stringify(flattenedKeys, null, 2), "utf8");

  console.log(`Keys written to: ${outputPath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
