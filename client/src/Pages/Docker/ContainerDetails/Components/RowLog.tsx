import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { Fragment } from "react";

// Hooks
import { useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

// Utils
import type { DockerLogRow } from "@/Utils/MonitorUtils";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { formatDateWithTz } from "@/Utils/TimeUtils";
import type { RootState } from "@/store";

export const RowLog = ({ row }: { row: DockerLogRow }) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state: RootState) => state.ui.timezone);
	const { t } = useTranslation();

	return (
		<Fragment>
			<Grid
				container
				spacing={{ xs: 0, md: LAYOUT.MD }}
				py={{ xs: LAYOUT.LG, md: 0 }}
			>
				<Grid size={{ xs: 12, md: "auto" }}>
					<Typography
						fontFamily="monospace"
						color={theme.palette.text.secondary}
					>
						{formatDateWithTz(row.ts, "MMM D HH:mm:ss", uiTimezone)}
					</Typography>
				</Grid>
				<Grid size={{ xs: 12, md: "grow" }}>
					<Typography
						fontFamily={"monospace"}
						whiteSpace={{ xs: "pre-wrap", md: "nowrap" }}
						sx={{
							overflowWrap: { xs: "anywhere", md: "normal" },
						}}
					>
						<Box
							component={"span"}
							color={
								row.stream === "stderr"
									? theme.palette.error.main
									: theme.palette.success.main
							}
						>
							{row.stream}
						</Box>
						: {row.text}
					</Typography>
				</Grid>
			</Grid>
			{row.gapBefore ? (
				<Stack
					width="100%"
					direction="row"
					alignItems={"center"}
					py={SPACING.MD}
				>
					<Typography pr={SPACING.MD}>
						{t("pages.docker.container.logs.skipped")}
					</Typography>
					<Divider sx={{ flex: 1 }} />
				</Stack>
			) : (
				<Divider sx={{ display: { xs: "block", md: "none" } }} />
			)}
		</Fragment>
	);
};
