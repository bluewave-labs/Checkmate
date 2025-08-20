import { useState } from "react";
import { infrastructureMonitorValidation } from "../../../../Validation/validation";
import { createToast } from "../../../../Utils/toastUtils";
const useValidateInfrastructureForm = () => {
	const [errors, setErrors] = useState({});

	const validateField = (name, value) => {
		const { error } = infrastructureMonitorValidation.validate(
			{ [name]: value },
			{ abortEarly: false }
		);
		setErrors((prev) => ({
			...prev,
			...(error ? { [name]: error.details[0].message } : { [name]: undefined }),
		}));
	};

	const validateForm = (form) => {
		const { error } = infrastructureMonitorValidation.validate(form, {
			abortEarly: false,
		});

		if (error) {
			const newErrors = {};
			error.details.forEach((err) => {
				newErrors[err.path[0]] = err.message;
			});
			console.log(newErrors);
			setErrors(newErrors);
			createToast({ body: "Please check the form for errors." });
			return error;
		}
		return null;
	};
	return { errors, validateField, validateForm };
};
export default useValidateInfrastructureForm;
