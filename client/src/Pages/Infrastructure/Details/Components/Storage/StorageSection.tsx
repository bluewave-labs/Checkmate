import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/Components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useId } from "react";
import { LAYOUT } from "@/Utils/Theme/constants";

// A titled block of the Storage tab: heading on the left, a short note on the right
export const StorageSection = ({
	title,
	subtitle,
	children,
}: React.PropsWithChildren<{ title: string; subtitle?: string }>) => {
	const theme = useTheme();
	const headingId = useId();

	return (
		<Stack
			component="section"
			aria-labelledby={headingId}
			gap={theme.spacing(LAYOUT.XL)}
		>
			<Stack
				direction="row"
				flexWrap="wrap"
				alignItems="baseline"
				justifyContent="space-between"
				gap={theme.spacing(LAYOUT.MD)}
			>
				<Typography
					id={headingId}
					variant="h2"
					component="h2"
				>
					{title}
				</Typography>
				{subtitle && (
					<Typography color={theme.palette.text.secondary}>{subtitle}</Typography>
				)}
			</Stack>
			{children}
		</Stack>
	);
};

// Plain card for empty and unavailable states: an optional bold title, then muted text
export const StorageMessage = ({
	title,
	children,
}: React.PropsWithChildren<{ title?: string }>) => {
	const theme = useTheme();

	return (
		<BaseBox
			display="flex"
			flexDirection="column"
			gap={theme.spacing(LAYOUT.XS)}
			p={theme.spacing(LAYOUT.LG)}
		>
			{title && <Typography fontWeight={600}>{title}</Typography>}
			{children}
		</BaseBox>
	);
};
