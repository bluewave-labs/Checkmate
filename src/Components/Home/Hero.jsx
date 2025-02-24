import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { styled, useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { ArcadeEmbed } from "./ArcadeEmbed";
import RoundGradientButton from "../Buttons/RoundGradientButton";

const GradientText = styled(Typography)(({ theme }) => ({
	fontSize: "inherit",
	fontFamily: "BabaPro",
	background: "linear-gradient(90deg, #842bd2, #ff5451, #8c52ff, #00bf63, #842bd2)",
	backgroundSize: "400% 400%",
	WebkitBackgroundClip: "text",
	WebkitTextFillColor: "transparent",
	animation: "gradientAnimation 8s ease infinite",
	"@keyframes gradientAnimation": {
		"0%": { backgroundPosition: "0% 50%" },
		"50%": { backgroundPosition: "100% 50%" },
		"100%": { backgroundPosition: "0% 50%" },
	},
}));

const Hero = () => {
	const theme = useTheme();
	const mode = useSelector((state) => state.ui.mode);

	return (
		<Box
			id="hero"
			sx={{
				width: "100%",
				backgroundRepeat: "no-repeat",
				px: 12,
				backgroundImage:
					mode === "light"
						? "radial-gradient(ellipse 80% 50% at 50% -34%, hsl(215deg 100% 16%), transparent)"
						: "radial-gradient(ellipse 80% 50% at 50% -34%, hsl(265deg 100% 20%), transparent)",
			}}
		>
			<Container
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					pt: { xs: 60, sm: 80 },
					pb: { xs: 8, sm: 12 },
				}}
			>
				<Stack
					spacing={4}
					sx={{ alignItems: "center", width: { xs: "100%", sm: "70%" }, mb: 10 }}
				>
					<Typography
						variant="h2"
						sx={{
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							alignItems: "center",
							justifyContent: "center",
							fontSize: "clamp(0.8rem, 4vw, 3rem)",
							textAlign: "center",
							fontFamily: "BabaPro",
						}}
					>
						<GradientText
							component="span"
							variant="h2"
						>
							UpRock&nbsp;Prism
						</GradientText>
					</Typography>
					<Typography
						variant="h1"
						sx={{
							fontSize: "clamp(2rem, 6vw, 4.5rem)",
							textAlign: "center",
							fontFamily: "BabaPro",
							color: theme.palette.primary.contrastText,
						}}
					>
						Unmatched Uptime Monitoring
					</Typography>
					<Typography
						sx={{
							textAlign: "center",
							color: theme.palette.primary.contrastText,
							width: { xs: "100%", sm: "100%", md: "80%" },
							lineHeight: 1.5,
							fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
						}}
					>
						Elevate your digital presence with UpRock Prism, the first decentralized data
						network for uptime monitoring and distributed performance testing. Gain
						unparalleled insights from every corner of the world.
					</Typography>
					<Stack
						direction="row"
						justifyContent="center"
						spacing={2}
						sx={{ pt: 10, pb: 6, width: "100%" }}
					>
						<RoundGradientButton
							variant="contained"
							className="gradient-button"
							href="/login"
						>
							Launch App
						</RoundGradientButton>
					</Stack>
					<Typography
						variant="caption"
						color={theme.palette.secondary.contrastText}
						sx={{ textAlign: "center" }}
					>
						By clicking &quot;Launch App&quot; you agree to our&nbsp;
						<Link
							href="https://uprock.com/terms-of-use"
							color={theme.palette.primary.contrastText}
						>
							Terms of Use
						</Link>
						.
					</Typography>
				</Stack>
				<ArcadeEmbed />
			</Container>
		</Box>
	);
};

export default Hero;
