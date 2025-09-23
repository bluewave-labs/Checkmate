import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/checkmate";

export const connectDatabase = async (): Promise<boolean> => {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log("Connected to MongoDB");
		return true;
	} catch (error) {
		console.error("MongoDB connection error:", error);
		process.exit(1);
	}
};

export const disconnectDatabase = async (): Promise<boolean> => {
	try {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
		return true;
	} catch (error) {
		console.error("MongoDB disconnection error:", error);
		return false;
	}
};
