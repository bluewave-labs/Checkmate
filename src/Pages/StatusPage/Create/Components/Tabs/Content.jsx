// Components
import { Stack, Typography } from "@mui/material";
import { TabPanel } from "@mui/lab";
import MonitorList from "../MonitorList";
import Search from "../../../../../Components/Inputs/Search";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import ConfigStack from "./ConfigStack";
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
	const { t } = useTranslation();

	return (
		<TabPanel value={tabValue}>
			<Stack gap={theme.spacing(10)}>
				<ConfigStack
					title={t("statusPageCreateTabsContent")}
					description={t("statusPageCreateTabsContentDescription")}
				>
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
				</ConfigStack>
				<ConfigStack
					title={t("features")}
					description={t("statusPageCreateTabsContentFeaturesDescription")}
				>
					<Stack>
						<Checkbox
							id="showCharts"
							name="showCharts"
							label={t("showCharts")}
							isChecked={form.showCharts}
							onChange={handleFormChange}
						/>
						<Checkbox
							id="showUptimePercentage"
							name="showUptimePercentage"
							label={t("showUptimePercentage")}
							isChecked={form.showUptimePercentage}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigStack>
			</Stack>
		</TabPanel>
	);
};

export default Content;
