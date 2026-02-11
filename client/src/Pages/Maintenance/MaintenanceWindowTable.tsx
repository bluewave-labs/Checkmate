import Typography from "@mui/material/Typography";
import { Table, ValueLabel } from "@/Components/v2/design-elements";
import { Pagination } from "@/Components/v2/design-elements/Table";
import { ActionsMenu } from "@/Components/v2/actions-menu";
import { DialogInput } from "@/Components/v2/inputs/Dialog";

import prettyMilliseconds from "pretty-ms";
import { useTheme } from "@mui/material";
import type { Header } from "@/Components/v2/design-elements/Table";
import type { ActionMenuItem } from "@/Components/v2/actions-menu";
import type { MaintenanceWindow } from "@/Types/MaintenanceWindow";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/Types/state";
import Box from "@mui/material/Box";
import { setRowsPerPage } from "@/Features/UI/uiSlice";
import dayjs from "dayjs";
import { useState } from "react";
import { useDelete, usePatch } from "@/Hooks/UseApi";

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

	const getHeaders = (): Header<MaintenanceWindow>[] => [
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
			id: "actions",
			content: t("common.table.headers.actions"),
			render: (row) => <ActionsMenu items={getActions(row)} />,
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

	return (
		<Box>
			<Table
				headers={getHeaders()}
				data={maintenanceWindows}
				onRowClick={(row) => navigate(`/maintenance/create/${row.id}`)}
				emptyViewText={t("common.table.empty")}
			/>
			<Pagination
				itemsOnPage={maintenanceWindows.length}
				component="div"
				count={maintenanceWindowCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
			/>
			<DialogInput
				open={deleteDialogOpen}
				title={t("maintenanceTableActionMenuDialogTitle")}
				onCancel={() => {
					setDeleteDialogOpen(false);
					setSelectedWindow(null);
				}}
				onConfirm={handleDelete}
				confirmText={t("delete")}
				loading={deleteLoading}
			/>
		</Box>
	);
};
