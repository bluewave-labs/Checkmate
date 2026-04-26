import { ActionsMenu, type ActionMenuItem } from "@/Components/actions-menu";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Header } from "@/Components/design-elements/Table";
import { Table } from "@/Components/design-elements";
import { Pagination } from "@/Components/design-elements/Table";

import { useState } from "react";
import type { Notification } from "@/Types/Notification";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";

interface NotificationsTableProps {
	notifications: Notification[];
	setSelectedChannel: Function;
}

export const NotificationsTable = ({
	notifications,
	setSelectedChannel,
}: NotificationsTableProps) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const theme = useTheme();
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const getActions = (channel: Notification): ActionMenuItem[] => {
		return [
			{
				id: 1,
				label: t("pages.common.monitors.actions.configure"),
				action: () => {
					navigate(`/notifications/configure/${channel.id}`);
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
				action: async () => {
					setSelectedChannel(channel);
				},
				closeMenu: true,
			},
		];
	};

	const getHeaders = () => {
		const headers: Header<Notification>[] = [
			{
				id: "name",
				content: t("common.table.headers.name"),
				render: (row) => {
					return <Typography>{row?.notificationName}</Typography>;
				},
			},

			{
				id: "type",
				content: t("common.table.headers.type"),
				render: (row) => {
					return <Typography textTransform={"capitalize"}>{row?.type}</Typography>;
				},
			},
			{
				id: "destination",
				content: t("pages.notifications.table.headers.destination"),
				render: (row) => {
					return <Typography>{row?.address}</Typography>;
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

	const headers = getHeaders();

	const handlePageChange = (
		_e: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
	) => {
		setPage(0);
		setRowsPerPage(Number(e.target.value));
	};

	const pagedNotifications = notifications.slice(
		page * rowsPerPage,
		page * rowsPerPage + rowsPerPage
	);

	return (
		<Box>
			<Table
				headers={headers}
				data={pagedNotifications}
				onRowClick={(row) => {
					navigate(`/notifications/configure/${row.id}`);
				}}
			/>
			{notifications.length > 0 && (
				<Pagination
					component="div"
					count={notifications.length}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					itemsOnPage={pagedNotifications.length}
				/>
			)}
		</Box>
	);
};
