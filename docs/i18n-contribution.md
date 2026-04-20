# Contributing Translations

Checkmate supports multiple languages. This guide explains how to contribute translations.

## How to Add a New Language

1. Create a new JSON file in `client/src/locales/` named with the language code (e.g., `it.json` for Italian)

2. Copy the structure from `en.json` and translate all values

3. Add the language to the language selector in the UI

## Translation Guidelines

- en.json is the reference localization file, all keys should be declared here and mirrored in other localization files
- Translate only the values
- Use formal/informal tone consistently
- Test your translations in the UI

## File Structure
client/src/locales/
├── en.json      # Source language
├── es.json      # Spanish
├── de.json      # German
└── [lang].json  # Your language
## Testing Translations

1. Start the development server: `npm run dev`
2. Go to Settings → Language
3. Select your language
4. Verify all strings display correctly
