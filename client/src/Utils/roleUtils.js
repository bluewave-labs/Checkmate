export const ROLES = {
	SUPERADMIN: "superadmin",
	ADMIN: "admin",
	USER: "user",
	DEMO: "demo",
};

export const VALID_ROLES = [ROLES.ADMIN, ROLES.USER, ROLES.DEMO];

export const EDITABLE_ROLES = [
	{ role: ROLES.ADMIN, _id: ROLES.ADMIN },
	{ role: ROLES.USER, _id: ROLES.USER },
];
