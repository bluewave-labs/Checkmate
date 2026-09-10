// Invite tokens used to always expire exactly 1 hour after creation, enforced by a
// fixed-TTL Mongo index (see invite.model.ts history). Admins can now choose a
// different duration per invite, so the bounds below gate both invite creation
// and the "change duration" update.
export const DEFAULT_INVITE_EXPIRY_HOURS = 1;
export const MIN_INVITE_EXPIRY_HOURS = 1;
export const MAX_INVITE_EXPIRY_HOURS = 24 * 30; // 30 days

export const HOUR_IN_MS = 60 * 60 * 1000;
