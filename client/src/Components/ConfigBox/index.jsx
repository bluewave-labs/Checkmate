import { Stack, styled } from "@mui/material";

const ConfigBox = styled(Stack)(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	justifyContent: "space-between",
	backgroundColor: theme.palette.primary.main,
	border: 1,
	borderStyle: "solid",
	borderColor: theme.palette.primary.lowContrast,
	borderRadius: theme.spacing(2),
	"& > *": {
		paddingTop: theme.spacing(15),
		paddingBottom: theme.spacing(15),
	},
	"& > div:first-of-type": {
		flex: 0.7,
		borderRight: 1,
		borderRightStyle: "solid",
		borderRightColor: theme.palette.primary.lowContrast,
		paddingRight: theme.spacing(15),
		paddingLeft: theme.spacing(15),
		backgroundColor: theme.palette.tertiary.background,
		"& :is(h1, h2):first-of-type": {
			fontWeight: 600,
			marginBottom: theme.spacing(4),
		},
	},
	"& > div:last-of-type": {
		flex: 1,
		paddingRight: theme.spacing(20),
		paddingLeft: theme.spacing(20),
	},
	"& h1, & h2": {
		color: theme.palette.primary.contrastTextSecondary,
	},
}));

export default ConfigBox;
