import mongoose from "mongoose";

const RecoveryTokenSchema = mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		token: {
			type: String,
			required: true,
		},
		expiry: {
			type: Date,
			default: Date.now,
			expires: 600,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("RecoveryToken", RecoveryTokenSchema);
