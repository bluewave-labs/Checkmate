import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import DataTable from "@/Components/v1/Table/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";

const DockerContainersTable = ({ containers = [] }) => {
	const theme = useTheme();

	// Helper to format uptime
	const formatUptime = (startedAt, finishedAt, running) => {
		if (!running && finishedAt > 0) {
			const stoppedAgo = Math.floor(Date.now() / 1000) - finishedAt;
			return formatDuration(stoppedAgo) + " ago";
		}
		if (running && startedAt > 0) {
			const uptimeSeconds = Math.floor(Date.now() / 1000) - startedAt;
			return formatDuration(uptimeSeconds);
		}
		return "N/A";
	};

	// Helper to format duration
	const formatDuration = (seconds) => {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		if (minutes > 0) return `${minutes}m`;
		return `${seconds}s`;
	};

	// Helper to get status color
	const getStatusColor = (status, running, healthy) => {
		if (status === "running" && healthy) return "success";
		if (status === "running" && !healthy) return "warning";
		if (status === "exited") return "error";
		if (status === "paused") return "warning";
		if (status === "restarting") return "warning";
		return "default";
	};

	const headers = [
		{
			id: "name",
			content: "Container Name",
			render: (row) => (
				<Box>
					<Typography
						variant="body2"
						fontWeight={600}
					>
						{row.container_name || "Unnamed"}
					</Typography>
					<Typography
						variant="caption"
						color="textSecondary"
					>
						{row.container_id ? row.container_id.substring(0, 12) : "N/A"}
					</Typography>
				</Box>
			),
		},
		{
			id: "status",
			content: "Status",
			render: (row) => (
				<StatusLabel
					status={getStatusColor(row.status, row.running, row.health?.healthy)}
					text={row.status || "unknown"}
				/>
			),
		},
		{
			id: "health",
			content: "Health",
			render: (row) => (
				<Box>
					<Typography
						variant="body2"
						color={row.health?.healthy ? "success.main" : "error.main"}
					>
						{row.health?.healthy ? "Healthy" : "Unhealthy"}
					</Typography>
					<Typography
						variant="caption"
						color="textSecondary"
					>
						{row.health?.source === "container_health_check" ? "HEALTHCHECK" : "State-based"}
					</Typography>
				</Box>
			),
		},
		{
			id: "image",
			content: "Image",
			render: (row) => (
				<Typography variant="body2">{row.base_image || "N/A"}</Typography>
			),
		},
		{
			id: "uptime",
			content: "Uptime",
			render: (row) => (
				<Typography variant="body2">
					{formatUptime(row.started_at, row.finished_at, row.running)}
				</Typography>
			),
		},
		{
			id: "ports",
			content: "Ports",
			render: (row) => (
				<Box>
					{row.exposed_ports && row.exposed_ports.length > 0 ? (
						row.exposed_ports.map((port, idx) => (
							<Typography
								key={idx}
								variant="caption"
								sx={{ display: "block" }}
							>
								{port.port}/{port.protocol}
							</Typography>
						))
					) : (
						<Typography
							variant="caption"
							color="textSecondary"
						>
							None
						</Typography>
					)}
				</Box>
			),
		},
	];

	if (!containers || containers.length === 0) {
		return (
			<Box
				sx={{
					padding: theme.spacing(12),
					textAlign: "center",
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: theme.spacing(2),
				}}
			>
				<Typography
					variant="body1"
					color="textSecondary"
				>
					No containers found
				</Typography>
			</Box>
		);
	}

	return (
		<Stack gap={theme.spacing(4)}>
			<Typography
				variant="h3"
				fontWeight={600}
			>
				Docker Containers ({containers.length})
			</Typography>
			<DataTable
				headers={headers}
				data={containers}
				config={{
					emptyView: "No containers found",
				}}
			/>
		</Stack>
	);
};

export default DockerContainersTable;
