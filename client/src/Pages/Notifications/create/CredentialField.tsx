import Box from "@mui/material/Box";
import { Button, FieldLabel } from "@/Components/inputs";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";

interface CredentialFieldProps {
	fieldLabel: string;
	placeholder: string;
	storedLabel: string;
	resetLabel: string;
	isEditable: boolean;
	onReset: () => void;
}

/**
 * Input for a stored credential. The API never returns the credential itself, so an existing one
 * cannot be prefilled: the field is replaced by a Reset button until the user chooses to change it,
 * the same flow the PageSpeed API key uses on the settings page.
 */
export const CredentialField = ({
	fieldLabel,
	placeholder,
	storedLabel,
	resetLabel,
	isEditable,
	onReset,
}: CredentialFieldProps) => {
	if (!isEditable) {
		return (
			<Box>
				<FieldLabel>{storedLabel}</FieldLabel>
				<Button
					onClick={onReset}
					variant="contained"
					color="error"
				>
					{resetLabel}
				</Button>
			</Box>
		);
	}

	return (
		<FormTextField
			name="accessToken"
			type="password"
			autoComplete="new-password"
			fieldLabel={fieldLabel}
			placeholder={placeholder}
		/>
	);
};
