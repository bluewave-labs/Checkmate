import { useState } from "react";
import { newOrChangedCredentials } from "../../../Validation/validation";

const usePasswordFeedback = () => {
	const [feedback, setFeedback] = useState({});
	const getFeedbackStatus = (form, errors, field, criteria) => {
		const fieldErrors = errors?.[field];
		const isFieldEmpty = form?.[field]?.length === 0;
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

	const handlePasswordFeedback = (updatedForm, name, value, form, errors, setErrors) => {
		const validateValue = { [name]: value };
		const validateOptions = { abortEarly: false, context: { password: form.password } };
		if (name === "password" && form.confirm.length > 0) {
			validateValue.confirm = form.confirm;
			validateOptions.context = { password: value };
		} else if (name === "confirm") {
			validateValue.password = form.password;
		}
		const { error } = newOrChangedCredentials.validate(validateValue, validateOptions);

		const pwdErrors = error?.details.map((error) => ({
			path: error.path[0],
			type: error.type,
		}));

		const errorsByPath =
			pwdErrors &&
			pwdErrors.reduce((acc, { path, type }) => {
				if (!acc[path]) {
					acc[path] = [];
				}
				acc[path].push(type);
				return acc;
			}, {});

		const oldErrors = { ...errors };
		if (name === "password") {
			oldErrors.password = undefined;
		} else if (name === "confirm") {
			oldErrors.confirm = undefined;
		}
		const newErrors = { ...oldErrors, ...errorsByPath };

		setErrors(newErrors);

		const newFeedback = {
			length: getFeedbackStatus(updatedForm, errorsByPath, "password", "string.min"),
			special: getFeedbackStatus(updatedForm, errorsByPath, "password", "special"),
			number: getFeedbackStatus(updatedForm, errorsByPath, "password", "number"),
			uppercase: getFeedbackStatus(updatedForm, errorsByPath, "password", "uppercase"),
			lowercase: getFeedbackStatus(updatedForm, errorsByPath, "password", "lowercase"),
			confirm: getFeedbackStatus(updatedForm, errorsByPath, "confirm", "different"),
		};

		setFeedback(newFeedback);
	};
	return { feedback, handlePasswordFeedback, getFeedbackStatus };
};

export default usePasswordFeedback;
