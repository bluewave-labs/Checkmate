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
				padding: theme.spacing(4),
				borderRadius: 3,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				backgroundColor: theme.palette.primary.main,
				border: isHighPriority
					? `${theme.spacing(1.5)} solid ${theme.palette.error.lowContrast}`
					: `${theme.spacing(1)} solid ${theme.palette.divider}`,
				boxShadow: theme.palette.tertiary.cardShadow,
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
							variant="h6"
							sx={{
								textTransform: "uppercase",
								fontWeight: 700,
								fontSize: theme.typography.h2.fontSize,

								letterSpacing: theme.spacing(0.5),
							}}
						>
							{title}
						</Typography>
					</Stack>
					<Divider />
				</Box>
			)}
			<Stack
				mt={theme.spacing(4)}
				paddingTop={theme.spacing(5)}
				gap={theme.spacing(4)}
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
