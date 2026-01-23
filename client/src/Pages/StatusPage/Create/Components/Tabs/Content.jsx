// Components
import { Stack, Typography } from "@mui/material";
import { TabPanel } from "@mui/lab";
import MonitorList from "../MonitorList/index.jsx";
import Search from "@/Components/v1/Inputs/Search/index.jsx";
import Checkbox from "@/Components/v1/Inputs/Checkbox/index.jsx";
// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import ConfigStack from "./ConfigStack.jsx";
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
		const validMonitors = selectedMonitors.filter((monitor) => monitor?.id);
		handleFormChange({
			target: { name: "monitors", value: validMonitors.map((monitor) => monitor.id) },
		});
		setSelectedMonitors(validMonitors);
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
						<Checkbox
							id="showAdminLoginLink"
							name="showAdminLoginLink"
							label={t("showAdminLoginLink")}
							isChecked={form.showAdminLoginLink}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigStack>
			</Stack>
		</TabPanel>
	);
};

export default Content;
