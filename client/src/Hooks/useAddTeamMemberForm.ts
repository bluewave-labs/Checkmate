import {
	addTeamMemberSchema,
	type AddTeamMemberFormData,
} from "@/Validation/addTeamMember";

export const useAddTeamMemberForm = () => {
	const defaults: AddTeamMemberFormData = {
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirm: "",
		role: ["user"],
	};

	return {
		schema: addTeamMemberSchema,
		defaults,
	};
};
