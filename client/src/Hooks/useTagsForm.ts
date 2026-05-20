import { useMemo } from "react";
import { tagSchema, type TagFormData } from "@/Validation/tag";
import type { Tag } from "@/Types/Tag";

interface UseTagsFormOptions {
	data?: Tag | null;
}

export const useTagsForm = ({ data }: UseTagsFormOptions) => {
	return useMemo(() => {
		const defaults: TagFormData = {
			name: data?.name ?? "",
			color: data?.color ?? "#13715B",
		};

		return { schema: tagSchema, defaults };
	}, [data]);
};
