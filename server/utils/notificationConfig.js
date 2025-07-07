/**
 * Configuration for notification behavior including exponential backoff
 * These values determine how notifications are delayed when a service is down
 */
export default {
  // Whether backoff is enabled by default for new notifications
  BACKOFF_ENABLED_DEFAULT: true,
  
  // Initial delay before sending another notification (1 minute in ms)
  INITIAL_BACKOFF_DELAY_MS: 60000,
  
  // Maximum delay between notifications (1 hour in ms)
  MAX_BACKOFF_DELAY_MS: 3600000,
  
  // Multiplier for exponential growth of delay
  BACKOFF_MULTIPLIER: 2,
  
  // Jitter factor to prevent thundering herd (20% randomness)
  JITTER_FACTOR: 0.2
};
