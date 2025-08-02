// NetworkStatBoxes.jsx
import DataUsageIcon from "@mui/icons-material/DataUsage";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";
import { Typography } from "@mui/material";

const INTERFACE_LABELS = {
	en0: "Ethernet/Wi-Fi (Primary)",
	wlan0: "Wi-Fi (Secondary)",
};

function formatBytes(bytes) {
	if (bytes === 0 || bytes == null) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Format numbers with commas
function formatNumber(num) {
	return num != null ? num.toLocaleString() : "0";
}

const NetworkStatBoxes = ({ shouldRender, net }) => {
	const filtered =
		net?.filter((iface) => iface.name === "en0" || iface.name === "wlan0") || [];

	if (!net?.length) {
		return <Typography>No network stats available.</Typography>;
	}

	return (
		<StatusBoxes
			shouldRender={shouldRender}
			flexWrap="wrap"
		>
			{filtered.map((iface) => (
				<>
					<StatBox
						heading={`${INTERFACE_LABELS[iface.name] || iface.name} - Bytes Sent`}
						subHeading={formatBytes(iface.bytes_sent)}
						icon={DataUsageIcon}
						iconProps={{ color: "action" }}
					/>
					<StatBox
						heading="Bytes Received"
						subHeading={formatBytes(iface.bytes_recv)}
						icon={DataUsageIcon}
						iconProps={{ color: "action", sx: { transform: "rotate(180deg)" } }}
					/>
					<StatBox
						heading="Packets Sent"
						subHeading={formatNumber(iface.packets_sent)}
						icon={NetworkCheckIcon}
						iconProps={{ color: "action" }}
					/>
					<StatBox
						heading="Packets Received"
						subHeading={formatNumber(iface.packets_recv)}
						icon={NetworkCheckIcon}
						iconProps={{ color: "action", sx: { transform: "rotate(180deg)" } }}
					/>
					<StatBox
						heading="Errors In"
						subHeading={formatNumber(iface.err_in)}
						icon={ErrorOutlineIcon}
						iconProps={{ color: "error" }}
					/>
					<StatBox
						heading="Errors Out"
						subHeading={formatNumber(iface.err_out)}
						icon={ErrorOutlineIcon}
						iconProps={{ color: "error" }}
					/>
				</>
			))}
		</StatusBoxes>
	);
};

export default NetworkStatBoxes;
