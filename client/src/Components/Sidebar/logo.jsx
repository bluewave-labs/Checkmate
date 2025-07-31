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
		>
			{/* TODO Abstract logo into component */}
			{/* TODO Turn logo into a link */}
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(4)}
				onClick={() => navigate("/")}
				sx={{ cursor: "pointer" }}
			>
				<Stack
					justifyContent="center"
					alignItems="center"
					minWidth={theme.spacing(16)}
					minHeight={theme.spacing(16)}
					pl="1px"
					fontSize={18}
					color={theme.palette.accent.contrastText}
					sx={{
						position: "relative",
						backgroundColor: theme.palette.accent.main,
						borderRadius: theme.shape.borderRadius,
						userSelect: "none",
					}}
				>
					C
				</Stack>
				<Box
					sx={{
						overflow: "hidden",
						transition: "opacity 900ms ease",
						opacity: collapsed ? 0 : 1,
						whiteSpace: "nowrap",
					}}
				>
					{" "}
					<Typography
						component="span"
						mt={theme.spacing(2)}
						color={theme.palette.accent.contrastText}
						fontSize={"var(--env-var-font-size-medium-plus)"}
						sx={{ opacity: 0.8, fontWeight: 500 }}
					>
						{t("common.appName")}
					</Typography>
				</Box>
			</Stack>
		</Stack>
	);
};

export default Logo;
