import Check from "../../../Components/Check/Check";
import Stack from "@mui/material/Stack";
import { Tooltip, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const PasswordTooltip = ({ feedback, form, children, offset = [0, 0] }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const hasPassword = form.password.length > 0;
	const hasInvalidFeedback = Object.values(feedback).some(
		(status) => status !== "success"
	);
	const showPasswordTooltip = hasPassword && hasInvalidFeedback;
	return (
		<Tooltip
			placement="right"
			arrow
			open={showPasswordTooltip}
			title={
				<Stack
					gap={theme.spacing(4)}
					mb={{ xs: theme.spacing(6), sm: theme.spacing(8) }}
				>
					<Check
						noHighlightText={
							t("auth.common.inputs.password.rules.length.beginning") +
							" " +
							t("auth.common.inputs.password.rules.length.highlighted")
						}
						variant={feedback.length}
					/>
					<Check
						noHighlightText={
							t("auth.common.inputs.password.rules.special.beginning") +
							" " +
							t("auth.common.inputs.password.rules.special.highlighted")
						}
						variant={feedback.special}
					/>
					<Check
						noHighlightText={
							t("auth.common.inputs.password.rules.number.beginning") +
							" " +
							t("auth.common.inputs.password.rules.number.highlighted")
						}
						variant={feedback.number}
					/>
					<Check
						noHighlightText={
							t("auth.common.inputs.password.rules.uppercase.beginning") +
							" " +
							t("auth.common.inputs.password.rules.uppercase.highlighted")
						}
						variant={feedback.uppercase}
					/>
					<Check
						noHighlightText={
							t("auth.common.inputs.password.rules.lowercase.beginning") +
							" " +
							t("auth.common.inputs.password.rules.lowercase.highlighted")
						}
						variant={feedback.lowercase}
					/>
					<Check
						noHighlightText={
							t("auth.common.inputs.password.rules.match.beginning") +
							" " +
							t("auth.common.inputs.password.rules.match.highlighted")
						}
						variant={feedback.confirm}
					/>
				</Stack>
			}
			slotProps={{
				popper: {
					modifiers: [
						{
							name: "offset",
							options: {
								offset: offset,
							},
						},
					],
				},
				tooltip: {
					sx: {
						backgroundColor: theme.palette.tertiary.background,
						border: `0.5px solid ${theme.palette.primary.lowContrast}90`,
						borderRadius: theme.spacing(4),
						color: theme.palette.primary.contrastText,
						width: "auto",
						maxWidth: { xs: "25vw", md: "none" },
						whiteSpace: { xs: "normal", md: "nowrap" },
						paddingTop: theme.spacing(8),
						px: theme.spacing(8),
					},
				},
				arrow: {
					sx: {
						color: theme.palette.tertiary.background,
					},
				},
			}}
		>
			{children}
		</Tooltip>
	);
};

PasswordTooltip.propTypes = {
	feedback: PropTypes.shape({
		length: PropTypes.string.isRequired,
		special: PropTypes.string,
		number: PropTypes.string,
		uppercase: PropTypes.string,
		lowercase: PropTypes.string,
		confirm: PropTypes.string,
	}),
	form: PropTypes.shape({
		password: PropTypes.string.isRequired,
	}),
	children: PropTypes.node,
	offset: PropTypes.arrayOf(PropTypes.number),
};

export default PasswordTooltip;
