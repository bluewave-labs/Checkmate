import { BasePage, Tabs, Tab } from "@/Components/v2/design-elements";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TabProfile } from "./TabProfile";
import { TabPassword } from "./TabPassword";
import { TabTeam } from "./TabTeam";

interface AccountProps {
	open?: "profile" | "password" | "team";
}

const TAB_MAP = {
	profile: 0,
	password: 1,
	team: 2,
} as const;

const Account = ({ open = "profile" }: AccountProps) => {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<number>(TAB_MAP[open]);

	// Sync activeTab when open prop changes (e.g., navigating from sidebar)
	useEffect(() => {
		setActiveTab(TAB_MAP[open]);
	}, [open]);

	return (
		<BasePage>
			<Tabs
				value={activeTab}
				onChange={(_, newValue: number) => setActiveTab(newValue)}
			>
				<Tab label={t("pages.account.tabs.profile")} />
				<Tab label={t("pages.account.tabs.password")} />
				<Tab label={t("pages.account.tabs.team")} />
			</Tabs>
			{activeTab === 0 && <TabProfile />}
			{activeTab === 1 && <TabPassword />}
			{activeTab === 2 && <TabTeam />}
		</BasePage>
	);
};

export default Account;
