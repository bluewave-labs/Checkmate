import { Stack, styled } from "@mui/material";

const ConfigBox = styled(Stack)(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	justifyContent: "space-between",
	gap: theme.spacing(20),
	backgroundColor: theme.palette.background.main,
	border: 1,
	borderStyle: "solid",
	borderColor: theme.palette.border.light,
	borderRadius: theme.spacing(2),
	"& > *": {
		paddingTop: theme.spacing(12),
		paddingBottom: theme.spacing(18),
	},
	"& > div:first-of-type": {
		flex: 0.7,
		borderRight: 1,
		borderRightStyle: "solid",
		borderRightColor: theme.palette.border.light,
		paddingRight: theme.spacing(15),
		paddingLeft: theme.spacing(15),
	},
	"& > div:last-of-type": {
		flex: 1,
		paddingRight: theme.spacing(20),
		paddingLeft: theme.spacing(18),
	},
	"& h1, & h2": {
		color: theme.palette.text.secondary,
	},
	"& p": {
		color: theme.palette.text.tertiary,
	},
}));

export default ConfigBox;
