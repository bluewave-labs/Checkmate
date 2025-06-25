import { typographyLevels } from "./constants";
const fontFamilyPrimary = '"Inter" , sans-serif';
// const fontFamilySecondary = '"Avenir", sans-serif';

/* TODO take the color out from here */
const shadow =
	"0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

const baseTheme = (palette) => ({
	typography: {
		fontFamily: fontFamilyPrimary,
		fontSize: typographyLevels.base,
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
		label: {
			fontSize: "var(--env-var-font-size-medium)",
			color: palette.primary.contrastTextSecondary,
			fontWeight: 500,
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

						{
							props: { variant: "text", color: "info" },
							style: {
								textDecoration: "underline",
								color: theme.palette.primary.contrastText,
								padding: 0,
								margin: 0,
								fontSize: typographyLevels.m,
								fontWeight: theme.typography.body2.fontWeight,
								backgroundColor: "transparent",
								"&:hover": {
									backgroundColor: "transparent",
									textDecoration: "underline",
								},
								"&.Mui-disabled": {
									backgroundColor: "transparent",
									color: theme.palette.text.primary,
									opacity: 0.5,
									"&.MuiButton-text": {
										backgroundColor: "transparent",
									},
								},
								minWidth: 0,
								boxShadow: "none",
								border: "none",
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
		MuiListItemText: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiTypography-root": {
						color: theme.palette.primary.contrastText,
					},
				}),
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
					fontSize: typographyLevels.base,
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
						whiteSpace: "nowrap",
					},
				}),
			},
		},

		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					"&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
						borderColor: palette.primary.contrastBorderDisabled,
					},
					"&.Mui-disabled:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: palette.primary.contrastBorderDisabled,
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: palette.primary.lowContrast, // Adjust hover border color
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: palette.accent.main, // Adjust focus border color
					},
					color: palette.primary.contrastText,
				},
			},
		},

		MuiAutocomplete: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiOutlinedInput-root": {
						paddingTop: 0,
						paddingBottom: 0,
					},
					"& fieldset": {
						borderColor: theme.palette.primary.lowContrast,
						borderRadius: theme.shape.borderRadius,
					},
					"& .MuiOutlinedInput-root:hover:not(:has(input:focus)):not(:has(textarea:focus)) fieldset":
						{
							borderColor: theme.palette.primary.lowContrast,
						},

					"& .MuiAutocomplete-tag": {
						color: theme.palette.primary.contrastText,
						backgroundColor: theme.palette.primary.lowContrast,
					},
					"& .MuiChip-deleteIcon": {
						color: theme.palette.primary.contrastText, // CAIO_REVIEW
					},
				}),
			},
		},

		MuiTab: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.tertiary.contrastText,
					height: "34px",
					minHeight: "34px",
					borderRadius: 0,
					textTransform: "none",
					minWidth: "fit-content",
					padding: `${theme.spacing(6)}px ${theme.spacing(4)}px`,
					fontWeight: 400,
					"&:focus-visible": {
						color: theme.palette.primary.contrastText,
						borderColor: theme.palette.tertiary.contrastText,
						borderRightColor: theme.palette.primary.lowContrast,
					},
					"&.Mui-selected": {
						color: theme.palette.secondary.contrastText,
					},
					"&:hover": {
						borderColor: theme.palette.primary.lowContrast,
					},
				}),
			},
			variants: [
				{
					props: { orientation: "vertical" },
					style: ({ theme }) => ({
						alignItems: "flex-start",
						padding: `${theme.spacing(1)}px ${theme.spacing(2)}px ${theme.spacing(1)}px ${theme.spacing(6)}px`,
						minHeight: theme.spacing(12),
						color: theme.palette.primary.contrastText,
						backgroundColor: theme.palette.primary.main,
						border: "none",
						borderBottom: "none",
						borderRight: "none",
						borderRadius: theme.shape.borderRadius * 3,
						margin: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
						"&.Mui-selected": {
							color: theme.palette.primary.contrastText,
							backgroundColor: theme.palette.tertiary.main,
							opacity: 1,
							border: "none",
							borderBottom: "none",
							borderRight: "none",
							borderRadius: theme.shape.borderRadius * 3,
							minHeight: theme.spacing(14),
						},
						"&:hover": {
							backgroundColor: theme.palette.tertiary.main,
							border: "none",
							borderRadius: theme.shape.borderRadius * 3,
							minHeight: theme.spacing(14),
						},
					}),
				},
			],
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
					height: "34px",
					minHeight: "34px",
					display: "inline-flex",
					borderRadius: 0,
					"& .MuiTabs-indicator": {
						backgroundColor: theme.palette.tertiary.contrastText,
					},
				}),
			},
			variants: [
				{
					props: { orientation: "vertical" },
					style: {
						"& .MuiTabs-indicator": {
							display: "none",
						},
					},
				},
			],
		},
		MuiSwitch: {
			styleOverrides: {
				root: ({ theme }) => ({
					width: 42,
					height: 26,
					padding: 0,
					"& .MuiSwitch-switchBase": {
						padding: 0,
						margin: 2,
						transitionDuration: "300ms",
						"&.Mui-checked": {
							transform: "translateX(16px)",
							color: "#fff",
							"& + .MuiSwitch-track": {
								backgroundColor: theme.palette.accent.main,
								opacity: 1,
								border: 0,
							},
						},
					},
					"& .MuiSwitch-thumb": {
						boxSizing: "border-box",
						width: 22,
						height: 22,
					},
					"& .MuiSwitch-track": {
						borderRadius: 13,
						backgroundColor: theme.palette.secondary.light,
						opacity: 1,
					},
				}),
			},
		},
		MuiSelect: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiOutlinedInput-input": {
						color: theme.palette.primary.contrastText,
					},
					"& .MuiOutlinedInput-notchedOutline": {
						borderColor: theme.palette.primary.lowContrast,
						borderRadius: theme.shape.borderRadius,
					},
					"& .MuiSelect-icon": {
						color: theme.palette.primary.contrastTextSecondary, // Dropdown + color
					},
					"&:hover": {
						backgroundColor: theme.palette.primary.main, // Background on hover
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: theme.palette.primary.lowContrast,
					},
				}),
			},
		},
		MuiButtonGroup: {
			styleOverrides: {
				root: ({ theme }) => ({
					ml: "auto",
					"& .MuiButtonBase-root, & .MuiButtonBase-root:hover": {
						borderColor: theme.palette.primary.contrastBorder,
						width: "auto",
						whiteSpace: "nowrap",
					},
				}),
			},
		},

		// This code is added for clock in maintenance page
		// code starts from here.
		MuiClock: {
			// Directly target the clock component
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.primary.main, // Alternative target
					"& .MuiClock-clock": {
						// Inner clock face
						backgroundColor: theme.palette.secondary.main,
					},
				}),
			},
		},
		MuiClockPicker: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.secondary.main, // Outer container background
					"& .MuiClock-root": {
						color: theme.palette.primary.lowContrast,
					},
					"& .MuiClock-clock": {
						backgroundColor: theme.palette.background.default, // Clock face background
						borderColor: theme.palette.secondary.lowContrast,
					},
				}),
			},
		},
		// The clock pointer ( pointer to number like hour/minute hand)
		MuiClockPointer: {
			styleOverrides: {
				root: ({ theme }) => ({
					// Main pointer line color
					backgroundColor: theme.palette.accent.main,
					"& .MuiClockPointer-thumb": {
						backgroundColor: theme.palette.grey[500], // Use your desired grey
					},
				}),
			},
		},
		// This is for numbers in the clock (circular one's)
		MuiClockNumber: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.primary.contrastText,
					"&.Mui-selected": {
						color: theme.palette.accent.contrastText,
						backgroundColor: theme.palette.accent.main,
					},
				}),
			},
		},
		// This is for 00:00 am and pm (top bar)
		MuiTimePickerToolbar: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.secondary.lowContrast,
					// General text color
					"& .MuiTypography-root": {
						color: theme.palette.primary.contrastTextTertiary,
					},
					// Selected time (hour/minute) color
					"& .Mui-selected": {
						color: `${theme.palette.accent.main} !important`,
					},
					// AM/PM buttons color
					"& .MuiButtonBase-root": {
						"&.Mui-selected": {
							backgroundColor: theme.palette.accent.main,
						},
					},
				}),
			},
		},
		// left and right direction style
		MuiPickersArrowSwitcher: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiIconButton-root": {
						color: theme.palette.primary.contrastText,
					},
				}),
			},
		},
		// cancel and okay actions style
		MuiDialogActions: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.primary.main,
				}),
			},
		},
		// code ends here.

		// For labels of input fields
		MuiInputLabel: {
			styleOverrides: {
				root: ({ theme }) => ({
					"&.Mui-focused": {
						color: theme.palette.accent.main,
					},
				}),
			},
		},
		MuiTypography: {
			variants: [
				{
					props: { variant: "monitorName" },
					style: {
						fontSize: typographyLevels.xl,
						color: palette.primary.contrastText,
						fontWeight: 500,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						maxWidth: "calc((100vw - var(--env-var-width-2)) / 2)",
					},
				},
				{
					props: { variant: "monitorUrl" },
					style: {
						fontSize: typographyLevels.l,
						color: palette.primary.contrastTextSecondary,
						fontWeight: "bolder",
						fontFamily: "monospace",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						maxWidth: "calc((100vw - var(--env-var-width-2)) / 2)",
					},
				},
			],
		},
	},
	shape: {
		borderRadius: 2,
		borderThick: 2,
		boxShadow: shadow,
	},
});

export { baseTheme };
