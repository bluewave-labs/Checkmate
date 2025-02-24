import { Box, Container, Typography, Stack, Card } from "@mui/material";
import {
	FaGlobe,
	FaTachometerAlt,
	FaServer,
	FaDocker,
	FaHeartbeat,
	FaExclamationTriangle,
	FaEnvelope,
	FaCalendarAlt,
	FaLock,
} from "react-icons/fa";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";

const features = [
	{
		title: "Website Monitoring",
		description:
			"Leverage our global network to ensure your website is always up and running, with real-time performance insights from every corner of the world.",
		icon: FaGlobe,
	},
	{
		title: "Page Speed Insights",
		description:
			"Optimize your site with precise speed metrics and recommendations, powered by data from a worldwide community of real users.",
		icon: FaTachometerAlt,
	},
	{
		title: "Infrastructure Monitoring",
		description:
			"Gain comprehensive visibility into your systems with community-driven insights on CPU, memory, and disk usage.",
		icon: FaServer,
	},
	{
		title: "Docker Monitoring",
		description:
			"Monitor container health and performance with real-time data from our extensive global network.",
		icon: FaDocker,
	},
	{
		title: "Ping Monitoring",
		description:
			"Ensure network reliability with customizable ping checks, supported by our distributed community infrastructure.",
		icon: FaHeartbeat,
	},
	{
		title: "Incident Management",
		description:
			"Stay ahead of issues with proactive incident management, backed by detailed status and impact analysis.",
		icon: FaExclamationTriangle,
	},
	{
		title: "Email Notifications",
		description:
			"Receive instant alerts when issues are detected, ensuring you're always informed.",
		icon: FaEnvelope,
	},
	{
		title: "Maintenance Windows",
		description:
			"Effortlessly schedule and manage maintenance with automated notifications.",
		icon: FaCalendarAlt,
	},
	{
		title: "Self-Hosted",
		description: "Deploy on your own infrastructure for complete control.",
		icon: FaLock,
	},
];

export default function FeatureGrid() {
	const theme = useTheme();
	const mode = useSelector((state) => state.ui.mode);

	return (
		<Box
			id="Features"
			sx={{
				py: 24,
				px: 12,
				color: theme.palette.primary.contrastText,
				backgroundImage:
					mode === "light"
						? `radial-gradient(circle at center, #ffffff, white)`
						: `radial-gradient(circle at center, #2a2547, black)`,
			}}
		>
			<Container
				sx={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: { xs: 6, sm: 12 },
				}}
			>
				<Box
					sx={{
						width: { sm: "100%", md: "80%" },
						textAlign: "center",
					}}
				>
					<Typography
						component="h2"
						variant="h4"
						gutterBottom
						fontFamily="BabaPro"
					>
						Features
					</Typography>
					<Typography
						variant="h6"
						sx={{
							color: theme.palette.secondary.contrastText,
							fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
						}}
					>
						Experience unparalleled distributed uptime monitoring, precise data
						extraction, and comprehensive speed testing. Our platform ensures optimal
						performance, real-time insights, and proactive issue resolution, powered by
						decentralized network of real user devices.
					</Typography>
				</Box>
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "1fr",
							sm: "repeat(2, 1fr)",
							md: "repeat(3, 1fr)",
						},
						gap: 6,
					}}
				>
					{features.map((feature, index) => (
						<Box
							key={index}
							sx={{ display: "flex", flexDirection: "column", height: "100%" }}
						>
							<Stack
								direction="column"
								component={Card}
								spacing={5}
								sx={{
									color: "inherit",
									p: 8,
									height: "100%",
									borderColor: "hsla(220, 25%, 25%, 0.3)",
									backgroundColor: "theme.palette.text.secondary",
								}}
							>
								<Box
									sx={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										width: 36,
										height: 36,
										borderRadius: "50%",
										bgcolor: theme.palette.primary.main,
										color: theme.palette.background.default,
									}}
								>
									<feature.icon
										size={18}
										color="currentColor"
									/>
								</Box>
								<div>
									<Typography
										variant="h6"
										gutterBottom
										sx={{ fontWeight: "medium" }}
									>
										{feature.title}
									</Typography>
									<Typography sx={{ color: theme.palette.secondary.contrastText }}>
										{feature.description}
									</Typography>
								</div>
							</Stack>
						</Box>
					))}
				</Box>
			</Container>
		</Box>
	);
}
