// Components
import { Stack, Typography } from "@mui/material";
import { TabPanel } from "@mui/lab";
import ConfigBox from "../../../../../Components/ConfigBox";
import Checkbox from "../../../../../Components/Inputs/Checkbox";
import TextInput from "../../../../../Components/Inputs/TextInput";
import Select from "../../../../../Components/Inputs/Select";
import ImageField from "../../../../../Components/Inputs/Image";
import ColorPicker from "../../../../../Components/Inputs/ColorPicker";
import Progress from "../Progress";

// Utils
import { useTheme } from "@emotion/react";
import timezones from "../../../../../Utils/timezones.json";
import PropTypes from "prop-types";

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

	return (
		<TabPanel value={tabValue}>
			<Stack gap={theme.spacing(10)}>
				<ConfigBox>
					<Stack>
						<Typography component="h2">Access</Typography>
						<Typography component="p">
							If your status page is ready, you can mark it as published.
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(18)}>
						<Checkbox
							id="publish"
							name="isPublished"
							label={`Published and visible to the public`}
							isChecked={form.isPublished}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography component="h2">Basic Information</Typography>
						<Typography component="p">
							Define company name and the subdomain that your status page points to.
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(18)}>
						<TextInput
							id="companyName"
							name="companyName"
							type="text"
							label="Company name"
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
							label="Your status page address"
							value={form.url}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography component="h2">Timezone</Typography>
						<Typography component="p">
							Select the timezone that your status page will be displayed in.
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(6)}>
						<Select
							id="timezone"
							name="timezone"
							label="Display timezone"
							items={timezones}
							value={form.timezone}
							onChange={handleFormChange}
						/>
					</Stack>
				</ConfigBox>
				<ConfigBox>
					<Stack gap={theme.spacing(6)}>
						<Typography component="h2">Appearance</Typography>
						<Typography component="p">
							Define the default look and feel of your public status page.
						</Typography>
					</Stack>
					<Stack gap={theme.spacing(6)}>
						<ImageField
							id="logo"
							src={form?.logo?.src}
							isRound={false}
							onChange={handleImageChange}
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
