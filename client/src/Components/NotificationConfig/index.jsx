// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Search from "../Inputs/Search";

// Utils
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const NotificationConfig = ({ notifications, setMonitor, setNotifications }) => {
	// Local state
	const [notificationsSearch, setNotificationsSearch] = useState("");
	const [selectedNotifications, setSelectedNotifications] = useState([]);

	const handleSearch = (value) => {
		setSelectedNotifications(value);
		setMonitor((prev) => {
			return {
				...prev,
				notifications: value.map((notification) => notification._id),
			};
		});
	};

	// Handlers
	const handleDelete = (id) => {
		const updatedNotifications = selectedNotifications.filter(
			(notification) => notification._id !== id
		);

		setSelectedNotifications(updatedNotifications);
		setMonitor((prev) => {
			return {
				...prev,
				notifications: updatedNotifications.map((notification) => notification._id),
			};
		});
	};

	// Setup
	const theme = useTheme();

	useEffect(() => {
		if (setNotifications) {
			const toSet = setNotifications.map((notification) => {
				return notifications.find((n) => n._id === notification);
			});
			setSelectedNotifications(toSet);
		}
	}, [setNotifications, notifications]);

	return (
		<Stack gap={theme.spacing(6)}>
			<Search
				type="notifications"
				label="Notifications"
				options={notifications}
				filteredBy="notificationName"
				multiple={true}
				value={selectedNotifications}
				inputValue={notificationsSearch}
				handleInputChange={setNotificationsSearch}
				handleChange={(value) => {
					handleSearch(value);
				}}
			/>
			<Stack
				flex={1}
				width="100%"
			>
				{selectedNotifications.map((notification, index) => (
					<Stack
						direction="row"
						alignItems="center"
						key={notification._id}
						width="100%"
					>
						<Typography
							flexGrow={1} // <-- This will take up all available horizontal space
						>
							{notification.notificationName}
						</Typography>
						<DeleteOutlineRoundedIcon
							onClick={() => {
								handleDelete(notification._id);
							}}
							sx={{ cursor: "pointer" }}
						/>
						{index < selectedNotifications.length - 1 && <Divider />}
					</Stack>
				))}
			</Stack>
		</Stack>
	);
};

NotificationConfig.propTypes = {
	notifications: PropTypes.array,
	setMonitor: PropTypes.func,
	setNotifications: PropTypes.array,
};

export default NotificationConfig;
