export interface ILogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  service: string;
  stack: string;
  timestamp: string;
}
