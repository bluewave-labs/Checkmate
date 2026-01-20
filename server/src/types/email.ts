import { Settings } from "./settings.js";

export type EmailTransportConfig = Pick<
	Settings,
	| "systemEmailHost"
	| "systemEmailPort"
	| "systemEmailAddress"
	| "systemEmailPassword"
	| "systemEmailUser"
	| "systemEmailConnectionHost"
	| "systemEmailTLSServername"
	| "systemEmailSecure"
	| "systemEmailPool"
	| "systemEmailIgnoreTLS"
	| "systemEmailRequireTLS"
	| "systemEmailRejectUnauthorized"
>;
