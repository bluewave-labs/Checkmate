/**
 * Update errors if passed id matches the error.details[0].path, otherwise remove
 * the error for the id
 * @param {*} prev Previous errors *
 * @param {*} id ID of the field whose error is to be either updated or removed
 * @param {*} error the error object
 * @returns the Update Errors with the specific field with id being either removed or updated
 */

const buildErrors = (prev, id, error) => {
	const updatedErrors = { ...prev };
	if (error && id == error.details[0].path) {
		updatedErrors[id] = error.details[0].message ?? "Validation error";
	} else {
		delete updatedErrors[id];
	}
	return updatedErrors;
};

/**
 * Processes Joi validation errors and returns a filtered object of error messages for fields that have been touched.
 *
 * @param {Object} validation - The Joi validation result object.
 * @param {Object} validation.error - The error property of the validation result containing details of validation failures.
 * @param {Object[]} validation.error.details - An array of error details from the Joi validation. Each item contains information about the path and the message.
 * @param {Object} touchedErrors - An object representing which fields have been interacted with. Keys are field IDs (field names), and values are booleans indicating whether the field has been touched.
 * @returns {Object} - An object where keys are the field IDs (if they exist in `touchedErrors` and are in the error details) and values are their corresponding error messages.
 */
const getTouchedFieldErrors = (validation, touchedErrors) => {
	let newErrors = {};

	if (validation?.error) {
		newErrors = validation.error.details.reduce((errors, detail) => {
			const fieldId = detail.path[0];
			if (touchedErrors[fieldId] && !(fieldId in errors)) {
				errors[fieldId] = detail.message;
			}
			return errors;
		}, {});
	}

	return newErrors;
};
/**
 *
 * @param {*} form The form object of the submitted form data
 * @param {*} validation The Joi validation rules
 * @param {*} setErrors The function used to set the local errors
 * @returns true if there is no error or false if there is error after validating the form
 * the error will be reset to {} if returns false; otherwise the errors object will be set with
 * the new value
 */
const hasValidationErrors = (form, validation, setErrors) => {
	const { error } = validation.validate(form, {
		abortEarly: false,
	});
	if (error) {
		const newErrors = {};
		error.details.forEach((err) => {
			if (
				![
					"clientHost",
					"refreshTokenSecret",
					"dbConnectionString",
					"refreshTokenTTL",
					"jwtTTL",
					"notify-email-list",
					"_id",
					"__v",
					"createdAt",
					"updatedAt",
				].includes(err.path[0])
			) {
				newErrors[err.path[0]] = err.message ?? "Validation error";
			}
			// Handle conditionally usage number required cases
			if (!form.cpu || form.usage_cpu) {
				newErrors["usage_cpu"] = null;
			}
			if (!form.memory || form.usage_memory) {
				newErrors["usage_memory"] = null;
			}
			if (!form.disk || form.usage_disk) {
				newErrors["usage_disk"] = null;
			}
			if (!form.temperature || form.usage_temperature) {
				newErrors["usage_temperature"] = null;
			}
		});
		if (Object.values(newErrors).some((v) => v)) {
			setErrors(newErrors);
			return true;
		} else {
			setErrors({});
			return false;
		}
	}
	setErrors({});
	return false;
};
export { buildErrors, hasValidationErrors, getTouchedFieldErrors };
