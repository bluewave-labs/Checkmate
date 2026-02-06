import { registerSchema, type RegisterFormData } from "@/Validation/register";

export const useRegisterForm = () => {
	const defaults: RegisterFormData = {
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirm: "",
	};

	return {
		schema: registerSchema,
		defaults,
	};
};
