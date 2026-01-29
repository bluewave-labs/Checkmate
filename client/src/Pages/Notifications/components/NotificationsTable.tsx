import { ActionsMenu, type ActionMenuItem } from "@/Components/v2/actions-menu";
import Typography from "@mui/material/Typography";
import type { Header } from "@/Components/v2/design-elements/Table";
import { Table } from "@/Components/v2/design-elements";

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

	return (
		<Table
			headers={headers}
			data={notifications}
			onRowClick={(row) => {
				navigate(`/notifications/configure/${row.id}`);
			}}
		/>
	);
};
