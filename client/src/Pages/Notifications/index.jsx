// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "../../Components/Breadcrumbs";
import Button from "@mui/material/Button";
import DataTable from "../../Components/Table";
import Fallback from "../../Components/Fallback";
import ActionMenu from "./components/ActionMenu";

// Utils
import { useIsAdmin } from "../../Hooks/useIsAdmin";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import {
	useGetNotificationsByTeamId,
	useDeleteNotification,
} from "../../Hooks/useNotifications";
import { useTranslation } from "react-i18next";

const Notifications = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const BREADCRUMBS = [{ name: "notifications", path: "/notifications" }];
	const [updateTrigger, setUpdateTrigger] = useState(false);
	const isAdmin = useIsAdmin();
	const [notifications, isLoading, error] = useGetNotificationsByTeamId(updateTrigger);
	const [deleteNotification, isDeleting, deleteError] = useDeleteNotification();
	const { t } = useTranslation();
	// Handlers
	const triggerUpdate = () => {
		setUpdateTrigger(!updateTrigger);
	};

	const onDelete = (id) => {
		deleteNotification(id, triggerUpdate);
	};

	const headers = [
		{
			id: "name",
			content: "Name",
			render: (row) => {
				return row.notificationName;
			},
		},
		{
			id: "type",
			content: "Type",
			render: (row) => {
				return row.type;
			},
		},
		{
			id: "target",
			content: "Target",
			render: (row) => {
				const type = row.type;
				if (type === "email") {
					return row.address;
				}
				if (type === "webhook") {
					return row.config?.webhookUrl;
				}
				if (type === "pager_duty") {
					return row.config?.routingKey;
				}
			},
		},
		{
			id: "platform",
			content: "Platform",
			render: (row) => {
				return row?.config?.platform || row.type;
			},
		},

		{
			id: "actions",
			content: "Actions",
			render: (row) => {
				return (
					<ActionMenu
						notification={row}
						onDelete={onDelete}
					/>
				);
			},
		},
	];

	if (notifications?.length === 0) {
		return (
			<Fallback
				vowelStart={false}
				title={t("notifications.fallback.title")}
				checks={t("notifications.fallback.checks", { returnObjects: true })}
				link="/notifications/create"
				isAdmin={isAdmin}
			/>
		);
	}

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Stack
				direction="row"
				justifyContent="flex-end"
			>
				<Button
					variant="contained"
					color="accent"
					onClick={() => navigate("/notifications/create")}
				>
					{t("notifications.createButton")}
				</Button>
			</Stack>
			<Typography variant="h1">{t("notifications.createTitle")}</Typography>
			<DataTable
				config={{
					onRowClick: (row) => navigate(`/notifications/${row._id}`),
					rowSX: {
						cursor: "pointer",
						"&:hover td": {
							backgroundColor: theme.palette.tertiary.main,
							transition: "background-color .3s ease",
						},
					},
				}}
				headers={headers}
				data={notifications}
			/>
		</Stack>
	);
};

export default Notifications;
