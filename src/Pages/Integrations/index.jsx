import PropTypes from "prop-types";
import { Stack, Typography, Grid, Button } from "@mui/material";
import { useTheme } from "@emotion/react";
import Discord from "../../assets/icons/discord-icon.svg?react";
import Slack from "../../assets/icons/slack-icon.svg?react";
import Zapier from "../../assets/icons/zapier-icon.svg?react";

import "./index.css";

/**
 * Integrations component
 * @param {Object} props - Props for the IntegrationsComponent.
 * @param {string} props.icon - The icon for the integration image.
 * @param {string} props.header - The header for the integration.
 * @param {string} props.info - Information about the integration.
 * @param {Function} props.onClick - The onClick handler for the integration button.
 * @returns {JSX.Element} The JSX representation of the IntegrationsComponent.
 */
const IntegrationsComponent = ({ icon, header, info, onClick }) => {
	const theme = useTheme();

	return (
		<Grid
			item
			lg={6}
			flexGrow={1}
		>
			<Stack
				direction="row"
				justifyContent="space-between"
				gap={theme.spacing(12)}
				p={theme.spacing(8)}
				pl={theme.spacing(12)}
				height="100%"
				border={1}
				borderColor={theme.palette.primary.lowContrast}
				borderRadius={theme.shape.borderRadius}
				backgroundColor={theme.palette.primary.main}
			>
				{icon}
				<Stack
					gap={theme.spacing(2)}
					flex={1}
				>
					<Typography component="h1">{header}</Typography>
					<Typography
						sx={{
							maxWidth: "300px",
							wordWrap: "break-word",
						}}
					>
						{info}
					</Typography>
				</Stack>
				<Button
					variant="contained"
					color="accent"
					onClick={onClick}
					sx={{ alignSelf: "center" }}
					disabled={true}
				>
					Add
				</Button>
			</Stack>
		</Grid>
	);
};

// PropTypes for IntegrationsComponent
IntegrationsComponent.propTypes = {
	icon: PropTypes.object.isRequired,
	header: PropTypes.string.isRequired,
	info: PropTypes.string.isRequired,
	onClick: PropTypes.func.isRequired,
};

/**
 * Integrations Page Component
 * @returns {JSX.Element} The JSX representation of the Integrations page.
 */

const Integrations = () => {
	const theme = useTheme();

	const integrations = [
		{
			icon: (
				<Slack
					alt="slack integration"
					style={{ width: "45px", height: "45px", alignSelf: "center" }}
				/>
			),
			header: "Slack",
			info: "Connect with Slack and see incidents in a channel",
			onClick: () => {},
		},
		{
			icon: (
				<Discord
					alt="discord integration"
					style={{ width: "42px", height: "42px", alignSelf: "center" }}
				/>
			),
			header: "Discord",
			info: "Connect with Discord and view incidents directly in a channel",
			onClick: () => {},
		},
		{
			icon: (
				<Zapier
					alt="zapier integration"
					style={{ width: "42px", height: "42px", alignSelf: "center" }}
				/>
			),
			header: "Zapier",
			info: "Send all incidents to Zapier, and then see them everywhere",
			onClick: () => {},
		},
		// Add more integrations as needed
	];

	return (
		<Stack
			className="integrations"
			pt={theme.spacing(20)}
			gap={theme.spacing(2)}
			sx={{
				"& h1, & p": {
					color: theme.palette.primary.contrastTextSecondary,
				},
			}}
		>
			<Typography component="h1">Integrations</Typography>
			<Typography mb={theme.spacing(12)}>
				Connect Checkmate to your favorite service.
			</Typography>
			<Grid
				container
				spacing={theme.spacing(12)}
			>
				{integrations.map((integration, index) => (
					<IntegrationsComponent
						key={index}
						icon={integration.icon}
						header={integration.header}
						info={integration.info}
						onClick={integration.onClick}
					/>
				))}
			</Grid>
		</Stack>
	);
};

export default Integrations;
