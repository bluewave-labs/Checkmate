import mongoose from "mongoose";
const TeamSchema = mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
	}
);
export default mongoose.model("Team", TeamSchema);
