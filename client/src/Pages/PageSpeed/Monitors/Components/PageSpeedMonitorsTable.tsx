import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Table, Pagination, StatusLabel } from "@/Components/v2/design-elements";
import { HistogramPageSpeed } from "@/Components/v2/monitors";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Header } from "@/Components/v2/design-elements/Table";
import { ActionsMenu } from "@/Components/v2/actions-menu";

import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { usePatch } from "@/Hooks/UseApi";

import type { Monitor, MonitorWithChecks } from "@/Types/Monitor";
import type { ActionMenuItem } from "@/Components/v2/actions-menu";

export const PageSpeedMonitorsTable = ({
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
	monitors: MonitorWithChecks[];
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
		patch,
		// loading: isPatching,
		// error: postError,
	} = usePatch<any, Monitor>();

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
					navigate(`/pagespeed/configure/${monitor.id}`);
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
					await patch(`/monitors/${monitor.id}/active`);
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
					return row.name;
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
				content: t("pages.pageSpeed.table.headers.pageSpeedScore"),
				render: (row) => {
					return (
						<Stack alignItems={"center"}>
							<HistogramPageSpeed
								checks={row.checks}
								status={row.status}
							/>
						</Stack>
					);
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
					navigate(`/pagespeed/${row.id}`);
				}}
			/>
			<Pagination
				component="div"
				count={count}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={handleRowsPerPageChange}
			/>
		</Box>
	);
};
