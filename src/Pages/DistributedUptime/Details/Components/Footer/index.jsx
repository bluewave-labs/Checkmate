import { Stack, Typography, Box } from "@mui/material";
import SolanaLogo from "../../../../../assets/icons/solana_logo.svg?react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const Footer = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack
			justifyContent="space-between"
			alignItems="center"
			spacing={2}
		>
			<Typography variant="h2">{t("distributedUptimeDetailsFooterHeading")}</Typography>
			<Stack
				width="100%"
				direction="row"
				gap={theme.spacing(2)}
				justifyContent="center"
				alignItems="center"
			>
				<Typography variant="h2">{t("distributedUptimeDetailsFooterBuilt")}</Typography>
				<SolanaLogo
					width={15}
					height={15}
				/>
				<Typography variant="h2">{t("distributedUptimeDetailsFooterSolana")}</Typography>
			</Stack>
		</Stack>
	);
};

export default Footer;
