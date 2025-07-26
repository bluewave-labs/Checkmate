// Components
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Button from "@mui/material/Button";
import ConfigBox from "../../../Components/ConfigBox";
import Box from "@mui/material/Box";
import Select from "../../../Components/Inputs/Select";
import TextInput from "../../../Components/Inputs/TextInput";
import Dialog from "../../../Components/Dialog";

// Utils
import { useState } from "react";
import { useTheme } from "@emotion/react";
import {
	useCreateNotification,
	useGetNotificationById,
	useEditNotification,
	useTestNotification,
	useDeleteNotification,
} from "../../../Hooks/useNotifications";
import { notificationValidation } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
	NOTIFICATION_TYPES,
	TITLE_MAP,
	DESCRIPTION_MAP,
	LABEL_MAP,
	PLACEHOLDER_MAP,
} from "../utils";

// Setup

const CreateNotifications = () => {
	const { notificationId } = useParams();
	const navigate = useNavigate();
	const theme = useTheme();
	const [createNotification, isCreating] = useCreateNotification();
	const [editNotification, isEditing] = useEditNotification();
	const [testNotification, isTesting] = useTestNotification();
	const [deleteNotification, isDeleting] = useDeleteNotification();

	const BREADCRUMBS = [
		{ name: "notifications", path: "/notifications" },
		{
			name: notificationId ? "edit" : "create",
			path: notificationId ? `/notifications/${notificationId}` : "/notifications/create",
		},
	];

	// Redux state

	// local state
	const [notification, setNotification] = useState({
		notificationName: "",
		address: "",
		type: NOTIFICATION_TYPES[0]._id,
	});
	const [errors, setErrors] = useState({});
	const { t } = useTranslation();

	const [notificationIsLoading] = useGetNotificationById(notificationId, setNotification);

	const [isOpen, setIsOpen] = useState(false);

	const getNotificationTypeValue = (typeId) => {
		return NOTIFICATION_TYPES.find((type) => type._id === typeId)?.value || "email";
	};

	const extractError = (error, field) =>
		error?.details.find((d) => d.path.includes(field))?.message;

	// handlers
	const onSubmit = (e) => {
		e.preventDefault();
		const form = {
			...notification,
			type: getNotificationTypeValue(notification.type),
		};

		let error = null;

		error = notificationValidation.validate(form, { abortEarly: false }).error;

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			console.log(JSON.stringify(newErrors));
			console.log(JSON.stringify(form, null, 2));
			createToast({ body: Object.values(newErrors)[0] });
			setErrors(newErrors);
			return;
		}

		if (notificationId) {
			editNotification(notificationId, form);
		} else {
			createNotification(form);
		}
	};

	const onChange = (e) => {
		const { name, value } = e.target;
		let rawNotification = { ...notification, [name]: value };
		let newNotification = {
			...rawNotification,
			type: getNotificationTypeValue(rawNotification.type),
		};

		const { error } = notificationValidation.validate(newNotification, {
			abortEarly: false,
		});
		let validationError = { ...errors };

		if (name === "type") {
			validationError["type"] = extractError(error, "type");
			validationError["address"] = extractError(error, "address");
		} else {
			validationError[name] = extractError(error, name);
		}

		setNotification(rawNotification);
		setErrors(validationError);
	};

	const onTestNotification = () => {
		const form = {
			...notification,
			type: getNotificationTypeValue(notification.type),
		};

		let error = null;

		error = notificationValidation.validate(form, { abortEarly: false }).error;

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			createToast({ body: Object.values(newErrors)[0] });
			setErrors(newErrors);
			return;
		}

		testNotification(form);
	};

	const onDelete = () => {
		if (notificationId) {
			deleteNotification(notificationId, () => navigate("/notifications"));
		}
	};

	const type = getNotificationTypeValue(notification.type);
	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h1">{t("createNotifications.title")}</Typography>
			<Stack
				component="form"
				onSubmit={onSubmit}
				noValidate
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
			>
				<ConfigBox>
					<Box>
						<Typography component="h2">
							{t("createNotifications.nameSettings.title")}
						</Typography>
						<Typography component="p">
							{t("createNotifications.nameSettings.description")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<TextInput
							label={t("createNotifications.nameSettings.nameLabel")}
							name="notificationName"
							placeholder={t("createNotifications.nameSettings.namePlaceholder")}
							value={notification.notificationName}
							onChange={onChange}
							error={Boolean(errors.notificationName)}
							helperText={errors["notificationName"]}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">
							{t("createNotifications.typeSettings.title")}
						</Typography>
						<Typography component="p">
							{t("createNotifications.typeSettings.description")}
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Select
							items={NOTIFICATION_TYPES}
							label="Type"
							name="type"
							value={notification.type}
							onChange={onChange}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t(TITLE_MAP[type])}</Typography>
						<Typography component="p">{t(DESCRIPTION_MAP[type])}</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<TextInput
							label={t(LABEL_MAP[type])}
							name="address"
							placeholder={t(PLACEHOLDER_MAP[type])}
							value={notification.address}
							onChange={onChange}
							error={Boolean(errors.address)}
							helperText={errors["address"]}
						/>
					</Stack>
				</ConfigBox>

				<Stack
					direction="row"
					justifyContent="flex-end"
					spacing={theme.spacing(2)}
				>
					<Button
						loading={isTesting}
						variant="contained"
						color="secondary"
						onClick={onTestNotification}
					>
						{t("createNotifications.testNotification")}
					</Button>
					{notificationId && (
						<Button
							loading={isDeleting}
							variant="contained"
							color="error"
							onClick={() => setIsOpen(true)}
						>
							{t("delete")}
						</Button>
					)}
					<Button
						loading={isCreating || isEditing || notificationIsLoading}
						type="submit"
						variant="contained"
						color="accent"
					>
						{t("submit")}
					</Button>
				</Stack>
			</Stack>
			<Dialog
				open={isOpen}
				onClose={() => setIsOpen(false)}
				onCancel={() => setIsOpen(false)}
				title={t("createNotifications.dialogDeleteTitle")}
				confirmationButtonLabel={t("createNotifications.dialogDeleteConfirm")}
				onConfirm={onDelete}
				isLoading={isDeleting}
			/>
		</Stack>
	);
};

export default CreateNotifications;
