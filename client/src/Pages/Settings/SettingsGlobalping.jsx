import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import { PasswordEndAdornment } from "@/Components/v1/Inputs/TextInput/Adornments/index.jsx";
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";

const SettingsGlobalping = ({
	isAdmin,
	HEADING_SX,
	isGlobalpingKeySet,
	globalpingKeyHasBeenReset,
	setGlobalpingKeyHasBeenReset,
	defaults,
	control,
	setValue,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!isAdmin) {
		return null;
	}

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("pages.settings.globalpingSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t("pages.settings.globalpingSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				{(isGlobalpingKeySet === false || globalpingKeyHasBeenReset === true) && (
					<Controller
						name="globalpingApiKey"
						control={control}
						defaultValue={defaults.globalpingApiKey}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.globalpingSettings.labelApiKey")}
								type={"password"}
								optionalLabel={t("pages.settings.globalpingSettings.optionalLabel")}
								endAdornment={<PasswordEndAdornment />}
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				)}

				{isGlobalpingKeySet === true && globalpingKeyHasBeenReset === false && (
					<Box>
						<Typography>
							{t("pages.settings.globalpingSettings.labelApiKeySet")}
						</Typography>
						<Button
							onClick={() => {
								setValue("globalpingApiKey", "");
								setGlobalpingKeyHasBeenReset(true);
							}}
							variant="contained"
							color="error"
							sx={{ mt: theme.spacing(4) }}
						>
							{t("reset")}
						</Button>
					</Box>
				)}

				<Box>
					<Typography
						variant="h2"
						sx={{ mb: theme.spacing(2) }}
					>
						{t("pages.settings.globalpingSettings.locationsTierTitle")}
					</Typography>
					<Typography sx={{ mb: theme.spacing(8), color: theme.palette.text.secondary }}>
						{t("pages.settings.globalpingSettings.locationsTierDescription")}
					</Typography>
					<Controller
						name="globalpingLocationsTier"
						control={control}
						defaultValue={defaults.globalpingLocationsTier}
						render={({ field }) => (
							<RadioGroup
								value={String(field.value ?? 6)}
								onChange={(e) => field.onChange(Number(e.target.value))}
							>
								<FormControlLabel
									value="3"
									control={<Radio />}
									label={
										<Box>
											<Typography fontWeight={500}>
												{t("pages.settings.globalpingSettings.tier3Label")}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{t("pages.settings.globalpingSettings.tier3Description")}
											</Typography>
										</Box>
									}
									sx={{ mb: theme.spacing(4), alignItems: "flex-start" }}
								/>
								<FormControlLabel
									value="6"
									control={<Radio />}
									label={
										<Box>
											<Typography fontWeight={500}>
												{t("pages.settings.globalpingSettings.tier6Label")}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{t("pages.settings.globalpingSettings.tier6Description")}
											</Typography>
										</Box>
									}
									sx={{ mb: theme.spacing(4), alignItems: "flex-start" }}
								/>
								<FormControlLabel
									value="15"
									control={<Radio />}
									label={
										<Box>
											<Typography fontWeight={500}>
												{t("pages.settings.globalpingSettings.tier15Label")}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{t("pages.settings.globalpingSettings.tier15Description")}
											</Typography>
										</Box>
									}
									sx={{ alignItems: "flex-start" }}
								/>
							</RadioGroup>
						)}
					/>
				</Box>

				<Box
					sx={{
						p: theme.spacing(8),
						borderRadius: theme.spacing(2),
						border: `1px solid ${theme.palette.primary.lowContrast}`,
						backgroundColor: theme.palette.tertiary?.main || theme.palette.background.default,
					}}
				>
					<Typography
						variant="h2"
						sx={{ mb: theme.spacing(4) }}
					>
						{t("pages.settings.globalpingSettings.rateLimitsTitle")}
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(4) }}>
						{t("pages.settings.globalpingSettings.rateLimitsDescription")}
					</Typography>
					<Box component="ul" sx={{ m: 0, pl: theme.spacing(8) }}>
						<Typography component="li" variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2) }}>
							{t("pages.settings.globalpingSettings.rateLimitNoAuth")}
						</Typography>
						<Typography component="li" variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2) }}>
							{t("pages.settings.globalpingSettings.rateLimitAuth")}
						</Typography>
						<Typography component="li" variant="body2" color="text.secondary">
							{t("pages.settings.globalpingSettings.rateLimitSponsor")}
						</Typography>
					</Box>
					<Typography variant="body2" color="text.secondary" sx={{ mt: theme.spacing(4) }}>
						{t("pages.settings.globalpingSettings.rateLimitsNote")}
					</Typography>
				</Box>
			</Stack>
		</ConfigBox>
	);
};

SettingsGlobalping.propTypes = {
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	isGlobalpingKeySet: PropTypes.bool,
	globalpingKeyHasBeenReset: PropTypes.bool,
	setGlobalpingKeyHasBeenReset: PropTypes.func,
	defaults: PropTypes.object,
	control: PropTypes.object,
	setValue: PropTypes.func,
};

export default SettingsGlobalping;
