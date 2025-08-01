import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const Logo = ({ collapsed }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Stack
			pt={theme.spacing(6)}
			pb={theme.spacing(12)}
			pl={theme.spacing(8)}
			direction="row"
			alignItems="center"
			gap={theme.spacing(4)}
			onClick={() => navigate("/")}
			sx={{ cursor: "pointer" }}
		>
			<Typography
				pl={theme.spacing("1px")}
				minWidth={theme.spacing(16)}
				minHeight={theme.spacing(16)}
				display={"flex"}
				justifyContent={"center"}
				alignItems={"center"}
				backgroundColor={theme.palette.accent.main}
				borderRadius={theme.shape.borderRadius}
				color={theme.palette.accent.contrastText}
				fontSize={18}
			>
				C
			</Typography>
			<Box
				overflow={"hidden"}
				sx={{
					transition: "opacity 900ms ease",
					opacity: collapsed ? 0 : 1,
					whiteSpace: "nowrap",
					width: collapsed ? 0 : "auto",
				}}
			>
				{" "}
				<Typography
					lineHeight={1}
					mt={theme.spacing(2)}
					color={theme.palette.accent.contrastText}
					fontSize={"var(--env-var-font-size-medium-plus)"}
					sx={{ opacity: 0.8, fontWeight: 500 }}
				>
					{t("common.appName")}
				</Typography>
			</Box>
		</Stack>
	);
};

export default Logo;
