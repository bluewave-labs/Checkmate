import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/Validation/profile";

export const useProfileForm = () => {
	return {
		resolver: zodResolver(profileSchema),
		defaults: {
			firstName: "",
			lastName: "",
			profileImage: null,
			deleteProfileImage: false,
		} as ProfileFormData,
	};
};
