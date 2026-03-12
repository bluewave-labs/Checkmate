import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { CheckSnapshot } from "@/Types/Check";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import { useTranslation } from "react-i18next";

type HeatmapCheck =
	| CheckSnapshot
	| { status: "placeholder"; responseTime: 0; createdAt: "" };

export const HeatmapResponseTimeTooltip = ({
	children,
	check,
}: {
	children: React.ReactElement;
	check: HeatmapCheck;
}) => {
	const { t } = useTranslation();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const theme = useTheme();

	const getColor = (status: boolean) => {
		if (status === true) return theme.palette.success.light;
		if (status === false) return theme.palette.error.light;
	};

	if (check.status === "placeholder") {
		return children;
	}

	return (
		<Tooltip
			slotProps={{
				tooltip: {
					sx: {
						backgroundColor: "transparent",
						color: "inherit",
						boxShadow: "none",
					},
				},
			}}
			title={
				<Stack
					sx={{
						backgroundColor: theme.palette.secondary.main,
						border: 1,
						borderColor: theme.palette.divider,
						borderRadius: theme.shape.borderRadius,
						p: theme.spacing(4),
					}}
				>
					<Typography>
						{formatDateWithTz(check?.createdAt, "ddd, MMMM D, YYYY, HH:mm A", uiTimezone)}
					</Typography>
					<Typography>
						{t("common.labels.responseTime")}:{" "}
						{check?.originalResponseTime?.toFixed() ?? "N/A"} ms
					</Typography>
					<Typography textTransform={"capitalize"}>
						Status:{" "}
						<span style={{ color: getColor(check?.status) }}>
							{check?.status === true
								? t("pages.common.monitors.status.up")
								: t("pages.common.monitors.status.down")}
						</span>
					</Typography>
				</Stack>
			}
		>
			{children}
		</Tooltip>
	);
};
