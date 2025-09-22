import { User, Role } from "../../models/index.js";
import { DEFAULT_ROLES } from "../../../service/v2/business/AuthService.js";
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
			for (const role of user.role || []) {
				if (role === "superadmin") {
					const superAdminRole = roles.find((role) => role.name === "SuperAdmin");
					user.roles.push(superAdminRole!._id);
				}
				if (role === "admin") {
					const managerRole = roles.find((role) => role.name === "Manager");
					user.roles.push(managerRole!._id);
				}
				if (role === "user") {
					const memberRole = roles.find((role) => role.name === "Member");
					user.roles.push(memberRole!._id);
				}
			}
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
