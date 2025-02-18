import { Stack, Typography, Box } from "@mui/material";
import SolanaLogo from "../../../../../assets/icons/solana_logo.svg?react";
import { useTheme } from "@mui/material/styles";
const Footer = () => {
	const theme = useTheme();
	return (
		<Stack
			justifyContent="space-between"
			alignItems="center"
			spacing={2}
		>
			<Typography variant="h2">Made with ❤️ by UpRock & Bluewave Labs</Typography>
			<Stack
				width="100%"
				direction="row"
				gap={theme.spacing(2)}
				justifyContent="center"
				alignItems="center"
			>
				<Typography variant="h2">Built on</Typography>
				<SolanaLogo
					width={15}
					height={15}
				/>
				<Typography variant="h2">Solana</Typography>
			</Stack>
		</Stack>
	);
};

export default Footer;
