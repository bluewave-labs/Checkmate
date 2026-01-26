import { Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ButtonInput } from "../../inputs/Button";
import { useTranslation } from "react-i18next";

interface HeaderCreateProps {
	label?: string;
	path: string;
	isLoading?: boolean;
	isAdmin?: boolean;
}

export const HeaderCreate = ({
	label,
	path,
	isLoading = false,
	isAdmin = false,
}: HeaderCreateProps) => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	if (!isAdmin) {
		return null;
	}

	const handleClick = () => {
		navigate(path);
	};

	return (
		<Stack
			direction="row"
			justifyContent="flex-end"
			alignItems="center"
			width="100%"
		>
			<ButtonInput
				variant="contained"
				color="primary"
				onClick={handleClick}
				loading={isLoading}
			>
				{label || t("common.buttons.create")}
			</ButtonInput>
		</Stack>
	);
};
