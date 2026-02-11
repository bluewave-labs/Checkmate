import { recoverySchema } from "@/Validation/recovery";

export const useRecoveryForm = () => {
	const defaults = {
		email: "",
	};

	return {
		schema: recoverySchema,
		defaults,
	};
};
