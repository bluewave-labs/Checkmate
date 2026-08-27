import { HeaderCreate } from "@/Components/common";
import { ColoredLabel, MonitorBasePageWithStates } from "@/Components/design-elements";
import { BulkActionsBar } from "@/Components/monitors/BulkActionsBar";
import { ControlsFilter } from "@/Components/monitors/ControlsFilter";
import { HeaderMonitorsSummary } from "@/Components/monitors/HeaderMonitorsSummary";
import { useIsAdmin } from "@/Hooks/useIsAdmin";
import type { MonitorListController } from "@/Hooks/useMonitorListController";
import { useMediaQuery, useTheme } from "@mui/material";
import { SPACING } from "@/Utils/Theme/constants";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TextField, Button, Dialog } from "@/Components/inputs";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";

interface MonitorListPageProps {
	headerKey: string;
	page: string;
	actionLink: string;
	controller: MonitorListController;
	bulkActions?: boolean;
	showTypeFilter?: boolean;
	summaryProps?: { showBreached?: boolean };
	priorityFallback?: ReactNode;
	extraLoading?: boolean;
	extraError?: unknown;
	children: ReactNode;
}

// Base monitor list page, all monitors pages are nearly identical, but with different tables.

export const MonitorListPage = ({
	headerKey,
	page,
	actionLink,
	controller: c,
	bulkActions,
	showTypeFilter,
	summaryProps,
	priorityFallback,
	extraLoading,
	extraError,
	children,
}: MonitorListPageProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const isAdmin = useIsAdmin();
	const isLoading = c.isLoading || Boolean(extraLoading);

	return (
		<MonitorBasePageWithStates
			headerKey={headerKey}
			loading={isLoading}
			error={c.error || extraError}
			totalCount={c.effectiveTotalCount}
			page={page}
			actionLink={actionLink}
			priorityFallback={priorityFallback}
		>
			<HeaderCreate
				path={actionLink}
				isLoading={isLoading}
				isAdmin={isAdmin}
			/>
			<HeaderMonitorsSummary
				summary={c.summary}
				{...summaryProps}
			/>
			<Stack
				direction={isSmall ? "column" : "row"}
				justifyContent={isSmall ? "flex-start" : "space-between"}
				gap={theme.spacing(4)}
			>
				<ControlsFilter
					{...(showTypeFilter === false
						? { showTypes: false }
						: {
								selectedTypes: c.selectedTypes,
								setSelectedTypes: c.setSelectedTypes,
							})}
					selectedStatus={c.selectedStatus}
					setSelectedStatus={c.setSelectedStatus}
					selectedState={c.selectedState}
					setSelectedState={c.setSelectedState}
					tagOptions={c.tags ?? []}
					selectedTags={c.selectedTags}
					setSelectedTags={c.setSelectedTags}
					onClearFilters={c.handleClearFilters}
				/>
				<TextField
					placeholder={t("pages.uptime.filters.search.placeholder")}
					value={c.search}
					onChange={(event) => {
						c.setSearch(event.target.value);
					}}
				/>
			</Stack>
			{c.selectedTags.length > 0 && (
				<Stack
					direction={isSmall ? "column" : "row"}
					alignItems={isSmall ? "flex-start" : "center"}
					flexWrap="wrap"
					gap={theme.spacing(SPACING.XL)}
				>
					<Typography color={theme.palette.text.secondary}>
						{t("pages.uptime.filters.activeTags")}
					</Typography>
					{c.selectedTags.map((tagId) => {
						const tag = c.tags?.find((t) => t.id === tagId);
						if (!tag) return null;
						return (
							<ColoredLabel
								key={tag.id}
								text={tag.name}
								color={tag.color}
							/>
						);
					})}
				</Stack>
			)}
			{bulkActions && !isLoading && (
				<BulkActionsBar
					selectedCount={c.selectedRows.length}
					onCancel={c.handleCancelSelection}
				>
					<Button
						size="small"
						startIcon={<Play size={16} />}
						onClick={c.handleBulkResume}
					>
						{t("common.buttons.resume")}
					</Button>
					<Button
						size="small"
						startIcon={<Pause size={16} />}
						onClick={c.handleBulkPause}
					>
						{t("common.buttons.pause")}
					</Button>
				</BulkActionsBar>
			)}
			{children}
			<Dialog
				open={c.isDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={c.handleConfirmDelete}
				onCancel={c.handleCancelDelete}
				loading={c.isDeleting}
			/>
		</MonitorBasePageWithStates>
	);
};
