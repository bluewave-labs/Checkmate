import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

/**
 * ProtectedRoute is a wrapper component that ensures only authenticated users
 * can access the wrapped content. It checks authentication status (e.g., from Redux or Context).
 * If the user is authenticated, it renders the children; otherwise, it redirects to the login page.
 *
 * @param {Object} props - The props passed to the ProtectedRoute component.
 * @param {React.ReactNode} props.children - The children to render if the user is authenticated.
 * @returns {React.ReactElement} The children wrapped in a protected route or a redirect to the login page.
 */

const RoleProtectedRoute = ({ roles, children }) => {
	const authState = useSelector((state) => state.auth);
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

RoleProtectedRoute.propTypes = {
	children: PropTypes.element.isRequired,
	roles: PropTypes.array,
};

export default RoleProtectedRoute;
