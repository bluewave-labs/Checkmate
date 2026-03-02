/**
 * Central validation exports
 *
 * This file re-exports all validation schemas from their respective modules.
 * Import from here for convenience: import { loginValidation } from "@/validation";
 */

// Shared utilities
export * from "./shared.js";

// Domain-specific validations
export * from "./authValidation.js";
export * from "./monitorValidation.js";
export * from "./checkValidation.js";
export * from "./maintenanceWindowValidation.js";
export * from "./settingsValidation.js";
export * from "./statusPageValidation.js";
export * from "./notificationValidation.js";
export * from "./userValidation.js";
