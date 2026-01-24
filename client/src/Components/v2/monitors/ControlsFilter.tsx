import Stack from "@mui/material/Stack";
import { Select, Button } from "@/Components/v2/inputs";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";

import type { MonitorType } from "@/Types/Monitor";
import { Typography, useTheme } from "@mui/material";

const types = ["http", "ping", "port", "docker"];
const statuses = ["up", "down"];
const states = ["active", "paused"];

export const ControlsFilter = ({
	selectedTypes,
	setSelectedTypes,
	selectedStatus,
	setSelectedStatus,
	selectedState,
	setSelectedState,
	onClearFilters,
}: {
	selectedTypes: MonitorType[];
	setSelectedTypes: React.Dispatch<React.SetStateAction<MonitorType[]>>;
	selectedStatus: string;
	setSelectedStatus: React.Dispatch<React.SetStateAction<string>>;
	selectedState: string;
	setSelectedState: React.Dispatch<React.SetStateAction<string>>;
	onClearFilters: () => void;
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isFilterActive =
		selectedTypes.length > 0 || selectedStatus !== "" || selectedState !== "";
	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			gap={theme.spacing(2)}
		>
			<Select
				multiple
				placeholder="Type"
				value={selectedTypes}
				onChange={(e) => setSelectedTypes(e.target.value as MonitorType[])}
			>
				{types.map((type) => (
					<MenuItem
						key={type}
						value={type}
					>
						<Typography textTransform={"capitalize"}>{type}</Typography>
					</MenuItem>
				))}
			</Select>
			<Select
				placeholder="Status"
				value={selectedStatus}
				onChange={(e) => setSelectedStatus(e.target.value)}
			>
				{statuses.map((status) => (
					<MenuItem
						key={status}
						value={status}
					>
						<Typography textTransform={"capitalize"}>{status}</Typography>
					</MenuItem>
				))}
			</Select>
			<Select
				placeholder="State"
				value={selectedState}
				onChange={(e) => setSelectedState(e.target.value)}
			>
				{states.map((state) => (
					<MenuItem
						key={state}
						value={state}
					>
						<Typography textTransform={"capitalize"}>{state}</Typography>
					</MenuItem>
				))}
			</Select>
			{isFilterActive && (
				<Button
					variant="contained"
					onClick={onClearFilters}
				>
					Clear Filters
				</Button>
			)}
		</Stack>
	);
};
