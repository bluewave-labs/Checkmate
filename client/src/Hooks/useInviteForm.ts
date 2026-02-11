import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSchema, type InviteFormData } from "@/Validation/invite";

export const useInviteForm = () => {
	const defaults: InviteFormData = {
		email: "",
		role: ["user"],
	};

	return {
		resolver: zodResolver(inviteSchema),
		defaults,
	};
};
