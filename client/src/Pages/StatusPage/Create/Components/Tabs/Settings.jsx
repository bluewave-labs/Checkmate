// Components
import { Stack, Typography } from "@mui/material";
import { TabPanel } from "@mui/lab";
import ConfigBox from "../../../../../Components/ConfigBox";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
import TextInput from "../../../../../Components/Inputs/TextInput";
import Search from "../../../../../Components/Inputs/Search";
import ImageUpload from "../../../../../Components/Inputs/ImageUpload";
import ColorPicker from "../../../../../Components/Inputs/ColorPicker";
import Progress from "../Progress";

// Utils
import { useTheme } from "@emotion/react";
import timezones from "../../../../../Utils/timezones.json";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useCallback } from "react";

const TabSettings = ({
	isCreate,
	tabValue,
	form,
	handleFormChange,
	handleImageChange,
	progress,
	removeLogo,
	errors,
}) => {
	// Utils
	const theme = useTheme();
	const { t } = useTranslation();
	const [rawInput, setRawInput] = useState("");

	const selectedTimezone = useMemo(
		() => timezones.find((tz) => tz._id === form.timezone) ?? null,
		[form.timezone]
	);

	const handleTimezoneChange = useCallback(
		(newValue) => {
			setRawInput("");
			handleFormChange({
				target: {
					name: "timezone",
					value: newValue?._id ?? "",
				},
			});
		},
		[handleFormChange]
	);

	return (
		<TabPanel value={tabValue}>
			<Stack gap={theme.spacing(10)}>
				<ConfigBox>
					<Stack>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("access")}
						</Typography>
						<Typography component="p">{t("statusPageCreateSettings")}</Typography>
					</Stack>
					<Stack gap={theme.spacing(18)}>
						<Checkbox
							id="publish"
							name="isPublished"
							label={t("statusPageCreateSettingsCheckboxLabel")}
							isChecked={form.isPublished}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("basicInformation")}
						</Typography>
						<Typography component="p">
							{t("statusPageCreateBasicInfoDescription")}
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(18)}>
						<TextInput
							id="companyName"
							name="companyName"
							type="text"
							label={t("companyName")}
							value={form.companyName}
							onChange={handleFormChange}
							helperText={errors["companyName"]}
							error={errors["companyName"] ? true : false}
						/>
						<TextInput
							id="url"
							name="url"
							type="url"
							disabled={!isCreate}
							label={t("statusPageCreateBasicInfoStatusPageAddress")}
							value={form.url}
							onChange={handleFormChange}
							helperText={errors["url"]}
							error={errors["url"] ? true : false}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("timezone")}
						</Typography>
						<Typography component="p">
							{t("statusPageCreateSelectTimeZoneDescription")}
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(6)}>
						<Search
							id="timezone"
							label={t("settingsDisplayTimezone")}
							options={timezones}
							filteredBy="name"
							value={selectedTimezone}
							inputValue={rawInput}
							handleInputChange={(newVal) => setRawInput(newVal)}
							handleChange={handleTimezoneChange}
							isAdorned={true}
							unit="timezone"
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography
							component="h2"
							variant="h2"
						>
							{t("statusPageCreateAppearanceTitle")}
						</Typography>
						<Typography component="p">
							{t("statusPageCreateAppearanceDescription")}
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(6)}>
						<ImageUpload
							src={form?.logo?.src}
							onChange={handleImageChange}
							previewIsRound={false}
						/>
						<Progress
							isLoading={progress.isLoading}
							progressValue={progress.value}
							logo={form.logo}
							logoType={form.logo?.type}
							removeLogo={removeLogo}
						/>
						<ColorPicker
							id="color"
							name="color"
							value={form.color}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigBox>
			</Stack>
		</TabPanel>
	);
};

TabSettings.propTypes = {
	isCreate: PropTypes.bool,
	tabValue: PropTypes.string,
	form: PropTypes.object,
	handleFormChange: PropTypes.func,
	handleImageChange: PropTypes.func,
	progress: PropTypes.object,
	removeLogo: PropTypes.func,
	errors: PropTypes.object,
};

export default TabSettings;
