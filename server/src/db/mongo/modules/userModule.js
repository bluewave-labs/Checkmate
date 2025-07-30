const SERVICE_NAME = "userModule";
const DUPLICATE_KEY_CODE = 11000; // MongoDB error code for duplicate key

class UserModule {
	constructor({ User, Team, GenerateAvatarImage, ParseBoolean, stringService }) {
		this.User = User;
		this.Team = Team;
		this.GenerateAvatarImage = GenerateAvatarImage;
		this.ParseBoolean = ParseBoolean;
		this.stringService = stringService;
	}

	checkSuperadmin = async () => {
		try {
			const superAdmin = await this.User.findOne({ role: "superadmin" });
			if (superAdmin !== null) {
				return true;
			}
			return false;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "checkSuperadmin";
			throw error;
		}
	};

	insertUser = async (userData, imageFile) => {
		try {
			if (imageFile) {
				// 1.  Save the full size image
				userData.profileImage = {
					data: imageFile.buffer,
					contentType: imageFile.mimetype,
				};

				// 2.  Get the avatar sized image
				const avatar = await this.GenerateAvatarImage(imageFile);
				userData.avatarImage = avatar;
			}

			//  Handle creating team if superadmin
			if (userData.role.includes("superadmin")) {
				const team = new this.Team({
					email: userData.email,
				});
				userData.teamId = team._id;
				userData.checkTTL = 60 * 60 * 24 * 30;
				await team.save();
			}

			const newUser = new this.User(userData);
			await newUser.save();
			return await this.User.findOne({ _id: newUser._id }).select("-password").select("-profileImage"); // .select() doesn't work with create, need to save then find
		} catch (error) {
			if (error.code === DUPLICATE_KEY_CODE) {
				error.message = this.stringService.dbUserExists;
			}
			error.service = SERVICE_NAME;
			error.method = "insertUser";
			throw error;
		}
	};
	getUserByEmail = async (email) => {
		try {
			// Need the password to be able to compare, removed .select()
			// We can strip the hash before returning the user
			const user = await this.User.findOne({ email: email }).select("-profileImage");
			if (!user) {
				throw new Error(this.stringService.dbUserNotFound);
			}
			return user;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getUserByEmail";
			throw error;
		}
	};

	updateUser = async ({ userId, user, file }) => {
		if (!userId) {
			throw new Error("No user in request");
		}

		try {
			const candidateUser = { ...user };

			if (this.ParseBoolean(candidateUser.deleteProfileImage) === true) {
				candidateUser.profileImage = null;
				candidateUser.avatarImage = null;
			} else if (file) {
				// 1.  Save the full size image
				candidateUser.profileImage = {
					data: file.buffer,
					contentType: file.mimetype,
				};

				// 2.  Get the avatar sized image
				const avatar = await this.GenerateAvatarImage(file);
				candidateUser.avatarImage = avatar;
			}

			const updatedUser = await this.User.findByIdAndUpdate(
				userId,
				candidateUser,
				{ new: true } // Returns updated user instead of pre-update user
			)
				.select("-password")
				.select("-profileImage");
			return updatedUser;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "updateUser";
			throw error;
		}
	};
	deleteUser = async (userId) => {
		try {
			const deletedUser = await this.User.findByIdAndDelete(userId);
			if (!deletedUser) {
				throw new Error(this.stringService.dbUserNotFound);
			}
			return deletedUser;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteUser";
			throw error;
		}
	};

	getAllUsers = async () => {
		try {
			const users = await this.User.find().select("-password").select("-profileImage");
			return users;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getAllUsers";
			throw error;
		}
	};

	getUserById = async (roles, userId) => {
		try {
			if (!roles.includes("superadmin")) {
				throw new Error("User is not a superadmin");
			}

			const user = await this.User.findById(userId).select("-password").select("-profileImage");
			if (!user) {
				throw new Error("User not found");
			}

			return user;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getUserById";
			throw error;
		}
	};

	editUserById = async (userId, user) => {
		try {
			await this.User.findByIdAndUpdate(userId, user, { new: true }).select("-password").select("-profileImage");
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "editUserById";
			throw error;
		}
	};
}

export default UserModule;
