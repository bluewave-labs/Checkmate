import Stack from "@mui/material/Stack";
import { Icon } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { Trash } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";

interface HeaderConfigStatusControlsProps {
	onDelete: () => void;
}

export const HeaderConfigStatusControls = ({
	onDelete,
}: React.PropsWithChildren<HeaderConfigStatusControlsProps>) => {
	const theme = useTheme();
	const translate = useTranslation();
	return (
		<Stack
			spacing={{ xs: theme.spacing(8), md: 0 }}
			direction={{ xs: "column", md: "row" }}
			alignItems={"center"}
			justifyContent={"end"}
		>
			<Button
				variant="contained"
				color="error"
				startIcon={<Icon icon={Trash} />}
				onClick={onDelete}
			>
				{translate.t("common.buttons.delete")}
			</Button>
		</Stack>
	);
};
