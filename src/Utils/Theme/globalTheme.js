import { typographyLevels } from "./constants";

const fontFamilyPrimary = '"Inter" , sans-serif';
// const fontFamilySecondary = '"Avenir", sans-serif';

/* TODO take the color out from here */
const shadow =
	"0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

const baseTheme = (palette) => ({
	typography: {
		fontFamily: fontFamilyPrimary,
		fontSize: 14,
		h1: {
			fontSize: typographyLevels.xl,
			color: palette.primary.contrastText,
			fontWeight: 500,
		},
		h2: {
			fontSize: typographyLevels.l,
			color: palette.primary.contrastTextSecondary,
			fontWeight: 400,
		},
		// CAIO_REVIEW, need a brighter color for dark bg
		h2DarkBg: {
			fontSize: typographyLevels.l,
			color: palette.primary.contrastTextSecondaryDarkBg,
			fontWeight: 400,
		},
		body1: {
			fontSize: typographyLevels.m,
			color: palette.primary.contrastTextTertiary,
			fontWeight: 400,
		},
		body2: {
			fontSize: typographyLevels.s,
			color: palette.primary.contrastTextTertiary,
			fontWeight: 400,
		},
	},
	/* TODO change to 4 */
	spacing: 2,
	/* TODO we can skip using the callback functions on the next lines since we are already accessing it on line 10. That was the last thing I managed to do, so we are sort of doing it twice*/
	/* TODO All these should live inside of a component*/
	components: {
		MuiButton: {
			defaultProps: {
				disableRipple: true,
			},

			styleOverrides: {
				root: ({ theme }) => ({
					variants: [
						{
							props: (props) => props.color === "accent",
							style: {
								"&:hover": {
									backgroundColor: theme.palette.accent.darker,
								},
							},
						},
						{
							props: (props) => props.color === "error",
							style: {
								"&.Mui-disabled": {
									backgroundColor: theme.palette.error.lowContrast,
								},
								"& .MuiButton-loadingIndicator": {
									// styles for error variant loading indicator
									color: theme.palette.error.contrastText,
								},
							},
						},
						{
							props: (props) => props.variant === "group",
							style: {
								/* color: theme.palette.secondary.contrastText, */
								color: theme.palette.primary.contrastText,
								backgroundColor: theme.palette.primary.main,
								border: 1,
								borderStyle: "solid",
								borderColor: theme.palette.primary.lowContrast,
							},
						},
						{
							props: (props) => props.variant === "group" && props.filled === "true",
							style: {
								backgroundColor: theme.palette.secondary.main,
							},
						},
						/* {
							props: (props) => props.variant === "contained",
							style: {
								backgroundColor: `${theme.palette.accent.main} !important`,
							},
						}, */

						{
							props: (props) =>
								props.variant === "contained" && props.color === "secondary",
							style: {
								border: 1,
								borderStyle: "solid",
								borderColor: theme.palette.primary.lowContrast,
							},
						},
						{
							props: (props) => {
								return (
									props.variant === "contained" &&
									props.disabled &&
									props?.classes?.loadingIndicator === undefined // Do not apply to loading button
								);
							},
							style: {
								backgroundColor: `${theme.palette.secondary.main} !important`,
								color: `${theme.palette.secondary.contrastText} !important`,
							},
						},
					],
					height: 34,
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
					"&.Mui-disabled": {
						backgroundColor: theme.palette.secondary.main,
						color: theme.palette.primary.contrastText,
					},
					"&.MuiButton-root": {
						"&:disabled": {
							backgroundColor: theme.palette.secondary.main,
							color: theme.palette.primary.contrastText,
						},
						"&.MuiButton-colorAccent:hover": {
							boxShadow: `0 0 0 1px ${theme.palette.accent.main}`, // CAIO_REVIEW, this should really have a solid BG color
						},
					},
					"&.MuiButton-loading": {
						"&:disabled": {
							color: "transparent",
						},

						"& .MuiButton-loadingIndicator": {
							color: theme.palette.primary.contrastText,
						},
					},
				}),
			},
		},

		MuiIconButton: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: 4,
					transition: "none",
					"&:hover": {
						backgroundColor: theme.palette.primary.lowContrast,
					},
				}),
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: ({ theme }) => {
					return {
						marginTop: 4,
						padding: 0,
						border: 1,
						borderStyle: "solid",
						borderColor: theme.palette.primary.lowContrast,
						borderRadius: 4,
						boxShadow: shadow,
						backgroundColor: theme.palette.primary.main,
						backgroundImage: "none",
					};
				},
			},
		},
		MuiList: {
			styleOverrides: {
				root: {
					padding: 0,
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					transition: "none",
				},
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: ({ theme }) => ({
					borderRadius: 4,
					backgroundColor: "inherit",
					padding: "4px 6px",
					color: theme.palette.primary.contrastTextSecondary,
					fontSize: 13,
					margin: 2,
					minWidth: 100,
					"&:hover, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible":
						{
							backgroundColor: theme.palette.primary.lowContrast,
						},
				}),
			},
		},
		MuiTableCell: {
			styleOverrides: {
				root: ({ theme }) => ({
					borderBottomColor: theme.palette.primary.lowContrast,
				}),
			},
		},
		MuiTableHead: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.tertiary.main,
				}),
			},
		},
		MuiPagination: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.primary.main,
					border: 1,
					borderStyle: "solid",
					borderColor: theme.palette.primary.lowContrast,
					"& button": {
						color: theme.palette.primary.contrastTextTertiary,
						borderRadius: 4,
					},
					"& li:first-of-type button, & li:last-of-type button": {
						border: 1,
						borderStyle: "solid",
						borderColor: theme.palette.primary.lowContrast,
					},
				}),
			},
		},
		MuiPaginationItem: {
			styleOverrides: {
				root: ({ theme }) => ({
					"&:not(.MuiPaginationItem-ellipsis):hover, &.Mui-selected": {
						backgroundColor: theme.palette.primary.lowContrast,
					},
				}),
			},
		},
		MuiSkeleton: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.primary.lowContrast,
				}),
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& fieldset": {
						borderColor: theme.palette.primary.lowContrast,
						borderRadius: theme.shape.borderRadius,
					},
					"& .MuiInputBase-input": {
						padding: ".75em",
						minHeight: "var(--env-var-height-2)",
						fontSize: "var(--env-var-font-size-medium)",
						fontWeight: 400,
						color: palette.primary.contrastTextSecondary,
						"&.Mui-disabled": {
							opacity: 0.3,
							WebkitTextFillColor: "unset",
						},
						"& .Mui-focused": {
							/* color: "#ff0000", */
							/* borderColor: theme.palette.primary.contrastText, */
						},
					},
					"& .MuiInputBase-input:-webkit-autofill": {
						transition: "background-color 5000s ease-in-out 0s",
						WebkitBoxShadow: `0 0 0px 1000px ${theme.palette.primary.main} inset`,
						WebkitTextFillColor: theme.palette.primary.contrastText,
					},
					"& .MuiInputBase-input.MuiOutlinedInput-input": {
						padding: "0 var(--env-var-spacing-1-minus) !important",
					},
					"& .MuiOutlinedInput-root": {
						color: theme.palette.primary.contrastTextSecondary,
						borderRadius: 4,
					},
					"& .MuiOutlinedInput-notchedOutline": {
						borderRadius: 4,
					},

					"& .MuiFormHelperText-root": {
						color: palette.error.main,
						opacity: 0.8,
						fontSize: "var(--env-var-font-size-medium)",

						marginLeft: 0,
					},
					"& .MuiFormHelperText-root.Mui-error": {
						opacity: 0.8,
						fontSize: "var(--env-var-font-size-medium)",
						color: palette.error.main,
					},
				}),
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					color: palette.primary.contrastTextTertiary,
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: palette.primary.contrastTextTertiary,
					},
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: ({ theme }) => ({
					fontSize: 13,
					color: theme.palette.tertiary.contrastText,
					backgroundColor: theme.palette.tertiary.main,
					textTransform: "none",
					minWidth: "fit-content",
					paddingY: theme.spacing(6),
					fontWeight: 400,
					borderBottom: "2px solid transparent",
					borderRight: `1px solid ${theme.palette.primary.lowContrast}`,
					"&:first-of-type": { borderTopLeftRadius: "8px" },
					"&:last-child": { borderTopRightRadius: "8px", borderRight: 0 },
					"&:focus-visible": {
						color: theme.palette.primary.contrastText,
						borderColor: theme.palette.tertiary.contrastText,
						borderRightColor: theme.palette.primary.lowContrast,
					},
					"&.Mui-selected": {
						backgroundColor: theme.palette.secondary.main,
						color: theme.palette.secondary.contrastText,
						borderColor: theme.palette.secondary.contrastText,
						borderRightColor: theme.palette.primary.lowContrast,
					},
					"&:hover": {
						borderColor: theme.palette.primary.lowContrast,
					},
				}),
			},
		},
		MuiSvgIcon: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.primary.contrastTextTertiary,
				}),
			},
		},
		MuiTabs: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiTabs-indicator": {
						backgroundColor: theme.palette.tertiary.contrastText,
					},
				}),
			},
		},
		MuiSwitch: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiSwitch-track": {
						backgroundColor: theme.palette.primary.contrastText,
					},
				}),
			},
		},
		MuiButtonGroup: {
			styleOverrides: {
				root: ({ theme }) => ({
					ml: "auto",
					"& .MuiButtonBase-root, & .MuiButtonBase-root:hover": {
						borderColor: theme.palette.primary.lowContrast,
						width: "auto",
						whiteSpace: "nowrap",
					},
				}),
			},
		},
	},
	shape: {
		borderRadius: 2,
		borderThick: 2,
		boxShadow: shadow,
	},
});

export { baseTheme };
