import { BasePage, Tabs, Tab } from "@/Components/design-elements";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { TabProfile } from "./TabProfile";
import { TabPassword } from "./TabPassword";
import { TabTeam } from "./TabTeam";
import type { RootState } from "@/Types/state";
import type { UserRole } from "@/Types/User";
import { useNavigate } from "react-router";

const ACCOUNT_TABS: { key: AccountTabKey; labelKey: string; roles?: UserRole[] }[] = [
	{ key: "profile", labelKey: "pages.account.tabs.profile" },
	{
		key: "password",
		labelKey: "pages.account.tabs.password",
		roles: ["user", "admin", "superadmin"],
	},
	{ key: "team", labelKey: "pages.account.tabs.team", roles: ["admin", "superadmin"] },
];

type AccountTabKey = "profile" | "password" | "team";

interface AccountProps {
	open?: AccountTabKey;
}

const Account = ({ open = "profile" }: AccountProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const userRoles = useSelector((state: RootState) => state.auth.user?.role) ?? [];
	const visibleTabs = ACCOUNT_TABS.filter(
		(tab) => !tab.roles || tab.roles.some((role) => userRoles.includes(role))
	);
	const activeTab = visibleTabs.some((tab) => tab.key === open) ? open : "profile";

	useEffect(() => {
		if (activeTab !== open) {
			navigate("/account/profile");
		}
	}, [open, activeTab, navigate]);

	return (
		<BasePage headerKey="account">
			<Tabs
				value={activeTab}
				onChange={(_, value: AccountTabKey) => navigate(`/account/${value}`)}
			>
				{visibleTabs.map((tab) => (
					<Tab
						key={tab.key}
						value={tab.key}
						label={t(tab.labelKey)}
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
