// Components
import { Stack, Typography } from "@mui/material";
import { TabPanel } from "@mui/lab";
import MonitorList from "../MonitorList/index.jsx";
import Search from "@/Components/v1/Inputs/Search/index.jsx";
import Checkbox from "@/Components/v1/Inputs/Checkbox/index.jsx";
import Radio from "@/Components/v1/Inputs/Radio/index.jsx";
import TextField from "@/Components/v1/Inputs/TextField/index.jsx";

// Utils
import { useState, useMemo } from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import ConfigStack from "./ConfigStack.jsx";

// Simple IPv4 CIDR matcher (preview only)
const ipInCidr = (ip, cidr) => {
	if (!ip || !cidr) return false;
	const [range, bits] = cidr.split("/");
	if (!range || bits === undefined) return false;

	const ipToInt = (ip) =>
		ip
			.split(".")
			.reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);

	const mask = -1 << (32 - Number(bits));
	return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
};

const Content = ({
	tabValue,
	form,
	monitors,
	handleFormChange,
	errors,
	selectedMonitors,
	setSelectedMonitors,
}) => {
	// Local state
	const [search, setSearch] = useState("");

	// Handlers
	const handleMonitorsChange = (selected) => {
		handleFormChange({
			target: {
				name: "monitors",
				value: selected.map((monitor) => monitor._id),
			},
		});
		setSelectedMonitors(selected);
	};

	// Utils
	const theme = useTheme();
	const { t } = useTranslation();

	const matchedCidrMonitors = useMemo(() => {
		if (form.monitorSelectionMode !== "cidr") return [];
		return monitors.filter((monitor) =>
			(form.cidrRanges || []).some((cidr) =>
				ipInCidr(monitor.ip, cidr)
			)
		);
	}, [form.monitorSelectionMode, form.cidrRanges, monitors]);

	return (
		<TabPanel value={tabValue}>
			<Stack gap={theme.spacing(10)}>
				<ConfigStack
					title={t("statusPageCreateTabsContent")}
					description={t("statusPageCreateTabsContentDescription")}
				>
					<Stack gap={theme.spacing(4)}>
						<Radio
							name="monitorSelectionMode"
							value="manual"
							label={t("Select monitors manually")}
							checked={form.monitorSelectionMode !== "cidr"}
							onChange={() =>
								handleFormChange({
									target: {
										name: "monitorSelectionMode",
										value: "manual",
									},
								})
							}
						/>

						<Radio
							name="monitorSelectionMode"
							value="cidr"
							label={t("Select monitors automatically by CIDR")}
							checked={form.monitorSelectionMode === "cidr"}
							onChange={() =>
								handleFormChange({
									target: {
										name: "monitorSelectionMode",
										value: "cidr",
									},
								})
							}
						/>
					</Stack>

					{/* MANUAL MODE */}
					{form.monitorSelectionMode !== "cidr" && (
						<Stack>
							<Search
								options={monitors}
								multiple
								filteredBy="name"
								value={selectedMonitors}
								inputValue={search}
								handleInputChange={setSearch}
								handleChange={handleMonitorsChange}
							/>

							<Typography
								component="span"
								className="input-error"
								color={theme.palette.error.main}
								sx={{ opacity: 0.8 }}
							>
								{errors["monitors"]}
							</Typography>

							<MonitorList
								selectedMonitors={selectedMonitors}
								setSelectedMonitors={handleMonitorsChange}
							/>
						</Stack>
					)}

					{/* CIDR MODE */}
					{form.monitorSelectionMode === "cidr" && (
						<Stack gap={theme.spacing(4)}>
							<TextField
								label={t("CIDR ranges")}
								placeholder="10.0.0.0/24, 192.168.1.0/24"
								value={(form.cidrRanges || []).join(", ")}
								onChange={(e) =>
									handleFormChange({
										target: {
											name: "cidrRanges",
											value: e.target.value
												.split(",")
												.map((v) => v.trim())
												.filter(Boolean),
										},
									})
								}
								error={Boolean(errors["cidrRanges"])}
								helperText={errors["cidrRanges"]}
							/>

							<Typography variant="subtitle2">
								{t("Matching monitors")}
							</Typography>

							<MonitorList
								selectedMonitors={matchedCidrMonitors}
								readOnly
							/>
						</Stack>
					)}
				</ConfigStack>

				<ConfigStack
					title={t("features")}
					description={t("statusPageCreateTabsContentFeaturesDescription")}
				>
					<Stack>
						<Checkbox
							id="showCharts"
							name="showCharts"
							label={t("showCharts")}
							isChecked={form.showCharts}
							onChange={handleFormChange}
						/>
						<Checkbox
							id="showUptimePercentage"
							name="showUptimePercentage"
							label={t("showUptimePercentage")}
							isChecked={form.showUptimePercentage}
							onChange={handleFormChange}
						/>
						<Checkbox
							id="showAdminLoginLink"
							name="showAdminLoginLink"
							label={t("showAdminLoginLink")}
							isChecked={form.showAdminLoginLink}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigStack>
			</Stack>
		</TabPanel>
	);
};

export default Content;
