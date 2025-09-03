import { useState } from "react";
import { newOrChangedCredentials } from "../../../../../Validation/validation";
import { useTranslation } from "react-i18next";
const useAddTeamMember = () => {
	const { t } = useTranslation();
	const [errors, setErrors] = useState({});

	const clearErrors = () => setErrors({});

	const validateFields = (name, value, formData) => {
		const { error } = newOrChangedCredentials.validate(
			{ [name]: value },
			{ abortEarly: false, context: { password: formData.password } }
		);

		setErrors((prev) => ({
			...prev,
			[name]: error?.details?.[0]?.message || "",
		}));
	};

	const validateForm = (formData, role) => {
		const { error } = newOrChangedCredentials.validate(formData, {
			abortEarly: false,
			context: { password: formData.password },
		});
		const formErrors = {};
		if (error) {
			for (const err of error.details) {
				formErrors[err.path[0]] = err.message;
			}
		}
		if (!role[0] || role.length === 0) {
			formErrors.role = t(
				"teamPanel.registerTeamMember.auth.common.inputs.role.errors.empty"
			);
		}
		if (Object.keys(formErrors).length > 0) {
			setErrors(formErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	return { errors, setErrors, clearErrors, validateFields, validateForm };
};
export default useAddTeamMember;
