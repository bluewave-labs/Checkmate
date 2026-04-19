import Typography from "@mui/material/Typography";
import { Table, ValueLabel } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";
import { ActionsMenu } from "@/Components/actions-menu";
import { DialogInput } from "@/Components/inputs/Dialog";

import prettyMilliseconds from "pretty-ms";
import { useTheme } from "@mui/material";
import type { Header } from "@/Components/design-elements/Table";
import type { ActionMenuItem } from "@/Components/actions-menu";
import type {
	MaintenanceWindow,
	GroupedMaintenanceWindows,
} from "@/Types/MaintenanceWindow";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/Types/state";
import Box from "@mui/material/Box";
import { setRowsPerPage } from "@/Features/UI/uiSlice";
import dayjs from "dayjs";
import { useState } from "react";
import { useDelete, usePatch, useGet } from "@/Hooks/UseApi";
import type { Monitor } from "@/Types/Monitor";

interface MaintenanceWindowTableProps {
	maintenanceWindows: MaintenanceWindow[];
	maintenanceWindowCount: number;
	page: number;
	setPage: (page: number) => void;
	refetch: () => void;
}

const getTimeToNextWindow = (
	startTime: string,
	endTime: string,
	repeat: number
): string => {
	const now = dayjs();
	let start = dayjs(startTime);
	let end = dayjs(endTime);

	// For repeating windows, advance to next occurrence
	if (repeat > 0) {
		while (end.isBefore(now)) {
			start = start.add(repeat, "milliseconds");
			end = end.add(repeat, "milliseconds");
		}
	}

	// Currently in maintenance window
	if (now.isAfter(start) && now.isBefore(end)) {
		return "In maintenance window";
	}

	// Window is in the future
	if (start.isAfter(now)) {
		return prettyMilliseconds(start.diff(now), { unitCount: 2, hideSeconds: true });
	}

	return "N/A";
};

const groupWindows = (windows: MaintenanceWindow[]): GroupedMaintenanceWindows[] => {
	const map = new Map<string, GroupedMaintenanceWindows>();
	for (const w of windows) {
		const key = `${w.name}_${w.start}_${w.end}`;
		if (!map.has(key)) {
			map.set(key, {
				id: w.id,
				name: w.name,
				start: w.start,
				end: w.end,
				repeat: w.repeat,
				active: w.active,
				monitors: [],
			});
		}
		map.get(key)!.monitors.push(w);
	}
	return Array.from(map.values());
};

export const MaintenanceWindowTable = ({
	maintenanceWindows,
	maintenanceWindowCount,
	page,
	setPage,
	refetch,
}: MaintenanceWindowTableProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const rowsPerPage = useSelector(
		(state: RootState) => state?.ui?.maintenance?.rowsPerPage ?? 5
	);

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedWindow, setSelectedWindow] = useState<MaintenanceWindow | null>(null);

	const { deleteFn, loading: deleteLoading } = useDelete();
	const { patch } = usePatch();
	const { data: monitorsData } = useGet<Monitor[]>("/monitors/team");
	const monitorsList = monitorsData ?? [];

	const handleDelete = async () => {
		if (!selectedWindow) return;
		const result = await deleteFn(`/maintenance-window/${selectedWindow.id}`);
		if (result) {
			refetch();
			setDeleteDialogOpen(false);
			setSelectedWindow(null);
		}
	};

	const handlePause = async (maintenanceWindow: MaintenanceWindow) => {
		const result = await patch(`/maintenance-window/${maintenanceWindow.id}`, {
			active: !maintenanceWindow.active,
		});
		if (result) {
			refetch();
		}
	};

	const getActions = (maintenanceWindow: MaintenanceWindow): ActionMenuItem[] => [
		{
			id: "edit",
			label: t("pages.common.monitors.actions.configure"),
			action: () => navigate(`/maintenance/create/${maintenanceWindow.id}`),
			closeMenu: true,
		},
		{
			id: "pause",
			label: maintenanceWindow.active
				? t("pages.common.monitors.actions.pause")
				: t("pages.common.monitors.actions.resume"),
			action: () => handlePause(maintenanceWindow),
			closeMenu: true,
		},
		{
			id: "remove",
			label: (
				<Typography color={theme.palette.error.main}>
					{t("pages.common.monitors.actions.delete")}
				</Typography>
			),
			action: () => {
				setSelectedWindow(maintenanceWindow);
				setDeleteDialogOpen(true);
			},
			closeMenu: true,
		},
	];

	const getHeaders = (): Header<GroupedMaintenanceWindows>[] => [
		{
			id: "name",
			content: t("common.table.headers.name"),
			render: (row) => row.name,
		},
		{
			id: "status",
			content: t("common.table.headers.status"),
			render: (row) => (
				<ValueLabel
					value={row.active ? "positive" : "neutral"}
					text={row.active ? t("common.labels.active") : t("common.labels.paused")}
				/>
			),
		},
		{
			id: "nextWindow",
			content: t("pages.maintenanceWindow.table.headers.nextWindow"),
			render: (row) => getTimeToNextWindow(row.start, row.end, row.repeat),
		},
		{
			id: "repeat",
			content: t("pages.maintenanceWindow.table.headers.repeat"),
			render: (row) =>
				row.repeat === 0
					? t("common.labels.na")
					: prettyMilliseconds(row.repeat, { verbose: true }),
		},
		{
			id: "monitors",
			content: t("common.table.headers.monitors", { defaultValue: "Monitors" }),
			render: (row) => row.monitors.length,
		},
	];

	const handlePageChange = (
		_e: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
	) => {
		dispatch(setRowsPerPage({ value: Number(e.target.value), table: "maintenance" }));
		setPage(0);
	};

	const grouped = groupWindows(maintenanceWindows);

	return (
		<Box>
			<Table
				headers={getHeaders()}
				data={grouped}
				expandableRows={true}
				renderExpandedContent={(row) => (
					<Box sx={{ pl: 2, pd: 2 }}>
						{row.monitors.map((monitor) => (
							<Box
								key={monitor.id}
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									py: 1,
									borderBottom: `1px solid`,
									borderColor: "divider",
									"&:last-child": { borderBottom: "none" },
								}}
							>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{monitorsList.find((m: Monitor) => m.id === monitor.monitorId)?.name ??
										monitor.monitorId}
								</Typography>
								<ActionsMenu items={getActions(monitor)} />
							</Box>
						))}
					</Box>
				)}
				emptyViewText={t("common.table.empty")}
			/>
			<Pagination
				itemsOnPage={grouped.length}
				component="div"
				count={maintenanceWindowCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
			/>
			<DialogInput
				open={deleteDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onCancel={() => {
					setDeleteDialogOpen(false);
					setSelectedWindow(null);
				}}
				onConfirm={handleDelete}
				loading={deleteLoading}
			/>
		</Box>
	);
};
