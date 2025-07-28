import { useState, useEffect } from "react";
import { ROLES } from "../Utils/roleUtils";
import { editUserValidation } from "../Validation/validation";
import Joi from "joi";
import { createToast } from "../Utils/toastUtils";
import { useTranslation } from "react-i18next";
export const useEditUserForm = (user) => {
	const [searchInput, setSearchInput] = useState("");
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		role: [],
	});

	// Effect to set user
	useEffect(() => {
		if (user) {
			setForm({
				firstName: user?.firstName,
				lastName: user?.lastName,
				email: user?.email,
				role: user?.role,
			});
		}
	}, [user]);

	const handleRoleChange = (value) => {
		const hasSuperAdmin = form.role.includes(ROLES.SUPERADMIN);
		const newRoles = value.map((item) => item.role);
		if (hasSuperAdmin && !newRoles.includes(ROLES.SUPERADMIN)) {
			newRoles.push(ROLES.SUPERADMIN);
		}

		setForm({
			...form,
			role: newRoles,
		});
	};

	const handleDeleteRole = (role) => {
		if (role === ROLES.SUPERADMIN) return;
		setForm({ ...form, role: form?.role?.filter((r) => r !== role) });
	};

	const handleSearchInput = (value) => {
		setSearchInput(value);
	};

	return [
		form,
		setForm,
		handleRoleChange,
		handleDeleteRole,
		searchInput,
		handleSearchInput,
	];
};

export const useValidateEditUserForm = () => {
	const [errors, setErrors] = useState({});
	const { t } = useTranslation();
	const validateForm = (form) => {
		const { error } = editUserValidation.validate(form, {
			abortEarly: false,
		});
		const errs = error?.details;
		const errsObj = errs?.reduce((acc, curr) => {
			acc[curr.path[0]] = curr.message;
			return acc;
		}, {});
		setErrors(errsObj);

		if (errs?.length > 0) {
			createToast({
				variant: "warning",
				hasIcon: true,
				title: t("editUserPage.toast.validationErrors"),
				body: errs.map((err) => t(err.message)),
			});
			return false;
		}
		return true;
	};

	const validateField = (name, value) => {
		const fieldSchema = Joi.object({
			[name]: editUserValidation.extract(name),
		});

		const { error } = fieldSchema.validate({ [name]: value });

		setErrors((prev) => {
			const prevErrors = { ...prev };
			if (error) prevErrors[name] = error.details[0].message;
			else delete prevErrors[name];
			return prevErrors;
		});
	};

	return [errors, validateForm, validateField];
};
