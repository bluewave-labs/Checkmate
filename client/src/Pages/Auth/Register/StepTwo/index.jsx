import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TextInput from "../../../../Components/Inputs/TextInput";
import { useTranslation } from "react-i18next";

StepTwo.propTypes = {
	form: PropTypes.object,
	errors: PropTypes.object,
	onSubmit: PropTypes.func,
	onChange: PropTypes.func,
	onBack: PropTypes.func,
};

/**
 * Renders the second step of the sign up process.
 *
 * @param {Object} props
 * @param {Object} props.form - Form state object.
 * @param {Object} props.errors - Object containing form validation errors.
 * @param {Function} props.onSubmit - Callback function to handle form submission.
 * @param {Function} props.onChange - Callback function to handle form input changes.
 * @param {Function} props.onBack - Callback function to handle "Back" button click.
 * @returns {JSX.Element}
 */
function StepTwo({ form, errors, onSubmit, onChange, onBack }) {
	const theme = useTheme();
	const inputRef = useRef(null);
	const { t } = useTranslation();

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<>
			<Stack
				gap={{ xs: theme.spacing(8), sm: theme.spacing(12) }}
				textAlign="center"
			>
				<Box>
					<Typography component="h1">{t("signUp")}</Typography>
					<Typography>{t("enterEmail")}</Typography>
				</Box>

				<Box
					component="form"
					textAlign="left"
					noValidate
					spellCheck={false}
					onSubmit={onSubmit}
					mb={theme.spacing(5)}
					display="grid"
					gap={{ xs: theme.spacing(12), sm: theme.spacing(16) }}
				>
					<TextInput
						type="email"
						id="register-email-input"
						label={t("authRegisterEmail")}
						isRequired={true}
						placeholder="jordan.ellis@domain.com"
						autoComplete="email"
						value={form.email}
						onInput={(e) => (e.target.value = e.target.value.toLowerCase())}
						onChange={onChange}
						error={errors.email ? true : false}
						helperText={errors.email && t("authRegisterEmailRequired")}
						ref={inputRef}
					/>
					<Stack
						direction="row"
						justifyContent="space-between"
					>
						<Button
							variant="outlined"
							color="info"
							onClick={onBack}
							sx={{
								px: theme.spacing(5),
								"& svg.MuiSvgIcon-root": {
									mr: theme.spacing(3),
								},
								"&:focus-visible": {
									outline: `2px solid ${theme.palette.primary.main}`,
									outlineOffset: `2px`,
								},
							}}
						>
							<ArrowBackRoundedIcon />
							{t("commonBack")}
						</Button>
						<Button
							variant="contained"
							color="accent"
							onClick={onSubmit}
							disabled={errors.email && true}
							sx={{
								width: "30%",
								"&.Mui-focusVisible": {
									outline: `2px solid ${theme.palette.primary.main}`,
									outlineOffset: `2px`,
									boxShadow: `none`,
								},
							}}
						>
							{t("continue")}
						</Button>
					</Stack>
				</Box>
			</Stack>
		</>
	);
}

export { StepTwo };
