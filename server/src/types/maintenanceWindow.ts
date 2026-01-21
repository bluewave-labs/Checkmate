export interface MaintenanceWindow {
	monitorId: String;
	teamId: string;
	active: boolean;
}
const MaintenanceWindow = mongoose.Schema(
	{
		monitorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Monitor",
			immutable: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		active: {
			type: Boolean,
			default: true,
		},
		name: {
			type: String,
		},
		repeat: {
			type: Number,
		},
		start: {
			type: Date,
		},
		end: {
			type: Dat,
		},
		expiry: {
			type: Date,
			index: { expires: "0s" },
		},
	},

	{
		timestamps: true,
	}
);

export default mongoose.model("MaintenanceWindow", MaintenanceWindow);
