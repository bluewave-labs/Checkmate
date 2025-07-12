import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import Search from "../../Components/Inputs/Search";
import timezones from "../../Utils/timezones.json";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";
const SettingsTimeZone = ({ HEADING_SX, handleChange, timezone }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [rawInput, setRawInput] = useState("");

	const selectedTimezone = useMemo(
		() => timezones.find((tz) => tz._id === timezone) ?? null,
		[timezone, timezones]
	);

	const handleTimezoneChange = useCallback(
		(newValue) => {
			setRawInput("");
			handleChange({
				target: {
					name: "timezone",
					value: newValue?._id ?? "",
				},
			});
		},
		[handleChange]
	);

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsPage.timezoneSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					<Typography component="span">
						{t("settingsPage.timezoneSettings.description")}
					</Typography>
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Search
					id="timezone"
					label={t("settingsDisplayTimezone")}
					options={timezones}
					filteredBy="name"
					value={selectedTimezone}
					inputValue={rawInput}
					handleInputChange={(val) => setRawInput(val)}
					handleChange={handleTimezoneChange}
					isAdorned={false}
					unit="timezone"
				/>
			</Stack>
		</ConfigBox>
	);
};

SettingsTimeZone.propTypes = {
	HEADING_SX: PropTypes.object,
	handleChange: PropTypes.func,
	timezone: PropTypes.string,
};

export default SettingsTimeZone;
