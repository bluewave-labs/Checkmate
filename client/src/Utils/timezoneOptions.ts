import timezones from "@/Utils/timezones.json";

export interface TimezoneOption {
	id: string;
	name: string;
}

// timezones.json uses Mongo-style _id; remap once at module load to the
// { id, name } shape AutoComplete expects.
export const timezoneOptions: TimezoneOption[] = timezones.map((tz) => ({
	id: tz._id,
	name: tz.name,
}));
