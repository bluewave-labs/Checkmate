import { useMemo, useState } from "react";
import { credentials } from "../../../Validation/validation";

const getFeedbackStatus = (form, errors, field, criteria) => {
	const fieldErrors = errors[field];
	const isFieldEmpty = form[field].length === 0;
	const hasError = fieldErrors?.includes(criteria) || fieldErrors?.includes("empty");
	const isCorrect = !isFieldEmpty && !hasError;

	if (isCorrect) {
		return "success";
	} else if (hasError) {
		return "error";
	} else {
		return "info";
	}
};

function useValidatePassword() {
	const [errors, setErrors] = useState({});
	const [form, setForm] = useState({
		password: "",
		confirm: "",
	});

	const handleChange = (event) => {
		const { value, name } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));

		const validateValue = { [name]: value };
		const validateOptions = { abortEarly: false, context: { password: form.password } };
		if (name === "password" && form.confirm.length > 0) {
			validateValue.confirm = form.confirm;
			validateOptions.context = { password: value };
		} else if (name === "confirm") {
			validateValue.password = form.password;
		}

		const { error } = credentials.validate(validateValue, validateOptions);
		const errors = error?.details.map((error) => ({
			path: error.path[0],
			type: error.type,
		}));
		const errorsByPath =
			errors &&
			errors.reduce((acc, { path, type }) => {
				if (!acc[path]) {
					acc[path] = [];
				}
				acc[path].push(type);
				return acc;
			}, {});
		setErrors(() => (errorsByPath ? { ...errorsByPath } : {}));
	};

	const feedbacks = useMemo(
		() => ({
			length: getFeedbackStatus(form, errors, "password", "string.min"),
			special: getFeedbackStatus(form, errors, "password", "special"),
			number: getFeedbackStatus(form, errors, "password", "number"),
			uppercase: getFeedbackStatus(form, errors, "password", "uppercase"),
			lowercase: getFeedbackStatus(form, errors, "password", "lowercase"),
			confirm: getFeedbackStatus(form, errors, "confirm", "different"),
		}),
		[form, errors]
	);

	return { handleChange, feedbacks, form, errors };
}
export { useValidatePassword };
