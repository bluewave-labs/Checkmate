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
import { CardSegmentedBar, type BarSegment } from "../CardPrimitives";
import { useMonitors } from "../../useDashboardData";

import type { MonitorStatus, MonitorsSummary } from "@/Types/Monitor";

// Every state the summary reports, ordered worst first so the bar reads
// problems-to-healthy left to right and the chips below list what is wrong
// before what is merely idle. `up` is handled separately as the headline.
const STATES: { key: string; status: MonitorStatus; field: keyof MonitorsSummary }[] = [
	{ key: "down", status: "down", field: "downMonitors" },
	{ key: "breached", status: "breached", field: "breachedMonitors" },
	{ key: "initializing", status: "initializing", field: "initializingMonitors" },
	{ key: "maintenance", status: "maintenance", field: "maintenanceMonitors" },
	{ key: "paused", status: "paused", field: "pausedMonitors" },
];

export const MonitorStatusCard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { data, isLoading, isValidating, error } = useMonitors();
	const summary = data?.summary ?? null;

	// Only states that actually have monitors are shown. Padding the card with
	// zeros says nothing, and a healthy fleet should read as calm rather than as
	// a row of empty counters.
	const present = summary
		? STATES.map((state) => ({ ...state, count: summary[state.field] })).filter(
				(state) => state.count > 0
			)
		: [];

	const segments: BarSegment[] = summary
		? [
				{
					key: "up",
					value: summary.upMonitors,
					color: getStatusColor("up", theme),
					label: `${t("pages.common.monitors.status.up")} — ${summary.upMonitors}`,
				},
				...present.map((state) => ({
					key: state.key,
					value: state.count,
					color: getStatusColor(state.status, theme),
					label: `${t(`pages.common.monitors.status.${state.key}`)} — ${state.count}`,
				})),
			]
		: [];

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
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					<Stack gap={theme.spacing(LAYOUT.SM)}>
						<Stack
							direction="row"
							alignItems="baseline"
							gap={theme.spacing(LAYOUT.XS)}
						>
							<Typography
								fontSize={typographyLevels.xxl}
								fontWeight={300}
								color={theme.palette.text.primary}
								lineHeight={1.1}
							>
								{summary.upMonitors}
							</Typography>
							<Typography
								fontSize={typographyLevels.m}
								color={theme.palette.text.secondary}
							>
								{t("pages.dashboard.cards.monitorStatus.upOfTotal", {
									total: summary.totalMonitors,
								})}
							</Typography>
						</Stack>
						<CardSegmentedBar segments={segments} />
					</Stack>
					{present.length > 0 && (
						<Stack
							direction="row"
							flexWrap="wrap"
							gap={theme.spacing(LAYOUT.MD)}
						>
							{present.map((state) => (
								<Stack
									key={state.key}
									component={RouterLink}
									// Plain /uptime: the monitors list does not read query
									// params, so a ?status= filter would be silently dropped
									// and the link would lie about where it goes.
									to="/uptime"
									direction="row"
									alignItems="center"
									gap={theme.spacing(LAYOUT.XS)}
									px={theme.spacing(LAYOUT.XS)}
									py={theme.spacing(LAYOUT.XXS)}
									mx={`-${theme.spacing(LAYOUT.XS)}`}
									borderRadius={theme.shape.borderRadius}
									sx={{
										textDecoration: "none",
										"&:hover": { backgroundColor: theme.palette.action.hover },
									}}
								>
									<Dot
										color={getStatusColor(state.status, theme)}
										size="md"
									/>
									<Typography
										fontSize={typographyLevels.m}
										color={theme.palette.text.secondary}
									>
										{t(`pages.common.monitors.status.${state.key}`)}
									</Typography>
									<Typography
										fontSize={typographyLevels.m}
										color={theme.palette.text.primary}
									>
										{state.count}
									</Typography>
								</Stack>
							))}
						</Stack>
					)}
				</Stack>
			)}
		</DashboardCard>
	);
};
