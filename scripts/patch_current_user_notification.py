from pathlib import Path

client_path = Path('client/src/Pages/CreateMonitor/index.tsx')
locale_path = Path('client/src/locales/en.json')

client_text = client_path.read_text(encoding='utf-8')
old_client = """\t\t\t\t\t\t\t\t\t// Map notifications to have 'name' property for Autocomplete\n\t\t\t\t\t\t\t\t\tconst notificationOptions = (notifications ?? []).map((n) => ({\n\t\t\t\t\t\t\t\t\t\t...n,\n\t\t\t\t\t\t\t\t\t\tname: n.notificationName,\n\t\t\t\t\t\t\t\t\t}));"""
new_client = """\t\t\t\t\t\t\t\t\t// Map notifications to have 'name' property for Autocomplete\n\t\t\t\t\t\t\t\t\tconst notificationOptions = [\n\t\t\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t\t\t\tid: \"current_user_email\",\n\t\t\t\t\t\t\t\t\t\t\tnotificationName: t(\"pages.createMonitor.form.notifications.currentUserEmail\"),\n\t\t\t\t\t\t\t\t\t\t\tname: t(\"pages.createMonitor.form.notifications.currentUserEmail\"),\n\t\t\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t\t\t...(notifications ?? []).map((n) => ({\n\t\t\t\t\t\t\t\t\t\t\t...n,\n\t\t\t\t\t\t\t\t\t\t\tname: n.notificationName,\n\t\t\t\t\t\t\t\t\t\t})),\n\t\t\t\t\t\t\t\t\t];"""
if old_client not in client_text:
    raise SystemExit('CLIENT_SNIPPET_NOT_FOUND')
client_text = client_text.replace(old_client, new_client, 1)
client_path.write_text(client_text, encoding='utf-8')

locale_text = locale_path.read_text(encoding='utf-8')
old_locale = """\t\t\t\t\t\t\t\t\t\"notifications\": {\n\t\t\t\t\t\t\t\t\t\t\"description\": \"Select the notification channels you want to use\",\n\t\t\t\t\t\t\t\t\t\t\"title\": \"Notifications\"\n\t\t\t\t\t\t\t\t\t},"""
new_locale = """\t\t\t\t\t\t\t\t\t\"notifications\": {\n\t\t\t\t\t\t\t\t\t\t\"description\": \"Select the notification channels you want to use\",\n\t\t\t\t\t\t\t\t\t\t\"title\": \"Notifications\",\n\t\t\t\t\t\t\t\t\t\t\"currentUserEmail\": \"Email current user\"\n\t\t\t\t\t\t\t\t\t},"""
if old_locale not in locale_text:
    raise SystemExit('LOCALE_SNIPPET_NOT_FOUND')
locale_text = locale_text.replace(old_locale, new_locale, 1)
locale_path.write_text(locale_text, encoding='utf-8')
print('PATCHED')
