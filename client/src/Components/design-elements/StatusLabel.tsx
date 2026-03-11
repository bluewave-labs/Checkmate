import Box from "@mui/material/Box";
import { BaseBox } from "@/Components/design-elements";
import Typography from "@mui/material/Typography";

import type { MonitorStatus } from "@/Types/Monitor";
import type { SxProps } from "@mui/material/styles";
import { getStatusPalette, getValuePalette } from "@/Utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

export const ValueTypes = ["positive", "negative", "neutral"] as const;
export type ValueType = (typeof ValueTypes)[number];

export const StatusLabel = ({ status, sx }: { status: MonitorStatus; sx?: SxProps }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const palette = getStatusPalette(status);

	const determineStatus = (status: MonitorStatus): string => {
		if (status === "up") {
			return t("pages.common.monitors.status.up");
		} else if (status === "down") {
			return t("pages.common.monitors.status.down");
		} else if (status === "exceeded") {
			return t("pages.common.monitors.status.exceeded");
		} else if (status === "maintenance") {
			return t("pages.common.monitors.status.maintenance");
		} else if (status === "paused") {
			return t("pages.common.monitors.status.paused");
		} else if (status === "initializing") {
			return t("pages.common.monitors.status.initializing");
		}

		return t("pages.common.monitors.status.initializing");
	};

	return (
		<BaseBox
			sx={{
				display: "inline-flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				padding: theme.spacing(3, 5),
				color: theme.palette[palette].main,
				borderColor:
					theme.palette.mode === "dark"
						? "rgba(255, 255, 255, 0.08)"
						: "rgba(0, 0, 0, 0.08)",
				...sx,
			}}
		>
			<Box
				width={7}
				height={7}
				bgcolor={theme.palette[palette].light}
				borderRadius="50%"
				marginRight="5px"
			/>
			<Typography textTransform={"capitalize"}>{determineStatus(status)}</Typography>
		</BaseBox>
	);
};

export const ValueLabel = ({ value, text }: { value: ValueType; text: string }) => {
	const theme = useTheme();
	const palette = getValuePalette(value);
	const transformedText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

	return (
		<BaseBox
			sx={{
				display: "inline-flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				padding: theme.spacing(3, 5),
				color: theme.palette[palette].main,
				borderColor:
					theme.palette.mode === "dark"
						? "rgba(255, 255, 255, 0.08)"
						: "rgba(0, 0, 0, 0.08)",
			}}
		>
			<Box
				width={7}
				height={7}
				bgcolor={theme.palette[palette].light}
				borderRadius="50%"
				marginRight="5px"
			/>
			<Typography>{transformedText}</Typography>
		</BaseBox>
	);
};
