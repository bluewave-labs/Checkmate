import timezones from "@/Utils/timezones.json";
import { toCanonicalTimezone } from "@/Utils/TimeUtils";

export interface TimezoneOption {
	id: string;
	name: string;
}

const timezoneEntries = [{ _id: "UTC", name: "UTC" }, ...timezones];
const listedIds = new Set(timezoneEntries.map((tz) => tz._id));
const seenIds = new Set<string>();

// timezones.json uses Mongo-style _id; remap once at module load to the
// { id, name } shape AutoComplete expects.
export const timezoneOptions: TimezoneOption[] = timezoneEntries.flatMap((tz) => {
	const id = toCanonicalTimezone(tz._id);
	if (!id) return [];
	if (id !== tz._id && (listedIds.has(id) || seenIds.has(id))) return [];
	seenIds.add(id);
	return [{ id, name: tz.name }];
});
