import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version?: string };

export const APP_VERSION: string = pkg.version ?? "unknown";
