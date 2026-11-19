import { BasePage, Tabs, Tab, TabIcon } from "@/Components/design-elements";
import { Lock, User, Users, type LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { TabProfile } from "./TabProfile";
import { TabPassword } from "./TabPassword";
import { TabTeam } from "./TabTeam";
import type { RootState } from "@/Types/state";
import type { UserRole } from "@/Types/User";

const ACCOUNT_TABS: {
	key: AccountTabKey;
	labelKey: string;
	icon: LucideIcon;
	roles?: UserRole[];
}[] = [
	{ key: "profile", labelKey: "pages.account.tabs.profile", icon: User },
	{
		key: "password",
		labelKey: "pages.account.tabs.password",
		icon: Lock,
		roles: ["user", "admin", "superadmin"],
	},
	{
		key: "team",
		labelKey: "pages.account.tabs.team",
		icon: Users,
		roles: ["admin", "superadmin"],
	},
];

type AccountTabKey = "profile" | "password" | "team";

interface AccountProps {
	open?: AccountTabKey;
}

const Account = ({ open = "profile" }: AccountProps) => {
	const { t } = useTranslation();
	const userRoles = useSelector((state: RootState) => state.auth.user?.role) ?? [];
	const visibleTabs = ACCOUNT_TABS.filter(
		(tab) => !tab.roles || tab.roles.some((role) => userRoles.includes(role))
	);
	const [requestedTab, setRequestedTab] = useState<AccountTabKey>(open);
	const activeTab: AccountTabKey = visibleTabs.some((tab) => tab.key === requestedTab)
		? requestedTab
		: "profile";

	// Sync activeTab when open prop changes (e.g., navigating from sidebar)
	useEffect(() => {
		setRequestedTab(open);
	}, [open]);

	return (
		<BasePage headerKey="account">
			<Tabs
				value={activeTab}
				onChange={(_, value: AccountTabKey) => setRequestedTab(value)}
			>
				{visibleTabs.map((tab) => (
					<Tab
						key={tab.key}
						value={tab.key}
						label={t(tab.labelKey)}
						icon={<TabIcon icon={tab.icon} />}
					/>
				))}
			</Tabs>
			{activeTab === "profile" && <TabProfile />}
			{activeTab === "password" && <TabPassword />}
			{activeTab === "team" && <TabTeam />}
		</BasePage>
	);
};

export default Account;
