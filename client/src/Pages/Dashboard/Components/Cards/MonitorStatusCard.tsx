import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Dot } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { getStatusColor } from "@/Utils/MonitorUtils";
import { DashboardCard, CardMessage } from "../DashboardCard";
import { useMonitors } from "../../useDashboardData";

import type { MonitorStatus, MonitorsSummary } from "@/Types/Monitor";

// Wide enough for a three-digit count beside its label before the tiles wrap.
const TILE_MIN_WIDTH = 96;

// Every state the summary reports, in the order they read: healthy first, then
// what is wrong, then what is not being checked. All six are listed so the
// tiles always sum to totalMonitors — omitting one leaves an unexplained gap.
const COUNTS: { key: string; status: MonitorStatus; field: keyof MonitorsSummary }[] = [
	{ key: "up", status: "up", field: "upMonitors" },
	{ key: "down", status: "down", field: "downMonitors" },
	{ key: "breached", status: "breached", field: "breachedMonitors" },
	{ key: "maintenance", status: "maintenance", field: "maintenanceMonitors" },
	{ key: "paused", status: "paused", field: "pausedMonitors" },
	{ key: "initializing", status: "initializing", field: "initializingMonitors" },
];

export const MonitorStatusCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();
	const summary = data?.summary ?? null;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.monitorStatus.title")}
			to="/uptime"
			isLoading={isLoading && !summary}
			error={error}
			isStale={isValidating && Boolean(data)}
		>
			{!summary || summary.totalMonitors === 0 ? (
				<CardMessage text={t("pages.dashboard.cards.monitorStatus.empty")} />
			) : (
				<Stack
					direction="row"
					flexWrap="wrap"
					gap={theme.spacing(LAYOUT.LG)}
				>
					{COUNTS.map(({ key, status, field }) => (
						<Stack
							key={key}
							component={RouterLink}
							// Plain /uptime: the monitors list does not read query
							// params, so a ?status= filter would be silently dropped and
							// the link would lie about where it goes.
							to="/uptime"
							gap={theme.spacing(LAYOUT.XXS)}
							flex="1 1 0"
							minWidth={TILE_MIN_WIDTH}
							px={theme.spacing(LAYOUT.SM)}
							py={theme.spacing(LAYOUT.XS)}
							borderRadius={theme.shape.borderRadius}
							sx={{
								textDecoration: "none",
								"&:hover": { backgroundColor: theme.palette.action.hover },
							}}
						>
							<Stack
								direction="row"
								alignItems="center"
								gap={theme.spacing(LAYOUT.XS)}
							>
								<Dot
									color={getStatusColor(status, theme)}
									size="md"
								/>
								<Typography
									fontSize={typographyLevels.m}
									color={theme.palette.text.secondary}
								>
									{t(`pages.common.monitors.status.${key}`)}
								</Typography>
							</Stack>
							<Typography
								fontSize={typographyLevels.xxl}
								fontWeight={300}
								color={theme.palette.text.primary}
								lineHeight={1.1}
							>
								{summary[field]}
							</Typography>
						</Stack>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};
