import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
	Table,
	type Header,
	Pagination,
	StatusLabel,
} from "@/Components/design-elements";
import { HeatmapResponseTime, HistogramResponseTime } from "@/Components/common";
import { ActionsMenu } from "@/Components/actions-menu";
import { ArrowDown, ArrowUp } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePost } from "@/Hooks/UseApi";
import { useSelector } from "react-redux";

import type { Monitor } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/actions-menu";
import type { RootState } from "@/Types/state";
import { Checkbox } from "@/Components/inputs";
import { useTableSelection } from "@/Hooks/useTableSelection";

interface MonitorTableProps {
	monitors: Monitor[];
	refetch: () => void;
	setSelectedMonitor: (monitor: Monitor | null) => void;
	sortField: string;
	setSortField: (field: string) => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (order: "asc" | "desc") => void;
	count: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
	selectedRows?: string[];
	onSelectionChange?: (selected: string[]) => void;
}

export const MonitorTable = ({
	monitors,
	refetch,
	setSelectedMonitor,
	sortField,
	setSortField,
	sortOrder,
	setSortOrder,
	count,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
	selectedRows = [],
	onSelectionChange,
}: MonitorTableProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const chartType = useSelector((state: RootState) => state.ui?.chartType ?? "histogram");
	const { post } = usePost<Record<string, never>, Monitor>();

	const {
		isAllSelected,
		isSomeSelected,
		handleSelectAll,
		handleSelectRow,
		isRowSelected,
	} = useTableSelection(monitors, selectedRows, onSelectionChange);

	const handleSort = (e: React.MouseEvent, field: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (sortField === field) {
			const newOrder = sortOrder === "asc" ? "desc" : "asc";
			setSortOrder(newOrder);
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
		refetch();
	};

	const isBrowserOpenable = (monitor: Monitor): boolean => {
		if (monitor.type !== "http" && monitor.type !== "pagespeed") return false;
		return /^https?:\/\//i.test(monitor.url ?? "");
	};

	const getActions = (monitor: Monitor): ActionMenuItem[] => {
		const actions: ActionMenuItem[] = [];
		if (isBrowserOpenable(monitor)) {
			actions.push({
				id: 1,
				label: t("pages.common.monitors.actions.openSite"),
				action: () => {
					window.open(monitor.url, "_blank", "noreferrer");
				},
				closeMenu: true,
			});
		}
		actions.push(
			{
				id: 2,
				label: t("pages.common.monitors.actions.details"),
				action: () => {
					navigate(`${monitor.id}`);
				},
			},
			{
				id: 3,
				label: t("pages.common.monitors.actions.incidents"),
				action: () => {
					navigate(`/incidents?monitorId=${monitor.id}`);
				},
			},
			{
				id: 4,
				label: t("pages.common.monitors.actions.configure"),
				action: () => {
					navigate(`/uptime/configure/${monitor.id}`);
				},
			},
			{
				id: 6,
				label:
					monitor.isActive === false
						? t("pages.common.monitors.actions.resume")
						: t("pages.common.monitors.actions.pause"),
				action: async () => {
					await post(`/monitors/pause/${monitor.id}`, {} as Record<string, never>);
					refetch();
				},
				closeMenu: true,
			},
			{
				id: 7,
				label: (
					<Typography color={theme.palette.error.main}>
						{t("pages.common.monitors.actions.delete")}
					</Typography>
				),
				action: () => setSelectedMonitor(monitor),
				closeMenu: true,
			}
		);
		return actions;
	};

	const getHeaders = (chartType: string) => {
		const renderSortIcon = (isActive: boolean) => (
			<Box
				width={16}
				display="inline-flex"
				justifyContent="center"
			>
				{isActive ? (
					sortOrder === "asc" ? (
						<ArrowUp size={16} />
					) : (
						<ArrowDown size={16} />
					)
				) : null}
			</Box>
		);
		const headers: Header<Monitor>[] = [
			{
				id: "selection",
				content: (
					<Checkbox
						aria-label={t("pages.common.monitors.actions.selectAll")}
						indeterminate={isSomeSelected}
						checked={isAllSelected}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				mobileLabel: null,
				render: (row) => (
					<Checkbox
						aria-label={t("pages.common.monitors.actions.selectMonitor", {
							name: row.name,
						})}
						checked={isRowSelected(row.id)}
						onChange={(e) => {
							handleSelectRow(row.id, e.target.checked);
						}}
						onClick={(e) => e.stopPropagation()}
					/>
				),
				onClick: (e) => e?.stopPropagation(),
			},
			{
				id: "name",
				align: "left",
				mobileLabel: t("common.table.headers.name"),
				content: (
					<Stack
						gap={theme.spacing(4)}
						direction={"row"}
						alignItems={"center"}
						onClick={(e) => handleSort(e, "name")}
						sx={{ cursor: "pointer" }}
					>
						{t("common.table.headers.name")}
						{renderSortIcon(sortField === "name")}
					</Stack>
				),

				render: (row) => {
					return row?.name;
				},
			},
			{
				id: "status",
				mobileLabel: t("common.table.headers.status"),
				content: (
					<Stack
						gap={theme.spacing(4)}
						direction={"row"}
						justifyContent={"center"}
						alignItems={"center"}
						onClick={(e) => handleSort(e, "status")}
						sx={{ cursor: "pointer" }}
					>
						<Box width={theme.spacing(8)} />
						{t("common.table.headers.status")}
						{renderSortIcon(sortField === "status")}
					</Stack>
				),
				render: (row) => {
					return <StatusLabel status={row.status} />;
				},
			},
			{
				id: "histogram",
				content: t("pages.uptime.table.headers.responseTime"),
				render: (row) => {
					if (chartType === "histogram") {
						return <HistogramResponseTime checks={row.recentChecks} />;
					} else {
						return <HeatmapResponseTime checks={row.recentChecks} />;
					}
				},
			},
			{
				id: "type",
				mobileLabel: t("common.table.headers.type"),
				content: (
					<Stack
						gap={theme.spacing(4)}
						direction={"row"}
						justifyContent={"center"}
						alignItems={"center"}
						onClick={(e) => handleSort(e, "type")}
						sx={{ cursor: "pointer" }}
					>
						<Box width={theme.spacing(8)} />
						{t("common.table.headers.type")}
						{renderSortIcon(sortField === "type")}
					</Stack>
				),
				render: (row) => {
					return row.type;
				},
			},
			{
				id: "actions",
				content: t("common.table.headers.actions"),
				render: (row) => {
					return <ActionsMenu items={getActions(row)} />;
				},
			},
		];
		return headers;
	};

	const headers = getHeaders(chartType);

	return (
		<Box>
			<Table
				headers={headers}
				data={monitors}
				onRowClick={(row) => {
					navigate(`/uptime/${row.id}`);
				}}
				getRowSx={(row) => ({
					backgroundColor: isRowSelected(row.id)
						? theme.palette.action.selected
						: "inherit",
				})}
			/>
			<Pagination
				component="div"
				count={count}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_e, newPage) => setPage(newPage)}
				onRowsPerPageChange={(e) => setRowsPerPage(Number(e.target.value))}
				itemsOnPage={monitors.length}
			/>
		</Box>
	);
};
