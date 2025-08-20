import ConfigBox from "../../../../Components/ConfigBox";
import { Box, Stack, Typography } from "@mui/material";
import { CustomThreshold } from "../Components/CustomThreshold";
import { capitalizeFirstLetter } from "../../../../Utils/stringUtils";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
const CustomAlertsSection = ({
	errors,
	onChange,
	infrastructureMonitor,
	handleCheckboxChange,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const METRICS = ["cpu", "memory", "disk", "temperature"];
	const METRIC_PREFIX = "usage_";
	const hasAlertError = (errors) => {
		return Object.keys(errors).filter((k) => k.startsWith(METRIC_PREFIX)).length > 0;
	};
	const getAlertError = (errors) => {
		const errorKey = Object.keys(errors).find((key) => key.startsWith(METRIC_PREFIX));
		return errorKey ? errors[errorKey] : null;
	};
	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h2"
					variant="h2"
				>
					{t("infrastructureCustomizeAlerts")}
				</Typography>
				<Typography component="p">
					{t("infrastructureAlertNotificationDescription")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(6)}>
				{METRICS.map((metric) => {
					return (
						<CustomThreshold
							key={metric}
							infrastructureMonitor={infrastructureMonitor}
							errors={errors}
							checkboxId={metric}
							checkboxName={metric}
							checkboxLabel={
								metric !== "cpu" ? capitalizeFirstLetter(metric) : metric.toUpperCase()
							}
							onCheckboxChange={handleCheckboxChange}
							isChecked={infrastructureMonitor[metric]}
							fieldId={METRIC_PREFIX + metric}
							fieldName={METRIC_PREFIX + metric}
							fieldValue={String(infrastructureMonitor[METRIC_PREFIX + metric])}
							onFieldChange={onChange}
							alertUnit={metric == "temperature" ? "°C" : "%"}
						/>
					);
				})}

				{hasAlertError(errors) && (
					<Typography
						component="span"
						className="input-error"
						color={theme.palette.error.main}
						mt={theme.spacing(2)}
						sx={{
							opacity: 0.8,
						}}
					>
						{getAlertError(errors)}
					</Typography>
				)}
			</Stack>
		</ConfigBox>
	);
};

CustomAlertsSection.propTypes = {
	errors: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	infrastructureMonitor: PropTypes.object.isRequired,
	handleCheckboxChange: PropTypes.func.isRequired,
};

export default CustomAlertsSection;
