import TabPanel from "@mui/lab/TabPanel";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { PasswordEndAdornment } from "../../Inputs/TextInput/Adornments";
import TextInput from "../../Inputs/TextInput";
import { credentials } from "../../../Validation/validation";
import Alert from "../../Alert";
import { update } from "../../../Features/Auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { createToast } from "../../../Utils/toastUtils";
import { getTouchedFieldErrors } from "../../../Validation/error";
import { useTranslation } from "react-i18next";

const defaultPasswordsState = {
	password: "",
	newPassword: "",
	confirm: "",
};

/**
 * PasswordPanel component manages the form for editing password.
 *
 * @returns {JSX.Element}
 */

const PasswordPanel = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const SPACING_GAP = theme.spacing(12);

	//redux state
	const { isLoading } = useSelector((state) => state.auth);

	const idToName = {
		"edit-current-password": "password",
		"edit-new-password": "newPassword",
		"edit-confirm-password": "confirm",
	};

	const [localData, setLocalData] = useState(defaultPasswordsState);
	const [errors, setErrors] = useState(defaultPasswordsState);
	const [touchedFields, setTouchedFields] = useState({
		password: false,
		newPassword: false,
		confirm: false,
	});

	const handleChange = (event) => {
		const { value, id } = event.target;
		const name = idToName[id];

		const updatedData = {
			...localData,
			[name]: value,
		};
		const updatedTouchedFields = {
			...touchedFields,
			[name]: true,
		};

		const validation = credentials.validate(
			{ ...updatedData },
			{ abortEarly: false, context: { password: updatedData.newPassword } }
		);

		const updatedErrors = getTouchedFieldErrors(validation, updatedTouchedFields);

		if (!touchedFields[name]) {
			setTouchedFields(updatedTouchedFields);
		}

		setLocalData(updatedData);
		setErrors(updatedErrors);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		const { error } = credentials.validate(localData, {
			abortEarly: false,
			context: { password: localData.newPassword },
		});

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			setErrors(newErrors);
		} else {
			const action = await dispatch(update({ localData }));
			if (action.payload.success) {
				createToast({
					body: t("passwordPanel.passwordChangedSuccess", "Your password was changed successfully."),
				});
				setLocalData({
					password: "",
					newPassword: "",
					confirm: "",
				});
			} else {
				// TODO: Check for other errors?
				createToast({
					body: t("passwordPanel.passwordInputIncorrect", "Your password input was incorrect."),
				});
				setErrors({ password: "*" + action.payload.msg + "." });
			}
		}
	};

	return (
		<TabPanel
			value="password"
			sx={{
				"& h1, & input": {
					color: theme.palette.primary.contrastTextTertiary,
				},
			}}
		>
			<Stack
				component="form"
				onSubmit={handleSubmit}
				noValidate
				spellCheck="false"
				gap={theme.spacing(26)}
				maxWidth={"80ch"} // Keep maxWidth
			>
				<TextInput
					type="text"
					id="hidden-username"
					name="username"
					autoComplete="username"
					hidden={true}
					value=""
				/>

				<Stack
					direction="row"
					justifyContent={"flex-start"}
					alignItems={"center"}
					gap={SPACING_GAP}
					flexWrap={"wrap"}
				>
					<Typography
						component="h1"
						width="20ch"
					>
						{t("passwordPanel.currentPassword", "Current password")}
					</Typography>
					<TextInput
						type="password"
						id="edit-current-password"
						placeholder={t("passwordPanel.enterCurrentPassword", "Enter your current password")}
						autoComplete="current-password"
						value={localData.password}
						onChange={handleChange}
						error={errors[idToName["edit-current-password"]] ? true : false}
						helperText={errors[idToName["edit-current-password"]]}
						endAdornment={<PasswordEndAdornment />}
						flex={1}
					/>
				</Stack>
				<Stack
					direction="row"
					alignItems={"flex-start"}
					gap={SPACING_GAP}
					flexWrap={"wrap"}
				>
					<Typography
						component="h1"
						width="20ch"
					>
						{t("passwordPanel.newPassword", "New password")}
					</Typography>

					<TextInput
						type="password"
						id="edit-new-password"
						placeholder={t("passwordPanel.enterNewPassword", "Enter your new password")}
						autoComplete="new-password"
						value={localData.newPassword}
						onChange={handleChange}
						error={errors[idToName["edit-new-password"]] ? true : false}
						helperText={errors[idToName["edit-new-password"]]}
						endAdornment={<PasswordEndAdornment />}
						flex={1}
					/>
				</Stack>
				<Stack
					direction="row"
					alignItems={"flex-start"}
					gap={SPACING_GAP}
					flexWrap={"wrap"}
				>
					<Typography
						component="h1"
						width="20ch"
					>
						{t("passwordPanel.confirmNewPassword", "Confirm new password")}
					</Typography>

					<TextInput
						type="password"
						id="edit-confirm-password"
						placeholder={t("confirmPassword", "Confirm password")}
						autoComplete="new-password"
						value={localData.confirm}
						onChange={handleChange}
						error={errors[idToName["edit-confirm-password"]] ? true : false}
						helperText={errors[idToName["edit-confirm-password"]]}
						endAdornment={<PasswordEndAdornment />}
						flex={1}
					/>
				</Stack>
				{Object.keys(errors).length > 0 && (
					<Box sx={{ maxWidth: "70ch" }}>
						<Alert
							variant="warning"
							body={t("passwordPanel.passwordRequirements", "New password must contain at least 8 characters and must have at least one uppercase letter, one lowercase letter, one number and one special character.")}
						/>
					</Box>
				)}
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						variant="contained"
						color="accent"
						type="submit"
						loading={isLoading}
						loadingIndicator={t("passwordPanel.saving", "Saving...")}
						disabled={
							Object.keys(errors).length > 0 ||
							Object.values(localData).filter((value) => value === "").length > 0
						}
						sx={{
							px: theme.spacing(12),
							mt: theme.spacing(20),
						}}
					>
						{t("commonSave", "Save")}
					</Button>
				</Stack>
			</Stack>
		</TabPanel>
	);
};

PasswordPanel.propTypes = {
	// No props are being passed to this component, hence no specific PropTypes are defined.
};

export default PasswordPanel;
