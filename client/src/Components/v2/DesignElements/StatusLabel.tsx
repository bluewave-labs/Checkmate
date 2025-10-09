import Box from "@mui/material/Box";
import { BaseBox } from "@/Components/v2/DesignElements";
import type { MonitorStatus } from "@/Types/Monitor";

import { getStatusPalette } from "@/Utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";

export const StatusLabel = ({
	status,
	isActive,
}: {
	status: MonitorStatus;
	isActive?: boolean;
}) => {
	const theme = useTheme();
	const palette = getStatusPalette(status);
	const transformedText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

	return (
		<BaseBox
			sx={{
				display: "inline-flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				padding: theme.spacing(3, 5),
				color: theme.palette[palette].main,
				borderColor: theme.palette[palette].lowContrast,
			}}
		>
			<Box
				width={7}
				height={7}
				bgcolor={theme.palette[palette].lowContrast}
				borderRadius="50%"
				marginRight="5px"
			/>
			{isActive === false ? "Paused" : transformedText}
		</BaseBox>
	);
};
