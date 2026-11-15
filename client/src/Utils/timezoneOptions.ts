import timezones from "@/Utils/timezones.json";

export interface TimezoneOption {
	id: string;
	name: string;
}

// The server falls back to UTC wherever no timezone is stored (status pages, for one), so UTC
// has to be selectable or the form can't show the value actually in use
export const UTC_TIMEZONE = "Etc/UTC";

// timezones.json uses Mongo-style _id; remap once at module load to the
// { id, name } shape AutoComplete expects.
export const timezoneOptions: TimezoneOption[] = [
	{ id: UTC_TIMEZONE, name: "UTC" },
	...timezones.map((tz) => ({
		id: tz._id,
		name: tz.name,
	})),
];
