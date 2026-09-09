import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { LayoutGrid } from "lucide-react";

import { BasePage, EmptyState, Icon } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { CardGrid } from "./Components/CardGrid";
import { CardPicker } from "./Components/CardPicker";
import { MonitorsContext, useMonitorsRequest } from "./useDashboardData";
import { useCardSelection } from "./useCardSelection";

const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const monitorsRequest = useMonitorsRequest();
	const {
		cards,
		available,
		selected,
		addCard,
		removeCard,
		reorderCards,
		resetCards,
		selectAll,
		deselectAll,
		allSelected,
	} = useCardSelection();
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	return (
		<MonitorsContext.Provider value={monitorsRequest}>
			<BasePage headerKey="dashboard">
				<Stack gap={theme.spacing(LAYOUT.MD)}>
					<Stack
						direction="row"
						justifyContent="flex-end"
					>
						<Button
							variant="outlined"
							color="secondary"
							onClick={() => setIsPickerOpen(true)}
							startIcon={
								<Icon
									icon={LayoutGrid}
									size={16}
								/>
							}
						>
							{t("pages.dashboard.picker.trigger")}
						</Button>
					</Stack>
					{cards.length === 0 ? (
						<EmptyState
							title={t("pages.dashboard.empty.title")}
							description={t("pages.dashboard.empty.description")}
							actionText={t("pages.dashboard.picker.trigger")}
							onAction={() => setIsPickerOpen(true)}
						/>
					) : (
						<CardGrid
							cards={cards}
							onReorder={reorderCards}
						/>
					)}
				</Stack>
				<CardPicker
					open={isPickerOpen}
					available={available}
					selected={selected}
					allSelected={allSelected}
					onAdd={addCard}
					onRemove={removeCard}
					onSelectAll={selectAll}
					onDeselectAll={deselectAll}
					onReset={resetCards}
					onClose={() => setIsPickerOpen(false)}
				/>
			</BasePage>
		</MonitorsContext.Provider>
	);
};

export default Dashboard;
