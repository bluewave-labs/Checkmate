// Components
import { Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const MonitorListItem = ({ monitor, onDelete }) => {
	const theme = useTheme();
	return (
		<Stack
			direction={"row"}
			alignItems={"center"}
			gap={theme.spacing(4)}
			width="100%"
		>
			<Typography flexGrow={1}>{monitor.name}</Typography>
			<DeleteIcon
				sx={{ cursor: "pointer" }}
				onClick={() => onDelete(monitor)}
			/>
		</Stack>
	);
};

MonitorListItem.propTypes = {
	monitor: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
	}).isRequired,
	onDelete: PropTypes.func.isRequired,
};

const MonitorList = ({ selectedMonitors, setSelectedMonitors }) => {
	const onDelete = (monitorToDelete) => {
		const newMonitors = selectedMonitors.filter(
			(monitor) => monitor._id !== monitorToDelete._id
		);
		setSelectedMonitors(newMonitors);
	};

	const theme = useTheme();

	return (
		<Stack
			gap={theme.spacing(6)}
			width="100%"
		>
			{selectedMonitors?.map((monitor) => (
				<MonitorListItem
					key={monitor._id}
					monitor={monitor}
					onDelete={onDelete}
				/>
			))}
		</Stack>
	);
};

MonitorList.propTypes = {
	selectedMonitors: PropTypes.arrayOf(
		PropTypes.shape({
			_id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
		})
	).isRequired,
	setSelectedMonitors: PropTypes.func.isRequired,
};

export default MonitorList;
