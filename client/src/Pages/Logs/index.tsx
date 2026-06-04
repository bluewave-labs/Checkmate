import { BasePage, Tabs, Tab } from "@/Components/design-elements";
import { TabLogs } from "@/Pages/Logs/TabLogs";
import { TabQueue } from "@/Pages/Logs/TabQueue";
import { TabDiagnostics } from "@/Pages/Logs/TabDiagnostics";

import { useState } from "react";
import { useTranslation } from "react-i18next";

const LogsPage = () => {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<number>(1);
	return (
		<BasePage headerKey="logs">
			<Tabs
				value={activeTab}
				onChange={(_, newValue: number) => setActiveTab(newValue)}
			>
				<Tab label={t("pages.logs.tabs.logs")} />
				<Tab label={t("pages.logs.tabs.queue")} />
				<Tab label={t("pages.logs.tabs.diagnostics")} />
			</Tabs>
			{activeTab === 0 && <TabLogs />}
			{activeTab === 1 && <TabQueue />}
			{activeTab === 2 && <TabDiagnostics />}
		</BasePage>
	);
};

export default LogsPage;
