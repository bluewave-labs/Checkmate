import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import Search from "@/Components/v1/Inputs/Search/index.jsx";
import timezones from "@/Utils/timezones.json";

// Utils
import { useTheme } from "@emotion/react";
import { useSelector, useDispatch } from "react-redux";
import { setTimezone } from "@/Features/UI/uiSlice.js";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";
const SettingsTimeZone = ({ HEADING_SX }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [rawInput, setRawInput] = useState("");
	const dispatch = useDispatch();
	const { timezone } = useSelector((state) => state.ui);

	const selectedTimezone = useMemo(
		() => timezones.find((tz) => tz._id === timezone) ?? null,
		[timezone]
	);

	const handleTimezoneChange = (newValue) => {
		setRawInput("");
		const newId = newValue?._id ?? "";
		dispatch(setTimezone({ timezone: newId }));
	};

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
					isAdorned={true}
					unit="timezone"
				/>
			</Stack>
		</ConfigBox>
	);
};

SettingsTimeZone.propTypes = {
	HEADING_SX: PropTypes.object,
};

export default SettingsTimeZone;
