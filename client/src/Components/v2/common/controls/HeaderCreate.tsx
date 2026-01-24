import { Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ButtonInput } from "../../inputs/Button";

interface HeaderCreateProps {
	label?: string;
	path: string;
}

export const HeaderCreate = ({ label = "Create", path }: HeaderCreateProps) => {
	const navigate = useNavigate();

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
			>
				{label}
			</ButtonInput>
		</Stack>
	);
};
