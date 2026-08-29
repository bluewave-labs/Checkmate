import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { LayoutGrid } from "lucide-react";

import { BasePage, EmptyState } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { CardGrid } from "./Components/CardGrid";
import { CardPicker } from "./Components/CardPicker";
import { MonitorsContext, useMonitorsRequest } from "./useDashboardData";
import { useCardSelection } from "./useCardSelection";

/**
 * Answers "is anything wrong, and where" across every monitor type at once —
 * the question no single-type page can answer. Problems first and biggest.
 */
const Dashboard = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const monitorsRequest = useMonitorsRequest();
	const { cards, available, selected, addCard, removeCard, resetCards } =
		useCardSelection();
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
								<LayoutGrid
									size={14}
									strokeWidth={1.6}
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
						<CardGrid cards={cards} />
					)}
				</Stack>
				<CardPicker
					open={isPickerOpen}
					available={available}
					selected={selected}
					onAdd={addCard}
					onRemove={removeCard}
					onReset={resetCards}
					onClose={() => setIsPickerOpen(false)}
				/>
			</BasePage>
		</MonitorsContext.Provider>
	);
};

export default Dashboard;
