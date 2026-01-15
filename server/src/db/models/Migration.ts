import mongoose from "mongoose";

const MigrationSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		status: { type: String, enum: ["completed", "failed"], default: "completed" },
		completedAt: { type: Date },
		error: { type: String },
	},
	{ timestamps: true }
);

export default mongoose.model("Migration", MigrationSchema);
