// Components
import { Box, Stack, Typography, Button } from "@mui/material";
import Image from "../../../../../Components/Image";
import SettingsIcon from "../../../../../assets/icons/settings-bold.svg?react";
import ThemeSwitch from "../../../../../Components/ThemeSwitch";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
//Utils
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const Controls = ({ isDeleteOpen, setIsDeleteOpen, isDeleting, url, type }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const location = useLocation();
	const currentPath = location.pathname;
	const navigate = useNavigate();

	if (currentPath.startsWith("/status/uptime/public")) {
		return null;
	}

	if (currentPath.startsWith("/status/distributed/public")) {
		return null;
	}

	return (
		<Stack
			direction="row"
			gap={theme.spacing(2)}
		>
			<Box>
				<Button
					variant="contained"
					color="error"
					onClick={() => setIsDeleteOpen(!isDeleteOpen)}
					loading={isDeleting}
				>
					{t("delete")}
				</Button>
			</Box>
			<Box>
				<Button
					variant="contained"
					color="secondary"
					onClick={() => {
						if (type === "uptime") {
							navigate(`/status/uptime/configure/${url}`);
						} else {
							navigate(`/status/distributed/configure/${url}`);
						}
					}}
					sx={{
						px: theme.spacing(5),
						"& svg": {
							mr: theme.spacing(3),
							"& path": {
								stroke: theme.palette.secondary.contrastText,
							},
						},
					}}
				>
					<SettingsIcon /> {t("configure")}
				</Button>
			</Box>
		</Stack>
	);
};

Controls.propTypes = {
	type: PropTypes.string,
	isDeleting: PropTypes.bool,
	url: PropTypes.string,
	isDeleteOpen: PropTypes.bool.isRequired,
	setIsDeleteOpen: PropTypes.func.isRequired,
};

const ControlsHeader = ({
	statusPage,
	isPublic,
	isDeleting,
	isDeleteOpen,
	setIsDeleteOpen,
	url,
	type = "uptime",
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const publicUrl =
		type === "uptime"
			? `/status/uptime/public/${url}`
			: `/status/distributed/public/${url}`;

	return (
		<Stack
			alignSelf="flex-start"
			direction="row"
			width="100%"
			gap={theme.spacing(2)}
			justifyContent="space-between"
			alignItems="flex-end"
		>
			<Stack
				direction="row"
				gap={theme.spacing(8)}
				alignItems="flex-end"
			>
				<Image
					shouldRender={statusPage?.logo?.data ? true : false}
					alt={"Company logo"}
					maxWidth={"300px"}
					maxHeight={"50px"}
					base64={statusPage?.logo?.data}
				/>
				<Typography
					variant="h1"
					overflow="hidden"
					textOverflow="ellipsis"
					sx={{
						maxWidth: { xs: "200px", sm: "100%" },
					}}
				>
					{statusPage?.companyName}
				</Typography>
				{statusPage?.isPublished && !isPublic && (
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="center"
						onClick={() => {
							window.open(publicUrl, "_blank", "noopener,noreferrer");
						}}
						sx={{
							display: "inline-flex",
							":hover": {
								cursor: "pointer",
								borderBottom: 1,
							},
						}}
					>
						<Typography>{t("publicLink")}</Typography>
						<ArrowOutwardIcon />
					</Stack>
				)}
			</Stack>
			<Controls
				isDeleting={isDeleting}
				isDeleteOpen={isDeleteOpen}
				setIsDeleteOpen={setIsDeleteOpen}
				url={url}
				type={type}
			/>
			{isPublic && <ThemeSwitch />}
		</Stack>
	);
};

ControlsHeader.propTypes = {
	url: PropTypes.string,
	statusPage: PropTypes.object,
	isPublic: PropTypes.bool,
	isDeleting: PropTypes.bool,
	isDeleteOpen: PropTypes.bool.isRequired,
	setIsDeleteOpen: PropTypes.func.isRequired,
	type: PropTypes.string,
};

export default ControlsHeader;
