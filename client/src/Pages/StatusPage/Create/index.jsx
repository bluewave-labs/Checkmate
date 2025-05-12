// Components
import { Stack, Button, Typography } from "@mui/material";
import Tabs from "./Components/Tabs";
import GenericFallback from "../../../Components/GenericFallback";
import SkeletonLayout from "./Components/Skeleton";
//Utils
import { useTheme } from "@emotion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { statusPageValidation } from "../../../Validation/validation";
import { buildErrors } from "../../../Validation/error";
import { useMonitorsFetch } from "./Hooks/useMonitorsFetch";
import { useCreateStatusPage } from "./Hooks/useCreateStatusPage";
import { createToast } from "../../../Utils/toastUtils";
import { useNavigate } from "react-router-dom";
import { useStatusPageFetch } from "../Status/Hooks/useStatusPageFetch";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
//Constants
const TAB_LIST = ["General settings", "Contents"];

const ERROR_TAB_MAPPING = [
	["companyName", "url", "timezone", "color", "isPublished", "logo"],
	["monitors", "showUptimePercentage", "showCharts"],
];

const CreateStatusPage = () => {
	const { url } = useParams();
	//Local state
	const [tab, setTab] = useState(0);
	const [progress, setProgress] = useState({ value: 0, isLoading: false });
	const [form, setForm] = useState({
		isPublished: false,
		companyName: "",
		url: url ?? Math.floor(Math.random() * 1000000).toFixed(0),
		logo: undefined,
		timezone: "America/Toronto",
		color: "#4169E1",
		type: "uptime",
		monitors: [],
		showCharts: true,
		showUptimePercentage: true,
	});
	const [errors, setErrors] = useState({});
	const [selectedMonitors, setSelectedMonitors] = useState([]);
	// Refs
	const intervalRef = useRef(null);

	// Setup
	const isCreate = typeof url === "undefined";

	//Utils
	const theme = useTheme();
	const [monitors, isLoading, networkError] = useMonitorsFetch();
	const [createStatusPage, createStatusIsLoading, createStatusPageNetworkError] =
		useCreateStatusPage(isCreate);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const [statusPage, statusPageMonitors, statusPageIsLoading, statusPageNetworkError] =
		useStatusPageFetch(isCreate, url);

	// Handlers
	const handleFormChange = (e) => {
		let { type, name, value, checked } = e.target;
		// Handle errors
		const { error } = statusPageValidation.validate(
			{ [name]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => {
			return buildErrors(prev, name, error);
		});

		//Handle checkbox
		if (type === "checkbox") {
			setForm((prev) => ({
				...prev,
				[name]: checked,
			}));
			return;
		}

		// Handle other inputs
		setForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleImageChange = useCallback((fileObj) => {
		if (!fileObj || !fileObj.file) return;

		setForm((prev) => ({
			...prev,
			logo: {
				src: fileObj.src,
				name: fileObj.name,
				type: fileObj.file.type,
				size: fileObj.file.size,
			},
		}));

		intervalRef.current = setInterval(() => {
			const buffer = 12;
			setProgress((prev) => {
				if (prev.value + buffer >= 100) {
					clearInterval(intervalRef.current);
					return { value: 100, isLoading: false };
				}
				return { ...prev, value: prev.value + buffer };
			});
		}, 120);
	}, []);

	const removeLogo = () => {
		setForm((prev) => ({
			...prev,
			logo: undefined,
		}));
		// interrupt interval if image upload is canceled prior to completing the process
		clearInterval(intervalRef.current);
		setProgress({ value: 0, isLoading: false });
	};

	const handleSubmit = async () => {
		let toSubmit = {
			...form,
			logo: { type: form.logo?.type ?? null, size: form.logo?.size ?? null },
		};
		const { error } = statusPageValidation.validate(toSubmit, {
			abortEarly: false,
		});

		if (typeof error === "undefined") {
			const success = await createStatusPage({ form });
			if (success) {
				createToast({
					body: isCreate
						? "Status page created successfully"
						: "Status page updated successfully",
				});
				navigate(`/status/uptime/${form.url}`);
			}
			return;
		}

		const newErrors = {};
		error?.details?.forEach((err) => {
			newErrors[err.path[0]] = err.message;
		});
		setErrors((prev) => ({ ...prev, ...newErrors }));
		const errorTabs = Object.keys(newErrors).map((err) => {
			return ERROR_TAB_MAPPING.findIndex((tab) => tab.includes(err));
		});

		// If there's an error in the current tab, don't change the tab
		if (errorTabs.some((errorTab) => errorTab === tab)) {
			return;
		}

		// If we get -1, there's an unknown error
		if (errorTabs[0] === -1) {
			createToast({ body: t("unknownError") });
			return;
		}

		// Otherwise go to tab with error
		setTab(errorTabs[0]);
	};

	// If we are configuring, populate fields
	useEffect(() => {
		if (isCreate) return;
		if (typeof statusPage === "undefined") {
			return;
		}

		let newLogo = undefined;
		if (statusPage.logo) {
			newLogo = {
				src: `data:${statusPage.logo.contentType};base64,${statusPage.logo.data}`,
				name: "logo",
				type: statusPage.logo.contentType,
				size: null,
			};
		}

		setForm((prev) => {
			return {
				...prev,
				companyName: statusPage?.companyName,
				isPublished: statusPage?.isPublished,
				timezone: statusPage?.timezone,
				monitors: statusPageMonitors.map((monitor) => monitor._id),
				color: statusPage?.color,
				logo: newLogo,
			};
		});
		setSelectedMonitors(statusPageMonitors);
	}, [isCreate, statusPage, statusPageMonitors]);

	if (networkError === true) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("networkError")}
				</Typography>
				<Typography>{t("checkConnection")}</Typography>
			</GenericFallback>
		);
	}

	if (isLoading) return <SkeletonLayout />;

	// Load fields
	return (
		<Stack gap={theme.spacing(10)}>
			<Tabs
				form={form}
				errors={errors}
				monitors={monitors}
				selectedMonitors={selectedMonitors}
				setSelectedMonitors={setSelectedMonitors}
				handleFormChange={handleFormChange}
				handleImageChange={handleImageChange}
				progress={progress}
				removeLogo={removeLogo}
				tab={tab}
				setTab={setTab}
				TAB_LIST={TAB_LIST}
				isCreate={isCreate}
			/>
			<Stack
				direction="row"
				justifyContent="flex-end"
			>
				<Button
					variant="contained"
					color="accent"
					onClick={handleSubmit}
				>
					{t("settingsSave")}
				</Button>
			</Stack>
		</Stack>
	);
};

export default CreateStatusPage;
