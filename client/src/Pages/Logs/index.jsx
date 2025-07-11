import Stack from "@mui/material/Stack";
import Breadcrumbs from "../../Components/Breadcrumbs";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Queue from "./Queue";
import LogsComponent from "./Logs";
import Diagnostics from "./Diagnostics";

import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const Logs = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Local state
	const [value, setValue] = useState(2);

	// Handlers
	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	const BREADCRUMBS = [{ name: t("logsPage.title"), path: "/logs" }];
	return (
		<Stack gap={theme.spacing(20)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Tabs
				value={value}
				onChange={handleChange}
			>
				<Tab label={t("logsPage.tabs.logs")} />
				<Tab label={t("logsPage.tabs.queue")} />
				<Tab label={t("logsPage.tabs.diagnostics")} />
			</Tabs>
			{value === 0 && <LogsComponent />}
			{value === 1 && <Queue />}
			{value === 2 && <Diagnostics />}
		</Stack>
	);
};

export default Logs;
