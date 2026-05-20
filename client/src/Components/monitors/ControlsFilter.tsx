import Stack from "@mui/material/Stack";
import { Select, Autocomplete, Button, TextField } from "@/Components/inputs";
import { ColoredLabel } from "@/Components/design-elements";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";

import type { MonitorType } from "@/Types/Monitor";
import type { Tag } from "@/Types/Tag";
import { Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

const types = ["http", "ping", "port", "docker", "game", "grpc", "websocket"];
const typeDisplayNames: Record<string, string> = {
	http: "HTTP",
	ping: "Ping",
	port: "Port",
	docker: "Docker",
	game: "Game",
	grpc: "gRPC",
	websocket: "WebSocket",
};
const statuses = ["up", "down"];
const states = ["active", "paused"];

export const ControlsFilter = ({
	showTypes = true,
	selectedTypes,
	setSelectedTypes,
	selectedStatus,
	setSelectedStatus,
	selectedState,
	setSelectedState,
	tagOptions,
	selectedTags,
	setSelectedTags,
	onClearFilters,
}: {
	showTypes?: boolean;
	selectedTypes?: MonitorType[];
	setSelectedTypes?: React.Dispatch<React.SetStateAction<MonitorType[]>>;
	selectedStatus?: string;
	setSelectedStatus?: React.Dispatch<React.SetStateAction<string>>;
	selectedState?: string;
	setSelectedState?: React.Dispatch<React.SetStateAction<string>>;
	tagOptions?: Tag[];
	selectedTags?: string[];
	setSelectedTags?: React.Dispatch<React.SetStateAction<string[]>>;
	onClearFilters: () => void;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isFilterActive =
		(selectedTypes?.length ?? 0) > 0 ||
		Boolean(selectedStatus) ||
		Boolean(selectedState) ||
		(selectedTags?.length ?? 0) > 0;
	const selectedTagObjects = (tagOptions ?? []).filter((tag) =>
		(selectedTags ?? []).includes(tag.id)
	);
	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			gap={theme.spacing(2)}
		>
			{showTypes && setSelectedTypes && (
				<Select
					multiple
					placeholder="Type"
					value={selectedTypes ?? []}
					onChange={(e) => setSelectedTypes(e.target.value as MonitorType[])}
				>
					{types.map((type) => (
						<MenuItem
							key={type}
							value={type}
						>
							<Typography>{typeDisplayNames[type] ?? type}</Typography>
						</MenuItem>
					))}
				</Select>
			)}
			{setSelectedStatus && (
				<Select
					placeholder="Status"
					value={selectedStatus ?? ""}
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
			)}
			{setSelectedState && (
				<Select
					placeholder="State"
					value={selectedState ?? ""}
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
			)}
			{tagOptions && setSelectedTags && (
				<Autocomplete
					multiple
					options={tagOptions}
					value={selectedTagObjects}
					getOptionLabel={(option) => option.name}
					onChange={(_: unknown, newValue: Tag[]) => {
						setSelectedTags(newValue.map((tag) => tag.id));
					}}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					renderOptionContent={(option) => (
						<ColoredLabel
							text={option.name}
							color={option.color}
						/>
					)}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder={t("common.table.headers.tags")}
						/>
					)}
					slotProps={{
						popper: {
							sx: { width: "fit-content !important", minWidth: 280 },
						},
					}}
					sx={{ minWidth: 180 }}
				/>
			)}
			{isFilterActive && (
				<Button
					variant="contained"
					onClick={onClearFilters}
				>
					{t("common.buttons.clearFilters")}
				</Button>
			)}
		</Stack>
	);
};
