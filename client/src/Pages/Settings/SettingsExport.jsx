import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@/Components/v1/Dialog/index.jsx";
import { useState } from "react";
import { useLazyGet } from "@/Hooks/UseApi";

const SettingsDemoMonitors = ({ isAdmin, HEADER_SX, isLoading }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	// Local state
	const [isOpen, setIsOpen] = useState(false);

	if (!isAdmin) {
		return null;
	}
	const { get: fetchJson } = useLazyGet();

	const handleExport = async () => {
		const res = await fetchJson("/monitors/export/json");
		const json = res?.data ?? [];
		if (!json || json.length === 0) {
			return;
		}

		const blob = new Blob([JSON.stringify(json, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.href = url;
		link.download = "monitors.json";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		return;
	};

	return (
		<>
			<ConfigBox>
				<Box>
					<Typography
						component="h1"
						variant="h2"
					>
						Export monitors to JSON
					</Typography>
					<Typography sx={HEADER_SX}>
						Export your monitors data as a JSON file for backup or transfer.
					</Typography>
				</Box>
				<Box>
					<Button
						variant="contained"
						color="accent"
						loading={isLoading}
						onClick={handleExport}
						sx={{ mt: theme.spacing(4) }}
					>
						Export Monitors to JSON
					</Button>
				</Box>
			</ConfigBox>
		</>
	);
};

SettingsDemoMonitors.propTypes = {
	isAdmin: PropTypes.bool,
	HEADER_SX: PropTypes.object,
};

export default SettingsDemoMonitors;
