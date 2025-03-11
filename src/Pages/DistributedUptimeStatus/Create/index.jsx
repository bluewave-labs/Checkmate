// Components
import { Stack, Typography, Button, Box } from "@mui/material";
import ConfigBox from "../../../Components/ConfigBox";
import Checkbox from "../../../Components/Inputs/Checkbox";
import TextInput from "../../../Components/Inputs/TextInput";
import VisuallyHiddenInput from "./Components/VisuallyHiddenInput";
import Image from "../../../Components/Image";
import LogoPlaceholder from "../../../assets/Images/logo_placeholder.svg";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import Search from "../../../Components/Inputs/Search";
import MonitorList from "../../StatusPage/Create/Components/MonitorList";
// Utils
import { useTheme } from "@emotion/react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCreateStatusPage } from "../../StatusPage/Create/Hooks/useCreateStatusPage";
import { statusPageValidation } from "../../../Validation/validation";
import { buildErrors } from "../../../Validation/error";
import { createToast } from "../../../Utils/toastUtils";
import { useNavigate } from "react-router-dom";
import { useMonitorsFetch } from "../../StatusPage/Create/Hooks/useMonitorsFetch";
import { useDUStatusPageFetchByUrl } from "../Status/Hooks/useDUStatusPageFetchByUrl";
import { useTranslation } from "react-i18next";

