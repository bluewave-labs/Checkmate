import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import logger from "../../utils/logger.js";

const UserSchema = mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		avatarImage: {
			type: String,
		},
		profileImage: {
			data: Buffer,
			contentType: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		role: {
			type: [String],
			default: "user",
			enum: ["user", "admin", "superadmin", "demo"],
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		checkTTL: {
			type: Number,
		},
	},
	{
		timestamps: true,
	}
);

UserSchema.pre("save", function (next) {
	if (!this.isModified("password")) {
		return next();
	}
	const salt = bcrypt.genSaltSync(10);
	this.password = bcrypt.hashSync(this.password, salt);
	next();
});

UserSchema.pre("findOneAndUpdate", function (next) {
	const update = this.getUpdate();
	if ("password" in update) {
		const salt = bcrypt.genSaltSync(10);
		update.password = bcrypt.hashSync(update.password, salt);
	}

	next();
});

UserSchema.methods.comparePassword = async function (submittedPassword) {
	const res = await bcrypt.compare(submittedPassword, this.password);
	return res;
};

const User = mongoose.model("User", UserSchema);

User.init().then(() => {
	logger.info({
		message: "User model initialized",
		service: "UserModel",
		method: "init",
	});
});

export default User;
