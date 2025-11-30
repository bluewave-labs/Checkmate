export const PERMISSIONS = {
  master: "master",
  users: {
    all: "users.*",
    write: "users.write",
    read: "users.read",
    delete: "users.delete",
  },
  monitors: {
    all: "monitors.*",
    write: "monitors.write",
    read: "monitors.read",
    update: "monitors.update",
    delete: "monitors.delete",
  },
  notifications: {
    all: "notifications.*",
    write: "notifications.write",
    read: "notifications.read",
    update: "notifications.update",
    delete: "notifications.delete",
  },
  maintenance: {
    all: "maintenance.*",
    write: "maintenance.write",
    read: "maintenance.read",
    update: "maintenance.update",
    delete: "maintenance.delete",
  },
  invite: {
    all: "invite.*",
    write: "invite.write",
    read: "invite.read",
    delete: "invite.delete",
  },
  checks: {
    all: "checks.*",
    write: "checks.write",
    read: "checks.read",
    update: "checks.update",
    delete: "checks.delete",
  },
  statusPages: {
    all: "statusPages.*",
    write: "statusPages.write",
    read: "statusPages.read",
    update: "statusPages.update",
    delete: "statusPages.delete",
  },
  teams: {
    all: "teams.*",
    write: "teams.write",
    read: "teams.read",
    update: "teams.update",
    delete: "teams.delete",
  },
  roles: {
    all: "roles.*",
    write: "roles.write",
    read: "roles.read",
    update: "roles.update",
    delete: "roles.delete",
  },
  diagnostic: {
    all: "diagnostic.*",
    write: "diagnostic.write",
    read: "diagnostic.read",
    update: "diagnostic.update",
    delete: "diagnostic.delete",
  },
  incidents: {
    all: "incidents.*",
    write: "incidents.write",
    read: "incidents.read",
    update: "incidents.update",
    delete: "incidents.delete",
  },
  billing: {
    all: "billing.*",
  },
};

export type Permission =
  | typeof PERMISSIONS.master
  | (typeof PERMISSIONS.users)[keyof typeof PERMISSIONS.users]
  | (typeof PERMISSIONS.monitors)[keyof typeof PERMISSIONS.monitors]
  | (typeof PERMISSIONS.notifications)[keyof typeof PERMISSIONS.notifications]
  | (typeof PERMISSIONS.maintenance)[keyof typeof PERMISSIONS.maintenance]
  | (typeof PERMISSIONS.invite)[keyof typeof PERMISSIONS.invite]
  | (typeof PERMISSIONS.checks)[keyof typeof PERMISSIONS.checks]
  | (typeof PERMISSIONS.statusPages)[keyof typeof PERMISSIONS.statusPages]
  | (typeof PERMISSIONS.teams)[keyof typeof PERMISSIONS.teams]
  | (typeof PERMISSIONS.roles)[keyof typeof PERMISSIONS.roles]
  | (typeof PERMISSIONS.diagnostic)[keyof typeof PERMISSIONS.diagnostic]
  | (typeof PERMISSIONS.incidents)[keyof typeof PERMISSIONS.incidents]
  | (typeof PERMISSIONS.billing)[keyof typeof PERMISSIONS.billing];
