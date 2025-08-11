import { useState } from "react";
import { loginCredentials } from "../../../Validation/validation";

const useValidateLoginForm = () => {
	const [errors, setErrors] = useState({
		email: "",
		password: "",
	});
	const validateField = (name, value) => {
		const { error } = loginCredentials.validate({ [name]: value });
		setErrors((prev) => ({
			...prev,
			[name]: error?.details?.[0]?.message || "",
		}));
	};
	const validateForm = (form) => {
		const { error } = loginCredentials.validate(form, { abortEarly: false });
		if (error) {
			const formErrors = {};
			for (const err of error.details) {
				formErrors[err.path[0]] = err.message;
			}
			setErrors(formErrors);
			return false;
		}
		return true;
	};
	return [errors, setErrors, validateField, validateForm];
};

export default useValidateLoginForm;
