import mongoose from "mongoose";

export const toStringId = (value?: mongoose.Types.ObjectId | string | null): string => {
	if (!value) {
		return "";
	}
	return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
};

export const toDateString = (value?: Date | string | null): string => {
	if (!value) {
		return new Date(0).toISOString();
	}
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};
