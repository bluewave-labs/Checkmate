import type { SxProps, Theme } from "@mui/material/styles";

export const mergeSx = (
	...styles: Array<SxProps<Theme> | false | null | undefined>
): SxProps<Theme> => {
	const result: SxProps<Theme>[] = [];
	for (const style of styles) {
		if (!style) continue;
		if (Array.isArray(style)) {
			result.push(...(style.filter(Boolean) as SxProps<Theme>[]));
		} else {
			result.push(style);
		}
	}
	return result as SxProps<Theme>;
};
