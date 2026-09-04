import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
export const HeaderLogs = ({
	lines,
	isValidating,
}: {
	lines: number;
	isValidating: boolean;
}) => {
	return (
		<Stack direction="row">
			<Typography>{`${lines} recent lines`}</Typography>
			{isValidating && "Refreshing..."}
		</Stack>
	);
};
