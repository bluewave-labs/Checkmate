import { useMemo } from "react";
import { loginSchema, type LoginFormData } from "@/Validation/login";

export const useLoginForm = () => {
	return useMemo(() => {
		const defaults: LoginFormData = {
			email: "",
			password: "",
		};

		return { schema: loginSchema, defaults };
	}, []);
};
