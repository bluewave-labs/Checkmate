import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Icon } from "@/Components/v2/design-elements";
import { Button } from "@/Components/v2/inputs";
import { Settings, ExternalLink } from "lucide-react";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { StatusPage } from "@/Types/StatusPage";

interface HeaderStatusPageControlsProps {
	isAdmin: boolean;
	statusPage: StatusPage;
	isPublic?: boolean;
}
export const HeaderStatusPageControls = ({
	isAdmin,
	statusPage,
	isPublic = false,
}: HeaderStatusPageControlsProps) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { t } = useTranslation();
	return (
		<Stack
			direction={"row"}
			alignItems={"center"}
			justifyContent={"space-between"}
			mb={4}
		>
			<Stack
				direction="row"
				gap={theme.spacing(4)}
				alignItems="baseline"
			>
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
					<>
						<Typography
							onClick={() => {
								window.open(
									`/status/uptime/public/${statusPage.url}`,
									"_blank",
									"noopener,noreferrer"
								);
							}}
							sx={{
								borderBottom: 1,
								borderColor: "transparent",
								":hover": {
									cursor: "pointer",
									borderBottom: 1,
								},
							}}
						>
							{t("publicLink")}
						</Typography>
						<Box>
							<ExternalLink size={14} />
						</Box>
					</>
				)}
			</Stack>
			{isAdmin && !isPublic && (
				<Button
					variant="contained"
					color="secondary"
					startIcon={<Icon icon={Settings} />}
					onClick={() => navigate(`status/uptime/configure/${statusPage.url}`)}
				>
					{t("common.buttons.configure")}
				</Button>
			)}
		</Stack>
	);
};
