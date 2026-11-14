import Stack from "@mui/material/Stack";
import { Button, FilterChip } from "@/Components/inputs";
import { ColoredLabel } from "@/Components/design-elements";
import useMediaQuery from "@mui/material/useMediaQuery";

import {
	MonitorStateFilters,
	MonitorStatusFilters,
	type MonitorStateFilter,
	type MonitorStatusFilter,
	type MonitorType,
} from "@/Types/Monitor";
import type { Tag } from "@/Types/Tag";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CONTROL_HEIGHT } from "@/Utils/Theme/constants";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const types = ["http", "ping", "port", "game", "grpc", "websocket", "heartbeat"];
const typeDisplayNames: Record<string, string> = {
	http: "HTTP",
	ping: "Ping",
	port: "Port",
	game: "Game",
	grpc: "gRPC",
	websocket: "WebSocket",
	heartbeat: "Heartbeat",
};

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
	setSelectedTypes?: (types: MonitorType[]) => void;
	selectedStatus?: MonitorStatusFilter | "";
	setSelectedStatus?: (status: MonitorStatusFilter) => void;
	selectedState?: MonitorStateFilter | "";
	setSelectedState?: (state: MonitorStateFilter) => void;
	tagOptions?: Tag[];
	selectedTags?: string[];
	setSelectedTags?: (tags: string[]) => void;
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
	const anyLabel = t("common.filters.any");
	return (
		<Stack
			direction="row"
			flexWrap="wrap"
			alignItems="center"
			gap={theme.spacing(4)}
			width={isSmall ? "100%" : "auto"}
		>
			{showTypes && setSelectedTypes && (
				<FilterChip
					multiple
					label={t("common.table.headers.type")}
					anyLabel={anyLabel}
					value={selectedTypes ?? []}
					onChange={(value) => setSelectedTypes(value as MonitorType[])}
					options={types.map((type) => ({
						value: type,
						label: typeDisplayNames[type] ?? type,
					}))}
				/>
			)}
			{setSelectedStatus && (
				<FilterChip
					label={t("common.table.headers.status")}
					anyLabel={anyLabel}
					value={selectedStatus ?? ""}
					onChange={(value) => setSelectedStatus(value as MonitorStatusFilter)}
					options={MonitorStatusFilters.map((status) => ({
						value: status,
						label: capitalize(status),
					}))}
				/>
			)}
			{setSelectedState && (
				<FilterChip
					label={t("common.filters.state")}
					anyLabel={anyLabel}
					value={selectedState ?? ""}
					onChange={(value) => setSelectedState(value as MonitorStateFilter)}
					options={MonitorStateFilters.map((state) => ({
						value: state,
						label: capitalize(state),
					}))}
				/>
			)}
			{tagOptions && setSelectedTags && tagOptions.length > 0 && (
				<FilterChip
					multiple
					label={t("common.table.headers.tags")}
					anyLabel={anyLabel}
					value={selectedTags ?? []}
					onChange={setSelectedTags}
					options={tagOptions.map((tag: Tag) => ({
						value: tag.id,
						label: tag.name,
						content: (
							<ColoredLabel
								text={tag.name}
								color={tag.color}
							/>
						),
					}))}
				/>
			)}
			{isFilterActive && (
				<Button
					variant="text"
					onClick={onClearFilters}
					sx={{ height: CONTROL_HEIGHT.CHIP, color: theme.palette.neutral.borderHover }}
				>
					{t("common.buttons.clearFilters")}
				</Button>
			)}
		</Stack>
	);
};
