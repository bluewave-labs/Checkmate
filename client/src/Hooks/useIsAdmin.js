import { useSelector } from "react-redux";

const useIsAdmin = () => {
	const { user } = useSelector((state) => state.auth);
	const isAdmin =
		(user?.role?.includes("admin") ?? false) ||
		(user?.role?.includes("superadmin") ?? false);
	return isAdmin;
};

const useIsSuperAdmin = () => {
	const { user } = useSelector((state) => state.auth);
	const isSuperAdmin = user?.role?.includes("superadmin");
	return isSuperAdmin;
};

export { useIsAdmin, useIsSuperAdmin };
