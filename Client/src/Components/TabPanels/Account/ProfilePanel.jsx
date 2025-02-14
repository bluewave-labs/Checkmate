import { useTheme } from "@emotion/react";
import { useState } from "react";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import Avatar from "../../Avatar";
import TextInput from "../../Inputs/TextInput";
import { credentials } from "../../../Validation/validation";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthState, deleteUser, update } from "../../../Features/Auth/authSlice";
import { clearUptimeMonitorState } from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { createToast } from "../../../Utils/toastUtils";
import { logger } from "../../../Utils/Logger";
import { GenericDialog } from "../../Dialog/genericDialog";
import ImageUpload from "../../ImageUpload";

const ProfilePanel = () => {
	const theme = useTheme();
	const dispatch = useDispatch();

	const SPACING_GAP = theme.spacing(12);

	// Redux state
	const { user, authToken, isLoading } = useSelector((state) => state.auth);

	const idToName = {
		"edit-first-name": "firstName",
		"edit-last-name": "lastName",
	};

	// Local state for form data and errors
	const [localData, setLocalData] = useState({
		firstName: user.firstName,
		lastName: user.lastName,
	});
	const [errors, setErrors] = useState({});
	const [isOpen, setIsOpen] = useState("");

	// Handles input field changes and performs validation
	const handleChange = (event) => {
		errors["unchanged"] && setErrors((prev) => ({ ...prev, unchanged: undefined }));
		const { value, id } = event.target;
		const name = idToName[id];
		setLocalData((prev) => ({
			...prev,
			[name]: value,
		}));

		validateField({ [name]: value }, credentials, name);
	};

	// Validates input against provided schema and updates error state
	const validateField = (toValidate, schema, name = "picture") => {
		const { error } = schema.validate(toValidate, { abortEarly: false });
		setErrors((prev) => {
			const prevErrors = { ...prev };
			if (error) prevErrors[name] = error.details[0].message;
			else delete prevErrors[name];
			return prevErrors;
		});
	};

	// Handles form submission to update user profile
	const handleSaveProfile = async (event) => {
		event.preventDefault();
		if (
			localData.firstName === user.firstName &&
			localData.lastName === user.lastName &&
			localData.deleteProfileImage === undefined &&
			localData.file === undefined
		) {
			createToast({
				body: "Unable to update profile — no changes detected.",
			});
			setErrors({ unchanged: "unable to update profile" });
			return;
		}

		const action = await dispatch(update({ authToken, localData }));
		if (action.payload.success) {
			createToast({
				body: "Your profile data was changed successfully.",
			});
		} else {
			createToast({
				body: "There was an error updating your profile data.",
			});
		}
	};

	// Handles updating the profile picture
	const handleUpdatePicture = (newImage) => {
		if (newImage) {
			setLocalData((prev) => ({
				...prev,
				file: newImage,
				deleteProfileImage: false,
			}));
		}
	};	

	// Handles deleting the profile picture
	const handleDeletePicture = () => {
		setLocalData((prev) => ({
			...prev,
			deleteProfileImage: true,
		}));
	};

	// Initiates the account deletion process
	const handleDeleteAccount = async () => {
		const action = await dispatch(deleteUser(authToken));
		if (action.payload.success) {
			dispatch(clearAuthState());
			dispatch(clearUptimeMonitorState());
		} else {
			if (action.payload) {
				createToast({
					body: action.payload.msg,
				});
			} else {
				createToast({
					body: "Unknown error.",
				});
			}
		}
	};

	return (
		<TabPanel
			value="profile"
			sx={{
				"& h1, & p, & input": {
					color: theme.palette.primary.contrastTextTertiary,
				},
			}}
		>
			<Stack
				component="form"
				className="edit-profile-form"
				noValidate
				spellCheck="false"
				gap={SPACING_GAP}
			>
				<Stack
					direction="row"
					gap={SPACING_GAP}
				>
					<Box flex={0.9}>
						<Typography component="h1">First name</Typography>
					</Box>
					<TextInput
						id="edit-first-name"
						value={localData.firstName}
						placeholder="Enter your first name"
						autoComplete="given-name"
						onChange={handleChange}
						error={errors[idToName["edit-first-name"]] ? true : false}
						helperText={errors[idToName["edit-first-name"]]}
						flex={1}
					/>
				</Stack>
				<Stack
					direction="row"
					gap={SPACING_GAP}
				>
					<Box flex={0.9}>
						<Typography component="h1">Last name</Typography>
					</Box>
					<TextInput
						id="edit-last-name"
						placeholder="Enter your last name"
						autoComplete="family-name"
						value={localData.lastName}
						onChange={handleChange}
						error={errors[idToName["edit-last-name"]] ? true : false}
						helperText={errors[idToName["edit-last-name"]]}
						flex={1}
					/>
				</Stack>
				<Stack
					direction="row"
					gap={SPACING_GAP}
				>
					<Stack flex={0.9}>
						<Typography component="h1">Email</Typography>
						<Typography
							component="p"
							sx={{ opacity: 0.6 }}
						>
							This is your current email address — it cannot be changed.
						</Typography>
					</Stack>
					<TextInput
						id="edit-email"
						value={user.email}
						placeholder="Enter your email"
						autoComplete="email"
						onChange={() => logger.warn("disabled")}
						disabled={true}
						flex={1}
					/>
				</Stack>
				<Stack
					direction="row"
					gap={SPACING_GAP}
				>
					<Stack flex={0.9}>
						<Typography component="h1">Your photo</Typography>
						<Typography
							component="p"
							sx={{ opacity: 0.6 }}
						>
							This photo will be displayed in your profile page.
						</Typography>
					</Stack>
					<Stack
						direction="row"
						alignItems="center"
						flex={1}
						gap={"8px"}
					>
						<Avatar
							src={
								localData?.deleteProfileImage
									? "/static/images/avatar/2.jpg"
									: localData?.file
										? localData.file
										: ""
							}
							sx={{ marginRight: "8px" }}
						/>
						<Button
							variant="contained"
							color="error"
							onClick={handleDeletePicture}
						>
							Delete
						</Button>
						<Button
							variant="contained"
							color="accent"
							onClick={() => setIsOpen("picture")}
						>
							Update
						</Button>
					</Stack>
				</Stack>
				<Divider
					aria-hidden="true"
					width="0"
					sx={{
						marginY: theme.spacing(1),
					}}
				/>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Box width="fit-content">
						<Button
							variant="contained"
							color="accent"
							onClick={handleSaveProfile}
							loading={isLoading}
							loadingIndicator="Saving..."
							disabled={Object.keys(errors).length !== 0 && !errors?.picture && true}
							sx={{ px: theme.spacing(12) }}
						>
							Save
						</Button>
					</Box>
				</Stack>
			</Stack>
			<Divider
				aria-hidden="true"
				sx={{
					marginY: theme.spacing(20),
					borderColor: theme.palette.primary.lowContrast,
				}}
			/>
			{!user.role.includes("demo") && (
				<Box
					component="form"
					noValidate
					spellCheck="false"
				>
					<Box mb={theme.spacing(6)}>
						<Typography component="h1">Delete account</Typography>
						<Typography
							component="p"
							sx={{ opacity: 0.6 }}
						>
							Note that deleting your account will remove all data from the server. This
							is permanent and non-recoverable.
						</Typography>
					</Box>
					<Button
						variant="contained"
						color="error"
						onClick={() => setIsOpen("delete")}
					>
						Delete account
					</Button>
				</Box>
			)}
			<GenericDialog
				open={isOpen === "delete"}
				theme={theme}
				title={"Really delete this account?"}
				description={
					"If you delete your account, you will no longer be able to sign in, and all of your data will be deleted. Deleting your account is permanent and non-recoverable action."
				}
				onClose={() => setIsOpen("")}
				onCancel={() => setIsOpen("")}
				confirmationButtonLabel={"Delete account"}
				onConfirm={handleDeleteAccount}
				isLoading={isLoading}
			>
			<></>
			</GenericDialog>

			{/* Image Upload Modal */}
			<ImageUpload
				setErrors={setErrors}
				errors={errors}
				open={isOpen === "picture"}
				onClose={setIsOpen}
				onUpdate={handleUpdatePicture}
			/>
		</TabPanel>
	);
};

export default ProfilePanel;