// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "../../Components/Breadcrumbs";
import Button from "@mui/material/Button";
import DataTable from "../../Components/Table";
import ActionMenu from "./components/ActionMenu";
import PageStateWrapper from "../../Components/PageStateWrapper";

// Utils
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
			id: "target",
			content: "Target",
			render: (row) => {
				return row.address;
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
			onClick: (e) => {
				e.stopPropagation();
			},
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

	return (
		<>
			<PageStateWrapper
				networkError={error}
				isLoading={isLoading}
				items={notifications}
				type="notifications"
				fallbackLink="/notifications/create"
			>
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
			</PageStateWrapper>
		</>
	);
};

export default Notifications;
