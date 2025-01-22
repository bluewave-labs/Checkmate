import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Box, Tab, useTheme } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import ProfilePanel from "../../Components/TabPanels/Account/ProfilePanel";
import PasswordPanel from "../../Components/TabPanels/Account/PasswordPanel";
import TeamPanel from "../../Components/TabPanels/Account/TeamPanel";
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

	const requiredRoles = ["superadmin", "admin"];
	let tabList = ["Profile", "Password", "Team"];
	const hideTeams = !requiredRoles.some((role) => user.role.includes(role));
	if (hideTeams) {
		tabList = ["Profile", "Password"];
	}

	// Remove password for demo
	if (user.role.includes("demo")) {
		tabList = ["Profile"];
	}

	const handleKeyDown = (event) => {
		const currentIndex = tabList.findIndex((label) => label.toLowerCase() === tab);
		if (event.key === "Tab") {
			const nextIndex = (currentIndex + 1) % tabList.length;
			setFocusedTab(tabList[nextIndex].toLowerCase());
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
			backgroundColor={theme.palette.primary.main}
			border={1}
			borderColor={theme.palette.primary.lowContrast}
			borderRadius={theme.shape.borderRadius}
		>
			<TabContext value={tab}>
				<Box
					sx={{
						borderBottom: 1,
						borderColor: theme.palette.primary.lowContrast,
						"& .MuiTabs-root": { height: "fit-content", minHeight: "0" },
					}}
				>
					<TabList
						onChange={handleTabChange}
						aria-label="account tabs"
						sx={{
							"& .MuiTabs-indicator": {
								backgroundColor: theme.palette.tertiary.contrastText,
							},
						}}
					>
						{tabList.map((label, index) => (
							<Tab
								label={label}
								key={index}
								value={label.toLowerCase()}
								onKeyDown={handleKeyDown}
								onFocus={() => handleFocus(label.toLowerCase())}
								tabIndex={index}
								sx={{
									fontSize: 13,
									color: theme.palette.tertiary.contrastText,
									backgroundColor: theme.palette.tertiary.main,
									textTransform: "none",
									minWidth: "fit-content",
									paddingY: theme.spacing(6),
									fontWeight: 400,
									borderBottom: "2px solid transparent",
									borderRight: `1px solid ${theme.palette.primary.lowContrast}`,
									"&:first-child": { borderTopLeftRadius: "8px" },
									"&:last-child": { borderTopRightRadius: "8px", borderRight: 0 },
									"&:focus-visible": {
										color: theme.palette.primary.contrastText,
										borderColor: theme.palette.tertiary.contrastText,
										borderRightColor: theme.palette.primary.lowContrast,
									},
									"&.Mui-selected": {
										backgroundColor: theme.palette.secondary.main,
										color: theme.palette.secondary.contrastText,
										borderColor: theme.palette.secondary.contrastText,
										borderRightColor: theme.palette.primary.lowContrast,
									},
									"&:hover": {
										borderColor: theme.palette.primary.lowContrast,
									},
								}}
							/>
						))}
					</TabList>
				</Box>
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
