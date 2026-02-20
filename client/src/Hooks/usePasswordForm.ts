import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema, type PasswordFormData } from "@/Validation/password";

export const usePasswordForm = () => {
	return {
		resolver: zodResolver(passwordSchema),
		defaults: {
			currentPassword: "",
			newPassword: "",
			confirm: "",
		} as PasswordFormData,
	};
};
