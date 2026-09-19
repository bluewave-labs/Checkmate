import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSchema, type InviteFormData } from "@/Validation/invite";
import { DEFAULT_INVITE_DURATION_HOURS } from "@/Utils/inviteDurationOptions";

export const useInviteForm = () => {
	const defaults: InviteFormData = {
		email: "",
		role: ["user"],
		expiresInHours: DEFAULT_INVITE_DURATION_HOURS,
	};

	return {
		resolver: zodResolver(inviteSchema),
		defaults,
	};
};
