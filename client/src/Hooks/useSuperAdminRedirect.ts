import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGet } from "@/Hooks/UseApi";

type Options = {
	redirectTo: string;
	redirectWhen: boolean;
	skip?: boolean;
};

export const useSuperAdminRedirect = ({ redirectTo, redirectWhen, skip }: Options) => {
	const navigate = useNavigate();
	const { data: superAdminExists, isLoading } = useGet<boolean>(
		skip ? null : "/auth/users/superadmin"
	);

	useEffect(() => {
		if (!skip && superAdminExists === redirectWhen) {
			navigate(redirectTo, { replace: true });
		}
	}, [superAdminExists, redirectWhen, redirectTo, skip, navigate]);

	return { superAdminExists, isLoading };
};
