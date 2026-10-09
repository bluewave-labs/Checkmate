import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import { BasePage } from "@/Components/design-elements/BasePage";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { setDashboardVisibleCards, setDashboardData } from "@/Features/UI/uiSlice";
import { useGet } from "@/Hooks/UseApi";
import type { DashboardResponse } from "@/Types/Dashboard";
import type { RootState, AppDispatch } from "@/store";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { CurrentlyDownCard } from "@/Pages/Dashboard/components/cards/CurrentlyDownCard";
import { UptimeCard } from "@/Pages/Dashboard/components/cards/UptimeCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";
import { EditCardsModal } from "@/Pages/Dashboard/components/EditCardsModal";
import { type DashboardCardKey, dashboardCardKeys } from "@/Types/Dashboard";

const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const [editOpen, setEditOpen] = useState(false);
	const visibleCardsList = useSelector(
		(state: RootState) => state.ui.dashboardVisibleCards
	);
	const visibleCards = useMemo(() => new Set(visibleCardsList), [visibleCardsList]);

	const dashboard = useSelector((state: RootState) => state.ui.dashboardData);

	const { data, error } = useGet<DashboardResponse>(
		"/monitors/team/dashboard",
		{},
		{ refreshInterval: 30000, keepPreviousData: true }
	);

	useEffect(() => {
		if (data) dispatch(setDashboardData(data));
	}, [data, dispatch]);

	const cardComponents: Record<DashboardCardKey, ReactNode> = {
		monitorStatus: <MonitorStatusCard summary={dashboard?.summary ?? null} />,
		currentlyDown: (
			<CurrentlyDownCard
				monitors={dashboard?.down ?? []}
				total={dashboard?.summary.downMonitors ?? 0}
			/>
		),
		uptime: <UptimeCard monitors={dashboard?.uptime ?? []} />,
		monitorsByType: <MonitorsByTypeCard monitorsByType={dashboard?.byType ?? []} />,
	};

	return (
		<BasePage
			headerKey="dashboard"
			error={!!error}
		>
			<Stack gap={theme.spacing(LAYOUT.SM)}>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setEditOpen(true)}
					>
						{t("pages.dashboard.editCards")}
					</Button>
				</Stack>

				<Box
					display="grid"
					gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
					gap={theme.spacing(LAYOUT.MD)}
				>
					{dashboardCardKeys
						.filter((key) => visibleCards.has(key))
						.map((key) => (
							<Fragment key={key}>{cardComponents[key]}</Fragment>
						))}
				</Box>
			</Stack>

			<EditCardsModal
				open={editOpen}
				visibleCards={visibleCards}
				onClose={() => setEditOpen(false)}
				onSave={(next) => {
					dispatch(setDashboardVisibleCards([...next]));
					setEditOpen(false);
				}}
			/>
		</BasePage>
	);
};

export default Dashboard;
