import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
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
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";
import { usePost } from "@/Hooks/UseApi";
import { useSelector } from "react-redux";

import type { Monitor } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/actions-menu";
import type { RootState } from "@/Types/state";

export const MonitorTable = ({
	monitors,
	refetch,
	setSelectedMonitor,
	selectedMonitors,
	onSelectMonitor,
	onSelectAll,
	sortField,
	setSortField,
	sortOrder,
	setSortOrder,
	count,
	page,
	setPage,
	rowsPerPage,
	setRowsPerPage,
}: {
	monitors: Monitor[];
	refetch: Function;
	setSelectedMonitor: (monitor: Monitor | null) => void;
	selectedMonitors: string[];
	onSelectMonitor: (id: string) => void;
	onSelectAll: (ids: string[]) => void;
	sortField: string;
	setSortField: (field: string) => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (order: "asc" | "desc") => void;
	count: number;
	page: number;
	setPage: (page: number) => void;
	rowsPerPage: number;
	setRowsPerPage: (rowsPerPage: number) => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const chartType = useSelector((state: RootState) => state.ui?.chartType ?? "histogram");
	const {
		post,
		// loading: isPosting,
		// error: postError,
	} = usePost<any, Monitor>();

	const handleSort = (e: any, field: string) => {
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

	const getActions = (monitor: Monitor): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: t("pages.common.monitors.actions.openSite"),
				action: () => {
					window.open(monitor.url, "_blank", "noreferrer");
				},
				closeMenu: true,
			},
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
			// {
			//   id: 5,
			//   label: "Clone",
			//   action: () => {

			//   },
			// },
			{
				id: 6,
				label:
					monitor.isActive === false
						? t("pages.common.monitors.actions.resume")
						: t("pages.common.monitors.actions.pause"),
				action: async () => {
					await post(`/monitors/pause/${monitor.id}`, {});
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
			},
		];
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
				id: "select",
				content: isSmall ? (
					""
				) : (
					<Checkbox
						checked={monitors.length > 0 && selectedMonitors.length === monitors.length}
						indeterminate={
							selectedMonitors.length > 0 && selectedMonitors.length < monitors.length
						}
						onChange={(e) => {
							if (e.target.checked) {
								onSelectAll(monitors.map((m) => m.id));
							} else {
								onSelectAll([]);
							}
						}}
						onClick={(e) => e.stopPropagation()}
					/>
				),
				render: (row) => {
					return (
						<Checkbox
							checked={selectedMonitors.includes(row.id)}
							onChange={() => onSelectMonitor(row.id)}
							onClick={(e) => e.stopPropagation()}
						/>
					);
				},
			},
			{
				id: "name",
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
			{isSmall && (
				<Box
					px={1}
					pb={2}
				>
					<Stack
						direction="row"
						alignItems="center"
						spacing={1}
					>
						<Checkbox
							checked={monitors.length > 0 && selectedMonitors.length === monitors.length}
							indeterminate={
								selectedMonitors.length > 0 && selectedMonitors.length < monitors.length
							}
							onChange={(e) => {
								if (e.target.checked) {
									onSelectAll(monitors.map((m) => m.id));
								} else {
									onSelectAll([]);
								}
							}}
						/>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							{t("pages.common.monitors.bulkEdit.selectAll", "Select All")}
						</Typography>
					</Stack>
				</Box>
			)}
			<Table
				headers={headers}
				data={monitors}
				onRowClick={(row) => {
					navigate(`/uptime/${row.id}`);
				}}
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
