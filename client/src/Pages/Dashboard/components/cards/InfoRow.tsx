import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { LAYOUT } from "@/Utils/Theme/constants";

interface InfoRowProps {
	label: string;
	value: React.ReactNode;
}

// Label and value side by side; below md the label becomes a heading above the value.
export const InfoRow = ({ label, value }: InfoRowProps) => {
	const theme = useTheme();

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			justifyContent="space-between"
			gap={{ xs: theme.spacing(LAYOUT.XS), md: 0 }}
		>
			<Typography fontWeight={{ xs: 500, md: "normal" }}>{label}</Typography>
			<Typography>{value}</Typography>
		</Stack>
	);
};
