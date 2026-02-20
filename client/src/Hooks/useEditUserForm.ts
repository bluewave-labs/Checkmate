import { zodResolver } from "@hookform/resolvers/zod";
import { editUserSchema, type EditUserFormData } from "@/Validation/editUser";

export const useEditUserForm = () => {
	return {
		resolver: zodResolver(editUserSchema),
		defaults: {
			firstName: "",
			lastName: "",
			role: [],
		} as EditUserFormData,
	};
};
