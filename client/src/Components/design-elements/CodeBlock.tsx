import Box, { type BoxProps } from "@mui/material/Box";
import { useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { SPACING } from "@/Utils/Theme/constants";

interface CodeBlockProps {
	children: ReactNode;
	maxHeight?: BoxProps["maxHeight"];
}

export const CodeBlock = ({ children, maxHeight }: CodeBlockProps) => {
	const theme = useTheme();

	return (
		<Box
			component="pre"
			m={0}
			p={theme.spacing(SPACING.LG)}
			borderRadius={theme.shape.borderRadius}
			bgcolor={theme.palette.action.hover}
			fontFamily={theme.typography.fontFamilyMonospace}
			overflow="auto"
			maxHeight={maxHeight}
		>
			<code>{children}</code>
		</Box>
	);
};
