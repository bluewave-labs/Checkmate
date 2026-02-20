import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import type { UserRole } from "@/Types/User";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const authState = useSelector((state: RootState) => state.auth);

	return authState.authToken ? (
		children
	) : (
		<Navigate
			to="/login"
			replace
		/>
	);
};

interface RoleProtectedRouteProps {
	roles: UserRole[];
	children: React.ReactNode;
}

export const RoleProtectedRoute = ({ roles, children }: RoleProtectedRouteProps) => {
	const authState = useSelector((state: RootState) => state.auth);
	const userRoles = authState?.user?.role || [];
	const canAccess = userRoles.some((role) => roles.includes(role));

	return canAccess ? (
		children
	) : (
		<Navigate
			to="/uptime"
			replace
		/>
	);
};
