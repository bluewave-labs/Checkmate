import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel, Gauge } from "@/Components/v2/design-elements";
import type { Header } from "@/Components/v2/design-elements/Table";
import { ActionsMenu, type ActionMenuItem } from "@/Components/v2/actions-menu";
import { ArrowUp, ArrowDown } from "lucide-react";

import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePost } from "@/Hooks/UseApi";

import type { Monitor } from "@/Types/Monitor";

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
}: {
	monitors: Monitor[];
	refetch: Function;
	setSelectedMonitor: Function;
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
	const {
		post,
		// loading: isPatching,
		// error: postError,
	} = usePost<any, Monitor>();

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
					navigate(`/infrastructure/configure/${monitor.id}`);
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
				id: "name",
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
				content: (
					<Typography
						component="div"
						display="inline-flex"
						alignItems="center"
						gap={theme.spacing(4)}
						onClick={(e) => handleSort(e, "status")}
						sx={{ cursor: "pointer" }}
					>
						{t("common.table.headers.status")}
						{renderSortIcon(sortField === "status")}
					</Typography>
				),
				render: (row) => {
					return (
						<StatusLabel
							status={row.status}
							isActive={row.isActive}
						/>
					);
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