const CreateStatus = () => {
	const theme = useTheme();
	const { monitorId, url } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const isCreate = typeof url === "undefined";

	const [createStatusPage, isLoading, networkError] = useCreateStatusPage(isCreate);

	const [statusPageIsLoading, statusPageNetworkError, statusPage, _, isPublished] =
		useDUStatusPageFetchByUrl({
			url,
			timeFrame: 30,
			isCreate,
		});

	const [monitors, monitorsIsLoading, monitorsNetworkError] = useMonitorsFetch();

	const BREADCRUMBS = [
		{ name: "distributed uptime", path: "/distributed-uptime" },
		{
			name: "details",
			path: `/distributed-uptime/${isCreate ? monitorId : statusPage?.monitors[0]}`,
		},
		{ name: isCreate ? "create status page" : "edit status page", path: `` },
	];
	// Local state
	const [form, setForm] = useState({
		type: "distributed",
		isPublished: false,
		url: url ?? Math.floor(Math.random() * 1000000).toFixed(0),
		logo: undefined,
		companyName: "",
		monitors: [monitorId],
	});
	const [errors, setErrors] = useState({});
	const [search, setSearch] = useState("");
	const [selectedMonitors, setSelectedMonitors] = useState([]);

	const handleFormChange = (e) => {
		const { name, value, checked, type } = e.target;

		// Check for errors
		const { error } = statusPageValidation.validate(
			{ [name]: value },
			{ abortEarly: false }
		);

		setErrors((prev) => buildErrors(prev, name, error));

		if (type === "checkbox") {
			setForm({ ...form, [name]: checked });
			return;
		}
		setForm({ ...form, [name]: value });
	};

	const handleMonitorsChange = (selectedMonitors) => {
		handleFormChange({
			target: {
				name: "subMonitors",
				value: selectedMonitors.map((monitor) => monitor._id),
			},
		});
		setSelectedMonitors(selectedMonitors);
	};

	const handleImageUpload = (e) => {
		const img = e.target?.files?.[0];
		setForm((prev) => ({
			...prev,
			logo: img,
		}));
	};
	const handleSubmit = async () => {
		let logoToSubmit = undefined;

		// Handle image
		if (typeof form.logo !== "undefined" && typeof form.logo.src === "undefined") {
			logoToSubmit = {
				src: URL.createObjectURL(form.logo),
				name: form.logo.name,
				type: form.logo.type,
				size: form.logo.size,
			};
		} else if (typeof form.logo !== "undefined") {
			logoToSubmit = form.logo;
		}
		const formToSubmit = { ...form };
		if (typeof logoToSubmit !== "undefined") {
			formToSubmit.logo = logoToSubmit;
		}
		// Validate
		const { error } = statusPageValidation.validate(formToSubmit, { abortEarly: false });
		if (typeof error === "undefined") {
			const success = await createStatusPage({ form: formToSubmit });
			if (success) {
				const verb = isCreate ? "created" : "updated";
				createToast({ body: `Status page ${verb} successfully` });
				navigate(`/status/distributed/${form.url}`);
			}
			return;
		}
		const newErrors = {};
		error?.details?.forEach((err) => {
			newErrors[err.path[0]] = err.message;
		});
		setErrors((prev) => ({ ...prev, ...newErrors }));
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
				monitors: statusPage?.monitors,
				subMonitors: statusPage?.subMonitors.map((monitor) => monitor._id),
				color: statusPage?.color,
				logo: newLogo,
			};
		});
		setSelectedMonitors(statusPage?.subMonitors);
	}, [isCreate, statusPage]);

	const imgSrc = form?.logo?.src
		? form.logo.src
		: form.logo
			? URL.createObjectURL(form.logo)
			: undefined;

	return (
		<Stack gap={theme.spacing(10)}>
			<Breadcrumbs list={BREADCRUMBS} />
			<Typography variant="h1">
				<Typography
					component="span"
					fontSize="inherit"
				>
					{isCreate ? t("distributedUptimeStatusCreateYour") : t("distributedUptimeStatusEditYour")}{" "}
				</Typography>
				<Typography
					component="span"
					variant="h2"
					fontSize="inherit"
					fontWeight="inherit"
				>
					{t("distributedUptimeStatusCreateStatusPage")}
				</Typography>
			</Typography>
			<ConfigBox>
				<Stack>
					<Typography component="h2">{t("distributedUptimeStatusCreateStatusPageAccess")}</Typography>
					<Typography component="p">
						{t("distributedUptimeStatusCreateStatusPageReady")}
					</Typography>
				</Stack>
				<Stack gap={theme.spacing(18)}>
					<Checkbox
						id="publish"
						name="isPublished"
						label={t("distributedUptimeStatusPublishedLabel")}
						isChecked={form.isPublished}
						onChange={handleFormChange}
					/>
				</Stack>
			</ConfigBox>
			<ConfigBox>
				<Stack gap={theme.spacing(6)}>
					<Typography component="h2">{t("distributedUptimeStatusBasicInfoHeader")}</Typography>
					<Typography component="p">
						{t("distributedUptimeStatusBasicInfoDescription")}
					</Typography>
				</Stack>
				<Stack gap={theme.spacing(18)}>
					<TextInput
						id="companyName"
						name="companyName"
						type="text"
						label={t("distributedUptimeStatusCompanyNameLabel")}
						placeholder="Company name"
						value={form.companyName}
						onChange={handleFormChange}
						helperText={errors["companyName"]}
						error={errors["companyName"] ? true : false}
					/>
					<TextInput
						id="url"
						name="url"
						type="url"
						label={t("distributedUptimeStatusPageAddressLabel")}
						disabled={!isCreate}
						value={form.url}
						onChange={handleFormChange}
						helperText={errors["url"]}
						error={errors["url"] ? true : false}
					/>
				</Stack>
			</ConfigBox>
			<ConfigBox>
				<Stack gap={theme.spacing(6)}>
					<Typography component="h2">{t("distributedUptimeStatusLogoHeader")}</Typography>
					<Typography component="p">{t("distributedUptimeStatusLogoDescription")} </Typography>
				</Stack>
				<Stack
					gap={theme.spacing(18)}
					alignItems="center"
				>
					<Image
						src={imgSrc}
						alt="Logo"
						minWidth={"300px"}
						minHeight={"100px"}
						maxWidth={"300px"}
						maxHeight={"300px"}
						placeholder={LogoPlaceholder}
					/>
					<Box>
						<Button
							component="label"
							role={undefined}
							variant="contained"
							color="accent"
							tabIndex={-1}
						>
							{t("distributedUptimeStatusLogoUploadButton")}
							<VisuallyHiddenInput onChange={handleImageUpload} />
						</Button>
					</Box>
				</Stack>
			</ConfigBox>
			<ConfigBox>
				<Stack>
					<Typography component="h2">{t("distributedUptimeStatusStandardMonitorsHeader")}</Typography>
					<Typography component="p">
						{t("distributedUptimeStatusStandardMonitorsDescription")}
					</Typography>
				</Stack>
				<Stack gap={theme.spacing(18)}>
					<Search
						options={monitors ?? []}
						multiple={true}
						filteredBy="name"
						value={selectedMonitors}
						inputValue={search}
						handleInputChange={setSearch}
						handleChange={handleMonitorsChange}
					/>
					<MonitorList
						monitors={monitors}
						selectedMonitors={selectedMonitors}
						setSelectedMonitors={handleMonitorsChange}
					/>
				</Stack>
			</ConfigBox>
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

export default CreateStatus;
