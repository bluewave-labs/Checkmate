import Box from "@mui/material/Box";
import type { ComponentProps } from "react";
import { Tooltip } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";

export const TipButton = ({
	tip,
	...props
}: ComponentProps<typeof Button> & { tip: string }) => {
	return (
		<Tooltip title={tip}>
			<Box
				component="span"
				display="inline-flex"
			>
				<Button {...props} />
			</Box>
		</Tooltip>
	);
};
