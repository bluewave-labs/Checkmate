// Components
import { Stack, Typography, Button } from "@mui/material";
import { TabPanel } from "@mui/lab";
import ConfigBox from "../../../../../Components/ConfigBox";
import MonitorList from "../MonitorList";
import Search from "../../../../../Components/Inputs/Search";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
const Content = ({
	tabValue,
	form,
	monitors,
	handleFormChange,
	errors,
	selectedMonitors,
	setSelectedMonitors,
}) => {
	// Local state
	const [search, setSearch] = useState("");

	// Handlers
	const handleMonitorsChange = (selectedMonitors) => {
		handleFormChange({
			target: { name: "monitors", value: selectedMonitors.map((monitor) => monitor._id) },
		});
		setSelectedMonitors(selectedMonitors);
	};

	// Utils
	const theme = useTheme();

	return (
		<TabPanel value={tabValue}>
			<Stack gap={theme.spacing(10)}>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography component="h2">Status page servers</Typography>
						<Typography component="p">
							You can add any number of servers that you monitor to your status page. You
							can also reorder them for the best viewing experience.
						</Typography>
					</Stack>
					<Stack>
						<Stack
							direction="row"
							justifyContent="space-between"
						>
							<Search
								options={monitors}
								multiple={true}
								filteredBy="name"
								value={selectedMonitors}
								inputValue={search}
								handleInputChange={setSearch}
								handleChange={handleMonitorsChange}
							/>
						</Stack>
						<Typography
							component="span"
							className="input-error"
							color={theme.palette.error.main}
							sx={{
								opacity: 0.8,
							}}
						>
							{errors["monitors"]}
						</Typography>
						<MonitorList
							selectedMonitors={selectedMonitors}
							setSelectedMonitors={handleMonitorsChange}
						/>
					</Stack>
				</ConfigBox>{" "}
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography component="h2">Features</Typography>
						<Typography component="p">Show more details on the status page</Typography>
					</Stack>
					<Stack sx={{ margin: theme.spacing(6) }}>
						<Checkbox
							id="showCharts"
							name="showCharts"
							label={`Show charts`}
							isChecked={form.showCharts}
							onChange={handleFormChange}
						/>
						<Checkbox
							id="showUptimePercentage"
							name="showUptimePercentage"
							label={`Show uptime percentage`}
							isChecked={form.showUptimePercentage}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigBox>
			</Stack>
			<Stack gap={theme.spacing(6)}></Stack>
		</TabPanel>
	);
};

export default Content;
