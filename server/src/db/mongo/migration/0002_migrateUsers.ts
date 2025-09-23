import { User, Role } from "../../models/index.js";
import { Types } from "mongoose";

import { DEFAULT_ROLES } from "../../../service/v2/business/AuthService.js";
export const MIGRATION_NAME = "0002_migrateUsers";
async function migrateUsers() {
	try {
		// Create roles if they don't exist
		const roleCount = await Role.countDocuments();
		let roles;
		if (roleCount === 0) {
			const rolePromises = DEFAULT_ROLES.map((roleData) =>
				new Role({
					...roleData,
				}).save()
			);
			roles = await Promise.all(rolePromises);
		} else {
			roles = await Role.find();
		}

		// Migrate users
		const users = await User.find({
			$or: [{ version: { $exists: false } }, { version: { $lt: 2 } }],
		});
		for (const user of users) {
			const newRoleIds: Types.ObjectId[] = [];

			for (const role of user.role || []) {
				if (role === "superadmin") {
					const superAdminRole = roles.find((role) => role.name === "SuperAdmin");
					newRoleIds.push(superAdminRole!._id);
				}
				if (role === "admin") {
					const managerRole = roles.find((role) => role.name === "Manager");
					newRoleIds.push(managerRole!._id);
				}
				if (role === "user") {
					const memberRole = roles.find((role) => role.name === "Member");
					newRoleIds.push(memberRole!._id);
				}
			}
			const merged = [...new Set([...user.roles, ...newRoleIds])];
			user.roles = merged;
			user.version = 2;
			await user.save();
		}

		return true;
	} catch (err) {
		console.error("Migration error:", err);
		return false;
	}
}

export { migrateUsers };
