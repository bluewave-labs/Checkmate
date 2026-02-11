import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";

const useIsAdmin = (): boolean => {
	const { user } = useSelector((state: RootState) => state.auth);
	const isAdmin =
		(user?.role?.includes("admin") ?? false) ||
		(user?.role?.includes("superadmin") ?? false);
	return isAdmin;
};

const useIsSuperAdmin = (): boolean => {
	const { user } = useSelector((state: RootState) => state.auth);
	const isSuperAdmin = user?.role?.includes("superadmin") ?? false;
	return isSuperAdmin;
};

export { useIsAdmin, useIsSuperAdmin };
