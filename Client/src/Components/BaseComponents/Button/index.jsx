import { styled } from "@mui/material/styles";
import { Button as MuiButton } from "@mui/material";

export const Button = styled(MuiButton)(({ theme }) => ({
	disableRipple: true,
	fontWeight: 400,
	borderRadius: 4,
	boxShadow: "none",
	textTransform: "none",
	"&:focus": {
		outline: "none",
	},
	"&:hover": {
		boxShadow: "none",
	},
	"&.MuiLoadingButton-root": {
		"&:disabled": {
			backgroundColor: theme.palette.secondary.main,
			color: theme.palette.text.primary,
		},
	},
	"&.MuiLoadingButton-loading": {
		"& .MuiLoadingButton-label": {
			color: "transparent",
		},
		"& .MuiLoadingButton-loadingIndicator": {
			color: "inherit",
		},
	},
	variants: [
		{
			props: (props) => props.variant === "group",
			style: {
				color: theme.palette.secondary.contrastText,
				backgroundColor: theme.palette.background.main,
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.border.light,
			},
		},
		{
			props: (props) => props.variant === "group" && props.filled === "true",
			style: {
				backgroundColor: theme.palette.secondary.main,
			},
		},
		{
			props: (props) => props.variant === "contained" && props.color === "secondary",
			style: {
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.border.light,
			},
		},
		{
			props: (props) => {
				return (
					props.variant === "contained" &&
					props.disabled &&
					props.classes.loadingIndicator === undefined // Do not apply to loading button
				);
			},
			style: {
				backgroundColor: `${theme.palette.secondary.main} !important`,
				color: `${theme.palette.secondary.contrastText} !important`,
			},
		},
	],
}));

export default Button;
