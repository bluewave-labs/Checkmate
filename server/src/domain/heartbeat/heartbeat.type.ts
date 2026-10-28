export const HeartbeatActions = ["success", "fail"] as const;
export type HeartbeatAction = (typeof HeartbeatActions)[number];

export const HEARTBEAT_UP_CODE = 200;
export const HEARTBEAT_FAIL_CODE = 500;
export const HEARTBEAT_MISSED_CODE = 408;
export const HEARTBEAT_MAX_EXIT_CODE = 255;
export const HEARTBEAT_MAX_MESSAGE_LENGTH = 500;
