import { registerSchema, type RegisterFormData } from "@/Validation/register";

export const useRegisterForm = () => {
	const defaults: RegisterFormData = {
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirm: "",
		role: ["superadmin"],
	};

	return {
		schema: registerSchema,
		defaults,
	};
};
