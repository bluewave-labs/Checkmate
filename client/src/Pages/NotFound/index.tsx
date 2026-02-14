import NotFoundSvg from "@/assets/Images/sushi_404.svg";
import { Button } from "@/Components/v2/inputs";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

interface NotFoundProps {
	title?: string;
	desc?: string;
}

const NotFoundPage = ({ title, desc }: NotFoundProps) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const { t } = useTranslation();

	if (!title || title === "") {
		title = t("pages.notFound.title");
	}

	if (!desc || desc === "") {
		desc = t("pages.notFound.subtitle");
	}

	return (
		<Stack
			height="100vh"
			justifyContent="center"
		>
			<Stack
				gap={theme.spacing(2)}
				alignItems="center"
			>
				<Box
					component="img"
					src={NotFoundSvg}
					alt="404"
					maxHeight={"25rem"}
				/>
				<Typography
					component="h1"
					variant="h1"
				>
					{title}
				</Typography>
				<Typography variant="body1">{desc}</Typography>
				<Button
					variant="contained"
					color="primary"
					sx={{ mt: theme.spacing(10) }}
					onClick={() => navigate("/")}
				>
					{t("common.buttons.notFound")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default NotFoundPage;
