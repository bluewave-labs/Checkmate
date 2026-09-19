import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/Components/design-elements/BasePage";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { useMonitorListController } from "@/Hooks/useMonitorListController";
import { MonitorTypes, type MonitorTypeCount } from "@/Types/Monitor";

import { MonitorStatusCard } from "@/Pages/Dashboard/components/cards/MonitorStatusCard";
import { MonitorsByTypeCard } from "@/Pages/Dashboard/components/cards/MonitorsByTypeCard";
import {
	EditCardsModal,
	type DashboardCardKey,
} from "@/Pages/Dashboard/components/EditCardsModal";

const allCards = new Set<DashboardCardKey>(["monitorStatus", "monitorsByType"]);

const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [editOpen, setEditOpen] = useState(false);
	const [visibleCards, setVisibleCards] = useState<Set<DashboardCardKey>>(allCards);

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
					{visibleCards.has("monitorStatus") && <MonitorStatusCard summary={summary} />}
					{visibleCards.has("monitorsByType") && (
						<MonitorsByTypeCard monitorsByType={monitorsByType} />
					)}
				</Box>
			</Stack>

			<EditCardsModal
				open={editOpen}
				visibleCards={visibleCards}
				onClose={() => setEditOpen(false)}
				onSave={(next) => {
					setVisibleCards(next);
					setEditOpen(false);
				}}
			/>
		</BasePage>
	);
};

export default Dashboard;
