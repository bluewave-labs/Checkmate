import { Stack, styled } from "@mui/material";

export const ChartBox = styled(Stack)(({ theme }) => ({
	display: "grid",
	minHeight: 300,
	minWidth: 250,
	border: 1,
	borderStyle: "solid",
	borderColor: theme.palette.primary.lowContrast,
	borderRadius: 4,
	borderTopRightRadius: 16,
	borderBottomRightRadius: 16,
	backgroundColor: theme.palette.primary.main,
	"& h2": {
		color: theme.palette.primary.contrastTextSecondary,
		fontSize: 15,
		fontWeight: 500,
	},
	"& p": { color: theme.palette.primary.contrastTextTertiary },
	"& > :nth-of-type(1)": {
		gridColumn: 1,
		gridRow: 1,
		height: "fit-content",
		paddingTop: theme.spacing(8),
		paddingLeft: theme.spacing(8),
	},
	"& > :nth-of-type(2)": { gridColumn: 1, gridRow: 2 },
	"& > :nth-of-type(3)": {
		gridColumn: 2,
		gridRow: "span 2",
		padding: theme.spacing(8),
		borderLeft: 1,
		borderLeftStyle: "solid",
		borderLeftColor: theme.palette.primary.lowContrast,
		borderRadius: 16,
		backgroundColor: theme.palette.primary.main,
		background: `linear-gradient(325deg, ${theme.palette.tertiary.main} 20%, ${theme.palette.primary.main} 45%)`,
	},
	"& path": {
		transition: "stroke-width 400ms ease",
	},
}));
