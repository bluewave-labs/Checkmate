import { useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import { BasePage } from "@/Components/design-elements/BasePage";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { useMonitorListController } from "@/Hooks/useMonitorListController";
import { MonitorTypes, type MonitorTypeCount } from "@/Types/Monitor";
import {
	setDashboardVisibleCards,
	dashboardCardKeys,
	type DashboardCardKey,
} from "@/Features/UI/uiSlice";
import type { RootState, AppDispatch } from "@/store";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";
import { EditCardsModal } from "@/Pages/Dashboard/components/EditCardsModal";

const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const [editOpen, setEditOpen] = useState(false);
	const visibleCardsList = useSelector(
		(state: RootState) => state.ui.dashboardVisibleCards
	);
	const visibleCards = useMemo(() => new Set(visibleCardsList), [visibleCardsList]);

	const { monitors, summary } = useMonitorListController({
		types: [...MonitorTypes],
		checksLimit: 1,
		refreshInterval: 30000,
		rowsPerPageTable: "monitors",
		rowsPerPageDefault: 100,
	});

	const monitorsByType = useMemo<MonitorTypeCount[]>(() => {
		const countMap = new Map<MonitorTypeCount["type"], number>();
		(monitors ?? []).forEach((m) =>
			countMap.set(m.type, (countMap.get(m.type) ?? 0) + 1)
		);
		return [...countMap.entries()]
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count);
	}, [monitors]);

	const cardComponents: Record<DashboardCardKey, ReactNode> = {
		monitorStatus: <MonitorStatusCard summary={summary} />,
		monitorsByType: <MonitorsByTypeCard monitorsByType={monitorsByType} />,
	};

	return (
		<BasePage headerKey="dashboard">
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
							<div key={key}>{cardComponents[key]}</div>
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
