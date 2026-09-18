import type { SxProps, Theme } from "@mui/material/styles";

export const mergeSx = (
	...styles: Array<SxProps<Theme> | false | null | undefined>
): SxProps<Theme> =>
	styles
		.flatMap((style) => (Array.isArray(style) ? style : [style]))
		.filter(Boolean) as SxProps<Theme>;
