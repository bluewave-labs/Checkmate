export interface ISystemSettings extends Document {
  systemEmailHost?: string;
  systemEmailPort?: number;
  systemEmailAddress?: string;
  systemEmailPassword?: string;
  systemEmailUser?: string;
  systemEmailConnectionHost?: string;
  systemEmailTLSServername?: string;
  systemEmailSecure: boolean;
  systemEmailPool: boolean;
  systemEmailIgnoreTLS: boolean;
  systemEmailRequireTLS: boolean;
  systemEmailRejectUnauthorized: boolean;
}
