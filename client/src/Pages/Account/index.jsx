import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Box, Tab, useTheme } from "@mui/material";
import CustomTabList from "../../Components/Tab";
import TabContext from "@mui/lab/TabContext";
import ProfilePanel from "../../Components/TabPanels/Account/ProfilePanel";
import PasswordPanel from "../../Components/TabPanels/Account/PasswordPanel";
import TeamPanel from "../../Components/TabPanels/Account/TeamPanel";
import { useTranslation } from "react-i18next";
import "./index.css";

/**
 * Account component renders a settings page with tabs for Profile, Password, and Team settings.
 * @param {string} [props.open] - Specifies the initially open tab: 'profile', 'password', or 'team'.
 * @returns {JSX.Element}
 */
const Account = ({ open = "profile" }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [focusedTab, setFocusedTab] = useState(null); // Track focused tab
	const tab = open;
	const handleTabChange = (event, newTab) => {
		navigate(`/account/${newTab}`);
	};
	const { user } = useSelector((state) => state.auth);
	const { t } = useTranslation();

	const requiredRoles = ["superadmin", "admin"];
	let tabList = [
		{ name: t("menu.profile"), value: "profile" },
		{ name: t("menu.password"), value: "password" },
		{ name: t("menu.team"), value: "team" },
	];
	const hideTeams = !requiredRoles.some((role) => user.role.includes(role));
	if (hideTeams) {
		tabList = [
			{ name: t("menu.profile"), value: "profile" },
			{ name: t("menu.password"), value: "password" },
		];
	}

	// Remove password for demo
	if (user.role.includes("demo")) {
		tabList = [{ name: t("menu.profile"), value: "profile" }];
	}

	const handleKeyDown = (event) => {
		const currentIndex = tabList.findIndex((item) => item.value === tab);
		if (event.key === "Tab") {
			const nextIndex = (currentIndex + 1) % tabList.length;
			setFocusedTab(tabList[nextIndex].value);
		} else if (event.key === "Enter") {
			event.preventDefault();
			navigate(`/account/${focusedTab}`);
		}
	};

	const handleFocus = (tabName) => {
		setFocusedTab(tabName);
	};

	return (
		<Box
			className="account"
			px={theme.spacing(20)}
			py={theme.spacing(12)}
		>
			<TabContext value={tab}>
				<CustomTabList
					value={tab}
					onChange={handleTabChange}
					aria-label="account tabs"
				>
					{tabList.map((item, index) => (
						<Tab
							label={item.name}
							key={index}
							value={item.value}
							onKeyDown={handleKeyDown}
							onFocus={() => handleFocus(item.value)}
							tabIndex={index}
						/>
					))}
				</CustomTabList>
				<ProfilePanel />
				{user.role.includes("superadmin") && <PasswordPanel />}
				{!hideTeams && <TeamPanel />}
			</TabContext>
		</Box>
	);
};

Account.propTypes = {
	open: PropTypes.oneOf(["profile", "password", "team"]),
};

export default Account;
