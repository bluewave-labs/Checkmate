import Stack from "@mui/material/Stack";
import { Select, Button } from "@/Components/inputs";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";

const resolutionTypes = ["all", "manual", "automatic"];

interface ControlsIncidentFilterProps {
	monitors?: Monitor[];
	selectedMonitor: string;
	setSelectedMonitor: React.Dispatch<React.SetStateAction<string>>;
	selectedResolutionType: string;
	setSelectedResolutionType: React.Dispatch<React.SetStateAction<string>>;
	onClearFilters: () => void;
}

export const ControlsIncidentFilter = ({
	monitors,
	selectedMonitor,
	setSelectedMonitor,
	selectedResolutionType,
	setSelectedResolutionType,
	onClearFilters,
}: ControlsIncidentFilterProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isFilterActive =
		selectedMonitor !== "0" ||
		(selectedResolutionType !== "" && selectedResolutionType !== "all");

	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			gap={theme.spacing(2)}
		>
			<Select
				placeholder={t("pages.incidents.filters.monitor")}
				value={selectedMonitor}
				onChange={(e) => setSelectedMonitor(e.target.value)}
			>
				<MenuItem value="0">
					<Typography>{t("pages.incidents.filters.allMonitors")}</Typography>
				</MenuItem>
				{monitors?.map((monitor) => (
					<MenuItem
						key={monitor.id}
						value={monitor.id}
					>
						<Typography>{monitor.name}</Typography>
					</MenuItem>
				))}
			</Select>
			<Select
				placeholder={t("pages.incidents.filters.resolutionType")}
				value={selectedResolutionType}
				onChange={(e) => setSelectedResolutionType(e.target.value)}
			>
				{resolutionTypes.map((type) => (
					<MenuItem
						key={type}
						value={type}
					>
						<Typography textTransform="capitalize">
							{t(`pages.incidents.filters.resolutionTypes.${type}`)}
						</Typography>
					</MenuItem>
				))}
			</Select>
			{isFilterActive && (
				<Button
					variant="contained"
					onClick={onClearFilters}
				>
					{t("pages.incidents.filters.clearFilters")}
				</Button>
			)}
		</Stack>
	);
};
