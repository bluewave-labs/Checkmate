import Stack from "@mui/material/Stack";
import { ButtonGroup, Button } from "@/Components/v2/Inputs";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { theme } from "@/Utils/Theme/v2/theme";

export const HeaderRange = ({
	range,
	setRange,
	loading,
}: {
	range: string;
	setRange: Function;
	loading: boolean;
}) => {
	const theme = useTheme();
	return (
		<Stack
			gap={theme.spacing(9)}
			direction="row"
			alignItems={"center"}
			justifyContent="flex-end"
		>
			<Typography variant="body2">{`Showing statistics for past ${range}`}</Typography>
			<ButtonGroup
				variant="contained"
				color={"primary"}
			>
				<Button
					color={range === "2h" ? "secondary" : "inherit"}
					onClick={() => setRange("2h")}
					loading={loading}
				>
					Recent
				</Button>
				<Button
					color={range === "24h" ? "secondary" : "inherit"}
					onClick={() => setRange("24h")}
					loading={loading}
				>
					Day
				</Button>
				<Button
					color={range === "7d" ? "secondary" : "inherit"}
					onClick={() => setRange("7d")}
					loading={loading}
				>
					7 days
				</Button>
				<Button
					color={range === "30d" ? "secondary" : "inherit"}
					onClick={() => setRange("30d")}
					loading={loading}
				>
					30 days
				</Button>
			</ButtonGroup>
		</Stack>
	);
};
