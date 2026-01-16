import { Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import { Box, Stack, Typography, Divider } from "@mui/material";
const SummaryCard = ({ children, isHighPriority = false, sx = {}, title = null }) => {
	const theme = useTheme();
	return (
		<Paper
			elevation={0}
			sx={{
				padding: "16px",
				borderRadius: theme.shape.borderRadius,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				backgroundColor: theme.palette.primary.main,
				border: `1px solid ${theme.palette.primary.lowContrast}`,
				color: theme.palette.primary.contrastTextTertiary,
				fontSize: theme.typography.body1.fontSize,
				...sx,
			}}
		>
			{title && (
				<Box>
					<Stack
						direction="row"
						sx={{
							padding: theme.spacing(2),
						}}
					>
						<Typography
							component="h2"
							sx={{
								textTransform: "uppercase",
								fontWeight: 500,
								fontSize: 13,
								color: theme.palette.primary.contrastTextSecondary,
							}}
						>
							{title}
						</Typography>
					</Stack>
					<Divider />
				</Box>
			)}
			<Stack
				mt={theme.spacing(2)}
				paddingTop={theme.spacing(2)}
				gap={theme.spacing(2)}
				sx={{ height: "100%" }}
			>
				{children}
			</Stack>
		</Paper>
	);
};
SummaryCard.propTypes = {
	children: PropTypes.node,
	isHighPriority: PropTypes.bool,
	sx: PropTypes.object,
	title: PropTypes.string,
};
export default SummaryCard;
