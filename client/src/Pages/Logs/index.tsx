import { BasePage, Tabs, Tab, TabIcon } from "@/Components/design-elements";
import { ListOrdered, ScrollText, Stethoscope } from "lucide-react";
import { TabLogs } from "@/Pages/Logs/TabLogs";
import { TabQueue } from "@/Pages/Logs/TabQueue";
import { TabDiagnostics } from "@/Pages/Logs/TabDiagnostics";

import { useState } from "react";
import { useTranslation } from "react-i18next";

const LogsPage = () => {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<number>(0);
	return (
		<BasePage headerKey="logs">
			<Tabs
				value={activeTab}
				onChange={(_, newValue: number) => setActiveTab(newValue)}
			>
				<Tab
					label={t("pages.logs.tabs.logs")}
					icon={<TabIcon icon={ScrollText} />}
				/>
				<Tab
					label={t("pages.logs.tabs.queue")}
					icon={<TabIcon icon={ListOrdered} />}
				/>
				<Tab
					label={t("pages.logs.tabs.diagnostics")}
					icon={<TabIcon icon={Stethoscope} />}
				/>
			</Tabs>
			{activeTab === 0 && <TabLogs />}
			{activeTab === 1 && <TabQueue />}
			{activeTab === 2 && <TabDiagnostics />}
		</BasePage>
	);
};

export default LogsPage;
