import {
	setNewPasswordSchema,
	type SetNewPasswordFormData,
} from "@/Validation/setNewPassword";

export const useSetNewPasswordForm = () => {
	const defaults: SetNewPasswordFormData = {
		password: "",
		confirm: "",
	};

	return {
		schema: setNewPasswordSchema,
		defaults,
	};
};
