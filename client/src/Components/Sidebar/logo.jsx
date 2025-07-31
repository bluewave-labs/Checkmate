import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const Logo = () => {
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
						color: theme.palette.accent.contrastText,
						borderRadius: theme.shape.borderRadius,
						userSelect: "none",
					}}
				>
					C
				</Stack>
				<Typography
					component="span"
					mt={theme.spacing(2)}
					sx={{ opacity: 0.8, fontWeight: 500 }}
				>
					{t("common.appName")}
				</Typography>
			</Stack>
		</Stack>
	);
};

export default Logo;
