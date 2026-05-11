import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel, Gauge } from "@/Components/design-elements";
import type { Header } from "@/Components/design-elements/Table";
import { ActionsMenu, type ActionMenuItem } from "@/Components/actions-menu";
import { ArrowUp, ArrowDown } from "lucide-react";

import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePost } from "@/Hooks/UseApi";

import type { Monitor } from "@/Types/Monitor";
import { Checkbox } from "@/Components/inputs";

interface InfraMonitorsTableProps {
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

export const InfraMonitorsTable = ({
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
}: InfraMonitorsTableProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const { post } = usePost<Record<string, never>, Monitor>();

	const selectedSet = new Set(selectedRows);
	const isAllSelected =
		monitors.length > 0 && monitors.every((m) => selectedSet.has(m.id));
	const isSomeSelected = selectedRows.length > 0 && !isAllSelected;

	const handleSelectAll = (checked: boolean) => {
		onSelectionChange?.(checked ? monitors.map((m) => m.id) : []);
	};

	const handleSelectRow = (id: string, checked: boolean) => {
		if (!onSelectionChange) return;
		onSelectionChange(
			checked ? [...selectedRows, id] : selectedRows.filter((rowId) => rowId !== id)
		);
	};

	const isRowSelected = (id: string) => selectedSet.has(id);

	const handlePageChange = (
		_e: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
	) => {
		const value = Number(e.target.value);
		setPage(0);
		setRowsPerPage(value);
	};

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

	const getActions = (monitor: Monitor): ActionMenuItem[] => {
		return [
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
					navigate(`/infrastructure/configure/${monitor.id}`);
				},
			},
			{
				id: 6,
				label:
					monitor.isActive === false
						? t("common.buttons.resume")
						: t("common.buttons.pause"),
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
						{t("common.buttons.delete")}
					</Typography>
				),
				action: () => {
					setSelectedMonitor(monitor);
				},
				closeMenu: true,
			},
		];
	};

	const getHeaders = () => {
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
				hideMobileLabel: true,
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
					<Typography
						component="div"
						display="inline-flex"
						alignItems="center"
						gap={theme.spacing(4)}
						onClick={(e) => handleSort(e, "name")}
						sx={{ cursor: "pointer" }}
					>
						{t("common.table.headers.name")}
						{renderSortIcon(sortField === "name")}
					</Typography>
				),
				render: (row) => {
					return row.name;
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
				id: "cpu",
				content: t("pages.infrastructure.table.headers.cpu"),
				render: (row) => {
					const check = row.recentChecks?.[0];
					const cpuUsage = (check?.cpu?.usage_percent || 0) * 100;
					return <Gauge progress={cpuUsage} />;
				},
			},
			{
				id: "memory",
				content: t("pages.infrastructure.table.headers.memory"),
				render: (row) => {
					const check = row.recentChecks?.[0];
					const memoryUsage = (check?.memory?.usage_percent || 0) * 100;
					return <Gauge progress={memoryUsage} />;
				},
			},
			{
				id: "disk",
				content: t("pages.infrastructure.table.headers.disk"),
				render: (row) => {
					const check = row.recentChecks?.[0];

					const totalDiskUsage = check?.disk?.reduce(
						(acc, disk) => acc + (disk?.usage_percent || 0),
						0
					);
					const diskCount = check?.disk?.length || 1;
					const diskUsage = ((totalDiskUsage || 0) / diskCount) * 100;
					return <Gauge progress={diskUsage} />;
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

	let headers = getHeaders();

	if (isSmall) {
		headers = headers.filter((h) => h.id !== "histogram");
	}
	return (
		<Box>
			<Table
				headers={headers}
				data={monitors}
				onRowClick={(row) => {
					navigate(`/infrastructure/${row.id}`);
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
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
				itemsOnPage={monitors.length}
			/>
		</Box>
	);
};
